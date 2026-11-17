/**
 * Pieces shared by the question recipes (batch2.ts, batch3.ts ...): ways to ask Wikidata for a class, and ways to write an answer.
 * See docs/ANSWER_LISTS.md for what was learned: check how a FAMOUS example is filed in Wikidata before choosing the class.
 */
import type { Candidate } from './build'

/** instances of a class or of any of its subclasses, and the subclasses themselves (a "baguette" is a kind of bread, not an instance of it) */
export const kindOf = (q: string) => `{ ?item wdt:P31/wdt:P279* wd:${q} } UNION { ?item wdt:P279+ wd:${q} } .`

/** instances of a class or of any of its subclasses */
export const instanceOf = (q: string) => `?item wdt:P31/wdt:P279* wd:${q} .`

/** items that are an instance of (or a subclass of) ANY of these classes */
export const anyKind = (...qs: string[]) => `{ ${qs.map((q) => `{ ?item wdt:P31/wdt:P279* wd:${q} } UNION { ?item wdt:P279+ wd:${q} }`).join(' UNION ')} } .`

/** items that are directly an instance of ANY of these classes */
export const anyInstance = (...qs: string[]) => `{ ${qs.map((q) => `{ ?item wdt:P31 wd:${q} }`).join(' UNION ')} } .`

/** people by occupation: a short list of exact occupations is much cheaper for Wikidata than walking every subclass of "scientist" */
export const occupation = (...ids: string[]) => `VALUES ?occ { ${ids.map((i) => 'wd:' + i).join(' ')} } ?item wdt:P106 ?occ .`

/** people whose occupation is a kind of (for example) "athletics competitor": sprinters, hurdlers, high jumpers ... are subclasses of it */
export const occupationUnder = (q: string) => `?item wdt:P106 ?occ . ?occ wdt:P279* wd:${q} .`

/** people who held a position that is a kind of (for example) "president": the position, not the person, is the class */
export const heldPosition = (q: string) => `?item wdt:P39 ?pos . ?pos wdt:P279* wd:${q} .`

export const NOT_EXTINCT = 'FILTER NOT EXISTS { ?item wdt:P141 wd:Q237350 }'

/**
 * Dishes of a cuisine: filed under the cuisine (P2012), part of it (P361: regional cuisines are parts or subclasses of it) or from its country
 * (P495), and ONLY if the item is a dish (ingredients, techniques and products leaked in without that: Batch 5, lesson 20).
 */
export const cuisineDishes = (cuisine: string, country: string) =>
  `{ { ?item wdt:P2012 ?cu . ?cu (wdt:P279|wdt:P361)* wd:${cuisine} } UNION { ?item wdt:P361 wd:${cuisine} } UNION { ?item wdt:P495 wd:${country} } } . { ?item wdt:P31/wdt:P279* wd:Q746549 } UNION { ?item wdt:P279+ wd:Q746549 } .`

/** works of a franchise or series: the item is a (fictional) character that appears in it (P1441, "present in work"), or belongs to its universe (P1080) */
export const characterIn = (...works: string[]) =>
  `{ ${works.map((w) => `{ ?item wdt:P1441 wd:${w} } UNION { ?item wdt:P1080 wd:${w} } UNION { ?gx wdt:P179 wd:${w} . ?item wdt:P1441 ?gx }`).join(' UNION ')} } . ?item wdt:P31/wdt:P279* wd:Q95074 .`

/** a song or other musical work by an artist (performer P175 or author P86) */
export const songsBy = (artist: string) => `{ ?item wdt:P175 wd:${artist} } UNION { ?item wdt:P86 wd:${artist} } ?item wdt:P31/wdt:P279* wd:Q105543609 .`

/** people: only humans (Wikidata also gives an "occupation" to fictional characters: Wonder Woman is an "astronaut") */
export const HUMAN = ' ?item wdt:P31 wd:Q5 .'

/**
 * Wikidata gives people every occupation they ever had, so a president or an actor can be a "baseball player", a "composer" or a "scientist".
 * Keep a person only if Wikidata's one-line description names the activity ("American cricketer"); one with no description is kept, and a
 * hand-listed answer is never dropped (newq.ts). `but` also drops a description that matches it (an "ice hockey" regex must not keep "field hockey").
 */
export const notDescribedAs = (re: RegExp, but?: RegExp) => (c: Candidate) => !!c.desc && (!re.test(c.desc) || !!but?.test(c.desc))

/** drop an answer by its name */
export const nameIs = (re: RegExp) => (c: Candidate) => re.test(c.name)

/** drop an answer if ANY of these says so */
export const anyOf = (...fs: ((c: Candidate) => boolean)[]) => (c: Candidate) => fs.some((f) => f(c))

/**
 * A plant or animal that is listed under its Latin name ("Prunus domestica", or a whole genus: "Citrus") and described as a taxon.
 * The ending test keeps English names that look the same ("Holy basil", "Black pepper", "Chinese kale").
 */
export const latinTaxon = (c: Candidate) => {
  const d = c.desc ?? ''
  if (/^genus\b/i.test(d) && /^[A-Z][a-z]+$/.test(c.name)) return true
  return /^(species|hybrid|subspecies|variety|cultivar)\b/i.test(d) &&
    /^[A-Z][a-z]+ (× )?[a-z-]*(um|us|is|ii|ae|ens|ata|are|inale|a|i|ix|ica|osa|ana|ina|sis|ra|ea)( (var|subsp)\. [a-z-]+)?( '[^']+')?$/.test(c.name)
}

/** a species known only by its Latin name and almost nobody has written about: not an answer a player will ever type */
export const latinOnly = (c: { name: string; signal: number }) => /^[A-Z][a-z]+ [a-z-]+( [a-z-]+)?$/.test(c.name) && c.signal < 5

const SUFFIX = /^(Jr\.?|Sr\.?|II|III|IV|V|VI|the Great)$/i
/** "Lionel Messi" -> "Messi": people are usually named by their surname */
export const personForms = (n: string): string[] => {
  const t = n.replace(/\(.*?\)/g, '').trim().split(/\s+/)
  if (t.length < 2) return []
  let i = t.length - 1
  while (i > 0 && SUFFIX.test(t[i])) i--
  const last = t[i]
  return last.length >= 4 && !/\d/.test(last) ? [last] : []
}

/** another way to write a name with part of it taken off ("Mount Everest" -> "Everest") */
export const strip = (re: RegExp) => (n: string): string[] => {
  const m = n.replace(re, '').trim()
  return m !== n && m.length >= 3 ? [m] : []
}
