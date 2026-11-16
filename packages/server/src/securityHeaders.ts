import type { MiddlewareHandler } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

/**
 * What a page of this site may load. Everything the game uses comes from the same address (its script, pictures, fonts, the API and the
 * multiplayer stream), so nothing else is allowed. That means that even if a way to inject a script into a page were ever found, the
 * browser would refuse to run it or to send anything to another site. The one loosening is `'unsafe-inline'` for styles: the page has a
 * small inline style block and the game sets style attributes (a script cannot run from a style).
 * test/security.test.ts holds the headers to this list; tools/browser-test/csp.cjs plays the game and fails on any refusal.
 */
export const CSP = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", 'data:', 'blob:'],
  fontSrc: ["'self'"],
  connectSrc: ["'self'"],
  mediaSrc: ["'self'", 'blob:'],
  workerSrc: ["'self'", 'blob:'],
  objectSrc: ["'none'"],
  baseUri: ["'none'"],
  formAction: ["'self'"],
  frameAncestors: ["'none'"],
}

/** the browser features the game never uses are switched off for the page */
const OFF: [] = []
export const PERMISSIONS = { camera: OFF, microphone: OFF, geolocation: OFF, payment: OFF, usb: OFF, serial: OFF, bluetooth: OFF, midi: OFF, hid: OFF, displayCapture: OFF, accelerometer: OFF, gyroscope: OFF, magnetometer: OFF }

/** every response: HTTPS only (HSTS), no sniffing, no framing, no referrer, the policy above, and the unused browser features off */
export function securityHeaders(): MiddlewareHandler {
  return secureHeaders({ contentSecurityPolicy: CSP, permissionsPolicy: PERMISSIONS, xFrameOptions: 'DENY' })
}
