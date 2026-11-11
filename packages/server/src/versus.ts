/**
 * Multiplayer rooms. Everything lives in memory (one server, one machine): a restart ends the rooms that are open, nothing is stored.
 * The hub has no network code: the routes in `versusRoutes.ts` call it, and a connection is just a function that receives events.
 * That keeps it testable with a fake clock (`tick()` moves time-based things along; the server calls it twice a second).
 *
 * How a match goes (docs/MULTIPLAYER.md has the full picture):
 *   waiting -> start (host, 2 to 4 players) -> round 0 begins a few seconds later -> everybody gets the same question at the same moment
 *   -> a round ends when every player has a valid answer or has run out of time -> the players' own reveal animations play ->
 *   when every connected player says "ready" (or the longest allowed wait has passed) the next question begins -> after the 7th the
 *   match is over and the room is open for a rematch.
 * The question clock is the same as solo: 30 s from 0.55 s after the question appears, a 3 s grace for the network, and the time the
 * answer checker takes is given back. Other players see a player's rarity and points at once, the answer text only after the round.
 */
import { randomInt } from 'node:crypto'
import {
  CODE_ALPHABET, CODE_LENGTH, TIERS, VERSUS_MAX_PLAYERS, VERSUS_MIN_PLAYERS, isCode, normaliseCode,
  type AnswerResponse, type RoomStatus, type Visibility, type VAnswered, type VEvent, type VPublicRoom, type VRoom, type VRoundEnd, type VRoundItem,
  type VStanding, type VSync,
} from '@minitude/core'
import type { QuestionHead } from './questions'
import type { Judge, JudgeMode } from './judge/types'
import { GRACE_MS, MAX_ATTEMPTS_PER_QUESTION, START_DELAY_MS } from './clock'
import { checkName } from './names'

export class VersusError extends Error {
  constructor(message: string, readonly status: 400 | 404 | 409 | 429 | 503, readonly code: string) { super(message) }
}

export interface HubDeps {
  judge: Judge
  /** the approved questions a match may draw from */
  heads: () => QuestionHead[]
  /** chooses the match's seven questions (the same function solo uses) */
  pick: (heads: QuestionHead[], rand: () => number) => QuestionHead[]
  now: () => number
  rand: () => number
  /** seconds per question */
  seconds: number
  /** most rooms alive at once (each is a few kilobytes) */
  maxRooms?: number
  /** pause between "start" and the first question */
  leadMs?: number
  /** the longest the next question waits for slow reveal animations */
  barrierMaxMs?: number
  /** how long a player may be disconnected before leaving the room (waiting) or the match (playing: the rest scores 0) */
  disconnectMs?: number
  /** a room nobody is connected to is deleted after this */
  idleRoomMs?: number
  /** inject codes in tests */
  makeCode?: () => string
}

type Send = (e: VEvent) => void
type Result = { miss: true } | { miss: false; answer: string; desc: string; tier: number; points: number }

interface Seat {
  seat: number
  guest: string
  name: string
  subs: Set<Send>
  lastSeen: number
  /** left the match: every remaining question scores 0 */
  gone: boolean
}
interface PerPlayer { busyMs: number; inFlight: number | null; attempts: number; result: Result | null }
interface Round {
  index: number
  phase: 'answering' | 'between'
  startedAt: number
  endedAt: number
  per: Map<number, PerPlayer>
  ready: Set<number>
}
interface Room {
  code: string
  visibility: Visibility
  status: RoomStatus
  hostSeat: number
  seats: Map<number, Seat>
  questions: QuestionHead[]
  round: Round | null
  /** when the first question begins (status playing, round null) */
  firstAt: number
  totals: Map<number, number>
  /** each seat's finished rounds, in order */
  log: Map<number, Result[]>
  history: VRoundEnd[]
  end: { standings: VStanding[] } | null
  lastActive: number
}

const defaultCode = (): string => Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('')

export class VersusHub {
  private readonly rooms = new Map<string, Room>()
  private readonly byGuest = new Map<string, string>()
  private readonly d: Required<Omit<HubDeps, 'judge' | 'heads' | 'pick' | 'now' | 'rand' | 'seconds' | 'makeCode'>> & Pick<HubDeps, 'judge' | 'heads' | 'pick' | 'now' | 'rand' | 'seconds' | 'makeCode'>

  constructor(deps: HubDeps) {
    this.d = { maxRooms: 100, leadMs: 3000, barrierMaxMs: 40_000, disconnectMs: 20_000, idleRoomMs: 120_000, ...deps }
  }

  // ------------------------------------------------------------------ small helpers
  private now = (): number => this.d.now()
  private sorted(room: Room): Seat[] { return [...room.seats.values()].sort((a, b) => a.seat - b.seat) }
  private connected(s: Seat): boolean { return s.subs.size > 0 }

  private seatOf(guest: string, codeRaw: string): { room: Room; seat: Seat } {
    const room = this.rooms.get(normaliseCode(codeRaw))
    const seat = room ? [...room.seats.values()].find((s) => s.guest === guest) : undefined
    if (!room || !seat) throw new VersusError('You are not in that room.', 404, 'no_room')
    return { room, seat }
  }

  private view(room: Room, forSeat: number): VRoom {
    return {
      code: room.code,
      visibility: room.visibility,
      status: room.status,
      you: forSeat,
      players: this.sorted(room).map((s) => ({ seat: s.seat, name: s.name, host: s.seat === room.hostSeat, connected: this.connected(s), gone: s.gone })),
    }
  }

  private emit(room: Room, make: (seat: number) => VEvent): void {
    for (const s of room.seats.values()) for (const send of [...s.subs]) {
      try { send(make(s.seat)) } catch { s.subs.delete(send) }
    }
  }
  private emitAll(room: Room, ev: VEvent): void { this.emit(room, () => ev) }
  private emitRoom(room: Room): void { this.emit(room, (seat) => ({ type: 'room', room: this.view(room, seat) })) }
  private touch(room: Room): void { room.lastActive = this.now() }

  private ensureHost(room: Room): void {
    const cur = room.seats.get(room.hostSeat)
    if (cur && !cur.gone) return
    const next = this.sorted(room).find((s) => !s.gone)
    if (next) room.hostSeat = next.seat
  }

  private freeSeat(room: Room): number {
    for (let i = 0; i < VERSUS_MAX_PLAYERS; i++) if (!room.seats.has(i)) return i
    return -1
  }

  private newCode(): string {
    for (let k = 0; k < 50; k++) {
      const c = (this.d.makeCode ?? defaultCode)()
      if (isCode(c) && !this.rooms.has(c)) return c
    }
    throw new VersusError('Too many rooms right now. Try again in a moment.', 503, 'busy')
  }

  private nameFor(room: Room | null, raw: unknown): string {
    const n = checkName(raw)
    if (!n.ok) throw new VersusError(n.message, 400, 'name')
    if (room && [...room.seats.values()].some((s) => s.name.toLowerCase() === n.name.toLowerCase())) throw new VersusError('That name is taken in this room.', 409, 'name_taken')
    return n.name
  }

  // ------------------------------------------------------------------ rooms
  create(guest: string, rawName: unknown, visibility: unknown): VRoom {
    const name = this.nameFor(null, rawName)
    if (visibility !== 'private' && visibility !== 'public') throw new VersusError('Choose private or public.', 400, 'visibility')
    this.leaveCurrent(guest)
    if (this.rooms.size >= this.d.maxRooms) throw new VersusError('Too many rooms right now. Try again in a moment.', 503, 'busy')
    const t = this.now()
    const room: Room = {
      code: this.newCode(), visibility, status: 'waiting', hostSeat: 0, seats: new Map(), questions: [], round: null, firstAt: 0,
      totals: new Map(), log: new Map(), history: [], end: null, lastActive: t,
    }
    room.seats.set(0, { seat: 0, guest, name, subs: new Set(), lastSeen: t, gone: false })
    this.rooms.set(room.code, room)
    this.byGuest.set(guest, room.code)
    return this.view(room, 0)
  }

  join(guest: string, codeRaw: unknown, rawName: unknown): VRoom {
    const code = normaliseCode(typeof codeRaw === 'string' ? codeRaw : '')
    const room = this.rooms.get(code)
    if (!isCode(code) || !room) throw new VersusError('No room has that code.', 404, 'no_room')
    const mine = [...room.seats.values()].find((s) => s.guest === guest)
    if (mine) { mine.lastSeen = this.now(); return this.view(room, mine.seat) }   // joining again from the same browser is the same seat
    if (room.status !== 'waiting') throw new VersusError('That match has already started.', 409, 'started')
    const seatNo = this.freeSeat(room)
    if (seatNo < 0) throw new VersusError('That room is full.', 409, 'full')
    const name = this.nameFor(room, rawName)
    this.leaveCurrent(guest)
    const t = this.now()
    room.seats.set(seatNo, { seat: seatNo, guest, name, subs: new Set(), lastSeen: t, gone: false })
    this.byGuest.set(guest, room.code)
    this.touch(room)
    this.emitRoom(room)
    return this.view(room, seatNo)
  }

  /** leaves whatever room this browser is in (before creating or joining another) */
  private leaveCurrent(guest: string): void {
    const code = this.byGuest.get(guest)
    if (code) this.leave(guest, code)
  }

  leave(guest: string, codeRaw: string): void {
    const room = this.rooms.get(normaliseCode(codeRaw))
    const seat = room ? [...room.seats.values()].find((s) => s.guest === guest) : undefined
    this.byGuest.delete(guest)
    if (!room || !seat) return
    for (const send of seat.subs) { try { send({ type: 'closed', reason: 'You left the room.' }) } catch { /* gone already */ } }
    seat.subs.clear()
    if (room.status === 'playing') this.forfeit(room, seat)
    else this.removeSeat(room, seat)
  }

  private removeSeat(room: Room, seat: Seat): void {
    room.seats.delete(seat.seat)
    this.byGuest.delete(seat.guest)
    if (room.seats.size === 0) { this.rooms.delete(room.code); return }
    this.ensureHost(room)
    this.touch(room)
    this.emitRoom(room)
  }

  /** the player is out of the match: this round and every later one scores 0 for them */
  private forfeit(room: Room, seat: Seat): void {
    if (seat.gone) return
    seat.gone = true
    this.byGuest.delete(seat.guest)
    this.ensureHost(room)
    const r = room.round
    if (r && r.phase === 'answering') {
      const per = r.per.get(seat.seat)
      if (per && !per.result) this.setResult(room, seat.seat, { miss: true })
    }
    this.emitRoom(room)
    this.maybeEnd(room)
    if ([...room.seats.values()].every((s) => s.gone)) this.rooms.delete(room.code)
  }

  setVisibility(guest: string, codeRaw: string, visibility: unknown): VRoom {
    const { room, seat } = this.seatOf(guest, codeRaw)
    if (seat.seat !== room.hostSeat) throw new VersusError('Only the host can change that.', 409, 'host')
    if (visibility !== 'private' && visibility !== 'public') throw new VersusError('Choose private or public.', 400, 'visibility')
    room.visibility = visibility
    this.touch(room)
    this.emitRoom(room)
    return this.view(room, seat.seat)
  }

  listPublic(): VPublicRoom[] {
    const out: VPublicRoom[] = []
    for (const room of this.rooms.values()) {
      if (room.visibility !== 'public' || room.status !== 'waiting' || room.seats.size >= VERSUS_MAX_PLAYERS) continue
      const seats = this.sorted(room)
      if (!seats.some((s) => this.connected(s))) continue
      out.push({ code: room.code, host: room.seats.get(room.hostSeat)?.name ?? '', players: seats.length, max: VERSUS_MAX_PLAYERS })
    }
    return out.sort((a, b) => b.players - a.players)
  }

  // ------------------------------------------------------------------ connections
  hasSeat(guest: string, codeRaw: string): boolean {
    const room = this.rooms.get(normaliseCode(codeRaw))
    return !!room && [...room.seats.values()].some((s) => s.guest === guest)
  }

  /** Opens a connection for a player: it first receives the whole state (`sync`), then every change. Returns the function that closes it. */
  subscribe(guest: string, codeRaw: string, send: Send): () => void {
    const { room, seat } = this.seatOf(guest, codeRaw)
    seat.subs.add(send)
    seat.lastSeen = this.now()
    this.touch(room)
    send({ type: 'sync', sync: this.syncFor(room, seat.seat) })
    this.emitRoom(room)
    return () => {
      if (!seat.subs.delete(send)) return
      seat.lastSeen = this.now()
      if (this.rooms.get(room.code) === room && room.seats.get(seat.seat) === seat) this.emitRoom(room)
    }
  }

  syncFor(room: Room, seatNo: number): VSync {
    const r = room.round
    const t = this.now()
    let round: VSync['round'] = null
    if (r) {
      const per = r.per.get(seatNo)
      const answered: VAnswered[] = []
      for (const [seat, p] of r.per) if (p.result) answered.push(this.answeredOf(r.index, seat, p.result))
      const q = room.questions[r.index]
      const open = r.phase === 'answering' && !!per && !per.result
      round = {
        round: r.index, count: room.questions.length, seconds: this.d.seconds, phase: r.phase,
        question: open ? { id: q.id, category: q.category, prompt: q.prompt } : null,
        secondsLeft: per ? Math.max(0, Math.min(this.d.seconds, (this.deadline(r, per, t) - t - GRACE_MS) / 1000)) : 0,
        answered,
      }
    }
    return {
      room: this.view(room, seatNo), round,
      totals: [...room.totals].map(([seat, total]) => ({ seat, total })),
      history: room.history, end: room.end,
    }
  }

  // ------------------------------------------------------------------ the match
  start(guest: string, codeRaw: string): VRoom {
    const { room, seat } = this.seatOf(guest, codeRaw)
    if (seat.seat !== room.hostSeat) throw new VersusError('Only the host can start the match.', 409, 'host')
    if (room.status !== 'waiting') throw new VersusError('The match has already started.', 409, 'started')
    if (this.sorted(room).filter((s) => this.connected(s)).length < VERSUS_MIN_PLAYERS) throw new VersusError(`A match needs at least ${VERSUS_MIN_PLAYERS} players.`, 409, 'few')
    const questions = this.d.pick(this.d.heads(), this.d.rand)
    if (questions.length < 7) throw new VersusError('There are not enough questions yet.', 503, 'no_questions')
    room.questions = questions
    room.status = 'playing'
    room.round = null
    room.history = []
    room.end = null
    room.totals = new Map(this.sorted(room).map((s) => [s.seat, 0]))
    room.log = new Map(this.sorted(room).map((s) => [s.seat, []]))
    room.firstAt = this.now() + this.d.leadMs
    this.touch(room)
    this.emitRoom(room)
    return this.view(room, seat.seat)
  }

  /** the host takes everybody back to the room after a match */
  rematch(guest: string, codeRaw: string): VRoom {
    const { room, seat } = this.seatOf(guest, codeRaw)
    if (seat.seat !== room.hostSeat) throw new VersusError('Only the host can do that.', 409, 'host')
    if (room.status !== 'finished') throw new VersusError('The match is not over.', 409, 'not_over')
    for (const s of this.sorted(room)) if (s.gone) { room.seats.delete(s.seat); this.byGuest.delete(s.guest) }
    this.ensureHost(room)
    room.status = 'waiting'
    room.round = null
    room.questions = []
    room.history = []
    room.end = null
    room.totals = new Map()
    room.log = new Map()
    this.touch(room)
    this.emitRoom(room)
    return this.view(room, seat.seat)
  }

  private deadline(r: Round, per: PerPlayer, t: number): number {
    return r.startedAt + START_DELAY_MS + this.d.seconds * 1000 + GRACE_MS + per.busyMs + (per.inFlight !== null ? t - per.inFlight : 0)
  }

  private answeredOf(round: number, seat: number, res: Result): VAnswered {
    return res.miss ? { round, seat, miss: true, tier: null, points: 0 } : { round, seat, miss: false, tier: res.tier, points: res.points }
  }

  private startRound(room: Room, index: number): void {
    const q = room.questions[index]
    const t = this.now()
    const r: Round = { index, phase: 'answering', startedAt: t, endedAt: 0, per: new Map(), ready: new Set() }
    for (const s of room.seats.values()) r.per.set(s.seat, { busyMs: 0, inFlight: null, attempts: 0, result: null })
    room.round = r
    this.touch(room)
    this.emitAll(room, { type: 'roundStart', start: { round: index, count: room.questions.length, seconds: this.d.seconds, question: { id: q.id, category: q.category, prompt: q.prompt } } })
    for (const s of room.seats.values()) if (s.gone) this.setResult(room, s.seat, { miss: true })
    this.maybeEnd(room)
  }

  private setResult(room: Room, seat: number, res: Result): void {
    const r = room.round
    const per = r?.per.get(seat)
    if (!r || !per || per.result || r.phase !== 'answering') return
    per.result = res
    this.emitAll(room, { type: 'answered', answered: this.answeredOf(r.index, seat, res) })
  }

  /** the round is over when every player has a result */
  private maybeEnd(room: Room): void {
    const r = room.round
    if (!r || r.phase !== 'answering') return
    for (const p of r.per.values()) if (!p.result) return
    this.endRound(room, r)
  }

  private endRound(room: Room, r: Round): void {
    r.phase = 'between'
    r.endedAt = this.now()
    const items: VRoundItem[] = []
    for (const s of this.sorted(room)) {
      const res: Result = r.per.get(s.seat)?.result ?? { miss: true }
      room.log.get(s.seat)?.push(res)
      room.totals.set(s.seat, (room.totals.get(s.seat) ?? 0) + (res.miss ? 0 : res.points))
      items.push(res.miss ? { seat: s.seat, miss: true, tier: null, points: 0, answer: null } : { seat: s.seat, miss: false, tier: res.tier, points: res.points, answer: res.answer })
    }
    const last = r.index === room.questions.length - 1
    const end: VRoundEnd = { round: r.index, items, totals: [...room.totals].map(([seat, total]) => ({ seat, total })), last }
    room.history.push(end)
    this.emitAll(room, { type: 'roundEnd', end })
    if (last) this.finishMatch(room)
  }

  private finishMatch(room: Room): void {
    const seats = this.sorted(room)
    const totals = new Map(seats.map((s) => [s.seat, room.totals.get(s.seat) ?? 0]))
    const standings: VStanding[] = seats.map((s) => ({
      seat: s.seat, name: s.name, total: totals.get(s.seat) ?? 0,
      rank: 1 + seats.filter((o) => (totals.get(o.seat) ?? 0) > (totals.get(s.seat) ?? 0)).length,
      items: (room.log.get(s.seat) ?? []).map((x) => (x.miss ? { miss: true, tier: null, points: 0, answer: null } : { miss: false, tier: x.tier, points: x.points, answer: x.answer })),
    }))
    standings.sort((a, b) => a.rank - b.rank || a.seat - b.seat)
    room.end = { standings }
    room.status = 'finished'
    this.touch(room)
    this.emitAll(room, { type: 'matchEnd', end: room.end })
    this.emitRoom(room)
  }

  /** after a round: when everybody who is still here has finished watching their results (or the longest wait is over), the next question begins */
  private advance(room: Room): void {
    const r = room.round
    if (!r || r.phase !== 'between' || r.index >= room.questions.length - 1) return
    const waiting = this.sorted(room).filter((s) => !s.gone && this.connected(s) && !r.ready.has(s.seat))
    if (waiting.length === 0 || this.now() - r.endedAt >= this.d.barrierMaxMs) this.startRound(room, r.index + 1)
  }

  /** a player's screen has finished showing the round's result and is ready for the next question */
  ready(guest: string, codeRaw: string, round: number): void {
    const { room, seat } = this.seatOf(guest, codeRaw)
    const r = room.round
    if (!r || r.index !== round) return
    r.ready.add(seat.seat)
    this.advance(room)
  }

  /** the player's own clock ran out (idempotent: a finished question stays as it was) */
  miss(guest: string, codeRaw: string, round: number): void {
    const { room, seat } = this.seatOf(guest, codeRaw)
    const r = room.round
    if (room.status !== 'playing' || !r || r.index !== round || r.phase !== 'answering') return
    this.setResult(room, seat.seat, { miss: true })
    this.maybeEnd(room)
  }

  async answer(guest: string, codeRaw: string, round: number, text: string, confirm?: 'yes' | 'no'): Promise<AnswerResponse> {
    const { room, seat } = this.seatOf(guest, codeRaw)
    const r = room.round
    if (room.status !== 'playing' || !r || r.index !== round) throw new VersusError('That question has not started.', 409, 'not_started')
    if (r.phase !== 'answering') throw new VersusError('Time is up for this question.', 409, 'late')
    const per = r.per.get(seat.seat)
    if (!per || seat.gone) throw new VersusError('You are not in this match.', 409, 'gone')
    if (per.result) throw new VersusError('That question is already finished.', 409, 'finished')
    const t0 = this.now()
    if (t0 > this.deadline(r, per, t0)) {
      this.setResult(room, seat.seat, { miss: true })
      this.maybeEnd(room)
      throw new VersusError('Time is up for this question.', 409, 'late')
    }
    if (per.attempts >= MAX_ATTEMPTS_PER_QUESTION) throw new VersusError('Too many tries on this question.', 429, 'too_many')
    per.attempts++
    per.inFlight = t0
    const mode: JudgeMode = confirm === 'yes' ? 'confirmed' : confirm === 'no' ? 'literal' : 'ask'
    let res: AnswerResponse
    try {
      res = (await this.d.judge.judge(room.questions[round], text, mode)).res
    } catch {
      res = { status: 'unresolved', message: "Couldn't check that. Try another." }
    } finally {
      per.busyMs += this.now() - t0
      per.inFlight = null
    }
    // the round may have ended while the checker was thinking (this player's time ran out)
    if (room.round !== r || r.phase !== 'answering' || per.result) throw new VersusError('Time is up for this question.', 409, 'late')
    if (res.status === 'valid' && typeof res.tier === 'number' && res.tier >= 0 && res.tier < TIERS.length) {
      this.setResult(room, seat.seat, { miss: false, answer: res.answer ?? text, desc: res.description ?? '', tier: res.tier, points: res.points ?? TIERS[res.tier].points })
      this.maybeEnd(room)
    }
    return res
  }

  // ------------------------------------------------------------------ time
  /** moves everything that depends on the clock: the first question, deadlines, slow reveals, players who vanished, empty rooms */
  tick(): void {
    const t = this.now()
    for (const room of [...this.rooms.values()]) {
      // players whose connection has been gone too long
      for (const s of this.sorted(room)) {
        if (this.connected(s) || t - s.lastSeen < this.d.disconnectMs) continue
        if (room.status === 'playing') this.forfeit(room, s)
        else if (!s.gone) this.removeSeat(room, s)
        if (!this.rooms.has(room.code)) break
      }
      if (!this.rooms.has(room.code)) continue
      if (room.status === 'playing') {
        if (!room.round && t >= room.firstAt) this.startRound(room, 0)
        const r = room.round
        if (r?.phase === 'answering') {
          for (const [seat, per] of r.per) if (!per.result && t > this.deadline(r, per, t)) this.setResult(room, seat, { miss: true })
          this.maybeEnd(room)
        } else if (r?.phase === 'between') this.advance(room)
      }
      // rooms nobody is in any more
      if (!this.sorted(room).some((s) => this.connected(s)) && t - room.lastActive > this.d.idleRoomMs) {
        for (const s of room.seats.values()) this.byGuest.delete(s.guest)
        this.rooms.delete(room.code)
      }
    }
  }

  /** for tests and the health line */
  get roomCount(): number { return this.rooms.size }
}
