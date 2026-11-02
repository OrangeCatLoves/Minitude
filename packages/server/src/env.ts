import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Reads KEY=VALUE lines from `.env` files into process.env (never overriding a variable that is already set).
 * Looked for in packages/server/.env, then in the repository root. `.env` is git-ignored: keys go there, never in code.
 */
export function loadEnv(): string[] {
  const here = dirname(fileURLToPath(import.meta.url))
  const loaded: string[] = []
  for (const file of [join(here, '..', '.env'), join(here, '..', '..', '..', '.env')]) {
    if (!existsSync(file)) continue
    for (const raw of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq < 1) continue
      const key = line.slice(0, eq).trim()
      let val = line.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1)
      if (process.env[key] === undefined) process.env[key] = val
    }
    loaded.push(file)
  }
  return loaded
}
