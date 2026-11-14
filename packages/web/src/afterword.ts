/**
 * The page that opens under the end-of-run report (scroll down to find it): the player's logbook, "how was that dive?",
 * "got an idea for a question?", and the footer. It is ordinary HTML over the game, which is drawn on a canvas, so it can
 * be read, tabbed through and selected like any other page.
 */
import { emptyLogbook, logbookStats, parseLogbook, rankText, recordRun, serializeLogbook, utcDay, type Logbook, type RankText } from '@minitude/core'
import { ApiError, getRank, sendIdea, sendRating } from './api'
import { buildFooter } from './site'

const LOGBOOK_KEY = 'minitude.logbook'
const IDEA_MIN = 5

/** what the game tells this page when a run has ended */
export interface RunSummary {
  mode: 'solo' | 'daily' | 'versus'
  /** the server's id of a solo or daily run; a multiplayer match has none */
  runId: string | null
  points: number
  /** false when the report is only being looked at again (today's result opened from the title): it is not a new run */
  fresh: boolean
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  if (className) e.className = className
  if (text !== undefined) e.textContent = text
  return e
}

/** server messages start with a capital; this section is written in lower case */
const soft = (m: string): string => (m ? m.charAt(0).toLowerCase() + m.slice(1) : m)

export class Afterword {
  private log: Logbook = emptyLogbook()
  /** the log when the browser will not keep it: lasts until the page closes */
  private fallback: Logbook | null = null
  private info: RunSummary | null = null

  private readonly logCard = el('section', 'af-card')
  private readonly stats = el('dl', 'af-stats')
  private readonly rateCard = el('section', 'af-card')
  private readonly rateBtns: HTMLButtonElement[] = []
  private readonly rateNote = el('p', 'af-note')
  private readonly ideaForm = el('form', 'af-form')
  private readonly ideaInput = el('input', 'af-input')
  private readonly ideaTrap = el('input', 'af-hp')
  private readonly ideaBtn = el('button', 'af-btn', 'submit')
  private readonly ideaNote = el('p', 'af-note')
  private rateSeq = 0
  /** where this run's score ranks among everyone's (null until the server has answered, or when it could not) */
  private rank: RankText | null = null
  private rankSeq = 0

  constructor(private readonly root: HTMLElement) {
    this.log = this.load()
    this.build()
  }

  /** the page is on screen (and the game behind it may be scrolled away) */
  get open(): boolean { return !this.root.hidden }

  // ------------------------------------------------------------------ the logbook, kept in this browser only
  private load(): Logbook {
    try { return parseLogbook(localStorage.getItem(LOGBOOK_KEY)) } catch { return this.fallback ?? emptyLogbook() }
  }
  private save(): void {
    try { localStorage.setItem(LOGBOOK_KEY, serializeLogbook(this.log)) } catch { this.fallback = this.log }
  }

  // ------------------------------------------------------------------ building the page
  private build(): void {
    const wrap = el('div', 'af-wrap')

    // logbook
    this.logCard.setAttribute('aria-labelledby', 'af-log-h')
    const lh = el('h2', 'af-h', 'logbook')
    lh.id = 'af-log-h'
    this.logCard.append(lh, this.stats)

    // how was that dive?
    this.rateCard.setAttribute('aria-labelledby', 'af-rate-h')
    const rh = el('h2', 'af-h', 'how was that dive?')
    rh.id = 'af-rate-h'
    const rs = el('p', 'af-sub', '1 = meh · 5 = great')
    const group = el('div', 'af-rating')
    group.setAttribute('role', 'group')
    group.setAttribute('aria-label', 'Rate this dive from 1 to 5')
    for (let n = 1; n <= 5; n++) {
      const b = el('button', 'af-rate-btn', String(n))
      b.type = 'button'
      b.setAttribute('aria-pressed', 'false')
      b.addEventListener('click', () => void this.rate(n))
      this.rateBtns.push(b)
      group.append(b)
    }
    this.rateNote.setAttribute('role', 'status')
    this.rateCard.append(rh, rs, group, this.rateNote)

    // got an idea for a question?
    const ideaCard = el('section', 'af-card')
    ideaCard.setAttribute('aria-labelledby', 'af-idea-h')
    const ih = el('h2', 'af-h', 'got an idea for a question?')
    ih.id = 'af-idea-h'
    const is = el('p', 'af-sub', 'tell us what to ask')
    this.ideaForm.noValidate = true
    this.ideaInput.type = 'text'
    this.ideaInput.id = 'af-idea-text'
    this.ideaInput.name = 'idea'
    this.ideaInput.maxLength = 140
    this.ideaInput.placeholder = 'name a type of cloud…'
    this.ideaInput.autocomplete = 'off'
    this.ideaInput.enterKeyHint = 'send'
    this.ideaInput.setAttribute('aria-label', 'Your idea for a question')
    // a field no person can see or reach: only a program that fills in every field will put anything in it
    this.ideaTrap.type = 'text'
    this.ideaTrap.name = 'website'
    this.ideaTrap.tabIndex = -1
    this.ideaTrap.autocomplete = 'off'
    this.ideaTrap.setAttribute('aria-hidden', 'true')
    this.ideaBtn.type = 'submit'
    this.ideaNote.setAttribute('role', 'status')
    this.ideaForm.append(this.ideaInput, this.ideaTrap, this.ideaBtn)
    this.ideaForm.addEventListener('submit', (e) => { e.preventDefault(); void this.sendIdeaNow() })
    ideaCard.append(ih, is, this.ideaForm, this.ideaNote)

    wrap.append(this.logCard, this.rateCard, ideaCard, buildFooter(document))
    this.root.replaceChildren(wrap)
    this.renderStats()
  }

  private renderStats(): void {
    const s = logbookStats(this.log, utcDay(Date.now()))
    const rows: [string, number, string?][] = [['streak', s.streak, 'days in a row'], ['played', s.played], ['avg', s.avg], ['best', s.best]]
    this.stats.replaceChildren(...rows.map(([label, value, hint]) => {
      const box = el('div', 'af-stat')
      const dt = el('dt', undefined, label)
      if (hint) dt.title = hint
      box.append(dt, el('dd', undefined, String(value)))
      return box
    }))
    // one more statistic: where this run's score ranks among everyone's (a row of its own: the number can be long)
    if (this.rank) {
      const box = el('div', 'af-stat af-rank')
      box.append(el('dt', undefined, 'rank'), el('dd', undefined, this.rank.main), el('dd', 'af-stat-sub', this.rank.sub))
      this.stats.append(box)
    }
    this.logCard.setAttribute('aria-label', `Logbook: streak ${s.streak}, played ${s.played}, average ${s.avg}, best ${s.best}${this.rank ? ', rank ' + this.rank.main + ' ' + this.rank.sub : ''}`)
  }

  // ------------------------------------------------------------------ the game tells us a run has ended
  /** A run has just ended. It goes into the logbook once, and the forms start fresh for it. Nothing is shown yet: see reveal(). */
  prepare(info: RunSummary): void {
    this.info = info
    if (info.fresh) {
      this.log = recordRun(this.load(), info.points, utcDay(Date.now()))
      this.save()
    } else {
      this.log = this.load()
    }
    this.rank = null
    this.rankSeq++
    this.renderStats()
    void this.loadRank(info)
    // a rating belongs to a run: only a run that just ended (solo or daily, with its id) or a multiplayer match can be rated
    const canRate = info.mode === 'versus' ? info.fresh : info.runId !== null
    this.rateCard.hidden = !canRate
    this.rateSeq++
    this.rateBtns.forEach((b) => { b.setAttribute('aria-pressed', 'false'); b.disabled = false })
    this.rateNote.textContent = ''
    this.rateNote.className = 'af-note'
    this.ideaNote.textContent = ''
    this.ideaNote.className = 'af-note'
    this.ideaBtn.disabled = false
  }

  /** asks the server where the score ranks; if it cannot say, the statistic is simply not shown */
  private async loadRank(info: RunSummary): Promise<void> {
    const mine = this.rankSeq
    try {
      const r = await getRank(info.points, info.mode !== 'versus')
      if (mine !== this.rankSeq) return
      this.rank = rankText(r.rank, r.total)
      this.renderStats()
    } catch { /* no statistic this time */ }
  }

  /** the report has settled: let the page scroll, with this sheet below the game */
  reveal(): void {
    this.root.hidden = false
    document.documentElement.classList.add('has-after')
  }

  /** the player left the report: back to the game alone, scrolled to the top */
  hide(): void {
    if (this.root.hidden) return
    this.root.hidden = true
    document.documentElement.classList.remove('has-after')
    const a = document.activeElement
    if (a instanceof HTMLElement && this.root.contains(a)) a.blur()
    window.scrollTo(0, 0)
  }

  // ------------------------------------------------------------------ the two forms
  private async rate(n: number): Promise<void> {
    const info = this.info
    if (!info) return
    const mine = this.rateSeq
    const was = this.rateBtns.findIndex((b) => b.getAttribute('aria-pressed') === 'true') + 1
    this.rateBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(i + 1 === n)))
    this.rateBtns.forEach((b) => (b.disabled = true))
    this.say(this.rateNote, 'sending…', '')
    try {
      await sendRating(n, info.runId)
      if (mine === this.rateSeq) this.say(this.rateNote, 'thanks!', 'ok')
    } catch (e) {
      if (mine !== this.rateSeq) return
      this.rateBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(i + 1 === was)))
      this.say(this.rateNote, e instanceof ApiError && e.status < 500 && e.message ? soft(e.message) : "couldn't send that. try again in a moment.", 'err')
    } finally {
      if (mine === this.rateSeq) this.rateBtns.forEach((b) => (b.disabled = false))
    }
  }

  private async sendIdeaNow(): Promise<void> {
    const text = this.ideaInput.value.replace(/\s+/g, ' ').trim()
    if ([...text].length < IDEA_MIN) { this.say(this.ideaNote, 'tell us a little more: what should the question ask?', 'err'); this.ideaInput.focus(); return }
    this.ideaBtn.disabled = true
    this.say(this.ideaNote, 'sending…', '')
    try {
      await sendIdea(text, this.ideaTrap.value)
      this.ideaInput.value = ''
      this.say(this.ideaNote, "thanks! we'll take a look.", 'ok')
    } catch (e) {
      this.say(this.ideaNote, e instanceof ApiError && e.status < 500 && e.message ? soft(e.message) : "couldn't send that. try again in a moment.", 'err')
    } finally {
      this.ideaBtn.disabled = false
    }
  }

  private say(p: HTMLElement, text: string, kind: 'ok' | 'err' | ''): void {
    p.textContent = text
    p.className = 'af-note' + (kind ? ' ' + kind : '')
  }
}
