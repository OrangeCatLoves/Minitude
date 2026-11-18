/**
 * Where the final standings of a multiplayer match are drawn (lobbyui.ts `drawStandings`) and which square the pointer is on. No DOM here, so a test
 * can use it. The coloured squares of a player's row open "everything that counted" for their question (18 Nov 2026).
 */
import { RUN_LENGTH } from '@minitude/core'

/** left edge of the standings panel */
export const STANDINGS_X0 = 930
/** top of the first player's row, and the height of a row */
export const STANDINGS_Y0 = 218
export const STANDINGS_ROW = 68
/** the squares: first one at x0 + 40, one every STEP pixels, SIZE pixels wide and tall, SQUARE_DY below the row's top */
export const SQUARE_X = 40
export const SQUARE_STEP = 17
export const SQUARE_SIZE = 12
export const SQUARE_DY = 14

/** which question (0 to 6) the pointer is on in the squares of any of `players` rows, or -1 */
export function standingsSquareAt(players: number, p: { x: number; y: number }): number {
  for (let k = 0; k < players; k++) {
    const y = STANDINGS_Y0 + k * STANDINGS_ROW + SQUARE_DY
    for (let i = 0; i < RUN_LENGTH; i++) {
      const x = STANDINGS_X0 + SQUARE_X + i * SQUARE_STEP
      if (p.x >= x - 2 && p.x <= x + SQUARE_SIZE + 2 && p.y >= y - 2 && p.y <= y + SQUARE_SIZE + 2) return i
    }
  }
  return -1
}
