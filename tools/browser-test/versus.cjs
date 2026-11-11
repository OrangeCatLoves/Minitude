// Plays a whole multiplayer match with three browsers (Alice, Bob, Cara) through the real screens.
//   MINITUDE_URL=http://127.0.0.1:8791 MINITUDE_CHANNEL=chrome node versus.cjs
// Needs a server in MOCK mode on a COPY of the database (never the live one), serving the built game, and a bank file exported from
// that copy (questions export <file> --all) so the script knows valid answers. Each browser runs in ?manual=1&debug=1 mode: its game
// clock only moves when this script moves it, so the reveal animations (10 to 20 seconds each) take no real time. The server's own
// clock is real, and so is everything that travels over the network.
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const BASE = process.env.MINITUDE_URL || 'http://127.0.0.1:8791'
const BANK_FILE = process.env.MINITUDE_BANK || path.join(__dirname, '..', '..', 'packages', 'server', 'data', 'mp-test-bank.json')
const OUT = path.join(__dirname, 'out')
fs.mkdirSync(OUT, { recursive: true })
const bank = new Map(JSON.parse(fs.readFileSync(BANK_FILE, 'utf8')).questions.map((q) => [q.id, q]))

let bad = 0
const errors = []
const ok = (c, w, d = '') => { if (!c) bad++; console.log((c ? 'ok       ' : 'PROBLEM  ') + w + (d ? '  ' + d : '')) }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function newPlayer(browser, name) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push(`${name}: pageerror: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_ABORTED/.test(m.text())) errors.push(`${name}: console: ${m.text()}`) })
  await page.goto(BASE + '/?manual=1&debug=1')
  await page.waitForFunction(() => window.__mtv && window.__mt, null, { timeout: 60000 })
  return { name, ctx, page, left: false }
}
const dbg = (p) => p.page.evaluate(() => window.__mtv.game.versusDebug())
const st = (p) => p.page.evaluate(() => window.__mtv.game.debugState())
const step = (p, sec) => p.page.evaluate((s) => window.__mtv.game.debugAdvance(s, false), sec)
const shot = async (p, name, settle = 0) => { if (settle) await step(p, settle); await p.page.evaluate(() => window.__mt.draw()); await p.page.locator('#game').screenshot({ path: path.join(OUT, `versus-${name}.png`) }) }

async function clickCanvas(p, x, y) {
  const box = await p.page.locator('#game').boundingBox()
  await p.page.mouse.click(box.x + (x / 1280) * box.width, box.y + (y / 720) * box.height)
  await step(p, 0.05)
}
async function clickItem(p, action, arg) {
  const d = await dbg(p)
  const it = d.items.find((i) => i.action === action && (arg === undefined || i.arg === arg))
  if (!it) throw new Error(`${p.name}: no "${action}" on screen "${d.screen}" (has: ${d.items.map((i) => i.action).join(', ')})`)
  if (!it.enabled) throw new Error(`${p.name}: "${action}" is switched off`)
  await clickCanvas(p, it.box.x + it.box.w / 2, it.box.y + it.box.h / 2)
}

/** keeps every browser's clock and network moving until the test is true (real time limit, not game time) */
async function until(players, test, what, limitMs = 30000) {
  const t0 = Date.now()
  for (;;) {
    for (const p of players) if (!p.left) await step(p, 0.2)
    if (await test()) return
    if (Date.now() - t0 > limitMs) throw new Error('timed out waiting for: ' + what)
    await sleep(40)
  }
}
const active = (ps) => ps.filter((p) => !p.left)

async function openLobbyAndName(p) {
  if (p.name === 'Alice') await shot(p, '0-title', 4)
  await clickCanvas(p, 640, 596)   // the MULTIPLAYER button on the title screen
  if (p.name === 'Alice') await shot(p, '0b-name', 1)
  let d = await dbg(p)
  ok(d.screen === 'name', `${p.name}: the lobby opens on the name screen`, `(${d.screen})`)
  await p.page.keyboard.type(p.name)
  d = await dbg(p)
  ok(d.field === p.name, `${p.name}: typing fills the name field`, `("${d.field}")`)
  await p.page.keyboard.press('Enter')
  d = await dbg(p)
  ok(d.screen === 'menu', `${p.name}: Enter takes the name and shows the menu`, `(${d.screen})`)
}

/** a valid answer for the question the player sees: 'rare' = the rarest in the bank, 'common' = the commonest, 'mid' = one in between */
function pick(qid, how) {
  const a = bank.get(qid).answers.slice().sort((x, y) => x.tier - y.tier)
  return how === 'rare' ? a[a.length - 1] : how === 'common' ? a[0] : a[Math.floor(a.length / 2)]
}
async function qid(p) { return (await st(p)).q?.id ?? null }

;(async () => {
  const browser = await chromium.launch({
    ...(process.env.MINITUDE_CHANNEL ? { channel: process.env.MINITUDE_CHANNEL } : {}),
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
  })
  const alice = await newPlayer(browser, 'Alice'), bob = await newPlayer(browser, 'Bob'), cara = await newPlayer(browser, 'Cara')
  const all = [alice, bob, cara]

  // ---------------------------------------------------------------- the lobby
  await openLobbyAndName(alice)
  await shot(alice, '1-menu', 1)
  await clickItem(alice, 'menu-create')
  await clickItem(alice, 'create-public')
  await clickItem(alice, 'create-go')
  await until([alice], async () => (await dbg(alice)).room, 'Alice has a room')
  let da = await dbg(alice)
  const code = da.room.code
  ok(/^[A-Z0-9]{5}$/.test(code) && da.room.visibility === 'public' && da.room.players[0].host, 'Alice created a public room and is the host', code)

  await openLobbyAndName(bob)
  await clickItem(bob, 'menu-join')
  await p_type(bob, code.toLowerCase())
  await bob.page.keyboard.press('Enter')
  await until([alice, bob], async () => (await dbg(bob)).room && (await dbg(bob)).room.players.length === 2, 'Bob joined by code')
  ok((await dbg(bob)).screen === 'room', 'Bob joined by typing the code (lower case is fine)')

  await openLobbyAndName(cara)
  await clickItem(cara, 'menu-browse')
  await until([alice, bob, cara], async () => (await dbg(cara)).items.some((i) => i.action === 'browse-join' && i.arg === code), 'the public room is listed')
  await shot(cara, '2-public-list', 1)
  await clickItem(cara, 'browse-join', code)
  await until(all, async () => { const ds = await Promise.all(all.map(dbg)); return ds.every((d) => d.room && d.room.players.length === 3 && d.room.players.every((p) => p.connected)) }, 'three players in the room, all connected')
  const room3 = (await dbg(bob)).room
  ok(room3.players.map((p) => p.name).join() === 'Alice,Bob,Cara' && room3.players.every((p) => p.connected), 'everybody sees the same three players, all connected')
  await shot(alice, '3-room', 1)
  await shot(bob, '3b-room-guest', 1)

  // only the host gets a start button
  ok((await dbg(bob)).items.every((i) => i.action !== 'room-start'), 'a guest has no START button')
  // the name filter
  const dave = await newPlayer(browser, 'Dave')
  await clickCanvas(dave, 640, 596)
  await dave.page.keyboard.type('f u c k')
  await dave.page.keyboard.press('Enter')
  await clickItem(dave, 'menu-join')
  await p_type(dave, code)
  await dave.page.keyboard.press('Enter')
  await until([dave], async () => !!(await dbg(dave)).error, 'the server to refuse the name', 5000)
  const dd = await dbg(dave)
  ok(dd.screen === 'join' && dd.room === null && /another name/i.test(dd.error), 'the server turns a blocked name away and Dave stays out of the room', `(${dd.screen}: ${dd.error})`)
  ok((await dbg(alice)).room.players.length === 3, 'and nobody in the room noticed')
  await dave.ctx.close()

  // ---------------------------------------------------------------- the match
  await clickItem(alice, 'room-start')
  await until(all, async () => (await Promise.all(all.map(qid))).every((x) => x), 'the first question for everybody', 20000)
  const ids0 = await Promise.all(all.map(qid))
  ok(ids0.every((x) => x === ids0[0]), 'everybody got the same first question at the same time', ids0.join(' '))
  ok((await dbg(alice)).inMatch && (await dbg(bob)).inMatch && (await dbg(cara)).inMatch, 'every screen went from the room to the match')
  const q0 = ids0[0]
  const aliceSeat = (await dbg(alice)).room.you

  // round 0: Alice rarest; Bob tries a wrong answer first, then the commonest; Cara an answer in between
  await step(alice, 1); await step(bob, 1); await step(cara, 1)
  const rare = pick(q0, 'rare'), common = pick(q0, 'common'), mid = pick(q0, 'mid')
  await alice.page.evaluate((t) => window.__mtv.game.debugAnswer(t), rare.name)
  await until(all, async () => (await st(alice)).rec?.known, 'Alice\'s answer was judged')
  const aRec = (await st(alice)).rec
  ok(aRec.ti === rare.tier, "Alice's answer was judged with its stored rarity", '(' + rare.name + ': tier ' + rare.tier + ', got ' + aRec.ti + ')')
  // the roll animation is still playing on Alice's screen, so her rarity must show nowhere yet: not in her own panel, not in the others'
  ok((await dbg(alice)).own === null, "Alice's own panel does not show her rarity while her roll is still playing")
  ok(!(await dbg(bob)).round.answered.some((a) => a.seat === aliceSeat) && !(await dbg(cara)).round.answered.some((a) => a.seat === aliceSeat), "Bob's and Cara's panels do not show Alice's rarity while her roll is still playing")
  // her roll finishes: now her own panel can show it, and the server tells the others
  await until(all, async () => (await dbg(alice)).own !== null, "Alice's roll animation ended")
  ok((await dbg(alice)).own.tier === rare.tier, "Alice's own panel shows her rarity once her roll is over")
  await until(all, async () => (await dbg(bob)).round.answered.some((a) => a.seat === aliceSeat), "Bob sees Alice's rarity")
  const seenByBob = (await dbg(bob)).round.answered.find((a) => a.seat === aliceSeat)
  ok(seenByBob.tier === rare.tier && !seenByBob.miss && seenByBob.points > 0, "Bob sees Alice's rarity and points when her roll is over", JSON.stringify(seenByBob))
  ok(!JSON.stringify((await dbg(bob)).round.answered).includes(rare.name) && (await dbg(bob)).round.items === null, 'but not what Alice answered (the text stays hidden until the round ends)')
  await shot(bob, '4-bob-sees-alice-answer')
  await step(bob, 1)
  await bob.page.evaluate(() => window.__mtv.game.debugAnswer('zzzz not an answer'))
  await until(all, async () => (await st(bob)).message, 'Bob is told his wrong answer does not count')
  ok((await dbg(alice)).round.answered.length === 1, 'still only one result announced after Bob\'s wrong answer')
  await bob.page.evaluate((t) => window.__mtv.game.debugAnswer(t), common.name)
  await cara.page.evaluate((t) => window.__mtv.game.debugAnswer(t), mid.name)
  await until(all, async () => (await dbg(alice)).round.phase === 'between' && !!(await dbg(alice)).round.items, 'the round ended for everybody')
  const items = (await dbg(alice)).round.items
  ok(items.length === 3 && items.every((i) => i.answer), 'when the round is over everybody\'s answers are shown', items.map((i) => i.answer).join(' | '))
  ok(items.find((i) => i.seat === aliceSeat).answer === rare.name, 'the answers shown are the answers given')
  const total1 = new Map((await dbg(bob)).totals)
  ok([...total1.values()].every((v) => v > 0), 'running totals are kept', JSON.stringify([...total1]))
  await step(alice, 3); await shot(alice, '5-alice-after-round')

  // the next question waits until every screen has finished its reveal, then starts for everybody together
  await step(alice, 40); await step(bob, 40)                       // Alice and Bob finish watching their reveals...
  await sleep(500)
  ok((await qid(alice)) === q0, 'the next question does not start while Cara is still watching her reveal')
  await step(cara, 40)
  await until(all, async () => (await Promise.all(all.map(qid))).every((x) => x && x !== q0), 'question two for everybody', 15000)
  ok(true, 'once all three were ready, question two started for everybody')

  // rounds 1 and 2: everybody answers; round 3: Cara lets her time run out; round 4: Cara leaves; rounds 5 and 6: Alice and Bob
  let who = all
  for (let r = 1; r <= 6; r++) {
    const players = active(who)
    await until(players, async () => (await Promise.all(players.map(async (p) => (await st(p)).rec?.i))).every((i) => i === r) && (await Promise.all(players.map(qid))).every((x) => x), `question ${r + 1} on screen`, 20000)
    const id = await qid(players[0])
    for (const p of players) await step(p, 1)
    if (r === 3) {
      // Cara does nothing; her own clock runs out (31 game seconds later)
      for (const p of players.filter((x) => x !== cara)) await p.page.evaluate((t) => window.__mtv.game.debugAnswer(t), pick(id, 'common').name)
      await sleep(300)
      ok(!(await dbg(alice)).round.items, 'round 4 is still open while Cara has neither answered nor run out of time')
      await step(cara, 31)
      await until(all, async () => !!(await dbg(alice)).round.items, 'the round ended when Cara\'s time ran out')
      const caraSeat = (await dbg(cara)).room.you
      const it = (await dbg(alice)).round.items.find((i) => i.seat === caraSeat)
      ok(it.miss && it.answer === null, 'Cara\'s timed-out question counts as no answer, 0 points')
    } else if (r === 4) {
      await cara.page.evaluate(() => window.__mtv.game.versus.leave())
      cara.left = true
      await until(active(who), async () => (await dbg(alice)).room.players.find((p) => p.name === 'Cara')?.gone === true, 'the others see that Cara left')
      await shot(alice, '6-cara-left')
      for (const p of active(who)) await p.page.evaluate((t) => window.__mtv.game.debugAnswer(t), pick(id, 'mid').name)
    } else {
      for (const [k, p] of players.entries()) await p.page.evaluate((t) => window.__mtv.game.debugAnswer(t), pick(id, k === 0 ? 'rare' : 'common').name)
    }
    await until(active(who), async () => !!(await dbg(alice)).round.items && (await dbg(alice)).round.index === r, `round ${r + 1} ended`)
    if (r < 6) {
      for (const p of active(who)) await step(p, 40)
      await until(active(who), async () => (await Promise.all(active(who).map(async (p) => (await st(p)).rec?.i))).every((i) => i === r + 1) || (await dbg(alice)).round.index === r + 1, `round ${r + 2} began`, 15000)
    }
  }

  // ---------------------------------------------------------------- the end
  // the first player to finish watching the last reveal must NOT get the result page while another is still watching theirs
  await step(alice, 60); await sleep(700); await step(alice, 1)
  ok((await st(alice)).phase === 'run' && (await dbg(alice)).end === null, 'a player who has finished the last question waits (no result page) while another player is still watching their last reveal')
  await step(bob, 60)
  await until(active(who), async () => (await Promise.all(active(who).map(async (p) => (await st(p)).phase))).every((x) => x === 'report'), 'the result screen', 15000)
  ok(true, 'once the last player had finished, the result page opened for both')
  const end = (await dbg(alice)).end
  ok(end && end.length === 3, 'the match ended with the standings of all three players (Cara included, with her zeros)', JSON.stringify(end))
  ok(end[0].rank === 1 && end.every((s) => s.total >= 0), 'standings are ranked, best first')
  const cs = end.find((s) => s.name === 'Cara')
  ok(cs.total < end[0].total, 'a player who left the match finished behind')
  await step(alice, 6); await shot(alice, '7-results'); await step(bob, 6); await shot(bob, '7b-results-bob')

  // ---------------------------------------------------------------- back to the room, a rematch, leaving
  await clickCanvas(alice, 371, 675); await clickCanvas(bob, 371, 675)   // BACK TO ROOM
  await until(active(who), async () => (await dbg(alice)).screen === 'room' && (await dbg(bob)).screen === 'room', 'both are back in the room')
  ok((await dbg(alice)).room.status === 'finished' && (await dbg(bob)).items.every((i) => i.action !== 'room-rematch'), 'after a match only the host is offered PLAY AGAIN')
  await clickItem(alice, 'room-rematch')
  await until(active(who), async () => (await dbg(bob)).room.status === 'waiting', 'the room is open again for both')
  ok((await dbg(alice)).room.players.map((p) => p.name).join() === 'Alice,Bob', 'the player who left is not in the room for the rematch')
  // ---------------------------------------------------------------- a second match: nothing of the first one may show in it
  const two = [alice, bob]
  await clickItem(alice, 'room-start')
  await until(two, async () => (await Promise.all(two.map(qid))).every((x) => x), 'the first question of match two', 20000)
  ok((await dbg(bob)).end === null && (await dbg(bob)).totals.length === 0 && (await dbg(alice)).totals.length === 0, 'the second match starts with no totals and no standings left over from the first')
  for (let r = 0; r <= 6; r++) {
    await until(two, async () => (await Promise.all(two.map(async (p) => (await st(p)).rec?.i))).every((i) => i === r) && (await Promise.all(two.map(qid))).every((x) => x), 'match two: question ' + (r + 1), 20000)
    const id = await qid(alice)
    for (const p of two) await step(p, 1)
    if (r < 6) {
      await alice.page.evaluate((t) => window.__mtv.game.debugAnswer(t), pick(id, 'rare').name)
      await bob.page.evaluate((t) => window.__mtv.game.debugAnswer(t), pick(id, 'common').name)
      await until(two, async () => !!(await dbg(alice)).round.items && (await dbg(alice)).round.index === r, 'match two: round ' + (r + 1) + ' ended')
      for (const p of two) await step(p, 40)
    } else {
      // the last question: Alice answers and watches everything; Bob has not answered yet
      await alice.page.evaluate((t) => window.__mtv.game.debugAnswer(t), pick(id, 'rare').name)
      await until(two, async () => (await st(alice)).rec?.known, 'Alice answered the last question')
      await step(alice, 60); await sleep(700); await step(alice, 1)
      ok((await st(alice)).phase === 'run' && (await dbg(alice)).end === null, 'match two: Alice, finished with the last question, is not taken to the result page while Bob is still answering')
      await bob.page.evaluate((t) => window.__mtv.game.debugAnswer(t), pick(id, 'common').name)
      await until(two, async () => !!(await dbg(alice)).round.items && (await dbg(alice)).round.index === 6, 'match two: the last round ended')
      await step(alice, 5); await sleep(300); await step(alice, 1)
      ok((await st(alice)).phase === 'run', 'match two: and still not while Bob is watching his last reveal')
      await step(bob, 60)
      await until(two, async () => (await Promise.all(two.map(async (p) => (await st(p)).phase))).every((x) => x === 'report'), 'match two: the result page for both', 15000)
    }
  }
  const end2 = (await dbg(alice)).end
  ok(end2 && end2.length === 2 && end2.every((s) => s.name !== 'Cara') && end2[0].rounds === 7, "the second match ended with its own standings (two players, not the first match's three)", JSON.stringify(end2))
  await step(alice, 5); await step(bob, 5)
  await clickCanvas(bob, 561, 675)        // HOME: leaves the room
  await until([alice], async () => (await dbg(alice)).room.players.length === 1, 'Alice sees Bob leave')
  await clickCanvas(alice, 561, 675)
  await until([alice], async () => (await st(alice)).phase === 'title', 'Alice is back on the title screen')
  await sleep(300)
  const list = await (await fetch(BASE + '/api/versus/rooms')).json()
  ok(list.rooms.length === 0, 'after everybody left no room is listed', JSON.stringify(list.rooms))

  ok(errors.length === 0, 'no page errors in any browser', errors.slice(0, 5).join(' | '))
  console.log(bad ? `${bad} PROBLEM(S)` : 'all multiplayer checks pass')
  await browser.close()
  process.exit(bad ? 1 : 0)
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })

/** types into the hidden box one key at a time, like a person */
async function p_type(p, text) { await p.page.keyboard.type(text) }
