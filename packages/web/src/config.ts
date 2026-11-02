import type { RGB } from './util'

export const W = 1280
export const H = 720
export const ROW0 = 60            // the world picture is drawn into buffer rows 60..719 and shown from screen row 0
export const WORLD_ROWS = H - ROW0 // 660
export const FX = 840             // zoom focus in the 720-row buffer: the ground under the explorer's feet
export const FY = 560
export const EXP_H = 200          // explorer height in px
export const OX = 840, OY = 404   // explorer centre on screen
export const FOC: [number, number] = [840, 500]   // zoom focus on screen
export const FEET: [number, number] = [840, 504]
export const CORE: [number, number] = [628, 400]  // the bright core of Planck Foam at rest

export const INK: RGB = [7, 11, 23]
export const SH: RGB = [3, 5, 12]
export const SCRIM: RGB = [4, 7, 18]
export const OFF: RGB = [238, 242, 255]   // the one text colour
export const SOFT: RGB = [163, 176, 214]  // the one dim colour
export const FAINT: RGB = [84, 98, 140]
export const LINE: RGB = [110, 124, 170]
export const OKG: RGB = [141, 255, 180]   // "valid"
export const CYAN: RGB = [91, 224, 255]
export const AMBER: RGB = [255, 200, 87]
export const WHITE: RGB = [255, 255, 255]

export const GEM = [64, 80, 92, 104, 116, 124]
export const HOP = [6, 8, 10, 12, 14, 16]
export const STOP = [0.0, 0.0, 0.0, 0.04, 0.09, 0.13]
export const SHAKE_K = [0.0, 0.0, 2.5, 4.5, 7.0, 10.0]
export const VIG_K = [0.0, 0.0, 0.22, 0.34, 0.42, 0.50]
export const STAMP = [80, 92, 104, 112, 120, 120]
export const TITLES: Record<number, [string, number]> = { 2: ['RARE!', 72], 3: ['EXOTIC!', 84], 4: ['LEGENDARY!', 90], 5: ['MYTHIC!', 104] }
export const TITLE_COL: Record<number, [RGB, RGB, RGB, RGB]> = {
  2: [[205, 240, 255], [79, 195, 255], [8, 34, 74], [79, 195, 255]],
  3: [[240, 224, 255], [181, 131, 255], [38, 16, 82], [181, 131, 255]],
  4: [[255, 244, 200], [255, 178, 63], [74, 40, 0], [255, 178, 63]],
  5: [[255, 236, 248], [255, 95, 176], [80, 16, 46], [255, 95, 176]],
}

// ---- timeline constants (seconds)
export const INTRO = 6.4          // when the first question appears, on the clock that starts at the title screen
export const PRESS_AT = 4.9       // the PLAY button is pressed at this time on that clock
export const INTRO_EXIT = 5.15
export const ROLL_DUR = [1.3, 1.45, 1.6, 1.8, 2.1, 2.5]
export const REV_HOLD = [1.5, 1.8, 2.1, 2.6, 3.1, 3.9]
export const CHARGE = 0.7
export const CARD_LEN = 7.0
export const CARD_GAP = 0.4
export const FINAL_READ = 1.2
export const VOID_HOLD = 1.7
export const HINT_HOLD = 3.1       // a landing inside Unexplored that carries an "edging" line
export const POST_HOLD = 3.4       // a landing after the finale with its lines
export const LAND_HOLD = 1.1       // a landing inside the same world
export const MISS_HOLD = 1.7
export const FIN_DUR = 13.4
export const FIN_CARD_AT = 1.3
export const FIN_CARD_LEN = 9.0
export const REPORT_LEN = 10.5
export const FIN_PTS: [number, number][] = [[0.0, 0.0], [1.2, 0.42], [2.4, 1.42], [4.2, 3.05], [6.4, 3.95], [8.4, 4.35], [10.4, 4.57], [12.4, 4.69], [12.9, 4.76], [13.4, 5.0]]
export const FIN_BEATS = [4.3, 5.55, 6.75, 7.85, 8.85, 9.75, 10.55, 11.25, 11.85]
export const HAND_OFF = 0.72
export const FADE_IN = 0.10
export const FEATHER = 36
