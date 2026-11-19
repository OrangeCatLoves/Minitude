import { describe, expect, it } from 'vitest'
import { PLANCK_POINTS, POINTS_PER_WORLD, VOID_START_POINTS, pointsToU, sizeOfU, stageOfPoints, uToSlot, diveSeconds, fmtSize, niceBar, factorLabel, TIERS } from '../src'

describe('points to depth and stage', () => {
  it('worlds 1-20 take 30 points each (stretched over 0 to 600 by the owner on 18 Nov 2026)', () => {
    expect(POINTS_PER_WORLD).toBe(30)
    for (let n = 1; n <= 20; n++) {
      expect(stageOfPoints(30 * (n - 1)).worldNo).toBe(n)
      expect(stageOfPoints(30 * n - 1).worldNo).toBe(n)
    }
  })
  it('unexplored is 600-699, Planck Foam starts at 700 (the Planck length is 700.4 points by the size formula)', () => {
    expect(VOID_START_POINTS).toBe(600)
    expect(PLANCK_POINTS).toBe(700)
    expect(stageOfPoints(599).kind).toBe('world')
    expect(stageOfPoints(599).worldNo).toBe(20)
    expect(stageOfPoints(600).kind).toBe('unexplored')
    expect(stageOfPoints(699).kind).toBe('unexplored')
    expect(stageOfPoints(700).kind).toBe('planck')
    expect(stageOfPoints(700).worldNo).toBe(21)
    expect(stageOfPoints(840).worldNo).toBe(21)
  })
  it('depth is continuous at the edges of the unexplored stretch', () => {
    expect(pointsToU(600)).toBeCloseTo(20, 12)
    expect(pointsToU(700)).toBeCloseTo(35, 12)
    expect(pointsToU(840)).toBe(35)
    expect(pointsToU(699.999)).toBeLessThan(35)
  })
  it('fifteen powers of ten spread evenly over the 100 points of the unexplored stretch', () => {
    expect(pointsToU(600 + 100 / 3)).toBeCloseTo(25, 12)
    expect(pointsToU(600 + (100 / 3) * 2)).toBeCloseTo(30, 12)
    expect(pointsToU(650)).toBeCloseTo(27.5, 12) // the middle
    // one dark picture (one power of ten) every 100 / 15 = 6.67 points
    expect(pointsToU(620)).toBeCloseTo(23, 12)
    expect(pointsToU(640)).toBeCloseTo(26, 12)
    expect(pointsToU(680)).toBeCloseTo(32, 12)
  })
  it('sizes match the table sent to the player', () => {
    expect(sizeOfU(pointsToU(0))).toBeCloseTo(1.7, 12)
    expect(fmtSize(sizeOfU(pointsToU(30)))).toBe('17 cm')
    expect(fmtSize(sizeOfU(pointsToU(90)))).toBe('1.7 mm')
    expect(fmtSize(sizeOfU(pointsToU(570)))).toBe('170 zm') // the start of world 20, the LHC's world, is still 1.7 x 10^-19 m
    expect(fmtSize(sizeOfU(pointsToU(600)))).toBe('17 zm') // and unexplored begins at 1.7 x 10^-20 m, as before
    expect(fmtSize(sizeOfU(pointsToU(700)))).toBe('1.7 × 10⁻³⁵ m')
    expect(fmtSize(sizeOfU(pointsToU(640)))).toBe('17 rm')
    expect(fmtSize(sizeOfU(pointsToU(620)))).toBe('17 ym')
    expect(fmtSize(sizeOfU(pointsToU(680)))).toBe('1.7 × 10⁻³² m')
    expect(fmtSize(sizeOfU(pointsToU(105)))).toBe('540 µm')
  })
  it('slots', () => {
    expect(uToSlot(pointsToU(599))).toBe(19)
    expect(uToSlot(pointsToU(600))).toBe(20)
    expect(uToSlot(pointsToU(699))).toBe(34)
    expect(uToSlot(pointsToU(700))).toBe(35)
  })
  it('dives are short in the void', () => {
    expect(diveSeconds(3, 3)).toBe(1.9)
    expect(diveSeconds(3, 4)).toBeCloseTo(2.3, 9)
    expect(diveSeconds(19, 27)).toBeCloseTo(1.5 + 0.8 + 7 * 0.3, 9)
  })
})

describe('the tiers', () => {
  it('Common 20, Uncommon 30 (exactly one world), then 40, 60, 80, 100, and the gem 120 (the best run is still 840)', () => {
    expect(TIERS.map((t) => t.points)).toEqual([20, 30, 40, 60, 80, 100, 120])
  })
  it('two Common answers always reach the next world (2 x 20 > 30), and one never skips a world', () => {
    const slot = (p: number) => stageOfPoints(p).slot
    for (let start = 0; start < 580; start++) {
      expect(slot(start + 40)).toBeGreaterThan(slot(start)) // two Common answers: always a new picture
      expect(slot(start + 20) - slot(start)).toBeLessThanOrEqual(1) // one Common answer: never two worlds at once
    }
  })
  it('an Uncommon answer is exactly one world, a gem exactly four', () => {
    expect(pointsToU(130) - pointsToU(100)).toBeCloseTo(1, 12)
    expect(pointsToU(120 + 300) - pointsToU(300)).toBeCloseTo(4, 12)
  })
  it('the stamps are the real shrink factors, rounded', () => {
    const f = (p: number) => Math.pow(10, p / 30)
    expect(f(20)).toBeCloseTo(4.64, 2) // ÷ 5
    expect(f(30)).toBeCloseTo(10, 9) // ÷ 10
    expect(f(40)).toBeCloseTo(21.5, 1) // ÷ 20
    expect(f(60)).toBeCloseTo(100, 9) // ÷ 100
    expect(f(80)).toBeCloseTo(464, 0) // ÷ 500
    expect(f(100)).toBeCloseTo(2154, 0) // ÷ 2,000
    expect(f(120)).toBeCloseTo(10000, 6) // ÷ 10,000
    expect(TIERS.map((t) => t.factor)).toEqual(['÷ 5', '÷ 10', '÷ 20', '÷ 100', '÷ 500', '÷ 2,000', '÷ 10,000'])
  })
})

describe('whole runs', () => {
  const total = (...tiers: number[]) => tiers.reduce((a, t) => a + TIERS[t].points, 0)
  it('all-one-tier runs end where the player was told', () => {
    expect(stageOfPoints(total(0, 0, 0, 0, 0, 0, 0)).worldNo).toBe(5) // 140
    expect(stageOfPoints(total(1, 1, 1, 1, 1, 1, 1)).worldNo).toBe(8) // 210
    expect(stageOfPoints(total(2, 2, 2, 2, 2, 2, 2)).worldNo).toBe(10) // 280
    expect(stageOfPoints(total(3, 3, 3, 3, 3, 3, 3)).worldNo).toBe(15) // 420
    expect(stageOfPoints(total(4, 4, 4, 4, 4, 4, 4)).worldNo).toBe(19) // 560: seven Legendary answers do not leave the worlds any more
    expect(stageOfPoints(total(5, 5, 5, 5, 5, 5, 5)).kind).toBe('planck') // 700
  })
  it('Planck Foam (700) is for perfect runs: seven Mythic answers, or a gem in their place, or six gems', () => {
    expect(total(5, 5, 5, 5, 5, 5, 5)).toBe(700)
    expect(total(5, 5, 5, 5, 5, 5, 6)).toBe(720)
    expect(total(6, 6, 6, 6, 6, 6)).toBe(720) // six gems: the finale comes on answer 6
    expect(stageOfPoints(total(5, 5, 5, 5, 5, 5, 4)).kind).toBe('unexplored') // six Mythic and a Legendary: 680, 20 short
    expect(stageOfPoints(total(5, 5, 5, 5, 5, 4, 4)).kind).toBe('unexplored') // 660, 40 short
  })
  it('even a gem from the very end of world 20 skips the whole unexplored stretch (it is only 100 points wide)', () => {
    expect(stageOfPoints(599 + 120).kind).toBe('planck')
    expect(stageOfPoints(total(5, 5, 5, 5, 5, 4) + 120).kind).toBe('planck') // 580 + a gem = 700
    expect(stageOfPoints(total(5, 5, 5, 5, 5, 4) + 100).kind).toBe('unexplored') // 580 + a Mythic = 680
  })
})

describe('formatting', () => {
  it('scale bar values are 1, 2 or 5 times a power of ten', () => {
    expect(niceBar(1.7)).toBe(2)
    expect(niceBar(0.54)).toBe(0.5)
    expect(niceBar(1.7e-35)).toBeCloseTo(2e-35, 45)
  })
  it('stamp labels', () => {
    expect(factorLabel('÷ 2,000', 100, 0, 100 / 30)).toBe('÷ 2,000')
    expect(factorLabel('÷ 10,000', 80, 19, 35)).toBe('÷ 10¹⁶'.replace('÷ 10¹⁶', '÷ 1.0×10¹⁶').replace('1.0×', '1×'))
  })
})
