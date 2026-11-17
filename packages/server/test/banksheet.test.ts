import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { importBank } from '../src/bankio'
import { gunzipSync } from 'node:zlib'
import { buildSheetData, embed, packData, renderSheet } from '../src/cli/banksheet'
import { openDb } from '../src/db/open'
import { normalize } from '../src/normalize'
import { Repo } from '../src/db/repo'
import type { QuestionBank } from '../src/questions'

const bank = (id: string): QuestionBank => ({
  version: 't', note: '', categories: ['Food'], sources: { [id]: 'from a test' },
  questions: [{ id, category: 'Food', prompt: `Name a ${id}.`, rules: 'Anything.', answers: [
    { name: 'Alpha', tier: 0, aliases: ['Alef', 'Alfa'] }, { name: 'Beta', tier: 1 }, { name: 'Gamma </script>', tier: 5 },
  ] }],
})

describe('the bank sheet', () => {
  let dir = ''
  let dbFile = ''
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'banksheet-'))
    dbFile = join(dir, 'live.db')
    const db = openDb(dbFile)
    const repo = new Repo(db)
    importBank(repo, bank('live-one'), { status: 'approved', source: 'seed', answerSource: 'seed', at: 1 })
    importBank(repo, bank('draft-one'), { status: 'draft', source: 'import', answerSource: 'draft', at: 2 })
    importBank(repo, bank('rejected-one'), { status: 'rejected', source: 'import', answerSource: 'draft', at: 3 })
    db.close()
  })
  afterAll(() => rmSync(dir, { recursive: true, force: true }))

  it('lists live, draft and rejected questions with their answers by rarity and their other spellings', () => {
    const data = buildSheetData(dbFile, [], '1 Jan 2027')
    expect(data.questions.map((q) => q.status)).toEqual(['live', 'draft', 'rejected'])
    const live = data.questions.find((q) => q.id === 'live-one')!
    expect(live.status).toBe('live')
    expect(live.t[0]).toEqual([['Alpha', 'alef', 'alfa']]) // the game stores other spellings in lower case
    expect(live.t[1]).toEqual([['Beta']])
    expect(live.t[5][0][0]).toBe('Gamma </script>')
    expect(data.asOf).toBe('1 Jan 2027')
  })

  it('adds draft files, keeps their source sentence, and takes a question that is already in the database from the database', () => {
    const file = join(dir, 'bank.json')
    const b = bank('new-draft')
    b.questions.push(bank('live-one').questions[0])
    writeFileSync(file, JSON.stringify(b))
    const data = buildSheetData(dbFile, [{ file, label: 'Batch 9' }], 'x')
    const fresh = data.questions.find((q) => q.id === 'new-draft')!
    expect(fresh.status).toBe('draft')
    expect(fresh.origin).toBe('Batch 9')
    expect(fresh.source).toBe('from a test')
    expect(data.questions.filter((q) => q.id === 'live-one')).toHaveLength(1)
    expect(data.questions.find((q) => q.id === 'live-one')!.status).toBe('live')
  })

  it('shows the proposed gem of a draft question from a gems file (and ignores a gem whose answer is not in the question)', () => {
    const file = join(dir, 'bank2.json'), gems = join(dir, 'gems.json')
    const b = bank('gem-draft')
    b.questions.push(bank('gem-less').questions[0])
    writeFileSync(file, JSON.stringify(b))
    writeFileSync(gems, JSON.stringify({ gems: [{ question: 'gem-draft', answer: 'gamma </script>', description: 'A gem line.' }, { question: 'gem-less', answer: 'Not an answer' }] }))
    const data = buildSheetData(dbFile, [{ file, label: 'Batch 9' }], 'x', [gems])
    expect(data.questions.find((q) => q.id === 'gem-draft')!.gem).toEqual({ name: 'Gamma </script>', line: 'A gem line.' })
    expect(data.questions.find((q) => q.id === 'gem-less')!.gem).toBeUndefined()
  })

  it('puts the data in the page without letting it end the script', () => {
    const html = renderSheet(buildSheetData(dbFile, [], 'x'))
    expect(html).not.toContain('/*DATA*/null')
    expect(html).toContain('"live-one"')
    expect(html.match(/<\/script>/g)).toHaveLength(1) // the answer "Gamma </script>" must not add a second one
    const e = embed({ s: '<b>' + String.fromCharCode(0x2028) })
    expect(e.includes('<')).toBe(false)
    expect(e.includes(String.fromCharCode(0x2028))).toBe(false)
  })

  it('can carry its data packed (gzip + base64), which comes back exactly and keeps the page to one script ending', () => {
    const data = buildSheetData(dbFile, [], '1 Jan 2027')
    const packed = packData(data)
    expect(JSON.parse(gunzipSync(Buffer.from(packed, 'base64')).toString('utf8'))).toEqual(JSON.parse(JSON.stringify(data)))
    const html = renderSheet(data, true)
    expect(html).not.toContain('/*DATA*/null')
    expect(html).not.toContain('"live-one"') // the names are inside the compressed text, not in the page
    expect(html).toContain('DecompressionStream')
    expect(html).toContain(JSON.stringify(packed))
    expect(html.match(/<\/script>/g)).toHaveLength(1)
    // a big list is much smaller packed
    const many = { ...data, questions: Array.from({ length: 40 }, (_, i) => ({ ...data.questions[0], id: 'q' + i, t: [Array.from({ length: 300 }, (_, k) => ['Answer number ' + k + ' of question ' + i, 'other spelling ' + k])] })) }
    expect(renderSheet(many, true).length).toBeLessThan(renderSheet(many, false).length / 3)
  })

  it('shows the question gem next to its answers', () => {
    const db = openDb(dbFile)
    const repo = new Repo(db)
    expect(repo.setGem('live-one', normalize('Gamma </script>'), 'A line about the gem.', null, 5)).toBe(true)
    db.close()
    const data = buildSheetData(dbFile, [], '1 Jan 2027')
    expect(data.questions.find((q) => q.id === 'live-one')!.gem).toEqual({ name: 'Gamma </script>', line: 'A line about the gem.' })
    expect(data.questions.find((q) => q.id === 'draft-one')!.gem).toBeUndefined()
    // the page still has exactly one real closing script tag even though the gem's name contains one
    expect(renderSheet(data).split('</script>').length).toBe(renderSheet(buildSheetData(dbFile, [], '1 Jan 2027')).split('</script>').length)
    expect(renderSheet(data)).toContain('◆ gem')
  })
})
