// Draft helper. For every question, take Mythic answers, find their English Wikipedia article and how many Wikipedia languages have the thing,
// and save the article's opening sentences. Output: gems/pool.json (cached in gems/pool-cache.json so it can be resumed).
// Network: only Wikipedia and Wikidata, a generic client name, nothing about the project or its owner is sent (only article titles and Wikidata ids).
const fs = require('fs'), path = require('path')
const ROOT = path.join(__dirname, '..'), LB = path.join(ROOT, '..', '..', 'list-build')
const UA = 'MinitudeDraft/1.0 (answer-list fact check)'
const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
const hash = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) } return (h >>> 0) / 4294967296 }
const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(',').map(Number)) : null, BAND = (process.env.BAND || '3-40').split('-').map(Number), SAMPLE = +process.env.SAMPLE || 36, OUTFILE = process.env.OUT || 'pool.json'
const cacheFile = path.join(ROOT, 'gems', 'pool-cache.json')
const cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : { wd: {}, ex: {}, tt: {} }
const save = () => fs.writeFileSync(cacheFile, JSON.stringify(cache))
const NOT_LANG = new Set(['commons', 'species', 'meta', 'wikidata', 'mediawiki', 'incubator', 'foundation', 'outreach', 'strategy', 'test', 'be_x_old', 'simple'])
const langCount = (sl) => Object.keys(sl || {}).filter((k) => /wiki$/.test(k) && !NOT_LANG.has(k.replace(/wiki$/, ''))).length

async function api(url) {
  for (let a = 0; a < 8; a++) {
    try { const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' } }); if (r.status === 429 || r.status >= 500) { const wait = (+r.headers.get('retry-after') || 5 * (a + 1)) * 1000 + 500; process.stdout.write('[wait ' + Math.round(wait / 1000) + 's]'); await new Promise((s) => setTimeout(s, wait)); continue } return await r.json() } catch (e) { await new Promise((s) => setTimeout(s, 1000 * (a + 1))) }
  }
  console.log('skipping a failed batch'); return {}
}
async function pool(items, size, conc, fn) { const chunks = []; for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size)); let k = 0; await Promise.all(Array.from({ length: conc }, async () => { while (k < chunks.length) { const c = chunks[k++]; await fn(c) } })) }

;(async () => {
  const cand = require('../gems/candidates.json')
  const shadow = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'gems', 'shadow-answers.json'), 'utf8')).map((s) => s.q + '|' + norm(s.rare)))
  const out = [], need = { ids: new Set(), titles: new Set() }
  const questions = []
  // 1) which answers to look at
  for (const [idx, c] of cand.entries()) {
    if (ONLY && !ONLY.has(idx)) { questions.push({ id: c.id, prompt: c.prompt, category: c.category, batch: c.batch, mythic: 0, items: [] }); continue }
    const isOrig = c.batch === 'original'
    let bank
    if (!isOrig) bank = JSON.parse(fs.readFileSync(path.join(LB, c.batch, 'bank.json'), 'utf8')).questions.find((q) => q.id === c.id)
    else bank = JSON.parse(fs.readFileSync(path.join(ROOT, '..', 'packages', 'server', 'data', 'approved-questions.json'), 'utf8')).questions.find((q) => q.id === c.id)
    const myth = bank.answers.filter((a) => a.tier === 5)
    const sig = new Map()
    if (!isOrig) { try { for (const r of JSON.parse(fs.readFileSync(path.join(LB, c.batch, 'raw', c.id + '.json'), 'utf8'))) for (const n of [r.name, ...(r.aliases || [])]) { const k = norm(n); const e = sig.get(k); if (!e || e.signal < r.signal) sig.set(k, { id: r.id, signal: r.signal, desc: r.desc || '' }) } } catch (e) { /* no raw file */ } }
    let list = myth.map((a) => { const m = sig.get(norm(a.name)); return { name: a.name, aliases: a.aliases || [], id: m && m.id, signal: m ? m.signal : null, wd: m ? m.desc : '' } })
      .filter((x) => !shadow.has(c.id + '|' + norm(x.name)) && x.name.length <= 34 && !/\d{3,}/.test(x.name))
    if (!isOrig) {
      let pool1 = list.filter((x) => x.id && x.signal >= BAND[0] && x.signal <= BAND[1])
      if (pool1.length < 25) pool1 = list.filter((x) => x.id && x.signal >= 1 && x.signal <= Math.max(BAND[1], 12))
      list = pool1
    }
    list = list.sort((a, b) => hash(c.id + a.name) - hash(c.id + b.name)).slice(0, isOrig ? 30 : SAMPLE)
    questions.push({ id: c.id, prompt: c.prompt, category: c.category, batch: c.batch, mythic: myth.length, items: list })
    for (const x of list) { if (x.id) need.ids.add(x.id); else need.titles.add(x.name) }
  }
  console.log('questions', questions.length, '| wikidata ids to look up', need.ids.size, '| names to look up by title', need.titles.size)
  // 2) titles of the original 22's answers -> wikidata ids
  const tt = [...need.titles].filter((t) => !(t in cache.tt))
  await pool(tt, 20, 3, async (chunk) => {
    const d = await api('https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&redirects=1&format=json&titles=' + encodeURIComponent(chunk.join('|')))
    const q = d.query || {}, redir = {}; for (const r of [...(q.normalized || []), ...(q.redirects || [])]) redir[r.from] = r.to
    const resolve = (t) => { let x = t, n = 0; while (redir[x] && n++ < 5) x = redir[x]; return x }
    const byTitle = {}; for (const p of Object.values(q.pages || {})) byTitle[p.title] = p
    for (const t of chunk) { const p = byTitle[resolve(t)]; cache.tt[t] = p && p.pageprops && p.pageprops.wikibase_item ? p.pageprops.wikibase_item : null }
  }); save()
  for (const q of questions) for (const x of q.items) if (!x.id && cache.tt[x.name]) { x.id = cache.tt[x.name]; need.ids.add(x.id) }
  // 3) sitelinks from wikidata
  const ids = [...need.ids].filter((i) => !(i in cache.wd))
  console.log('looking up', ids.length, 'wikidata items ...')
  let done = 0
  await pool(ids, 40, 2, async (chunk) => {
    const d = await api('https://www.wikidata.org/w/api.php?action=wbgetentities&props=sitelinks&format=json&ids=' + chunk.join('|'))
    for (const id of chunk) { const e = d.entities && d.entities[id]; cache.wd[id] = e && e.sitelinks ? { langs: langCount(e.sitelinks), en: e.sitelinks.enwiki ? e.sitelinks.enwiki.title : null } : { langs: 0, en: null } }
    done += chunk.length; if (done % 500 < 50) { save(); process.stdout.write('.') }
  }); save(); console.log()
  // 4) article openings from wikipedia
  // 5) assemble
  for (const q of questions) q.items = q.items.map((x) => { const w = x.id && cache.wd[x.id]; return { name: x.name, aliases: x.aliases, wd: x.wd || '', id: x.id || null, langs: w ? w.langs : null, title: w ? w.en : null, extract: w && w.en ? cache.ex[w.en] || '' : '' } })
  fs.writeFileSync(path.join(ROOT, 'gems', OUTFILE), JSON.stringify(questions))
  const withArt = questions.map((q) => q.items.filter((i) => i.extract && i.extract.length > 50).length)
  console.log('saved gems/pool.json | questions with no candidate that has an article:', withArt.map((n, i) => (n === 0 ? i : -1)).filter((i) => i >= 0).join(',') || 'none')
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
