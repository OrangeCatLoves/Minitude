// A short multiplayer match on the game's REAL clock (no stepping): two browsers, a private room, the first two questions.
//   MINITUDE_URL=http://127.0.0.1:8791 MINITUDE_CHANNEL=chrome node versus-live.cjs
// versus.cjs plays a whole match with a stepped clock; this one proves the live loop, the real timing and the "everybody is ready" wait.
// The headless browser draws in software, so the game clock may run slower than real time here; that is not a bug.
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const BASE = process.env.MINITUDE_URL || 'http://127.0.0.1:8791'
const BANK_FILE = process.env.MINITUDE_BANK || path.join(__dirname, '..', '..', 'packages', 'server', 'data', 'mp-test-bank.json')
const bank = new Map(JSON.parse(fs.readFileSync(BANK_FILE, 'utf8')).questions.map((q) => [q.id, q]))
const OUT = path.join(__dirname, 'out')
fs.mkdirSync(OUT, { recursive: true })

let bad = 0
const errors = []
const ok = (c, w, d = '') => { if (!c) bad++; console.log((c ? 'ok       ' : 'PROBLEM  ') + w + (d ? '  ' + d : '')) }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function player(browser, name) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`))
  await page.goto(BASE + '/?debug=1')
  await page.waitForFunction(() => window.__mtv && document.getElementById('boot').style.display === 'none', null, { timeout: 60000 })
  return { name, ctx, page }
}
const dbg = (p) => p.page.evaluate(() => window.__mtv.game.versusDebug())
const st = (p) => p.page.evaluate(() => window.__mtv.game.debugState())
async function waitFor(what, fn, ms = 60000) {
  const t0 = Date.now()
  for (;;) {
    if (await fn()) return
    if (Date.now() - t0 > ms) throw new Error('timed out: ' + what)
    await sleep(100)
  }
}
async function click(p, x, y) {
  const box = await p.page.locator('#game').boundingBox()
  await p.page.mouse.click(box.x + (x / 1280) * box.width, box.y + (y / 720) * box.height)
}
async function clickItem(p, action, arg) {
  await waitFor(`${p.name}: ${action} is on screen`, async () => (await dbg(p)).items.some((i) => i.action === action && (arg === undefined || i.arg === arg) && i.enabled), 10000)
  const it = (await dbg(p)).items.find((i) => i.action === action && (arg === undefined || i.arg === arg))
  await click(p, it.box.x + it.box.w / 2, it.box.y + it.box.h / 2)
}
async function lobby(p) {
  await waitFor(`${p.name}: title buttons`, async () => (await st(p)).T > 3.2, 20000)
  await click(p, 640, 596)
  await waitFor(`${p.name}: name screen`, async () => (await dbg(p)).screen === 'name', 5000)
  await p.page.keyboard.type(p.name)
  await p.page.keyboard.press('Enter')
}

;(async () => {
  const browser = await chromium.launch({
    ...(process.env.MINITUDE_CHANNEL ? { channel: process.env.MINITUDE_CHANNEL } : {}),
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
  })
  const alice = await player(browser, 'Alice'), bob = await player(browser, 'Bob')
  await lobby(alice)
  await clickItem(alice, 'menu-create'); await clickItem(alice, 'create-go')
  await waitFor('room made', async () => (await dbg(alice)).room, 10000)
  const code = (await dbg(alice)).room.code
  ok((await dbg(alice)).room.visibility === 'private', 'a room made without touching the toggle is private', code)
  await lobby(bob)
  await clickItem(bob, 'menu-join')
  await bob.page.keyboard.type(code)
  await bob.page.keyboard.press('Enter')
  try {
    await waitFor('both connected', async () => { const d = await dbg(alice); return d.room.players.length === 2 && d.room.players.every((p) => p.connected) }, 15000)
  } catch (e) {
    // show what each browser saw, so a failure here can be told apart: Bob never joined, or joined and never connected
    for (const p of [alice, bob]) { const d = await dbg(p); delete d.items; console.log('   ' + p.name + ' sees:', JSON.stringify(d)) }
    throw e
  }
  ok((await (await fetch(BASE + '/api/versus/rooms')).json()).rooms.every((r) => r.code !== code), 'a private room is not in the public list')

  const t0 = Date.now()
  await clickItem(alice, 'room-start')
  await waitFor('the first question on both screens', async () => (await st(alice)).q && (await st(bob)).q, 30000)
  const lead = (Date.now() - t0) / 1000
  ok(lead > 2.5 && lead < 15, 'the first question came after the short lead time', `${lead.toFixed(1)} s`)
  await shot(alice, 'live-1-question')

  // both answer; the next question must wait until both screens have finished their reveal
  const id = (await st(alice)).q.id
  const answers = bank.get(id).answers.slice().sort((a, b) => a.tier - b.tier)
  // an answer typed before the question accepts typing is ignored (the game clock can run slower than real time in a headless browser)
  await waitFor('Alice can type', async () => (await st(alice)).canType, 30000)
  await alice.page.evaluate((t) => window.__mtv.game.debugAnswer(t), answers[answers.length - 1].name)
  await sleep(1500)
  await waitFor('Bob can type', async () => (await st(bob)).canType, 30000)
  await bob.page.evaluate((t) => window.__mtv.game.debugAnswer(t), answers[0].name)
  try {
    await waitFor('the round ended', async () => !!(await dbg(alice)).round?.items, 20000)
  } catch (e) {
    // show what each browser saw, so a failure here can be told apart (an answer not accepted, a roll that never finished, ...)
    for (const p of [alice, bob]) {
      const s = await st(p), d = await dbg(p)
      console.log('   ' + p.name + ' game:', JSON.stringify({ T: s.T, phase: s.phase, pending: s.pending, canType: s.canType, confirm: s.confirm, message: s.message, rec: s.rec && { i: s.rec.i, known: s.rec.known, miss: s.rec.miss, start: s.rec.start, rev: s.rec.rev, next: s.rec.next } }))
      console.log('   ' + p.name + ' room view:', JSON.stringify({ own: d.own, conn: d.conn, round: d.round }))
    }
    throw e
  }
  const tEnd = Date.now()
  await shot(bob, 'live-2-after-round')
  await waitFor('question two on both screens', async () => { const a = await st(alice), b = await st(bob); return a.q && b.q && a.q.id !== id && b.q.id !== id }, 120000)
  const gap = (Date.now() - tEnd) / 1000
  ok(gap > 4, 'the next question waited for the reveals to finish', `${gap.toFixed(1)} s after the round ended`)
  ok((await st(alice)).q.id === (await st(bob)).q.id, 'both screens show the same second question')

  await alice.page.evaluate(() => window.__mtv.game.versus.leave())
  await bob.page.evaluate(() => window.__mtv.game.versus.leave())
  await sleep(300)
  ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '))
  console.log(bad ? `${bad} PROBLEM(S)` : 'all live multiplayer checks pass')
  await browser.close()
  process.exit(bad ? 1 : 0)

  async function shot(p, name) { await p.page.locator('#game').screenshot({ path: path.join(OUT, `versus-${name}.png`) }) }
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
