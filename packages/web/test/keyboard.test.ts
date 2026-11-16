import { describe, expect, it } from 'vitest'
import { easeLift, extraGap, IOS_TOOLBAR, KEYBOARD_GAP, keyboardMayBeUp, liftNeeded } from '../src/keyboard'

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36'
const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

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

describe('the extra air above an iPhone keyboard (its toolbar)', () => {
  it('is added on an iPhone, an iPad and an iPad that calls itself a Mac, and nowhere else', () => {
    expect(extraGap(IPHONE, 'iPhone', 5, null)).toBe(IOS_TOOLBAR)
    expect(extraGap(IPHONE.replace('iPhone', 'iPad'), 'iPad', 5, null)).toBe(IOS_TOOLBAR)
    expect(extraGap(DESKTOP.replace('Windows NT 10.0; Win64; x64', 'Macintosh; Intel Mac OS X 10_15_7'), 'MacIntel', 5, null)).toBe(IOS_TOOLBAR) // iPad in desktop mode
    expect(extraGap(ANDROID, 'Linux armv81', 5, null)).toBe(0)
    expect(extraGap(DESKTOP, 'Win32', 0, null)).toBe(0)
    expect(extraGap(DESKTOP.replace('Windows NT 10.0; Win64; x64', 'Macintosh; Intel Mac OS X 10_15_7'), 'MacIntel', 0, null)).toBe(0) // a real Mac has no touch screen
  })
  it('can be set from the address, within sane limits, so it can be tuned on a real phone', () => {
    expect(extraGap(IPHONE, 'iPhone', 5, '0')).toBe(0)
    expect(extraGap(IPHONE, 'iPhone', 5, '80')).toBe(80)
    expect(extraGap(DESKTOP, 'Win32', 0, '30')).toBe(30)
    for (const bad of ['-5', '900', 'abc', 'NaN', 'Infinity']) expect(extraGap(IPHONE, 'iPhone', 5, bad)).toBe(IOS_TOOLBAR)
    expect(extraGap(IPHONE, 'iPhone', 5, '')).toBe(IOS_TOOLBAR)
  })
  it('puts the lowest line above the toolbar too, and on a short screen lifts the box to the top of the picture instead of losing it', () => {
    // an iPhone on its side under Safari's bars (the case in the owner's photo): the page is 311 px high and starts 119 px down the screen,
    // the picture is 517 x 291, and the keyboard leaves only 74 px visible above it
    const canvas = { top: 0, height: 291 }
    const visible = { top: 0, bottom: 74 }
    const lift = liftNeeded(canvas, visible, 311, 720, 550, KEYBOARD_GAP + IOS_TOOLBAR)
    expect(lift).toBe(550) // the most it may rise: the box sits at the very top of the picture, the only place that is surely above everything
    // with room to spare (a tall screen) the box clears the keyboard and its toolbar by exactly the gap
    const tall = liftNeeded({ top: 222, height: 219 }, { top: 0, bottom: 364 }, 664, 720, 550, KEYBOARD_GAP + IOS_TOOLBAR)
    expect(222 + 219 - tall * (219 / 720)).toBeCloseTo(364 - KEYBOARD_GAP - IOS_TOOLBAR, 5)
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
