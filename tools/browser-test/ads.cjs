// The ad layout on the title screen (src/ads.ts, index.html, src/site.css; docs/ADS.md). Needs `npm run dev`.
//   MINITUDE_CHANNEL=chrome node ads.cjs       (pictures go to out/ads-*.png)
// Checks, at ten screen sizes, with ?adpreview=1 (empty dashed boxes, nothing is loaded):
//   - a laptop-sized window (1200 x 600 and up) gets three ads (left, right, bottom), a smaller one gets one small banner at the very bottom;
//   - every ad box is inside the window, none touches the game, and the game keeps its 16:9 shape;
//   - the sound and cabinet buttons do not sit on an ad;
//   - the ads go when PLAY is pressed or the gem cabinet opens, and come back with the title screen;
//   - a click on an ad does not start the game;
//   - WITHOUT ?adpreview=1 nothing changes at all (no ad boxes, the game as big as before).
const { chromium } = require('playwright')
const path = require('path')
const OUT = path.join(__dirname, 'out')
require('fs').mkdirSync(OUT, { recursive: true })
const BASE = process.env.MINITUDE_URL || 'http://127.0.0.1:5173'
let bad = 0
const ok = (c, w, d = '') => { if (!c) bad++; console.log((c ? 'ok       ' : 'PROBLEM  ') + w + (d ? '  ' + d : '')) }

// [name, width, height, touch device?, expected layout]
const PROFILES = [
  ['desktop-1920x1080', 1920, 1080, false, 'wide'],
  ['laptop-1440x800', 1440, 800, false, 'wide'],
  ['laptop-1366x650', 1366, 650, false, 'wide'],
  ['laptop-1280x720', 1280, 720, false, 'wide'],
  ['smallest-wide-1200x600', 1200, 600, false, 'wide'],
  ['just-too-narrow-1199x800', 1199, 800, false, 'small'],
  ['tablet-768x1024', 768, 1024, true, 'small'],
  ['phone-390x844', 390, 844, true, 'small'],
  ['phone-landscape-844x390', 844, 390, true, 'small'],
  ['phone-small-320x568', 320, 568, true, 'small'],
]

const rects = () => {
  const r = (sel) => { const e = document.querySelector(sel); if (!e) return null; const cs = getComputedStyle(e); if (cs.display === 'none') return null; const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height, r: b.right, b: b.bottom } }
  return {
    ads: document.documentElement.dataset.ads || null,
    game: r('#game'), left: r('#ads .ad-left'), right: r('#ads .ad-right'), bottom: r('#ads .ad-bottom'), mute: r('#mute'), cab: r('#cabbtn'),
    vw: innerWidth, vh: innerHeight,
  }
}
const hit = (a, b, gap = 0) => a && b && a.x < b.r + gap && a.r > b.x - gap && a.y < b.b + gap && a.b > b.y - gap
const inside = (a, vw, vh) => a && a.x >= -0.5 && a.y >= -0.5 && a.r <= vw + 0.5 && a.b <= vh + 0.5

;(async () => {
  const browser = await chromium.launch({
    ...(process.env.MINITUDE_CHANNEL ? { channel: process.env.MINITUDE_CHANNEL } : {}),
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
  })
  const open = async (w, h, touch, query) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 })
    const page = await ctx.newPage()
    const logs = []
    page.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message))
    await page.goto(BASE + '/?debug=1' + query)
    await page.waitForSelector('#boot', { state: 'hidden', timeout: 90000 })
    await page.waitForTimeout(900)
    return { ctx, page, logs }
  }

  for (const [name, w, h, touch, want] of PROFILES) {
    console.log(`\n## ${name}`)
    const { ctx, page, logs } = await open(w, h, touch, '&adpreview=1')
    const s = await page.evaluate(rects)
    ok(s.ads === want, `layout is "${want}"`, `got "${s.ads}"`)
    ok(s.game && Math.abs(s.game.w / s.game.h - 16 / 9) < 0.02, 'the game keeps its 16:9 shape', s.game ? `${s.game.w.toFixed(0)} x ${s.game.h.toFixed(0)}` : 'no game')
    const boxes = want === 'wide' ? { left: s.left, right: s.right, bottom: s.bottom } : { bottom: s.bottom }
    for (const [k, b] of Object.entries(boxes)) {
      ok(!!b, `the ${k} ad box is shown`)
      if (b) {
        ok(inside(b, s.vw, s.vh), `the ${k} ad box is inside the window`, `${b.x.toFixed(0)},${b.y.toFixed(0)} ${b.w.toFixed(0)}x${b.h.toFixed(0)}`)
        ok(!hit(b, s.game, 8), `the ${k} ad box keeps at least 8 px away from the game`)
        ok(!hit(b, s.mute) && !hit(b, s.cab), `the ${k} ad box is not on the sound or cabinet buttons`)
      }
    }
    if (want === 'small') { ok(!s.left && !s.right, 'no side ads'); ok(s.bottom && Math.abs(s.bottom.w - 320) < 1 && Math.abs(s.bottom.h - 50) < 1, 'the bottom banner is 320 x 50'); ok(s.bottom && s.vh - s.bottom.b <= 12, 'the banner sits at the very bottom', `${(s.vh - s.bottom.b).toFixed(0)} px from the bottom`) }
    else { ok(s.bottom && Math.abs(s.bottom.w - 728) < 1 && Math.abs(s.bottom.h - 90) < 1, 'the bottom banner is 728 x 90'); ok(s.left && Math.abs(s.left.w - 160) < 1 && s.left.h <= 600.5, 'the side ads are 160 wide and at most 600 high') }
    await page.waitForTimeout(4500)   // let the title screen finish its entrance (the PLAY button shows) before the picture
    await page.screenshot({ path: path.join(OUT, `ads-${name}.png`) })

    // a click on an ad does not start the game
    const target = s.left || s.bottom
    await page.mouse.click(target.x + target.w / 2, target.y + target.h / 2)
    await page.waitForTimeout(200)
    const st = await page.evaluate(() => ({ phase: window.__mtv.game.phase, pressed: window.__mtv.game.pressedAt }))
    ok(st.phase === 'title' && st.pressed === null, 'a click on an ad does not start the game')

    // the gem cabinet over the title screen: no ads while it is open, back when it closes (only once, on the first profile and a phone)
    if (name === 'laptop-1440x800' || name === 'phone-390x844') {
      await page.evaluate(() => window.__mtv.game.cabinet && window.__mtv.game.cabinet.open && window.__mtv.game.cabinet.open())
      await page.waitForTimeout(400)
      const o = await page.evaluate(() => ({ ads: document.documentElement.dataset.ads || null, open: window.__mtv.game.cabinet ? window.__mtv.game.cabinet.isOpen : null }))
      if (o.open) ok(o.ads === null, 'no ads while the gem cabinet is open', `ads=${o.ads}`)
      else console.log('note      the cabinet could not be opened from here; skipped')
      await page.evaluate(() => window.__mtv.game.cabinet && window.__mtv.game.cabinet.close && window.__mtv.game.cabinet.close())
      await page.waitForTimeout(400)
      const c = await page.evaluate(() => document.documentElement.dataset.ads || null)
      ok(c === want, 'the ads come back when the cabinet closes', `ads=${c}`)
    }

    // PLAY: the ads go at once and the game gets its full size back
    if (name === 'laptop-1440x800' || name === 'phone-390x844' || name === 'phone-landscape-844x390') {
      await page.evaluate(() => { window.__mtv.game.press('solo').catch(() => {}) })
      await page.waitForTimeout(700)
      const p = await page.evaluate(rects)
      ok(p.ads === null, 'the ads are gone once PLAY is pressed', `ads=${p.ads}`)
      ok(!p.left && !p.right && !p.bottom, 'no ad box is shown during the run')
      const full = Math.min(p.vw, (p.vh * 16) / 9)
      ok(p.game && Math.abs(p.game.w - full) < 1.5, 'the game is back to its full size', p.game ? `${p.game.w.toFixed(0)} vs ${full.toFixed(0)}` : '')
      await page.screenshot({ path: path.join(OUT, `ads-${name}-after-play.png`) })
    }
    ok(logs.length === 0, 'no script errors', logs.join(' | ').slice(0, 200))
    await ctx.close()
  }

  console.log('\n## the page as shipped (no ?adpreview): nothing changes')
  for (const [w, h] of [[1440, 800], [390, 844]]) {
    const { ctx, page } = await open(w, h, w < 600, '')
    const s = await page.evaluate(rects)
    const full = Math.min(w, (h * 16) / 9)
    ok(s.ads === null && !s.left && !s.right && !s.bottom, `${w}x${h}: no ad layout and no ad box`)
    ok(s.game && Math.abs(s.game.w - full) < 1.5, `${w}x${h}: the game is its full size`, s.game ? `${s.game.w.toFixed(0)} vs ${full.toFixed(0)}` : '')
    await ctx.close()
  }

  await browser.close()
  console.log(bad ? `\n${bad} PROBLEM(S)` : '\nall good')
  process.exit(bad ? 1 : 0)
})().catch((e) => { console.error(e); process.exit(1) })
