// Checks that the whole game picture fits on screen at phone sizes (portrait and landscape) and desktop sizes.
//   MINITUDE_URL=http://127.0.0.1:5199 MINITUDE_CHANNEL=chrome node phone-layout.cjs
// What it can and cannot show: it sizes the browser window exactly like a phone's visible area, so it proves the picture is
// 16:9, fully inside that area and as large as it can be. It cannot reproduce a real phone's address bar sliding in and out
// (desktop Chrome has no such bar); that is what the dvh unit in index.html is for, and only a real phone can confirm it.
const { chromium } = require('playwright')
const BASE = process.env.MINITUDE_URL || 'http://127.0.0.1:5173'
// [name, width, height]: "visible" sizes, i.e. what is left once the phone's address bar and status bar are taken off
const SIZES = [
  ['phone landscape 844x390 (bar hidden)', 844, 390],
  ['phone landscape 844x340 (address bar showing)', 844, 340],
  ['phone landscape 740x300 (small phone, bar showing)', 740, 300],
  ['phone landscape 915x350', 915, 350],
  ['phone landscape 667x300 (iPhone SE)', 667, 300],
  ['phone portrait 390x664', 390, 664],
  ['tablet landscape 1024x700', 1024, 700],
  ['laptop 1280x720', 1280, 720],
  ['wide desktop 1920x1080', 1920, 1080],
  ['ultra-wide 2560x1000', 2560, 1000],
]
let bad = 0
const ok = (c, w, d = '') => { if (!c) bad++; console.log((c ? 'ok       ' : 'PROBLEM  ') + w + (d ? '  ' + d : '')) }
;(async () => {
  const browser = await chromium.launch({
    ...(process.env.MINITUDE_CHANNEL ? { channel: process.env.MINITUDE_CHANNEL } : {}),
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  })
  for (const [name, w, h] of SIZES) {
    const phone = /phone/.test(name)
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: phone, hasTouch: phone, deviceScaleFactor: phone ? 2 : 1 })
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(BASE + '/')
    await page.waitForSelector('#game')
    await page.waitForFunction(() => { const b = document.getElementById('boot'); return !b || getComputedStyle(b).display === 'none' || b.offsetParent === null }, null, { timeout: 60000 }).catch(() => {})
    const m = await page.evaluate(() => {
      const r = document.getElementById('game').getBoundingClientRect()
      return { x: r.x, y: r.y, w: r.width, h: r.height, iw: innerWidth, ih: innerHeight, scrollable: document.documentElement.scrollHeight > innerHeight + 1 || document.documentElement.scrollWidth > innerWidth + 1 }
    })
    const inside = m.x >= -0.5 && m.y >= -0.5 && m.x + m.w <= m.iw + 0.5 && m.y + m.h <= m.ih + 0.5
    const ratio = m.w / m.h
    const biggest = Math.abs(m.w - m.iw) <= 1 || Math.abs(m.h - m.ih) <= 1 // touches the limiting edge: as large as it can be
    ok(inside && Math.abs(ratio - 16 / 9) < 0.01 && biggest, name, `picture ${m.w.toFixed(0)}x${m.h.toFixed(0)} at (${m.x.toFixed(0)},${m.y.toFixed(0)}) in a ${m.iw}x${m.ih} window${inside ? '' : ' <-- CUT OFF'}`)
    if (errors.length) ok(false, name + ': no page errors', errors.join(' | '))
    await ctx.close()
  }
  await browser.close()
  console.log(bad ? `${bad} PROBLEM(S)` : 'all layout checks pass')
  process.exit(bad ? 1 : 0)
})().catch((e) => { console.error(e); process.exit(1) })
