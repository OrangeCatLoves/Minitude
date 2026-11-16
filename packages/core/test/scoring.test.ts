import { describe, expect, it } from 'vitest'
import { PLANCK_POINTS, pointsToU, sizeOfU, stageOfPoints, uToSlot, diveSeconds, fmtSize, niceBar, factorLabel, TIERS } from '../src'

describe('points to depth and stage', () => {
  it('worlds 1-20 take 20 points each', () => {
    for (let n = 1; n <= 20; n++) {
      expect(stageOfPoints(20 * (n - 1)).worldNo).toBe(n)
      expect(stageOfPoints(20 * n - 1).worldNo).toBe(n)
    }
  })
  it('unexplored is 400-554, Planck Foam starts at 555 (raised from 440 by the owner on 16 Nov 2026)', () => {
    expect(PLANCK_POINTS).toBe(555)
    expect(stageOfPoints(399).kind).toBe('world')
    expect(stageOfPoints(400).kind).toBe('unexplored')
    expect(stageOfPoints(439).kind).toBe('unexplored') // the old edge of Planck Foam is now deep inside the unexplored stretch
    expect(stageOfPoints(440).kind).toBe('unexplored')
    expect(stageOfPoints(554).kind).toBe('unexplored')
    expect(stageOfPoints(555).kind).toBe('planck')
    expect(stageOfPoints(555).worldNo).toBe(21)
    expect(stageOfPoints(700).worldNo).toBe(21)
  })
  it('depth is continuous at the edges of the unexplored stretch', () => {
    expect(pointsToU(400)).toBeCloseTo(20, 12)
    expect(pointsToU(555)).toBeCloseTo(35, 12)
    expect(pointsToU(700)).toBe(35)
    expect(pointsToU(554.999)).toBeLessThan(35)
  })
  it('fifteen powers of ten spread evenly over the 155 points of the unexplored stretch', () => {
    expect(pointsToU(400 + 155 / 3)).toBeCloseTo(25, 12)
    expect(pointsToU(400 + 155 / 3 * 2)).toBeCloseTo(30, 12)
    expect(pointsToU(477.5)).toBeCloseTo(27.5, 12) // the middle
    // one dark picture (one power of ten) every 155 / 15 = 10.33 points
    expect(pointsToU(431)).toBeCloseTo(23, 12)
    expect(pointsToU(462)).toBeCloseTo(26, 12)
    expect(pointsToU(524)).toBeCloseTo(32, 12)
  })
  it('sizes match the table sent to the player', () => {
    expect(sizeOfU(pointsToU(0))).toBeCloseTo(1.7, 12)
    expect(fmtSize(sizeOfU(pointsToU(20)))).toBe('17 cm')
    expect(fmtSize(sizeOfU(pointsToU(60)))).toBe('1.7 mm')
    expect(fmtSize(sizeOfU(pointsToU(380)))).toBe('170 zm')
    expect(fmtSize(sizeOfU(pointsToU(555)))).toBe('1.7 × 10⁻³⁵ m')
    expect(fmtSize(sizeOfU(pointsToU(462)))).toBe('17 rm')
    expect(fmtSize(sizeOfU(pointsToU(431)))).toBe('17 ym')
    expect(fmtSize(sizeOfU(pointsToU(524)))).toBe('1.7 × 10⁻³² m')
    expect(fmtSize(sizeOfU(pointsToU(70)))).toBe('540 µm')
  })
  it('slots', () => {
    expect(uToSlot(pointsToU(399))).toBe(19)
    expect(uToSlot(pointsToU(400))).toBe(20)
    expect(uToSlot(pointsToU(554))).toBe(34)
    expect(uToSlot(pointsToU(555))).toBe(35)
  })
  it('dives are short in the void', () => {
    expect(diveSeconds(3, 3)).toBe(1.9)
    expect(diveSeconds(3, 4)).toBeCloseTo(2.3, 9)
    expect(diveSeconds(19, 27)).toBeCloseTo(1.5 + 0.8 + 7 * 0.3, 9)
  })
})

describe('whole runs', () => {
  const total = (...tiers: number[]) => tiers.reduce((a, t) => a + TIERS[t].points, 0)
  it('all-one-tier runs end where the player was told', () => {
    expect(stageOfPoints(total(0, 0, 0, 0, 0, 0, 0)).worldNo).toBe(4)
    expect(stageOfPoints(total(1, 1, 1, 1, 1, 1, 1)).worldNo).toBe(8)
    expect(stageOfPoints(total(2, 2, 2, 2, 2, 2, 2)).worldNo).toBe(15)
    expect(stageOfPoints(total(3, 3, 3, 3, 3, 3, 3)).kind).toBe('unexplored')
    expect(stageOfPoints(total(4, 4, 4, 4, 4, 4, 4)).kind).toBe('planck') // seven Legendary answers: 560, just over
    expect(stageOfPoints(total(5, 5, 5, 5, 5, 5, 5)).kind).toBe('planck')
  })
  it('ways to reach Planck Foam (555): every answer is worth a multiple of 10, so the first total that gets there is 560', () => {
    expect(total(4, 4, 4, 4, 4, 4, 4)).toBe(560) // seven Legendary
    expect(total(5, 5, 5, 5, 4, 4)).toBe(560) // four Mythic and two Legendary: six answers
    expect(total(5, 5, 5, 5, 3, 3, 2)).toBe(560) // four Mythic, two Exotic and a Rare
    expect(stageOfPoints(total(4, 4, 4, 4, 4, 4, 3)).kind).toBe('unexplored') // six Legendary and an Exotic: 540, 15 short
    expect(stageOfPoints(total(5, 5, 5, 5, 4, 3)).kind).toBe('unexplored') // 540
    expect(stageOfPoints(total(3, 3, 3, 3, 3, 3, 3)).kind).toBe('unexplored') // seven Exotic: 420, 135 short
  })
  it('no single answer can carry a dive across the whole unexplored stretch any more (even a gem is 120 of its 155 points)', () => {
    expect(stageOfPoints(399 + 120).kind).toBe('unexplored')
    expect(stageOfPoints(total(5, 5, 5, 4) + 120).kind).toBe('unexplored') // 380 + a gem = 500
  })
})

describe('formatting', () => {
  it('scale bar values are 1, 2 or 5 times a power of ten', () => {
    expect(niceBar(1.7)).toBe(2)
    expect(niceBar(0.54)).toBe(0.5)
    expect(niceBar(1.7e-35)).toBeCloseTo(2e-35, 45)
  })
  it('stamp labels', () => {
    expect(factorLabel('÷ 100,000', 100, 0, 5)).toBe('÷ 100,000')
    expect(factorLabel('÷ 10,000', 80, 19, 35)).toBe('÷ 10¹⁶'.replace('÷ 10¹⁶', '÷ 1.0×10¹⁶').replace('1.0×', '1×'))
  })
})
