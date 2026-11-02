import { runCli } from './cli/commands'
import { loadEnv } from './env'
import { defaultDbFile, openDb } from './db/open'
import { Repo } from './db/repo'
import { makeLlm } from './llm/factory'

/** `npm run cli -- <command>`: review questions, run the question generator, fix answers, back up the database. */
loadEnv()
const dbFile = defaultDbFile()
const repo = new Repo(openDb(dbFile))
// the command line waits out the per-minute limit instead of refusing, because nobody is staring at a screen
const { llm, describe } = makeLlm(repo, process.env, { waitForMinute: true })
runCli(process.argv.slice(2), { repo, llm, llmNote: describe, dbFile, now: Date.now, out: (s) => console.log(s) }).then(
  (code) => { repo.db.close(); process.exit(code) },
  (e) => { console.error(e instanceof Error ? e.message : e); process.exit(1) },
)
