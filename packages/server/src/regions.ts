/**
 * Which part of the world a visit came from, judged ONLY from the time zone the visitor's browser reports ("Asia/Singapore").
 * No address is looked up and none is kept (docs/TRAFFIC.md). It is rough: a visitor on a VPN, or travelling, shows as their device's zone.
 * That is good enough to tell a Singapore-heavy game from a US-and-UK-heavy one, which is what the owner needs to choose an ad network.
 */

const SHAPE = /^[A-Za-z_]+(\/[A-Za-z0-9_+-]+){0,2}$/

/** whether the runtime itself accepts this name as a time zone (it also accepts the older names browsers still report, "Asia/Calcutta"): made-up names are refused, so the table of visits cannot be filled with them */
const isRealZone = (() => {
  const seen = new Map<string, boolean>()
  return (z: string): boolean => {
    const known = seen.get(z)
    if (known !== undefined) return known
    let ok = false
    try { new Intl.DateTimeFormat('en-US', { timeZone: z }); ok = true } catch { ok = false }
    if (seen.size < 2000) seen.set(z, ok)
    return ok
  }
})()

/**
 * What is stored for a reported time zone: the zone itself when it is a real one, 'UTC' for UTC and its relatives, 'other' for a name that has
 * the right shape but is not a zone, and 'unknown' when nothing usable was sent.
 */
export function cleanZone(raw: unknown): string {
  if (typeof raw !== 'string') return 'unknown'
  const z = raw.trim()
  if (!z || z.length > 40 || !SHAPE.test(z)) return 'unknown'
  if (z === 'UTC' || z === 'GMT' || z.startsWith('Etc/')) return 'UTC'
  return isRealZone(z) ? z : 'other'
}

const NORTH_AMERICA = new Set([
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Phoenix', 'America/Anchorage', 'America/Detroit', 'America/Boise',
  'America/Juneau', 'America/Nome', 'America/Sitka', 'America/Yakutat', 'America/Adak', 'America/Menominee', 'America/Metlakatla',
  'America/Toronto', 'America/Vancouver', 'America/Edmonton', 'America/Winnipeg', 'America/Halifax', 'America/St_Johns', 'America/Regina', 'America/Whitehorse',
  'America/Moncton', 'America/Glace_Bay', 'America/Goose_Bay', 'America/Iqaluit', 'America/Rankin_Inlet', 'America/Resolute', 'America/Swift_Current', 'America/Yellowknife',
  'America/Dawson', 'America/Dawson_Creek', 'America/Fort_Nelson', 'America/Creston', 'America/Cambridge_Bay', 'America/Inuvik', 'America/Thunder_Bay', 'America/Nipigon',
  'America/Rainy_River', 'America/Atikokan', 'America/Blanc-Sablon', 'Pacific/Honolulu',
])
const UK_IE = new Set(['Europe/London', 'Europe/Dublin', 'Europe/Belfast', 'Europe/Jersey', 'Europe/Guernsey', 'Europe/Isle_of_Man'])
const ANZ = new Set(['Pacific/Auckland', 'Pacific/Chatham'])

/** the areas of the report, in the order they are shown */
export const AREAS_SHOWN = [
  'Singapore',
  'US and Canada',
  'UK and Ireland',
  'Australia and New Zealand',
  'Rest of Asia',
  'Rest of Europe',
  'Latin America',
  'Middle East and Africa',
  'Other',
  'Unknown',
] as const
export type Area = (typeof AREAS_SHOWN)[number]

/** the area a stored zone belongs to */
export function areaOf(zone: string): Area {
  if (zone === 'unknown') return 'Unknown'
  if (zone === 'Asia/Singapore') return 'Singapore'
  if (NORTH_AMERICA.has(zone) || zone.startsWith('America/Indiana/') || zone.startsWith('America/Kentucky/') || zone.startsWith('America/North_Dakota/')) return 'US and Canada'
  if (UK_IE.has(zone)) return 'UK and Ireland'
  if (zone.startsWith('Australia/') || ANZ.has(zone)) return 'Australia and New Zealand'
  if (zone.startsWith('America/')) return 'Latin America'
  if (zone.startsWith('Europe/')) return 'Rest of Europe'
  if (zone.startsWith('Africa/') || /^Asia\/(Dubai|Riyadh|Kuwait|Qatar|Bahrain|Muscat|Baghdad|Tehran|Jerusalem|Beirut|Amman|Damascus|Aden|Tel_Aviv)$/.test(zone)) return 'Middle East and Africa'
  if (zone.startsWith('Asia/')) return 'Rest of Asia'
  return 'Other'
}

/** US, Canada, UK, Ireland, Australia and New Zealand: the markets the big ad networks pay most for (their own lists differ; this is a guide, not their rule) */
export const GUIDE_PREMIUM: ReadonlySet<Area> = new Set<Area>(['US and Canada', 'UK and Ireland', 'Australia and New Zealand'])
