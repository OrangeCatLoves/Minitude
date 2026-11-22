// The gem cabinet and its ACHIEVEMENTS tab, scrolled hard: the game behind must never show through (the owner saw the title screen flash
// through while scrolling fast, 23 Nov 2026). Fills the cabinet with 600 gems (more with the hidden slots of a full bank), flings the list with the mouse wheel, and checks
// the two things that stop the flash: a solid backdrop and plain images instead of a canvas per picture. Takes pictures into out/.
//   MINITUDE_URL=http://127.0.0.1:8792 MINITUDE_CHANNEL=chrome node cabinet-scroll.cjs
// Needs a server on a throw-away database serving the built game (see achievements.cjs).
const path = require('path')
const { open, OUT } = require('./lib.cjs')

;(async () => {
  const t = await open()
  const { page, logs } = t
  const ok = (c, m) => { if (!c) throw new Error(m); console.log('  ok  ' + m) }

  await page.evaluate(() => {
    const cats = ['Animals & Nature', 'Food', 'Games', 'History & Mythology', 'Miscellaneous', 'Movies & TV', 'Music', 'Places', 'Science & Technology', 'Sports', 'Transport & Vehicles']
    const gems = Array.from({ length: 600 }, (_, i) => ({ id: 'fake-' + i, category: cats[i % cats.length], prompt: 'Name a thing ' + i + '?', answer: 'Gem number ' + i, desc: 'A made-up gem for a test.', day: '2026-11-20' }))
    localStorage.setItem('minitude.gems', JSON.stringify({ gems }))
  })
  await page.reload()
  await page.waitForFunction(() => window.__mt, null, { timeout: 60000 })
  await t.adv(3.5)

  /**
   * Opens the cabinet on a tab and flings it down and up. What is checked is what stops the flash for good: a SOLID backdrop (nothing behind
   * can show even if the browser leaves a strip unpainted for a frame) and plain images instead of a canvas per picture. A headless browser
   * paints everything before a screenshot, so the flash itself cannot be caught here.
   */
  const fling = async (tab, name) => {
    await page.evaluate(() => window.__mt.game.cabinet.open())
    await page.waitForSelector('#cabinet .cab-tab')
    await page.click(`#cabinet .cab-tab:nth-child(${tab})`)
    await page.waitForTimeout(300)
    const info = await page.evaluate(() => {
      const root = document.getElementById('cabinet'), bg = getComputedStyle(root).backgroundColor
      const alpha = /rgba\(/.test(bg) ? Number(bg.split(',')[3]) : 1
      return { bg, alpha, canvases: root.querySelectorAll('canvas').length, images: root.querySelectorAll('img').length, height: root.scrollHeight }
    })
    for (let round = 0; round < 3; round++) for (const dir of [1, -1]) for (let k = 0; k < 12; k++) { await page.mouse.move(640, 400); await page.mouse.wheel(0, dir * 1800) }
    await page.mouse.wheel(0, 2500)
    await page.waitForTimeout(200)
    await page.screenshot({ path: path.join(OUT, `${name}_scroll.png`) })
    await page.keyboard.press('Escape')
    return info
  }
  const gems = await fling(1, 'cabinet_gems')
  console.log('  gems tab: ' + JSON.stringify(gems))
  ok(gems.alpha === 1, "the cabinet's backdrop is solid (" + gems.bg + ')')
  ok(gems.canvases === 0 && gems.images >= 600, 'every gem is a plain image (' + gems.images + '), no canvas per slot')
  const ach = await fling(2, 'cabinet_ach')
  console.log('  achievements tab: ' + JSON.stringify(ach))
  ok(ach.canvases === 0 && ach.images >= 45, 'every achievement picture is a plain image (' + ach.images + ')')
  const ans = await page.evaluate(() => { const r = document.getElementById('answers'); if (!r) return null; const bg = getComputedStyle(r).backgroundColor; return /rgba\(/.test(bg) ? Number(bg.split(',')[3]) : 1 })
  ok(ans === null || ans === 1, 'the screen of accepted answers has a solid backdrop too')
  const bad = logs.filter((l) => !/favicon|404|Failed to load resource|GPU stall due to ReadPixels/.test(l))
  ok(bad.length === 0, 'no page errors' + (bad.length ? ': ' + bad.join(' | ') : ''))
  await t.browser.close()
  console.log('cabinet-scroll: all checks passed')
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
