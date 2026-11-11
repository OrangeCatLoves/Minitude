import { describe, expect, it } from 'vitest'
import { TIERS, type AnswerResponse, type VEvent } from '@minitude/core'
import { createApp, GRACE_MS, MAX_ATTEMPTS_PER_QUESTION, QUESTION_SECONDS, START_DELAY_MS } from '../src/app'
import { checkName } from '../src/names'
import { VersusError, VersusHub } from '../src/versus'
import type { Judge, JudgeOutcome } from '../src/judge/types'
import type { QuestionHead } from '../src/questions'
import { testRepo } from './helpers'

const heads: QuestionHead[] = Array.from({ length: 8 }, (_, i) => ({ id: `q${i}`, category: `Cat ${i}`, prompt: `Prompt number ${i}?`, rules: 'rules' }))
const CODES = ['QAAAA', 'QBBBB', 'QCCCC', 'QDDDD', 'QEEEE', 'QFFFF', 'QGGGG', 'QHHHH']
const NAMES = ['Alice', 'Bob', 'Cara', 'Dan']

/** answers from a script: "common" "rare" "mythic" are valid, "typo" asks "did you mean", "slow" waits for the test, anything else is not an answer */
class FakeJudge implements Judge {
  readonly kind = 'mock' as const
  calls: string[] = []
  gate: { resolve: () => void; promise: Promise<void> } | null = null
  async judge(_q: QuestionHead, text: string): Promise<JudgeOutcome> {
    this.calls.push(text)
    if (text === 'slow' && this.gate) await this.gate.promise
    const tier = text === 'common' ? 0 : text === 'rare' ? 3 : text === 'mythic' || text === 'slow' ? 5 : -1
    if (text === 'typo') return { res: { status: 'confirm', answer: 'Something' }, via: 'typo' }
    if (tier < 0) return { res: { status: 'invalid', message: 'No.' }, via: 'stored' }
    const res: AnswerResponse = { status: 'valid', answer: text.toUpperCase(), description: `About ${text}.`, tier, points: TIERS[tier].points }
    return { res, via: 'stored' }
  }
  hold(): void { let resolve!: () => void; const promise = new Promise<void>((r) => { resolve = r }); this.gate = { resolve, promise } }
}

function setup(players = 2, opts: Partial<ConstructorParameters<typeof VersusHub>[0]> = {}) {
  const clock = { t: 1_000_000 }
  const judge = new FakeJudge()
  let n = 0
  const hub = new VersusHub({ judge, heads: () => heads, pick: (h) => h.slice(0, 7), now: () => clock.t, rand: () => 0.5, seconds: QUESTION_SECONDS, makeCode: () => CODES[n++], ...opts })
  const guests = Array.from({ length: players }, (_, i) => `guest-${i}-aaaaaaaaaaaaaaaa`)
  const code = hub.create(guests[0], NAMES[0], 'private').code
  for (let i = 1; i < players; i++) hub.join(guests[i], code, NAMES[i])
  const inbox = guests.map(() => [] as VEvent[])
  const unsub = guests.map((g, i) => hub.subscribe(g, code, (e) => inbox[i].push(e)))
  const of = <T extends VEvent['type']>(i: number, type: T) => inbox[i].filter((e) => e.type === type) as Extract<VEvent, { type: T }>[]
  const start = () => { hub.start(guests[0], code); clock.t += 3000; hub.tick() }
  return { hub, clock, judge, guests, code, inbox, unsub, of, start }
}

type Ctx = ReturnType<typeof setup>
function clock_advance(t: Ctx): void { t.clock.t += 3000; t.hub.tick() }
/** the players answer (texts in seat order, null = does not answer) and then each answerer's roll animation ends */
async function roundOf(t: Ctx, round: number, texts: (string | null)[]): Promise<void> {
  for (const [i, tx] of texts.entries()) if (tx) await t.hub.answer(t.guests[i], t.code, round, tx)
  texts.forEach((tx, i) => { if (tx) t.hub.revealed(t.guests[i], t.code, round) })
}

describe('names', () => {
  it('accepts plain names and tidies spaces', () => {
    expect(checkName('  Alice   B ')).toEqual({ ok: true, name: 'Alice B' })
    expect(checkName('Zoë')).toMatchObject({ ok: true })
    for (const ok of ['Cassidy', 'Dickens', 'Classic', 'Grape Ape', 'Swank', 'Nazim', 'Assad']) expect(checkName(ok), ok).toMatchObject({ ok: true })
  })
  it('refuses too short, too long and odd characters', () => {
    expect(checkName('A').ok).toBe(false)
    expect(checkName('x'.repeat(17)).ok).toBe(false)
    expect(checkName('<b>hi</b>').ok).toBe(false)
    expect(checkName(42).ok).toBe(false)
  })
  it('refuses blocked words, also in disguise', () => {
    for (const bad of ['fuck', 'F u c k', 'sh1t', '@sshole', 'FUUUCK', 'b!tch', 'dick', 'D1ck', 'n a z i']) expect(checkName(bad).ok, bad).toBe(false)
  })
})

describe('rooms', () => {
  it('creates a room with a code and the creator as host, and others join it', () => {
    const { hub, code, guests } = setup(2)
    expect(code).toMatch(/^[A-Z0-9]{5}$/)
    const view = hub.join(guests[1], code.toLowerCase(), 'Bob')   // codes are not case sensitive and joining twice is the same seat
    expect(view.you).toBe(1)
    expect(view.players.map((p) => [p.name, p.host])).toEqual([['Alice', true], ['Bob', false]])
  })
  it('refuses a missing room, a taken name, a bad name, a fifth player and a started match', () => {
    const { hub, code, guests, start } = setup(2)
    expect(() => hub.join('stranger-aaaaaaaaaaaaaaaa', 'QZZZZ', 'Cara')).toThrow(/No room/)
    expect(() => hub.join('stranger-aaaaaaaaaaaaaaaa', code, 'alice')).toThrow(/taken/)
    expect(() => hub.join('stranger-aaaaaaaaaaaaaaaa', code, 'shit')).toThrow(VersusError)
    hub.join('g3-aaaaaaaaaaaaaaaaaa', code, 'Cara')
    hub.join('g4-aaaaaaaaaaaaaaaaaa', code, 'Dan')
    expect(() => hub.join('g5-aaaaaaaaaaaaaaaaaa', code, 'Eve')).toThrow(/full/)
    start()
    expect(() => hub.join('g6-aaaaaaaaaaaaaaaaaa', code, 'Fay')).toThrow(/already started/)
    void guests
  })
  it('lists only public rooms that are waiting, have room and have somebody connected', () => {
    const { hub, code, guests } = setup(2)
    expect(hub.listPublic()).toEqual([])
    hub.setVisibility(guests[0], code, 'public')
    expect(hub.listPublic()).toEqual([{ code, host: 'Alice', players: 2, max: 4 }])
    expect(() => hub.setVisibility(guests[1], code, 'private')).toThrow(/host/)
    hub.setVisibility(guests[0], code, 'private')
    expect(hub.listPublic()).toEqual([])
  })
  it('hands the host to the next player when the host leaves, and removes an empty room', () => {
    const { hub, code, guests, of } = setup(2)
    hub.leave(guests[0], code)
    const last = of(1, 'room').pop()!.room
    expect(last.players).toHaveLength(1)
    expect(last.players[0]).toMatchObject({ name: 'Bob', host: true })
    hub.leave(guests[1], code)
    expect(hub.roomCount).toBe(0)
  })
  it('only the host starts, and needs two connected players', () => {
    const { hub, code, guests } = setup(2)
    expect(() => hub.start(guests[1], code)).toThrow(/host/)
    const solo = new VersusHub({ judge: new FakeJudge(), heads: () => heads, pick: (h) => h.slice(0, 7), now: () => 1, rand: () => 0.5, seconds: 30, makeCode: () => 'QAAAA' })
    const c = solo.create('only-aaaaaaaaaaaaaaaaaa', 'Solo', 'private').code
    solo.subscribe('only-aaaaaaaaaaaaaaaaaa', c, () => {})
    expect(() => solo.start('only-aaaaaaaaaaaaaaaaaa', c)).toThrow(/at least 2/)
  })
  it('refuses to start without seven questions', () => {
    const { hub, code, guests } = setup(2, { pick: () => [] })
    expect(() => hub.start(guests[0], code)).toThrow(/enough questions/)
  })
})

describe('a match', () => {
  it('starts the first question for everybody at the same moment, after the lead time', () => {
    const { hub, clock, code, guests, of } = setup(3)
    hub.start(guests[0], code)
    expect(of(0, 'roundStart')).toHaveLength(0)
    clock.t += 2999; hub.tick()
    expect(of(0, 'roundStart')).toHaveLength(0)
    clock.t += 1; hub.tick()
    for (let i = 0; i < 3; i++) {
      const s = of(i, 'roundStart')
      expect(s).toHaveLength(1)
      expect(s[0].start).toMatchObject({ round: 0, count: 7, seconds: 30, question: { id: 'q0', prompt: 'Prompt number 0?' } })
    }
  })

  it("shows a player's rarity and points to the others only when that player's own roll is over, and the answer text only when the round is over", async () => {
    const { hub, code, guests, of, start } = setup(2)
    start()
    const res = await hub.answer(guests[0], code, 0, 'rare')
    expect(res).toMatchObject({ status: 'valid', tier: 3, points: 60, answer: 'RARE' })
    // judged, but Alice's roll animation is still playing: nobody else may see the rarity yet
    expect(of(1, 'answered')).toHaveLength(0)
    hub.revealed(guests[0], code, 0)
    const seen = of(1, 'answered')
    expect(seen).toHaveLength(1)
    expect(seen[0].answered).toEqual({ round: 0, seat: 0, miss: false, tier: 3, points: 60 })
    expect(JSON.stringify(seen[0])).not.toMatch(/RARE|About/)   // no answer text in the live update
    expect(of(1, 'roundEnd')).toHaveLength(0)
    await hub.answer(guests[1], code, 0, 'common')
    // everybody has an answer, but Bob's roll is still playing: announcing the round now would show his rarity early
    expect(of(1, 'roundEnd')).toHaveLength(0)
    expect(of(0, 'answered')).toHaveLength(1)
    hub.revealed(guests[1], code, 0)
    const end = of(1, 'roundEnd')[0].end
    expect(end.items).toEqual([
      { seat: 0, miss: false, tier: 3, points: 60, answer: 'RARE' },
      { seat: 1, miss: false, tier: 0, points: 10, answer: 'COMMON' },
    ])
    expect(end.totals).toEqual([{ seat: 0, total: 60 }, { seat: 1, total: 10 }])
  })

  it("shows a result anyway after a while when the player's screen never says the roll is over", async () => {
    const { hub, clock, code, guests, of, start } = setup(2)
    start()
    await hub.answer(guests[0], code, 0, 'rare')
    clock.t += 7_999; hub.tick()
    expect(of(1, 'answered')).toHaveLength(0)
    clock.t += 1; hub.tick()
    expect(of(1, 'answered')[0].answered).toMatchObject({ seat: 0, tier: 3 })
    // a reveal that comes late changes nothing
    hub.revealed(guests[0], code, 0)
    expect(of(1, 'answered')).toHaveLength(1)
  })

  it('shows a result at once for a player who leaves with their roll still playing', async () => {
    const { hub, code, guests, of, start } = setup(3)
    start()
    await hub.answer(guests[0], code, 0, 'rare')
    expect(of(1, 'answered')).toHaveLength(0)
    hub.leave(guests[0], code)
    expect(of(1, 'answered').map((a) => a.answered.seat)).toEqual([0])
  })

  it('does not score a wrong answer, lets the player try again, and only asks for a confirmation on a typo', async () => {
    const { hub, code, guests, of, start } = setup(2)
    start()
    expect(await hub.answer(guests[0], code, 0, 'banana')).toMatchObject({ status: 'invalid' })
    expect(await hub.answer(guests[0], code, 0, 'typo')).toMatchObject({ status: 'confirm' })
    expect(of(1, 'answered')).toHaveLength(0)
    expect(await hub.answer(guests[0], code, 0, 'common')).toMatchObject({ status: 'valid' })
  })

  it('waits for every connected player to finish their reveal before the next question, but not forever', async () => {
    const t = setup(2)
    const { hub, clock, code, guests, of, start } = t
    start()
    await roundOf(t, 0, ['rare', 'rare'])
    expect(of(0, 'roundStart')).toHaveLength(1)
    clock.t += 10_000; hub.tick()
    expect(of(0, 'roundStart')).toHaveLength(1)
    hub.ready(guests[0], code, 0)
    expect(of(0, 'roundStart')).toHaveLength(1)
    hub.ready(guests[1], code, 0)
    expect(of(0, 'roundStart')).toHaveLength(2)
    expect(of(1, 'roundStart')[1].start.round).toBe(1)
    // and a slow player cannot hold the others for more than the longest wait
    await roundOf(t, 1, ['rare', 'rare'])
    hub.ready(guests[0], code, 1)
    clock.t += 39_999; hub.tick()
    expect(of(0, 'roundStart')).toHaveLength(2)
    clock.t += 1; hub.tick()
    expect(of(0, 'roundStart')).toHaveLength(3)
  })

  it('closes a question when the time runs out, with the same allowance as solo', async () => {
    const t = setup(2)
    const { hub, clock, code, guests, of, start } = t
    start()
    await roundOf(t, 0, ['rare', null])
    const allowed = QUESTION_SECONDS * 1000 + START_DELAY_MS + GRACE_MS
    clock.t += allowed - 10; hub.tick()
    expect(of(0, 'roundEnd')).toHaveLength(0)
    clock.t += 20; hub.tick()
    const end = of(0, 'roundEnd')[0].end
    expect(end.items[1]).toEqual({ seat: 1, miss: true, tier: null, points: 0, answer: null })
    await expect(hub.answer(guests[1], code, 0, 'rare')).rejects.toMatchObject({ code: 'late', status: 409 })
  })

  it("accepts a player's own miss message once and ignores it afterwards", async () => {
    const { hub, code, guests, of, start } = setup(2)
    start()
    hub.miss(guests[1], code, 0)
    hub.miss(guests[1], code, 0)
    expect(of(0, 'answered').filter((a) => a.answered.miss)).toHaveLength(1)
    await expect(hub.answer(guests[1], code, 0, 'rare')).rejects.toMatchObject({ code: 'finished' })
  })

  it("gives back the time the answer checker takes, as solo does", async () => {
    const { hub, clock, judge, code, guests, of, start } = setup(2)
    start()
    clock.t += 20_000
    judge.hold()
    const pending = hub.answer(guests[0], code, 0, 'slow')
    clock.t += 20_000; hub.tick()                    // 40 s since the question: far past 33.55 s, but 20 s of it was the checker
    // the other player's own time did run out meanwhile, but this player's answer was not counted as late
    expect(of(1, 'answered').filter((a) => a.answered.seat === 0)).toHaveLength(0)
    judge.gate!.resolve()
    expect(await pending).toMatchObject({ status: 'valid', tier: 5 })
    hub.revealed(guests[0], code, 0)
    expect(of(1, 'answered').find((a) => a.answered.seat === 0)!.answered).toMatchObject({ tier: 5, points: 100 })
  })

  it('announces nothing about the answers of a round until every roll animation is over, and the match ends for everybody together', async () => {
    const t = setup(3)
    const { hub, clock, code, guests, of, start } = t
    start()
    for (let r = 0; r < 6; r++) {
      await roundOf(t, r, ['mythic', 'common', 'common'])
      guests.forEach((g) => hub.ready(g, code, r))
    }
    // the last question: Alice and Bob answer and watch their rolls, Cara has not answered yet
    await hub.answer(guests[0], code, 6, 'mythic'); hub.revealed(guests[0], code, 6)
    await hub.answer(guests[1], code, 6, 'common'); hub.revealed(guests[1], code, 6)
    hub.ready(guests[0], code, 6); hub.ready(guests[1], code, 6)
    expect(of(0, 'matchEnd')).toHaveLength(0)       // nobody may go to the result page while Cara is still answering
    await hub.answer(guests[2], code, 6, 'common')
    expect(of(0, 'roundEnd')).toHaveLength(6)       // Cara's roll is still playing: round 7 is not announced yet
    hub.revealed(guests[2], code, 6)
    expect(of(0, 'roundEnd')).toHaveLength(7)
    expect(of(0, 'matchEnd')).toHaveLength(0)       // ... and still not over: Cara has not finished watching her last reveal
    hub.ready(guests[2], code, 6)
    for (let i = 0; i < 3; i++) expect(of(i, 'matchEnd'), 'player ' + i).toHaveLength(1)   // now all three get it at the same moment
    expect(of(0, 'room').pop()!.room.status).toBe('finished')
    void clock
  })

  it('ends the match anyway when a player never finishes their last reveal', async () => {
    const t = setup(2)
    const { hub, clock, code, guests, of, start } = t
    start()
    for (let r = 0; r < 6; r++) { await roundOf(t, r, ['rare', 'rare']); guests.forEach((g) => hub.ready(g, code, r)) }
    await roundOf(t, 6, ['rare', 'rare'])
    hub.ready(guests[0], code, 6)
    clock.t += 39_999; hub.tick()
    expect(of(0, 'matchEnd')).toHaveLength(0)
    clock.t += 1; hub.tick()
    expect(of(0, 'matchEnd')).toHaveLength(1)
  })

  it('refuses answers for the wrong round, from strangers, and too many tries', async () => {
    const { hub, code, guests, start } = setup(2)
    await expect(hub.answer(guests[0], code, 0, 'rare')).rejects.toMatchObject({ code: 'not_started' })
    start()
    await expect(hub.answer(guests[0], code, 3, 'rare')).rejects.toMatchObject({ code: 'not_started' })
    await expect(hub.answer('stranger-aaaaaaaaaaaaaaaa', code, 0, 'rare')).rejects.toMatchObject({ code: 'no_room', status: 404 })
    for (let i = 0; i < MAX_ATTEMPTS_PER_QUESTION; i++) await hub.answer(guests[0], code, 0, 'banana')
    await expect(hub.answer(guests[0], code, 0, 'banana')).rejects.toMatchObject({ code: 'too_many', status: 429 })
  })

  it('plays seven rounds, ranks the players (equal totals share a rank) and ends the match', async () => {
    const t = setup(3)
    const { hub, code, guests, of, start } = t
    start()
    for (let r = 0; r < 7; r++) {
      await roundOf(t, r, ['mythic', 'common', 'common'])
      guests.forEach((g) => hub.ready(g, code, r))
    }
    const end = of(2, 'matchEnd')[0].end
    expect(end.standings.map((s) => [s.name, s.total, s.rank])).toEqual([['Alice', 700, 1], ['Bob', 70, 2], ['Cara', 70, 2]])
    expect(end.standings[0].items).toHaveLength(7)
    expect(end.standings[0].items[0]).toEqual({ miss: false, tier: 5, points: 100, answer: 'MYTHIC' })
    expect(of(2, 'room').pop()!.room.status).toBe('finished')
    expect(of(2, 'roundStart')).toHaveLength(7)
  })

  it('takes everybody back to the room for a rematch, host only, and drops players who left', async () => {
    const t = setup(3)
    const { hub, code, guests, of, start } = t
    start()
    hub.leave(guests[2], code)
    for (let r = 0; r < 7; r++) {
      await roundOf(t, r, ['rare', 'rare', null])
      hub.ready(guests[0], code, r); hub.ready(guests[1], code, r)
    }
    expect(of(0, 'matchEnd')).toHaveLength(1)
    expect(() => hub.rematch(guests[1], code)).toThrow(/host/)
    const room = hub.rematch(guests[0], code)
    expect(room.status).toBe('waiting')
    expect(room.players.map((p) => p.name)).toEqual(['Alice', 'Bob'])
    hub.start(guests[0], code)   // and it can start again
    // the second match starts from nothing: the first round of it is not announced early by the first match's state
    clock_advance(t)
    expect(of(0, 'roundStart')).toHaveLength(8)
    expect(of(0, 'answered').filter((a) => a.answered.round === 0 && a.answered.seat !== 2).length).toBe(2)   // from match one only
  })
})

describe('players who leave or vanish', () => {
  it('scores 0 for the rest of the match for a player who leaves, and the match carries on', async () => {
    const t = setup(3)
    const { hub, code, guests, of, start } = t
    start()
    await roundOf(t, 0, ['rare', null, null])
    hub.leave(guests[2], code)
    expect(of(0, 'room').pop()!.room.players[2]).toMatchObject({ name: 'Cara', gone: true })
    await roundOf(t, 0, [null, 'rare', null])
    const end = of(0, 'roundEnd')[0].end
    expect(end.items[2]).toMatchObject({ seat: 2, miss: true })
    guests.slice(0, 2).forEach((g) => hub.ready(g, code, 0))
    // the next round does not wait for, or hear from, the player who left: they are marked "no answer" straight away
    expect(of(0, 'roundStart')).toHaveLength(2)
    expect(of(0, 'answered').filter((a) => a.answered.round === 1 && a.answered.seat === 2 && a.answered.miss)).toHaveLength(1)
  })

  it('treats a connection lost for more than the allowed time as leaving the match, but forgives a short break', () => {
    const { hub, clock, code, guests, unsub, of, start } = setup(3)
    start()
    unsub[2]()
    clock.t += 19_000; hub.tick()
    expect(of(0, 'room').pop()!.room.players[2].gone).toBe(false)
    expect(of(0, 'room').pop()!.room.players[2].connected).toBe(false)
    // back in time: the same seat, and the whole state comes with it
    const got: VEvent[] = []
    hub.subscribe(guests[2], code, (e) => got.push(e))
    expect(got[0]).toMatchObject({ type: 'sync', sync: { round: { round: 0, phase: 'answering', question: { id: 'q0' } } } })
    unsub[1]()
    clock.t += 21_000; hub.tick()
    expect(of(0, 'room').pop()!.room.players[1].gone).toBe(true)
  })

  it('removes a player who closes the page in the waiting room after a moment, and a room nobody is in', () => {
    const { hub, clock, code, unsub } = setup(2)
    unsub[1]()
    clock.t += 21_000; hub.tick()
    expect(hub.listPublic()).toEqual([])
    unsub[0]()
    clock.t += 200_000; hub.tick()
    expect(hub.roomCount).toBe(0)
    expect(() => hub.subscribe('g0-aaaaaaaaaaaaaaaaaa', code, () => {})).toThrow(/not in that room/)
  })
})

describe('limits', () => {
  it('refuses new rooms beyond the limit', () => {
    const { hub } = setup(2, { maxRooms: 2 })
    expect(() => hub.create('another-aaaaaaaaaaaaaaaa', 'Eve', 'public')).not.toThrow()
    expect(() => hub.create('third-aaaaaaaaaaaaaaaaaa', 'Fay', 'public')).toThrow(/Too many rooms/)
  })
  it('puts a browser in one room at a time', () => {
    const { hub, guests, code } = setup(2)
    const other = hub.create(guests[1], 'Bob', 'public')
    expect(other.code).not.toBe(code)
    hub.subscribe(guests[1], other.code, () => {})
    expect(hub.listPublic().map((r) => r.code)).toEqual([other.code])
    expect(() => hub.subscribe(guests[0], code, () => {})).not.toThrow()   // the first room still has its own host
  })
})

describe('the HTTP side', () => {
  const guestA = 'guesta-aaaaaaaaaaaaaaaaaa', guestB = 'guestb-bbbbbbbbbbbbbbbbbb'
  const post = (app: ReturnType<typeof createApp>, path: string, guest: string, body?: unknown) =>
    app.request(path, { method: 'POST', headers: { 'content-type': 'application/json', 'x-guest': guest }, body: JSON.stringify(body ?? {}) })

  function http() {
    const t = setup(1)
    const repo = testRepo()
    const app = createApp({ repo, judge: t.judge, versus: t.hub, now: () => t.clock.t, rand: () => 0.5 })
    return { ...t, app }
  }

  /** reads a server-sent-event stream into a list of [event, data] as they arrive */
  function reader(res: Response) {
    const r = res.body!.getReader()
    const dec = new TextDecoder()
    let buf = ''
    const got: { event: string; data: unknown }[] = []
    const pump = async (): Promise<void> => {
      const { value, done } = await r.read()
      if (done) return
      buf += dec.decode(value, { stream: true })
      let i
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const block = buf.slice(0, i); buf = buf.slice(i + 2)
        const ev = /^event: (.*)$/m.exec(block)?.[1], data = /^data: (.*)$/m.exec(block)?.[1]
        if (ev && data !== undefined) got.push({ event: ev, data: data === '1' ? 1 : JSON.parse(data) })
      }
    }
    const until = async (n: number): Promise<void> => {
      for (let k = 0; k < 20 && got.length < n; k++) await Promise.race([pump(), new Promise((res2) => setTimeout(res2, 100))])
    }
    return { got, until, cancel: () => r.cancel() }
  }

  it('needs a guest id, rooms can be made and joined, and the event stream tells the whole story', async () => {
    const { app, clock, hub } = http()
    expect((await app.request('/api/versus/create', { method: 'POST', body: '{}' })).status).toBe(400)
    const made = await post(app, '/api/versus/create', guestA, { name: 'Alice', visibility: 'public' })
    const code = ((await made.json()) as { room: { code: string } }).room.code
    const listed = (await (await app.request('/api/versus/rooms')).json()) as { rooms: unknown[] }
    expect(listed.rooms).toEqual([])           // nobody is connected to it yet
    const bad = await post(app, '/api/versus/join', guestB, { code, name: 'fuck' })
    expect(bad.status).toBe(400)
    expect((await post(app, '/api/versus/join', guestB, { code, name: 'Bob' })).status).toBe(200)

    expect((await app.request(`/api/versus/${code}/events`, { headers: { 'x-guest': 'nobody-aaaaaaaaaaaaaaaaaa' } })).status).toBe(404)
    const a = reader(await app.request(`/api/versus/${code}/events`, { headers: { 'x-guest': guestA } }))
    const b = reader(await app.request(`/api/versus/${code}/events`, { headers: { 'x-guest': guestB } }))
    await a.until(1); await b.until(1)
    expect(a.got[0].event).toBe('sync')
    expect((a.got[0].data as { sync: { room: { players: unknown[] } } }).sync.room.players).toHaveLength(2)
    expect(((await (await app.request('/api/versus/rooms')).json()) as { rooms: { code: string }[] }).rooms[0].code).toBe(code)

    expect((await post(app, `/api/versus/${code}/start`, guestB)).status).toBe(409)   // not the host
    expect((await post(app, `/api/versus/${code}/start`, guestA)).status).toBe(200)
    clock.t += 3000; hub.tick()
    await b.until(4)
    const kinds = b.got.map((g) => g.event)
    expect(kinds).toContain('roundStart')
    const answered = await post(app, `/api/versus/${code}/answer`, guestA, { round: 0, text: 'rare' })
    expect(await answered.json()).toMatchObject({ status: 'valid', tier: 3 })
    await b.until(kinds.length + 1)   // waits a moment: nothing may arrive, because Alice's roll animation is still playing
    expect(b.got.some((g) => g.event === 'answered')).toBe(false)
    expect((await post(app, `/api/versus/${code}/revealed`, guestA, { round: 'x' })).status).toBe(400)
    expect((await post(app, `/api/versus/${code}/revealed`, guestA, { round: 0 })).status).toBe(200)
    await b.until(kinds.length + 1)
    const seen = b.got.find((g) => g.event === 'answered')!
    expect(JSON.stringify(seen.data)).not.toContain('RARE')
    expect((await post(app, `/api/versus/${code}/answer`, guestA, { round: 0, text: '' })).status).toBe(400)
    expect((await post(app, `/api/versus/${code}/answer`, guestA, { round: 'x', text: 'rare' })).status).toBe(400)
    expect((await post(app, `/api/versus/${code}/answer`, guestA, { round: 0, text: 'rare' })).status).toBe(409)
    await a.cancel(); await b.cancel()
  })
})
