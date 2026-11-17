// Draft helper (read-only). Usage:
//   node tools/lookup.cjs wishlist <file>      lines:  <question index or id> | alt1 ; alt2 ; ...   -> first alternative that is Mythic (tier 5)
//   node tools/lookup.cjs grep <index|id> <regex>   -> answers of that question whose name or alias matches, with their tier
const fs = require('fs'), path = require('path')
const LB = path.join(__dirname, '..', '..', '..', '..', 'list-build')
const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
const cand = require('../gems/candidates.json')
const qs = []
for (const b of ['batch1', 'batch2', 'batch3', 'batch4']) qs.push(...JSON.parse(fs.readFileSync(path.join(LB, b, 'bank.json'), 'utf8')).questions)
qs.push(...JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', 'packages', 'server', 'data', 'approved-questions.json'), 'utf8')).questions)
const byId = new Map(qs.map((q) => [q.id, q]))
const get = (k) => (/^\d+$/.test(k) ? byId.get(cand[+k].id) : byId.get(k))
const find = (q, name) => {
  const n = norm(name), hits = []
  for (const a of q.answers) if (norm(a.name) === n || (a.aliases || []).some((x) => norm(x) === n)) hits.push(a)
  return hits
}
const [cmd, a, b] = process.argv.slice(2)
if (cmd === 'grep') {
  const q = get(a), re = new RegExp(b, 'i')
  const hits = q.answers.filter((x) => re.test(x.name) || (x.aliases || []).some((y) => re.test(y)))
  console.log(q.id, q.answers.length, 'answers;', hits.length, 'match')
  console.log(hits.slice(0, 40).map((x) => `${x.name} [t${x.tier}]`).join(' · '))
} else if (cmd === 'wishlist') {
  for (const line of fs.readFileSync(a, 'utf8').split(/\r?\n/)) {
    if (!line.trim() || line.startsWith('#')) continue
    const [k, rest] = line.split('|').map((s) => s.trim())
    const q = get(k); if (!q) { console.log(k, 'UNKNOWN QUESTION'); continue }
    const alts = rest.split(';').map((s) => s.trim()).filter(Boolean)
    const res = alts.map((n) => { const h = find(q, n); return { n, tiers: h.map((x) => x.tier), mythic: h.find((x) => x.tier === 5) } })
    const ok = res.find((r) => r.mythic)
    console.log(`${k} ${q.id.slice(0, 32)} ${ok ? 'OK  -> ' + ok.mythic.name : 'NO MYTHIC'}   (${res.map((r) => r.n + ':' + (r.tiers.length ? 't' + r.tiers.join('/') : 'none')).join(', ')})`)
  }
}
