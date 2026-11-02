export interface Parsed {
  /** words that are not flags: the command, then its arguments */
  words: string[]
  flags: Record<string, string | true>
  /** flags that may be repeated (--category A --category B) */
  repeated: Record<string, string[]>
}

/** Tiny argument reader: `a b --flag value --switch c`. A flag takes the next word as its value unless that word is another flag. */
export function parseArgs(argv: string[]): Parsed {
  const out: Parsed = { words: [], flags: {}, repeated: {} }
  for (let i = 0; i < argv.length; i++) {
    const w = argv[i]
    if (!w.startsWith('--')) { out.words.push(w); continue }
    const name = w.slice(2)
    const next = argv[i + 1]
    if (next !== undefined && !next.startsWith('--')) {
      out.flags[name] = next
      ;(out.repeated[name] ??= []).push(next)
      i++
    } else {
      out.flags[name] = true
    }
  }
  return out
}
