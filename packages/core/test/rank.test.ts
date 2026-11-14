import { describe, expect, it } from 'vitest'
import { rankText, topPercent } from '../src'

describe('the rank statistic', () => {
  it('says the rank and how many dives it is among', () => {
    expect(rankText(12, 340)).toEqual({ main: '#12', sub: 'of 340 dives · top 4%' })
  })
  it('groups thousands', () => {
    expect(rankText(1204, 15830)).toEqual({ main: '#1,204', sub: 'of 15,830 dives · top 8%' })
  })
  it('first place, and a score nobody else has reached yet', () => {
    expect(rankText(1, 340)).toEqual({ main: '#1', sub: 'the best of 340 dives so far' })
    expect(rankText(1, 1)).toEqual({ main: '#1', sub: 'the first dive recorded' })
  })
  it('gives no percentage while there are few dives', () => {
    expect(rankText(3, 7)).toEqual({ main: '#3', sub: 'of 7 dives' })
    expect(rankText(3, 19).sub).toBe('of 19 dives')
    expect(rankText(3, 20).sub).toBe('of 20 dives · top 15%')
  })
  it('the percentage is rounded up and is never 0 or more than 100', () => {
    expect(topPercent(1, 1000)).toBe(1)
    expect(topPercent(2, 3)).toBe(67)
    expect(topPercent(50, 50)).toBe(100)
    expect(topPercent(5, 0)).toBe(100)
  })
  it('survives odd input (a rank below the total is made sane)', () => {
    expect(rankText(0, 0)).toEqual({ main: '#1', sub: 'the first dive recorded' })
    expect(rankText(9, 4).main).toBe('#9')
    expect(rankText(9, 4).sub).toBe('of 9 dives')
  })
})
