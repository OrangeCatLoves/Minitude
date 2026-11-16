import { describe, expect, it } from 'vitest'
import { easeLift, keyboardMayBeUp, liftNeeded } from '../src/keyboard'

// a phone on its side: 844 x 390, the picture fills the height (693 wide) so its scale is 390 / 720
const LANDSCAPE = { top: 0, height: 390 }

describe('how far the answer box rises above the keyboard', () => {
  it('does nothing when no keyboard is up (the whole screen is visible)', () => {
    expect(liftNeeded(LANDSCAPE, { top: 0, bottom: 390 }, 390, 720, 550)).toBe(0)
  })
  it('lifts the bottom of the box to just above a keyboard that covers the lower half of a landscape phone', () => {
    const lift = liftNeeded(LANDSCAPE, { top: 0, bottom: 195 }, 390, 720, 550) // keyboard covers 195 px
    const scale = 390 / 720
    // the box's lowest line, after the lift, is KEYBOARD_GAP above the keyboard
    expect(390 - lift * scale).toBeCloseTo(195 - 12, 5)
    expect(lift).toBeGreaterThan(300)
  })
  it('lifts nothing when the picture already ends above the keyboard (a tall phone: the picture sits in the middle)', () => {
    // portrait 390 x 664: the picture is 390 x 219, centred, so it ends at y = 441; a keyboard starting at y = 460 leaves it alone
    expect(liftNeeded({ top: 222, height: 219 }, { top: 0, bottom: 460 }, 664, 720, 550)).toBe(0)
    // but a taller keyboard (visible area ends at 364) covers it
    expect(liftNeeded({ top: 222, height: 219 }, { top: 0, bottom: 364 }, 664, 720, 550)).toBeGreaterThan(0)
  })
  it('never lifts more than the cap, so the box cannot leave the picture', () => {
    expect(liftNeeded(LANDSCAPE, { top: 0, bottom: 20 }, 390, 720, 550)).toBe(550)
    expect(liftNeeded(LANDSCAPE, { top: 0, bottom: 20 }, 390, 520, 130)).toBe(130)
  })
  it('follows a page the browser has panned (the visible area starts below the top of the page)', () => {
    // the visible area is the lower 200 px of a 390 px page: the picture's bottom (390) is inside it, so nothing to lift
    expect(liftNeeded(LANDSCAPE, { top: 190, bottom: 390 }, 390, 720, 550)).toBe(0)
  })
  it('lifts the lobby field area less than the answer box, because its lowest line is higher up', () => {
    const v = { top: 0, bottom: 195 }
    expect(liftNeeded(LANDSCAPE, v, 390, 520, 130)).toBeLessThan(liftNeeded(LANDSCAPE, v, 390, 720, 550))
  })
  it('copes with a canvas that has no size yet and with a nonsense cap', () => {
    expect(liftNeeded({ top: 0, height: 0 }, { top: 0, bottom: 100 }, 390, 720, 550)).toBe(0)
    expect(liftNeeded(LANDSCAPE, { top: 0, bottom: 100 }, 390, 720, 0)).toBe(0)
    expect(liftNeeded(LANDSCAPE, { top: 0, bottom: Number.NaN }, 390, 720, 550)).toBe(0)
  })
})

describe('when the keyboard may be up', () => {
  it('needs the answer field to have the focus', () => {
    expect(keyboardMayBeUp(false, 1)).toBe(false)
    expect(keyboardMayBeUp(true, 1)).toBe(true)
  })
  it('ignores a page the player has pinch-zoomed, and works where the browser gives no zoom value', () => {
    expect(keyboardMayBeUp(true, 2.5)).toBe(false)
    expect(keyboardMayBeUp(true, undefined)).toBe(true)
  })
})

describe('easing the lift', () => {
  it('moves towards the target without overshooting, and lands exactly on it', () => {
    let v = 0
    for (let i = 0; i < 60; i++) { const n = easeLift(v, 300, 1 / 60); expect(n).toBeLessThanOrEqual(300); expect(n).toBeGreaterThanOrEqual(v); v = n }
    expect(v).toBe(300)
  })
  it('comes back to exactly 0 when the keyboard goes away, so the picture is untouched at rest', () => {
    let v = 300
    for (let i = 0; i < 60; i++) v = easeLift(v, 0, 1 / 60)
    expect(v).toBe(0)
  })
  it('is quick: most of the way in a tenth of a second', () => {
    let v = 0
    for (let i = 0; i < 6; i++) v = easeLift(v, 300, 1 / 60)
    expect(v).toBeGreaterThan(200)
  })
  it('does not move on a zero or negative time step', () => {
    expect(easeLift(10, 100, 0)).toBe(10)
    expect(easeLift(10, 100, -1)).toBe(10)
  })
})
