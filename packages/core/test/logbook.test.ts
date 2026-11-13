import { describe, expect, it } from 'vitest'
import { emptyLogbook, logbookStats, parseLogbook, recordRun, serializeLogbook, LOGBOOK_DAYS } from '../src'

describe('the logbook', () => {
  it('starts empty and shows zeros', () => {
    expect(logbookStats(emptyLogbook(), '2026-11-13')).toEqual({ streak: 0, played: 0, avg: 0, best: 0 })
  })

  it('counts runs, averages them (rounded) and remembers the best', () => {
    let log = recordRun(emptyLogbook(), 111, '2026-11-13')
    log = recordRun(log, 155, '2026-11-13')
    // the example the owner gave: streak 1, played 2, avg 133, best 155
    expect(logbookStats(log, '2026-11-13')).toEqual({ streak: 1, played: 2, avg: 133, best: 155 })
  })

  it('grows the streak by one for each day in a row, and two runs in a day count once', () => {
    let log = emptyLogbook()
    for (const d of ['2026-11-10', '2026-11-11', '2026-11-11', '2026-11-12']) log = recordRun(log, 50, d)
    expect(logbookStats(log, '2026-11-12').streak).toBe(3)
    expect(logbookStats(log, '2026-11-12').played).toBe(4)
  })

  it('keeps the streak alive through the day after, and ends it after a missed day', () => {
    const log = recordRun(recordRun(emptyLogbook(), 10, '2026-11-10'), 10, '2026-11-11')
    expect(logbookStats(log, '2026-11-11').streak).toBe(2)
    expect(logbookStats(log, '2026-11-12').streak).toBe(2)   // today not played yet: yesterday still counts
    expect(logbookStats(log, '2026-11-13').streak).toBe(0)   // a whole day was missed
  })

  it('a gap restarts the streak at one', () => {
    let log = recordRun(emptyLogbook(), 10, '2026-11-01')
    log = recordRun(log, 10, '2026-11-05')
    expect(logbookStats(log, '2026-11-05').streak).toBe(1)
  })

  it('never goes below zero or takes a bad number', () => {
    expect(recordRun(emptyLogbook(), -5, '2026-11-13').sum).toBe(0)
    expect(recordRun(emptyLogbook(), Number.NaN, '2026-11-13').best).toBe(0)
    expect(recordRun(emptyLogbook(), 12.6, '2026-11-13').best).toBe(13)
  })

  it('keeps only the most recent days', () => {
    let log = emptyLogbook()
    let d = '2025-01-01'
    for (let i = 0; i < LOGBOOK_DAYS + 25; i++) { log = recordRun(log, 1, d); d = nextDay(d) }
    expect(log.days.length).toBe(LOGBOOK_DAYS)
    expect(log.days[log.days.length - 1] > log.days[0]).toBe(true)
  })

  it('survives a round trip through storage text', () => {
    const log = recordRun(recordRun(emptyLogbook(), 120, '2026-11-12'), 80, '2026-11-13')
    expect(parseLogbook(serializeLogbook(log))).toEqual(log)
  })

  it('starts again instead of trusting damaged storage', () => {
    for (const bad of [null, '', 'not json', '[]', '{"played":"2"}', '{"played":-1,"sum":5,"best":5}', '{"played":2,"sum":10,"best":99}']) {
      expect(parseLogbook(bad)).toEqual(emptyLogbook())
    }
  })

  it('drops bad days but keeps the good numbers', () => {
    const log = parseLogbook('{"played":3,"sum":300,"best":150,"days":["2026-11-12","nope","2026-13-45","2026-11-12",7]}')
    expect(log.days).toEqual(['2026-11-12'])
    expect(log).toMatchObject({ played: 3, sum: 300, best: 150 })
  })
})

function nextDay(day: string): string {
  return new Date(Date.parse(day) + 86_400_000).toISOString().slice(0, 10)
}
