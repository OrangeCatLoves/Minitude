// Draft helper (read-only): resolve every pick against the answer lists and write gems/gem-picks.json.
// gems/picks-src.txt lines:   n | answer | languages | description | wikipedia article title
// Rules checked here: the answer is in the list as MYTHIC (tier 5), no answer is used twice, every description exists and is short.
// The single exception (chosen by the owner): "Name a soup" -> Tonkotsu ramen with the owner's own description, languages and title written as "-".
const fs = require('fs'), path = require('path')
const LB = path.join(__dirname, '..', '..', '..', '..', 'list-build')
const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
const cand = require('../gems/candidates.json')
const qs = []
for (const b of ['batch1', 'batch2', 'batch3', 'batch4']) qs.push(...JSON.parse(fs.readFileSync(path.join(LB, b, 'bank.json'), 'utf8')).questions)
qs.push(...JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', 'packages', 'server', 'data', 'approved-questions.json'), 'utf8')).questions)
const byId = new Map(qs.map((q) => [q.id, q]))
const EXCEPTION_N = 84
const out = [], problems = [], seen = new Set()
for (const line of fs.readFileSync(path.join(__dirname, '..', 'gems', 'picks-src.txt'), 'utf8').split(/\r?\n/).filter(Boolean)) {
  const [i, gem, langs, why, title, note] = line.split('|').map((s) => s.trim())
  const c = cand[+i], q = byId.get(c.id), n = norm(gem)
  const hit = q.answers.find((a) => norm(a.name) === n) || q.answers.find((a) => (a.aliases || []).some((x) => norm(x) === n))
  const exc = +i === EXCEPTION_N
  if (!hit) { problems.push(`${i} ${c.id}: "${gem}" NOT FOUND`); continue }
  if (!exc && hit.tier !== 5) problems.push(`${i} ${c.id}: "${gem}" is tier ${hit.tier}, not Mythic`)
  if (seen.has(norm(hit.name))) problems.push(`${i}: "${hit.name}" used twice`)
  seen.add(norm(hit.name))
  if (!why || why.length > 140) problems.push(`${i}: description missing or too long (${(why || '').length})`)
  out.push({ n: +i, questionId: c.id, category: q.category, prompt: q.prompt, gem: hit.name, aliases: (hit.aliases || []).slice(0, 6), storedTier: hit.tier, why, langs: langs === '-' ? null : +langs, note: note || '', src: !title || title === '-' ? null : 'https://en.wikipedia.org/wiki/' + encodeURIComponent(title.replace(/ /g, '_')), exception: exc, batch: c.batch })
}
fs.writeFileSync(path.join(__dirname, '..', 'gems', 'gem-picks.json'), JSON.stringify(out, null, 1))
const ls = out.filter((x) => x.langs != null).map((x) => x.langs).sort((a, b) => a - b)
console.log('picks', out.length, '| Mythic:', out.filter((x) => x.storedTier === 5).length, '| other (the exception):', out.filter((x) => x.storedTier !== 5).map((x) => x.gem).join(', ') || 'none')
console.log('Wikipedia languages: min', ls[0], 'median', ls[Math.floor(ls.length / 2)], 'max', ls[ls.length - 1], '| 5 or fewer:', ls.filter((x) => x <= 5).length, '| 10 or fewer:', ls.filter((x) => x <= 10).length)
console.log(problems.length ? 'PROBLEMS:\n' + problems.join('\n') : 'no problems')
