import { describe, expect, it } from 'vitest'
import {
  addDays, dayNumber, formatCountdown, msToReset, nextRecord, percentBeaten, shareText, standingsLines, streakOf, utcDay, type RunRecord,
} from '../src'

describe('the UTC day', () => {
  it('changes at 00:00 UTC, which is 08:00 in Singapore', () => {
    expect(utcDay(Date.parse('2026-10-29T23:59:59.999Z'))).toBe('2026-10-29')
    expect(utcDay(Date.parse('2026-10-30T00:00:00.000Z'))).toBe('2026-10-30')
    // 07:59 Singapore time is still yesterday's daily
    expect(utcDay(Date.parse('2026-10-30T07:59:00+08:00'))).toBe('2026-10-29')
    expect(utcDay(Date.parse('2026-10-30T08:00:00+08:00'))).toBe('2026-10-30')
  })
  it('counts the time to the next change', () => {
    expect(msToReset(Date.parse('2026-10-29T23:00:00Z'))).toBe(3_600_000)
    expect(msToReset(Date.parse('2026-10-30T00:00:00Z'))).toBe(86_400_000)
    expect(msToReset(Date.parse('2026-12-31T12:00:00Z'))).toBe(12 * 3_600_000)
  })
  it('adds days across month and year ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
  it('numbers days from the epoch day', () => {
    expect(dayNumber('2026-11-01', '2026-11-01')).toBe(1)
    expect(dayNumber('2026-11-01', '2026-11-02')).toBe(2)
    expect(dayNumber('2026-11-01', '2027-01-01')).toBe(62)
  })
})

describe('streaks', () => {
  it('counts days in a row ending today', () => {
    expect(streakOf(['2026-10-27', '2026-10-28', '2026-10-29'], '2026-10-29')).toBe(3)
  })
  it('stays alive through today until the day ends', () => {
    expect(streakOf(['2026-10-27', '2026-10-28'], '2026-10-29')).toBe(2)
  })
  it('breaks after a missed day', () => {
    expect(streakOf(['2026-10-26', '2026-10-27'], '2026-10-29')).toBe(0)
    expect(streakOf(['2026-10-25', '2026-10-27', '2026-10-29'], '2026-10-29')).toBe(1)
  })
  it('does not care about order or repeats and nothing gives 0', () => {
    expect(streakOf(['2026-10-29', '2026-10-28', '2026-10-28'], '2026-10-29')).toBe(2)
    expect(streakOf([], '2026-10-29')).toBe(0)
  })
})

describe('words about the standings', () => {
  it('shows rank and a percentage once enough people played', () => {
    const s = { players: 200, rank: 15, below: 185, best: 640 }
    expect(percentBeaten(s)).toBe(92)
    expect(standingsLines(s)).toEqual(['RANK 15 OF 200', 'BETTER THAN 92% OF PLAYERS'])
  })
  it('does not show a percentage for a handful of players', () => {
    expect(standingsLines({ players: 1, rank: 1, below: 0, best: 100 })).toEqual(['YOU ARE THE FIRST TODAY'])
    expect(standingsLines({ players: 6, rank: 2, below: 4, best: 100 })).toEqual(['6 PLAYERS SO FAR'])
  })
  it('rounds the percentage down', () => {
    expect(percentBeaten({ players: 30, rank: 2, below: 29, best: 1 })).toBe(96)
  })
})

describe('countdown and share text', () => {
  it('formats HH:MM:SS and rounds up so it never shows 00:00:00 early', () => {
    expect(formatCountdown(3_661_000)).toBe('01:01:01')
    expect(formatCountdown(1)).toBe('00:00:01')
    expect(formatCountdown(0)).toBe('00:00:00')
    expect(formatCountdown(-5)).toBe('00:00:00')
  })
  it('puts the daily number in the share text and nothing else changes', () => {
    const recs: RunRecord[] = []
    for (const t of [1, 2, null, 5, 0, 3, 4]) recs.push(nextRecord(recs, t))
    const solo = shareText(recs)
    const daily = shareText(recs, 12)
    expect(solo.startsWith('MINITUDE\n')).toBe(true)
    expect(daily.startsWith('MINITUDE DAILY #12\n')).toBe(true)
    expect(daily.split('\n').slice(1)).toEqual(solo.split('\n').slice(1))
    // second line is only coloured squares: no answer text can leak
    expect(daily.split('\n')[1]).toBe('🟩🟦⬛🟥⬜🟪🟧')
  })
})
