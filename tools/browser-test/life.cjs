// The living worlds: plays a run of gems (each one dives six worlds, so the run visits worlds 1, 7, 13, 19 and Planck Foam), and in every world
// it rests in checks that the picture moves, that it starts from the still picture when the camera lands, and saves pictures a few seconds apart.
// It also checks that ?still=1 (and so "reduce motion") leaves the pictures still.
//   node life.cjs [tag]
// Needs a server whose database has the gems, on a throw-away copy (it answers real questions), and MINITUDE_URL pointing at it (see README.md).
const fs = require('fs')
const path = require('path')
const { open } = require('./lib.cjs')

const gems = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'packages', 'server', 'data', 'gems.json'), 'utf8')).gems
const byQ = new Map(gems.map((g) => [g.question, g]))
/** a part of the world picture with no explorer, question box or counters in it: the left third, below the top bar */
const BOX = [20, 150, 420, 330]

;(async () => {
  const tag = process.argv[2] || 'life'
  const t = await open()
  const { page } = t
  const fail = (m) => { throw new Error(m) }
  /** the pixels of BOX on the game canvas, after drawing the present moment */
  const grab = () => page.evaluate(([x, y, w, h]) => { window.__mt.draw(); const c = document.getElementById('game'); return Array.from(c.getContext('2d').getImageData(x, y, w, h).data) }, BOX)
  const differ = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 12) n++; return n }

  await t.adv(3.5)
  await page.evaluate(() => window.__mt.press())
  const seen = []
  for (let i = 0; i < 7; i++) {
    let s = await t.waitQuestion()
    if (s.phase !== 'run') break
    // the world the camera rests in while the question is open
    await t.adv(4)
    const a = await grab(); await t.shot(`${tag}${i}_a`)
    await t.adv(2.5)
    const b = await grab(); await t.shot(`${tag}${i}_b`)
    const moved = differ(a, b)
    seen.push(`question ${i + 1}: ${moved} of ${BOX[2] * BOX[3]} pixels changed in 2.5 s`)
    if (i < 4 && moved === 0) fail(`question ${i + 1}: the world picture did not move`)
    if (i >= 4) { await t.adv(31); s = await t.state(); await t.gotoT(s.rec.next - 0.01); await t.adv(0.05); continue } // the rest time out
    const g = byQ.get(s.q.id)
    if (!g) fail('no gem for ' + s.q.id)
    s = await t.answer(g.answer)
    if (s.rec.ti !== 6) fail(`question ${i + 1}: "${g.answer}" was not scored as a gem`)
    // in the middle of the dive, and just after the landing
    await t.shotAt((s.rec.fs + s.rec.fe) / 2, `${tag}${i}_dive`)
    await t.gotoT(s.rec.next - 0.01); await t.adv(0.05)
  }
  console.log(seen.join('\n'))
  const logs = t.logs.filter((l) => !l.includes('willReadFrequently')) // that one is about this script reading the game's canvas
  if (logs.length) fail('the page logged: ' + logs.join(' | '))
  await t.browser.close()

  // with ?still=1 nothing in the world picture moves (the title screen, before PLAY: the same part of the picture, 3 s apart)
  const { chromium } = require('playwright')
  const browser = await chromium.launch({ ...(process.env.MINITUDE_CHANNEL ? { channel: process.env.MINITUDE_CHANNEL } : {}), args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
  for (const [query, want] of [['?manual=1&still=1', false], ['?manual=1', true]]) {
    const p = await browser.newPage({ viewport: { width: 1280, height: 720 } })
    await p.goto((process.env.MINITUDE_URL || 'http://127.0.0.1:5173') + '/' + query)
    await p.waitForFunction(() => window.__mt, null, { timeout: 60000 })
    const g2 = () => p.evaluate(([x, y, w, h]) => { window.__mt.draw(); const c = document.getElementById('game'); return Array.from(c.getContext('2d').getImageData(x, y, w, h).data) }, BOX)
    await p.waitForTimeout(2500) // the pictures are prepared while the browser is idle
    await p.evaluate(() => window.__mt.advance(6, false))
    const a = await g2()
    await p.evaluate(() => window.__mt.advance(3, false))
    const n = differ(a, await g2())
    console.log(`title screen with ${query}: ${n} pixels of the window changed in 3 s`)
    if (want !== n > 0) fail(want ? 'the title picture did not move' : 'the title picture moved although ?still=1 was given')
    await p.close()
  }
  await browser.close()
  console.log('ok')
})().catch((e) => { console.error(e); process.exit(1) })
