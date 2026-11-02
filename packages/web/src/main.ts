import { loadAssets } from './assets'
import { Game } from './game'
import { Sfx } from './audio'

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

  const params = new URLSearchParams(location.search)
  if (params.has('manual')) {
    // test mode: the clock only moves when asked (used by the browser tests)
    ;(window as unknown as { __mt: unknown }).__mt = {
      game,
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
    game.render()
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
  b.addEventListener('click', (e) => { e.stopPropagation(); toggle(); b.blur() })
  window.addEventListener('keydown', (e) => {
    if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey && !e.altKey && !game.canType()) toggle()
  })
}
