// Draft helper: for each question take the 3 most obscure candidates that have an English Wikipedia article (known in 3 to 20 languages),
// and read the article's summary (one request at a time, honouring the rate limit). Output: gems/finalists.json
const fs = require('fs'), path = require('path')
const ROOT = path.join(__dirname, '..')
const UA = 'MinitudeDraft/1.0 (answer-list fact check)'
const hash = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) } return (h >>> 0) / 4294967296 }
const cacheFile = path.join(ROOT, 'gems', 'pool-cache.json'), cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'))
const save = () => fs.writeFileSync(cacheFile, JSON.stringify(cache))
const pool = JSON.parse(fs.readFileSync(path.join(ROOT, 'gems', process.env.POOL || 'pool.json'), 'utf8'))
const PER = +process.env.PER || 3, LO = +process.env.LO || 3, HI = +process.env.HI || 20
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function summary(title) {
  for (let a = 0; a < 12; a++) {
    try {
      const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title.replace(/ /g, '_')) + '?redirect=true', { headers: { 'user-agent': UA, accept: 'application/json' } })
      if (r.status === 429 || r.status >= 500) { const w = (+r.headers.get('retry-after') || 10) * 1000 + 800; process.stdout.write('[wait ' + Math.round(w / 1000) + 's]'); await sleep(w); continue }
      if (r.status === 404) return { type: 'missing', extract: '' }
      return await r.json()
    } catch (e) { await sleep(2000) }
  }
  return null
}
;(async () => {
  const picks = []
  pool.forEach((q, n) => {
    const ok = q.items.filter((x) => x.title && x.langs >= LO && x.langs <= HI).sort((a, b) => a.langs - b.langs || hash(q.id + a.name) - hash(q.id + b.name))
    picks.push({ n, id: q.id, prompt: q.prompt, category: q.category, cands: ok.slice(0, PER) })
  })
  const titles = [...new Set(picks.flatMap((p) => p.cands.map((c) => c.title)))].filter((t) => !cache.ex[t])
  console.log('questions', picks.length, '| with no candidate:', picks.filter((p) => !p.cands.length).map((p) => p.n).join(',') || 'none', '| articles to read:', titles.length)
  // 20 articles per request (far fewer requests than one per article, which is what the rate limit counts)
  for (let i = 0; i < titles.length; i += 20) {
    const chunk = titles.slice(i, i + 20)
    let d = null
    for (let a = 0; a < 12 && !d; a++) {
      try {
        const r = await fetch('https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&exsentences=3&exlimit=20&redirects=1&format=json&titles=' + encodeURIComponent(chunk.join('|')), { headers: { 'user-agent': UA, accept: 'application/json' } })
        if (r.status === 429 || r.status >= 500) { const w = (+r.headers.get('retry-after') || 10) * 1000 + 800; process.stdout.write('[wait ' + Math.round(w / 1000) + 's]'); await sleep(w); continue }
        d = await r.json()
      } catch (e) { await sleep(2000) }
    }
    if (!d) { console.log('skipped a batch'); continue }
    const q = d.query || {}, redir = {}; for (const r of [...(q.normalized || []), ...(q.redirects || [])]) redir[r.from] = r.to
    const resolve = (t) => { let x = t, n = 0; while (redir[x] && n++ < 5) x = redir[x]; return x }
    const byTitle = {}; for (const p of Object.values(q.pages || {})) byTitle[p.title] = p
    for (const t of chunk) { const p = byTitle[resolve(t)]; cache.ex[t] = p && p.extract ? p.extract : '' }
    save(); process.stdout.write('.')
    await sleep(1500)
  }
  console.log()
  for (const p of picks) p.cands = p.cands.map((c) => ({ name: c.name, langs: c.langs, title: c.title, wd: c.wd, extract: cache.ex[c.title] || '' }))
  fs.writeFileSync(path.join(ROOT, 'gems', process.env.FINALISTS || 'finalists.json'), JSON.stringify(picks))
  console.log('saved gems/finalists.json')
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
