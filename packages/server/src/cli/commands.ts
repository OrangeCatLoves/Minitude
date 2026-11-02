import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { RUN_LENGTH, TIERS, addDays, dayNumber, utcDay } from '@minitude/core'
import { exportBank, importBank } from '../bankio'
import { ensureDailySet, epochDay } from '../daily'
import type { AnswerRow, QStatus, QuestionRow, Repo } from '../db/repo'
import { generateQuestions, MIN_PER_TIER } from '../generate/generate'
import { CATEGORIES } from '../generate/categories'
import type { LlmClient } from '../llm/types'
import { normalize } from '../normalize'
import type { QuestionBank } from '../questions'
import { parseArgs } from './args'

export interface CliContext {
  repo: Repo
  /** null = no language model configured */
  llm: LlmClient | null
  llmNote: string
  dbFile: string
  now: () => number
  out: (line: string) => void
}

const HELP = `Minitude command line

  questions list [--status draft|approved|rejected]
  questions show <id>
  questions generate [--category "Food"] [--per-category 2] [--count 1]   (needs GEMINI_API_KEY; saves DRAFTS only)
  questions approve <id> [<id> ...] | --all-drafts     (a question is played only after this)
  questions reject <id> [--reason "..."]
  questions export [file.json] [--all]                 (approved questions, or everything with --all)
  questions import <file.json> [--approve]             (adds questions that are not there yet; drafts unless --approve)

  answers review                                       (answers a person should look at, most-played first)
  answers list <question-id> [--live]                  (--live = only answers the model added during play)
  answers set-tier <question-id> <answer> <0-5> [--reason "..."]
  answers ok <question-id> <answer>                    (clear the review flag)
  answers remove <question-id> <answer> [--message "..."]

  daily show [YYYY-MM-DD]                              (the seven questions of a day, default today (UTC), and how many played)
  daily plan [--days 7]                                (choose and save the sets for today and the next days, so you can look at them)
  daily set <YYYY-MM-DD> <id> x7                       (use these seven approved questions on that day; only until somebody has played it)
  daily clear <YYYY-MM-DD>                             (forget that day's set so it is chosen again; only until somebody has played it)

  db stats
  db backup [folder]                                   (a safe copy of the database file)

Tiers: 0 Common, 1 Uncommon, 2 Rare, 3 Exotic, 4 Legendary, 5 Mythic.
Run as:  npm run cli -- <command>`

const tierName = (t: number) => TIERS[t]?.name.toLowerCase().replace(/^./, (c) => c.toUpperCase()) ?? String(t)

function findAnswer(repo: Repo, qid: string, text: string): AnswerRow | null {
  const n = normalize(text)
  return repo.getAnswer(qid, n) ?? repo.findStoredSpellingTarget(qid, n)
}

function showQuestion(repo: Repo, q: QuestionRow, out: (s: string) => void): void {
  out(`${q.id}  [${q.status}]  ${q.category}  (${q.source}${q.model ? ', ' + q.model : ''})`)
  out(`Prompt: ${q.prompt}`)
  out(`Rules:  ${q.rules}`)
  if (q.notes) out(`Notes:\n  ${q.notes.split('\n').join('\n  ')}`)
  const answers = repo.answersOf(q.id)
  for (let t = 0; t <= 5; t++) {
    const at = answers.filter((a) => a.tier === t)
    out(`Tier ${t} ${tierName(t)} (${at.length}): ${at.map((a) => a.name + (a.review ? ' *' : '')).join(', ')}`)
  }
  const flagged = answers.filter((a) => a.review)
  if (flagged.length) {
    out('* = check these:')
    for (const a of flagged) out(`  ${a.name} (tier ${a.tier}): ${a.note ?? 'no note'}`)
  }
}

/** why a question should not be approved yet (empty = fine) */
function approvalProblems(repo: Repo, q: QuestionRow): string[] {
  const p: string[] = []
  if (q.status === 'rejected') p.push('it was rejected')
  if (/QUESTION has a problem|NOT been audited|REJECTED/.test(q.notes ?? '')) p.push('its notes report a problem (see: questions show ' + q.id + ')')
  const answers = repo.answersOf(q.id)
  for (let t = 0; t <= 5; t++) {
    const n = answers.filter((a) => a.tier === t).length
    if (n < MIN_PER_TIER) p.push(`tier ${t} has only ${n} answers`)
  }
  return p
}

/** Runs one command. Returns the exit code (0 = fine). All output goes through ctx.out so tests can read it. */
export async function runCli(argv: string[], ctx: CliContext): Promise<number> {
  const { repo, out } = ctx
  const a = parseArgs(argv)
  const [group, verb, ...args] = a.words
  const flag = (n: string) => (typeof a.flags[n] === 'string' ? (a.flags[n] as string) : undefined)
  const bad = (msg: string): number => { out('Error: ' + msg); return 1 }

  if (!group || group === 'help' || a.flags.help) { out(HELP); return 0 }

  if (group === 'questions') {
    switch (verb) {
      case 'list': {
        const status = flag('status') as QStatus | undefined
        if (status && !['draft', 'approved', 'rejected'].includes(status)) return bad('--status must be draft, approved or rejected')
        const rows = repo.listQuestions(status)
        for (const q of rows) {
          const n = repo.answersOf(q.id).length
          const review = repo.answersOf(q.id).filter((x) => x.review).length
          out(`${q.status.padEnd(8)} ${q.id.padEnd(28)} ${q.category.padEnd(22)} ${String(n).padStart(3)} answers${review ? `, ${review} to check` : ''}  ${q.prompt}`)
        }
        out(`${rows.length} question${rows.length === 1 ? '' : 's'}.`)
        return 0
      }
      case 'show': {
        const q = args[0] ? repo.getQuestion(args[0]) : undefined
        if (!q) return bad('no such question. See: questions list')
        showQuestion(repo, q, out)
        return 0
      }
      case 'generate': {
        if (!ctx.llm) return bad(`no language model: ${ctx.llmNote}. Set GEMINI_API_KEY (see README).`)
        const cats = a.repeated.category ?? []
        const perCategory = flag('per-category') ? Number(flag('per-category')) : undefined
        const count = flag('count') ? Number(flag('count')) : undefined
        if ([perCategory, count].some((n) => n !== undefined && !(Number.isInteger(n) && n > 0 && n <= 10))) return bad('--per-category and --count must be whole numbers from 1 to 10')
        out(`Using ${ctx.llmNote}. Drafts are saved but NOT played until you approve them.`)
        const rep = await generateQuestions(repo, ctx.llm, { categories: cats, perCategory, count, log: out, now: ctx.now })
        out(`\nDone: ${rep.drafted.length} draft(s), ${rep.rejected.length} rejected by the checks, ${rep.skipped.length} skipped.`)
        if (rep.stopped) out(rep.stopped)
        if (rep.drafted.length) out('Next: questions list --status draft, then questions show <id>, then questions approve <id>.')
        return rep.stopped ? 2 : 0
      }
      case 'approve': {
        const ids = a.flags['all-drafts'] ? repo.listQuestions('draft').map((q) => q.id) : args
        if (!ids.length) return bad('give question ids, or --all-drafts')
        let code = 0
        for (const id of ids) {
          const q = repo.getQuestion(id)
          if (!q) { out(`${id}: no such question`); code = 1; continue }
          if (q.status === 'approved') { out(`${id}: already approved`); continue }
          const problems = approvalProblems(repo, q)
          if (problems.length && (a.flags['all-drafts'] || !a.flags.force)) {
            out(`${id}: NOT approved: ${problems.join('; ')}.${a.flags['all-drafts'] ? '' : ' Check it, then use --force to approve anyway.'}`)
            code = 1
            continue
          }
          repo.setQuestionStatus(id, 'approved', ctx.now(), problems.length ? 'approved by a person despite: ' + problems.join('; ') : undefined)
          out(`${id}: approved`)
        }
        return code
      }
      case 'reject': {
        const q = args[0] ? repo.getQuestion(args[0]) : undefined
        if (!q) return bad('no such question')
        repo.setQuestionStatus(q.id, 'rejected', ctx.now(), flag('reason') ? 'Rejected by a person: ' + flag('reason') : undefined)
        out(`${q.id}: rejected`)
        return 0
      }
      case 'export': {
        const bank = exportBank(repo, a.flags.all ? ['approved', 'draft', 'rejected'] : ['approved'], 'Exported from the Minitude database.')
        const file = args[0]
        const text = JSON.stringify(bank, null, 1)
        if (file) { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, text); out(`Wrote ${bank.questions.length} questions to ${file}`) }
        else out(text)
        return 0
      }
      case 'import': {
        if (!args[0]) return bad('give a file')
        let bank: QuestionBank
        try { bank = JSON.parse(readFileSync(args[0], 'utf8')) as QuestionBank } catch (e) { return bad(`cannot read ${args[0]}: ${(e as Error).message}`) }
        if (!Array.isArray(bank.questions)) return bad('that file has no "questions" list')
        const n = importBank(repo, bank, { status: a.flags.approve ? 'approved' : 'draft', source: 'import', answerSource: a.flags.approve ? 'seed' : 'draft', at: ctx.now() })
        out(`Added ${n} question(s) (${bank.questions.length - n} were already there).${a.flags.approve ? '' : ' They are drafts: approve them to play them.'}`)
        return 0
      }
    }
    return bad('unknown questions command. Try: help')
  }

  if (group === 'answers') {
    switch (verb) {
      case 'review': {
        const rows = repo.answersToReview()
        for (const r of rows) out(`${r.questionId.padEnd(26)} ${r.name.padEnd(30)} tier ${r.tier} ${tierName(r.tier).padEnd(10)} played ${String(r.timesGiven).padStart(3)}x  ${r.source}  ${r.note ?? ''}`)
        out(`${rows.length} answer${rows.length === 1 ? '' : 's'} to check. Fix with: answers set-tier / answers ok / answers remove`)
        return 0
      }
      case 'list': {
        if (!args[0] || !repo.getQuestion(args[0])) return bad('give a question id')
        const rows = repo.answersOf(args[0]).filter((r) => !a.flags.live || r.source === 'live')
        for (const r of rows) out(`tier ${r.tier}  ${r.name.padEnd(34)} played ${String(r.timesGiven).padStart(3)}x  ${r.source}${r.review ? '  CHECK' : ''}`)
        out(`${rows.length} answers.`)
        return 0
      }
      case 'set-tier': {
        const [qid, text, tierText] = args
        const tier = Number(tierText)
        if (!qid || !text || !Number.isInteger(tier) || tier < 0 || tier > 5) return bad('usage: answers set-tier <question-id> <answer> <0-5>')
        const row = findAnswer(repo, qid, text)
        if (!row) return bad('no such answer for that question. See: answers list ' + qid)
        repo.setTier(qid, row.norm, tier, flag('reason') ?? null, ctx.now())
        out(`${row.name}: tier ${row.tier} -> ${tier}. Runs already played keep the points they earned.`)
        return 0
      }
      case 'ok': {
        const [qid, text] = args
        const row = qid && text ? findAnswer(repo, qid, text) : null
        if (!row) return bad('usage: answers ok <question-id> <answer>')
        repo.clearReview(qid, row.norm)
        out(`${row.name}: marked as checked`)
        return 0
      }
      case 'remove': {
        const [qid, text] = args
        const row = qid && text ? findAnswer(repo, qid, text) : null
        if (!row) return bad('usage: answers remove <question-id> <answer>')
        repo.invalidateAnswer(qid, row.norm, flag('message') ?? "That doesn't count.", null, ctx.now())
        out(`${row.name}: removed. Typing it now gets "${flag('message') ?? "That doesn't count."}"`)
        return 0
      }
    }
    return bad('unknown answers command. Try: help')
  }

  if (group === 'daily') {
    const today = utcDay(ctx.now())
    const DAY_RE = /^\d{4}-\d{2}-\d{2}$/
    const validDay = (d: string | undefined): d is string => !!d && DAY_RE.test(d) && Number.isFinite(Date.parse(d)) && utcDay(Date.parse(d)) === d
    const show = (day: string) => {
      const set = repo.dailySet(day)
      if (!set) { out(`${day}: no set yet. It is chosen when the first player of that day arrives, or by: daily plan`); return }
      const st = repo.dailyStandings(day, 0)
      out(`${day}  daily #${dayNumber(epochDay(repo, today), day)}${day === today ? '  (today)' : ''}  ${repo.dailyPlayCount(day)} started, ${st.players} finished${st.players ? `, best ${st.best}` : ''}`)
      set.forEach((q, i) => out(`  ${i + 1}. ${q.id.padEnd(28)} ${q.category.padEnd(20)} ${q.prompt}`))
    }
    switch (verb) {
      case 'show': {
        const day = args[0] ?? today
        if (!validDay(day)) return bad('give a day like 2026-11-01')
        show(day)
        return 0
      }
      case 'plan': {
        const days = flag('days') ? Number(flag('days')) : 7
        if (!Number.isInteger(days) || days < 1 || days > 60) return bad('--days must be a whole number from 1 to 60')
        for (let i = 0; i < days; i++) {
          const day = addDays(today, i)
          if (!ensureDailySet(repo, day, ctx.now())) return bad(`fewer than ${RUN_LENGTH} approved questions: cannot choose a set. See: questions list`)
          show(day)
        }
        return 0
      }
      case 'set': {
        const [day, ...ids] = args
        if (!validDay(day) || day < today) return bad('usage: daily set <YYYY-MM-DD, today or later> <seven question ids>')
        if (ids.length !== RUN_LENGTH || new Set(ids).size !== RUN_LENGTH) return bad(`give exactly ${RUN_LENGTH} different question ids`)
        const notReady = ids.filter((id) => repo.getQuestion(id)?.status !== 'approved')
        if (notReady.length) return bad(`not approved (or unknown): ${notReady.join(', ')}`)
        if (repo.dailyPlayCount(day) > 0) return bad(`${day} has already been played; its set cannot change`)
        repo.tx(() => {
          repo.deleteDailySet(day)
          repo.insertDailySet(day, ids, ctx.now())
          if (day <= today) repo.setMetaOnce('daily_epoch', day)
        })
        show(day)
        return 0
      }
      case 'clear': {
        const day = args[0]
        if (!validDay(day)) return bad('give a day like 2026-11-01')
        if (!repo.deleteDailySet(day)) return bad(`${day} has no set, or it has already been played and cannot be removed`)
        out(`${day}: set removed. It will be chosen again when needed.`)
        return 0
      }
    }
    return bad('unknown daily command. Try: help')
  }

  if (group === 'db') {
    switch (verb) {
      case 'stats': {
        for (const [k, v] of Object.entries(repo.stats())) out(`${k.padEnd(20)} ${v}`)
        out(`${'llmCallsLast24h'.padEnd(20)} ${repo.llmCallsSince(ctx.now() - 86_400_000)}`)
        out(`${'answer checker'.padEnd(20)} ${ctx.llmNote}`)
        out(`${'database file'.padEnd(20)} ${ctx.dbFile}`)
        out(`${'known categories'.padEnd(20)} ${CATEGORIES.length}`)
        return 0
      }
      case 'backup': {
        if (ctx.dbFile === ':memory:') return bad('this database lives in memory only')
        const dir = args[0] ?? join(dirname(ctx.dbFile), 'backups')
        mkdirSync(dir, { recursive: true })
        const stamp = new Date(ctx.now()).toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15)
        const dest = join(dir, `minitude-${stamp}.db`)
        await repo.db.backup(dest)
        out(`Backup written: ${dest}`)
        return 0
      }
    }
    return bad('unknown db command. Try: help')
  }

  return bad(`unknown command "${group}". Try: help`)
}
