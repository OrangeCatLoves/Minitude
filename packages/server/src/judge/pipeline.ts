import { TIERS, type AnswerResponse } from '@minitude/core'
import type { AnswerRow, Repo } from '../db/repo'
import { levenshtein, normalize } from '../normalize'
import type { QuestionHead } from '../questions'
import { LlmError, type LlmClient } from '../llm/types'
import { buildJudgePrompt, DECISION_SCHEMA, JUDGE_SYSTEM, parseDecision, type Decision } from './prompt'
import type { Judge, JudgeMode, JudgeOutcome, Via } from './types'

export const MSG = {
  demoUnknown: "The demo checker doesn't know this answer. Try another.",
  ambiguous: 'That could mean more than one answer. Be more specific.',
  unavailable: 'The answer checker is not available right now. Try again.',
  busy: 'The answer checker is busy. Try again in a moment.',
  unsure: "We couldn't be sure about that one. Try another.",
  notCounted: "That doesn't count.",
  notAsTyped: "That isn't an answer as typed. Check the spelling.",
  empty: 'Type an answer.',
}

/** with more known answers than this, the model is shown only the closest ones (plus examples per tier) */
const MAX_KNOWN_SHOWN = 150
const NEAREST_SHOWN = 40

/** how long a suggestion waits in memory for the player's yes or no */
const SUGGESTION_TTL_MS = 10 * 60_000
const SUGGESTION_MAX = 500

const valid = (a: AnswerRow): AnswerResponse => ({
  status: 'valid',
  answer: a.name,
  ...(a.description ? { description: a.description } : {}),
  tier: a.tier,
  points: TIERS[a.tier].points,
})
const unresolved = (message: string): JudgeOutcome => ({ res: { status: 'unresolved', message }, via: 'none' })

/**
 * A correction: what the player typed is not the answer's own name (a misspelling, or another name for it), so the player is asked
 * "did you mean ...?" before it counts. `remember` says how to keep the spelling once the player agrees; null = do not keep it.
 */
interface Fix {
  canon: AnswerRow
  remember: { source: 'typo' | 'llm'; model?: string } | null
}
interface Decided {
  out: JudgeOutcome
  fix?: Fix
}

/**
 * The answer checker.
 *
 *   1. Something already decided for this exact text (a known answer, an alias, a learned spelling, a stored "does not count")? Use it.
 *   2. Otherwise ask the language model (when there is one), once. Its decision is stored, so the same text, and every other
 *      spelling of the same answer, scores the same from then on.
 *   3. Without a language model ("mock" mode) only step 1 plus a one-typo match works; anything else is "unresolved".
 *
 * A misspelling is never accepted on the spot (mode 'ask'): the player is asked "did you mean ...?" first, and the spelling is only
 * remembered when they say yes. If they say no ('literal'), the text is judged as an answer of its own, so a real, rarer answer is
 * never turned into a more common one.
 *
 * The model is never trusted blindly: its JSON is checked, a low-confidence answer is not counted or stored, and the text a
 * player typed only ever reaches it as a quoted string.
 */
export class PipelineJudge implements Judge {
  private inflight = new Map<string, Promise<Decided>>()
  /** corrections the model (or the typo match) suggested that the player has not answered yet. Memory only: nothing is stored until the player agrees. */
  private suggested = new Map<string, { fix: Fix; via: Via; at: number }>()
  constructor(private repo: Repo, private llm: LlmClient | null, private now: () => number = Date.now) {}

  get kind(): 'mock' | 'llm' { return this.llm ? 'llm' : 'mock' }

  async judge(q: QuestionHead, text: string, mode: JudgeMode = 'ask'): Promise<JudgeOutcome> {
    const norm = normalize(text)
    if (!norm) return unresolved(MSG.empty)
    const d = await this.decide(q, text, norm, mode)
    const key = q.id + '|' + norm
    if (d.fix && d.out.res.status === 'valid') {
      if (mode === 'ask') {
        this.suggest(key, d.fix, d.out.via)
        return { res: { status: 'confirm', answer: d.fix.canon.name, message: `Did you mean ${d.fix.canon.name}?` }, via: d.out.via }
      }
      // The player said no to the correction. If the text can only be read as that answer, the text itself is not an answer:
      // applying the correction anyway would be exactly what they refused.
      if (mode === 'literal') return { res: { status: 'invalid', message: MSG.notAsTyped }, via: d.out.via }
      if (mode === 'confirmed' && d.fix.remember) {
        this.repo.insertSpelling({ questionId: q.id, norm, verdict: 'valid', canonNorm: d.fix.canon.norm, source: d.fix.remember.source, model: d.fix.remember.model ?? null, at: this.now() })
      }
    }
    if (mode === 'confirmed') this.suggested.delete(key)
    if (d.out.res.status === 'valid' && d.out.res.answer) this.repo.bumpGiven(q.id, normalize(d.out.res.answer))
    return d.out
  }

  private async decide(q: QuestionHead, text: string, norm: string, mode: JudgeMode): Promise<Decided> {
    const literal = mode === 'literal'
    const stored = this.repo.findStored(q.id, norm)
    if (stored?.kind === 'invalid') return { out: { res: { status: 'invalid', message: stored.message }, via: 'stored' } }
    if (stored?.kind === 'valid') {
      // a spelling a model or the typo match learned earlier is still a correction: it is asked about, and in literal mode (the
      // player said "no, that is not what I meant") it is ignored. An answer's own name and the question's aliases are not corrections.
      const learned = stored.via === 'typo' || stored.via === 'llm'
      if (!(learned && literal)) return { out: { res: valid(stored.answer), via: 'stored' }, ...(learned ? { fix: { canon: stored.answer, remember: null } } : {}) }
    }

    // a suggestion made a moment ago, for this player or another, that nobody has answered yet: no second model call
    if (!literal) {
      const s = this.waiting(q.id + '|' + norm)
      const canon = s ? this.repo.getAnswer(q.id, s.fix.canon.norm) : undefined
      if (s && canon) return { out: { res: valid(canon), via: s.via }, fix: { canon, remember: s.fix.remember } }
    }

    const near = this.repo.fuzzy(q.id, norm)

    if (!this.llm) {
      if (literal) return { out: unresolved(MSG.demoUnknown) }
      if (near?.kind === 'one') return { out: { res: valid(near.answer), via: 'typo' }, fix: { canon: near.answer, remember: { source: 'typo' } } }
      if (near?.kind === 'ambiguous') {
        // More than one answer fits: lean toward the rarer one, so a real rarer answer is never scored down by mistake. The player is
        // asked "did you mean ...?", so a wrong guess costs one keypress. Equally rare candidates are still not guessed between.
        const top = Math.max(...near.answers.map((a) => a.tier))
        const rarest = near.answers.filter((a) => a.tier === top)
        if (rarest.length === 1) return { out: { res: valid(rarest[0]), via: 'typo' }, fix: { canon: rarest[0], remember: { source: 'typo' } } }
        return { out: unresolved(MSG.ambiguous) }
      }
      return { out: unresolved(MSG.demoUnknown) }
    }

    // Two players (or one player, twice) typing the same new thing at once cost one model call and get one decision.
    const key = q.id + '|' + norm + (literal ? '|literal' : '')
    let p = this.inflight.get(key)
    if (!p) {
      const closest = near ? (near.kind === 'one' ? [near.answer.name] : near.answers.map((a) => a.name)) : []
      p = this.ask(q, text, norm, closest, literal).finally(() => this.inflight.delete(key))
      this.inflight.set(key, p)
    }
    return p
  }

  private async ask(q: QuestionHead, text: string, norm: string, closest: string[], literal: boolean): Promise<Decided> {
    const llm = this.llm!
    const rows = this.repo.answersOf(q.id)
    let d: Decision | null
    let usedModel = llm.model // the model that really answered: a fallback model may have, and what is stored should say so
    try {
      const raw = await llm.generateJson({
        purpose: 'judge',
        system: JUDGE_SYSTEM,
        prompt: buildJudgePrompt({ prompt: q.prompt, rules: q.rules, ...this.shown(rows, norm), closest, text, literal }),
        schema: DECISION_SCHEMA,
        temperature: 0,
        maxOutputTokens: 1024,
        timeoutMs: 8000, // normal replies take about 1 s; a stalled call should fail fast so the player can retry. The fallback model is slower (2 to 6 s), so it needs the room.
        retries: 1,
        hedgeAfterMs: 2200, // normal is about 1.1 s; past 2.2 s this call is in the slow tail, so send it again and take the first reply
        failoverAfterMs: 3000, // if the main model has failed or is silent by then, the fallback model (when there is one) gets the rest of the 8 s
        onModel: (m) => { usedModel = m },
      })
      d = parseDecision(raw)
      if (!d) throw new LlmError('model reply had the wrong shape', 'bad_reply')
    } catch (e) {
      return { out: unresolved(e instanceof LlmError && e.kind === 'budget' ? MSG.busy : MSG.unavailable) }
    }

    if (d.confidence === 'low') return { out: unresolved(MSG.unsure) }

    if (!d.valid) {
      // A stored "does not count" is forever, so only a sure answer is stored.
      if (d.confidence === 'high') this.repo.insertSpelling({ questionId: q.id, norm, verdict: 'invalid', message: d.reason || MSG.notCounted, source: 'llm', model: usedModel, at: this.now() })
      return { out: { res: { status: 'invalid', message: d.reason || MSG.notCounted }, via: 'llm' } }
    }

    const done = this.repo.tx(() => this.store(q, norm, d!, usedModel, literal))
    return { out: { res: valid(done.row), via: 'llm' }, ...(done.fix ? { fix: done.fix } : {}) }
  }

  /**
   * Writes a valid decision. Everything that means the same answer ends up on one canonical row with one tier.
   * A new answer's row is written now. The spelling the player typed is NOT: it comes back as `fix` and is only remembered if the player agrees.
   */
  private store(q: QuestionHead, norm: string, d: Decision, model: string, literal: boolean): { row: AnswerRow; fix?: Fix } {
    const at = this.now()
    const existing = (d.sameAs ? this.resolve(q.id, d.sameAs, literal) : null) ?? (d.answer ? this.resolve(q.id, d.answer, literal) : null)
    if (existing) {
      if (norm === existing.norm) return { row: existing }
      // A spelling is only worth remembering when it looks like the answer it was matched to. A far-fetched match is used once, not kept.
      return { row: existing, fix: { canon: existing, remember: close(norm, existing.norm) ? { source: 'llm', model } : null } }
    }
    const name = d.answer || d.sameAs
    const cn = normalize(name)
    const row = this.repo.insertAnswer({
      questionId: q.id, norm: cn, name, tier: d.tier, description: d.description || null, source: 'live', model, at,
      // a person should look at answers the model was not fully sure about, and at "same as" claims that matched nothing
      review: d.confidence === 'medium' || !!d.sameAs,
      note: d.reason || null,
    }).row
    return norm === cn ? { row } : { row, fix: { canon: row, remember: { source: 'llm', model } } }
  }

  /** a stored answer for this name: canonical or learned spelling. After a "no" the learned corrections are left out: they are what the player refused. */
  private resolve(questionId: string, name: string, literal = false): AnswerRow | null {
    const n = normalize(name)
    if (!n) return null
    const direct = this.repo.getAnswer(questionId, n)
    if (direct) return direct
    return this.repo.findStoredSpellingTarget(questionId, n, literal)
  }

  private suggest(key: string, fix: Fix, via: Via): void {
    this.suggested.delete(key)
    this.suggested.set(key, { fix, via, at: this.now() })
    while (this.suggested.size > SUGGESTION_MAX) this.suggested.delete(this.suggested.keys().next().value as string)
  }
  private waiting(key: string): { fix: Fix; via: Via } | null {
    const s = this.suggested.get(key)
    if (!s) return null
    if (this.now() - s.at > SUGGESTION_TTL_MS) { this.suggested.delete(key); return null }
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
