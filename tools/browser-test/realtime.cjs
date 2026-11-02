// Real clock, real keyboard: press Enter on the title, type a wrong answer, press Enter. Checks the API calls and the console.
const { open, OUT } = require('./lib.cjs')
const path = require('path')
;(async () => {
  const t = await open(false)
  const reqs = []
  t.page.on('response', (r) => { if (r.url().includes('/api/')) reqs.push(r.status() + ' ' + r.request().method() + ' ' + r.url().replace(/^.*\/api/, '/api')) })
  await t.page.waitForTimeout(3500)
  await t.page.screenshot({ path: path.join(OUT, 'rt_title.png') })
  await t.page.keyboard.press('Enter')
  // the question takes a few seconds to slide in (longer on a slow machine): keep trying until the server has seen an answer
  for (let k = 0; k < 8 && !reqs.some((r) => r.includes('/answer')); k++) {
    await t.page.waitForTimeout(5000)
    await t.page.keyboard.type('qwertyuiop', { delay: 40 })
    await t.page.keyboard.press('Enter')
    await t.page.waitForTimeout(2500)
  }
  await t.page.screenshot({ path: path.join(OUT, 'rt_rejected.png') })
  console.log(reqs.join('\n'))
  console.log(t.logs.join('\n') || 'no console errors')
  await t.browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
