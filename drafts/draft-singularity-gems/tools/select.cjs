// Draft helper: choose, for every question, the most obscure Mythic answer that has an English Wikipedia article, and draft its description
// from the article's own first sentence (so it is exactly as accurate as the article). Merges two rounds of candidates (finalists.json and
// finalists2.json, the second one looks harder for obscure ones), drops the answers in gems/exclude.txt, and applies a basic "is this article about it" check.
// Output: gems/auto-picks.txt   (n | answer | languages | description | article title   ## alternatives)
const fs = require('fs'), path = require('path')
const ROOT = path.join(__dirname, '..'), NL = String.fromCharCode(10)
const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
const hash = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) } return (h >>> 0) / 4294967296 }
const MAXD = +process.env.MAXD || 120

function firstSentence(t) {
  t = t.replace(/\s+/g, ' ').trim()
  const re = /([.!?])\s+(?=[A-Z"])/g; let m
  while ((m = re.exec(t))) { const before = t.slice(0, m.index + 1); if (!/(\b[A-Z]|\bSt|\bMt|\bDr|\bMr|\bMrs|\bJr|\bSr|\bvs|\bca|\bc|\bno|\bNo|\bInc|\bLtd|\bCo)\.$/.test(before)) return before }
  return t
}
function describe(extract) {
  let s = firstSentence(extract)
  for (let i = 0; i < 4; i++) s = s.replace(/\s*\([^()]*\)/g, '').replace(/\s*\[[^\]]*\]/g, '')
  s = s.replace(/\s+/g, ' ').replace(/\s+([,.;])/g, '$1').trim()
  const m = s.match(/^(.{1,160}?)\s+(?:is|was|are|were)\s+(?:also\s+)?(.*)$/)
  let rest = m ? m[2] : s
  rest = rest.charAt(0).toUpperCase() + rest.slice(1)
  rest = rest.replace(/\.$/, '')
  if (rest.length > MAXD) { const cut = Math.max(rest.lastIndexOf(', ', MAXD), rest.lastIndexOf('; ', MAXD), rest.lastIndexOf(' and ', MAXD), rest.lastIndexOf(' that ', MAXD), rest.lastIndexOf(' which ', MAXD), rest.lastIndexOf(' in ', MAXD), rest.lastIndexOf(' for ', MAXD)); if (cut > 40) rest = rest.slice(0, cut) }
  return rest.replace(/[,;:]$/, '') + '.'
}
const f1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'gems', 'finalists.json'), 'utf8'))
const f2p = path.join(ROOT, 'gems', 'finalists2.json'), f2 = fs.existsSync(f2p) ? JSON.parse(fs.readFileSync(f2p, 'utf8')) : []
const excl = new Set(fs.readFileSync(path.join(ROOT, 'gems', 'exclude.txt'), 'utf8').split(/\r?\n/).filter((l) => l && !l.startsWith('#')).map((l) => { const [n, name] = l.split('|').map((x) => x.trim()); return n + '|' + norm(name) }))
const out = []
f1.forEach((q, i) => {
  const all = [...q.cands, ...((f2[i] && f2[i].cands) || [])], seen = new Set(), list = []
  for (const c of all) { const k = norm(c.name); if (!seen.has(k)) { seen.add(k); list.push(c) } }
  const good = (c) => {
    if (excl.has(q.n + '|' + norm(c.name))) return false
    if (!c.extract || c.extract.length < 60 || /may refer to|disambiguation|redirects here/i.test(c.extract)) return false
    const fs1 = firstSentence(c.extract); if (fs1.length < 40 || fs1.length > 330 || !/ (is|was|are|were) /.test(fs1)) return false
    // strict: the article's first sentence (or its title) must contain the whole answer, otherwise the title is a redirect to a different subject
    const ns = norm(fs1); return norm(c.name).split(' ').filter((w) => w.length >= 3).every((w) => ns.includes(w))
  }
  const ok = list.filter(good).sort((a, b) => (a.langs < 3) - (b.langs < 3) || a.langs - b.langs || hash(q.id + a.name) - hash(q.id + b.name))
  const pick = ok[0], alts = ok.slice(1, 4).map((c) => c.name + '(' + c.langs + ')').join(', ')
  out.push(pick ? q.n + ' | ' + pick.name + ' | ' + pick.langs + ' | ' + describe(pick.extract) + ' | ' + pick.title + (alts ? '   ## alt: ' + alts : '') : q.n + ' | NONE | | | ' + q.id)
})
fs.writeFileSync(path.join(ROOT, 'gems', 'auto-picks.txt'), out.join(NL) + NL)
const langs = out.filter((l) => !l.includes('| NONE |')).map((l) => +l.split('|')[2]).sort((a, b) => a - b)
console.log('written', out.length, 'lines;', out.filter((l) => l.includes('| NONE |')).length, 'without a usable candidate | languages: median', langs[langs.length >> 1], '| over 12:', langs.filter((x) => x > 12).length, '| over 20:', langs.filter((x) => x > 20).length)
