// Draft helper: merge gems/auto-picks.txt with gems/overrides.txt into gems/picks-src.txt (the file build-picks.cjs reads).
// Adds the owner's own exception ("Name a soup" -> Tonkotsu ramen, with the owner's wording) and looks up language counts for "?" entries on Wikidata.
const fs = require('fs'), path = require('path')
const ROOT = path.join(__dirname, '..'), NL = String.fromCharCode(10)
const UA = 'MinitudeDraft/1.0 (answer-list fact check)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const NOT_LANG = new Set(['commons', 'species', 'meta', 'wikidata', 'mediawiki', 'incubator', 'foundation', 'outreach', 'strategy', 'test', 'be_x_old', 'simple'])
const langCount = (sl) => Object.keys(sl || {}).filter((k) => /wiki$/.test(k) && !NOT_LANG.has(k.replace(/wiki$/, ''))).length
const rows = new Map()
for (const l of fs.readFileSync(path.join(ROOT, 'gems', 'auto-picks.txt'), 'utf8').split(/\r?\n/).filter(Boolean)) {
  const p = l.split('##')[0].split('|').map((s) => s.trim()); if (p[1] === 'NONE') continue
  rows.set(+p[0], { n: +p[0], name: p[1], langs: p[2], desc: p[3], title: p[4], note: '' })
}
for (const l of fs.readFileSync(path.join(ROOT, 'gems', 'overrides.txt'), 'utf8').split(/\r?\n/).filter((x) => x && !x.startsWith('#'))) {
  const p = l.split('|').map((s) => s.trim()); rows.set(+p[0], { n: +p[0], name: p[1], langs: p[2], desc: p[3], title: p[4], note: p[5] || '' })
}
// the owner's exception: the soup question keeps Tonkotsu ramen, with the owner's own description
rows.set(84, { n: 84, name: 'tonkotsu ramen', langs: '-', desc: "It's just my personal favourite, not a rare soup at all ~WB", title: '-', note: "the owner's own pick" })
;(async () => {
  const need = [...rows.values()].filter((r) => r.langs === '?')
  if (need.length) {
    const url = 'https://www.wikidata.org/w/api.php?action=wbgetentities&sites=enwiki&props=sitelinks&format=json&titles=' + encodeURIComponent(need.map((r) => r.title).join('|'))
    let d = {}
    for (let a = 0; a < 8; a++) { const r = await fetch(url, { headers: { 'user-agent': UA } }); if (r.status === 429) { await sleep((+r.headers.get('retry-after') || 10) * 1000 + 500); continue } d = await r.json(); break }
    const byTitle = {}
    for (const e of Object.values(d.entities || {})) if (e.sitelinks && e.sitelinks.enwiki) byTitle[e.sitelinks.enwiki.title] = langCount(e.sitelinks)
    for (const r of need) { const k = Object.keys(byTitle).find((t) => t.toLowerCase() === r.title.toLowerCase()); r.langs = k ? String(byTitle[k]) : '-'; console.log('languages for', r.name, '->', r.langs) }
  }
  const out = [...rows.values()].sort((a, b) => a.n - b.n)
  const missing = []; for (let i = 0; i < 200; i++) if (!rows.has(i)) missing.push(i)
  fs.writeFileSync(path.join(ROOT, 'gems', 'picks-src.txt'), out.map((r) => [r.n, r.name, r.langs, r.desc, r.title, r.note].join(' | ')).join(NL) + NL)
  console.log('picks-src.txt written:', out.length, 'picks | questions still without one:', missing.join(',') || 'none')
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
