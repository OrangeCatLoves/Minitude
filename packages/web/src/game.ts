/** The game: state machine (title -> run -> report), input, the server calls, and the frame renderer (port of the design tool's render()). */
import {
  buildReport, fmtSize, formatCountdown, GEM_TIER, isPerfect, nextRecord, pickPostFirst, postLines, shareText, sizeOfU, standingsLines, TIERS, utcDay, voidHintLine, RUN_LENGTH,
  type DailyState, type Question, type ReportData, type RunMode, type RunRecord, type StartRunResponse, type VRoundStart,
} from '@minitude/core'
import { ApiError, getDaily, sendAbandon, sendAnswer, sendMiss, sendStart, startDaily, startRun } from './api'
import { drawLobby, drawStandings, drawVersusPanel, itemAt, lobbyItems, type LobbyItem } from './lobbyui'
import { VersusClient } from './versus'
import type { Assets } from './assets'
import type { Afterword } from './afterword'
import type { AnswersUi } from './answers'
import type { CabinetUi } from './cabinet'
import { H, INK, INTRO, INTRO_EXIT, PRESS_AT, W, FAINT, SOFT } from './config'
import { addCard, addCharge, addFall, addLand, addPull, addReveal, bgCharge, bgPull, bgReveal, frontIntro, frontPull, frontReveal, frontStamp, gates, makeGems, pose, titleCard, type Gems } from './celebrate'
import { ctxOf, mkCanvas, shade, SILF, stext, vignette, vscrim, type Ctx } from './draw'
import { addFinale, bloomPre, dimPre, finRec, finaleCard, poseExtra, uiDim } from './finale'
import { AddLayer } from './fx'
import { WorldGL } from './gl'
import { WorldLife } from './life'
import { flashAt, shakeAmp, vignetteAt } from './impact'
import { makeMiss, newRec, pullStart, schedule, skipCard, Timeline, type Cam, type Rec } from './timeline'
import {
  ask, CONFIRM_BOXES, Groups, hud, hudDotsOnly, introButtons, landingLines, rail, report, REPORT_BUTTONS, reportRowBox, roll, result, scalebar, TITLE_BOXES, timeUp,
  type AskView, type HudState, type LandingLine, type PlayBox, type ReportExtras, type TitleView,
} from './ui'
import { clamp01, easeInOut, easeOut, smooth, type RGB } from './util'

/** what the sound engine hears. Everything is told in game-clock seconds so it can schedule ahead. */
export interface SoundHook {
  /** first user gesture: unlock audio */
  unlock(): void
  /** PLAY pressed at game time T */
  press(T: number): void
  /** a question will appear at r.start */
  question(r: Rec): void
  key(): void
  invalid(): void
  /** the answer was sent */
  lock(r: Rec): void
  /** the judge answered: the schedule of the record is known (rec.val, rec.roll, ... are real) */
  scheduled(r: Rec, T: number, tl: Timeline): void
  miss(r: Rec, T: number): void
  /** a world title card was skipped */
  skip(r: Rec, T: number): void
  report(T: number, perfect: boolean): void
  /** every frame */
  frame(T: number, cam: Cam, tl: Timeline, phase: 'title' | 'run' | 'report'): void
  reset(): void
}
export const NULL_SOUND: SoundHook = {
  unlock() {}, press() {}, question() {}, key() {}, invalid() {}, lock() {}, scheduled() {}, miss() {}, skip() {}, report() {}, frame() {}, reset() {},
}

type Phase = 'title' | 'lobby' | 'run' | 'report'
const MISS_DOT: RGB = [60, 70, 100]
const HINT_RGB: RGB = [170, 150, 255]
const POST_RGB: RGB = [255, 190, 230]

export class Game {
  readonly tl = new Timeline()
  T = 0
  phase: Phase = 'title'
  sound: SoundHook = NULL_SOUND
  /** the page that opens under the report (logbook, rating, ideas, footer); set by main.ts */
  after: Afterword | null = null
  /** the gem cabinet (what the player has found, kept in this browser); set by main.ts */
  cabinet: CabinetUi | null = null
  /** "everything that counted" for the Daily's questions (what is accepted, by rarity); set by main.ts */
  answers: AnswersUi | null = null

  private readonly gl: WorldGL
  /** the little movement in the world pictures (src/life) */
  private readonly life: WorldLife
  private readonly gems: Gems
  private readonly groups = new Groups()
  private readonly add = new AddLayer()
  private readonly frame = mkCanvas(W, H)
  private readonly f: Ctx = ctxOf(this.frame)
  private readonly out: Ctx
  private readonly accents: Record<string, RGB>
  private readonly dummy = newRec(0, 0, 0, 0, 0)

  // run state
  private run: StartRunResponse | null = null
  private records: RunRecord[] = []
  private typed = ''
  private pending = false
  /** the checker thinks the player made a typo and asked "did you mean ...?". The question clock keeps running while it waits. Null = not asking. */
  private confirm: { text: string; suggestion: string } | null = null
  private lockT = 0
  private lockRemain = 0
  private deadline = Infinity
  private message = ''
  private shakeAt = -9
  private lastKeyAt = -9
  private lastPostVariant: number | null = null
  private missPending = false
  /** the last question the server has been told is on screen (its clock runs on the server too) */
  private startedIdx = -1
  /** 'daily' = today's daily challenge (one attempt), 'solo' = an ordinary run */
  private mode: RunMode = 'solo'
  /** the prompt of each question, as the server sent it when the question started (never earlier) */
  private questions: (Question | undefined)[] = []
  /** what the server last said about today's daily for this browser, and when (for the countdown) */
  private daily: DailyState | null = null
  private dailyAt = 0
  private dailyFailed = false
  private dailyLoading = false
  private lastDailyTry = -1e9
  /** the daily state after the run just played (it has the rank), shown on the report */
  private reportDaily: DailyState | null = null
  private abandonSent = false

  // multiplayer (the room and what the server says about it: versus.ts; the screens: lobbyui.ts)
  readonly versus = new VersusClient()
  /** a multiplayer match is being played (the run below is then driven by the server's questions) */
  private inVersus = false
  /** the next question the server has started, waiting until this player's screen has finished showing the last one */
  private vNext: { start: VRoundStart; left: number } | null = null
  private readySent = new Set<number>()
  /** the rounds whose roll animation this screen has already told the server about */
  private revealSent = new Set<number>()
  private lobbyAt = 0
  private lobbyScreenSeen = ''
  private mouse: { x: number; y: number } | null = null

  // title / transitions
  private titleOn = true
  private pressedAt: number | null = null
  private titleError = ''
  private uiT0: number | null = null
  private fadeFrom = 0
  private reportAt = Infinity
  private reportData: ReportData | null = null
  private toastAt = -9
  /** where a press on the report started (see the pointer handlers) */
  private reportDown: { x: number; y: number } | null = null

  constructor(private readonly canvas: HTMLCanvasElement, private readonly input: HTMLInputElement, private readonly assets: Assets) {
    this.gl = new WorldGL(assets.scenes, assets.inners)
    this.life = new WorldLife(assets.scenes)
    this.gems = makeGems(assets.gems)
    this.accents = assets.manifest.accents as Record<string, RGB>
    const out = canvas.getContext('2d', { alpha: false })
    if (!out) throw new Error('2D canvas is not available.')
    this.out = out
    this.out.imageSmoothingEnabled = false
    this.bindInput()
    this.bindLeaving()
    this.bindVersus()
    void this.loadDaily()
  }

  /** closing or reloading the page ends a daily run (what is left scores 0); a page restored from the back-forward cache starts over */
  private bindLeaving(): void {
    window.addEventListener('pagehide', () => {
      if (this.phase === 'run' && this.run?.mode === 'daily') {
        this.abandonSent = true
        sendAbandon(this.run.runId)
      }
      if (this.versus.room) { this.abandonSent = true; this.versus.leaveNow() }
    })
    window.addEventListener('pageshow', (e) => {
      if (e.persisted && this.abandonSent) location.reload()
    })
  }

  // ------------------------------------------------------------------ input
  private bindInput(): void {
    this.input.addEventListener('input', () => {
      if (this.phase === 'lobby') { this.versus.typeInto(this.input.value); this.input.value = this.versus.field; this.sound.key(); return }
      if (!this.canType()) { this.input.value = this.typed; return }
      this.typed = this.input.value.slice(0, 80)
      this.lastKeyAt = this.T
      if (this.message) this.message = ''
      this.sound.key()
    })
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      // The page under the report has a text box. Its keys are its own: an "h" typed there must not mean HOME, Enter must not start a new run.
      if (e.target instanceof Element && e.target.closest('#after')) return
      // the same for the gem cabinet (Esc closes it; it must not mean HOME, Enter must not start a run)
      if (this.cabinet?.isOpen || this.answers?.isOpen || (e.target instanceof Element && e.target.closest('#cabinet, #answers'))) return
      if (this.phase === 'lobby') { this.lobbyKey(e); return }
      if (this.confirm) {
        // "did you mean ...?": Enter or Y is yes, Esc or N is no. Nothing else is typed meanwhile.
        const k = e.key.toLowerCase()
        if (e.key === 'Enter' || k === 'y') { e.preventDefault(); this.answerConfirm('yes') }
        else if (e.key === 'Escape' || k === 'n') { e.preventDefault(); this.answerConfirm('no') }
        return
      }
      if (this.canType()) {
        // Typing must not depend on where keyboard focus happens to be: a click on the page, the Tab key, another tab or app all move it.
        // Tab has no use here (it would only land on the sound button), so it keeps focus in the box.
        if (e.key === 'Tab') { e.preventDefault(); this.refocus(); return }
        // focusing during keydown makes the key press itself land in the box
        if (document.activeElement !== this.input && (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Process' || e.key === 'Dead')) this.input.focus({ preventScroll: true })
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        this.onEnter()
      } else if (this.phase === 'title' && (e.key === 's' || e.key === 'S') && this.titleView().secondary) {
        e.preventDefault()
        void this.press('solo')
      } else if (this.phase === 'report' && /^[1-7]$/.test(e.key) && this.answersOn()) {
        // the Daily's report: the number of a question opens everything that counted for it
        e.preventDefault()
        this.openAnswers(Number(e.key) - 1)
      } else if (this.phase === 'report' && (e.key === 'Escape' || e.key === 'h' || e.key === 'H')) {
        // back to the title (the buttons appear 2.6 s after the report starts)
        e.preventDefault()
        if (this.T > this.reportAt + 2.6) this.home()
      } else if (e.key === ' ' && !this.canType() && this.phase !== 'report') {
        e.preventDefault()
        this.onEnter()
      }
    })
    // A click on the game must not take keyboard focus off the answer box. The canvas cannot hold focus, so by default the browser
    // moves it to the page when the mouse goes down, undoing the focus() in the pointerdown handler below.
    this.canvas.addEventListener('mousedown', (e) => e.preventDefault())
    // coming back from another tab or app
    window.addEventListener('focus', () => this.refocus())
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.refocus() })
    this.canvas.addEventListener('pointerdown', (e) => {
      const p = this.toCanvas(e)
      this.sound.unlock()
      if (this.phase === 'lobby') { this.lobbyPointer(p); return }
      if (this.phase === 'title') {
        if (near(TITLE_BOXES.primary, p, 40, 30)) void this.pressPrimary()
        else if (this.titleView().secondary && near(TITLE_BOXES.secondary, p, 30, 14)) void this.press('solo')
        else if (this.pressedAt === null && near(TITLE_BOXES.multi, p, 30, 14)) this.openLobby()
        return
      }
      if (this.phase === 'report') {
        // The page can be scrolled from here, and the buttons are at the bottom where a thumb starts a swipe. So a button acts when the
        // finger or mouse is let go in the same place, not when it first touches: a swipe is taken over by the browser (pointercancel).
        this.reportDown = p
        return
      }
      if (this.confirm) {
        if (hit(CONFIRM_BOXES.yes, p)) this.answerConfirm('yes')
        else if (hit(CONFIRM_BOXES.no, p)) this.answerConfirm('no')
        return
      }
      if (this.skipActiveCard()) return
      if (this.canType()) this.input.focus()
    })
  }
  private toCanvas(e: PointerEvent): { x: number; y: number } {
    const r = this.canvas.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }
  }
  /** gives the answer box keyboard focus when a question is waiting for an answer */
  refocus(): void {
    if (this.canType()) this.input.focus({ preventScroll: true })
  }
  /** a question is on screen and the player may type */
  canType(): boolean {
    const r = this.tl.last()
    return this.phase === 'run' && !!r && !r.known && !this.pending && !this.confirm && this.T >= r.start + 0.35 && !!this.questions[r.i]
  }
  /** the player's yes or no to "did you mean ...?" */
  private answerConfirm(choice: 'yes' | 'no'): void {
    const c = this.confirm, r = this.tl.last()
    if (!c || !r || r.known || this.pending) return
    this.confirm = null
    this.send(r, c.text, choice)
  }
  private onEnter(): void {
    this.sound.unlock()
    if (this.phase === 'title') { void this.pressPrimary(); return }
    if (this.phase === 'report') {
      if (this.T > this.reportAt + 3.1) this.again()
      return
    }
    if (this.canType()) { this.submit(); return }
    this.skipActiveCard()
  }
  private skipActiveCard(): boolean {
    for (const r of this.tl.recs) {
      if (r.cardOn && r.card <= this.T && this.T < r.card + r.clen) {
        const before = r.clen
        skipCard(r, this.T)
        if (r.clen !== before) this.sound.skip(r, this.T)
        return true
      }
    }
    return false
  }

  // ------------------------------------------------------------------ the title: what the server says about today's daily
  /** asks the server about today's daily for this browser. Safe to call again at any time. */
  async loadDaily(): Promise<void> {
    if (this.dailyLoading) return
    this.dailyLoading = true
    this.lastDailyTry = performance.now()
    try {
      this.daily = await getDaily()
      this.dailyAt = performance.now()
      this.dailyFailed = false
    } catch {
      this.dailyFailed = true
      // the server may just be starting: look again in a few seconds while the title is up
      setTimeout(() => { if (this.phase === 'title') void this.loadDaily() }, 5000)
    } finally {
      this.dailyLoading = false
    }
  }
  /** milliseconds left until the daily changes, by the server's count when it last answered */
  private msToReset(): number {
    return this.daily ? this.daily.resetsInMs - (performance.now() - this.dailyAt) : 0
  }
  titleView(): TitleView { return { ...this.titleViewBase(), multi: true } }
  private titleViewBase(): Omit<TitleView, 'multi'> {
    const d = this.daily
    if (!d) {
      return this.dailyFailed
        ? { label: 'SOLO RUN', primary: 'PLAY', enabled: true, secondary: null, line: null, note: null }
        : { label: 'DAILY', primary: 'LOADING', enabled: false, secondary: null, line: null, note: null }
    }
    const label = `DAILY #${d.number}`
    const streak = d.streak > 0 ? `STREAK ${d.streak}` : ''
    if (d.status === 'new') {
      return { label, primary: 'PLAY DAILY', enabled: true, secondary: 'SOLO RUN', line: streak || null, note: 'ONE ATTEMPT A DAY. CLOSING THE PAGE ENDS YOUR RUN.' }
    }
    if (d.status === 'playing') {
      return { label, primary: 'DAILY IN PROGRESS', enabled: false, secondary: 'SOLO RUN', line: 'IT IS OPEN IN ANOTHER WINDOW. PRESS ENTER TO CHECK AGAIN.', note: null }
    }
    return { label, primary: "TODAY'S RESULT", enabled: true, secondary: 'SOLO RUN', line: `NEXT DAILY IN ${formatCountdown(this.msToReset())}${streak ? `  ·  ${streak}` : ''}`, note: null }
  }
  /** the big button on the title screen: what it does depends on the daily's state */
  async pressPrimary(): Promise<void> {
    if (this.phase !== 'title' || this.pressedAt !== null) return
    const d = this.daily
    if (!d) {
      if (this.dailyFailed) await this.press('solo')
      return
    }
    if (d.status === 'new') await this.press('daily')
    else if (d.status === 'done') this.showResult()
    else await this.loadDaily()
  }

  // ------------------------------------------------------------------ multiplayer: the lobby
  private bindVersus(): void {
    this.versus.hooks = {
      roundStart: (s, left) => this.onVersusRound(s, left),
      matchEnd: () => { /* the report waits for this player's own last reveal (see versusStep) */ },
      status: (next) => this.onVersusStatus(next),
      closed: (reason) => this.onVersusClosed(reason),
    }
    this.canvas.addEventListener('pointerup', (e) => {
      const down = this.reportDown
      this.reportDown = null
      if (!down || this.phase !== 'report' || this.reportAt + 2.6 > this.T) return
      const p = this.toCanvas(e)
      if (Math.hypot(p.x - down.x, p.y - down.y) > 24) return          // it was dragged, not tapped
      if (hit(REPORT_BUTTONS.share, p)) this.share()
      else if (hit(REPORT_BUTTONS.again, p)) void this.again()
      else if (hit(REPORT_BUTTONS.home, p)) this.home()
      else if (this.answersOn()) { const i = this.answerRowAt(p); if (i >= 0) this.openAnswers(i) }
    })
    this.canvas.addEventListener('pointercancel', () => { this.reportDown = null })
    this.canvas.addEventListener('pointermove', (e) => { this.mouse = this.toCanvas(e) })
    this.canvas.addEventListener('pointerleave', () => { this.mouse = null })
  }

  /** the MULTIPLAYER button: from the title into the lobby */
  openLobby(): void {
    if (this.phase !== 'title') return
    this.sound.unlock()
    this.phase = 'lobby'
    this.titleOn = false
    this.uiT0 = null
    this.fadeFrom = this.T
    this.lobbyAt = this.T
    this.lobbyScreenSeen = ''
    this.versus.open()
  }
  private toTitle(): void {
    this.sound.reset()
    this.phase = 'title'
    this.titleOn = true
    this.pressedAt = null
    this.uiT0 = null
    this.titleError = ''
    this.fadeFrom = this.T
    this.input.blur()
    this.input.value = ''
    void this.loadDaily()
  }
  private lobbyHasField(): boolean { return this.versus.screen === 'name' || this.versus.screen === 'join' }
  /** keeps the hidden text box in step with the screen: a name or a code is typed into it, and the keyboard appears on phones */
  private syncLobbyInput(): void {
    const key = this.versus.screen
    if (key !== this.lobbyScreenSeen) {
      this.lobbyScreenSeen = key
      this.input.value = this.versus.field
      if (this.lobbyHasField()) this.input.focus({ preventScroll: true })
      else this.input.blur()
    } else if (this.lobbyHasField() && this.input.value !== this.versus.field) this.input.value = this.versus.field
    if (key === 'browse') void this.versus.refreshRooms()
  }
  private lobbyKey(e: KeyboardEvent): void {
    if (e.key === 'Enter') { e.preventDefault(); this.lobbyEnter(); return }
    if (e.key === 'Escape') { e.preventDefault(); this.lobbyBack(); return }
    if (this.lobbyHasField() && document.activeElement !== this.input && (e.key.length === 1 || e.key === 'Backspace')) this.input.focus({ preventScroll: true })
  }
  private lobbyEnter(): void {
    const s = this.versus.screen
    if (s === 'menu' || s === 'browse') return
    const it = lobbyItems(this.versus).find((i) => i.kind === 'primary' && i.enabled)
    if (it) this.lobbyAction(it)
  }
  private lobbyBack(): void {
    const s = this.versus.screen
    if (s === 'name' || s === 'menu') this.toTitle()
    else if (s !== 'room') { this.versus.go('menu'); this.syncLobbyInput() }
  }
  private lobbyPointer(p: { x: number; y: number }): void {
    const it = itemAt(lobbyItems(this.versus), p)
    if (it) { this.sound.key(); this.lobbyAction(it); return }
    if (this.lobbyHasField()) this.input.focus({ preventScroll: true })
  }
  lobbyAction(it: LobbyItem): void {
    const v = this.versus
    switch (it.action) {
      case 'title': this.toTitle(); break
      case 'name-ok': v.submitName(); break
      case 'menu-create': v.go('create'); break
      case 'menu-join': v.go('join'); break
      case 'menu-browse': v.go('browse'); break
      case 'menu-name': v.go('name'); break
      case 'create-private': v.createVisibility = 'private'; break
      case 'create-public': v.createVisibility = 'public'; break
      case 'create-go': void v.create(); break
      case 'join-go': void v.join(v.field); break
      case 'back-menu': v.go('menu'); break
      case 'browse-join': if (it.arg) void v.join(it.arg); break
      case 'room-start': void v.startMatch(); break
      case 'room-rematch': void v.rematch(); break
      case 'room-visibility': void v.setVisibility(v.room?.visibility === 'public' ? 'private' : 'public'); break
      case 'room-copy': this.copyCode(); break
      case 'room-leave': void v.leave(); break
    }
    // The hidden text box must match the new screen AT ONCE, not on the next drawn frame: a player (or a fast typist on a slow phone)
    // who taps a button and types straight away would otherwise get the old text (their name) in front of what they type. Doing it here
    // also happens inside the tap, which is what lets a phone open its on-screen keyboard.
    if (this.phase === 'lobby') this.syncLobbyInput()
  }
  private copyCode(): void {
    const code = this.versus.room?.code
    if (!code) return
    const done = () => { this.versus.notice = 'CODE COPIED' }
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(code).then(done, () => window.prompt('Copy the room code', code))
    else window.prompt('Copy the room code', code)
  }

  // ------------------------------------------------------------------ multiplayer: the match
  /** what the room says: a match has started (everybody's screen goes from the room to the first question) */
  private onVersusStatus(next: 'waiting' | 'playing' | 'finished'): void {
    if (next === 'playing' && !(this.phase === 'run' && this.inVersus)) this.beginVersusMatch()
  }
  private beginVersusMatch(): void {
    if (!this.versus.room) return
    this.sound.unlock()
    this.sound.reset()
    this.inVersus = true
    this.mode = 'solo'
    this.run = { runId: this.versus.room.code, count: RUN_LENGTH, seconds: 30, mode: 'solo' }
    this.records = []
    this.tl.recs = []
    this.questions = []
    this.startedIdx = -1
    this.vNext = null
    this.readySent = new Set()
    this.revealSent = new Set()
    this.reportDaily = null
    this.reportData = null
    this.reportAt = Infinity
    this.lastPostVariant = null
    this.typed = ''
    this.input.value = ''
    this.message = ''
    this.pending = false
    this.confirm = null
    this.titleOn = false
    this.phase = 'run'
    this.fadeFrom = this.T
    this.uiT0 = this.T
  }
  /** the server started a question (for everybody at once): show it as soon as this screen has finished the last one */
  private onVersusRound(s: VRoundStart, left: number): void {
    if (!this.inVersus) this.beginVersusMatch()
    if (!this.inVersus || this.phase !== 'run' || this.tl.recs.length > s.round) return
    this.vNext = { start: s, left }
  }
  /** every frame of a match: say "ready" when the last reveal has finished, start the next question when the server has, end with the results */
  private versusStep(): void {
    const T = this.T
    const r = this.tl.last()
    const nx = this.vNext
    // this player's roll animation is over: only now may the other players see the rarity (a miss has no roll: the server shows it at once)
    if (r && r.known && !r.miss && T >= r.rev && !this.revealSent.has(r.i)) {
      this.revealSent.add(r.i)
      void this.versus.revealed(r.i).catch(() => { /* the server shows the result by itself after a few seconds */ })
    }
    // this player has finished watching their own result: ready for the next question, or (after the last) for the result page
    if (r && r.known && T >= r.next && !this.readySent.has(r.i)) {
      this.readySent.add(r.i)
      void this.versus.ready(r.i).catch(() => { /* the server also moves on by itself after a while */ })
    }
    if (nx) {
      const round = nx.start.round
      if (r && !r.known && round > r.i) this.miss(r)   // the server has moved on without us
      if (!r) {
        while (this.tl.recs.length < round) this.fillMiss()
        if (this.tl.recs.length === round) this.startVersusQuestion(nx, this.T + 0.8)
      } else if (r.known && T >= r.next && r.i < round) {
        while (this.tl.recs.length < round) this.fillMiss()
        this.startVersusQuestion(nx, r.next)
      }
    }
    // the server sends the standings only when EVERY player has finished their last reveal, so everybody reaches this page together
    if (r && r.known && T >= r.next && r.i === RUN_LENGTH - 1 && this.versus.end) this.enterReport(Math.max(r.next, T))
  }
  /** this player's own row of the players panel: their result only once their own roll animation is over */
  private ownReveal(): { miss: boolean; tier: number; points: number } | null {
    const r = this.tl.last()
    if (!this.inVersus || !r || !r.known || r.i !== this.versus.round?.index) return null
    if (r.miss) return { miss: true, tier: -1, points: 0 }
    return this.T >= r.rev ? { miss: false, tier: r.ti, points: r.pts } : null
  }
  private startVersusQuestion(nx: { start: VRoundStart; left: number }, start: number): void {
    this.vNext = null
    this.newQuestion(Math.max(start, this.T), nx)
  }
  /** a round this player did not take part in (they were away): a quiet miss in the past, so the numbers line up */
  private fillMiss(): void {
    const i = this.tl.recs.length
    const prev = this.records[i - 1]
    const r = newRec(i, this.T - 1000, prev ? prev.c1 : 0, prev ? prev.u1 : 0, prev ? prev.z1 : 0)
    const core = nextRecord(this.records, null)
    this.records.push(core)
    this.tl.recs.push(r)
    makeMiss(r, r.start + 1, core)
  }
  private clearRun(): void {
    this.sound.reset()
    this.run = null
    this.tl.recs = []
    this.records = []
    this.questions = []
    this.startedIdx = -1
    this.vNext = null
    this.readySent = new Set()
    this.revealSent = new Set()
    this.reportAt = Infinity
    this.reportData = null
    this.reportDaily = null
    this.confirm = null
    this.pending = false
    this.typed = ''
    this.input.value = ''
    this.message = ''
  }
  /** after a match: back to the room (the host can start another match from there) */
  private backToRoom(): void {
    this.inVersus = false
    this.clearRun()
    this.phase = 'lobby'
    this.titleOn = false
    this.uiT0 = null
    this.fadeFrom = this.T
    this.lobbyAt = this.T
    this.lobbyScreenSeen = ''
    this.versus.open()
  }
  /** the server ended this player's place in the room (it was closed, or the player was removed) */
  private onVersusClosed(reason: string): void {
    if (this.inVersus) {
      this.inVersus = false
      this.clearRun()
      this.phase = 'lobby'
      this.titleOn = false
      this.uiT0 = null
      this.fadeFrom = this.T
      this.lobbyAt = this.T
      this.lobbyScreenSeen = ''
    }
    if (reason) this.versus.error = reason
  }

  // ------------------------------------------------------------------ flow
  async press(mode: RunMode = 'solo'): Promise<void> {
    if (this.pressedAt !== null || this.phase !== 'title') return
    this.pressedAt = this.T
    this.titleError = ''
    this.uiT0 = this.T + (INTRO - PRESS_AT) - 0.4
    this.sound.unlock()
    this.sound.press(this.T)
    await this.begin(this.T + (INTRO - PRESS_AT), mode).catch((e: unknown) => {
      this.pressedAt = null
      this.uiT0 = null
      if (e instanceof ApiError && e.status !== 404) {
        this.titleError = e.message
        void this.loadDaily()   // the daily may have been played or opened elsewhere: show what is true now
      } else {
        this.titleError = e instanceof Error && e.name !== 'AbortError' ? "Can't reach the game server. Press PLAY to try again." : 'The server took too long. Press PLAY to try again.'
      }
    })
  }
  /**
   * From the report (the end of a run, or today's result opened from the title): back to the title screen, where the daily and a
   * solo run can be chosen again. The title is asked about the daily afresh, so it shows what is true now (TODAY'S RESULT, the countdown).
   */
  home(): void {
    if (this.phase !== 'report') return
    if (this.inVersus) { this.inVersus = false; void this.versus.leave() }
    this.sound.unlock()
    this.sound.reset()
    this.run = null
    this.tl.recs = []
    this.records = []
    this.questions = []
    this.startedIdx = -1
    this.reportAt = Infinity
    this.reportData = null
    this.reportDaily = null
    this.confirm = null
    this.pending = false
    this.typed = ''
    this.input.value = ''
    this.message = ''
    this.titleError = ''
    this.pressedAt = null
    this.uiT0 = null
    this.titleOn = true
    this.phase = 'title'
    this.fadeFrom = this.T
    // A daily that has just ended may not be on record yet in what the browser last heard ("new"): do not offer PLAY DAILY again for a moment.
    if (this.mode === 'daily' && this.daily?.status !== 'done') this.daily = null
    void this.loadDaily()
  }
  /** after the report: straight into a new solo run, no title screen */
  async again(): Promise<void> {
    if (this.phase !== 'report') return
    if (this.inVersus) { this.backToRoom(); return }
    this.titleOn = false
    this.tl.recs = []
    this.records = []
    this.phase = 'run'
    this.reportAt = Infinity
    this.reportData = null
    this.reportDaily = null
    this.fadeFrom = this.T
    this.uiT0 = this.T
    this.sound.reset()
    this.run = null
    try {
      await this.begin(this.T + 0.8, 'solo')
    } catch {
      this.phase = 'title'
      this.titleOn = true
      this.pressedAt = null
      this.uiT0 = null
      this.titleError = "Can't reach the game server. Press PLAY to try again."
    }
  }
  private async begin(minStart: number, mode: RunMode): Promise<void> {
    const run = mode === 'daily' ? await startDaily() : await startRun()
    this.run = run
    this.mode = mode
    this.records = []
    this.tl.recs = []
    this.questions = []
    this.startedIdx = -1
    this.abandonSent = false
    this.reportDaily = null
    this.phase = 'run'
    this.lastPostVariant = null
    this.newQuestion(Math.max(minStart, this.T))
  }
  private newQuestion(start: number, vq?: { start: VRoundStart; left: number }): void {
    const i = this.tl.recs.length
    const prev = this.records[i - 1]
    this.tl.recs.push(newRec(i, start, prev ? prev.c1 : 0, prev ? prev.u1 : 0, prev ? prev.z1 : 0))
    this.typed = ''
    this.message = ''
    this.pending = false
    this.confirm = null
    this.missPending = false
    // the player's clock starts when the prompt is on screen (see fetchQuestion)
    this.deadline = Infinity
    this.input.value = ''
    this.input.focus({ preventScroll: true })
    this.sound.question(this.tl.recs[i])
    if (vq) {
      // a match question: the server has already started its clock and sent the prompt with it
      this.questions[i] = vq.start.question
      this.startedIdx = i
      this.deadline = Math.max(this.T, start + 0.55) + vq.left
    } else if (this.run) this.fetchQuestion(this.run, i, 0)
  }
  /** Asks the server for question i: this starts its clock there and is the first time the prompt exists in this browser. */
  private fetchQuestion(run: StartRunResponse, i: number, tries: number): void {
    sendStart(run.runId, i).then(
      (resp) => {
        if (this.run !== run) return
        this.startedIdx = Math.max(this.startedIdx, i)
        this.questions[i] = resp.question
        const r = this.tl.recs[i]
        if (r && r === this.tl.last() && !r.known) {
          this.deadline = Math.max(this.T, r.start + 0.55) + run.seconds
          if (this.message) this.message = ''
        }
      },
      (err: unknown) => {
        if (this.run !== run) return
        const r = this.tl.recs[i]
        if (err instanceof ApiError && err.status === 409) {
          // the server already closed this question: it counts as a miss
          if (r && !r.known) { r.lock = Infinity; r.typed = ''; this.miss(r) }
          return
        }
        if (err instanceof ApiError && err.status === 404) {
          if (r && r === this.tl.last() && !r.known) this.message = 'This run was lost. Reload the page.'
          return
        }
        // no answer from the server: say so after a few tries, and keep trying
        if (r && r === this.tl.last() && !r.known && tries >= 2) this.message = "Can't reach the server. Trying again..."
        setTimeout(() => { if (this.run === run) this.fetchQuestion(run, i, tries + 1) }, 1500)
      },
    )
  }

  private submit(): void {
    const r = this.tl.last()
    if (!r || !this.run || !this.canType()) return
    const text = this.typed.trim()
    if (!text) return
    this.send(r, text)
  }
  /** Sends the answer. `confirm` is the player's reply to the checker's "did you mean ...?": 'yes' accepts the suggestion, 'no' says the text is meant as typed. */
  private send(r: Rec, text: string, confirm?: 'yes' | 'no'): void {
    if (!this.run) return
    this.pending = true
    this.lockT = this.T
    this.lockRemain = Math.max(0, this.deadline - this.T)
    r.lock = this.T
    r.typed = text
    this.message = ''
    this.sound.lock(r)
    const runId = this.run.runId
    const go = () => (this.inVersus ? this.versus.answer(r.i, text, confirm) : sendAnswer(runId, r.i, text, confirm))
    // the server must know the question has started; if the first message was lost, send it again first (a match question starts for everybody at once)
    const ready = this.inVersus || this.startedIdx === r.i ? go() : sendStart(runId, r.i).then(() => { this.startedIdx = r.i }).then(go)
    ready.then(
      (resp) => this.onAnswer(r, resp, text),
      (err: unknown) => this.onAnswerFailed(r, err),
    )
  }
  /**
   * The checker thinks the text is a misspelling of a known answer and asks "did you mean ...?". Nothing is scored until the player
   * says yes. The question clock keeps running while the player decides; only the time spent waiting for the checker is given back.
   */
  private askConfirm(r: Rec, text: string, suggestion: string): void {
    this.deadline = this.T + this.lockRemain
    r.lock = Infinity
    r.typed = ''
    this.message = ''
    this.confirm = { text, suggestion }
  }
  private onAnswer(r: Rec, resp: Awaited<ReturnType<typeof sendAnswer>>, text: string): void {
    if (r.known) return
    this.pending = false
    if (resp.status === 'confirm' && resp.answer) { this.askConfirm(r, text, resp.answer); return }
    if (resp.status === 'valid' && typeof resp.tier === 'number' && resp.tier >= 0 && resp.tier < TIERS.length) {
      const core = nextRecord(this.records, resp.tier)
      r.answer = resp.answer ?? text
      r.desc = resp.description ?? ''
      if (resp.tier === GEM_TIER) this.recordGem(r)
      schedule(r, core, { lock: this.lockT, respondedAt: this.T })
      if (core.post === 1) {
        this.lastPostVariant = pickPostFirst(this.lastPostVariant)
        r.postVariant = this.lastPostVariant
      } else if (core.post === 2) r.postVariant = this.lastPostVariant ?? 0
      this.records.push(core)
      this.typed = ''
      this.input.value = ''
      this.sound.scheduled(r, this.T, this.tl)
      return
    }
    this.reject(r, resp.message ?? (resp.status === 'invalid' ? "That doesn't count." : "Couldn't check that. Try another."))
  }
  /** the answer is the question's gem: it goes into the cabinet (which says whether it is new) and the reveal will say so */
  private recordGem(r: Rec): void {
    const q = this.questions[r.i]
    if (!q) return
    const got = this.cabinet?.add({ id: q.id, category: q.category, prompt: q.prompt, answer: r.answer, desc: r.desc, day: utcDay(Date.now()) })
    r.gem = { isNew: got ? got.isNew : true, found: got ? got.found : 1, total: got ? got.total : 1, category: q.category }
  }
  private onAnswerFailed(r: Rec, err: unknown): void {
    if (r.known) return
    this.pending = false
    if (err instanceof ApiError && err.code === 'late') {
      // the server's clock says time was up: same as running out of time here
      r.lock = Infinity
      r.typed = ''
      this.miss(r)
      return
    }
    let m = err instanceof Error && err.name === 'AbortError' ? 'The checker took too long. Try again.' : "Can't reach the server. Try again."
    if (err instanceof ApiError && (err.code === 'too_many' || err.code === 'rate')) m = err.message
    this.reject(r, m)
  }
  private reject(r: Rec, msg: string): void {
    // give back the time spent waiting and let the player edit the same text
    this.deadline = this.T + this.lockRemain
    r.lock = Infinity
    r.typed = ''
    this.message = msg
    this.shakeAt = this.T
    this.sound.invalid()
    this.input.focus({ preventScroll: true })
  }

  /** time ran out with no valid answer */
  private miss(r: Rec): void {
    if (this.missPending || r.known) return
    this.missPending = true
    this.confirm = null // time ran out while "did you mean ...?" was on screen: the question is lost, as the clock never stopped
    const core = nextRecord(this.records, null)
    this.records.push(core)
    this.typed = ''
    this.input.value = ''
    makeMiss(r, this.T, core)
    if (this.run) (this.inVersus ? this.versus.miss(r.i) : sendMiss(this.run.runId, r.i)).catch(() => { /* the server also closes the question when the run ends */ })
    this.sound.miss(r, this.T)
  }

  private share(): void {
    const number = this.mode === 'daily' ? (this.reportDaily ?? this.daily)?.number ?? this.run?.number : undefined
    let text = shareText(this.records, number)
    if (!/^(localhost|127\.|\[::1\])/.test(location.hostname)) text += '\n' + location.origin
    const done = () => { this.toastAt = this.T }
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done, () => window.prompt('Copy your result', text))
    else window.prompt('Copy your result', text)
  }

  // ------------------------------------------------------------------ per-frame state
  update(dt: number): void {
    this.T += dt
    const T = this.T
    if (this.phase === 'title' && this.daily && this.msToReset() <= 0 && performance.now() - this.lastDailyTry > 3000) void this.loadDaily()
    if (this.phase === 'lobby') this.syncLobbyInput()
    if (this.phase === 'run') {
      const r = this.tl.last()
      if (r) {
        if (this.pending) this.deadline += dt              // the checker's time is not the player's
        else if (!r.known && T >= this.deadline) this.miss(r)
        if (!this.inVersus && r.known && T >= r.next) {
          if (r.i < RUN_LENGTH - 1) this.newQuestion(r.next)
          else this.enterReport(r.next)
        }
      }
      if (this.inVersus) this.versusStep()
    }
    this.syncAfter()
    // the cabinet button is on the title screen and the report only (not while a question is being answered)
    this.cabinet?.setButtonVisible(this.phase === 'title' || this.phase === 'report')
  }
  private syncAfter(): void {
    const a = this.after
    if (!a) return
    const settled = this.phase === 'report' && this.T >= this.reportAt + 2.6
    if (settled && !a.open) a.reveal()
    else if (!settled && a.open) a.hide()
  }
  private enterReport(at: number, fresh = true): void {
    this.phase = 'report'
    this.reportAt = at
    this.reportData = buildReport(this.records)
    this.after?.prepare({ mode: this.inVersus ? 'versus' : this.mode === 'daily' ? 'daily' : 'solo', runId: this.run?.runId ?? null, points: this.reportData.total, fresh })
    this.input.blur()
    this.sound.report(at, isPerfect(this.records))
    if (this.mode === 'daily') void this.fetchReportDaily(0)
  }
  /** after a daily run: the server's word on where it ranks (it may take a moment for the last question to be written down) */
  private async fetchReportDaily(tries: number): Promise<void> {
    try {
      const d = await getDaily()
      if (d.status === 'done') {
        this.daily = d
        this.dailyAt = performance.now()
        this.reportDaily = d
        return
      }
    } catch { /* try again */ }
    if (tries < 8 && this.phase === 'report') setTimeout(() => void this.fetchReportDaily(tries + 1), 1500)
  }

  /** the report of a daily that was already played today (from the title screen): the same screen as at the end of a run */
  showResult(): void {
    const d = this.daily
    if (this.phase !== 'title' || !d || d.status !== 'done' || !d.items) return
    this.sound.unlock()
    this.mode = 'daily'
    this.run = null
    this.titleOn = false
    this.pressedAt = null
    const records: RunRecord[] = []
    const recs: Rec[] = []
    const base = this.T - 1000        // every record is long in the past, so the camera rests at the final depth
    d.items.forEach((it, i) => {
      const core = nextRecord(records, it.miss || it.tier === null ? null : it.tier)
      const prev = recs[i - 1]
      const r = newRec(i, base + 60 * i, prev ? prev.c1 : 0, prev ? prev.u1 : 0, prev ? prev.z1 : 0)
      if (it.miss) makeMiss(r, r.start + 1, core)
      else {
        r.answer = it.answer ?? ''
        schedule(r, core, { lock: r.start + 1, respondedAt: r.start + 1.5 })
      }
      records.push(core)
      recs.push(r)
    })
    this.records = records
    this.tl.recs = recs
    this.phase = 'report'
    this.reportDaily = d
    this.fadeFrom = this.T
    this.uiT0 = this.T
    this.enterReport(this.T + 0.2, false)
  }

  // ------------------------------------------------------------------ rendering
  private landing(r: Rec): LandingLine | null {
    if (r.hintLevel > 0) return { main: voidHintLine(r.hintLevel) ?? '', glow: 1, rgb: HINT_RGB }
    if (r.post > 0) {
      const l = postLines(r.post as 1 | 2, r.postVariant)
      return { main: l.main, small: l.small, glow: 0.8, rgb: POST_RGB }
    }
    return null
  }
  private askView(r: Rec): AskView {
    const T = this.T
    const q = this.questions[r.i]
    const locked = r.known || this.pending
    const total = this.run?.seconds ?? 30
    return {
      category: q?.category ?? '',
      prompt: q?.prompt ?? '',
      typed: locked ? r.typed : this.typed,
      checking: this.pending ? T >= this.lockT + 0.2 : r.known && !r.miss && T >= r.chk && T < r.val,
      valid: r.known && !r.miss && T >= r.val,
      message: locked ? '' : this.message,
      confirm: locked ? null : this.confirm ? this.confirm.suggestion : null,
      remain: locked ? this.lockRemain : Number.isFinite(this.deadline) ? Math.min(total, Math.max(0, this.deadline - T)) : total,
      total,
      caret: !locked && (T - this.lastKeyAt < 0.6 || Math.floor(T * 2) % 2 === 0),
      shake: this.message ? clamp01(1 - (T - this.shakeAt) / 0.45) : 0,
    }
  }

  render(): void {
    const T = this.T, tl = this.tl, f = this.f
    const rec0 = tl.recs[0]
    const r = tl.recs.length ? tl.curRec(T) : null
    const intro = !r || T < rec0.start
    const rep = this.phase === 'report'
    const showTitle = this.titleOn && intro
    const cam = tl.cam(T)
    const fr = rep ? null : finRec(tl, T)

    // ---- world (the one the camera is in is alive: its picture is drawn again for this moment)
    const live = this.life.frame(cam.z, T)
    if (live?.fresh) this.gl.setLive(live.pixels)
    if (this.gl.draw(cam.z, cam.pulse, 0.05 * cam.s, 0.011 * cam.s, live !== null)) f.drawImage(this.gl.canvas, 0, 0)
    else {
      // the world picture is being rebuilt: clear the frame (the 2D layers below are drawn over it, so old pixels would pile up)
      f.fillStyle = `rgb(${INK[0]},${INK[1]},${INK[2]})`
      f.fillRect(0, 0, W, H)
    }
    if (fr) dimPre(f, tl, T)

    let p: { sx: number; sy: number; dx: number; dy: number; aura: number; glow: number } = { sx: 1, sy: 1, dx: 0, dy: 0, aura: 0, glow: 0 }
    if (!intro && !rep && r) {
      bgPull(f, r, T); bgReveal(f, r, T); bgCharge(f, r, T)
      p = pose(tl, T, cam, r)
      if (fr) { p = poseExtra(p, fr, T); bloomPre(f, fr, T, cam) }
    } else if (showTitle && this.pressedAt !== null && T - this.pressedAt < 0.7) p.aura = 1
    const exitT = this.pressedAt === null ? 0 : PRESS_AT + (T - this.pressedAt)
    if (showTitle) {
      const aIn = smooth(0.3, 0.9, T), outK = smooth(INTRO_EXIT, INTRO_EXIT + 0.6, exitT)
      shade(f, 0, 0, W, H, [4, 7, 18], 0.56 * aIn * (1 - outK), 0.56 * aIn * (1 - outK))
    }
    if (this.phase !== 'lobby') this.putExplorer(f, p)

    if (!intro && !rep && r) {
      const ad = this.add
      addPull(ad, r, T); addReveal(ad, r, T); addCharge(ad, r, T)
      if (r.fin) addFinale(ad, tl, r, T, cam)
      else addFall(ad, tl, r, T, cam)
      addLand(ad, r, T)
      for (const rr of tl.recs) if (rr.cardOn && rr.card - 0.01 <= T && T < rr.card + rr.clen) addCard(ad, this.accents, rr, T)
      ad.apply(f)
      const v = vignetteAt(tl, T, cam)
      if (v) vignette(f, v[0], v[1])
    }

    // quiet gradients instead of panels
    const uiA = this.uiT0 === null ? 0 : easeOut((T - this.uiT0) / 0.6)
    vscrim(f, 0, 120, 0.55 * uiA, true)
    const bp = intro || rep || !r ? null : this.bottomPlan(r)
    if (bp !== null) vscrim(f, 470, 720, 0.84 * bp)
    if (rep) {
      const ra = easeOut((T - this.reportAt) / 0.6)
      shade(f, 0, 0, W, H, [4, 7, 18], 0.45 * ra, 0.45 * ra)
      shade(f, 0, 0, 800, H, [4, 7, 18], 0.80 * ra, 0.0, 1)
    }

    // front elements
    if (showTitle) frontIntro(f, T, exitT, this.titleView().label)
    else if (!rep && !intro && r) {
      frontPull(f, r, T); frontReveal(f, this.gems, r, T); frontStamp(f, r, T)
      gates(f, this.accents, tl, r, T)
      titleCard(f, this.accents, r, T)
      for (const rr of tl.recs) if (rr.i !== r.i && rr.cardOn && rr.card <= T && T < rr.card + rr.clen) titleCard(f, this.accents, rr, T)
      if (fr) finaleCard(f, fr, T)
      const ln = this.landing(r)
      if (ln) landingLines(f, r, T, ln)
    }

    // ---- top and right
    const dim = uiDim(tl, T)
    if (uiA > 0.004) {
      const dots = this.dotColours()
      let nsq = 0
      for (const rr of tl.recs) if (T >= rr.dotAt) nsq = rr.i + 1
      // the gem counter appears once the cabinet holds a gem; a new gem is counted when it has flown into it
      const cab = this.cabinet
      const flying = tl.recs.filter((rr) => rr.gem?.isNew && T < rr.chg + 0.45).length
      const gemN = cab ? cab.count - flying : 0
      const S: HudState = { nsq: rep ? 7 : nsq, curOpen: rep || nsq >= 7 ? -1 : nsq, sizeTxt: fmtSize(sizeOfU(cam.u)), dots, gem: cab && gemN > 0 ? { icon: this.gems.canvas(GEM_TIER, 26), found: gemN, total: Math.max(cab.total, gemN) } : null }
      this.groups.draw(f, uiA * dim, (c) => (rep ? hudDotsOnly(c, dots) : hud(c, S, cam)))
      this.groups.draw(f, uiA * dim, (c) => rail(c, tl, T, cam, r ?? this.dummy, rep))
      if (this.inVersus && !rep) this.groups.draw(f, uiA * dim, (c) => drawVersusPanel(c, this.versus, T, this.ownReveal()))
    }

    // ---- scale bar
    if (!rep) {
      let hide = false
      if (!intro && r) {
        if (r.roll - 0.15 <= T && T < r.fs - 0.05) hide = true
        for (const rr of tl.recs) if (rr.cardOn && rr.card - 0.05 <= T && T < rr.card + rr.clen - 0.2) hide = true
        if (fr && fr.fs + 1.0 <= T && T < fr.card + fr.clen) hide = true
      }
      if (!hide && this.phase !== 'lobby' && (!showTitle || T > 1.0)) {
        const [L, B, flash] = tl.barState(T)
        const a = showTitle ? easeOut((T - 1.0) / 0.5) : 1
        const lab = fmtSize(B)
        this.groups.draw(f, a, (c) => scalebar(c, L, lab, flash))
      }
    }

    // ---- bottom block
    if (bp !== null && r) this.bottomBlock(f, r, bp)
    // a match: this player has seen their result and is waiting for the others
    if (this.inVersus && !rep && r && r.known && T >= r.next - 0.2 && T > r.start + 3) this.waitLine(f)

    // ---- the multiplayer lobby
    if (this.phase === 'lobby') {
      shade(f, 0, 0, W, H, [4, 7, 18], 0.86 * easeOut((T - this.lobbyAt) / 0.4))
      this.groups.draw(f, easeOut((T - this.lobbyAt) / 0.4), (c) => drawLobby(c, this.versus, T, this.mouse))
    }

    // ---- title button, report
    if (showTitle) {
      const tv = this.titleView()
      this.groups.draw(f, 1, (c) => introButtons(c, T, exitT, this.pressedAt, T, T, tv))
      if (this.titleError) this.errorLine(f, this.titleError)
    }
    if (rep && this.reportData) {
      const tr = T - this.reportAt
      const toast = T - this.toastAt < 1.4 ? 1 : 0
      const recs = tl.recs
      const extras = this.reportExtras()
      this.groups.draw(f, 1, (c) => report(c, tr, recs, this.reportData!, toast, extras))
      if (this.inVersus && this.versus.end) this.groups.draw(f, 1, (c) => drawStandings(c, tr, this.versus.end!, this.versus.me))
    }

    // ---- to the screen: shake, flash, fades
    const o = this.out
    const a = intro ? 0 : shakeAmp(tl, T, cam)
    if (a > 0.4) {
      const dx = Math.round(a * (Math.sin(T * 91.0 + 1.3) * 0.6 + Math.sin(T * 53.0) * 0.4))
      const dy = Math.round(a * (Math.sin(T * 77.0 + 4.1) * 0.6 + Math.sin(T * 37.0 + 2) * 0.4))
      shiftBlit(o, this.frame, dx, dy)
    } else o.drawImage(this.frame, 0, 0)
    const fl = intro || rep ? null : flashAt(tl, T)
    if (fl) { o.fillStyle = `rgba(${fl[0][0]},${fl[0][1]},${fl[0][2]},${fl[1]})`; o.fillRect(0, 0, W, H) }
    const fk = easeOut((T - this.fadeFrom) / 0.5)
    if (fk < 1) { o.fillStyle = `rgba(${INK[0]},${INK[1]},${INK[2]},${1 - fk})`; o.fillRect(0, 0, W, H) }
    this.sound.frame(T, cam, tl, this.phase === 'lobby' ? 'title' : this.phase)
  }

  // ------------------------------------------------------------------ the Daily's report: click an answer to see everything that counted
  /** the Daily this report is about (the run just played, or today's result opened from the title) */
  private answersDay(): string | null {
    return this.run?.day ?? this.reportDaily?.day ?? this.daily?.day ?? null
  }
  /** the rows of the report open the answer lists: a Daily, once the buttons are up (the same moment they can be pressed) */
  private answersOn(): boolean {
    return !!this.answers && this.phase === 'report' && !this.inVersus && this.mode === 'daily' && !!this.answersDay() && this.T > this.reportAt + 2.6
  }
  private answerRowAt(p: { x: number; y: number } | null): number {
    if (!p) return -1
    const extra = !!this.reportData?.extraLine
    for (let i = 0; i < this.tl.recs.length; i++) if (hit(reportRowBox(i, extra), p)) return i
    return -1
  }
  private openAnswers(i: number): void {
    const day = this.answersDay(), r = this.tl.recs[i]
    if (!day || !r || !this.answers) return
    this.sound.unlock()
    this.answers.open(day, i, r.miss || !r.known ? null : { answer: r.answer, tier: r.ti, points: r.pts })
  }

  /** what the report shows besides the run: the second button's name and, for a daily, its standing and the countdown */
  private reportExtras(): ReportExtras {
    const gem = this.cabinet ? { icon: this.gems.canvas(GEM_TIER, 22), found: this.cabinet.count, total: this.cabinet.total } : null
    const on = this.answersOn()
    const hover = on ? this.answerRowAt(this.mouse) : -1
    this.canvas.style.cursor = hover >= 0 ? 'pointer' : ''
    const answers = on ? { hover } : null
    if (this.inVersus) return { againLabel: 'BACK TO ROOM', daily: null, gem, answers }
    if (this.mode !== 'daily') return { againLabel: 'PLAY AGAIN', daily: null, gem, answers }
    const d = this.reportDaily
    const ms = this.daily ? this.msToReset() : Infinity
    return {
      againLabel: 'SOLO RUN',
      gem,
      answers,
      daily: {
        number: d?.number ?? this.run?.number ?? this.daily?.number ?? 0,
        lines: d?.standings ? standingsLines(d.standings) : [],
        streak: d?.streak ?? 0,
        countdown: formatCountdown(ms),
        newReady: !!this.daily && ms <= 0,
      },
    }
  }

  /** during a match, once this player's reveal is over: who the next question is waiting for */
  private waitLine(f: Ctx): void {
    const round = this.versus.round
    const last = this.tl.last()?.i === RUN_LENGTH - 1
    const waiting = round?.phase === 'answering'
      ? (this.versus.room?.players.filter((p) => !p.gone && !round.answered.has(p.seat)).map((p) => p.name) ?? [])
      : []
    let msg = last ? 'WAITING FOR THE OTHER PLAYERS TO FINISH' : 'WAITING FOR THE OTHER PLAYERS'
    if (waiting.length === 1) msg = 'WAITING FOR ' + waiting[0].toUpperCase()
    f.save()
    f.globalAlpha = 0.6 + 0.4 * Math.sin(this.T * 3)
    stext(f, msg.slice(0, 60), 640, 704, SILF(12, false), SOFT, 3, 'c')
    f.restore()
  }

  private errorLine(c: Ctx, msg: string): void {
    c.save()
    c.font = '600 20px PixelifyFix, monospace'
    c.textAlign = 'center'
    c.fillStyle = 'rgb(255,130,100)'
    c.fillText(msg, 640, 672)
    c.restore()
  }

  private dotColours(): (RGB | null)[] {
    const d: (RGB | null)[] = new Array(7).fill(null)
    for (const rr of this.tl.recs) if (rr.known) d[rr.i] = rr.miss ? MISS_DOT : TIERS[rr.ti].edge
    return d.map((c) => c ?? FAINT)
  }

  /** visibility 0..1 of the question / roll / result block, or null when it is not on screen */
  private bottomPlan(r: Rec): number | null {
    const T = this.T
    let v = easeOut((T - r.start) / 0.55) * (1 - easeInOut((T - (r.chg - 0.05)) / 0.35))
    if (r.miss) v *= 1 - easeInOut((T - (r.next - 0.4)) / 0.35)
    if (T > r.chg + 0.35 || v <= 0.005) return null
    return v
  }
  private bottomBlock(f: Ctx, r: Rec, v: number): void {
    const T = this.T
    const dy = (1 - v) * 18
    if (r.miss) { this.groups.draw(f, v, (c) => timeUp(c, this.askView(r), dy)); return }
    if (T < r.roll) { this.groups.draw(f, v, (c) => ask(c, T, this.askView(r), dy)); return }
    if (T < r.rev) {
      const k = clamp01((T - r.roll) / 0.18)
      if (k < 1) this.groups.draw(f, v * (1 - k), (c) => ask(c, T, this.askView(r), dy))
      const pull = r.ti === GEM_TIER ? 1 - smooth(pullStart(r), pullStart(r) + 0.5, T) : 1
      this.groups.draw(f, v * k * pull, (c) => roll(c, this.tl, this.gems, T, r, dy))
      return
    }
    this.groups.draw(f, v, (c) => result(c, this.gems, T, r, dy))
  }

  private putExplorer(f: Ctx, p: { sx: number; sy: number; dx: number; dy: number; aura: number }): void {
    const a = Math.max(0, Math.min(2, p.aura))
    const box = this.assets.manifest.explorer[String(a)]
    const img = this.assets.explorer[a]
    const w = box.w * 4, h = box.h * 4
    const x0 = box.ox * 4, y0 = box.oy * 4 - 60
    const fx = x0 + w / 2, fy = y0 + h
    const nw = Math.max(2, Math.round(w * p.sx)), nh = Math.max(2, Math.round(h * p.sy))
    f.save()
    f.imageSmoothingEnabled = false
    f.drawImage(img, Math.round(fx - nw / 2 + p.dx), Math.round(fy - nh + p.dy), nw, nh)
    f.restore()
  }

  // ------------------------------------------------------------------ test hooks (used by ?manual=1 only)
  debugState(): Record<string, unknown> {
    const r = this.tl.last()
    return {
      T: this.T, phase: this.phase, pending: this.pending, canType: this.canType(), confirm: this.confirm ? this.confirm.suggestion : null, records: this.records.length,
      rec: r ? { i: r.i, known: r.known, miss: r.miss, start: r.start, next: r.next, card: r.card, clen: r.clen, fs: r.fs, fe: r.fe, rev: r.rev, roll: r.roll, val: r.val, chg: r.chg, chk: r.chk, dur: r.dur, ti: r.ti, cardOn: r.cardOn, dz: r.dz, fin: r.fin } : null,
      total: this.records.length ? this.records[this.records.length - 1].c1 : 0,
      q: r ? this.questions[r.i] ?? null : null,
      mode: this.mode,
      daily: this.daily ? { status: this.daily.status, number: this.daily.number, streak: this.daily.streak, total: this.daily.total ?? null, standings: this.daily.standings ?? null } : null,
      dailyFailed: this.dailyFailed,
      title: this.phase === 'title' ? this.titleView() : null,
      reportDaily: this.reportDaily ? { number: this.reportDaily.number, standings: this.reportDaily.standings ?? null } : null,
      message: this.message, titleError: this.titleError, reportAt: this.reportAt,
      versus: this.versusDebug(),
    }
  }
  /** what the multiplayer state looks like, for tests */
  versusDebug(): Record<string, unknown> {
    const v = this.versus
    return {
      own: this.ownReveal(), inMatch: this.inVersus, screen: v.screen, field: v.field, error: v.error, notice: v.notice, name: v.name, conn: v.conn,
      room: v.room ? { code: v.room.code, status: v.room.status, visibility: v.room.visibility, you: v.room.you, players: v.room.players.map((p) => ({ seat: p.seat, name: p.name, host: p.host, connected: p.connected, gone: p.gone })) } : null,
      round: v.round ? { index: v.round.index, phase: v.round.phase, answered: [...v.round.answered.values()], items: v.round.items ? [...v.round.items.values()] : null } : null,
      totals: [...v.totals], end: v.end ? v.end.standings.map((s) => ({ name: s.name, total: s.total, rank: s.rank, rounds: s.items.length })) : null,
      items: this.phase === 'lobby' ? lobbyItems(v).map((i) => ({ action: i.action, arg: i.arg ?? null, label: i.label, enabled: i.enabled, box: i.box })) : [],
    }
  }
  /** type text and submit as if typed */
  debugAnswer(text: string): void {
    if (!this.canType()) return
    this.typed = text
    this.input.value = text
    this.submit()
  }
  debugSkipCard(): boolean { return this.skipActiveCard() }
  /** advance the clock in small steps without drawing, then draw once */
  debugAdvance(sec: number, draw = true): void {
    const step = 1 / 30
    let left = sec
    while (left > 1e-9) { const d = Math.min(step, left); this.update(d); left -= d }
    if (draw) this.render()
  }
}

/** inside the box, with room to spare on every side (fingers are bigger than buttons) */
function near(b: PlayBox, p: { x: number; y: number }, padX: number, padY: number): boolean {
  return p.x >= b.x - padX && p.x <= b.x + b.w + padX && p.y >= b.y - padY && p.y <= b.y + b.h + padY
}

function hit(b: PlayBox, p: { x: number; y: number }): boolean {
  return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h
}

/** draw src at an integer offset and fill the uncovered edge by repeating the edge pixels (the design tool's crisp shift) */
function shiftBlit(o: Ctx, src: HTMLCanvasElement, dx: number, dy: number): void {
  o.drawImage(src, dx, dy)
  if (dx > 0) o.drawImage(src, 0, 0, 1, H, 0, dy, dx, H)
  else if (dx < 0) o.drawImage(src, W - 1, 0, 1, H, W + dx, dy, -dx, H)
  if (dy > 0) o.drawImage(src, 0, 0, W, 1, dx, 0, W, dy)
  else if (dy < 0) o.drawImage(src, 0, H - 1, W, 1, dx, H + dy, W, -dy)
  // corners
  const cx0 = dx > 0 ? 0 : W + dx, cx1 = dx > 0 ? dx : W
  const cy0 = dy > 0 ? 0 : H + dy, cy1 = dy > 0 ? dy : H
  if (dx !== 0 && dy !== 0) {
    const sx = dx > 0 ? 0 : W - 1, sy = dy > 0 ? 0 : H - 1
    o.drawImage(src, sx, sy, 1, 1, cx0, cy0, Math.abs(cx1 - cx0), Math.abs(cy1 - cy0))
  }
}
