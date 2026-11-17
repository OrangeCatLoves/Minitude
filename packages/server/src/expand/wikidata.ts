/**
 * A small, polite client for Wikidata (structured data, CC0 / public domain): SPARQL queries and entity search.
 * Used only by the OFFLINE list builder (expand/build.ts), never by the running game.
 * The client name is generic on purpose; no personal details are sent.
 */
const UA = 'MinitudeListBuilder/0.1 (offline answer-list building for a trivia game)'
const SPARQL = 'https://query.wikidata.org/sparql'
const API = 'https://www.wikidata.org/w/api.php'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
let lastCall = 0
/** at most one request a second */
async function throttle(): Promise<void> {
  const wait = lastCall + 1000 - Date.now()
  if (wait > 0) await sleep(wait)
  lastCall = Date.now()
}

export type Row = Record<string, string>

/** Runs a SPARQL query and returns each result row as {variable: value}. Retries when the service is busy or times out. */
export async function sparql(query: string, tries = 5): Promise<Row[]> {
  let last: unknown
  for (let i = 0; i < tries; i++) {
    await throttle()
    try {
      const res = await fetch(SPARQL, {
        method: 'POST',
        headers: { 'user-agent': UA, accept: 'application/sparql-results+json', 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ query }).toString(),
        signal: AbortSignal.timeout(90_000),
      })
      if (res.status === 429 || res.status >= 500) {
        last = new Error('wikidata http ' + res.status)
        // the service says how long to wait; do exactly that (at most two minutes), plus a little
        const asked = Number(res.headers.get('retry-after'))
        await sleep(Math.min(120_000, (Number.isFinite(asked) && asked > 0 ? asked * 1000 : 8000 * (i + 1)) + 1000))
        continue
      }
      if (!res.ok) throw new Error(`wikidata http ${res.status}: ${(await res.text()).slice(0, 300)}`)
      const text = await res.text()
      let body: { results: { bindings: Record<string, { value: string }>[] } }
      try { body = JSON.parse(text) } catch (e) {
        // now and then one label holds a raw control character, which JSON does not allow inside a string: read it as a space instead of failing the whole question
        if (e instanceof SyntaxError && /control character/i.test(e.message)) body = JSON.parse(text.replace(/[\u0000-\u001f]/g, ' '))
        else throw e
      }
      return body.results.bindings.map((b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.value])))
    } catch (e) {
      last = e
      if (e instanceof Error && /http 4\d\d/.test(e.message) && !/429/.test(e.message)) throw e
      // an answer cut off in the middle (the service hit its 60 s limit while sending): asking the same thing again is cut off in the same place.
      // Fail at once so that the caller can ask for a smaller part (idsInBands splits the band in two).
      if (e instanceof SyntaxError) throw e
      await sleep(3000 * (i + 1))
    }
  }
  throw last instanceof Error ? last : new Error(String(last))
}

/** Finds Wikidata items by name (to look up the Q-number of a class when writing a recipe). */
export async function searchEntity(term: string, limit = 5): Promise<{ id: string; label: string; description: string }[]> {
  await throttle()
  await sleep(2500) // the search API is stricter than the query service
  const url = `${API}?action=wbsearchentities&format=json&language=en&uselang=en&limit=${limit}&search=${encodeURIComponent(term)}`
  const res = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(30_000) })
  if (!res.ok) throw new Error('wikidata search http ' + res.status)
  const body = (await res.json()) as { search?: { id: string; label?: string; description?: string }[] }
  return (body.search ?? []).map((s) => ({ id: s.id, label: s.label ?? '', description: s.description ?? '' }))
}

export const qid = (uri: string) => uri.replace(/^.*\//, '')
