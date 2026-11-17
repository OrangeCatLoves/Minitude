// Draft helper: for questions whose obscure answers have no Wikidata language links (Simpsons, Mario, Queen, ABBA), look the Mythic answers
// up on English Wikipedia by title and keep those with a real article that mentions the right subject. Output: gems/manual6.json
const fs = require('fs'), path = require('path')
const ROOT = path.join(__dirname, '..'), LB = path.join(ROOT, '..', '..', '..', 'list-build')
const UA = 'MinitudeDraft/1.0 (answer-list fact check)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const cand = require('../gems/candidates.json')
const JOBS = [[20, /simpsons/i], [91, /mario|nintendo|super mario|yoshi|koopa/i], [115, /queen|freddie|brian may|roger taylor|john deacon/i], [165, /abba|swedish pop|agnetha|bj[oö]rn|benny|anni-frid/i]]
async function extracts(titles) {
  for (let a = 0; a < 12; a++) {
    try {
      const r = await fetch('https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&exsentences=2&exlimit=20&redirects=1&format=json&titles=' + encodeURIComponent(titles.join('|')), { headers: { 'user-agent': UA } })
      if (r.status === 429 || r.status >= 500) { const w = (+r.headers.get('retry-after') || 10) * 1000 + 800; process.stdout.write('[wait ' + Math.round(w / 1000) + 's]'); await sleep(w); continue }
      return await r.json()
    } catch (e) { await sleep(2000) }
  }
  return {}
}
;(async () => {
  const out = {}
  for (const [n, re] of JOBS) {
    const c = cand[n], b = JSON.parse(fs.readFileSync(path.join(LB, c.batch, 'bank.json'), 'utf8')).questions.find((q) => q.id === c.id)
    const names = b.answers.filter((a) => a.tier === 5).map((a) => a.name).filter((x) => x.length <= 34)
    const found = []
    for (let i = 0; i < names.length; i += 20) {
      const chunk = names.slice(i, i + 20), d = await extracts(chunk), q = d.query || {}, redir = {}
      for (const r of [...(q.normalized || []), ...(q.redirects || [])]) redir[r.from] = r.to
      const resolve = (t) => { let x = t, k = 0; while (redir[x] && k++ < 5) x = redir[x]; return x }
      const byTitle = {}; for (const p of Object.values(q.pages || {})) byTitle[p.title] = p
      for (const t of chunk) { const p = byTitle[resolve(t)]; if (p && p.extract && re.test(p.extract) && !/may refer to/.test(p.extract)) found.push({ name: t, title: p.title, extract: p.extract }) }
      await sleep(1500)
    }
    out[n] = found; console.log(n, c.id, 'mythic answers', names.length, '| with a matching article:', found.length)
  }
  fs.writeFileSync(path.join(ROOT, 'gems', 'manual6.json'), JSON.stringify(out, null, 1))
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
