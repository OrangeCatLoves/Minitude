// Draft helper: show the best-known Legendary (t4) and Mythic (t5) answers of the given question indexes (or a range a-b)
const fs = require('fs'), path = require('path')
const LB = path.join(__dirname, '..', '..', '..', 'list-build')
const cand = require('../gems/candidates.json')
const qs = []
for (const b of ['batch1', 'batch2', 'batch3', 'batch4']) qs.push(...JSON.parse(fs.readFileSync(path.join(LB, b, 'bank.json'), 'utf8')).questions)
qs.push(...JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'packages', 'server', 'data', 'approved-questions.json'), 'utf8')).questions)
const byId = new Map(qs.map((q) => [q.id, q]))
const nT4 = +process.env.T4 || 14, nT5 = +process.env.T5 || 5
let idx = []
for (const s of process.argv.slice(2)) { const m = s.match(/^(\d+)-(\d+)$/); if (m) for (let i = +m[1]; i <= +m[2]; i++) idx.push(i); else idx.push(+s) }
for (const i of idx) {
  const c = cand[i], q = byId.get(c.id)
  const t4 = q.answers.filter((a) => a.tier === 4).slice(0, nT4).map((a) => a.name).filter((n) => n.length <= 32)
  const t5 = c.candidates.filter((x) => x.name.length <= 32).slice(0, nT5).map((x) => x.name)
  console.log(`${i} ${c.id.slice(0, 34)} | ${c.prompt.replace(/^Name /, '')}\n  L: ${t4.join(' · ')}\n  M: ${t5.join(' · ')}`)
}
