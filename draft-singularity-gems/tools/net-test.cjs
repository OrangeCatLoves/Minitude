// Draft helper: can this PC reach Wikipedia / Wikidata? (generic client name, no personal details)
const UA = 'MinitudeDraft/1.0 (answer-list fact check)'
;(async () => {
  const j = async (u) => { const r = await fetch(u, { headers: { 'user-agent': UA, accept: 'application/json' } }); return [r.status, await r.json()] }
  let [s, d] = await j('https://www.wikidata.org/w/api.php?action=wbgetentities&ids=Q126167&props=sitelinks&format=json')
  const sl = d.entities && d.entities.Q126167 && d.entities.Q126167.sitelinks
  console.log('wikidata', s, 'sitelinks for Lammergeyer:', sl ? Object.keys(sl).length : 'none', '| enwiki:', sl && sl.enwiki && sl.enwiki.title)
  ;[s, d] = await j('https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&exsentences=2&titles=Painite|Surtsey&format=json&redirects=1')
  console.log('wikipedia', s, Object.values(d.query.pages).map((p) => p.title + ': ' + (p.extract || '').slice(0, 110)).join(' || '))
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
