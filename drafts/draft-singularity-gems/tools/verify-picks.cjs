// Draft helper: last checks on the 200 picks. (1) every source article exists on English Wikipedia; (2) the gem answer's text is not also a name or alias of a
// different answer in the same question (a typed answer could then resolve to that other answer); (3) how obscure the picks are.
const fs = require('fs'), path = require('path')
const ROOT = path.join(__dirname, '..'), LB = path.join(ROOT, '..', '..', '..', 'list-build')
const UA = 'MinitudeDraft/1.0 (answer-list fact check)'
const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const picks = JSON.parse(fs.readFileSync(path.join(ROOT, 'gems', 'gem-picks.json'), 'utf8'))
;(async () => {
  // (1) the articles
  const titles = [...new Set(picks.filter((p) => p.src).map((p) => decodeURIComponent(p.src.split('/wiki/')[1]).replace(/_/g, ' ')))]
  const missing = []
  for (let i = 0; i < titles.length; i += 40) {
    const chunk = titles.slice(i, i + 40)
    let d = null
    for (let a = 0; a < 8 && !d; a++) { const r = await fetch('https://en.wikipedia.org/w/api.php?action=query&redirects=1&format=json&titles=' + encodeURIComponent(chunk.join('|')), { headers: { 'user-agent': UA } }); if (r.status === 429) { await sleep((+r.headers.get('retry-after') || 10) * 1000 + 500); continue } d = await r.json() }
    const q = (d && d.query) || {}, redir = {}; for (const r of [...(q.normalized || []), ...(q.redirects || [])]) redir[r.from] = r.to
    const resolve = (t) => { let x = t, k = 0; while (redir[x] && k++ < 5) x = redir[x]; return x }
    const pages = {}; for (const p of Object.values(q.pages || {})) pages[p.title] = p
    for (const t of chunk) { const p = pages[resolve(t)]; if (!p || p.missing !== undefined) missing.push(t) }
    await sleep(800)
  }
  console.log('(1) source articles checked:', titles.length, '| missing:', missing.length ? missing.join(' ; ') : 'none')
  // (2) collisions inside the question
  const qs = []
  for (const b of ['batch1', 'batch2', 'batch3', 'batch4']) qs.push(...JSON.parse(fs.readFileSync(path.join(LB, b, 'bank.json'), 'utf8')).questions)
  qs.push(...JSON.parse(fs.readFileSync(path.join(ROOT, '..', '..', 'packages', 'server', 'data', 'approved-questions.json'), 'utf8')).questions)
  const byId = new Map(qs.map((q) => [q.id, q])), clashes = []
  for (const p of picks) {
    const q = byId.get(p.questionId), g = norm(p.gem)
    for (const a of q.answers) { if (norm(a.name) === g && a.name !== p.gem) clashes.push(p.n + ' ' + p.gem + ' = name of "' + a.name + '"'); else if ((a.aliases || []).some((x) => norm(x) === g) && norm(a.name) !== g) clashes.push(p.n + ' ' + p.gem + ' = alias of "' + a.name + '" (tier ' + a.tier + ')') }
  }
  console.log('(2) name collisions with another answer of the same question:', clashes.length ? '\n  ' + clashes.join('\n  ') : 'none')
  // (3) obscurity
  const ls = picks.filter((p) => p.langs != null).map((p) => p.langs).sort((a, b) => a - b)
  const over = picks.filter((p) => p.langs != null && p.langs > 20).map((p) => p.n + ' ' + p.gem + ' (' + p.langs + ')')
  console.log('(3) languages: median', ls[ls.length >> 1], '| 5 or fewer:', ls.filter((x) => x <= 5).length, '| 10 or fewer:', ls.filter((x) => x <= 10).length, '| over 20:', over.length, '\n  over 20: ' + over.join(', '))
  console.log('    no article of their own:', picks.filter((p) => p.langs == null).map((p) => p.n + ' ' + p.gem).join(', '))
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
