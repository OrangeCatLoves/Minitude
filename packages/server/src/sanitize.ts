/**
 * Text that arrives from the internet is shown in the owner's terminal (the review commands print what players typed). Control
 * characters (an escape code can move the cursor, rewrite the screen or even set the clipboard in some terminals) belong in none of it.
 */

/** the C0 and C1 control characters (tab and newline included) and the two Unicode line separators */
export const CONTROL = new RegExp('[\u0000-\u001f\u007f-\u009f' + String.fromCharCode(0x2028, 0x2029) + ']', 'g')

/** typed text with every control character turned into a space, and the ends trimmed */
export function tidyTyped(raw: string): string {
  return raw.replace(CONTROL, ' ').trim()
}
