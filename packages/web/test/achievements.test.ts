import { describe, expect, it } from 'vitest'
import { ACHIEVEMENTS } from '@minitude/core'
import { fmtDay } from '../src/achievements'
import { GLYPH_IDS, TROPHY_ID } from '../src/achicons'

describe('the achievement pictures', () => {
  it('there is a picture for every achievement: forty 24-pixel ones and the trophy', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id).sort()
    const have = [...GLYPH_IDS.filter((id) => id !== TROPHY_ID), TROPHY_ID].sort()
    expect(have).toEqual(ids)
    expect(TROPHY_ID).toBe('gems-all')
  })
  it('no picture is left over for an achievement that does not exist', () => {
    const ids = new Set(ACHIEVEMENTS.map((a) => a.id))
    for (const id of GLYPH_IDS) expect(ids.has(id)).toBe(true)
  })
})

describe('the day shown on an earned achievement', () => {
  it('reads a UTC day as "19 Nov 2026"', () => {
    expect(fmtDay('2026-11-19')).toBe('19 Nov 2026')
    expect(fmtDay('2026-01-05')).toBe('5 Jan 2026')
    expect(fmtDay('2026-12-31')).toBe('31 Dec 2026')
  })
  it('shows nothing for a day that is not known', () => {
    for (const bad of ['', 'yesterday', '2026-13-01x', '19/11/2026']) expect(fmtDay(bad)).toBe('')
  })
})
