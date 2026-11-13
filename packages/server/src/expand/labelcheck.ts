/**
 * Looks for vandalised or mistyped names among the best-known answers of a built batch.
 *
 *   npx tsx src/expand/labelcheck.ts C:/Users/weibi/minitude/list-build/batch2
 *
 * Anyone can edit Wikidata, and a name there is only as good as its last edit: in November 2026 the English label of the dinosaur
 * Compsognathus read "messielgoat", and it went into a live question as an answer. An item that has BOTH an English label and a
 * language-neutral ("mul") label shows the problem when the two have nothing in common ("Bernal Díaz del Brawl" against
 * "Bernal Díaz del Castillo"). Most differences are fine (a native-language name, a full formal name, a Latin name), so those are left out:
 * what is printed is a short list for a person to look at. A bad one is dealt with in the recipe with `skip`, and the right name added as an extra.
 * Read-only: it only asks Wikidata (one request a second) about the answers in the top five tiers.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { QuestionBank } from '../questions'
import { sparql } from './wikidata'

const dir = process.argv[2]
if (!dir) { console.error('usage: labelcheck <folder with bank.json and raw/>'); process.exit(1) }

const LATIN = /^[A-Z][a-z]+ [a-z-]+( [a-z-]+)?$/
const flat = (t: string) => t.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '')

const bank = JSON.parse(readFileSync(join(dir, 'bank.json'), 'utf8')) as QuestionBank
const where = new Map<string, { question: string; name: string; tier: number }>()
for (const q of bank.questions) {
  const file = join(dir, 'raw', `${q.id}.json`)
  if (!existsSync(file)) continue
  const raw = JSON.parse(readFileSync(file, 'utf8')) as { id: string; name: string }[]
  const idOf = new Map(raw.map((c) => [c.name, c.id]))
  for (const a of q.answers) {
    const id = idOf.get(a.name)
    if (a.tier <= 4 && id && /^Q\d+$/.test(id)) where.set(id, { question: q.id, name: a.name, tier: a.tier })
  }
}
const ids = [...where.keys()]
console.log(`${ids.length} best-known answers to look at`)

let found = 0
for (let i = 0; i < ids.length; i += 250) {
  const chunk = ids.slice(i, i + 250)
  const rows = await sparql(`SELECT ?item ?en ?mul WHERE { VALUES ?item { ${chunk.map((x) => 'wd:' + x).join(' ')} }
    ?item rdfs:label ?en FILTER(lang(?en) = "en") ?item rdfs:label ?mul FILTER(lang(?mul) = "mul") FILTER(?en != ?mul) }`, 3)
  for (const r of rows) {
    if (LATIN.test(r.mul) || flat(r.en).includes(flat(r.mul)) || flat(r.mul).includes(flat(r.en))) continue
    const w = where.get(r.item.replace(/^.*\//, ''))!
    found++
    console.log(`  ${w.question.padEnd(30)} tier ${w.tier}  English "${r.en}"   language-neutral "${r.mul}"`)
  }
}
console.log(`${found} item(s) whose English and language-neutral names have nothing in common. Most are a name in another language; look for nonsense.`)
