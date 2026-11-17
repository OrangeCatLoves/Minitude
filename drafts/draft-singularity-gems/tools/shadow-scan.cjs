// Draft scan (read-only): find "shadow" answers = a RARE entry (tier 4 or 5) whose name is just a shorter form of a MUCH MORE COMMON entry
// in the same question (tier 0 to 2), e.g. "Real Madrid" (Mythic) next to "Real Madrid Club de Fútbol" (Common).
// A player who types the short, obvious form is scored as if it were rare.
const fs = require('fs'), path = require('path')
const LB = path.join(__dirname, '..', '..', '..', '..', 'list-build')
const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
const qs = []
for (const b of ['batch1', 'batch2', 'batch3', 'batch4']) qs.push(...JSON.parse(fs.readFileSync(path.join(LB, b, 'bank.json'), 'utf8')).questions)
const found = []
for (const q of qs) {
  const common = q.answers.filter((a) => a.tier <= 2)
  const keys = new Map() // every name/alias of a common answer -> that answer
  for (const a of common) for (const n of [a.name, ...(a.aliases || [])]) keys.set(norm(n), a)
  const headWords = common.map((a) => ({ a, w: norm(a.name).split(' ') }))
  for (const r of q.answers) {
    if (r.tier < 4) continue
    const rn = norm(r.name), rw = rn.split(' ')
    // 1) the rare entry is spelled exactly like a name/alias of a common one
    let why = null, other = keys.get(rn)
    if (other) why = 'same text as an alias/name of'
    // 2) the rare entry is the first 1-2 words of a common entry (Real Madrid / Real Madrid Club de Futbol)
    if (!why && rw.length <= 3) {
      const m = headWords.find(({ w }) => w.length > rw.length && rw.every((x, i) => w[i] === x))
      if (m) { why = 'is the start of'; other = m.a }
    }
    if (why) found.push({ q: q.id, rare: r.name, rareTier: r.tier, why, common: other.name, commonTier: other.tier })
  }
}
const byQ = {}
for (const f of found) byQ[f.q] = (byQ[f.q] || 0) + 1
console.log('shadow answers found:', found.length, 'in', Object.keys(byQ).length, 'questions')
console.log('worst questions:', Object.entries(byQ).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => k + '=' + v).join(' '))
for (const f of found.filter((x) => x.rareTier === 5 && x.commonTier <= 1).slice(0, 40)) console.log(`  ${f.q.slice(0, 28).padEnd(28)} "${f.rare}" (t${f.rareTier}) ${f.why} "${f.common}" (t${f.commonTier})`)
fs.writeFileSync(path.join(__dirname, '..', 'gems', 'shadow-answers.json'), JSON.stringify(found, null, 1))
