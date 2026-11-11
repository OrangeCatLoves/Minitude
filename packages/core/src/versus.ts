/**
 * Multiplayer ("versus"): rooms of 2 to 4 players who answer the same seven questions at the same time.
 * These are the shapes the server sends and the browser reads. Nothing here says how answers are checked.
 */
import type { Question } from './types'

export const VERSUS_MAX_PLAYERS = 4
export const VERSUS_MIN_PLAYERS = 2
export const NAME_MIN = 2
export const NAME_MAX = 16
/** room codes: five letters and digits without the look-alikes (no 0 O 1 I L) */
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const CODE_LENGTH = 5

export type Visibility = 'private' | 'public'
/** waiting = in the room, not started; playing = a match is on; finished = the match is over (the room stays for a rematch) */
export type RoomStatus = 'waiting' | 'playing' | 'finished'

export const normaliseCode = (s: string): string => s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH)
export const isCode = (s: string): boolean => s.length === CODE_LENGTH && [...s].every((ch) => CODE_ALPHABET.includes(ch))

/** What a player may be called: tidied (no double spaces), 2 to 16 characters, letters, digits, spaces and a few marks. Too long is refused, not cut. The server adds a word filter. */
export function tidyName(raw: string): string {
  return raw.normalize('NFC').replace(/\s+/g, ' ').trim()
}
export const NAME_OK = /^[\p{L}\p{N}][\p{L}\p{N} _.'!-]*$/u

export interface VPlayer {
  seat: number
  name: string
  host: boolean
  /** has a live connection right now */
  connected: boolean
  /** left the match (closed the page for too long): the rest of the questions score 0 */
  gone: boolean
}

/** the room as one player sees it (`you` is that player's seat) */
export interface VRoom {
  code: string
  visibility: Visibility
  status: RoomStatus
  players: VPlayer[]
  you: number
}

/** a public room in the list of rooms that anyone can join */
export interface VPublicRoom {
  code: string
  host: string
  players: number
  max: number
}

/** A player's result for one round as the OTHER players see it while the round is on: the rarity and points, never the answer. */
export interface VAnswered {
  round: number
  seat: number
  /** the time ran out (or the player left) without a valid answer */
  miss: boolean
  tier: number | null
  points: number
}

export interface VRoundStart {
  round: number
  count: number
  seconds: number
  question: Question
}

/** a round's results once it is over: now the answers are shown */
export interface VRoundItem {
  seat: number
  miss: boolean
  tier: number | null
  points: number
  answer: string | null
}
export interface VRoundEnd {
  round: number
  items: VRoundItem[]
  /** running totals after this round */
  totals: { seat: number; total: number }[]
  last: boolean
}

export interface VStanding {
  seat: number
  name: string
  total: number
  /** 1 = best; players with equal totals share a rank */
  rank: number
  items: { miss: boolean; tier: number | null; points: number; answer: string | null }[]
}
export interface VMatchEnd {
  standings: VStanding[]
}

/** everything a player needs to pick up the match from here (sent when a connection opens or comes back) */
export interface VSync {
  room: VRoom
  /** null before the first question */
  round: null | {
    round: number
    count: number
    seconds: number
    /** answering = the question is on; between = the round is over and the players are watching their results */
    phase: 'answering' | 'between'
    /** the prompt, only while this player has not yet had it (answering) */
    question: Question | null
    secondsLeft: number
    /** who has answered so far this round (no answer texts) */
    answered: VAnswered[]
  }
  totals: { seat: number; total: number }[]
  /** rounds already over, oldest first */
  history: VRoundEnd[]
  end: VMatchEnd | null
}

/** every message the server pushes (the `type` is also the SSE event name) */
export type VEvent =
  | { type: 'sync'; sync: VSync }
  | { type: 'room'; room: VRoom }
  | { type: 'roundStart'; start: VRoundStart }
  | { type: 'answered'; answered: VAnswered }
  | { type: 'roundEnd'; end: VRoundEnd }
  | { type: 'matchEnd'; end: VMatchEnd }
  | { type: 'closed'; reason: string }

export interface VJoined {
  room: VRoom
}
