import { statfsSync } from 'node:fs'

/**
 * A full disk stops SQLite from writing, and then the whole game stops (the Daily cannot be saved either). Anyone on the internet can
 * ask the server to start runs, so when the disk is nearly full the server says "busy" to the things that only add rows (new solo runs)
 * and keeps the room that is left for what matters (a Daily in progress, the nightly backup).
 */

/** below this much free space a new solo run is refused */
export const SOLO_MIN_FREE_BYTES = 150 * 1024 * 1024
/** below this much free space a new Daily run is refused too */
export const DAILY_MIN_FREE_BYTES = 40 * 1024 * 1024
/** the nightly backup is only made when, after it, at least this much would still be free */
export const BACKUP_MIN_SPARE_BYTES = 60 * 1024 * 1024

/** bytes still free for ordinary use on the disk that holds `path` (a folder or file); Infinity when that cannot be told (a database in memory) */
export function freeBytesOf(path: string): number {
  try {
    const s = statfsSync(path)
    return Number(s.bavail) * Number(s.bsize)
  } catch {
    return Infinity
  }
}
