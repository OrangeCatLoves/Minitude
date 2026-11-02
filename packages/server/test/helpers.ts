import { openDb } from '../src/db/open'
import { Repo, type AnswerRow } from '../src/db/repo'
import { seedIfEmpty } from '../src/bankio'
import { loadBank } from '../src/questions'
import { LlmError, type JsonRequest, type LlmClient } from '../src/llm/types'

export const bank = loadBank()

/** a throw-away database with the seed questions in it */
export function testRepo(): Repo {
  const repo = new Repo(openDb(':memory:'))
  seedIfEmpty(repo, bank, 1_000)
  return repo
}

export const head = (repo: Repo, id: string) => {
  const q = repo.getQuestion(id)
  if (!q) throw new Error('no such question ' + id)
  return { id: q.id, category: q.category, prompt: q.prompt, rules: q.rules }
}

/** a language model that answers from a script and remembers what it was asked */
export class FakeLlm implements LlmClient {
  model = 'fake-model'
  calls: JsonRequest[] = []
  constructor(public reply: (req: JsonRequest, n: number) => unknown | Promise<unknown> = () => dec()) {}
  async generateJson(req: JsonRequest): Promise<unknown> {
    this.calls.push(req)
    return this.reply(req, this.calls.length)
  }
}

/** a model decision as the judge expects it, with overrides */
export const dec = (o: Record<string, unknown> = {}) => ({
  valid: true, same_as: '', answer: 'Something', tier: 3, description: 'A thing.', reason: 'Fairly rare.', confidence: 'high', ...o,
})

export const budgetError = () => new LlmError('per-minute budget used up', 'budget')

export const names = (rows: AnswerRow[]) => rows.map((r) => r.name)
