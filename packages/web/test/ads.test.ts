import { describe, expect, it } from 'vitest'
import { ADS_ENABLED, adMode, WIDE_MIN_HEIGHT, WIDE_MIN_WIDTH } from '../src/ads'

// The owner's choice (17 Nov 2026): a large screen gets three ads on the TITLE SCREEN, a smaller one gets a small banner at the bottom, and
// nothing anywhere else (not during a run, in the lobby, on the report, over the gem cabinet).
describe('which ad layout the window gets', () => {
  it('is switched off in the shipped code, so visitors get the page of before', () => {
    expect(ADS_ENABLED).toBe(false)
  })
  it('gives a laptop-sized or bigger window the three ads', () => {
    expect(adMode(true, true, 1440, 800)).toBe('wide')
    expect(adMode(true, true, 1920, 1080)).toBe('wide')
    expect(adMode(true, true, 1366, 650)).toBe('wide')
    expect(adMode(true, true, WIDE_MIN_WIDTH, WIDE_MIN_HEIGHT)).toBe('wide')
  })
  it('gives a smaller window the small banner at the bottom', () => {
    expect(adMode(true, true, 390, 844)).toBe('small')   // a phone upright
    expect(adMode(true, true, 844, 390)).toBe('small')   // a phone on its side
    expect(adMode(true, true, 768, 1024)).toBe('small')  // a tablet upright
    expect(adMode(true, true, WIDE_MIN_WIDTH - 1, 900)).toBe('small')
    expect(adMode(true, true, 1600, WIDE_MIN_HEIGHT - 1)).toBe('small')  // wide but very short: the side ads would not fit
  })
  it('shows nothing when the feature is off or the title screen is not what is on screen', () => {
    expect(adMode(false, true, 1440, 800)).toBe('off')
    expect(adMode(true, false, 1440, 800)).toBe('off')
    expect(adMode(true, false, 390, 844)).toBe('off')
  })
  it('leaves the game a usable size in the smallest wide window', () => {
    // the room taken in index.html: 176 px each side and 110 px under (wide); the game keeps 16:9
    const w = WIDE_MIN_WIDTH - 2 * 176, h = WIDE_MIN_HEIGHT - 110
    const gameW = Math.min(w, (h * 16) / 9)
    expect(gameW).toBeCloseTo(848, 0)
    expect(gameW).toBeGreaterThanOrEqual(840)
  })
})
