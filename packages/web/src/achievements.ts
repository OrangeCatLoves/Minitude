/**
 * Achievements in the browser (forty-one since 22 Nov 2026): what the player has earned (kept on this device only, like the gem cabinet: there are no accounts), the slim
 * banner that drops in from the top when one is earned, and the list shown in the gem cabinet's second tab. The rules are in core
 * (packages/core/src/achievements.ts); the pictures are in achicons.ts.
 *
 * The banner is one line of text, one glow pulse and one short sound, like every other hint in the game. It waits until the answer's own
 * show is over (the card, or for a gem the whole pull), sits just under the seven progress squares, never covers the answer box, and two
 * at once wait in a queue. With "reduce motion" on the device it fades in place instead of sliding.
 */
import {
  ACH_GROUPS, achievementsView, awardAnswer, awardEvent, awardRun, backfillFacts, backfillFromCabinet, emptyAch, GEM_TIER, longestStreak, parseAch, parseLogbook,
  serializeAch, TIERS, type AchFacts, type AchState, type Achievement, type AchItem, type AnswerMoment, type AwardResult, type RunEnd,
} from '@minitude/core'
import { achievementColours, achievementTile } from './achicons'
import type { CabinetUi } from './cabinet'
import { W } from './config'

const KEY = 'minitude.achievements'
/** the logbook under the report (afterword.ts writes it): runs played and the days a run was finished */
const LOGBOOK_KEY = 'minitude.logbook'
/** how long a banner stays up, and how long the slide out takes (milliseconds) */
const STAY_MS = 3600
const OUT_MS = 380
/** where the banner sits on the 1280 x 720 game: just below the progress squares */
const TOP = 44

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  if (className) e.className = className
  if (text !== undefined) e.textContent = text
  return e
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
/** 2026-11-19 -> "19 Nov 2026" ('' for anything else) */
export function fmtDay(day: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] ?? ''} ${m[1]}`.replace('  ', ' ').trim() : ''
}

interface Pending { a: Achievement; at: number }

export class AchievementsUi {
  private state: AchState
  /** the state when the browser will not keep it: lasts until the page closes */
  private memory: AchState | null = null
  private queue: Pending[] = []
  private banner: HTMLElement | null = null
  private showing = false
  private timers: number[] = []
  /** plays the short chime (set by main.ts); true for a gem achievement */
  onChime: ((gem: boolean) => void) | null = null
  /** the gem cabinet, for its categories (set by main.ts) */
  cabinet: CabinetUi | null = null

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.state = this.load()
    addEventListener('resize', () => this.layout())
  }

  // ------------------------------------------------------------------ what is earned
  get earned(): number { return Object.keys(this.state.earned).length }
  isEarned(id: string): boolean { return Object.prototype.hasOwnProperty.call(this.state.earned, id) }

  private load(): AchState {
    try { return parseAch(localStorage.getItem(KEY)) } catch { return this.memory ?? emptyAch() }
  }
  private save(): void {
    try { localStorage.setItem(KEY, serializeAch(this.state)); this.memory = null } catch { this.memory = this.state }
  }

  /** what the logbook and the cabinet hold now, as numbers */
  private facts(): { facts: AchFacts; days: string[] } {
    let runs = 0, days: string[] = []
    try { const log = parseLogbook(localStorage.getItem(LOGBOOK_KEY)); runs = log.played; days = log.days } catch { /* no logbook on this device */ }
    const c = this.cabinet
    return { facts: { gemsFound: c?.count ?? 0, gemTotal: c?.knownTotal ?? null, runs, streak: longestStreak(days), shelves: c?.shelves ?? null }, days }
  }
  private take(r: AwardResult, at: number): void {
    if (!r.fresh.length && r.state === this.state) return
    this.state = r.state
    this.save()
    for (const a of r.fresh) this.queue.push({ a, at })
  }
  private static today(): string { return new Date().toISOString().slice(0, 10) }

  /**
   * An answer was scored at `tier` (a solo run, the Daily and multiplayer all come through here). `found` and `total` are the cabinet's gem count now
   * and how many gems there are (null when the server has not said yet). `at` is the game time from which the banner may show. `moment` is how the
   * answer was given (time left and used, a "Did you mean…?" said yes to).
   */
  onScored(tier: number, found: number, total: number | null, at: number, moment: AnswerMoment = {}): void {
    this.take(awardAnswer(this.state, tier, found, total, AchievementsUi.today(), moment, this.cabinet?.shelves ?? null), at)
  }

  /** a run has ended and its report is opening (the logbook already holds it): the dive, how it went, the Daily, multiplayer, runs and days in a row */
  onRunEnd(run: RunEnd, at: number): void {
    this.take(awardRun(this.state, run, this.facts().facts, AchievementsUi.today()), at)
  }

  /** the player opened the screen of everything that counted */
  onOpenBook(at: number): void {
    this.take(awardEvent(this.state, 'open-book', AchievementsUi.today()), at)
  }

  /** the cabinet is known: record, quietly, what it and the logbook already prove (gem steps, runs played, days in a row, categories) */
  sync(gemDays: readonly string[], knownTotal: number | null): void {
    const { facts, days } = this.facts()
    const next = backfillFacts(backfillFromCabinet(this.state, gemDays, knownTotal), facts, days)
    if (Object.keys(next.earned).length !== this.earned) { this.state = next; this.save() }
  }

  // ------------------------------------------------------------------ the banner
  private ensureBanner(): HTMLElement {
    if (this.banner) return this.banner
    const b = el('div')
    b.id = 'ach-banner'
    b.hidden = true
    b.setAttribute('role', 'status')
    b.setAttribute('aria-live', 'polite')
    document.body.append(b)
    this.banner = b
    return b
  }
  /** put the banner where the game's top centre is on the page (the game is scaled to fit the window) */
  private layout(): void {
    const b = this.banner
    if (!b) return
    const r = this.canvas.getBoundingClientRect()
    const s = Math.max(0.62, r.width / W)
    b.style.setProperty('--s', String(s))
    b.style.left = `${r.left + r.width / 2}px`
    b.style.top = `${r.top + TOP * (r.width / W)}px`
  }

  /** called every frame with the game clock: starts the next banner when its time has come and there is room for it */
  tick(T: number, canShow: boolean): void {
    if (this.showing || !canShow || !this.queue.length || this.queue[0].at > T) return
    this.show(this.queue.shift()!.a)
  }

  private show(a: Achievement): void {
    const b = this.ensureBanner()
    this.showing = true
    const c = achievementColours(a.tier)
    b.style.setProperty('--edge', c.edge)
    b.style.setProperty('--glow', `${c.edge}8c`)
    b.style.setProperty('--bg', c.bg)
    const ic = achievementTile(a, false)
    ic.className = 'ach-ic'
    ic.setAttribute('aria-hidden', 'true')
    const tx = el('div', 'ach-tx')
    const label = ACH_GROUPS.find((g) => g.id === a.group)?.label || TIERS[a.tier]?.name || ''
    tx.append(el('div', 'ach-lab', `ACHIEVEMENT · ${label}`), el('div', 'ach-nm', a.name), el('div', 'ach-sub', a.text))
    const chip = el('div', 'ach-chip', a.goal === 'all' ? 'ALL' : `×${a.goal ?? 1}`)
    b.replaceChildren(ic, tx, chip)
    b.setAttribute('aria-label', `Achievement earned: ${a.name}. ${a.text}`)
    this.layout()
    b.hidden = false
    b.classList.remove('out')
    void b.offsetWidth                                         // restart the slide
    b.classList.add('in')
    this.onChime?.(a.tier === GEM_TIER)
    this.later(STAY_MS, () => {
      b.classList.remove('in')
      b.classList.add('out')
      this.later(OUT_MS, () => { b.hidden = true; b.classList.remove('out'); this.showing = false })
    })
  }
  private later(ms: number, fn: () => void): void { this.timers.push(window.setTimeout(fn, ms)) }

  // ------------------------------------------------------------------ the cabinet's second tab
  /** `found` is the number of different gems in the cabinet; `total` how many gems there are as far as the server said (null = not known) */
  renderTab(into: HTMLElement, found: number, total: number | null): void {
    const view = achievementsView(this.state, found, total, this.facts().facts)
    const sum = el('div', 'ach-sum')
    sum.append(el('span', '', `${view.earned} of ${view.total} earned. They are kept on this device, like the gems.`))
    const bar = el('div', 'ach-bigbar'), fill = el('i')
    fill.style.width = `${Math.round((100 * view.earned) / view.total)}%`
    bar.append(fill)
    sum.append(bar)
    into.append(sum)
    for (const g of view.groups) {
      const h = el('h3', 'ach-grp')
      h.append(el('span', '', g.title), el('span', 'ach-grp-n', `${g.earned} / ${g.items.length}`))
      into.append(h)
      const list = el('div', 'ach-list')
      for (const it of g.items) list.append(this.item(it))
      into.append(list)
    }
  }
  private item(it: AchItem): HTMLElement {
    const { a } = it
    const row = el('div', 'ach-item' + (it.earned ? '' : ' locked') + (a.id === 'gems-all' ? ' grand' : ''))
    row.setAttribute('aria-label', `${a.name}: ${a.text} ${it.earned ? 'Earned.' : 'Not yet.'}`)
    const ic = achievementTile(a, !it.earned)
    ic.className = 'ach-ic'
    ic.setAttribute('aria-hidden', 'true')
    const tx = el('div', 'ach-tx')
    tx.append(el('div', 'ach-name', a.name), el('div', 'ach-text', a.text))
    if (it.earned) tx.append(el('div', 'ach-date', it.day ? `Earned ${fmtDay(it.day)}` : 'Earned'))
    else if (it.progress) {
      const p = el('div', 'ach-prog'), f = el('i')
      f.style.width = `${Math.min(100, Math.round((100 * it.progress.have) / it.progress.goal))}%`
      p.append(f)
      tx.append(p, el('div', 'ach-date', `${it.progress.have} / ${it.progress.goal} ${it.progress.unit}`))
    } else tx.append(el('div', 'ach-date', 'Not yet'))
    row.append(ic, tx)
    return row
  }
}
