/**
 * The gem cabinet: every gem the player has found, kept in this browser only (there are no accounts). It opens from a small button on
 * the title screen and the end-of-run report. It is ordinary HTML over the game, like the page under the report.
 *
 * What is stored for a found gem is what the player was shown when they found it (category, question, answer, one line about it), so the
 * cabinet can be shown without asking the server anything. Gems that are not found yet are only counted: the questions are not sent to the
 * browser before they are asked, so a hidden slot shows nothing but its category and a question mark.
 */
import { ACHIEVEMENTS, addGem, cabinetView, emptyCabinet, parseCabinet, serializeCabinet, type Cabinet, type GemEntry, type GemSummary, type Shelf } from '@minitude/core'
import { getGemSummary } from './api'
import type { AchievementsUi } from './achievements'

const KEY = 'minitude.gems'

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  if (className) e.className = className
  if (text !== undefined) e.textContent = text
  return e
}

export class CabinetUi {
  private cab: Cabinet
  /** the cabinet when the browser will not keep it: lasts until the page closes */
  private memory: Cabinet | null = null
  private summary: GemSummary | null = null
  private summaryAt = 0
  private opener: HTMLElement | null = null
  private picked: string | null = null
  private shown = false
  private tab: 'gems' | 'ach' = 'gems'
  /** the achievements: the cabinet's second tab (set by main.ts) */
  achievements: AchievementsUi | null = null

  constructor(private readonly root: HTMLElement, private readonly button: HTMLButtonElement, private readonly icon: HTMLCanvasElement | HTMLImageElement) {
    this.cab = this.load()
    this.button.addEventListener('click', (e) => { e.stopPropagation(); this.open() })
    this.root.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.close() } })
    this.root.addEventListener('click', (e) => { if (e.target === this.root) this.close() })
    this.paintButton()
    void this.refreshSummary()
  }

  // ------------------------------------------------------------------ what the cabinet holds
  get count(): number { return this.cab.gems.length }
  /** how many gems there are in all, as far as the browser knows (never less than it holds) */
  get total(): number { return Math.max(this.summary?.total ?? 0, this.cab.gems.length) }
  get isOpen(): boolean { return !this.root.hidden }
  /** how many gems there are in all IF THE SERVER SAID SO (null until then: "every gem" must never be judged against a guess) */
  get knownTotal(): number | null { return this.summary && this.summary.total > 0 ? this.summary.total : null }
  /** the days the gems were found, in the order they were found */
  get gemDays(): string[] { return this.cab.gems.map((g) => g.day) }
  /** the categories of the gems found (each is an answer that scored in that category: Explorer counts them) */
  get gemCategories(): string[] { return [...new Set(this.cab.gems.map((g) => g.category))] }
  /**
   * The cabinet by category, for Well Rounded and Full Shelf: only the categories the SERVER listed, with its counts (null until it has said).
   * A found gem of a category the server no longer lists counts for nothing here, so it can never complete a shelf by itself.
   */
  get shelves(): Shelf[] | null {
    const cats = this.summary?.categories
    if (!cats || !cats.length) return null
    return cats.map((c) => ({ name: c.name, total: c.total, have: Math.min(c.total, this.cab.gems.filter((g) => g.category === c.name).length) }))
  }

  /** a gem was found. Returns whether it is new and the counts after it. */
  add(entry: GemEntry): { isNew: boolean; found: number; total: number } {
    const r = addGem(this.cab, entry)
    if (r.isNew) { this.cab = r.cabinet; this.save() }
    this.paintButton()
    if (this.isOpen) this.render()
    return { isNew: r.isNew, found: this.cab.gems.length, total: this.total }
  }

  private load(): Cabinet {
    try { return parseCabinet(localStorage.getItem(KEY)) } catch { return this.memory ?? emptyCabinet() }
  }
  private save(): void {
    try { localStorage.setItem(KEY, serializeCabinet(this.cab)); this.memory = null } catch { this.memory = this.cab }
  }

  /** the counts per category come from the server (counts only: no questions, no answers). Asked again when the cabinet is opened after a while. */
  async refreshSummary(): Promise<void> {
    if (Date.now() - this.summaryAt < 60_000 && this.summary) return
    this.summaryAt = Date.now()
    try {
      const s = await getGemSummary()
      if (s && typeof s.total === 'number' && Array.isArray(s.categories)) { this.summary = s; this.paintButton(); this.achievements?.sync(this.gemDays, this.knownTotal); if (this.isOpen) this.render() }
    } catch { /* the cabinet still shows what is in it */ }
  }

  // ------------------------------------------------------------------ the button (title screen and report only)
  setButtonVisible(on: boolean): void {
    if (on === this.shown) return
    this.shown = on
    this.button.hidden = !on
  }
  private paintButton(): void {
    this.button.textContent = `GEM CABINET  ${this.count} / ${this.total || '?'}`
    this.button.setAttribute('aria-label', `Open your gem cabinet: ${this.count} gems found`)
  }

  // ------------------------------------------------------------------ the screen
  open(): void {
    this.opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    this.picked = null
    this.tab = 'gems'
    this.root.hidden = false
    this.render()
    void this.refreshSummary()
    this.root.querySelector<HTMLElement>('.cab-close')?.focus()
  }
  close(): void {
    this.root.hidden = true
    this.root.replaceChildren()
    this.opener?.blur()
    this.opener = null
  }

  /**
   * The gem picture, found or not, as a plain image. Both pictures are drawn ONCE and shared by every slot: a canvas per slot (up to a
   * thousand) and a CSS filter on every hidden one were too much to redraw while the list was flung, and for a frame the game behind showed
   * through (the owner, 23 Nov 2026). The hidden look (dark and greyed) is baked into the pixels instead of a filter.
   */
  private gemPics: { found: string; hidden: string } | null = null
  private gemImg(hidden: boolean): HTMLImageElement {
    if (!this.gemPics) this.gemPics = gemPictures(this.icon)
    const img = el('img', 'cab-gem')
    img.src = hidden ? this.gemPics.hidden : this.gemPics.found
    img.alt = ''
    img.width = img.height = 32
    img.decoding = 'sync'
    img.setAttribute('aria-hidden', 'true')
    return img
  }

  private render(): void {
    const view = cabinetView(this.cab, this.summary)
    const box = el('div', 'cab-box')
    const head = el('header', 'cab-head')
    head.append(el('h2', 'cab-title', 'GEM CABINET'), el('span', 'cab-count', `${view.found} / ${view.total || '?'}`))
    const close = el('button', 'cab-close', 'CLOSE')
    close.type = 'button'
    close.addEventListener('click', () => this.close())
    head.append(close)
    box.append(head)
    box.append(this.tabs(view.found, view.total))
    if (this.tab === 'ach' && this.achievements) {
      this.achievements.renderTab(box, view.found, this.knownTotal)
      this.finish(box)
      return
    }
    box.append(el('p', 'cab-intro', 'Every question hides one gem: a very rare answer worth 120 points. Find one and it is kept here, on this device only.'))

    const picked = this.cab.gems.find((g) => g.id === this.picked)
    if (picked) box.append(this.card(picked))

    if (!view.categories.length) box.append(el('p', 'cab-empty', 'No gems found yet. Answer something nobody thinks of.'))
    for (const cat of view.categories) {
      const sec = el('section', 'cab-cat')
      const h = el('h3', 'cab-cat-h')
      h.append(document.createTextNode(cat.name), el('span', 'cab-cat-n', cat.found.length === cat.total && cat.total > 0 ? 'COMPLETE' : `${cat.found.length} / ${cat.total}`))
      sec.append(h)
      const grid = el('div', 'cab-grid')
      for (const g of cat.found) {
        const b = el('button', 'cab-slot' + (g.id === this.picked ? ' on' : ''))
        b.type = 'button'
        b.setAttribute('aria-label', `${g.answer}, gem found. Show details.`)
        b.append(this.gemImg(false), el('span', 'cab-name', g.answer))
        b.addEventListener('click', () => { this.picked = g.id === this.picked ? null : g.id; this.render(); this.root.querySelector<HTMLElement>('.cab-slot.on, .cab-close')?.focus() })
        grid.append(b)
      }
      for (let k = 0; k < cat.locked; k++) {
        const s = el('div', 'cab-slot locked')
        s.setAttribute('aria-label', 'A gem not found yet')
        s.append(this.gemImg(true), el('span', 'cab-name', '?'))
        grid.append(s)
      }
      sec.append(grid)
      box.append(sec)
    }
    this.finish(box)
  }
  private finish(box: HTMLElement): void {
    this.root.replaceChildren(box)
    this.root.setAttribute('role', 'dialog')
    this.root.setAttribute('aria-modal', 'true')
    this.root.setAttribute('aria-label', 'Gem cabinet')
  }
  /** GEMS | ACHIEVEMENTS */
  private tabs(found: number, total: number): HTMLElement {
    const row = el('div', 'cab-tabs')
    row.setAttribute('role', 'tablist')
    const make = (id: 'gems' | 'ach', label: string, n: string) => {
      const b = el('button', 'cab-tab')
      b.type = 'button'
      b.setAttribute('role', 'tab')
      b.setAttribute('aria-selected', String(this.tab === id))
      b.append(document.createTextNode(label), el('span', 'n', n))
      b.addEventListener('click', () => { if (this.tab === id) return; this.tab = id; this.picked = null; this.render(); this.root.querySelector<HTMLElement>('.cab-tab[aria-selected="true"]')?.focus() })
      return b
    }
    row.append(make('gems', 'GEMS', `${found} / ${total || '?'}`))
    if (this.achievements) row.append(make('ach', 'ACHIEVEMENTS', `${this.achievements.earned} / ${ACHIEVEMENTS.length}`))
    return row
  }

  private card(g: GemEntry): HTMLElement {
    const c = el('div', 'cab-card')
    const big = this.gemImg(false)
    big.className = 'cab-big'
    c.append(big)
    const t = el('div', 'cab-card-t')
    t.append(el('div', 'cab-card-cat', g.category.toUpperCase()), el('div', 'cab-card-name', g.answer))
    if (g.desc) t.append(el('p', 'cab-card-desc', g.desc))
    t.append(el('p', 'cab-card-q', g.prompt))
    if (g.day) t.append(el('p', 'cab-card-day', `Found ${g.day}`))
    c.append(t)
    return c
  }
}

/** the gem picture at 32 x 32, and the same darkened and greyed for a gem not found yet (as the old CSS filter did: brightness 0.16, saturation 0.25, opacity 0.85) */
export function gemPictures(icon: CanvasImageSource): { found: string; hidden: string } {
  const c = document.createElement('canvas')
  c.width = c.height = 32
  const g = c.getContext('2d', { willReadFrequently: true })
  if (!g) return { found: '', hidden: '' }
  g.imageSmoothingEnabled = false
  g.drawImage(icon, 0, 0, 32, 32)
  const found = c.toDataURL('image/png')
  const im = g.getImageData(0, 0, 32, 32), d = im.data
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], gr = d[i + 1], b = d[i + 2], l = 0.2126 * r + 0.7152 * gr + 0.0722 * b
    d[i] = Math.round((l + 0.25 * (r - l)) * 0.16)
    d[i + 1] = Math.round((l + 0.25 * (gr - l)) * 0.16)
    d[i + 2] = Math.round((l + 0.25 * (b - l)) * 0.16)
    d[i + 3] = Math.round(d[i + 3] * 0.85)
  }
  g.putImageData(im, 0, 0)
  return { found, hidden: c.toDataURL('image/png') }
}

