/**
 * Builds NEW questions (not just more answers for existing ones) from Wikidata classes, offline.
 *
 * For each definition in a batch (batch1.ts ...) it fetches the class, gives every answer a tier by RANK within the class (there are
 * no existing answers to compare with, unlike expand/build.ts), and writes:
 *   <out>/bank.json   a question bank file: `questions import <file>` adds the questions as DRAFTS (nothing is played until approved)
 *   <out>/review.md   one sheet per question for a person to vet: wording, rules, size, tiers, the head, a sample of the tail
 *   <out>/raw/        what Wikidata returned (so the building can be redone with --cached)
 * Then it imports the bank into a throw-away in-memory database and checks that typed answers are accepted.
 *
 *   npx tsx src/expand/newq.ts --batch batch1 --out C:/Users/weibi/minitude/list-build/batch1 [--only <id>] [--cached]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { importBank } from '../bankio'
import { openDb } from '../db/open'
import { Repo } from '../db/repo'
import { PipelineJudge } from '../judge/pipeline'
import { looseKey, normalize } from '../normalize'
import type { QuestionBank, QuestionRecord } from '../questions'
import { fetchPattern, type Candidate } from './build'
import { sparql } from './wikidata'

export interface NewQuestion {
  id: string
  category: string
  prompt: string
  /** what counts as valid; never shown to players */
  rules: string
  /** where the answers come from, in a sentence, for the review sheet */
  source: string
  /** a SPARQL pattern that binds ?item (with minSignal pushed into the query), or a custom fetch */
  pattern?: string
  fetch?: () => Promise<Candidate[]>
  /** animals and plants: the name people type is the English common name */
  commonNames?: boolean
  /** Wikidata property whose value is another way to write the name (for example P238, the IATA airport code) */
  codeProp?: string
  /** ignore things known in fewer Wikipedia languages than this */
  minSignal?: number
  /** drop a candidate */
  skip?: (c: Candidate) => boolean
  /** other ways players write the name, made from it */
  alsoWritten?: (name: string) => string[]
  /** hand-added answers (signal places them among the rest) that the class does not contain, with their aliases */
  extras?: { name: string; signal: number; aliases?: string[] }[]
  /** hand-added aliases for answers the class does contain: name -> aliases */
  extraAliases?: Record<string, string[]>
  /**
   * The obvious answers a casual player thinks of first, most obvious first. They MUST be present (one the class lacks is added by hand and
   * reported) and they lead the ranking, so the Common tier is what players really say, not what many bot-written articles happen to exist about.
   */
  mustHave?: string[]
  /**
   * Hand-listed names that should become the DISPLAY name of the item they land on when that item has another name (Wikidata calls spinach
   * "Spinacia oleracea" and the lychee "litchi"). Only for names that are the same thing; a name that merely lands on a related item
   * ("Toyota Corolla" on "Toyota Auris") must NOT be listed: add it as an `extras` entry instead, so it gets an answer of its own.
   */
  rename?: string[]
}

// ---------------------------------------------------------------------------------------------------------------------------------
// tiers by rank

const BASE = [10, 20, 40, 80, 160]
const FRACTION = [0.06, 0.1, 0.14, 0.2, 0.28]
/**
 * The tier of each rank (0 = best known). A player names the first things that come to mind: about the top 10 are Common, the next
 * 20 Uncommon, then 40, 80 and 160; everything beyond is Mythic. A small class shrinks the bands so every tier still has answers
 * (the game needs at least 4 per tier). This is a starting guess from how many Wikipedia languages know each thing; real play counts
 * (`answers.times_given`) can correct it later.
 */
export function coldTiers(n: number): number[] {
  const sizes = BASE.map((b, i) => Math.max(1, Math.min(b, Math.floor(FRACTION[i] * n))))
  const tiers: number[] = []
  sizes.forEach((size, tier) => { for (let i = 0; i < size; i++) tiers.push(tier) })
  while (tiers.length < n) tiers.push(5)
  return tiers.slice(0, n)
}

// ---------------------------------------------------------------------------------------------------------------------------------
// building one question

const GENERIC = new Set(['dog', 'horse', 'shark', 'cocktail', 'cheese', 'bread', 'game', 'board game', 'video game', 'pokemon', 'emperor', 'empress', 'god', 'goddess', 'deity', 'battle', 'country', 'capital', 'city', 'island', 'mineral', 'dinosaur', 'movie', 'film', 'tv series', 'television series', 'series', 'character', 'instrument', 'musical instrument', 'band', 'rock band', 'song', 'sport', 'driver', 'club', 'football club', 'car', 'airport', 'occupation', 'job', 'profession'])
/** how well known to an English-speaking global audience: the 10 biggest Wikipedias dominate, an English article adds, all languages break ties; a hand boost wins */
export const fameScore = (c: Candidate) => (c.boost ?? 0) + (c.big ?? 0) * 100 + (c.en ? 60 : 0) + Math.min(c.signal, 150)
/** old names that are slurs and that Wikidata keeps as an animal's label or as another way to write a title (the thing itself is listed under its other names): never stored */
const UNWANTED = /nigger|\b(jew lizard|jew cookie|negro-dutch|squaw poker|squaw man|kaffir|jewess|coolie|negro national anthem|joey negro|el negro)\b/i
const okName = (n: string) => n.length >= 2 && n.length <= 60 && /\p{L}/u.test(n) && !/[()\[\]{}<>@#]/.test(n) && !/\blist of\b|disambiguation/i.test(n) && !/^Q\d+$/.test(n) && !UNWANTED.test(n)
const okAlias = (a: string) => a.length >= 2 && a.length <= 60 && /\p{L}/u.test(a) && !/[()\[\]{}<>@#]/.test(a) && !/^Q\d+$/i.test(a) && !UNWANTED.test(a) // a Wikidata code is not a name

export interface Built {
  record: QuestionRecord
  stats: { fetched: number; kept: number; tierCounts: number[]; withAliases: number; aliases: number; dropped: Record<string, number> }
  /** the answers in rank order, with what Wikidata said about each (for the review sheet) */
  ranked: { name: string; tier: number; signal: number; desc?: string; aliases: string[] }[]
  flags: string[]
  /** obvious answers the class did not contain, added by hand */
  addedByHand: string[]
}

const SCIENTIFIC = /^[A-Z][a-z]+ [a-z-]+( [a-z-]+)?$/

/**
 * The scientific name of a species is the language-neutral ("mul") label of its Wikidata item. The rules of the animal questions accept
 * scientific names, so for the best-known species (the ones a person could actually type) it is added as another way to write the answer.
 * Only Latin names are taken: other language-neutral labels can be a native-language name or, now and then, vandalism.
 * Answers are kept in `cacheFile`, so a rebuild from saved data needs no network.
 */
export async function addScientificNames(fetched: Candidate[], cacheFile: string, top = 600): Promise<void> {
  const cache: Record<string, string> = existsSync(cacheFile) ? (JSON.parse(readFileSync(cacheFile, 'utf8')) as Record<string, string>) : {}
  const best = [...fetched].filter((c) => /^Q\d+$/.test(c.id)).sort((a, b) => fameScore(b) - fameScore(a)).slice(0, top)
  const need = best.filter((c) => !(c.id in cache))
  for (let i = 0; i < need.length; i += 250) {
    const chunk = need.slice(i, i + 250)
    const rows = await sparql(`SELECT ?item ?mul WHERE { VALUES ?item { ${chunk.map((c) => 'wd:' + c.id).join(' ')} } OPTIONAL { ?item rdfs:label ?mul FILTER(lang(?mul) = "mul") } }`)
    for (const c of chunk) cache[c.id] = ''
    for (const r of rows) if (r.mul) cache[r.item.replace(/^.*\//, '')] = r.mul
  }
  if (need.length) writeFileSync(cacheFile, JSON.stringify(cache))
  for (const c of best) {
    const m = cache[c.id]
    if (m && SCIENTIFIC.test(m) && m !== c.name && !c.aliases.includes(m)) c.aliases = [...c.aliases, m]
  }
}

export function buildQuestion(q: NewQuestion, input: Candidate[]): Built {
  // work on copies: the head (boost, rename) changes candidates, and building the same data twice must give the same question
  const fetched = input.map((c) => ({ ...c, aliases: [...c.aliases] }))
  const dropped: Record<string, number> = { 'no usable name': 0, 'generic word': 0, 'skipped by the recipe': 0, 'same name as a better-known one': 0 }
  const seen = new Set<string>()
  const kept: Candidate[] = []
  const extraCands: Candidate[] = (q.extras ?? []).map((e) => ({ id: 'curated:' + e.name, name: e.name, aliases: e.aliases ?? [], signal: e.signal }))
  // the obvious answers: found in the class (and pushed to the top) or added by hand
  // a name beats an alias (so "Money Heist" is the series, not a remake that lists it as an alias); between equals the better known wins
  const lookup = new Map<string, Candidate>()
  const byFame = [...fetched, ...extraCands].sort((a, b) => fameScore(b) - fameScore(a))
  // a hand-added answer wins a name tie with a Wikidata item ("Google" against the old social network "Google+", which the text matching reads as the same word)
  for (const c of [...extraCands, ...byFame]) { const k = looseKey(normalize(c.name)); if (k && !lookup.has(k)) lookup.set(k, c) }
  for (const c of byFame) for (const n of [...c.aliases, ...(q.alsoWritten?.(c.name) ?? []), ...(q.extraAliases?.[c.name] ?? [])]) { const k = looseKey(normalize(n)); if (k && !lookup.has(k)) lookup.set(k, c) }
  const addedByHand: string[] = []
  /** hand-listed names that matched only another item's alias ("Toyota Corolla" -> "Toyota Auris"): often right, sometimes a different thing */
  const landed: string[] = []
  const musts: Candidate[] = []
  ;(q.mustHave ?? []).forEach((m, i) => {
    // a step between two listed answers is far bigger than the whole range of a fame score (at most about 1,300), so the hand-listed
    // answers rank strictly in the order they are listed, and all of them above everything else
    const boost = 10_000_000 - i * 10_000
    const hit = lookup.get(looseKey(normalize(m)))
    if (hit) {
      hit.boost = Math.max(hit.boost ?? 0, boost)
      // the listed name is the one players say: show it, and keep the item's own name as another way to write it
      if (looseKey(normalize(hit.name)) !== looseKey(normalize(m))) {
        if (q.rename?.includes(m)) { hit.aliases = [hit.name, ...hit.aliases]; hit.name = m }
        else landed.push(`${m} -> ${hit.name}`)
      }
    }
    else { addedByHand.push(m); musts.push({ id: 'must:' + m, name: m, aliases: [], signal: 0, boost }) }
  })
  const all: Candidate[] = [...fetched, ...extraCands, ...musts]
  for (const c of all.sort((a, b) => fameScore(b) - fameScore(a) || a.name.localeCompare(b.name))) {
    if (!okName(c.name)) { dropped['no usable name']++; continue }
    if (GENERIC.has(normalize(c.name)) && !c.boost) { dropped['generic word']++; continue } // a hand-listed answer is never dropped as generic
    if (q.skip?.(c) && !c.boost) { dropped['skipped by the recipe']++; continue } // a hand-listed answer is never skipped
    const key = looseKey(normalize(c.name))
    if (!key || seen.has(key)) { dropped['same name as a better-known one']++; continue }
    seen.add(key)
    kept.push(c)
  }
  const tiers = coldTiers(kept.length)
  // aliases: other names Wikidata knows, patterns players use, hand-added ones; never one that is another answer's name or an earlier alias
  const taken = new Set(seen)
  let aliases = 0, withAliases = 0
  const ranked = kept.map((c, i) => {
    const mine: string[] = []
    for (const a of [...c.aliases, ...(q.alsoWritten?.(c.name) ?? []), ...(q.extraAliases?.[c.name] ?? [])]) {
      if (!okAlias(a)) continue
      const n = normalize(a)
      const k = looseKey(n)
      if (!n || n === normalize(c.name) || taken.has(k)) continue
      taken.add(k)
      mine.push(a)
    }
    aliases += mine.length
    if (mine.length) withAliases++
    return { name: c.name, tier: tiers[i], signal: c.signal, desc: c.desc, aliases: mine }
  })
  const tierCounts = [0, 1, 2, 3, 4, 5].map((t) => ranked.filter((r) => r.tier === t).length)
  const flags: string[] = []
  if (ranked.length < 150) flags.push(`SMALL CLASS: only ${ranked.length} answers (a long tail needs about 150)`)
  if (tierCounts.some((n) => n < 4)) flags.push('a tier has fewer than 4 answers: it cannot be approved as it is')
  const head = ranked.slice(0, 10)
  // (an answer added by hand has no language count: it is there on purpose, so it is not a sign of a weak head)
  if (head.length === 10 && head[9].signal < 12 && !q.fetch && !head.some((h) => addedByHand.includes(h.name))) flags.push(`WEAK HEAD: the 10th best-known answer is known in only ${head[9].signal} languages`)
  const odd = ranked.filter((r) => /^Q\d+$/.test(r.name)).length   // a whole name that is a Wikidata code (a car named "Audi Q5" is fine)
  if (odd) flags.push(`${odd} answers look like Wikidata codes (no English name): look at them`)
  if (addedByHand.length) flags.push(`ADDED BY HAND because the class lacked them: ${addedByHand.join(', ')}`)
  if (landed.length) flags.push(`LISTED NAME LANDED ON AN ITEM WITH ANOTHER NAME (check each is the same thing; if not, add the listed name as an extra, if it is, add it to rename): ${landed.join('; ')}`)
  const record: QuestionRecord = { id: q.id, category: q.category, prompt: q.prompt, rules: q.rules, answers: ranked.map((r) => ({ name: r.name, tier: r.tier, ...(r.aliases.length ? { aliases: r.aliases } : {}) })) }
  return { record, stats: { fetched: fetched.length, kept: kept.length, tierCounts, withAliases, aliases, dropped }, ranked, flags, addedByHand }
}

// ---------------------------------------------------------------------------------------------------------------------------------
// the review sheet

function sample<T>(xs: T[], n: number, seed = 7): T[] {
  let s = seed
  const rnd = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296 }
  return [...xs].map((x) => [rnd(), x] as const).sort((a, b) => a[0] - b[0]).slice(0, n).map((p) => p[1])
}

export function reviewSheet(batch: string, defs: NewQuestion[], built: Map<string, Built>): string {
  const L: string[] = []
  L.push(`# ${batch}: ${built.size} new questions to vet`, '')
  L.push('Each question is a DRAFT: nothing is played until you approve it. For each one please check (1) the wording of the prompt, (2) the rules, (3) the best-known answers (the head) look right and are in a sensible order, (4) a few of the obscure ones are real and valid.', '')
  L.push('How tiers were chosen: by rank within the class, from how many Wikipedia languages know each thing. About the 10 best-known are Common (tier 0), the next 20 Uncommon (1), then 40 (2), 80 (3), 160 (4); the rest are Mythic (5). A person should fix the head if the order feels wrong for casual English-speaking players.', '')
  L.push('| # | question | category | answers | tiers 0/1/2/3/4/5 | flags |', '| --- | --- | --- | ---: | --- | --- |')
  defs.forEach((d, i) => { const b = built.get(d.id); if (b) L.push(`| ${i + 1} | ${d.prompt} | ${d.category} | ${b.stats.kept} | ${b.stats.tierCounts.join('/')} | ${b.flags.length ? b.flags.length + ' flag(s)' : 'none'} |`) })
  L.push('')
  defs.forEach((d, i) => {
    const b = built.get(d.id)
    if (!b) return
    L.push(`## ${i + 1}. ${d.prompt}`, `\`${d.id}\` · ${d.category}`, '')
    L.push(`**Rules:** ${d.rules}`, '', `**Where the answers come from:** ${d.source}`, '')
    L.push(`**Size:** ${b.stats.kept} answers (${b.stats.fetched} fetched; dropped: ${Object.entries(b.stats.dropped).filter(([, n]) => n).map(([k, n]) => `${n} ${k}`).join(', ') || 'none'}); ${b.stats.aliases} other ways to write them, on ${b.stats.withAliases} answers.`, '')
    if (b.flags.length) L.push(...b.flags.map((f) => `- **FLAG:** ${f}`), '')
    const line = (r: Built['ranked'][number]) => `${r.name}${r.desc ? ` _(${r.desc.slice(0, 60)})_` : ''}`
    for (let t = 0; t <= 2; t++) { const at = b.ranked.filter((r) => r.tier === t); if (at.length) L.push(`- **Tier ${t}** (${at.length}): ${at.slice(0, 30).map(line).join('; ')}${at.length > 30 ? '; ...' : ''}`) }
    const mid = b.ranked.filter((r) => r.tier === 3)
    if (mid.length) L.push(`- **Tier 3** (${mid.length}), a sample: ${sample(mid, 12).map(line).join('; ')}`)
    const low = b.ranked.filter((r) => r.tier >= 4)
    if (low.length) L.push(`- **Tiers 4 and 5** (${low.length}), a random sample: ${sample(low, 14).map(line).join('; ')}`)
    const al = b.ranked.filter((r) => r.aliases.length)
    if (al.length) L.push(`- **Other ways to write some of them:** ${sample(al, 8).map((r) => `${r.name} = ${r.aliases.slice(0, 3).join(' / ')}`).join('; ')}`)
    L.push('')
  })
  return L.join('\n')
}

// ---------------------------------------------------------------------------------------------------------------------------------
// the check: import the bank into a throw-away database and type answers into it

async function selfCheck(bank: QuestionBank): Promise<{ lines: string[]; problems: number }> {
  const repo = new Repo(openDb(':memory:'))
  importBank(repo, bank, { status: 'approved', source: 'import', answerSource: 'wikidata', at: 1 })
  const judge = new PipelineJudge(repo, null)
  const lines: string[] = []
  let problems = 0
  for (const q of bank.questions) {
    const head = repo.approvedHeads().find((h) => h.id === q.id)
    if (!head) { lines.push(`${q.id}: NOT IMPORTED`); problems++; continue }
    const picks = sample(q.answers, 6, 11)
    let ok = 0
    for (const a of picks) {
      const r = (await judge.judge(head, a.name.toLowerCase())).res
      if (r.status === 'valid' && r.answer) ok++
      else { problems++; lines.push(`${q.id}: typed "${a.name.toLowerCase()}" -> ${r.status}${r.answer ? ' ' + r.answer : ''}`) }
    }
    const withAlias = q.answers.filter((a) => a.aliases?.length)
    if (withAlias.length) {
      const a = sample(withAlias, 1, 3)[0]
      const r = (await judge.judge(head, a.aliases![0])).res
      if (r.status !== 'valid') { problems++; lines.push(`${q.id}: alias "${a.aliases![0]}" of "${a.name}" -> ${r.status}`) }
    }
    const tiers = [0, 1, 2, 3, 4, 5].map((t) => q.answers.filter((a) => a.tier === t).length)
    if (tiers.some((n) => n < 4)) { problems++; lines.push(`${q.id}: tier counts ${tiers.join('/')} (needs 4 in each to be approved)`) }
  }
  return { lines, problems }
}

// ---------------------------------------------------------------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2)
  const arg = (n: string) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : undefined }
  const batchName = arg('batch') ?? 'batch1'
  const out = arg('out') ?? `C:/Users/weibi/minitude/list-build/${batchName}`
  const only = arg('only')
  const cached = args.includes('--cached')
  const mod = await import(`./${batchName}`)
  const defs: NewQuestion[] = (mod.BATCH as NewQuestion[]).filter((d) => !only || d.id === only)
  mkdirSync(join(out, 'raw'), { recursive: true })
  const built = new Map<string, Built>()
  for (const d of defs) {
    const rawFile = join(out, 'raw', d.id + '.json')
    const t0 = Date.now()
    try {
      let fetched: Candidate[]
      if (cached && existsSync(rawFile)) fetched = JSON.parse(readFileSync(rawFile, 'utf8')) as Candidate[]
      else {
        fetched = d.fetch ? await d.fetch() : await fetchPattern(d.pattern!, !!d.commonNames, d.minSignal ?? 0, d.codeProp, true)
        const byId = new Map<string, Candidate>()
        for (const c of fetched) if (!byId.has(c.id)) byId.set(c.id, c)
        fetched = [...byId.values()]
        writeFileSync(rawFile, JSON.stringify(fetched))
      }
      if (d.fetch && d.commonNames) await addScientificNames(fetched, join(out, 'scientific-names.json'))
      const b = buildQuestion(d, fetched)
      built.set(d.id, b)
      console.log(`${d.id.padEnd(30)} fetched ${String(b.stats.fetched).padStart(6)} | kept ${String(b.stats.kept).padStart(6)} | tiers ${b.stats.tierCounts.join('/').padEnd(22)} | aliases ${String(b.stats.aliases).padStart(6)} | ${((Date.now() - t0) / 1000).toFixed(0)} s${b.flags.length ? ' | ' + b.flags.length + ' FLAG(S)' : ''}`)
    } catch (e) { console.log(`${d.id.padEnd(30)} FAILED: ${(e instanceof Error ? e.message : String(e)).slice(0, 140)}`) }
  }
  if (!built.size) return
  const ordered = defs.filter((d) => built.has(d.id))
  const bank: QuestionBank = { version: batchName, note: `Built from Wikidata on ${new Date().toISOString().slice(0, 10)}; drafts to vet. See review.md.`, categories: [...new Set(ordered.map((d) => d.category))], answerSource: 'wikidata', sources: Object.fromEntries(ordered.map((d) => [d.id, d.source])), questions: ordered.map((d) => built.get(d.id)!.record) }
  writeFileSync(join(out, 'bank.json'), JSON.stringify(bank))
  writeFileSync(join(out, 'review.md'), reviewSheet(batchName, ordered, built))
  console.log(`\nwrote ${join(out, 'bank.json')} and review.md (${ordered.length} questions)`)
  const check = await selfCheck(bank)
  console.log(check.problems ? `\nSELF-CHECK: ${check.problems} problem(s)` : '\nSELF-CHECK: every question imports, typed answers and aliases are accepted, every tier has at least 4 answers')
  for (const l of check.lines.slice(0, 30)) console.log('  ' + l)
}

if (process.argv[1] && /expand[\\/]newq\.ts$/.test(process.argv[1])) main().catch((e) => { console.error(e); process.exit(1) })
