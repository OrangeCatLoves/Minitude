/**
 * Room for ads around the game, on the TITLE SCREEN ONLY, and on the text pages (docs/ADS.md, docs/ADSENSE.md). DRAFT: switched off.
 *
 * What the owner chose (17 Nov 2026):
 *  - a large screen gets three ads: one left of the game, one right of it and one banner under it;
 *  - a smaller screen gets one small banner at the very bottom;
 *  - nothing during a run, in the lobby, on the report or while the gem cabinet is open: the ads go when the title screen is left and come back with it;
 *  - nothing on the finish screen;
 *  - NO RISK OF A VIOLATION NOTICE: Google's game guidance is "at least 150 pixels between the ads and the edge of a game", so every ad on the
 *    game page is kept 150 px from the game, and the game is made smaller (on the title screen only) to make that room. When the window is too
 *    small for that without crushing the game, there is no ad on the game page at all (a phone on its side);
 *  - ads on the text pages (how to play, about) too: they have real text and no game controls.
 *
 * How it works: this file only decides WHICH layout the window gets and writes it on <html> as data-ads="wide" | "small" (no attribute = no ads).
 * The sizes live in the CSS (index.html for the room the game gives up, site.css for the slots): the game keeps its 16:9 shape and simply gets
 * a smaller part of the window while the title screen is up, so nothing is drawn under an ad and the picture never needs to know about them.
 *
 * Off by default: ADS_ENABLED is false, so a visitor gets exactly the page of before. `?adpreview=1` shows empty dashed boxes in the slots, to
 * look at the layout (nothing is loaded, no outside address is called). There is NO ad code in the game yet: the network's script, the consent
 * message, the privacy page and the security policy come after the network has said yes (docs/ADSENSE.md, "Phase B").
 */

/** the master switch. Turning it on is the last step, after the site is approved and the privacy page, the consent message and the security policy are done. */
export const ADS_ENABLED = false

/** the owner's AdSense publisher id (public; it is also in the page headers and in ads.txt, and a test keeps the three the same) */
export const ADSENSE_CLIENT = 'ca-pub-8003325864730114'

export type AdMode = 'off' | 'wide' | 'small'

/** Google's guidance for games: keep ads at least this far (px) from the edge of the game */
export const GAP = 150

/**
 * Room the game gives up, in px: the ad (160 wide at 8 px from the window's edge on each side; 90 or 50 high at 8 or 6 px from the bottom)
 * plus the 150 px gap. index.html has the same numbers in its --ad-side and --ad-bottom: change them together (ads.test.ts and tools/browser-test/ads.cjs check).
 */
export const ROOM = {
  wide: { side: 8 + 160 + GAP, bottom: 8 + 90 + GAP },
  small: { side: 0, bottom: 6 + 50 + GAP },
}

/** the three ads only when the game is still at least this wide with them; the bottom banner only when the game is at least this wide, or as wide as it was */
export const WIDE_MIN_GAME_WIDTH = 880
export const SMALL_MIN_GAME_WIDTH = 560

/** the size the game gets (16:9, as wide as it can be) in a window, when `side` px are taken from each side and `bottom` px from the bottom */
export function gameSize(width: number, height: number, side: number, bottom: number): { w: number; h: number } {
  const w = Math.max(0, Math.min(width - 2 * side, ((height - bottom) * 16) / 9))
  return { w, h: (w * 9) / 16 }
}

/** which layout the window gets; `onTitle` is false whenever a run, the lobby, the report or an overlay is up */
export function adMode(enabled: boolean, onTitle: boolean, width: number, height: number): AdMode {
  if (!enabled || !onTitle) return 'off'
  if (gameSize(width, height, ROOM.wide.side, ROOM.wide.bottom).w >= WIDE_MIN_GAME_WIDTH) return 'wide'
  const normal = gameSize(width, height, 0, 0).w
  if (gameSize(width, height, ROOM.small.side, ROOM.small.bottom).w >= Math.min(normal, SMALL_MIN_GAME_WIDTH)) return 'small'
  return 'off'
}

/** Puts the layout on <html> for the CSS, and keeps it right when the window changes shape (a phone turned on its side). */
export class AdFrame {
  private onTitle = false
  private mode: AdMode = 'off'

  constructor(private readonly root: HTMLElement, private readonly enabled: boolean, preview: boolean) {
    root.dataset.adsfeature = ''   // lets the CSS ease the game's size change; absent when the feature is off, so nothing changes then
    if (preview) root.dataset.adpreview = ''
    const again = (): void => this.apply()
    window.addEventListener('resize', again)
    window.addEventListener('orientationchange', again)
  }

  /** true while the title screen is up and nothing is on top of it */
  setOnTitle(on: boolean): void {
    if (on === this.onTitle) return
    this.onTitle = on
    this.apply()
  }

  get current(): AdMode { return this.mode }

  private apply(): void {
    const m = adMode(this.enabled, this.onTitle, window.innerWidth, window.innerHeight)
    if (m === this.mode) return
    this.mode = m
    if (m === 'off') delete this.root.dataset.ads
    else this.root.dataset.ads = m
  }
}
