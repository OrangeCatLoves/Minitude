# Minitude: notes for Claude Code

Pixel-art browser trivia game. Seven prompts per run, the player types any valid answer, rarer answers score more and shrink the player further (1.7 m down to the Planck length). This repo is **Phases 1 to 3: the playable solo game, a SQLite database, an AI answer checker, an AI question generator, a server-side question clock, and the Daily Challenge (same seven questions for everyone each UTC day, one attempt, guests only) with Fly.io deployment files.** The AI parts have only ever run against a scripted fake model, and the Dockerfile / fly.toml have never been built or deployed.

Read first: `docs/STATUS.md` (what is done / not done), `docs/SERVER.md` (database, answer checker, generator, clock, the Daily, commands), `docs/DECISIONS.md` (choices made without asking), `docs/DEPLOY.md` (Fly.io), `docs/PROJECT_CONTEXT.md` (the full planning notes; the end of the file says what Phases 1 to 3 cover).

## Commands

```bash
npm install
npm run dev          # API on :8787, game on :5173 (Vite proxies /api)
npm test             # core (36) + server (128) unit tests
npm run typecheck    # all three packages
npm run build        # typecheck + build packages/web/dist
npm start            # one process, game + API on :8787 (needs a build)
npm run trial -w @minitude/server -- --generate   # the live Gemini trial (needs your key)
npm run cli -- help  # questions, answers, daily sets, db backup, the question generator
fly deploy --ha=false  # see docs/DEPLOY.md (never run yet)
```

Node 20+. No other setup. Never commit keys: the server reads `LLM_PROVIDER`, `GEMINI_API_KEY`, `LLM_MODEL`, `LLM_MAX_PER_MINUTE`, `LLM_MAX_PER_DAY`, `DATABASE_FILE`, `PORT`, `DAILY_PER_IP`, `CLIENT_IP_HEADER`, `BACKUP_DIR`, `BACKUP_KEEP` from the environment or from `packages/server/.env` (git-ignored; copy `.env.example`). With no key the server runs in mock mode. On Fly the key is a secret (`fly secrets set`), never a file in the repo (`.dockerignore` keeps `.env` out of the image).

## Layout

- `packages/core`: pure TypeScript shared by browser and server (tiers, scoring, depth/size maths, worlds, run records, hints, report/share text). No DOM. Change scoring here, with tests.
- `packages/server`: Hono API + SQLite (`better-sqlite3`). `src/app.ts` routes, the question clock and the daily rules; `src/daily.ts` choosing the day's set; `src/clientip.ts` visitor address; `src/backup.ts` daily database copies; `src/index.ts` static files, cache headers, hourly job, shutdown; `src/db/` schema (numbered migrations) and `Repo` (all SQL); `src/judge/pipeline.ts` the answer checker (stored ruling -> model once -> store); `src/llm/` model client (`gemini.ts` never run), budget guard, env factory; `src/generate/` the question generator; `src/cli/` the review commands; `data/questions.seed.json` placeholder bank (seeds the database on first start only).
- `packages/web`: the game. `game.ts` (state machine, input, server calls), `timeline.ts` (the schedule of every question), `gl.ts` (WebGL2 world zoom), `draw.ts`/`fx.ts`/`celebrate.ts`/`finale.ts` (effects), `ui.ts` (HUD, question box, report, daily panel), `api.ts` (server calls, guest id), `audio.ts` (live WebAudio sound), `assets.ts` (loads `public/` pictures).
- `tools/art-source`: the Python pipeline the game was ported from. Reference only, not runnable here.
- `tools/browser-test`: Playwright scripts that play the game and save screenshots.
- `Dockerfile`, `fly.toml`, `.dockerignore`: one container, one process (`node --import tsx src/index.ts`), one volume at `/data`, exactly one machine.

How the engine works (frame = pure function of the clock and the list of records): `docs/ENGINE.md`. Sound: `docs/AUDIO.md`. How to test: `docs/TESTING.md`.

## Rules that are decided. Do not change them without asking the owner

- 7 prompts per run. Tiers: Common 10, Uncommon 20, Rare 40, Exotic 60, Legendary 80, Mythic 100.
- Size = 1.7 m / 10^(points / 20). Worlds 1 to 20 are 20 points each. **Unexplored = 400-439 points.** **Planck Foam (world 21) starts at 440**; the finale plays the moment the total crosses 440; points above 440 still count.
- Edging hint: 2nd landing in a row inside Unexplored shows "Something is getting closer.", 3rd or more "It is very close."; the 1st keeps the Unexplored card. A run ending in Unexplored says "Planck Foam was N points away".
- After the finale: 1st answer shows one of three lines at random (never the same as last time) plus the small line "Our physics stops here. Keep going."; the 2nd shows "There is nothing left to measure you with." / "You are still shrinking.". Report says "N points past the edge".
- Each hint is one text line, one glow pulse, one sound. No extra cards.
- Daily: resets at midnight UTC; guests only (a random id in the browser, no sign-up); mixed categories; hosting is Fly.io. Chosen by the owner.
- Interface is the v5 video's: minimal, "WORLD n / 21", no fun facts, world title cards skip on tap, 30 s per question.
- Wording lives in `packages/core/src/hints.ts` and `report.ts`.

## Defaults I took (change freely, but tell the owner)

See `docs/DECISIONS.md`. The main ones: wrong or unknown answers can be retried with the remaining time; a time-out scores 0 and does not shrink; title waits for PLAY. Phase 2 choices (SQLite, stored rulings, server clock, drafts-only generator) and Phase 3 choices (one attempt, closing the page ends a daily run, 10 daily runs per network, stored daily sets, anonymous standings, backups) are listed in the same file.

## Known gaps, in the order I would do them

1. Run `npm run trial -w @minitude/server -- --generate` with a Gemini key and read all of it. `llm/gemini.ts` has never made a real call; the default model name (`gemini-3.8-flash`) is unchecked; thinking models may need a bigger `maxOutputTokens` or a `thinkingConfig`. Fix only that one file if the request shape is off.
2. Run `npm run cli -- questions generate`, review the drafts, approve until there are 22 good questions. Then retire the placeholder seed questions (`questions reject <id>`).
3. Play with the key set and listen to the sound (never heard by a person). Then `answers review`.
4. Decide whether the model's rarity needs web evidence behind it (`docs/PROJECT_CONTEXT.md` sections 7-8).
5. First deploy with `docs/DEPLOY.md`: build the image, fix what breaks, put the approved questions on the volume (that `fly ssh` route is untested), play a Daily on the real site, look at the bill after a week.
6. Unlimited Solo and private lobbies (section 12 of the planning notes). `npm audit` flags `vitest` 2.x (dev only). Upgrade vitest to the current major and re-run the tests.
7. Mobile portrait layout and touch typing, a "reduce flashes" setting, screen-reader text, a licence file, a privacy note, a retention rule for the `attempts` table, Postgres if you ever need more than one server.

The Daily can be replayed by clearing browser storage (guests only, by design); the per-network limit only blunts that. Do not add a harsher rule without asking.

## Working in this code

- Do not change the maths in `timeline.ts`, `finale.ts` or `audio.ts` casually: they are ports of the video's Python (`tools/art-source/engine-prototype`), and `docs/ENGINE.md` names the Python function each one came from.
- Test visual or timing changes with `tools/browser-test` (`?manual=1` lets a script step the clock and screenshot any instant). The headless browser draws WebGL in software, so a real-time run there looks laggy; that is not a bug.
- Scoring or hint changes: edit `packages/core` and its tests first; the game and server read from it.
- Keep answers out of the browser until the player has answered (the API never sends them; there is a test for it). Keep prompts out until their question starts (`POST /api/run/:id/start` is the only way to get one; also tested).
- A daily set is written once and never changed after somebody has played that day. Never log or store a raw network address: only the day-bound hash.
- Run exactly one server process and one machine; SQLite lives on one disk.
- Schema changes: add a NEW entry at the end of `MIGRATIONS` in `db/schema.ts`; never edit an old one.
- Tests use `testRepo()`, `FakeLlm` and a fake clock (`test/helpers.ts`); nothing in the unit tests touches the network or a real database file.
- A decided rarity is stored per canonical answer: do not re-score stored answers on every request. Corrections go through `answers set-tier` so they are logged.
- Git: there is no history yet. Run `git init`, check `.gitignore`, and make a first commit before changing anything.
