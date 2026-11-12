/** Conservative text normalisation for matching typed answers. Stored answers are keyed by this, so changing it means re-keying the database. */
export function normalize(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(the|a|an) /, '')
}

/** Plain edit distance (an adjacent swap counts as two). Kept for the model prompt and the old trials. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return prev[b.length]
}

/**
 * Edit distance where swapping two neighbouring letters ("brei" for "brie") is ONE slip, the way people actually mistype.
 * Stops as soon as the result is certain to be above `max` and then returns max + 1.
 */
export function editDistance(a: string, b: string, max = Infinity): number {
  if (a === b) return 0
  const la = a.length, lb = b.length
  if (Math.abs(la - lb) > max) return max + 1
  if (!la) return lb
  if (!lb) return la
  let prev2: number[] = []
  let prev = Array.from({ length: lb + 1 }, (_, i) => i)
  for (let i = 1; i <= la; i++) {
    const cur = [i]
    let rowMin = i
    for (let j = 1; j <= lb; j++) {
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1)
      cur[j] = v
      if (v < rowMin) rowMin = v
    }
    if (rowMin > max) return max + 1
    prev2 = prev
    prev = cur
  }
  return prev[lb]
}

/**
 * How many slips we forgive, by how long the typed text is. Generous on purpose ("a letter or two off", like the answer checkers of
 * search sites do): none up to 3 letters, one up to 7, two up to 11, three beyond. A wrong guess costs the player one key press,
 * because a correction is always asked about ("Did you mean ...?") before it counts.
 */
export function typoBudget(len: number): number {
  return len <= 3 ? 0 : len <= 7 ? 1 : len <= 11 ? 2 : 3
}

// ---------------------------------------------------------------------------------------------------------------------------------
// "Same answer written another way": differences that are not misspellings at all (a space or a hyphen, British or American spelling,
// Roman or Arabic numerals, "Mt" for "Mount"). These are accepted without asking. Applied to both sides when comparing; never stored.

const SAME_WORD: Record<string, string> = {
  // British -> American. Whole words only, listed one by one: a general rule ("our" -> "or") would also turn "tour" into "tor".
  defence: 'defense', offence: 'offense', pretence: 'pretense', licence: 'license',
  armour: 'armor', armoured: 'armored', colour: 'color', coloured: 'colored', favourite: 'favorite', favour: 'favor', flavour: 'flavor',
  honour: 'honor', humour: 'humor', labour: 'labor', neighbour: 'neighbor', harbour: 'harbor', behaviour: 'behavior', rumour: 'rumor',
  centre: 'center', theatre: 'theater', metre: 'meter', litre: 'liter', fibre: 'fiber', sceptre: 'scepter', calibre: 'caliber',
  grey: 'gray', aluminium: 'aluminum', tyre: 'tire', mould: 'mold', plough: 'plow', jewellery: 'jewelry', catalogue: 'catalog',
  manoeuvre: 'maneuver', sulphur: 'sulfur', cosy: 'cozy', whisky: 'whiskey', doughnut: 'donut', pyjamas: 'pajamas', travelling: 'traveling',
  // common short forms
  mt: 'mount', st: 'saint', dr: 'doctor', mr: 'mister', mrs: 'missus', jr: 'junior', sr: 'senior', n: 'and', vs: 'versus',
}
const ROMAN: Record<string, string> = {
  i: '1', ii: '2', iii: '3', iv: '4', v: '5', vi: '6', vii: '7', viii: '8', ix: '9', x: '10',
  xi: '11', xii: '12', xiii: '13', xiv: '14', xv: '15', xvi: '16', xvii: '17', xviii: '18', xix: '19', xx: '20',
}

/**
 * A key that is the same for every harmless way of writing one answer. Takes text that has already been through `normalize`.
 * "Wing-back" and "wingback", "Coastal defence ship" and "coastal defense ship", "Pepi II" and "pepi 2", "Mt Etna" and "Mount Etna".
 * A Roman numeral only counts as one when it is the last word of a longer name, so "I Confess" is left alone.
 */
export function looseKey(norm: string): string {
  const words = norm.split(' ').filter(Boolean).map((w) => SAME_WORD[w] ?? w)
  if (words.length > 1) {
    const last = words[words.length - 1]
    if (ROMAN[last]) words[words.length - 1] = ROMAN[last]
  }
  return words.join('')
}
