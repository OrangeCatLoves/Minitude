// Draft probe (read-only, in-memory database, nothing live is touched).
// Question: for a well-known answer that exists twice in a list (a Common full name AND a Mythic short name), what does the
// real answer checker say when a player types the short name?   Run from packages/server:
//   npx tsx ../../draft-singularity-gems/tools/judge-probe.mts
import fs from 'node:fs'
import path from 'node:path'
import { openDb } from '../../packages/server/src/db/open'
import { Repo } from '../../packages/server/src/db/repo'
import { importBank } from '../../packages/server/src/bankio'
import { PipelineJudge } from '../../packages/server/src/judge/pipeline'

const LB = path.join(import.meta.dirname, '..', '..', '..', 'list-build')
const wanted: Record<string, string[]> = {
  'sports-football-club': ['Real Madrid', 'Real Madrid CF', 'Manchester United'],
  'misc-currency': ['dollar', 'pound', 'franc', 'euro'],
  'movies-star-wars-character': ['Darth Sidious', 'Palpatine'],
  'science-technology-company': ['Hewlett-Packard', 'HP'],
}
const repo = new Repo(openDb(':memory:'))
for (const b of ['batch1', 'batch2', 'batch3', 'batch4']) {
  const bank = JSON.parse(fs.readFileSync(path.join(LB, b, 'bank.json'), 'utf8'))
  bank.questions = bank.questions.filter((q: any) => wanted[q.id])
  if (bank.questions.length) importBank(repo, bank, { status: 'approved', source: 'import', answerSource: 'draft', at: 1 })
}
const judge = new PipelineJudge(repo, null, () => 1)
for (const [id, texts] of Object.entries(wanted)) {
  const q = repo.getQuestion(id)
  if (!q) { console.log(id, 'not imported'); continue }
  for (const t of texts) {
    const o: any = await judge.judge({ id: q.id, category: q.category, prompt: q.prompt, rules: q.rules }, t, 'ask')
    console.log(`${id.padEnd(28)} "${t}" ->`, JSON.stringify({ status: o.res.status, tier: o.res.tier, canonical: o.res.canonical ?? o.res.answer, suggestion: o.res.suggestion }))
  }
}
