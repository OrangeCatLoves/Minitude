/**
 * The OFFLINE answer-list builder. It never runs inside the game.
 *
 * For each question it asks Wikidata (public-domain data) for everything that belongs to the class the question is about, and
 * writes a review file with:
 *   - NEW answers (not in the bank yet), each with a tier taken from how well known the thing is, calibrated against the answers
 *     we already have for that question (so "famous" means the same as it already does in that question),
 *   - NEW aliases for answers we already have (other names Wikidata knows).
 * Nothing is written to the database here. `answers import-expansion <file>` does that, after you have looked at the file.
 *
 *   npx tsx src/expand/build.ts --out C:/Users/weibi/minitude/list-build [--only <question-id>] [--db <file>]
 */
import Database from 'better-sqlite3'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defaultDbFile } from '../db/open'
import { looseKey, normalize } from '../normalize'
import { qid as idOf, sparql, type Row } from './wikidata'

export interface Candidate { id: string; name: string; aliases: string[]; signal: number }
export interface ExpansionFile {
  question: string
  prompt: string
  recipe: string
  generatedAt: string
  source: 'wikidata'
  stats: { fetched: number; alreadyHad: number; newAnswers: number; newAliases: number; skippedStoredInvalid: number; calibrationPairs: number; tierCounts: number[]; rankCorrelation: number | null }
  newAnswers: { name: string; tier: number; aliases: string[]; signal: number; qid: string }[]
  newAliases: { answer: string; alias: string }[]
}

export interface Recipe {
  question: string
  note: string
  /** SPARQL pattern that binds ?item */
  pattern?: string
  /** or a custom way to get the candidates */
  fetch?: () => Promise<Candidate[]>
  /** take English common names (P1843) as the answer's name when there is one (animals, plants) */
  commonNames?: boolean
  /** ignore things known in fewer Wikipedia languages than this */
  minSignal?: number
  /** extra ways players write the name, made from it ("X River", "Mount X") */
  alsoWritten?: (name: string) => string[]
  /** drop a candidate */
  skip?: (c: Candidate) => boolean
  /** the data is too loose to add NEW answers from (it mixes in things that are not valid): use it only for other names of answers we already have */
  aliasesOnly?: boolean
}

const RIVER_SEEDS = ['wd:Q97', 'wd:Q1247', 'wd:Q12630'] // Atlantic Ocean, Caribbean Sea, Gulf of Mexico (the rules include marginal seas)

// ---------------------------------------------------------------------------------------------------------------------------------
// fetching

const DETAIL_CHUNK = 250
/**
 * Two steps, because one big query with everything in it keeps timing out:
 *   1. which items belong (just their numbers),
 *   2. name, other names and "how many languages know it" for them, a few hundred at a time.
 */
async function fetchPattern(pattern: string, commonNames: boolean): Promise<Candidate[]> {
  const ids = (await sparql(`SELECT DISTINCT ?item WHERE { ${pattern} }`)).map((r) => idOf(r.item))
  return detailsOf(ids, commonNames)
}
async function detailsOf(ids: string[], commonNames: boolean, extra = ''): Promise<Candidate[]> {
  const out: Candidate[] = []
  for (let i = 0; i < ids.length; i += DETAIL_CHUNK) {
    const chunk = ids.slice(i, i + DETAIL_CHUNK)
    const rows: Row[] = await sparql(`
SELECT ?item ?label (GROUP_CONCAT(DISTINCT ?alt; separator="|") AS ?alts) (GROUP_CONCAT(DISTINCT ?cn; separator="|") AS ?cns) (MAX(?sl) AS ?links) WHERE {
  VALUES ?item { ${chunk.map((x) => 'wd:' + x).join(' ')} }
  ${extra}
  ?item rdfs:label ?label FILTER(lang(?label) = "en")
  OPTIONAL { ?item skos:altLabel ?alt FILTER(lang(?alt) = "en") }
  ${commonNames ? 'OPTIONAL { ?item wdt:P1843 ?cn FILTER(lang(?cn) = "en") }' : ''}
  ?item wikibase:sitelinks ?sl .
} GROUP BY ?item ?label`)
    out.push(...rows.map((r) => toCandidate(r, commonNames)))
  }
  return out
}
function toCandidate(r: Row, commonNames: boolean): Candidate {
  const alts = (r.alts ?? '').split('|').filter(Boolean)
  const cns = commonNames ? (r.cns ?? '').split('|').filter(Boolean) : []
  // animals and plants: the name people type is the common name; the scientific name stays as an alias
  const name = cns.length ? cns.sort((a, b) => a.length - b.length)[0] : r.label
  const aliases = [...new Set([...(cns.length ? [r.label] : []), ...cns, ...alts].filter((a) => a !== name))]
  return { id: idOf(r.item), name, aliases, signal: Number(r.links) || 0 }
}

/** all taxa below some parents (genus and species lists are walked one level at a time; a single path query times out) */
async function speciesBelow(roots: string[], extra = ''): Promise<Candidate[]> {
  let frontier = roots
  const seen = new Set<string>()
  const species: string[] = []
  for (let depth = 0; depth < 6 && frontier.length; depth++) {
    const next: string[] = []
    for (let i = 0; i < frontier.length; i += 150) {
      const chunk = frontier.slice(i, i + 150)
      const rows = await sparql(`SELECT ?c ?rank WHERE { VALUES ?p { ${chunk.map((x) => 'wd:' + x).join(' ')} } ?c wdt:P171 ?p . OPTIONAL { ?c wdt:P105 ?rank } FILTER NOT EXISTS { ?c wdt:P31 wd:Q23038290 } }`)
      for (const r of rows) {
        const id = idOf(r.c)
        if (seen.has(id)) continue
        seen.add(id)
        if (r.rank && idOf(r.rank) === 'Q7432') species.push(id) // species
        else next.push(id)
      }
    }
    frontier = next
  }
  return detailsOf(species, true, extra)
}

/** rivers that end in the Atlantic, the Caribbean or the Gulf of Mexico, directly or through other rivers (walked one level at a time) */
async function atlanticRivers(): Promise<Candidate[]> {
  let frontier = RIVER_SEEDS.map((x) => x.replace('wd:', ''))
  const seen = new Set<string>(frontier)
  const rivers: string[] = []
  for (let depth = 0; depth < 12 && frontier.length; depth++) {
    const next: string[] = []
    for (let i = 0; i < frontier.length; i += 300) {
      const chunk = frontier.slice(i, i + 300)
      const rows = await sparql(`SELECT DISTINCT ?c WHERE { VALUES ?p { ${chunk.map((x) => 'wd:' + x).join(' ')} } ?c wdt:P403 ?p }`) // anything with a "mouth" is a river or stream; a type filter here makes the query time out
      for (const r of rows) { const id = idOf(r.c); if (!seen.has(id)) { seen.add(id); next.push(id); rivers.push(id) } }
    }
    frontier = next
  }
  return detailsOf(rivers, false)
}

/** national teams that played at a men's World Cup: the signal is the number of tournaments they appear in */
async function worldCupTeams(): Promise<Candidate[]> {
  const years = [1930, 1934, 1938, 1950, 1954, 1958, 1962, 1966, 1970, 1974, 1978, 1982, 1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022, 2026]
  const values = years.map((y) => `"${y} FIFA World Cup"@en`).join(' ')
  const rows = await sparql(`SELECT ?t ?tl ?e WHERE { VALUES ?el { ${values} } ?e rdfs:label ?el . ?e wdt:P31 wd:Q27020041 . ?t wdt:P1344 ?e . ?t wdt:P31/wdt:P279* wd:Q6979593 . ?t rdfs:label ?tl FILTER(lang(?tl) = "en") }`)
  const times = new Map<string, { label: string; editions: Set<string> }>()
  for (const r of rows) {
    const cur = times.get(r.t) ?? { label: r.tl, editions: new Set<string>() }
    cur.editions.add(r.e)
    times.set(r.t, cur)
  }
  return [...times].map(([id, v]) => {
    // "Brazil men's national football team", "Germany men's national association football team", "United States men's national soccer team" -> the country
    const name = v.label.replace(/\s+(men's\s+)?national\s+(association\s+)?(football|soccer)\s+team$/i, '').replace(/\s+at the \d{4} FIFA World Cup$/i, '')
    const country = ({ Canadian: 'Canada', Cuban: 'Cuba', Emirates: 'United Arab Emirates' } as Record<string, string>)[name] ?? name
    return { id: idOf(id), name: country, aliases: country === v.label ? [] : [v.label], signal: v.editions.size }
  })
}

/** the 88 modern constellations (the class also holds old ones such as Argo Navis) */
const IAU88 = ['Andromeda', 'Antlia', 'Apus', 'Aquarius', 'Aquila', 'Ara', 'Aries', 'Auriga', 'Boötes', 'Caelum', 'Camelopardalis', 'Cancer', 'Canes Venatici', 'Canis Major', 'Canis Minor', 'Capricornus', 'Carina', 'Cassiopeia', 'Centaurus', 'Cepheus', 'Cetus', 'Chamaeleon', 'Circinus', 'Columba', 'Coma Berenices', 'Corona Australis', 'Corona Borealis', 'Corvus', 'Crater', 'Crux', 'Cygnus', 'Delphinus', 'Dorado', 'Draco', 'Equuleus', 'Eridanus', 'Fornax', 'Gemini', 'Grus', 'Hercules', 'Horologium', 'Hydra', 'Hydrus', 'Indus', 'Lacerta', 'Leo', 'Leo Minor', 'Lepus', 'Libra', 'Lupus', 'Lynx', 'Lyra', 'Mensa', 'Microscopium', 'Monoceros', 'Musca', 'Norma', 'Octans', 'Ophiuchus', 'Orion', 'Pavo', 'Pegasus', 'Perseus', 'Phoenix', 'Pictor', 'Pisces', 'Piscis Austrinus', 'Puppis', 'Pyxis', 'Reticulum', 'Sagitta', 'Sagittarius', 'Scorpius', 'Sculptor', 'Scutum', 'Serpens', 'Sextans', 'Taurus', 'Telescopium', 'Triangulum', 'Triangulum Australe', 'Tucana', 'Ursa Major', 'Ursa Minor', 'Vela', 'Virgo', 'Volans', 'Vulpecula']

// ---------------------------------------------------------------------------------------------------------------------------------
// the recipes: one per question where Wikidata knows the class. Questions with no class (junk drawer, wall outlet) are left to people.

const mount = (n: string) => (/^(mount|mt)\b/i.test(n) ? [] : [`Mount ${n}`, `Mt ${n}`, `${n} volcano`])
const riverForms = (n: string) => (/river|creek|stream/i.test(n) ? [] : [`${n} River`, `River ${n}`])

export const RECIPES: Recipe[] = [
  { question: 'animals-living-species-of', note: 'species of the venomous snake families Elapidae, Viperidae, Atractaspididae (living)', commonNames: true,
    fetch: () => speciesBelow(['Q186554', 'Q163656', 'Q840931'], 'FILTER NOT EXISTS { ?item wdt:P141 wd:Q237350 }') },
  { question: 'animals-living-species-of-4', note: 'living species of the order Carnivora (must have a conservation status that is not extinct)', commonNames: true,
    fetch: () => speciesBelow(['Q25306'], '?item wdt:P141 ?st FILTER(?st NOT IN (wd:Q237350, wd:Q239509))') },
  { question: 'food-apple-variety', note: 'instances of "apple cultivar"', pattern: '?item wdt:P31 wd:Q15731356' },
  { question: 'food-shape-or-type', note: 'instances of "type of pasta" (dumplings and noodles left out: the rules exclude them)', pattern: '?item wdt:P31 wd:Q2625877', skip: (c) => /wonton|pierogi|gyoza|dumpling|ramen|udon|soba|noodle|pelmeni|manti|momo|dim sum|potsticker/i.test(c.name) },
  { question: 'games-officially-released-trading', note: 'collectible card games that are not video games', pattern: '?item wdt:P31/wdt:P279* wd:Q734698 . FILTER NOT EXISTS { ?item wdt:P31/wdt:P279* wd:Q7889 }' },
  { question: 'games-playable-character-from', note: 'video game characters present in a Super Smash Bros. game (includes some non-fighters: check)',
    aliasesOnly: true,
    pattern: 'VALUES ?g { wd:Q870981 wd:Q1052131 wd:Q843131 wd:Q1195150 wd:Q54093632 } ?item wdt:P1441 ?g . ?item wdt:P31/wdt:P279* wd:Q1569167' },
  { question: 'history-ancient-egyptian-pharaoh', note: 'people whose position was pharaoh, died before 30 BCE or no death date',
    pattern: '?item wdt:P31 wd:Q5 . ?item wdt:P39 wd:Q37110 . OPTIONAL { ?item wdt:P570 ?d } FILTER(!BOUND(?d) || ?d < "-0029-01-01T00:00:00Z"^^xsd:dateTime)' },
  { question: 'history-civilization-that-existed', note: 'ancient civilizations, and archaeological cultures that ended before 1 CE',
    pattern: '{ ?item wdt:P31 wd:Q28171280 } UNION { ?item wdt:P31 wd:Q465299 . ?item wdt:P582 ?e . FILTER(?e < "0001-01-01T00:00:00Z"^^xsd:dateTime) }', minSignal: 2 },
  { question: 'movies-actor-who-has', note: 'people who received the Academy Award for Best Actor', pattern: '?item wdt:P31 wd:Q5 . ?item wdt:P166 wd:Q103916' },
  { question: 'movies-feature-film-directed', note: 'films directed by Alfred Hitchcock (not short films), known in at least 20 languages: Wikidata also lists TV items and films he only worked on, and those are known in fewer', minSignal: 20, pattern: '?item wdt:P57 wd:Q7374 . ?item wdt:P31/wdt:P279* wd:Q11424 . FILTER NOT EXISTS { ?item wdt:P31 wd:Q24862 }' },
  { question: 'music-instrument-traditionally-classified', note: 'types of woodwind instrument (subclasses), known in at least 3 languages; organs, harmonicas and police whistles left out', pattern: '?item wdt:P279+ wd:Q181247', minSignal: 3, skip: (c) => /organ|harmonica|accordion|police whistle|referee whistle|concertina|melodica/i.test(c.name) },
  { question: 'music-musical-genre-that', note: 'music genres from the United States with a start year before 1970', pattern: '?item wdt:P31/wdt:P279* wd:Q188451 . ?item wdt:P495 wd:Q30 . ?item wdt:P571 ?inc . FILTER(YEAR(?inc) < 1970)' },
  { question: 'places-active-volcano', note: 'volcanoes (of a volcano type) with a Smithsonian Global Volcanism Program ID', pattern: '?item wdt:P1886 ?gvp . ?item wdt:P31/wdt:P279* wd:Q8072', alsoWritten: mount },
  { question: 'places-river-that-empties', note: 'rivers flowing into the Atlantic, the Caribbean or the Gulf of Mexico, directly or through other rivers', fetch: atlanticRivers, alsoWritten: riverForms },
  { question: 'science-constellation-recognized-by', note: 'the 88 modern constellations (Latin names; other names from Wikidata)',
    fetch: async () => {
      const all = await fetchPattern('?item wdt:P31 wd:Q8928', false)
      const want = new Set(IAU88.map(normalize))
      return all.map((c) => ({ ...c, name: c.name.replace(/\s*\(constellation\)$/i, '') })).filter((c) => want.has(normalize(c.name)))
    } },
  { question: 'science-programming-language-that', note: 'programming languages that are not esoteric, known in at least 3 languages', pattern: '?item wdt:P31/wdt:P279* wd:Q9143 . FILTER NOT EXISTS { ?item wdt:P31/wdt:P279* wd:Q610140 }', minSignal: 3 },
  { question: 'sports-national-football-team', note: 'national men\'s teams that played at a FIFA World Cup (signal = number of tournaments)', fetch: worldCupTeams },
  { question: 'sports-position-played-in', note: 'association football positions (not roles such as captain)', pattern: '?item wdt:P31 wd:Q4611891', skip: (c) => /captain|manager|coach|referee/i.test(c.name) },
  { question: 'transport-class-of-naval', note: 'types of warship (subclasses of warship that are ship types), known in at least 4 languages; the root "warship" is the subject word of the question and is left out', minSignal: 4, skip: (c) => /^warships?$|warships$/i.test(c.name), pattern: '?item wdt:P279* wd:Q2031121 . ?item wdt:P31 wd:Q2235308' },
  { question: 'transport-international-commercial-airline', note: 'airlines with an IATA code that have not ceased', pattern: '?item wdt:P31 wd:Q46970 . ?item wdt:P229 ?iata . FILTER NOT EXISTS { ?item wdt:P576 ?end }' },
]

// ---------------------------------------------------------------------------------------------------------------------------------
// merging with what the bank already has, and giving new answers a tier

export interface Existing { answers: Map<string, { name: string; tier: number }>; forms: Map<string, string>; invalid: Set<string>; loose: Map<string, string> }

export function loadExisting(db: Database.Database, qid: string): Existing {
  const answers = new Map<string, { name: string; tier: number }>()
  const forms = new Map<string, string>()
  const invalid = new Set<string>()
  for (const a of db.prepare('SELECT norm, name, tier FROM answers WHERE question_id = ?').all(qid) as { norm: string; name: string; tier: number }[]) { answers.set(a.norm, { name: a.name, tier: a.tier }); forms.set(a.norm, a.norm) }
  for (const s of db.prepare('SELECT norm, verdict, canon_norm FROM spellings WHERE question_id = ?').all(qid) as { norm: string; verdict: string; canon_norm: string | null }[]) {
    if (s.verdict === 'invalid') invalid.add(s.norm)
    else if (s.canon_norm) forms.set(s.norm, s.canon_norm)
  }
  const loose = new Map<string, string>()
  for (const [f, c] of forms) loose.set(looseKey(f), c)
  return { answers, forms, invalid, loose }
}
/** which existing answer (its normalised name) does this written form belong to? */
const belongsTo = (ex: Existing, text: string): string | undefined => { const n = normalize(text); return ex.forms.get(n) ?? ex.loose.get(looseKey(n)) }

/** Spearman rank correlation of (how well known, tier) over the answers we already have: negative and large = the signal predicts the tier well */
export function rankCorrelation(pairs: { signal: number; tier: number }[]): number | null {
  if (pairs.length < 8) return null
  const rank = (xs: number[]) => { const idx = xs.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]); const r = new Array<number>(xs.length); let i = 0; while (i < idx.length) { let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++; for (let k = i; k <= j; k++) r[idx[k][1]] = (i + j) / 2; i = j + 1 } return r }
  const a = rank(pairs.map((p) => p.signal)), b = rank(pairs.map((p) => p.tier))
  const n = a.length, ma = a.reduce((x, y) => x + y, 0) / n, mb = b.reduce((x, y) => x + y, 0) / n
  let num = 0, da = 0, db = 0
  for (let i = 0; i < n; i++) { num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2 }
  return da && db ? Math.round((num / Math.sqrt(da * db)) * 100) / 100 : null
}

/**
 * Tier for a new answer, from how well known it is (the signal) compared with the answers this question already has.
 * Rank matching: the existing answers are put in order of how well known they are, and the question's own tier counts are laid
 * over that order (the best-known ones are tier 0, the next few tier 1, ...). The new answer takes the tier of the place it would
 * stand in. Better known than all of them: the first tier; less known than all of them: the rarest tier, because that is
 * what "almost nobody would say it" means. This keeps the question's own idea of each tier (the generator's labels are noisy
 * one answer at a time, but follow the ordering well: about -0.7 rank correlation with the number of languages).
 */
export function tierFromPairs(signal: number, pairs: { signal: number; tier: number }[]): number {
  if (!pairs.length) return 3
  const counts = [0, 1, 2, 3, 4, 5].map((t) => pairs.filter((p) => p.tier === t).length)
  const assigned: number[] = []
  counts.forEach((n, t) => { for (let i = 0; i < n; i++) assigned.push(t) })
  const sorted = [...pairs].sort((a, b) => b.signal - a.signal)
  const place = sorted.findIndex((p) => p.signal <= signal)
  return place < 0 ? 5 : assigned[place]
}

export function expand(qid: string, prompt: string, recipe: Recipe, cands: Candidate[], ex: Existing): ExpansionFile {
  const minSignal = recipe.minSignal ?? 1
  const aliasSeen = new Set<string>()
  const pairs: { signal: number; tier: number }[] = []
  const fresh: Candidate[] = []
  const newAliases: { answer: string; alias: string }[] = []
  let alreadyHad = 0
  let skippedInvalid = 0
  const ok = (a: string) => a.length >= 3 && a.length <= 60 && /\p{L}/u.test(a) && !/[()\[\]{}<>@#]/.test(a)

  for (const c of cands) {
    if (recipe.skip?.(c)) continue
    const names = [c.name, ...c.aliases]
    const hit = names.map((n) => belongsTo(ex, n)).find(Boolean)
    if (hit) {
      alreadyHad++
      pairs.push({ signal: c.signal, tier: ex.answers.get(hit)!.tier })
      // other names Wikidata knows for an answer we already have
      for (const n of [...names, ...(recipe.alsoWritten?.(c.name) ?? [])]) {
        const nn = normalize(n)
        if (!ok(n) || ex.forms.has(nn) || ex.loose.has(looseKey(nn)) || ex.invalid.has(nn) || aliasSeen.has(nn)) continue
        aliasSeen.add(nn)
        newAliases.push({ answer: ex.answers.get(hit)!.name, alias: n })
      }
      continue
    }
    if (c.signal < minSignal || !ok(c.name)) continue
    if (ex.invalid.has(normalize(c.name))) { skippedInvalid++; continue }
    fresh.push(c)
  }
  if (recipe.aliasesOnly) fresh.length = 0
  // a new answer must not take the name of something already written another way, or of another new answer
  const taken = new Set<string>()
  const newAnswers: ExpansionFile['newAnswers'] = []
  for (const c of fresh.sort((a, b) => b.signal - a.signal)) {
    const key = looseKey(normalize(c.name))
    if (taken.has(key) || ex.loose.has(key)) continue
    taken.add(key)
    const aliases = [...new Set([...c.aliases, ...(recipe.alsoWritten?.(c.name) ?? [])])].filter((a) => {
      const n = normalize(a)
      const k = looseKey(n)
      if (!ok(a) || n === normalize(c.name) || ex.forms.has(n) || ex.loose.has(k) || ex.invalid.has(n) || taken.has(k) || aliasSeen.has(n)) return false
      aliasSeen.add(n)
      return true
    })
    for (const a of aliases) taken.add(looseKey(normalize(a)))
    newAnswers.push({ name: c.name, tier: tierFromPairs(c.signal, pairs), aliases, signal: c.signal, qid: c.id })
  }
  const tierCounts = [0, 1, 2, 3, 4, 5].map((t) => newAnswers.filter((a) => a.tier === t).length)
  return { question: qid, prompt, recipe: recipe.note, generatedAt: new Date().toISOString(), source: 'wikidata',
    stats: { fetched: cands.length, alreadyHad, newAnswers: newAnswers.length, newAliases: newAliases.length, skippedStoredInvalid: skippedInvalid, calibrationPairs: pairs.length, tierCounts, rankCorrelation: rankCorrelation(pairs) },
    newAnswers, newAliases }
}

// ---------------------------------------------------------------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2)
  const arg = (n: string) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : undefined }
  const out = arg('out') ?? 'C:/Users/weibi/minitude/list-build'
  const only = arg('only')
  const cached = args.includes('--cached')
  mkdirSync(out, { recursive: true })
  const db = new Database(arg('db') ?? defaultDbFile(), { readonly: true, fileMustExist: true })
  for (const r of RECIPES) {
    if (only && r.question !== only) continue
    const q = db.prepare("SELECT prompt FROM questions WHERE id = ? AND status = 'approved'").get(r.question) as { prompt: string } | undefined
    if (!q) { console.log(`skip ${r.question}: not an approved question in this database`); continue }
    const t0 = Date.now()
    try {
      // what Wikidata returned is kept in <out>/raw, so the merging can be re-run (--cached) without asking Wikidata again
      const rawFile = join(out, 'raw', r.question + '.json')
      let cands: Candidate[]
      if (cached && !existsSync(rawFile)) { console.log(r.question.padEnd(44) + ' no cached data yet: skipped'); continue }
      if (cached) cands = JSON.parse(readFileSync(rawFile, 'utf8')) as Candidate[]
      else {
        cands = r.fetch ? await r.fetch() : await fetchPattern(r.pattern!, !!r.commonNames)
        mkdirSync(join(out, 'raw'), { recursive: true })
        writeFileSync(rawFile, JSON.stringify(cands))
      }
      // one candidate per Wikidata item (paging can repeat an item with different groupings)
      const byId = new Map<string, Candidate>()
      for (const c of cands) if (!byId.has(c.id)) byId.set(c.id, c)
      const file = expand(r.question, q.prompt, r, [...byId.values()], loadExisting(db, r.question))
      writeFileSync(join(out, `${r.question}.json`), JSON.stringify(file, null, 1))
      const s = file.stats
      console.log(`${r.question.padEnd(44)} fetched ${String(s.fetched).padStart(5)} | already had ${String(s.alreadyHad).padStart(4)} | NEW ${String(s.newAnswers).padStart(5)} (tiers ${s.tierCounts.join('/')}) | new aliases ${String(s.newAliases).padStart(5)} | corr ${s.rankCorrelation ?? 'n/a'} | ${((Date.now() - t0) / 1000).toFixed(0)} s`)
    } catch (e) {
      console.log(`${r.question.padEnd(44)} FAILED: ${(e instanceof Error ? e.message : String(e)).slice(0, 140)}`)
    }
  }
  db.close()
}

if (process.argv[1] && /expand[\\/]build\.ts$/.test(process.argv[1])) main().catch((e) => { console.error(e); process.exit(1) })
