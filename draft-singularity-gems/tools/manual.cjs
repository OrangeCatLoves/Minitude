// Draft helper: look at the Mythic answers of one question on English Wikipedia and print those whose article text matches a keyword.
//   node tools/manual.cjs <question number> "<regex>" [max names to look up] [all]
// With "all" the answers are not filtered by the regex (for small lists). Names are taken least-known first (by Wikidata language count when known).
const fs = require('fs'), path = require('path')
const ROOT = path.join(__dirname, '..'), LB = path.join(ROOT, '..', '..', 'list-build')
const UA = 'MinitudeDraft/1.0 (answer-list fact check)'
const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const cand = require('../gems/candidates.json')
const [n, rx, maxArg, all] = process.argv.slice(2), MAX = +maxArg || 100, re = new RegExp(rx || '.', 'i')
async function extracts(titles) {
  for (let a = 0; a < 12; a++) {
    try {
      const r = await fetch('https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&exsentences=2&exlimit=20&redirects=1&format=json&titles=' + encodeURIComponent(titles.join('|')), { headers: { 'user-agent': UA } })
      if (r.status === 429 || r.status >= 500) { const w = (+r.headers.get('retry-after') || 10) * 1000 + 800; await sleep(w); continue }
      return await r.json()
    } catch (e) { await sleep(2000) }
  }
  return {}
}
;(async () => {
  const c = cand[+n], isOrig = c.batch === 'original'
  const bank = JSON.parse(fs.readFileSync(isOrig ? path.join(ROOT, '..', 'packages', 'server', 'data', 'approved-questions.json') : path.join(LB, c.batch, 'bank.json'), 'utf8')).questions.find((q) => q.id === c.id)
  const sig = new Map()
  if (!isOrig) { try { for (const r of JSON.parse(fs.readFileSync(path.join(LB, c.batch, 'raw', c.id + '.json'), 'utf8'))) sig.set(norm(r.name), r.signal) } catch (e) { /* none */ } }
  let names = bank.answers.filter((a) => a.tier === 5).map((a) => a.name).filter((x) => x.length <= 34)
  names = names.sort((a, b) => (sig.get(norm(a)) ?? 999) - (sig.get(norm(b)) ?? 999)).slice(0, MAX)
  console.log('question', n, c.id, '| Mythic answers looked at:', names.length)
  for (let i = 0; i < names.length; i += 20) {
    const chunk = names.slice(i, i + 20), d = await extracts(chunk), q = d.query || {}, redir = {}
    for (const r of [...(q.normalized || []), ...(q.redirects || [])]) redir[r.from] = r.to
    const resolve = (t) => { let x = t, k = 0; while (redir[x] && k++ < 5) x = redir[x]; return x }
    const byTitle = {}; for (const p of Object.values(q.pages || {})) byTitle[p.title] = p
    for (const t of chunk) { const p = byTitle[resolve(t)]; if (p && p.extract && (all || re.test(p.extract.slice(0, 260))) && !/may refer to/.test(p.extract)) console.log('  ' + t + ' (' + (sig.get(norm(t)) ?? '?') + ') [' + p.title + '] ' + p.extract.replace(/\s+/g, ' ').slice(0, 150)) }
    await sleep(1200)
  }
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
