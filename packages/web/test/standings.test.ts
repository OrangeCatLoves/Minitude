import { describe, expect, it } from 'vitest'
import { standingsSquareAt } from '../src/standingsgeo'

// The coloured squares of the multiplayer standings open "everything that counted" for their question (18 Nov 2026).
// The squares are drawn by drawStandings (lobbyui.ts) from the same numbers: x = 930 + 40 + 17 * question, y = 218 + 68 * player + 14, 12 x 12 pixels.

describe('the squares of the final standings', () => {
  it('finds the question under the pointer, in any player\'s row', () => {
    for (let k = 0; k < 3; k++) for (let i = 0; i < 7; i++) expect(standingsSquareAt(3, { x: 930 + 40 + 17 * i + 6, y: 218 + 68 * k + 14 + 6 })).toBe(i)
  })
  it('gives -1 away from the squares', () => {
    expect(standingsSquareAt(2, { x: 100, y: 100 })).toBe(-1)
    expect(standingsSquareAt(2, { x: 930 + 40 + 17 * 7 + 20, y: 218 + 14 + 6 })).toBe(-1)   // right of the last square
    expect(standingsSquareAt(2, { x: 930 + 40 + 6, y: 218 + 68 * 2 + 14 + 6 })).toBe(-1)     // the row of a player who is not there
  })
})
