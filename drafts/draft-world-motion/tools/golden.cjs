// Fingerprints of the reviewed frames (the designs the owner picked), for the game's test: every slot at a few times.   node golden.cjs
const { chromium } = require('../../../tools/browser-test/node_modules/playwright')
const path = require('path'), fs = require('fs'), { pathToFileURL } = require('url')
;(async () => {
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage()
  const errs = []; p.on('pageerror', (e) => errs.push(e.message))
  await p.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?w=0&manual=1'); await p.waitForFunction(() => window.Lab)
  const r = await p.evaluate(() => {
    const cases = [[0.7, 1], [3.3, 1], [12.9, 1], [5.1, 0.4]]
    const fnv = (a) => { let h = 0x811c9dc5; for (let i = 0; i < a.length; i += 4) { h = Math.imul(h ^ a[i], 0x01000193); h = Math.imul(h ^ a[i + 1], 0x01000193); h = Math.imul(h ^ a[i + 2], 0x01000193) } return (h >>> 0).toString(16).padStart(8, '0') }
    const tmp = document.createElement('canvas'); tmp.width = 320; tmp.height = 180; const g = tmp.getContext('2d')
    const still = [], frames = []
    for (let s = 0; s < 36; s++) { const L = Lab.worldFor(s); still.push(fnv(L.base)); frames.push(cases.map(([t, k]) => { Lab.render(s, t, k, g, false); return fnv(Lab.worldFor(s).out) })) }
    return { note: 'made by drafts/draft-world-motion/tools/golden.cjs from the reviewed designs; FNV-1a of the RGB bytes of each 320 x 180 frame', cases, still, frames }
  })
  if (errs.length) throw new Error(errs.join(' | '))
  fs.writeFileSync(path.join(__dirname, '..', '..', '..', 'packages', 'web', 'test', 'life.golden.json'), JSON.stringify(r) + '\n')
  console.log('wrote life.golden.json:', r.frames.length, 'slots'); await b.close()
})()
