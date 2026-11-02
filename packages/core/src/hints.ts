/** Copy for the unexplored stretch ("edging") and for answers made after Planck Foam has been reached. */

/** second landing in a row inside Unexplored */
export const VOID_HINT_1 = 'Something is getting closer.'
/** third landing or more in a row */
export const VOID_HINT_2 = 'It is very close.'

export function voidHintLine(level: 0 | 1 | 2): string | null {
  return level === 1 ? VOID_HINT_1 : level === 2 ? VOID_HINT_2 : null
}

/** First answer after the finale: one of these, picked at random (never the one shown last time). */
export const POST_FIRST_LINES = [
  'The numbers stop making sense here.',
  'Even the word “small” has stopped working.',
  'You have gone past the smallest size we can talk about.',
]
export const POST_FIRST_SMALL = 'Our physics stops here. Keep going.'
/** Second answer after the finale. */
export const POST_SECOND_MAIN = 'There is nothing left to measure you with.'
export const POST_SECOND_SMALL = 'You are still shrinking.'

/** Index of the first-line variant to show: random, but different from `last` when there is more than one. */
export function pickPostFirst(last: number | null, rand: () => number = Math.random): number {
  const n = POST_FIRST_LINES.length
  let k = Math.floor(rand() * n)
  if (last !== null && n > 1 && k === last) k = (k + 1 + Math.floor(rand() * (n - 1))) % n
  return k
}

export function postLines(post: 1 | 2, firstVariant: number): { main: string; small: string } {
  return post === 1
    ? { main: POST_FIRST_LINES[firstVariant % POST_FIRST_LINES.length], small: POST_FIRST_SMALL }
    : { main: POST_SECOND_MAIN, small: POST_SECOND_SMALL }
}
