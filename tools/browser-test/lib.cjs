// Shared helpers for the browser tests. Needs the dev servers running (npm run dev) or MINITUDE_URL pointing at a running game.
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const OUT = path.join(__dirname, 'out')
fs.mkdirSync(OUT, { recursive: true })
const BASE = process.env.MINITUDE_URL || 'http://127.0.0.1:5173'
const bank = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'packages', 'server', 'data', 'questions.seed.json'), 'utf8'))

/** open the game in manual-clock mode (?manual=1): time only moves when the script moves it */
async function open(manual = true) {
  const browser = await chromium.launch({
    // MINITUDE_CHANNEL=chrome (or msedge) uses a browser already installed on the machine instead of Playwright's own download
    ...(process.env.MINITUDE_CHANNEL ? { channel: process.env.MINITUDE_CHANNEL } : {}),
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
  })
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  const logs = []
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text()) })
  page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '')))
  await page.goto(BASE + (manual ? '/?manual=1' : '/'))
  if (manual) await page.waitForFunction(() => window.__mt, null, { timeout: 60000 })
  else await page.waitForSelector('#boot', { state: 'hidden', timeout: 60000 })
  const adv = (s, draw = false) => page.evaluate(([s, d]) => window.__mt.advance(s, d), [s, draw])
  const state = () => page.evaluate(() => window.__mt.state())
  /** move the clock forward to time T (never backwards). Returns false when T is not a real time, e.g. there is no dive for a Common answer */
  const gotoT = async (T) => {
    if (!Number.isFinite(T)) return false
    const s = await state()
    if (T > s.T) await adv(T - s.T, false)
    return true
  }
  const shot = async (name) => { await page.evaluate(() => window.__mt.draw()); await page.locator('#game').screenshot({ path: path.join(OUT, name + '.png') }) }
  /** go to time T and take a screenshot; does nothing when T is not a real time */
  const shotAt = async (T, name) => { if (await gotoT(T)) await shot(name) }
  /** wait until a question can be typed into (once it is on screen, only the server's reply with the prompt can be missing) */
  const waitQuestion = async () => {
    let s = await state(), guard = 0
    while (!s.canType && s.phase === 'run' && guard++ < 3000) {
      if (s.rec && s.T >= s.rec.start + 0.4 && !s.q) await page.waitForTimeout(10)
      else await adv(0.1)
      s = await state()
    }
    return s
  }
  /** answer with text and wait for the server; returns the state afterwards */
  const answer = async (text) => {
    await page.evaluate((a) => window.__mt.answer(a), text)
    await page.waitForFunction(() => !window.__mt.state().pending)
    await adv(0.05)
    return state()
  }
  /** after page.reload(): wait for the game, then for the server's word about the daily */
  const reopen = async () => {
    await page.reload()
    await page.waitForFunction(() => window.__mt, null, { timeout: 60000 })
    await page.waitForFunction(() => window.__mt.state().daily || window.__mt.state().dailyFailed, null, { timeout: 20000 })
  }
  return { browser, page, logs, adv, state, gotoT, shot, shotAt, waitQuestion, answer, reopen }
}

/** a listed answer of the given tier (0 = Common ... 5 = Mythic) for a question id */
function pick(qid, tier) {
  const q = bank.questions.find((x) => x.id === qid)
  const a = q.answers.filter((x) => x.tier === tier)
  return (a[0] || q.answers[0]).name
}

module.exports = { open, pick, bank, OUT, BASE }
