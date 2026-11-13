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

// The privacy page explains how the game works and what it keeps, and says nothing about how answers are checked: no model, no provider,
// and nothing about how an answer is looked up either. (It is HTML, so the test above, which reads src/*.ts, does not see it.)
describe('the privacy page says nothing about how answers are checked', () => {
  const page = readFileSync(join(__dirname, '..', 'privacy.html'), 'utf8')
  it('names no model or provider', () => {
    expect(page).not.toMatch(/gemini|fallback model|failover|anthropic|openai|\bllm\b|language model|\bmock\b|artificial intelligence|\bAI\b/i)
  })
  it('does not describe how an answer is judged', () => {
    expect(page).not.toMatch(/answer lists?|checked against|look(ed)? up in|database of answers|wikidata|wikipedia/i)
  })
})
