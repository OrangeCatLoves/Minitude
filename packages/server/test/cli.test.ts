import { describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseArgs } from '../src/cli/args'
import { runCli, type CliContext } from '../src/cli/commands'
import { openDb } from '../src/db/open'
import { Repo } from '../src/db/repo'
import { importQuestion } from '../src/bankio'
import { FakeLlm, testRepo } from './helpers'

function ctx(repo = testRepo(), llm: FakeLlm | null = null): CliContext & { lines: string[] } {
  const lines: string[] = []
  return { repo, llm, llmNote: llm ? 'fake model' : 'mock (no key)', dbFile: ':memory:', now: () => 123_456, out: (s) => lines.push(s), lines }
}
const run = async (argv: string[], c = ctx()) => ({ code: await runCli(argv, c), text: c.lines.join('\n'), c })

const draft = (repo: Repo, id: string, over: { notes?: string; perTier?: number } = {}) =>
  importQuestion(repo, {
    id, category: 'Food', prompt: `Name a ${id}.`, rules: 'Anything real.',
    answers: [0, 1, 2, 3, 4, 5].flatMap((t) => Array.from({ length: over.perTier ?? 5 }, (_, i) => ({ name: `${id} ${t}-${i}`, tier: t }))),
  }, { status: 'draft', source: 'llm', answerSource: 'draft', model: 'm', notes: over.notes ?? 'Audit: the question looks fine.', at: 9 })

describe('arguments', () => {
  it('words, flags with values, switches and repeated flags', () => {
    const a = parseArgs(['questions', 'generate', '--category', 'Food', '--category', 'Music', '--count', '2', '--all-drafts'])
    expect(a.words).toEqual(['questions', 'generate'])
    expect(a.repeated.category).toEqual(['Food', 'Music'])
    expect(a.flags.count).toBe('2')
    expect(a.flags['all-drafts']).toBe(true)
  })
})

describe('questions', () => {
  it('help, unknown commands', async () => {
    expect((await run([])).text).toMatch(/Minitude command line/)
    expect((await run(['nope'])).code).toBe(1)
    expect((await run(['questions', 'nope'])).code).toBe(1)
  })
  it('list and show', async () => {
    const r = testRepo()
    draft(r, 'soup')
    const l = await run(['questions', 'list', '--status', 'draft'], ctx(r))
    expect(l.text).toMatch(/soup/)
    expect(l.text).not.toMatch(/food-cheese/)
    expect((await run(['questions', 'list', '--status', 'weird'], ctx(r))).code).toBe(1)
    const s = await run(['questions', 'show', 'soup'], ctx(r))
    expect(s.text).toMatch(/Tier 5 Mythic \(5\)/)
    expect((await run(['questions', 'show', 'nope'], ctx(r))).code).toBe(1)
  })
  it('approve: a clean draft is approved; a flagged one needs --force; --all-drafts only takes the clean ones', async () => {
    const r = testRepo()
    draft(r, 'good'); draft(r, 'flagged', { notes: 'Audit says the QUESTION has a problem: vague' }); draft(r, 'thin', { perTier: 2 })
    const one = await run(['questions', 'approve', 'good'], ctx(r))
    expect(one.code).toBe(0)
    expect(r.getQuestion('good')!.status).toBe('approved')
    expect(r.approvedHeads().map((q) => q.id)).toContain('good')
    const f = await run(['questions', 'approve', 'flagged'], ctx(r))
    expect(f.code).toBe(1)
    expect(f.text).toMatch(/use --force/)
    expect(r.getQuestion('flagged')!.status).toBe('draft')
    draft(r, 'good2')
    const all = await run(['questions', 'approve', '--all-drafts'], ctx(r))
    expect(r.getQuestion('good2')!.status).toBe('approved')
    expect(r.getQuestion('flagged')!.status).toBe('draft')
    expect(r.getQuestion('thin')!.status).toBe('draft')
    expect(all.code).toBe(1)
    expect((await run(['questions', 'approve', 'flagged', '--force'], ctx(r))).code).toBe(0)
    expect(r.getQuestion('flagged')!.status).toBe('approved')
  })
  it('reject keeps the reason', async () => {
    const r = testRepo()
    draft(r, 'meh')
    await run(['questions', 'reject', 'meh', '--reason', 'too easy'], ctx(r))
    expect(r.getQuestion('meh')).toMatchObject({ status: 'rejected' })
    expect(r.getQuestion('meh')!.notes).toMatch(/too easy/)
  })
  it('export then import into another database', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'minitude-cli-'))
    try {
      const file = join(dir, 'out', 'q.json')
      const a = await run(['questions', 'export', file])
      expect(a.text).toMatch(/Wrote 11 questions/)
      expect(JSON.parse(readFileSync(file, 'utf8')).questions).toHaveLength(11)
      const other = new Repo(openDb(':memory:'))
      const i = await run(['questions', 'import', file], ctx(other))
      expect(i.text).toMatch(/Added 11/)
      expect(other.countByStatus()).toEqual({ draft: 11, approved: 0, rejected: 0 })
      expect((await run(['questions', 'import', file, '--approve'], ctx(other))).text).toMatch(/Added 0/)
      expect((await run(['questions', 'import', join(dir, 'missing.json')])).code).toBe(1)
      writeFileSync(join(dir, 'bad.json'), '{"nope":1}')
      expect((await run(['questions', 'import', join(dir, 'bad.json')])).code).toBe(1)
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })
  it('generate needs a model and uses the one it is given', async () => {
    const none = await run(['questions', 'generate'])
    expect(none.code).toBe(1)
    expect(none.text).toMatch(/GEMINI_API_KEY/)
    expect((await run(['questions', 'generate', '--count', '0'], ctx(testRepo(), new FakeLlm()))).code).toBe(1)
    const llm = new FakeLlm((req) => {
      const props = Object.keys(req.schema.properties ?? {})
      if (props.includes('questions')) return { questions: [{ prompt: 'Name a kind of soup.', rules: 'Any real soup counts.' }] }
      if (props.includes('answers')) return { answers: [0, 1, 2, 3, 4, 5].flatMap((t) => Array.from({ length: 6 }, (_, i) => ({ name: `S${t}${i}`, tier: t, desc: '', aliases: [] }))) }
      return { question_ok: true, question_note: '', problems: [] }
    })
    const g = await run(['questions', 'generate', '--category', 'Food', '--count', '1'], ctx(testRepo(), llm))
    expect(g.code).toBe(0)
    expect(g.text).toMatch(/1 draft/)
  })
})

describe('answers', () => {
  it('review lists flagged answers; set-tier, ok and remove change them and keep a record', async () => {
    const r = testRepo()
    r.insertAnswer({ questionId: 'food-cheese', norm: 'odd', name: 'Odd', tier: 3, source: 'live', review: true, note: 'unsure', at: 1 })
    const rev = await run(['answers', 'review'], ctx(r))
    expect(rev.text).toMatch(/Odd/)
    expect((await run(['answers', 'set-tier', 'food-cheese', 'odd', '4', '--reason', 'rarer'], ctx(r))).code).toBe(0)
    expect(r.getAnswer('food-cheese', 'odd')).toMatchObject({ tier: 4, review: false })
    r.db.prepare("UPDATE answers SET review = 1 WHERE norm = 'odd'").run()
    await run(['answers', 'ok', 'food-cheese', 'Odd'], ctx(r))
    expect(r.getAnswer('food-cheese', 'odd')!.review).toBe(false)
    expect((await run(['answers', 'set-tier', 'food-cheese', 'odd', '9'], ctx(r))).code).toBe(1)
    expect((await run(['answers', 'set-tier', 'food-cheese', 'nothing', '1'], ctx(r))).code).toBe(1)
    const rm = await run(['answers', 'remove', 'food-cheese', 'odd', '--message', 'Nope.'], ctx(r))
    expect(rm.text).toMatch(/Nope\./)
    expect(r.findStored('food-cheese', 'odd')).toEqual({ kind: 'invalid', message: 'Nope.' })
  })
  it('a spelling works wherever an answer is expected', async () => {
    const r = testRepo()
    await run(['answers', 'set-tier', 'food-cheese', 'Parmigiano', '4'], ctx(r))
    expect(r.getAnswer('food-cheese', 'parmesan')!.tier).toBe(4)
  })
  it('list can show only the answers the model added', async () => {
    const r = testRepo()
    r.insertAnswer({ questionId: 'food-cheese', norm: 'zed', name: 'Zed', tier: 2, source: 'live', at: 1 })
    const l = await run(['answers', 'list', 'food-cheese', '--live'], ctx(r))
    expect(l.text).toMatch(/1 answers/)
  })
})

describe('database', () => {
  it('stats', async () => {
    const r = await run(['db', 'stats'])
    expect(r.text).toMatch(/questionsApproved\s+11/)
  })
  it('backup writes a usable copy of the database file', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'minitude-bk-'))
    try {
      const file = join(dir, 'm.db')
      const repo = new Repo(openDb(file))
      importQuestion(repo, { id: 'q', category: 'Food', prompt: 'Name a thing.', rules: 'r', answers: [{ name: 'A', tier: 0 }] }, { status: 'approved', source: 'import', answerSource: 'seed', at: 1 })
      const c = ctx(repo); c.dbFile = file
      const r = await run(['db', 'backup'], c)
      expect(r.code).toBe(0)
      const dest = r.text.replace('Backup written: ', '').trim()
      expect(existsSync(dest)).toBe(true)
      const copy = new Repo(openDb(dest))
      expect(copy.countByStatus().approved).toBe(1)
      copy.db.close(); repo.db.close()
      expect((await run(['db', 'backup'])).code).toBe(1) // an in-memory database cannot be backed up
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })
})

describe('daily', () => {
  const NOW = Date.parse('2026-11-01T12:00:00Z')
  const dctx = (repo = testRepo()) => ({ ...ctx(repo), now: () => NOW })
  const drun = async (argv: string[], c = dctx()) => ({ code: await runCli(argv, c), text: c.lines.join('\n'), c })

  it('plan chooses and saves the next days; show prints them', async () => {
    const c = dctx()
    const p = await drun(['daily', 'plan', '--days', '3'], c)
    expect(p.code).toBe(0)
    expect(p.text).toMatch(/2026-11-01 {2}daily #1 {2}\(today\)/)
    expect(p.text).toMatch(/2026-11-03 {2}daily #3/)
    expect(c.repo.dailyDays('2026-11-01')).toEqual(['2026-11-01', '2026-11-02', '2026-11-03'])
    c.lines.length = 0
    const again = await drun(['daily', 'show', '2026-11-02'], c)
    expect(again.text).toMatch(/1\. /)
    expect(again.text.match(/^ {2}\d\. /gm)!.length).toBe(7)
  })
  it('show says so when a day has no set, and checks the date', async () => {
    expect((await drun(['daily', 'show'])).text).toMatch(/no set yet/)
    expect((await drun(['daily', 'show', '2026-13-45'])).code).toBe(1)
    expect((await drun(['daily', 'plan', '--days', '0'])).code).toBe(1)
  })
  it('plan refuses when there are fewer than seven approved questions', async () => {
    const small = new Repo(openDb(':memory:'))
    const r = await drun(['daily', 'plan'], dctx(small))
    expect(r.code).toBe(1)
    expect(r.text).toMatch(/fewer than 7 approved/)
  })
  it('set puts chosen questions on a day; clear removes them', async () => {
    const c = dctx()
    const ids = c.repo.approvedHeads().slice(0, 7).map((q) => q.id)
    const s = await drun(['daily', 'set', '2026-11-05', ...ids], c)
    expect(s.code).toBe(0)
    expect(c.repo.dailySet('2026-11-05')!.map((q) => q.id)).toEqual(ids)
    // changing it again is fine while nobody has played it
    const ids2 = [...ids].reverse()
    expect((await drun(['daily', 'set', '2026-11-05', ...ids2], c)).code).toBe(0)
    expect(c.repo.dailySet('2026-11-05')!.map((q) => q.id)).toEqual(ids2)
    expect((await drun(['daily', 'clear', '2026-11-05'], c)).code).toBe(0)
    expect(c.repo.dailySet('2026-11-05')).toBeUndefined()
    expect((await drun(['daily', 'clear', '2026-11-05'], c)).code).toBe(1)
  })
  it('set checks its input', async () => {
    const c = dctx()
    const ids = c.repo.approvedHeads().slice(0, 7).map((q) => q.id)
    expect((await drun(['daily', 'set', '2026-11-05', ...ids.slice(0, 6)], c)).code).toBe(1)
    expect((await drun(['daily', 'set', '2026-11-05', ...ids.slice(0, 6), ids[0]], c)).code).toBe(1)
    expect((await drun(['daily', 'set', '2026-11-05', ...ids.slice(0, 6), 'nope'], c)).text).toMatch(/not approved \(or unknown\): nope/)
    expect((await drun(['daily', 'set', '2026-10-01', ...ids], c)).code).toBe(1)
    c.repo.setQuestionStatus(ids[0], 'rejected', 1)
    expect((await drun(['daily', 'set', '2026-11-05', ...ids], c)).text).toMatch(new RegExp(ids[0]))
  })
  it('a day that has been played cannot be changed or cleared', async () => {
    const c = dctx()
    await drun(['daily', 'plan', '--days', '1'], c)
    c.repo.startDailyPlay('2026-11-01', 'guest-0000000000000001', c.repo.dailySet('2026-11-01')!, 'mock', null, NOW)
    const ids = c.repo.approvedHeads().slice(0, 7).map((q) => q.id)
    expect((await drun(['daily', 'set', '2026-11-01', ...ids], c)).text).toMatch(/already been played/)
    expect((await drun(['daily', 'clear', '2026-11-01'], c)).code).toBe(1)
    const show = await drun(['daily', 'show'], c)
    expect(show.text).toMatch(/1 started, 0 finished/)
  })
})
