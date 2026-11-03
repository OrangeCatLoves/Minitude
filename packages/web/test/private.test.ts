import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// How answers are checked (which model, whether there is one, a switch between models) is not for players to see. The game's own code
// must not name any of it, so nothing can end up on screen by accident.
describe('the game never names the model behind the answer checker', () => {
  const dir = join(__dirname, '..', 'src')
  const files = readdirSync(dir).filter((f) => f.endsWith('.ts'))
  it('has source files to look at', () => { expect(files.length).toBeGreaterThan(5) })
  for (const f of files) {
    it(`${f} names no model or provider`, () => {
      expect(readFileSync(join(dir, f), 'utf8')).not.toMatch(/gemini|fallback model|failover|anthropic|openai|\bllm\b/i)
    })
  }
})
