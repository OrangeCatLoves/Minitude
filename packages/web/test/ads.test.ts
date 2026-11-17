import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ADS_ENABLED, ADSENSE_CLIENT, adMode, GAP, gameSize, ROOM, SMALL_MIN_GAME_WIDTH, WIDE_MIN_GAME_WIDTH } from '../src/ads'

// The owner's choices (17 Nov 2026): a large screen gets three ads on the TITLE SCREEN, a smaller one gets a small banner at the bottom, nothing
// anywhere else (not during a run, in the lobby, on the report, over the gem cabinet), and NO RISK OF A VIOLATION NOTICE: every ad on the game page
// is 150 px from the game (Google's guidance for games), so the game is made smaller on the title screen, or there is no ad when it would be crushed.
describe('which ad layout the window gets', () => {
  it('is switched off in the shipped code, so visitors get the page of before', () => {
    expect(ADS_ENABLED).toBe(false)
  })
  it('gives a large monitor the three ads', () => {
    expect(adMode(true, true, 1920, 950)).toBe('wide')
    expect(adMode(true, true, 1920, 1080)).toBe('wide')
    expect(adMode(true, true, 2560, 1300)).toBe('wide')
    expect(adMode(true, true, 1600, 800)).toBe('wide')
  })
  it('gives a laptop, a tablet and an upright phone the bottom banner only (the three ads would crush the game)', () => {
    expect(adMode(true, true, 1440, 800)).toBe('small')   // the three ads would leave the game 804 px wide
    expect(adMode(true, true, 1366, 650)).toBe('small')
    expect(adMode(true, true, 1280, 720)).toBe('small')
    expect(adMode(true, true, 1024, 700)).toBe('small')   // a tablet on its side
    expect(adMode(true, true, 768, 1024)).toBe('small')   // a tablet upright
    expect(adMode(true, true, 390, 844)).toBe('small')    // a phone upright
    expect(adMode(true, true, 320, 568)).toBe('small')
    expect(adMode(true, true, 1600, 600)).toBe('small')
  })
  it('gives no ad at all where the game would be crushed to make room (a phone on its side)', () => {
    expect(adMode(true, true, 844, 390)).toBe('off')
    expect(adMode(true, true, 932, 430)).toBe('off')
    expect(adMode(true, true, 667, 375)).toBe('off')
    expect(adMode(true, true, 1000, 400)).toBe('off')
  })
  it('shows nothing when the feature is off or the title screen is not what is on screen', () => {
    expect(adMode(false, true, 1920, 1080)).toBe('off')
    expect(adMode(true, false, 1920, 1080)).toBe('off')
    expect(adMode(true, false, 390, 844)).toBe('off')
  })
  it('keeps every ad 150 px from the game: the room is the ad, its margin and the gap', () => {
    expect(GAP).toBe(150)
    expect(ROOM.wide.side).toBe(8 + 160 + GAP)
    expect(ROOM.wide.bottom).toBe(8 + 90 + GAP)
    expect(ROOM.small.bottom).toBe(6 + 50 + GAP)
  })
  it('never makes the game smaller than the layout promises', () => {
    for (const [w, h] of [[1600, 800], [1920, 950], [2560, 1300]]) expect(gameSize(w, h, ROOM.wide.side, ROOM.wide.bottom).w).toBeGreaterThanOrEqual(WIDE_MIN_GAME_WIDTH)
    // an upright phone does not lose any size at all (the game is as wide as the screen already)
    expect(gameSize(390, 844, ROOM.small.side, ROOM.small.bottom).w).toBe(390)
    expect(gameSize(768, 1024, ROOM.small.side, ROOM.small.bottom).w).toBe(768)
    // a laptop keeps well over the small-banner minimum
    expect(gameSize(1366, 650, ROOM.small.side, ROOM.small.bottom).w).toBeGreaterThanOrEqual(SMALL_MIN_GAME_WIDTH)
  })
  it('has the same numbers in index.html as in the code', () => {
    const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8')
    expect(html).toContain(`html[data-ads='wide'] { --ad-side: ${ROOM.wide.side}px; --ad-bottom: ${ROOM.wide.bottom}px; }`)
    expect(html).toContain(`html[data-ads='small'] { --ad-bottom: ${ROOM.small.bottom}px; }`)
  })
  it('names the owner\'s publisher id in the form Google uses', () => {
    expect(ADSENSE_CLIENT).toMatch(/^ca-pub-\d{16}$/)
  })
})
