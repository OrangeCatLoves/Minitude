import { ACHIEVEMENTS } from '@minitude/core'
import { loadAssets } from './assets'
import { Game } from './game'
import { Sfx } from './audio'
import { ADS_ENABLED, AdFrame } from './ads'
import { Afterword } from './afterword'
import { CabinetUi } from './cabinet'
import { AchievementsUi } from './achievements'
import { AnswersUi } from './answers'
import { trackVisit } from './visit'
import './site.css'

const boot = document.getElementById('boot') as HTMLElement
const canvas = document.getElementById('game') as HTMLCanvasElement
const input = document.getElementById('answer') as HTMLInputElement

function fail(msg: string): void {
  boot.style.display = 'grid'
  boot.style.textAlign = 'center'
  boot.style.letterSpacing = '0.05em'
  boot.textContent = msg
}

async function main(): Promise<void> {
  const assets = await loadAssets((d, t) => { boot.textContent = `LOADING ${Math.round((100 * d) / t)}%` })
  let game: Game
  try {
    game = new Game(canvas, input, assets)
  } catch (e) {
    fail(e instanceof Error ? e.message : String(e))
    return
  }
  boot.style.display = 'none'
  const sfx = new Sfx()
  game.sound = sfx
  setupMute(sfx, game)
  const afterEl = document.getElementById('after')
  if (afterEl) game.after = new Afterword(afterEl)
  const cabEl = document.getElementById('cabinet'), cabBtn = document.getElementById('cabbtn') as HTMLButtonElement | null
  if (cabEl && cabBtn) game.cabinet = new CabinetUi(cabEl, cabBtn, assets.gems[6])
  if (game.cabinet) {
    const ach = new AchievementsUi(canvas)
    ach.onChime = (gem) => sfx.achievement(gem)
    game.achievements = ach
    game.cabinet.achievements = ach
    ach.cabinet = game.cabinet
    ach.sync(game.cabinet.gemDays, game.cabinet.knownTotal)
  }
  const ansEl = document.getElementById('answers')
  if (ansEl) game.answers = new AnswersUi(ansEl)

  const params = new URLSearchParams(location.search)
  // the visit count (src/visit.ts, docs/TRAFFIC.md): not in the test modes
  if (!params.has('manual') && !params.has('debug')) trackVisit()
  // room for ads on the title screen (src/ads.ts, docs/ADS.md): off unless ADS_ENABLED is true; ?adpreview=1 shows empty dashed boxes to look at the layout (nothing is loaded)
  if (ADS_ENABLED || params.has('adpreview')) game.ads = new AdFrame(document.documentElement, true, params.has('adpreview'))
  // ?debug=1 lets a test script look inside the running game (the clock keeps running, unlike ?manual=1)
  if (params.has('debug')) (window as unknown as { __mtv: unknown }).__mtv = { game }
  if (params.has('manual')) {
    // test mode: the clock only moves when asked (used by the browser tests)
    ;(window as unknown as { __mt: unknown }).__mt = {
      game,
      achievementIds: ACHIEVEMENTS.map((a) => a.id),
      advance: (s: number, draw = true) => game.debugAdvance(s, draw),
      state: () => game.debugState(),
      answer: (t: string) => game.debugAnswer(t),
      press: (mode?: 'daily' | 'solo') => game.press(mode ?? 'solo'),
      pressPrimary: () => game.pressPrimary(),
      showResult: () => game.showResult(),
      loadDaily: () => game.loadDaily(),
      skip: () => game.debugSkipCard(),
      draw: () => game.render(),
      audio: async (tiers: number[]) => (await import('./audiotest')).renderRun(tiers),
    }
    game.render()
    return
  }

  let last = performance.now()
  const loop = (now: number): void => {
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000))
    last = now
    game.update(dt)
    // the gem cabinet and the screen of accepted answers cover the whole game with a solid backdrop: the game is not drawn under them, so
    // scrolling them stays smooth (and a phone saves battery); it carries on from the same moment when they close
    if (!game.cabinet?.isOpen && !game.answers?.isOpen) game.render()
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)
}

main().catch((e: unknown) => fail(e instanceof Error ? e.message : String(e)))

function setupMute(sfx: Sfx, game: Game): void {
  const b = document.getElementById('mute') as HTMLButtonElement | null
  if (!b) return
  const paint = (): void => { b.textContent = sfx.muted ? 'SOUND OFF' : 'SOUND ON'; b.setAttribute('aria-pressed', String(sfx.muted)) }
  paint()
  b.style.display = 'block'
  const toggle = (): void => { sfx.setMuted(!sfx.muted); sfx.unlock(); paint() }
  b.addEventListener('click', (e) => { e.stopPropagation(); toggle(); b.blur(); game.refocus() })
  window.addEventListener('keydown', (e) => {
    // not while typing in the page under the report
    if (e.target instanceof Element && e.target.closest('#after, #cabinet, #answers')) return
    if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey && !e.altKey && !game.canType()) toggle()
  })
}
