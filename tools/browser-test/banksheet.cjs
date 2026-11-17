// Opens the generated bank sheet (docs/BANK_SHEET.md) in a real browser, the way the Artifact page will show it, and checks that the packed data
// unpacks and the page draws: question counts, a search, and no script errors. Usage:
//   MINITUDE_CHANNEL=chrome node banksheet.cjs [path to bank-sheet.html]
// The page has no doctype/head of its own (the Artifact tool adds them), so a minimal one is put around it here.
const fs = require('fs')
const { chromium } = require('playwright')
const file = process.argv[2] || 'C:/Users/weibi/minitude/list-build/sheet/bank-sheet.html'
let bad = 0
const ok = (c, w, d = '') => { if (!c) bad++; console.log((c ? 'ok       ' : 'PROBLEM  ') + w + (d ? '  ' + d : '')) }

;(async () => {
  const html = fs.readFileSync(file, 'utf8')
  const wrapped = /<!doctype/i.test(html) ? html : `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>sheet</title></head><body>${html}</body></html>`
  const tmp = file.replace(/\.html$/, '.check.html')
  fs.writeFileSync(tmp, wrapped)
  const browser = await chromium.launch({ ...(process.env.MINITUDE_CHANNEL ? { channel: process.env.MINITUDE_CHANNEL } : {}) })
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)) })
  const t0 = Date.now()
  await page.goto('file:///' + tmp.replace(/\\/g, '/'))
  await page.waitForFunction(() => document.body.innerText.length > 2000, null, { timeout: 120000 }).catch(() => {})
  const text = await page.evaluate(() => document.body.innerText)
  console.log(`rendered in ${((Date.now() - t0) / 1000).toFixed(1)} s, ${text.length} characters of text`)
  ok(errors.length === 0, 'no script errors', errors.join(' | '))
  ok(/Batch 6/.test(text) || /Batch 7/.test(text) || /draft/i.test(text), 'the page mentions the drafts')
  const m = text.match(/(\d[\d,]*)\s+(?:live\s+)?questions?/i)
  console.log('first count line:', m ? m[0] : '(none)')
  console.log(text.slice(0, 700).replace(/\n+/g, ' | '))
  // search for something that exists only in the new batches
  const input = await page.$('input[type="search"], input[type="text"], input:not([type])')
  if (input) {
    await input.fill('Pfefferpotthast')
    await page.waitForTimeout(1500)
    const after = await page.evaluate(() => document.body.innerText)
    ok(/Pfefferpotthast/.test(after), 'search finds a Batch 6 answer (Pfefferpotthast)')
    await input.fill('Jeewan Jyoti')
    await page.waitForTimeout(1500)
    const after2 = await page.evaluate(() => document.body.innerText)
    ok(/Jeewan Jyoti/.test(after2), 'search finds a Batch 7 answer (Jeewan Jyoti)')
  } else ok(false, 'a search box exists')
  await page.screenshot({ path: file.replace(/\.html$/, '.check.png'), fullPage: false })
  await browser.close()
  fs.unlinkSync(tmp)
  console.log(bad ? `\n${bad} PROBLEM(S)` : '\nall good')
  process.exit(bad ? 1 : 0)
})().catch((e) => { console.error(e); process.exit(1) })
