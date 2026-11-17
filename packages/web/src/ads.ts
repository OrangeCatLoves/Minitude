/**
 * Room for ads around the game, on the TITLE SCREEN ONLY (docs/ADS.md). DRAFT: switched off.
 *
 * What the owner chose (17 Nov 2026):
 *  - a large screen (a laptop and up) gets three ads: one left of the game, one right of it and one banner under it;
 *  - a smaller screen gets one small banner at the very bottom;
 *  - nothing during a run, in the lobby, on the report or while the gem cabinet is open: the ads go when the title screen is left and come back with it;
 *  - nothing on the finish screen.
 *
 * How it works: this file only decides WHICH layout the window gets and writes it on <html> as data-ads="wide" | "small" (no attribute = no ads).
 * The sizes live in the CSS (index.html for the room the game gives up, site.css for the slots): the game keeps its 16:9 shape and simply gets
 * a smaller part of the window while the title screen is up, so nothing is drawn under an ad and the picture never needs to know about them.
 *
 * Off by default: ADS_ENABLED is false, so a visitor gets exactly the page of before. `?adpreview=1` shows empty dashed boxes in the slots, to
 * look at the layout (nothing is loaded, no outside address is called). There is NO ad code in the game yet: a network's script, the consent
 * banner, the privacy page and the security policy come when a network has said yes (docs/ADS.md, "What is not done").
 */

/** the master switch. Turning it on is the last step, after a network has approved the site and the privacy page, the consent banner and the security policy are done. */
export const ADS_ENABLED = false

export type AdMode = 'off' | 'wide' | 'small'

/** A window at least this big gets the three ads. Smaller ones get the bottom banner only. The smallest wide window leaves the game 848 x 477 (a 1440 x 800 laptop: 1088 x 612). */
export const WIDE_MIN_WIDTH = 1200
export const WIDE_MIN_HEIGHT = 600

/** which layout the window gets; `onTitle` is false whenever a run, the lobby, the report or an overlay is up */
export function adMode(enabled: boolean, onTitle: boolean, width: number, height: number): AdMode {
  if (!enabled || !onTitle) return 'off'
  return width >= WIDE_MIN_WIDTH && height >= WIDE_MIN_HEIGHT ? 'wide' : 'small'
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
