// Draft helper: for every live question, list its best-known MYTHIC answers (tier 5) as gem candidates.
// Read-only: it only reads list-build/*/bank.json and list-build/*/raw/*.json (nothing in the game or the database is touched).
const fs = require('fs'), path = require('path')
const LB = path.join(__dirname, '..', '..', '..', 'list-build')
const out = []
const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim()
for (const b of ['batch1', 'batch2', 'batch3', 'batch4']) {
  const bank = JSON.parse(fs.readFileSync(path.join(LB, b, 'bank.json'), 'utf8'))
  for (const q of bank.questions) {
    let sig = new Map()
    try {
      for (const r of JSON.parse(fs.readFileSync(path.join(LB, b, 'raw', q.id + '.json'), 'utf8'))) {
        for (const n of [r.name, ...(r.aliases || [])]) { const k = norm(n); if (!sig.has(k) || sig.get(k) < r.signal) sig.set(k, r.signal) }
      }
    } catch { /* no raw file: order stays as stored */ }
    const myth = q.answers.map((a, i) => ({ ...a, i })).filter((a) => a.tier === 5)
    const withSig = myth.map((a) => ({ name: a.name, aliases: a.aliases || [], signal: sig.get(norm(a.name)) ?? Math.max(-1, ...(a.aliases || []).map((x) => sig.get(norm(x)) ?? -1)), order: a.i }))
    withSig.sort((x, y) => y.signal - x.signal || x.order - y.order)
    out.push({ id: q.id, batch: b, category: q.category, prompt: q.prompt, answers: q.answers.length, mythic: myth.length, candidates: withSig.slice(0, 40) })
  }
}
const orig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'packages', 'server', 'data', 'approved-questions.json'), 'utf8'))
for (const q of orig.questions) {
  const myth = q.answers.filter((a) => a.tier === 5)
  out.push({ id: q.id, batch: 'original', category: q.category, prompt: q.prompt, answers: q.answers.length, mythic: myth.length, candidates: myth.slice(0, 40).map((a, i) => ({ name: a.name, aliases: a.aliases || [], signal: -1, order: i })) })
}
fs.writeFileSync(path.join(__dirname, '..', 'gems', 'candidates.json'), JSON.stringify(out))
console.log('questions', out.length, '| with no Mythic answer:', out.filter((q) => !q.mythic).map((q) => q.id).join(', ') || 'none')
console.log('by batch', JSON.stringify(out.reduce((m, q) => (m[q.batch] = (m[q.batch] || 0) + 1, m), {})))
console.log('fewest Mythic:', out.slice().sort((a, b) => a.mythic - b.mythic).slice(0, 8).map((q) => q.id + '=' + q.mythic).join(' '))
console.log('categories', JSON.stringify(out.reduce((m, q) => (m[q.category] = (m[q.category] || 0) + 1, m), {})))
