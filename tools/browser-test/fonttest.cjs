// Looks at how the game's text font draws a capital C and "fi" at several weights and sizes (a one-off check for the achievement names).
//   MINITUDE_URL=http://127.0.0.1:8792 MINITUDE_CHANNEL=chrome node fonttest.cjs
const path = require('path')
const { chromium } = require('playwright')
const { OUT, BASE } = require('./lib.cjs')
;(async () => {
  const browser = await chromium.launch({ ...(process.env.MINITUDE_CHANNEL ? { channel: process.env.MINITUDE_CHANNEL } : {}) })
  const page = await browser.newPage({ viewport: { width: 1000, height: 640 }, deviceScaleFactor: Number(process.env.DPR || 2) })
  await page.goto(BASE + '/?manual=1')
  await page.waitForFunction(() => window.__mt, null, { timeout: 60000 })
  await page.evaluate(async () => {
    await document.fonts.load('600 16px PixelifyFix'); await document.fonts.load('400 16px PixelifyFix'); await document.fonts.load('700 16px PixelifyFix')
    const box = document.createElement('div')
    box.id = 'ft'
    box.style.cssText = 'position:fixed;left:0;top:0;z-index:999;background:#0b1122;color:#eef2ff;padding:14px;width:980px;font-variant-ligatures:none'
    const rows = []
    for (const w of [400, 500, 600, 700]) for (const sz of [16, 17, 18, 20]) rows.push([`PixelifyFix ${w} ${sz}px`, `font:${w} ${sz}px PixelifyFix`, ''])
    rows.push(['plain: ligatures off 600 16', 'font:600 16px PixelifyFix;font-variant-ligatures:none;font-feature-settings:"liga" 0,"clig" 0,"calt" 0', ''])
    rows.push(['system bold 16', 'font:700 16px system-ui', ''])
    rows.push(['Silkscreen 700 12', 'font:700 12px Silkscreen;letter-spacing:.08em', ''])
    for (const [label, css] of rows) {
      const r = document.createElement('div'); r.style.cssText = 'display:flex;gap:16px;align-items:baseline;margin:3px 0'
      const l = document.createElement('span'); l.textContent = label; l.style.cssText = 'font:11px monospace;color:#8190bb;width:210px'
      const t = document.createElement('span'); t.textContent = 'Collector Curator Complete Common first Singularity Complete'; t.style.cssText = css
      r.append(l, t); box.append(r)
    }
    document.body.append(box)
  })
  await page.waitForTimeout(400)
  await (await page.$('#ft')).screenshot({ path: path.join(OUT, 'fonttest.png') })
  await browser.close(); console.log('wrote out/fonttest.png')
})().catch((e) => { console.error(e); process.exit(1) })
