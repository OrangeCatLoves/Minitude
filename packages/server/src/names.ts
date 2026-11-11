import { NAME_MAX, NAME_MIN, NAME_OK, tidyName } from '@minitude/core'

/**
 * A basic name check for rooms. It is a filter, not a moderator: English only, and a determined person will find a way round it.
 * It does three things: keeps the name short and plain (letters, digits, spaces and a few marks), turns the usual disguises back into
 * letters (5h1t, @ss, f u c k), and refuses a name that contains a blocked word.
 *   ANYWHERE words are blocked wherever they appear inside the name (they are rarely part of an innocent word).
 *   WHOLE words are blocked only when they are a word on their own, so "Cassidy" and "Dickens" are fine but "Dick" is not.
 * To block more, add words to the lists below; they are the only thing to edit.
 */
const ANYWHERE = [
  'fuck', 'shit', 'bitch', 'cunt', 'whore', 'slut', 'nigg', 'fagg', 'asshole', 'bastard', 'twat', 'retard', 'pussy',
  'hitler', 'kkk', 'rapist', 'penis', 'vagina', 'porn', 'masturbat', 'blowjob', 'handjob', 'cumshot', 'dildo',
]
const WHOLE = [
  'dick', 'cock', 'ass', 'arse', 'piss', 'tit', 'tits', 'kike', 'spic', 'chink', 'coon', 'dyke', 'fag', 'homo', 'paki', 'tranny',
  'cum', 'sex', 'anus', 'nazi', 'wank', 'wanker', 'wankers', 'rape', 'rapes', 'boob', 'boobs', 'nude', 'nudes', 'hoe', 'negro', 'gook', 'wop',
]
const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i', '+': 't', '|': 'i' }

/** lower case, disguises turned into letters */
function plain(s: string): string {
  return [...s.normalize('NFKD').toLowerCase()].map((ch) => LEET[ch] ?? ch).join('')
}
/** the same, with accents gone */
function letters(s: string): string {
  return plain(s).replace(/[^a-z]/g, '')
}
/** collapse a letter repeated three or more times ("fuuuuck" -> "fuck") and two or more for the squashed check */
const squeeze = (s: string, keep: number) => s.replace(new RegExp(`([a-z])\\1{${keep},}`, 'g'), (_m, ch: string) => ch.repeat(keep))

export function isBlockedName(name: string): boolean {
  const words = plain(name).split(/[^a-z]+/).filter(Boolean).map((w) => squeeze(w, 2))
  const squashed = squeeze(letters(name), 2)
  for (const w of WHOLE) {
    if (words.includes(w) || squashed === w) return true
  }
  for (const w of ANYWHERE) {
    if (squashed.includes(w) || squeeze(letters(name), 1).includes(w)) return true
  }
  return false
}

export type NameCheck = { ok: true; name: string } | { ok: false; message: string }

export function checkName(raw: unknown): NameCheck {
  if (typeof raw !== 'string') return { ok: false, message: 'Type a name.' }
  const name = tidyName(raw)
  if (name.length < NAME_MIN) return { ok: false, message: `Names have at least ${NAME_MIN} characters.` }
  if (name.length > NAME_MAX || !NAME_OK.test(name)) return { ok: false, message: `Use ${NAME_MIN} to ${NAME_MAX} letters, digits or spaces.` }
  if (isBlockedName(name)) return { ok: false, message: 'Pick another name.' }
  return { ok: true, name }
}
