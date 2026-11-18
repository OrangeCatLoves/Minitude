/**
 * Multiplayer interface: the lobby screens, the other players' panel during a match, and the final standings.
 * Every screen is described by `lobbyItems()` (what buttons there are and where), which the drawing AND the click handling both use,
 * so what is drawn is exactly what can be pressed.
 */
import { TIERS, VERSUS_MAX_PLAYERS, VERSUS_MIN_PLAYERS, type VMatchEnd, type VPlayer } from '@minitude/core'
import { AMBER, CYAN, FAINT, LINE, OFF, OKG, SOFT } from './config'
import { drawText, PXF, rect, SILF, stext, textWidth, type Ctx } from './draw'
import { clamp01, lerpc, type RGB } from './util'
import { WARN, type PlayBox } from './ui'
import { SQUARE_DY, SQUARE_SIZE, SQUARE_STEP, SQUARE_X, STANDINGS_ROW, STANDINGS_X0, STANDINGS_Y0 } from './standingsgeo'
import type { VersusClient } from './versus'

export type LobbyAction =
  | 'name-ok' | 'title'
  | 'menu-create' | 'menu-join' | 'menu-browse' | 'menu-name'
  | 'create-private' | 'create-public' | 'create-go'
  | 'join-go' | 'back-menu' | 'browse-join'
  | 'room-start' | 'room-rematch' | 'room-visibility' | 'room-copy' | 'room-leave'

export interface LobbyItem {
  action: LobbyAction
  /** the room code for 'browse-join' */
  arg?: string
  box: PlayBox
  label: string
  enabled: boolean
  /** primary = the main choice, toggle = one of a pair (lit when chosen), row = a line of a list */
  kind: 'primary' | 'secondary' | 'toggle' | 'row'
  on?: boolean
  /** small second line (rows) */
  sub?: string
}

const BIG = (y: number): PlayBox => ({ x: 490, y, w: 300, h: 56 })
const SMALL = (y: number, x = 540): PlayBox => ({ x, y, w: 200, h: 40 })

export function lobbyItems(v: VersusClient): LobbyItem[] {
  switch (v.screen) {
    case 'name':
      return [
        { action: 'name-ok', box: BIG(452), label: 'CONTINUE', enabled: v.field.trim().length >= 2 && !v.busy, kind: 'primary' },
        { action: 'title', box: SMALL(530), label: 'BACK', enabled: true, kind: 'secondary' },
      ]
    case 'menu':
      return [
        { action: 'menu-create', box: BIG(262), label: 'CREATE A ROOM', enabled: true, kind: 'primary' },
        { action: 'menu-join', box: BIG(334), label: 'JOIN WITH A CODE', enabled: true, kind: 'primary' },
        { action: 'menu-browse', box: BIG(406), label: 'PUBLIC ROOMS', enabled: true, kind: 'primary' },
        { action: 'menu-name', box: SMALL(500), label: 'CHANGE NAME', enabled: true, kind: 'secondary' },
        { action: 'title', box: SMALL(552), label: 'BACK', enabled: true, kind: 'secondary' },
      ]
    case 'create':
      return [
        { action: 'create-private', box: { x: 420, y: 250, w: 200, h: 56 }, label: 'PRIVATE', enabled: true, kind: 'toggle', on: v.createVisibility === 'private' },
        { action: 'create-public', box: { x: 660, y: 250, w: 200, h: 56 }, label: 'PUBLIC', enabled: true, kind: 'toggle', on: v.createVisibility === 'public' },
        { action: 'create-go', box: BIG(420), label: 'CREATE ROOM', enabled: !v.busy, kind: 'primary' },
        { action: 'back-menu', box: SMALL(508), label: 'BACK', enabled: true, kind: 'secondary' },
      ]
    case 'join':
      return [
        { action: 'join-go', box: BIG(420), label: 'JOIN', enabled: v.field.length === 5 && !v.busy, kind: 'primary' },
        { action: 'back-menu', box: SMALL(508), label: 'BACK', enabled: true, kind: 'secondary' },
      ]
    case 'browse': {
      const items: LobbyItem[] = v.rooms.slice(0, 5).map((r, k) => ({
        action: 'browse-join' as const, arg: r.code, box: { x: 340, y: 196 + k * 68, w: 600, h: 56 },
        label: r.host, sub: `${r.players} / ${r.max} PLAYERS`, enabled: !v.busy, kind: 'row' as const,
      }))
      items.push({ action: 'back-menu', box: SMALL(600), label: 'BACK', enabled: true, kind: 'secondary' })
      return items
    }
    case 'room': {
      const room = v.room
      if (!room) return []
      const host = v.isHost()
      const items: LobbyItem[] = []
      if (host && room.status === 'waiting') {
        items.push({ action: 'room-start', box: BIG(540), label: 'START MATCH', enabled: v.connectedCount() >= VERSUS_MIN_PLAYERS && !v.busy, kind: 'primary' })
      } else if (host && room.status === 'finished') {
        items.push({ action: 'room-rematch', box: BIG(540), label: 'PLAY AGAIN', enabled: !v.busy, kind: 'primary' })
      }
      const small: LobbyItem[] = [{ action: 'room-copy', box: SMALL(0), label: 'COPY CODE', enabled: true, kind: 'secondary' }]
      if (host && room.status === 'waiting') small.push({ action: 'room-visibility', box: SMALL(0), label: room.visibility === 'public' ? 'MAKE PRIVATE' : 'MAKE PUBLIC', enabled: !v.busy, kind: 'secondary' })
      small.push({ action: 'room-leave', box: SMALL(0), label: 'LEAVE', enabled: true, kind: 'secondary' })
      const total = small.length * 200 + (small.length - 1) * 20
      small.forEach((s, k) => { s.box = { x: 640 - total / 2 + k * 220, y: 620, w: 200, h: 40 } })
      return items.concat(small)
    }
  }
}

/** the item under a point, with room to spare around buttons (fingers are bigger than buttons) */
export function itemAt(items: LobbyItem[], p: { x: number; y: number }): LobbyItem | null {
  for (const it of items) {
    const padX = it.kind === 'row' ? 0 : 14, padY = it.kind === 'row' ? 4 : 8
    if (p.x >= it.box.x - padX && p.x <= it.box.x + it.box.w + padX && p.y >= it.box.y - padY && p.y <= it.box.y + it.box.h + padY) return it.enabled ? it : null
  }
  return null
}

// ------------------------------------------------------------------ drawing
function frame(c: Ctx, b: PlayBox, col: RGB, th = 2): void {
  rect(c, b.x, b.y, b.w, th, col); rect(c, b.x, b.y + b.h - th, b.w, th, col); rect(c, b.x, b.y, th, b.h, col); rect(c, b.x + b.w - th, b.y, th, b.h, col)
}

function drawItem(c: Ctx, it: LobbyItem, T: number, hot: boolean): void {
  const b = it.box
  const dim = !it.enabled
  if (it.kind === 'row') {
    const col = dim ? FAINT : hot ? OFF : SOFT
    frame(c, b, col)
    let name = it.label
    const f = PXF(26, 600)
    while (name.length > 3 && textWidth(f, name) > b.w - 220) name = name.slice(0, -2) + '…'
    stext(c, name, b.x + 22, b.y + 37, f, dim ? FAINT : OFF)
    stext(c, it.sub ?? '', b.x + b.w - 22, b.y + 35, SILF(12), dim ? FAINT : SOFT, 3, 'r')
    return
  }
  let col: RGB = dim ? FAINT : it.kind === 'secondary' ? SOFT : OFF
  if (hot && !dim) col = [255, 255, 255]
  if (it.kind === 'toggle') {
    if (it.on) { rect(c, b.x, b.y, b.w, b.h, [30, 42, 80]); col = OFF } else col = SOFT
  }
  frame(c, b, col, it.kind === 'toggle' && it.on ? 3 : 2)
  let fs = it.kind === 'primary' ? 20 : it.kind === 'toggle' ? 18 : 14
  while (fs > 11 && textWidth(SILF(fs), it.label, it.kind === 'secondary' ? 3 : 4) > b.w - 24) fs--
  drawText(c, it.label, b.x + b.w / 2, b.y + b.h / 2 + fs * 0.36, SILF(fs), col, it.kind === 'secondary' ? 3 : 4, 'c')
  void T
}

function fieldBox(c: Ctx, x: number, y: number, w: number, text: string, placeholder: string, T: number, spaced: boolean, error: boolean): void {
  const lc: RGB = error ? WARN : text ? OFF : LINE
  rect(c, x, y + 52, w, 2, lc)
  const caret = Math.floor(T * 2) % 2 === 0
  if (!text) {
    stext(c, placeholder, x + w / 2, y + 38, PXF(32, 400), [112, 126, 172], 0, 'c')
    if (caret) rect(c, x + w / 2 - textWidth(PXF(32, 400), placeholder) / 2 - 10, y + 10, 3, 34, OFF)
    return
  }
  const ls = spaced ? 10 : 0
  let fs = spaced ? 52 : 38
  while (fs > 22 && textWidth(PXF(fs, 500), text, ls) > w - 20) fs -= 2
  stext(c, text, x + w / 2, y + 40, PXF(fs, 500), OFF, ls, 'c')
  if (caret) rect(c, x + w / 2 + textWidth(PXF(fs, 500), text, ls) / 2 + 6, y + 8, 3, 36, OFF)
}

const heading = (c: Ctx, s: string, y = 150): void => drawText(c, s, 640, y, SILF(14), SOFT, 6, 'c')
const line = (c: Ctx, s: string, y: number, col: RGB = SOFT, size = 12): void => stext(c, s, 640, y, SILF(size, false), col, 3, 'c')

export function drawLobby(c: Ctx, v: VersusClient, T: number, mouse: { x: number; y: number } | null): void {
  const items = lobbyItems(v)
  const hot = mouse ? itemAt(items, mouse) : null
  if (v.screen !== 'room' && v.screen !== 'browse') heading(c, 'MULTIPLAYER')
  switch (v.screen) {
    case 'name':
      stext(c, 'WHAT SHOULD WE CALL YOU?', 640, 236, PXF(34, 500), OFF, 0, 'c')
      fieldBox(c, 440, 288, 400, v.field, 'your name', T, false, !!v.error)
      line(c, 'THE OTHER PLAYERS SEE THIS NAME', 380, FAINT, 11)
      break
    case 'menu':
      stext(c, `HELLO, ${v.name.toUpperCase()}`, 640, 218, PXF(38, 500), OFF, 0, 'c')
      break
    case 'create':
      stext(c, 'CREATE A ROOM', 640, 218, PXF(38, 500), OFF, 0, 'c')
      line(c, v.createVisibility === 'private' ? 'ONLY PEOPLE WITH THE ROOM CODE CAN JOIN' : 'ANYONE CAN SEE IT IN THE LIST AND JOIN', 350, SOFT)
      break
    case 'join':
      stext(c, 'JOIN WITH A CODE', 640, 218, PXF(38, 500), OFF, 0, 'c')
      fieldBox(c, 440, 288, 400, v.field, 'ENTER THE CODE', T, true, !!v.error)
      line(c, '5 LETTERS OR DIGITS, FROM THE HOST', 380, FAINT, 11)
      break
    case 'browse':
      stext(c, 'PUBLIC ROOMS', 640, 164, PXF(34, 500), OFF, 0, 'c')
      if (!v.roomsLoaded) line(c, 'LOOKING...', 300)
      else if (v.rooms.length === 0) { line(c, 'NO PUBLIC ROOMS RIGHT NOW', 290, SOFT, 14); line(c, 'CREATE ONE AND OTHERS CAN JOIN IT', 326, FAINT, 11) }
      break
    case 'room': roomScreen(c, v, T); break
  }
  for (const it of items) drawItem(c, it, T, hot === it)
  if (v.error) {
    const y = v.screen === 'name' ? 420 : v.screen === 'create' || v.screen === 'join' ? 402 : v.screen === 'browse' ? 580 : v.screen === 'room' ? 604 : 640
    line(c, v.error.toUpperCase().slice(0, 90), y, WARN)
  } else if (v.notice) line(c, v.notice, v.screen === 'room' ? 604 : 640, OKG)
  if (v.screen === 'room' && v.conn === 'retrying') stext(c, 'RECONNECTING...', 1232, 52, SILF(12), AMBER, 3, 'r')
}

function roomScreen(c: Ctx, v: VersusClient, T: number): void {
  const room = v.room
  if (!room) return
  drawText(c, 'ROOM CODE', 640, 120, SILF(12, false), SOFT, 5, 'c')
  stext(c, room.code, 640, 196, PXF(78, 700), OFF, 14, 'c')
  line(c, room.visibility === 'public' ? 'PUBLIC ROOM  ·  ANYONE CAN JOIN FROM THE LIST' : 'PRIVATE ROOM  ·  SHARE THE CODE WITH YOUR FRIENDS', 232, SOFT, 11)
  const byseat = new Map<number, VPlayer>(room.players.map((p) => [p.seat, p]))
  for (let k = 0; k < VERSUS_MAX_PLAYERS; k++) {
    const p = byseat.get(k)
    const y = 262 + k * 60
    const b: PlayBox = { x: 400, y, w: 480, h: 50 }
    if (!p) {
      frame(c, b, [40, 52, 92], 1)
      stext(c, 'WAITING FOR A PLAYER' + '.'.repeat(1 + (Math.floor(T * 2) % 3)), 640, y + 33, SILF(12, false), FAINT, 3, 'c')
      continue
    }
    const me = p.seat === room.you
    frame(c, b, me ? CYAN : LINE, me ? 2 : 1)
    let name = p.name
    const f = PXF(28, 600)
    while (name.length > 3 && textWidth(f, name) > 270) name = name.slice(0, -2) + '…'
    stext(c, name, b.x + 20, y + 35, f, p.gone ? FAINT : OFF)
    let tx = b.x + b.w - 18
    const tag = (s: string, col: RGB): void => { drawText(c, s, tx, y + 32, SILF(11), col, 3, 'r'); tx -= textWidth(SILF(11), s, 3) + 16 }
    if (p.gone) tag('LEFT', FAINT)
    else if (!p.connected) tag('OFFLINE', AMBER)
    if (p.host) tag('HOST', AMBER)
    if (me) tag('YOU', CYAN)
  }
  const host = room.players.find((p) => p.host)
  if (room.status === 'waiting') {
    if (!v.isHost()) line(c, `WAITING FOR ${(host?.name ?? 'THE HOST').toUpperCase()} TO START`, 574, SOFT, 13)
    else if (v.connectedCount() < VERSUS_MIN_PLAYERS) line(c, `A MATCH NEEDS AT LEAST ${VERSUS_MIN_PLAYERS} PLAYERS`, 524, FAINT, 11)
  } else if (room.status === 'finished') {
    if (!v.isHost()) line(c, `WAITING FOR ${(host?.name ?? 'THE HOST').toUpperCase()} TO PLAY AGAIN`, 574, SOFT, 13)
  }
}

// ------------------------------------------------------------------ during the match: the players on the left
/** a small coloured square and the rarity, e.g. "RARE  +40" */
function chip(c: Ctx, x: number, y: number, tier: number, points: number, alpha: number): void {
  const t = TIERS[tier]
  c.save()
  c.globalAlpha = alpha
  rect(c, x, y - 11, 12, 12, t.edge)
  stext(c, `${t.name}  +${points}`, x + 20, y, SILF(13), t.fg, 2)
  c.restore()
}

/**
 * What this player's own row may show. Everybody else's result arrives from the server when THEIR roll animation is over; this
 * player's own comes from their own screen (the same moment), so a rarity never shows before its roll has finished.
 */
export interface OwnReveal { miss: boolean; tier: number; points: number }

export function drawVersusPanel(c: Ctx, v: VersusClient, T: number, own: OwnReveal | null = null): void {
  const room = v.room
  if (!room) return
  const round = v.round
  const x0 = 28, w = 280
  let y = 142
  for (const p of room.players) {
    const me = p.seat === room.you
    const res = me ? (own ? { miss: own.miss, tier: own.miss ? null : own.tier, points: own.points } : undefined) : round?.answered.get(p.seat)
    const item = round?.items?.get(p.seat)
    const dead = p.gone
    rect(c, x0, y - 26, 2, round?.phase === 'between' ? 78 : 52, me ? CYAN : [64, 78, 120])
    let name = p.name
    const f = PXF(24, 600)
    while (name.length > 3 && textWidth(f, name) > w - 80) name = name.slice(0, -2) + '…'
    stext(c, name, x0 + 14, y, f, dead ? FAINT : me ? lerpc(OFF, CYAN, 0.35) : OFF)
    // the total includes a question just answered, before the round is over
    const total = (v.totals.get(p.seat) ?? 0) + (round?.phase === 'answering' && res && !res.miss ? res.points : 0)
    stext(c, String(total), x0 + w, y - 1, SILF(15), dead ? FAINT : SOFT, 2, 'r')
    // second line: what happened this round
    if (dead) stext(c, 'LEFT THE MATCH', x0 + 14, y + 24, SILF(12, false), FAINT, 2)
    else if (res && !res.miss && res.tier !== null) chip(c, x0 + 14, y + 24, res.tier, res.points, 1)
    else if (res?.miss) stext(c, 'NO ANSWER', x0 + 14, y + 24, SILF(12, false), FAINT, 2)
    else if (round?.phase === 'answering') {
      const n = Math.floor(T * 2.5) % 4
      stext(c, p.connected ? 'THINKING' + '.'.repeat(n) : 'OFFLINE', x0 + 14, y + 24, SILF(12, false), p.connected ? SOFT : AMBER, 2)
    }
    // after the round the answer itself is shown
    if (item && !item.miss && item.answer) {
      let a = item.answer
      const fa = PXF(21, 500)
      while (a.length > 3 && textWidth(fa, a) > w - 20) a = a.slice(0, -2) + '…'
      stext(c, a, x0 + 14, y + 50, fa, OFF)
    }
    y += round?.phase === 'between' ? 92 : 66
  }
}

// ------------------------------------------------------------------ the end: everybody's result
const ordinal = (n: number): string => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'TH' : ['TH', 'ST', 'ND', 'RD'][n % 10 > 3 ? 0 : n % 10]}`

export function drawStandings(c: Ctx, tr: number, end: VMatchEnd, me: number): void {
  const a = clamp01((tr - 0.9) / 0.6)
  if (a <= 0.01) return
  const dark: RGB = [12, 18, 36]
  const x0 = STANDINGS_X0, xr = 1244
  const mine = end.standings.find((s) => s.seat === me)
  const tied = mine ? end.standings.filter((s) => s.rank === mine.rank).length > 1 : false
  drawText(c, 'MATCH RESULT', x0, 132, SILF(13), lerpc(dark, SOFT, a), 4)
  if (mine) stext(c, `YOU FINISHED ${tied ? 'JOINT ' : ''}${ordinal(mine.rank)}`, x0, 166, PXF(26, 600), lerpc(dark, mine.rank === 1 ? AMBER : OFF, a))
  end.standings.forEach((s, k) => {
    const ra = clamp01((tr - 1.1 - 0.18 * k) / 0.35)
    if (ra <= 0) return
    const y = STANDINGS_Y0 + k * STANDINGS_ROW
    const isMe = s.seat === me
    const col = lerpc(dark, isMe ? CYAN : OFF, ra)
    stext(c, String(s.rank), x0, y + 8, PXF(34, 700), lerpc(dark, s.rank === 1 ? AMBER : SOFT, ra))
    let name = s.name
    const f = PXF(22, 600)
    while (name.length > 3 && textWidth(f, name) > 190) name = name.slice(0, -2) + '…'
    stext(c, name, x0 + 40, y, f, col)
    stext(c, String(s.total), xr, y, PXF(24, 700), col, 0, 'r')
    s.items.forEach((it, i) => rect(c, x0 + SQUARE_X + i * SQUARE_STEP, y + SQUARE_DY, SQUARE_SIZE, SQUARE_SIZE, it.miss || it.tier === null ? lerpc(dark, [60, 70, 100], ra) : lerpc(dark, TIERS[it.tier].edge, ra)))
  })
}
