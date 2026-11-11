/** The question clock's rules, shared by solo, daily and multiplayer so they can never drift apart. */

export const QUESTION_SECONDS = 30
/** the browser starts each question's clock this long after the question appears on screen */
export const START_DELAY_MS = 550
/** allowance for network delay: an answer may arrive this late and still count */
export const GRACE_MS = 3000
/** most answers one question accepts (every unknown answer can cost a model call) */
export const MAX_ATTEMPTS_PER_QUESTION = 12
