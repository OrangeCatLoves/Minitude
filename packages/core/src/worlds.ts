import type { RGB } from './tiers'
import { isVoidSlot, VOID_FIRST_SLOT, PLANCK_SLOT, worldNoOfSlot } from './scoring'

export type WorldKind = 'SEEN' | 'MEASURED' | 'LIMIT' | 'THEORY' | 'NONE'

export interface World {
  /** picture slot (0..19 worlds 1..20, 20 = unexplored, 35 = Planck Foam) */
  slot: number
  n: number | null
  name: string
  desc: string
  kind: WorldKind
  label: string
}

const w = (slot: number, name: string, desc: string, kind: WorldKind, label: string): World => ({ slot, n: worldNoOfSlot(slot), name, desc, kind, label })

/** The 21 named worlds plus the unexplored stretch. Texts and honesty labels are the ones approved in the v5 walkthrough. */
export const WORLDS: World[] = [
  w(0, 'THE ROOM', 'Start here. A quiet evening room, and you at normal size.', 'SEEN', 'NAKED EYE'),
  w(1, 'THE BOOKSHELF', 'Book spines stand like tall walls, with gold lettering on every one.', 'SEEN', 'NAKED EYE'),
  w(2, 'THE PILE', 'Each carpet tuft is a tower, and a crumb lies like a fallen log.', 'SEEN', 'NAKED EYE'),
  w(3, 'YARN ROPES', 'Strands of yarn rise as thick twisted ropes. A dust ball rolls past.', 'SEEN', 'NAKED EYE'),
  w(4, 'THREAD FOREST', 'Fabric fibres rise like cables. Specks of dust drift by like moons.', 'SEEN', 'NAKED EYE'),
  w(5, 'DROPLET WORLD', 'One drop of water, as big as a hill, with tiny life swimming inside.', 'SEEN', 'LIGHT MICROSCOPE'),
  w(6, 'BACTERIA GARDEN', 'Rod-shaped cells lie like logs, and whip-like tails wave through the water.', 'SEEN', 'LIGHT MICROSCOPE'),
  w(7, 'GERM REEF', 'Bacteria loom like islands. Viruses drift past like landers.', 'SEEN', 'ELECTRON MICROSCOPE'),
  w(8, 'PROTEIN FACTORY', 'Ribosomes bob along a chain of beads, building proteins.', 'SEEN', 'ELECTRON MICROSCOPE'),
  w(9, 'DNA FOREST', 'Spiral towers with coloured rungs fill the horizon.', 'MEASURED', 'X-RAY DIFFRACTION'),
  w(10, 'CRYSTAL LATTICE', 'As small as an atom. You stand on one, in a glowing grid.', 'SEEN', 'TUNNELLING MICROSCOPE'),
  w(11, 'ELECTRON CLOUDS', 'Glowing lobes of probability float over a flat platform.', 'MEASURED', 'BOHR RADIUS'),
  w(12, 'GAMMA SEA', 'Gamma rays from radioactive atoms have waves about as long as you are tall.', 'MEASURED', 'CAESIUM-137, 662 KEV'),
  w(13, 'THE GREAT EMPTY', 'Faint orbits sweep around a speck of a nucleus, far away.', 'MEASURED', 'RUTHERFORD 1911'),
  w(14, 'NUCLEUS CITY', 'A tight cluster of particles packs together like a city block.', 'MEASURED', 'NUCLEAR SIZES'),
  w(15, 'INSIDE THE PROTON', 'Three quarks, tied together by glowing strings.', 'MEASURED', 'PROTON RADIUS'),
  w(16, 'FIRST QUARKS', 'Fast electrons bounce off tiny hard points inside a proton.', 'MEASURED', 'SLAC 1968'),
  w(17, 'SHORT REACH', 'The weak force reaches only about 1/700th of a proton.', 'MEASURED', 'W BOSON MASS'),
  w(18, 'RIPPLE SEA', "A passing gravitational wave stretched LIGO's arms by about two of you.", 'MEASURED', 'LIGO 2015'),
  w(19, 'COLLISION HALL', 'The LHC reaches this small. Quarks still show no parts inside.', 'MEASURED', 'LHC 13.6 TEV'),
]

export const UNEXPLORED: World = {
  slot: VOID_FIRST_SLOT,
  n: null,
  name: 'UNEXPLORED',
  desc: 'No experiment has looked this small. Nothing is known to exist here.',
  kind: 'NONE',
  label: 'NO DATA · NOTHING MEASURED HERE',
}

export const PLANCK_FOAM: World = w(PLANCK_SLOT, 'PLANCK FOAM', "About the Planck length, where physicists expect today's theories to stop working.", 'THEORY', 'PLANCK LENGTH')

/** the world drawn for a picture slot (every unexplored slot returns UNEXPLORED) */
export function worldOfSlot(slot: number): World {
  if (isVoidSlot(slot)) return UNEXPLORED
  if (slot === PLANCK_SLOT) return PLANCK_FOAM
  return WORLDS[Math.max(0, Math.min(19, slot))]
}

/** Per-slot accent colours were measured from the pictures (dominant hue) and are loaded from assets/manifest.json by the web app. */
export type AccentTable = Record<string, RGB>
