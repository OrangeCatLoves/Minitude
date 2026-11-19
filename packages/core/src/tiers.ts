export type RGB = [number, number, number]

export interface Tier {
  name: string
  points: number
  /** card background / text / edge colours (the edge colour is the tier's identity colour everywhere in the UI) */
  bg: RGB
  fg: RGB
  edge: RGB
  /** the divide-by stamp for a dive made of this tier's points while still inside worlds 1 to 20 (30 points = 10x smaller; the stamp is rounded) */
  factor: string
  /** one-line meaning of the tier */
  sub: string
}

const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]

/**
 * Seven rarity tiers. Index 0..5 = Common..Mythic, 6 = SINGULARITY (the one hand-picked gem answer in each question, chosen by the owner on 14 Nov 2026).
 * A gem is not a stored rarity: the database keeps the answer's own tier (0..5) and the answer checker reports tier 6 for the question's gem.
 */
export const TIERS: Tier[] = [
  { name: 'COMMON', points: 20, bg: hex('#1e2538'), fg: hex('#cdd6ee'), edge: hex('#9aa6bf'), factor: '÷ 5', sub: 'Almost everyone says this one.' },
  { name: 'UNCOMMON', points: 30, bg: hex('#0e3a22'), fg: hex('#8dffb4'), edge: hex('#46d078'), factor: '÷ 10', sub: 'Plenty of people know it, fewer say it.' },
  { name: 'RARE', points: 40, bg: hex('#0c2a52'), fg: hex('#9ad8ff'), edge: hex('#4fc3ff'), factor: '÷ 20', sub: 'Only a few players say this.' },
  { name: 'EXOTIC', points: 60, bg: hex('#2a1850'), fg: hex('#d8bcff'), edge: hex('#b583ff'), factor: '÷ 100', sub: 'Very few players think of this.' },
  { name: 'LEGENDARY', points: 80, bg: hex('#4a2c00'), fg: hex('#ffd488'), edge: hex('#ffb23f'), factor: '÷ 500', sub: 'Far less familiar than kiwi or ostrich.' },
  { name: 'MYTHIC', points: 100, bg: hex('#50102e'), fg: hex('#ffa8d6'), edge: hex('#ff5fb0'), factor: '÷ 2,000', sub: 'Almost nobody says this.' },
  { name: 'SINGULARITY', points: 120, bg: hex('#100a2c'), fg: hex('#f0e8ff'), edge: hex('#c4b0ff'), factor: '÷ 10,000', sub: 'The one gem hidden in each question.' },
]

/** the tier number of a gem, and of Mythic (the best ordinary rarity) */
export const GEM_TIER = 6
export const MYTHIC_TIER = 5

export const TIER_POINTS = TIERS.map((t) => t.points)
export const RUN_LENGTH = 7
export const MAX_POINTS = RUN_LENGTH * Math.max(...TIER_POINTS)
