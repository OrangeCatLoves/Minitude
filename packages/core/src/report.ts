import { fmtSize } from './format'
import { MAX_POINTS_DISPLAY } from './consts'
import { sizeOfU, PLANCK_POINTS, N_WORLDS, stageOfPoints } from './scoring'
import { isPerfect, pointsToPlanck, type RunRecord, totalPoints } from './run'

/** [upper bound in metres, sentence]. The first row whose bound is above the size is used; every sentence is true for any size below its bound. */
const COMPARE: [number, string][] = [
  [1.7e-20, 'Smaller than any experiment has looked.'],
  [2e-19, 'About as small as the LHC can look.'],
  [1.7e-15, 'Smaller than a proton.'],
  [1.7e-14, "About the size of an atom's nucleus."],
  [1e-13, 'Thousands of times smaller than an atom.'],
  [1e-12, 'Hundreds of times smaller than an atom.'],
  [1e-11, 'Tens of times smaller than an atom.'],
  [1e-10, 'Smaller than most atoms.'],
  [2e-9, 'Smaller than a DNA strand is wide.'],
  [1.5e-8, 'Smaller than almost any virus.'],
  [5e-7, 'Smaller than a typical bacterium.'],
  [7e-6, 'Smaller than a red blood cell.'],
  [1.7e-5, 'Smaller than a human hair is wide.'],
  [3e-4, 'Smaller than a grain of table salt.'],
  [2e-3, 'Smaller than a grain of rice.'],
]

export function compareLine(totalPts: number, sizeM: number): string {
  if (totalPts > PLANCK_POINTS) return 'Past the point where size means anything.'
  if (totalPts === PLANCK_POINTS) return 'About one Planck length.'
  for (const [bound, line] of COMPARE) if (sizeM < bound) return line
  return 'Barely smaller than when you started.'
}

export interface ReportData {
  total: number
  bigSize: string
  compare: string
  worldLine: string
  extraLine: string | null
  perfect: boolean
}

export function buildReport(recs: readonly RunRecord[]): ReportData {
  const total = totalPoints(recs)
  const last = recs[recs.length - 1]
  const u = last ? last.u1 : 0
  const size = sizeOfU(u)
  const stage = stageOfPoints(total)
  const past = total > PLANCK_POINTS
  const bigSize = past ? '< ' + fmtSize(sizeOfU(35)) : fmtSize(size)
  const worldLine = `${total} / ${MAX_POINTS_DISPLAY} points · ` + (stage.worldNo ? `world ${stage.worldNo} of ${N_WORLDS}` : 'unexplored')
  let extraLine: string | null = null
  if (past) extraLine = `${total - PLANCK_POINTS} points past the edge`
  else if (stage.kind === 'unexplored') extraLine = `Planck Foam was ${pointsToPlanck(total)} points away`
  return { total, bigSize, compare: compareLine(total, size), worldLine, extraLine, perfect: isPerfect(recs) }
}

const SQUARES = ['⬜', '🟩', '🟦', '🟪', '🟧', '🟥']

/** A spoiler-free result for sharing: tier colours only, no answers. Pass the daily number for a daily run. */
export function shareText(recs: readonly RunRecord[], dailyNumber?: number): string {
  const rep = buildReport(recs)
  const row = recs.map((r) => (r.miss ? '⬛' : SQUARES[r.tier])).join('')
  const where = stageOfPoints(rep.total)
  const place = where.worldNo ? `world ${where.worldNo}` : 'unexplored'
  const title = dailyNumber ? `MINITUDE DAILY #${dailyNumber}` : 'MINITUDE'
  return `${title}\n${row}\n${rep.total} pts · ${rep.bigSize} · ${place}`
}
