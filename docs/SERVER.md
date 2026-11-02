# The server (Phases 2 and 3)

`packages/server`: a Hono API on Node with a SQLite database. Run with `npm run dev` (or `npm start` after `npm run build`). Putting it online: `docs/DEPLOY.md`.

## What lives where

```
src/index.ts        start-up: loads .env, opens the database, seeds it on first run, picks the answer checker, serves the built game, hourly housekeeping, graceful shutdown
src/app.ts          the HTTP API, the server-side question clock, the daily run rules
src/daily.ts        choosing and saving the daily set (pickDaily, ensureDailySet)
src/clientip.ts     the visitor's address (connection or a proxy header) and its hashed fingerprint
src/backup.ts       one database copy per UTC day, newest N kept
src/db/             schema.ts (numbered migrations), open.ts, repo.ts (all SQL, one class)
src/judge/          pipeline.ts (the answer checker), prompt.ts (what the model is told, and how its reply is checked)
src/llm/            types.ts, gemini.ts (the only Gemini-specific code), guard.ts (budget + call log), factory.ts (env -> model)
src/generate/       the question generator (propose -> answer list -> audit) and the 11 categories
src/cli/            the command line: npm run cli -- <command>
src/bankio.ts       question JSON <-> database (seed import, export, import)
src/match.ts        typo-tolerant matching (one typo up to 8 letters, two beyond, none for 4 or fewer)
src/trial.ts        the live trial to run with your key
```

## The database

SQLite through `better-sqlite3`, one file: `packages/server/data/minitude.db` (set `DATABASE_FILE` to move it; it is git-ignored). On the very first start it is filled from `data/questions.seed.json`. The schema is a list of numbered migrations in `db/schema.ts`; to change it, add a new entry at the end, never edit an old one.

| Table | What it holds |
| --- | --- |
| `questions` | prompt, rules, category, `status` (`draft` / `approved` / `rejected`), where it came from, reviewer notes |
| `answers` | the canonical answers of a question with their tier. **The tier belongs to the canonical answer**, so every spelling of it scores the same. Also `review` (a person should look), `times_given` (how often players gave it) and where it came from (`seed`, `draft`, `live` = added by the model during play, `admin`) |
| `spellings` | what a player typed -> the canonical answer it means (aliases, typos, "same as" decisions), or a stored "does not count" with the message shown |
| `runs`, `run_questions` | every run (`mode` = `solo` or `daily`); per question: when it started, time the server spent checking, result, answer, points |
| `meta` | small facts, e.g. `daily_epoch` (the day of Daily #1) |
| `daily_sets`, `daily_set_questions` | the seven questions chosen for each UTC day. Written once, never changed |
| `daily_plays` | one row per (day, guest): the run, a hashed network fingerprint, when it started and finished, the total |
| `attempts` | every answer typed (text, verdict, how it was decided, milliseconds). Raw player text, no names or addresses. |
| `llm_log` | every model call (when, purpose, ok, milliseconds, error). The budget is counted from this. |
| `changes` | every manual correction: what, before, after, why |

Only `approved` questions are ever played.

## How an answer is judged (`judge/pipeline.ts`)

1. **Stored?** An answer, alias, learned spelling or stored "does not count" that matches the typed text exactly (after normalising case, accents, punctuation and a leading "the/a/an") is used as it is. No model call.
2. **Not stored, no model configured (mock mode):** one unambiguous typo is accepted and remembered; anything else is *unresolved* ("The demo checker doesn't know this answer").
3. **Not stored, model configured:** ask the model once. It is shown the question, its rules, the known answers (or the 40 nearest when there are more than 150), example answers per tier, any known answers spelled close to the typed text, and the typed text as a quoted JSON string. It must reply with JSON: `valid`, `same_as`, `answer`, `tier`, `description`, `reason`, `confidence`. The reply is checked (right shape, tier 0-5, text cleaned) before anything is trusted.
4. **What is stored:**
   - *valid, same as a known answer* -> the typed text becomes a spelling of it, and the player gets the known answer **with its stored tier**, whatever tier the model said. A spelling that looks nothing like the answer it was matched to is used once but not remembered.
   - *valid, new* -> a new canonical answer with the model's tier, `source = live`. If the model was only "medium" sure, or its "same as" matched nothing we have, it is flagged `review`.
   - *invalid, high confidence* -> stored as a "does not count". Not-sure invalid answers are not stored.
   - *low confidence, model error, bad reply, budget used up* -> **unresolved**: the player sees a message and can try again; nothing is stored or counted.
5. Two players typing the same new answer at the same moment cost one model call (and get one decision).

Every try is written to `attempts`. Rarity is the **model's own judgement against anchor examples**; there is no web search or other evidence yet, and the one-line descriptions the model writes are unverified.

## The server's question clock (`app.ts`)

The browser tells the server when each question is on screen (`POST /api/run/:id/start {index}`); that is when its clock starts, **and the first time the player gets the prompt**: starting a run sends no questions. Rules:

- Questions must be started in order, and a question must be started before it can be answered. Asking to start the same question again gives the same prompt and does not restart the clock.
- An answer is accepted if it arrives within **30 s + 0.55 s (the browser's start delay) + 3 s grace + the time the server itself spent checking earlier answers** of that question. Later than that, the question is closed as a time-out and the reply is `409 {code: "late"}`; the game then shows TIME UP.
- At most 12 tries per question (every unknown answer can cost a model call).
- 90 answers per minute per client address; run creation and daily start share that limit.
- Every API reply is `Cache-Control: no-store`.

## The Daily Challenge (Phase 3)

Same seven questions for everyone on each UTC day (resets at 00:00 UTC, 08:00 Singapore). One attempt per guest per day. No accounts.

**The set.** Chosen once, by the first request of the day (or by the hourly housekeeping, which also prepares tomorrow), and then stored in `daily_sets`. It never changes, so a restart or a new approval cannot change a day that has started. Choice (`pickDaily`): the questions used longest ago come first, at most one per category, and if there are fewer than 7 categories the rest is filled from the remaining questions; the order is shuffled by a hash of the day, not by chance. `daily show|plan|set|clear` (below) let a person look and override until somebody has played that day. Needs at least 7 approved questions, otherwise `503 no_questions`.

**The number.** "DAILY #N": N is the days since the first stored set (`meta.daily_epoch`) plus one.

**Who is playing.** The browser makes a random id once and keeps it in `localStorage` (`minitude.guest`); it is sent as the `x-guest` header on daily calls (16 to 64 letters, digits, `_`, `-`). One row per (day, guest). Clearing browser data or using another browser gives a new guest; that is accepted (decision 38).

**Endpoints**

| Call | Does |
| --- | --- |
| `GET /api/daily` | today's state for this guest: `new`, `playing` or `done` (with the seven results, the total and the standings), the number, milliseconds until the reset, the streak |
| `POST /api/daily/start` | opens the one attempt; returns `{runId, count, seconds, checker, mode: "daily", day, number}`. No questions. 409 `played` / `in_progress`, 429 `ip_limit` |
| `POST /api/run` | a solo run (any number, no standings) |
| `POST /api/run/:id/start`, `/answer`, `/miss` | as above |
| `POST /api/run/:id/abandon` | the page is closing: the unanswered questions of a daily run become misses. Nothing happens to a solo run |
| `GET /api/run/:id` | `{total, answered}` so far |
| `GET /api/health` | `{ok, checker, questions, policy}` |

**Leaving ends the run.** The game sends `abandon` when the page is hidden or closed (`pagehide`, `sendBeacon`). A run that is silent for 2 minutes (`STALE_RUN_MS`) is closed as misses the next time that guest's day is looked at (opening the page or pressing the daily button). So you cannot reload for a second try, and cannot keep a half-finished day open in another tab.

**One attempt, and its limits.** The guest id stops accidental replays. The per-network limit (`DAILY_PER_IP`, default 10 runs per network per day, 0 = off) only blunts someone who clears their storage again and again; the address is stored as the first 16 characters of `sha256(day|address)`, which cannot be read back and changes every day. The local machine (loopback) is exempt. Behind a proxy set `CLIENT_IP_HEADER` (on Fly: `fly-client-ip`); otherwise every visitor looks like the proxy. A determined person with several browsers or networks can still play more than once.

**Standings.** Players that day, your rank (ties share a rank), how many are below you, the best total. The game shows "you beat N%" only with at least 10 players. **Streak** = consecutive finished UTC days, still alive through today until the day ends.

**Cheating on the questions.** The prompts are sent one at a time, only when the question starts, so nothing can be read ahead. The answers are never sent before they are given (there is a test for both).

## Serving, caching and shutdown (`index.ts`)

- Serves `packages/web/dist` itself (one process for game and API). Hashed script and style files are cached for a year (`immutable`), `index.html` and unknown paths are never cached, everything else for a day. Responses are gzip-compressed; secure headers are on (including HSTS).
- Once an hour: makes sure today's and tomorrow's daily sets exist, and, if `BACKUP_DIR` is set, writes `minitude-YYYY-MM-DD.db` if today's is missing and deletes older ones beyond `BACKUP_KEEP` (default 7). Only files named exactly like that are ever deleted.
- On SIGTERM / SIGINT: stops accepting, finishes, closes the database, exits.

## The model and its budget

`LLM_PROVIDER` / `GEMINI_API_KEY` / `LLM_MODEL` (default `gemini-3.8-flash`, check the exact name in Google AI Studio) can go in `packages/server/.env` (see `.env.example`). With no key the server runs in mock mode.

`LLM_MAX_PER_MINUTE` (default 10) and `LLM_MAX_PER_DAY` (default 200) are a hard budget: calls over it are **refused, not sent** (players see "The answer checker is busy"). Set them below your plan's limits. The command line waits out the per-minute limit instead of refusing.

`llm/gemini.ts` follows the documented `generateContent` request with a JSON response schema and retries rate-limit and server errors once or twice. **It has never made a real call.** Run the trial first.

## Question generator and review

```bash
npm run cli -- questions generate                 # every category with fewer than 2 questions; saves DRAFTS
npm run cli -- questions generate --category Food --count 1
npm run cli -- questions list --status draft
npm run cli -- questions show <id>                # prompt, rules, answers by tier, the audit's notes and flagged answers
npm run cli -- questions approve <id>             # now it can be played
npm run cli -- questions reject <id> --reason "too easy"
```

Per question: one call to write the prompt (one per category), one for the answer list (70-110 answers over six tiers, with aliases), one **audit** call that acts as a strict fact-checker. Broken answers (not valid, duplicate, misspelled) are dropped; doubtful ones (tier far off, unsure) are kept but flagged. A draft is rejected automatically if fewer than 30 answers or fewer than 4 in some tier survive, or if the audit throws out more than 30%. `approve` refuses a question with a problem in its notes unless you add `--force`; `--all-drafts` approves only the clean ones.

An audit by the same model is a second look, not proof. Read the answers and check the doubtful ones yourself before approving.

## Looking after answers learned during play

```bash
npm run cli -- answers review                     # flagged answers, most-played first
npm run cli -- answers list <question-id> --live  # everything the model added
npm run cli -- answers set-tier <question-id> "<answer>" 4 --reason "much rarer"
npm run cli -- answers ok <question-id> "<answer>"
npm run cli -- answers remove <question-id> "<answer>" --message "That is a brand."
```

Corrections change future answers only; runs already played keep the points they earned. Each correction is recorded in `changes`.

## The daily set from the command line

```bash
npm run cli -- daily show [YYYY-MM-DD]       # the seven questions of a day (default today, UTC) and how many have played
npm run cli -- daily plan --days 7           # choose and save the sets for today and the next days so you can look at them
npm run cli -- daily set 2026-11-02 <id> x7  # use these seven approved questions that day
npm run cli -- daily clear 2026-11-02        # forget that day's set so it is chosen again
```

`set` and `clear` refuse once somebody has played that day.

## Backups

```bash
npm run cli -- db backup            # a safe copy in packages/server/data/backups/
npm run cli -- questions export data/approved-questions.json   # approved questions, to keep in git (path is relative to packages/server)
npm run cli -- db stats
```

On a server, set `BACKUP_DIR` and the server makes its own daily copy (see above and `docs/DEPLOY.md`).

## Not done

- The model has never been called for real (see above). Run `npm run trial -w @minitude/server`.
- No web evidence behind answers or rarity; no measured familiarity data beyond `times_given`.
- Only `approved` questions exist for the seed: 11 placeholder questions until you run the generator and approve results. The Daily needs at least 7 approved.
- No admin web page or admin API on purpose (nothing to protect); everything is the command line.
- One server process on one machine (SQLite). Moving to Postgres means a new `Repo` behind the same methods.
- No retention rule for `attempts` yet.
- Daily is guests only: no accounts, history lives in one browser, clearing it gives a new guest.
- The Dockerfile and `fly.toml` have never been built or deployed (`docs/DEPLOY.md`).
