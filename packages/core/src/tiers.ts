export type RGB = [number, number, number]

export interface Tier {
  name: string
  points: number
  /** card background / text / edge colours (the edge colour is the tier's identity colour everywhere in the UI) */
  bg: RGB
  fg: RGB
  edge: RGB
  /** the divide-by stamp for a dive made of this tier's points while still inside worlds 1 to 20 (20 points = 10x smaller) */
  factor: string
  /** one-line meaning of the tier */
  sub: string
}

const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]

/** Six rarity tiers. Index 0..5 = Common..Mythic. Points are confirmed by the player; names other than Common are proposals. */
export const TIERS: Tier[] = [
  { name: 'COMMON', points: 10, bg: hex('#1e2538'), fg: hex('#cdd6ee'), edge: hex('#9aa6bf'), factor: '÷ 3', sub: 'Almost everyone says this one.' },
  { name: 'UNCOMMON', points: 20, bg: hex('#0e3a22'), fg: hex('#8dffb4'), edge: hex('#46d078'), factor: '÷ 10', sub: 'Plenty of people know it, fewer say it.' },
  { name: 'RARE', points: 40, bg: hex('#0c2a52'), fg: hex('#9ad8ff'), edge: hex('#4fc3ff'), factor: '÷ 100', sub: 'Only a few players say this.' },
  { name: 'EXOTIC', points: 60, bg: hex('#2a1850'), fg: hex('#d8bcff'), edge: hex('#b583ff'), factor: '÷ 1,000', sub: 'Very few players think of this.' },
  { name: 'LEGENDARY', points: 80, bg: hex('#4a2c00'), fg: hex('#ffd488'), edge: hex('#ffb23f'), factor: '÷ 10,000', sub: 'Far less familiar than kiwi or ostrich.' },
  { name: 'MYTHIC', points: 100, bg: hex('#50102e'), fg: hex('#ffa8d6'), edge: hex('#ff5fb0'), factor: '÷ 100,000', sub: 'Almost nobody says this.' },
]

export const TIER_POINTS = TIERS.map((t) => t.points)
export const RUN_LENGTH = 7
export const MAX_POINTS = RUN_LENGTH * 100
