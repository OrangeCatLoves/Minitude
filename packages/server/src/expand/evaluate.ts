/**
 * Measures the list-only answer checker on a fixed set of test cases (a cases.json made during the local-model trial and kept outside the repo), before and after
 * the Wikidata expansion is imported. It works on a COPY of the database; your real database is only read.
 *
 *   npx tsx src/expand/evaluate.ts --cases C:/Users/weibi/minitude/local-llm/results/cases.json \
 *        --expansions C:/Users/weibi/minitude/list-build --copy C:/Users/weibi/minitude/list-build/expanded.db
 *
 * What the cases are: real answers the bank did not list (hand-valid), slips in listed answers (typo), another name (alias) ->
 * these SHOULD be accepted; fakes, traps, answers to other questions, past rulings and prompt-injection texts (hand-invalid,
 * cross, past-invalid, inject) -> these must NOT be accepted. "asked" means the player is shown "Did you mean X?"; the answer
 * only counts if they say yes, so a wrong suggestion is cheap, but it is reported separately.
 */
import Database from 'better-sqlite3'
import { copyFileSync, existsSync, readdirSync, readFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { runCli } from '../cli/commands'
import { defaultDbFile, openDb } from '../db/open'
import { Repo } from '../db/repo'
import { PipelineJudge } from '../judge/pipeline'

interface Case { id: string; type: string; qid: string; text: string; expect: { valid: boolean } }
const args = process.argv.slice(2)
const arg = (n: string, d?: string) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d }
const CASES = arg('cases', 'C:/Users/weibi/minitude/local-llm/results/cases.json')!
const EXPANSIONS = arg('expansions', 'C:/Users/weibi/minitude/list-build')!
const COPY = arg('copy', 'C:/Users/weibi/minitude/list-build/expanded.db')!

type Outcome = 'accepted' | 'asked' | 'rejected'
async function evaluate(repo: Repo, cases: Case[]): Promise<Map<string, Record<Outcome, number> & { n: number; false: string[] }>> {
  const judge = new PipelineJudge(repo, null)
  const table = new Map<string, Record<Outcome, number> & { n: number; false: string[] }>()
  for (const c of cases) {
    const q = repo.approvedHeads().find((h) => h.id === c.qid)
    if (!q) continue
    const out = (await judge.judge(q, c.text)).res
    const o: Outcome = out.status === 'valid' ? 'accepted' : out.status === 'confirm' ? 'asked' : 'rejected'
    const row = table.get(c.type) ?? { accepted: 0, asked: 0, rejected: 0, n: 0, false: [] }
    row[o]++
    row.n++
    // a miss: a real answer that is rejected, or a fake that is accepted outright
    if ((c.expect.valid && o === 'rejected') || (!c.expect.valid && o === 'accepted')) row.false.push(`${c.text}  [${c.qid}]${o === 'accepted' ? ' -> ' + out.answer : ''}`)
    table.set(c.type, row)
  }
  return table
}

function show(title: string, t: Map<string, Record<Outcome, number> & { n: number; false: string[] }>): void {
  console.log(`\n=== ${title}`)
  console.log('type'.padEnd(14) + 'cases'.padStart(6) + 'accepted'.padStart(10) + 'asked'.padStart(7) + 'rejected'.padStart(10) + '   should be')
  for (const [type, r] of [...t].sort()) {
    const real = ['hand-valid', 'typo', 'alias', 'held-out'].includes(type)
    console.log(type.padEnd(14) + String(r.n).padStart(6) + String(r.accepted).padStart(10) + String(r.asked).padStart(7) + String(r.rejected).padStart(10) + '   ' + (real ? 'accepted (or asked)' : 'rejected'))
  }
}

async function main() {
  const cases = (JSON.parse(readFileSync(CASES, 'utf8')) as Case[]).filter((c) => c.type !== 'held-out') // held-out answers are listed in the bank by construction
  if (existsSync(COPY)) unlinkSync(COPY)
  const src = new Database(arg('db', defaultDbFile())!, { readonly: true, fileMustExist: true })
  await src.backup(COPY)
  src.close()
  const repo = new Repo(openDb(COPY))

  const before = await evaluate(repo, cases)
  show('BEFORE the expansion (answer lists as they are today)', before)

  const lines: string[] = []
  const ctx = { repo, llm: null, llmNote: 'none', dbFile: COPY, now: Date.now, out: (s: string) => lines.push(s) }
  for (const f of readdirSync(EXPANSIONS).filter((x) => x.endsWith('.json')).sort()) {
    const code = await runCli(['answers', 'import-expansion', join(EXPANSIONS, f)], ctx)
    console.log(`import ${f.padEnd(52)} ${lines.at(-1) ?? ''}${code ? '  (exit ' + code + ')' : ''}`)
  }
  await runCli(['answers', 'import-groups'], ctx)
  console.log('group names:', lines.at(-1))
  const after = await evaluate(repo, cases)
  show('AFTER the expansion', after)

  console.log('\nReal answers still rejected after the expansion:')
  for (const type of ['hand-valid', 'typo', 'alias']) for (const f of after.get(type)?.false ?? []) console.log(`  [${type}] ${f}`)
  console.log('\nFakes ACCEPTED outright after the expansion (these would be wrong):')
  for (const type of ['hand-invalid', 'past-invalid', 'cross', 'inject']) for (const f of after.get(type)?.false ?? []) console.log(`  [${type}] ${f}`)
  // speed: what a player waits for when the text is not an exact match (the whole list is compared)
  const judge = new PipelineJudge(repo, null)
  const big = repo.approvedHeads().map((h) => ({ h, n: repo.formsOf(h.id).size })).sort((x, y) => y.n - x.n)[0]
  const t0 = performance.now()
  const N = 100
  for (let i = 0; i < N; i++) await judge.judge(big.h, 'zorblaxi unknownish ' + i)
  console.log(`
Speed on the biggest list (${big.h.id}, ${big.n} written forms): ${((performance.now() - t0) / N).toFixed(1)} ms per unknown answer`)
  const s = repo.db.prepare("SELECT source, COUNT(*) n FROM answers GROUP BY source").all() as { source: string; n: number }[]
  console.log('\nAnswers in the copy by source:', s.map((x) => `${x.source} ${x.n}`).join(', '), '| aliases:', (repo.db.prepare("SELECT COUNT(*) n FROM spellings WHERE verdict = 'valid'").get() as { n: number }).n)
}
main().catch((e) => { console.error(e); process.exit(1) })
