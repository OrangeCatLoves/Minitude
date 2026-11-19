/**
 * "Everything that counted": opened from a row of the Daily's end-of-run report. It shows how many answers each rarity holds for that
 * question, the names (a rarity at a time, A to Z, 100 more on request), a search across all of them, and the question's gem.
 *
 * It is ordinary HTML over the game, like the gem cabinet. The server only answers a player who has finished that Daily (see
 * `/api/daily/answers` in packages/server/src/app.ts), so nothing here is available before the end.
 */
import { GEM_TIER, TIERS, type AnswerListItem, type AnswersSummary } from '@minitude/core'
import { ApiError, getAnswerList, getAnswers, type AnswersSource } from './api'

const PAGE = 100

/** what the player did on the question, for the line at the top */
export interface OwnAnswer {
  /** null = the time ran out */
  answer: string | null
  tier: number
  points: number
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  if (className) e.className = className
  if (text !== undefined) e.textContent = text
  return e
}
const num = (n: number): string => n.toLocaleString('en-US')
const rgbOf = (tier: number): string => { const c = TIERS[tier].edge; return `rgb(${c[0]},${c[1]},${c[2]})` }
const title = (s: string): string => s.charAt(0) + s.slice(1).toLowerCase()
const sameName = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase()
const emptyGroup = (): Group => ({ items: [], total: 0, loading: false, failed: false })

/** a list that is read a page at a time */
interface Group {
  items: AnswerListItem[]
  total: number
  loading: boolean
  failed: boolean
}

export class AnswersUi {
  private src: AnswersSource = { kind: 'daily', day: '' }
  private index = 0
  private own: OwnAnswer | null = null
  private summary: AnswersSummary | null = null
  private error = ''
  private readonly expanded = new Set<number>()
  private readonly groups = new Map<number, Group>()
  private search = ''
  private found: Group | null = null
  private foundText = ''
  /** bumped whenever the screen is opened or closed, so a late reply for an old screen is ignored */
  private seq = 0
  private searchTimer: ReturnType<typeof setTimeout> | null = null
  /** the part of the screen that changes (the rest, with the search box, is built once when the summary arrives) */
  private results: HTMLElement | null = null

  constructor(private readonly root: HTMLElement) {
    // Esc closes the screen wherever the keyboard focus is: the screen is rebuilt when its numbers arrive, which drops the focus from the close button
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !this.root.hidden) { e.preventDefault(); e.stopPropagation(); this.close() } }, true)
    this.root.addEventListener('click', (e) => { if (e.target === this.root) this.close() })
  }

  get isOpen(): boolean { return !this.root.hidden }

  /** open the screen for question `index` (0 to 6) of a finished Daily, solo run or multiplayer match */
  open(src: AnswersSource, index: number, own: OwnAnswer | null): void {
    this.seq++
    this.src = src
    this.index = index
    this.own = own
    this.summary = null
    this.error = ''
    this.expanded.clear()
    this.groups.clear()
    this.search = ''
    this.found = null
    this.foundText = ''
    this.root.hidden = false
    this.build()
    this.root.querySelector<HTMLElement>('.ans-close')?.focus()
    void this.loadSummary()
  }
  close(): void {
    this.seq++
    if (this.searchTimer) { clearTimeout(this.searchTimer); this.searchTimer = null }
    this.root.hidden = true
    this.root.replaceChildren()
    this.results = null
  }

  // ------------------------------------------------------------------ talking to the server
  private async loadSummary(): Promise<void> {
    const my = this.seq
    try {
      const s = await getAnswers(this.src, this.index)
      if (my !== this.seq) return
      this.summary = s
      this.error = ''
      // the gem is the one reveal: its row is open from the start
      if (s.gem) { this.expanded.add(GEM_TIER); this.groups.set(GEM_TIER, { items: [{ name: s.gem.name, tier: GEM_TIER }], total: 1, loading: false, failed: false }) }
    } catch (e) {
      if (my !== this.seq) return
      this.error = e instanceof ApiError && (e.code === 'not_finished' || e.code === 'not_over') ? 'Not available until the game is over.' : "Couldn't load this. Check your connection and try again."
    }
    this.build()
  }
  private async loadMore(tier: number): Promise<void> {
    const my = this.seq
    const g = this.groups.get(tier) ?? emptyGroup()
    if (g.loading) return
    g.loading = true; g.failed = false
    this.groups.set(tier, g)
    this.paint()
    try {
      const page = await getAnswerList(this.src, this.index, { tier, offset: g.items.length, limit: PAGE })
      if (my !== this.seq) return
      g.items = g.items.concat(page.items)
      g.total = page.total
    } catch {
      if (my !== this.seq) return
      g.failed = true
    }
    g.loading = false
    this.paint()
  }
  /** search all rarities for the text in the box (or, when asked again with the same text, read the next page of the matches) */
  private async runSearch(): Promise<void> {
    const my = this.seq
    const text = this.search
    if (text.length < 2) { this.found = null; this.paint(); return }
    const g = this.found && this.foundText === text ? this.found : emptyGroup()
    if (g.loading) return
    this.foundText = text
    g.loading = true; g.failed = false
    this.found = g
    this.paint()
    try {
      const page = await getAnswerList(this.src, this.index, { q: text, offset: g.items.length, limit: PAGE })
      if (my !== this.seq || text !== this.search) return
      g.items = g.items.concat(page.items)
      g.total = page.total
    } catch {
      if (my !== this.seq || text !== this.search) return
      g.failed = true
    }
    g.loading = false
    this.paint()
  }

  // ------------------------------------------------------------------ the screen
  /** the whole screen: header, the question, what the player did, the search box. The changing part goes into `results`. */
  private build(): void {
    const box = el('div', 'ans-box')
    const head = el('header', 'ans-head')
    head.append(el('h2', 'ans-title', 'EVERYTHING THAT COUNTED'))
    const close = el('button', 'ans-close', 'CLOSE')
    close.type = 'button'
    close.addEventListener('click', () => this.close())
    head.append(close)
    box.append(head)
    this.results = null

    const s = this.summary
    if (!s) {
      box.append(el('p', this.error ? 'ans-error' : 'ans-note', this.error || 'Loading...'))
      if (this.error) {
        const retry = el('button', 'ans-more', 'TRY AGAIN')
        retry.type = 'button'
        retry.addEventListener('click', () => { this.error = ''; this.build(); void this.loadSummary() })
        box.append(retry)
      }
      this.root.replaceChildren(box)
      return
    }

    box.append(el('p', 'ans-cat', s.question.category.toUpperCase()), el('h3', 'ans-q', s.question.prompt))
    const own = this.own
    const line = el('p', 'ans-own')
    if (own && own.answer) line.append(document.createTextNode('You answered '), el('b', undefined, own.answer), document.createTextNode(`: ${title(TIERS[own.tier].name)}, ${own.points} points.`))
    else line.textContent = 'The time ran out on this question.'
    box.append(line)
    box.append(el('p', 'ans-note', `${num(s.total)} answers were accepted for this question. Open a rarity to see every name in it.`))

    const label = el('label', 'ans-searchbox')
    label.append(el('span', 'ans-sr', 'Search every accepted answer'))
    const input = el('input', 'ans-search')
    input.type = 'search'
    input.placeholder = 'Search every accepted answer'
    input.autocomplete = 'off'
    input.value = this.search
    input.addEventListener('input', () => {
      this.search = input.value.trim()
      if (this.searchTimer) { clearTimeout(this.searchTimer); this.searchTimer = null }
      this.found = null
      this.foundText = ''
      this.paint()
      if (this.search.length >= 2) this.searchTimer = setTimeout(() => void this.runSearch(), 300)
    })
    label.append(input)
    box.append(label)

    this.results = el('div', 'ans-results')
    box.append(this.results)
    this.root.replaceChildren(box)
    this.paint()
  }

  /** redraw the changing part only (the search box keeps the keyboard and the scroll position stays) */
  private paint(): void {
    const out = this.results
    const s = this.summary
    if (!out || !s) return
    if (this.search.length >= 2) { out.replaceChildren(this.searchView()); return }
    const list = el('ul', 'ans-tiers')
    for (const t of s.tiers) list.append(this.tierRow(t.tier, t.count, s))
    out.replaceChildren(list)
  }

  private tierRow(tier: number, count: number, s: AnswersSummary): HTMLElement {
    const li = el('li', 'ans-tier')
    li.style.setProperty('--tc', rgbOf(tier))
    const open = this.expanded.has(tier)
    const b = el('button', 'ans-tier-h')
    b.type = 'button'
    b.disabled = count === 0
    b.setAttribute('aria-expanded', String(open))
    b.append(el('i', 'ans-dot'), el('span', 'ans-tier-n', title(TIERS[tier].name)), el('span', 'ans-tier-p', `${TIERS[tier].points} points`))
    if (this.own && this.own.answer && this.own.tier === tier) b.append(el('span', 'ans-yours', 'YOUR ANSWER'))
    b.append(el('span', 'ans-tier-c', num(count)), el('span', 'ans-caret', open ? '▲' : '▼'))
    b.addEventListener('click', () => {
      if (this.expanded.has(tier)) this.expanded.delete(tier)
      else { this.expanded.add(tier); if (!this.groups.has(tier)) void this.loadMore(tier) }
      this.paint()
    })
    li.append(b)
    if (open) li.append(this.listView(tier, s))
    return li
  }

  private listView(tier: number, s: AnswersSummary): HTMLElement {
    const wrap = el('div', 'ans-list-wrap')
    if (tier === GEM_TIER && s.gem) {
      wrap.append(el('p', 'ans-gem-name', s.gem.name))
      if (s.gem.description) wrap.append(el('p', 'ans-gem-line', s.gem.description))
      wrap.append(el('p', 'ans-gem-note', 'The one hidden gem of this question: worth 120 points, and it shrinks you ten thousand times.'))
      return wrap
    }
    const g = this.groups.get(tier)
    if (!g || (!g.items.length && g.loading)) { wrap.append(el('p', 'ans-note', 'Loading...')); return wrap }
    wrap.append(this.names(g.items, false))
    wrap.append(this.footer(g, () => void this.loadMore(tier)))
    return wrap
  }

  private searchView(): HTMLElement {
    const wrap = el('div', 'ans-found')
    const g = this.found
    if (!g || (!g.items.length && g.loading) || (!g.items.length && !g.failed && !g.total && this.searchTimer)) { wrap.append(el('p', 'ans-note', 'Searching...')); return wrap }
    if (g.failed && !g.items.length) { wrap.append(el('p', 'ans-error', "Couldn't search. Try again.")); return wrap }
    wrap.append(el('p', 'ans-note', g.total ? `${num(g.total)} accepted answer${g.total === 1 ? '' : 's'} contain “${this.search}”, each with its rarity:` : `Nothing accepted contains “${this.search}”.`))
    if (g.items.length) wrap.append(this.names(g.items, true))
    wrap.append(this.footer(g, () => void this.runSearch()))
    return wrap
  }

  /** the names, A to Z. In a search every name also says which rarity it is. */
  private names(items: AnswerListItem[], withTier: boolean): HTMLElement {
    const ol = el('ol', 'ans-names')
    for (const it of items) {
      const li = el('li', 'ans-name')
      const mine = !!this.own?.answer && sameName(it.name, this.own.answer)
      if (mine) li.classList.add('mine')
      li.append(el('span', 'ans-n', it.name))
      if (mine) li.append(el('span', 'ans-yours', 'YOUR ANSWER'))
      if (withTier) {
        const t = el('span', 'ans-chip', title(TIERS[it.tier].name))
        t.style.setProperty('--tc', rgbOf(it.tier))
        li.append(t)
      }
      if (it.also?.length) li.append(el('span', 'ans-also', 'also: ' + it.also.join(', ')))
      ol.append(li)
    }
    return ol
  }

  private footer(g: Group, more: () => void): HTMLElement {
    const f = el('div', 'ans-foot')
    if (g.failed) f.append(el('p', 'ans-error', "Couldn't load more."))
    if (g.loading) f.append(el('p', 'ans-note', 'Loading...'))
    else if (g.items.length < g.total) {
      const b = el('button', 'ans-more', `SHOW ${Math.min(PAGE, g.total - g.items.length)} MORE (${num(g.total - g.items.length)} LEFT)`)
      b.type = 'button'
      b.addEventListener('click', more)
      f.append(b)
    }
    return f
  }
}
