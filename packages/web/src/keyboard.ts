// The on-screen keyboard of a phone covers the lower part of the screen, and the answer box is drawn at the bottom of the picture.
// This works out how far (in picture pixels) the box has to rise so that it stays above the keyboard, and eases that rise in and out.
// It is pure maths on numbers the browser gives us (the canvas rectangle and the "visual viewport", the part of the page that is
// really visible), so it can be tested without a browser. Game.update() feeds it every frame.

/** the picture is drawn 1280 x 720 whatever size it has on screen */
export const PICTURE_H = 720

/** the canvas as the browser lays it out (CSS pixels, relative to the top of the page) */
export interface CanvasBox { top: number; height: number }
/** the part of the page the player can see, from the visual viewport (top = offsetTop, bottom = offsetTop + height) */
export interface Visible { top: number; bottom: number }

/** air between the lifted block and the keyboard, in screen pixels */
export const KEYBOARD_GAP = 12
/** the visible area must be at least this much shorter than the page to count as a keyboard (the browser's own bars move it by less) */
export const KEYBOARD_MIN = 60

/**
 * How many picture pixels the content must rise so that its lowest line (at picture row `keepBottom`) ends `gap` screen pixels above the
 * bottom of the visible area. 0 when there is no keyboard (the visible area reaches the bottom of the page, `pageBottom`, give or take the
 * browser's own bars) or when the content already fits. `cap` is the most it may rise (so its top stays inside the picture).
 */
export function liftNeeded(canvas: CanvasBox, visible: Visible, pageBottom: number, keepBottom: number, cap: number, gap = KEYBOARD_GAP): number {
  if (!(canvas.height > 0) || !(cap > 0)) return 0
  if (!(pageBottom - visible.bottom >= KEYBOARD_MIN)) return 0
  const scale = canvas.height / PICTURE_H
  const bottom = canvas.top + keepBottom * scale
  const over = bottom + gap - visible.bottom
  if (!(over > 0)) return 0
  return Math.min(cap, over / scale)
}

/**
 * iOS shows a toolbar (previous / next / done) just above its keyboard. In recent versions it floats over the page, and the browser may
 * not shorten the visible area for it, so the answer box has to clear it as well. A real iPhone is the only way to learn which it is, so
 * the allowance can be changed from the address (`?kbgap=0` turns it off, `?kbgap=60` makes it bigger) without a new release.
 */
export const IOS_TOOLBAR = 52

/** extra air above the keyboard, in screen pixels: the iOS toolbar on an iPhone or iPad, nothing elsewhere; `override` is the `kbgap` text from the address */
export function extraGap(userAgent: string, platform: string, touchPoints: number, override: string | null): number {
  if (override !== null && override.trim() !== '') {
    const n = Number(override)
    if (Number.isFinite(n) && n >= 0 && n <= 200) return n
  }
  const ios = /iPhone|iPad|iPod/.test(userAgent) || (platform === 'MacIntel' && touchPoints > 1) // an iPad that asks for the desktop site calls itself a Mac
  return ios ? IOS_TOOLBAR : 0
}

/**
 * Is the keyboard (probably) up? True when the answer field has the focus and the page is not pinch-zoomed (pinching also makes
 * the visible area smaller, and that must not move the box). The size of the visible area decides how far to lift, not this test.
 */
export function keyboardMayBeUp(fieldFocused: boolean, scale: number | undefined): boolean {
  return fieldFocused && (scale === undefined || scale <= 1.02)
}

/** one frame of easing towards the wanted lift: quick at first, no overshoot, and it settles exactly (so the picture is untouched at rest) */
export function easeLift(current: number, target: number, dt: number): number {
  if (Math.abs(target - current) < 0.5) return target
  return current + (target - current) * (1 - Math.exp(-Math.max(0, dt) * 16))
}
