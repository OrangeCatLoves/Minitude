/**
 * Multiplayer, browser side: what this player knows about the room and the match, kept up to date from the server's live connection.
 * It draws nothing and plays nothing: `lobbyui.ts` draws it and `game.ts` plays the match from it. The server is the only authority.
 */
import {
  NAME_MAX, NAME_MIN, normaliseCode, tidyName, isCode,
  type Visibility, type VAnswered, type VEvent, type VMatchEnd, type VPublicRoom, type VRoom, type VRoundEnd, type VRoundItem, type VRoundStart, type VSync,
} from '@minitude/core'
import {
  ApiError, openRoomStream, vAnswer, vCreate, vJoin, vLeave, vLeaveBeacon, vMiss, vReady, vRematch, vRooms, vStart, vVisibility,
  type StreamState,
} from './api'

export type LobbyScreen = 'name' | 'menu' | 'create' | 'join' | 'browse' | 'room'

/** the round that is on (or has just ended) */
export interface RoundView {
  index: number
  count: number
  seconds: number
  phase: 'answering' | 'between'
  /** who has a result this round, by seat: the rarity and points (no answer text until the round is over) */
  answered: Map<number, VAnswered>
  /** after the round: everybody's result with the answer text */
  items: Map<number, VRoundItem> | null
}

export interface VersusHooks {
  /** a question begins for everybody (also when a player comes back in the middle of one) */
  roundStart(s: VRoundStart, secondsLeft: number): void
  /** the match is over: the final standings are known */
  matchEnd(): void
  /** the room status changed (waiting / playing / finished) */
  status(next: VRoom['status'], prev: VRoom['status'] | null): void
  /** the connection was closed for good: the player is no longer in the room */
  closed(reason: string): void
}

const NAME_KEY = 'minitude.name'

export class VersusClient {
  screen: LobbyScreen = 'name'
  name = ''
  /** what is being typed (the name, or the room code) */
  field = ''
  error = ''
  /** a short friendly line ("CODE COPIED") */
  notice = ''
  busy = false
  createVisibility: Visibility = 'private'
  rooms: VPublicRoom[] = []
  roomsLoaded = false
  room: VRoom | null = null
  conn: StreamState | 'none' = 'none'
  round: RoundView | null = null
  totals = new Map<number, number>()
  history: VRoundEnd[] = []
  end: VMatchEnd | null = null
  hooks: VersusHooks = { roundStart() {}, matchEnd() {}, status() {}, closed() {} }

  private stopStream: (() => void) | null = null
  private lastRoomsTry = -1e9
  /** ignore stale answers to older requests */
  private gen = 0

  constructor() {
    try { this.name = tidyName(localStorage.getItem(NAME_KEY) ?? '') } catch { /* storage blocked: the name is asked each time */ }
    if (this.name.length < NAME_MIN) this.name = ''
    this.field = this.name
  }

  // ------------------------------------------------------------------ the screens before a room
  /** the lobby opens: ask for a name once, then show the menu */
  open(): void {
    this.error = ''
    this.busy = false
    if (this.room) { this.screen = 'room'; return }
    this.screen = this.name ? 'menu' : 'name'
    this.field = this.name
  }

  go(screen: LobbyScreen): void {
    this.screen = screen
    this.error = ''
    this.notice = ''
    this.field = screen === 'name' ? this.name : ''
    if (screen === 'browse') { this.rooms = []; this.roomsLoaded = false; this.lastRoomsTry = -1e9; void this.refreshRooms() }
  }

  /** a typed character or edit */
  typeInto(text: string): void {
    this.error = ''
    this.field = this.screen === 'join' ? normaliseCode(text) : text.slice(0, NAME_MAX)
  }

  submitName(): boolean {
    const n = tidyName(this.field)
    if (n.length < NAME_MIN) { this.error = `Names have at least ${NAME_MIN} characters.`; return false }
    if (n.length > NAME_MAX) { this.error = `Names have at most ${NAME_MAX} characters.`; return false }
    this.name = n
    try { localStorage.setItem(NAME_KEY, n) } catch { /* not saved */ }
    this.go('menu')
    return true
  }

  /** lists the public rooms (also called again every few seconds while the list is on screen) */
  async refreshRooms(force = false): Promise<void> {
    const t = performance.now()
    if (!force && t - this.lastRoomsTry < 2500) return
    this.lastRoomsTry = t
    try {
      this.rooms = (await vRooms()).rooms
      this.roomsLoaded = true
      if (this.screen === 'browse') this.error = ''
    } catch (e) {
      if (this.screen === 'browse') this.error = this.messageOf(e)
    }
  }

  // ------------------------------------------------------------------ rooms
  async create(): Promise<void> { await this.enter(() => vCreate(this.name, this.createVisibility)) }
  async join(code: string): Promise<void> {
    const c = normaliseCode(code)
    if (!isCode(c)) { this.error = 'A room code has 5 letters or digits.'; return }
    await this.enter(() => vJoin(c, this.name))
  }

  private async enter(call: () => Promise<{ room: VRoom }>): Promise<void> {
    if (this.busy) return
    this.busy = true
    this.error = ''
    const g = ++this.gen
    try {
      const { room } = await call()
      if (g !== this.gen) return
      this.reset()
      this.setRoom(room)
      this.screen = 'room'
      this.openStream(room.code)
    } catch (e) {
      if (g === this.gen) this.error = this.messageOf(e)
    } finally {
      if (g === this.gen) this.busy = false
    }
  }

  async leave(): Promise<void> {
    const code = this.room?.code
    this.gen++
    this.stopStream?.()
    this.stopStream = null
    this.reset()
    this.room = null
    this.conn = 'none'
    this.busy = false
    this.screen = this.name ? 'menu' : 'name'
    if (code) await vLeave(code).catch(() => { /* the server also notices on its own */ })
  }

  /** the page is closing */
  leaveNow(): void {
    if (this.room) vLeaveBeacon(this.room.code)
  }

  async setVisibility(v: Visibility): Promise<void> {
    if (!this.room || this.busy) return
    try { this.setRoom((await vVisibility(this.room.code, v)).room) } catch (e) { this.error = this.messageOf(e) }
  }
  async startMatch(): Promise<void> {
    if (!this.room || this.busy) return
    this.busy = true
    try { this.setRoom((await vStart(this.room.code)).room) } catch (e) { this.error = this.messageOf(e) } finally { this.busy = false }
  }
  async rematch(): Promise<void> {
    if (!this.room || this.busy) return
    this.busy = true
    try { this.setRoom((await vRematch(this.room.code)).room) } catch (e) { this.error = this.messageOf(e) } finally { this.busy = false }
  }

  // ------------------------------------------------------------------ during a match (the game calls these)
  answer(round: number, text: string, confirm?: 'yes' | 'no') {
    if (!this.room) return Promise.reject(new ApiError('Not in a room.', 404, 'no_room'))
    return vAnswer(this.room.code, round, text, confirm)
  }
  miss(round: number): Promise<unknown> { return this.room ? vMiss(this.room.code, round) : Promise.resolve() }
  ready(round: number): Promise<unknown> { return this.room ? vReady(this.room.code, round) : Promise.resolve() }

  /** my seat in the room, or -1 */
  get me(): number { return this.room?.you ?? -1 }
  isHost(): boolean { return !!this.room && this.room.players.some((p) => p.seat === this.room!.you && p.host) }
  nameOf(seat: number): string { return this.room?.players.find((p) => p.seat === seat)?.name ?? '' }
  /** players that can still take part (not left the match) */
  connectedCount(): number { return this.room?.players.filter((p) => p.connected).length ?? 0 }

  // ------------------------------------------------------------------ what the server tells us
  private openStream(code: string): void {
    this.stopStream?.()
    this.stopStream = openRoomStream(code, (e) => this.onEvent(e), (s) => {
      this.conn = s
      // the server says this browser is not in the room (it was removed, or the room is gone)
      if (s === 'closed' && this.room && this.room.code === code) this.closeFor('You are no longer in that room.')
    })
  }

  private reset(): void {
    this.round = null
    this.totals = new Map()
    this.history = []
    this.end = null
  }

  private setRoom(room: VRoom): void {
    const prev = this.room?.status ?? null
    this.room = room
    if (room.status !== prev) this.hooks.status(room.status, prev)
  }

  private onEvent(e: VEvent): void {
    switch (e.type) {
      case 'sync': this.onSync(e.sync); break
      case 'room': this.setRoom(e.room); break
      case 'roundStart': {
        const s = e.start
        this.round = { index: s.round, count: s.count, seconds: s.seconds, phase: 'answering', answered: new Map(), items: null }
        this.hooks.roundStart(s, s.seconds)
        break
      }
      case 'answered': {
        if (this.round && this.round.index === e.answered.round) this.round.answered.set(e.answered.seat, e.answered)
        break
      }
      case 'roundEnd': {
        const r = this.round
        if (r && r.index === e.end.round) { r.phase = 'between'; r.items = new Map(e.end.items.map((i) => [i.seat, i])) }
        this.totals = new Map(e.end.totals.map((t) => [t.seat, t.total]))
        if (!this.history.some((h) => h.round === e.end.round)) this.history.push(e.end)
        break
      }
      case 'matchEnd': this.end = e.end; this.hooks.matchEnd(); break
      case 'closed': this.closeFor(e.reason); break
    }
  }

  /** the whole state, when a connection opens or comes back */
  private onSync(s: VSync): void {
    this.setRoom(s.room)
    this.totals = new Map(s.totals.map((t) => [t.seat, t.total]))
    this.history = s.history.slice()
    this.end = s.end
    const r = s.round
    if (!r) { this.round = null; return }
    const had = this.round
    const view: RoundView = { index: r.round, count: r.count, seconds: r.seconds, phase: r.phase, answered: new Map(r.answered.map((a) => [a.seat, a])), items: null }
    const done = this.history.find((h) => h.round === r.round)
    if (done) view.items = new Map(done.items.map((i) => [i.seat, i]))
    this.round = view
    // a question that is on and not yet mine to answer: start it here (a player who reconnects, or a page that was reloaded)
    if (r.phase === 'answering' && r.question && (!had || had.index !== r.round)) {
      this.hooks.roundStart({ round: r.round, count: r.count, seconds: r.seconds, question: r.question }, r.secondsLeft)
    }
    if (s.end) this.hooks.matchEnd()
  }

  private closeFor(reason: string): void {
    this.stopStream?.()
    this.stopStream = null
    this.gen++
    this.reset()
    this.room = null
    this.conn = 'none'
    this.screen = this.name ? 'menu' : 'name'
    this.hooks.closed(reason)
  }

  private messageOf(e: unknown): string {
    if (e instanceof ApiError) return e.message
    if (e instanceof Error && e.name === 'AbortError') return 'The server took too long. Try again.'
    return "Can't reach the game server. Try again."
  }
}
