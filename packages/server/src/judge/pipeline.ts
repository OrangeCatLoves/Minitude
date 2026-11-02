import { TIERS, type AnswerResponse } from '@minitude/core'
import type { AnswerRow, Repo } from '../db/repo'
import { levenshtein, normalize } from '../normalize'
import type { QuestionHead } from '../questions'
import { LlmError, type LlmClient } from '../llm/types'
import { buildJudgePrompt, DECISION_SCHEMA, JUDGE_SYSTEM, parseDecision, type Decision } from './prompt'
import type { Judge, JudgeOutcome } from './types'

export const MSG = {
  demoUnknown: "The demo checker doesn't know this answer. Try another.",
  ambiguous: 'That could mean more than one answer. Be more specific.',
  unavailable: 'The answer checker is not available right now. Try again.',
  busy: 'The answer checker is busy. Try again in a moment.',
  unsure: "We couldn't be sure about that one. Try another.",
  notCounted: "That doesn't count.",
  empty: 'Type an answer.',
}

/** with more known answers than this, the model is shown only the closest ones (plus examples per tier) */
const MAX_KNOWN_SHOWN = 150
const NEAREST_SHOWN = 40

const valid = (a: AnswerRow): AnswerResponse => ({
  status: 'valid',
  answer: a.name,
  ...(a.description ? { description: a.description } : {}),
  tier: a.tier,
  points: TIERS[a.tier].points,
})
const unresolved = (message: string): JudgeOutcome => ({ res: { status: 'unresolved', message }, via: 'none' })

/**
 * The answer checker.
 *
 *   1. Something already decided for this exact text (a known answer, an alias, a learned spelling, a stored "does not count")? Use it.
 *   2. Otherwise ask the language model (when there is one), once. Its decision is stored, so the same text, and every other
 *      spelling of the same answer, scores the same from then on.
 *   3. Without a language model ("mock" mode) only step 1 plus a one-typo match works; anything else is "unresolved".
 *
 * The model is never trusted blindly: its JSON is checked, a low-confidence answer is not counted or stored, and the text a
 * player typed only ever reaches it as a quoted string.
 */
export class PipelineJudge implements Judge {
  private inflight = new Map<string, Promise<JudgeOutcome>>()
  constructor(private repo: Repo, private llm: LlmClient | null, private now: () => number = Date.now) {}

  get kind(): 'mock' | 'llm' { return this.llm ? 'llm' : 'mock' }

  async judge(q: QuestionHead, text: string): Promise<JudgeOutcome> {
    const norm = normalize(text)
    if (!norm) return unresolved(MSG.empty)
    const out = await this.decide(q, text, norm)
    if (out.res.status === 'valid' && out.res.answer) this.repo.bumpGiven(q.id, normalize(out.res.answer))
    return out
  }

  private async decide(q: QuestionHead, text: string, norm: string): Promise<JudgeOutcome> {
    const stored = this.repo.findStored(q.id, norm)
    if (stored) {
      return stored.kind === 'valid' ? { res: valid(stored.answer), via: 'stored' } : { res: { status: 'invalid', message: stored.message }, via: 'stored' }
    }
    const near = this.repo.fuzzy(q.id, norm)

    if (!this.llm) {
      if (near?.kind === 'one') {
        this.repo.insertSpelling({ questionId: q.id, norm, verdict: 'valid', canonNorm: near.answer.norm, source: 'typo', at: this.now() })
        return { res: valid(near.answer), via: 'typo' }
      }
      return unresolved(near?.kind === 'ambiguous' ? MSG.ambiguous : MSG.demoUnknown)
    }

    // Two players (or one player, twice) typing the same new thing at once cost one model call and get one decision.
    const key = q.id + '|' + norm
    let p = this.inflight.get(key)
    if (!p) {
      const closest = near ? (near.kind === 'one' ? [near.answer.name] : near.answers.map((a) => a.name)) : []
      p = this.ask(q, text, norm, closest).finally(() => this.inflight.delete(key))
      this.inflight.set(key, p)
    }
    return p
  }

  private async ask(q: QuestionHead, text: string, norm: string, closest: string[]): Promise<JudgeOutcome> {
    const llm = this.llm!
    const rows = this.repo.answersOf(q.id)
    let d: Decision | null
    try {
      const raw = await llm.generateJson({
        purpose: 'judge',
        system: JUDGE_SYSTEM,
        prompt: buildJudgePrompt({ prompt: q.prompt, rules: q.rules, ...this.shown(rows, norm), closest, text }),
        schema: DECISION_SCHEMA,
        temperature: 0,
        maxOutputTokens: 1024,
        timeoutMs: 15000,
        retries: 1,
      })
      d = parseDecision(raw)
      if (!d) throw new LlmError('model reply had the wrong shape', 'bad_reply')
    } catch (e) {
      return unresolved(e instanceof LlmError && e.kind === 'budget' ? MSG.busy : MSG.unavailable)
    }

    if (d.confidence === 'low') return unresolved(MSG.unsure)

    if (!d.valid) {
      // A stored "does not count" is forever, so only a sure answer is stored.
      if (d.confidence === 'high') this.repo.insertSpelling({ questionId: q.id, norm, verdict: 'invalid', message: d.reason || MSG.notCounted, source: 'llm', model: llm.model, at: this.now() })
      return { res: { status: 'invalid', message: d.reason || MSG.notCounted }, via: 'llm' }
    }

    const row = this.repo.tx(() => this.store(q, norm, d!, llm.model))
    return { res: valid(row), via: 'llm' }
  }

  /** Writes a valid decision. Everything that means the same answer ends up on one canonical row with one tier. */
  private store(q: QuestionHead, norm: string, d: Decision, model: string): AnswerRow {
    const at = this.now()
    const existing = (d.sameAs ? this.resolve(q.id, d.sameAs) : null) ?? (d.answer ? this.resolve(q.id, d.answer) : null)
    let canon: AnswerRow
    if (existing) {
      canon = existing
      // A spelling is only remembered when it looks like the answer it was matched to. A far-fetched match is used once, not kept.
      if (norm !== canon.norm && close(norm, canon.norm)) {
        this.repo.insertSpelling({ questionId: q.id, norm, verdict: 'valid', canonNorm: canon.norm, source: 'llm', model, at })
      }
    } else {
      const name = d.answer || d.sameAs
      const cn = normalize(name)
      canon = this.repo.insertAnswer({
        questionId: q.id, norm: cn, name, tier: d.tier, description: d.description || null, source: 'live', model, at,
        // a person should look at answers the model was not fully sure about, and at "same as" claims that matched nothing
        review: d.confidence === 'medium' || !!d.sameAs,
        note: d.reason || null,
      }).row
      if (norm !== cn) this.repo.insertSpelling({ questionId: q.id, norm, verdict: 'valid', canonNorm: cn, source: 'llm', model, at })
    }
    return canon
  }

  /** a stored answer for this name: canonical or learned spelling */
  private resolve(questionId: string, name: string): AnswerRow | null {
    const n = normalize(name)
    if (!n) return null
    const direct = this.repo.getAnswer(questionId, n)
    if (direct) return direct
    const s = this.repo.findStoredSpellingTarget(questionId, n)
    return s
  }

  private shown(rows: AnswerRow[], norm: string): { known: string[]; anchors: string[][] } {
    const byGiven = [...rows].sort((a, b) => b.timesGiven - a.timesGiven || a.name.localeCompare(b.name))
    const anchors = [0, 1, 2, 3, 4, 5].map((t) => byGiven.filter((r) => r.tier === t).slice(0, 3).map((r) => r.name))
    if (rows.length <= MAX_KNOWN_SHOWN) return { known: rows.map((r) => r.name), anchors }
    const nearest = [...rows].sort((a, b) => levenshtein(norm, a.norm) - levenshtein(norm, b.norm)).slice(0, NEAREST_SHOWN).map((r) => r.name)
    return { known: nearest, anchors }
  }
}

/** close enough in spelling to be remembered as a way of writing the answer */
export function close(a: string, b: string): boolean {
  const longest = Math.max(a.length, b.length)
  return levenshtein(a, b) <= Math.max(2, Math.ceil(longest * 0.34))
}
