# Minitude: notes for Claude Code

Pixel-art browser trivia game. Seven prompts per run, the player types any valid answer, rarer answers score more and shrink the player further (1.7 m down to the Planck length). This repo is **Phases 1 to 3: the playable solo game, a SQLite database, an answer checker, an offline question generator, a server-side question clock, multiplayer rooms, and the Daily Challenge (same seven questions for everyone each UTC day, one attempt, guests only) with Fly.io deployment files.** The game was deployed to Fly.io on 5 November 2026 as `minitude-lwb` (Singapore; `docs/DEPLOY.md`).

**Since 12 November 2026 the live game uses NO language model** (the owner's decision, following how krillion.io works): answers are checked against answer lists built ahead of time (stored answers, their aliases, other ways of writing them, and slips the player is asked about); an answer that is not on the list is rejected; rarity is stored with each answer and set offline. The Gemini code (`src/llm/`, the model branch of `judge/pipeline.ts`, `src/generate/`) is kept only for the optional offline question generator and the old tests; `test/nomodel.test.ts` fails if the server's start-up code or routes reach it. Answer lists are grown with `src/expand/build.ts` (from Wikidata), hand-written lists in `data/curated/`, `data/group-terms.json`, and `answers add / alias / unknown / lint / import-expansion / import-groups`: read `docs/ANSWER_LISTS.md`.

Read first: `docs/STATUS.md` (what is done / not done), `docs/SERVER.md` (database, answer checker, generator, clock, the Daily, commands), `docs/DECISIONS.md` (choices made without asking), `docs/DEPLOY.md` (Fly.io), `docs/BANK_SHEET.md` (the page that lists every question and answer, and how to keep it current), `docs/SITE.md` (the page under the end-of-run report, the privacy page and its contact details; live since 13 Nov 2026), `docs/PROJECT_CONTEXT.md` (the full planning notes; the end of the file says what Phases 1 to 3 cover).

## Commands

```bash
npm install
npm run dev          # API on :8787, game on :5173 (Vite proxies /api)
npm test             # core, web (camera) and server unit tests
npm run typecheck    # all three packages
npm run build        # typecheck + build packages/web/dist
npm start            # one process, game + API on :8787 (needs a build)
npm run trial -w @minitude/server -- --generate   # the OLD live Gemini trial (not used by the game any more; needs a key)
npm run cli -- help  # questions, answers (unknown, add, alias, import-expansion), daily sets, db backup, the question generator
npx tsx packages/server/src/expand/build.ts --out <folder>      # offline: build answer-list expansion files from Wikidata (read-only on the database)
npx tsx packages/server/src/expand/evaluate.ts                  # offline: replay the test cases on a COPY before/after an expansion
fly deploy --ha=false  # see docs/DEPLOY.md (first run 5 Nov 2026, app minitude-lwb)
```

Node 20+. No other setup. Never commit keys: the server reads `DATABASE_FILE`, `PORT`, `DAILY_PER_IP`, `CLIENT_IP_HEADER`, `BACKUP_DIR`, `BACKUP_KEEP` from the environment or from `packages/server/.env` (git-ignored; copy `.env.example`). `GEMINI_API_KEY`, `LLM_MODEL` and the other `LLM_*` settings are read only by the command line (the optional question generator): the running server ignores them. There is no `GEMINI_API_KEY` secret on Fly any more (removed 12 Nov 2026; Fly has no secrets set).

## Layout

- `packages/core`: pure TypeScript shared by browser and server (tiers, scoring, depth/size maths, worlds, run records, hints, report/share text). No DOM. Change scoring here, with tests.
- `packages/server`: Hono API + SQLite (`better-sqlite3`). `src/app.ts` routes, the question clock and the daily rules; `src/daily.ts` choosing the day's set; `src/clientip.ts` visitor address; `src/backup.ts` daily database copies; `src/index.ts` static files, cache headers, hourly job, shutdown; `src/db/` schema (numbered migrations) and `Repo` (all SQL); `src/versus.ts` + `versusRoutes.ts` + `names.ts` multiplayer rooms (in memory; `docs/MULTIPLAYER.md`), `src/clock.ts` the question clock's constants; `src/judge/pipeline.ts` the answer checker (stored answer or alias -> the same answer written another way -> a slip, asked about -> not found; the model branch is dormant); `src/match.ts` + `src/normalize.ts` the matching (generous typo budget, swapped letters count once, `looseKey`); `src/expand/` the offline answer-list builder (Wikidata) and its evaluation; `src/llm/` the Gemini client, budget guard, env factory: offline use only; `src/generate/` the question generator; `src/cli/` the review commands; `data/questions.seed.json` placeholder bank (seeds the database on first start only).
- `packages/web`: the game. `game.ts` (state machine, input, server calls), `timeline.ts` (the schedule of every question), `gl.ts` (WebGL2 world zoom), `draw.ts`/`fx.ts`/`celebrate.ts`/`finale.ts` (effects), `ui.ts` (HUD, question box, report, daily panel), `versus.ts` + `lobbyui.ts` (multiplayer: the room state, the lobby screens, the players panel, the standings), `api.ts` (server calls, the multiplayer event stream, guest id), `audio.ts` (live WebAudio sound), `assets.ts` (loads `public/` pictures).
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
- No language model in the live game (12 Nov 2026, chosen by the owner, following krillion.io): answer lists are built ahead of time; an answer not on the list is rejected ("We don't have that one. Check the spelling or try another."); rarity is decided offline and stored with the answer. Real answers must be accepted as far as possible by growing the lists (aliases, Wikidata expansion, `answers unknown` to see what players typed), not by a model.
- Group names count: an umbrella term where every member would be valid ("rattlesnake", "viper" for venomous snakes) is accepted as Common (tier 0), whatever the question's rules say. The question's own subject word ("snake") and terms that include invalid things do not count. Chosen by the owner. With no model this is DATA: such terms must be added to the lists as answers or aliases (tier 0); the old wording in `judge/prompt.ts` is no longer used live.
- Corrections need consent: a misspelling is never accepted on the spot. The game asks "Did you mean X?" (YES / NO); the question clock keeps running while it asks. No means the text is judged as typed, never as the suggested answer. Chosen by the owner; see `docs/SERVER.md`. Matching is generous (`typoBudget`: none up to 3 letters, 1 up to 7, 2 up to 11, 3 beyond; a swapped pair of letters is one slip; aliases are matched too) BECAUSE a wrong guess only costs one key press. A different way of writing the same answer (a hyphen or space, British spelling, Roman or Arabic numerals, "Mt" for "Mount") is not a misspelling and is accepted at once (`looseKey`). OCCASIONAL SURPRISES ARE WANTED (owner, 12 Nov 2026): a text a couple of slips from a real answer, even one the player did not mean (typing "Mekong River" and being asked "Did you mean Moa River?" because the Moa is also called the Makona), is a small delight, not a bug. Do NOT tighten the matching to remove them (a word-by-word rule that did was tried and reverted). Only texts far from every real answer must never match. If the owner ever wants silent autocorrect instead (krillion's FAQ admits its generous autocorrect sometimes produces "weird matches"), ask first.
- Players are never told how answers are checked: no model name, nothing about lists, mock or real, in any API reply, message or browser code (tests guard this). The server's own logs and database may record it. Chosen by the owner.
- Daily: resets at midnight UTC; guests only (a random id in the browser, no sign-up); mixed categories; hosting is Fly.io. Chosen by the owner.
- Interface is the v5 video's: minimal, "WORLD n / 21", no fun facts, world title cards skip on tap, 30 s per question.
- Wording lives in `packages/core/src/hints.ts` and `report.ts`.

## Defaults I took (change freely, but tell the owner)

See `docs/DECISIONS.md`. The main ones: wrong or unknown answers can be retried with the remaining time; a time-out scores 0 and does not shrink; title waits for PLAY. Phase 2 choices (SQLite, stored rulings, server clock, drafts-only generator) and Phase 3 choices (one attempt, closing the page ends a daily run, 10 daily runs per network, stored daily sets, anonymous standings, backups) are listed in the same file.

## Known gaps, in the order I would do them

1. DONE and DEPLOYED on 12 Nov 2026: the live game no longer uses a language model (commit 656eab3; the 17.5k Wikidata and hand-written answers were imported on Fly the same day, steps in `docs/ANSWER_LISTS.md`). Next: vet the lists (weakest first: rivers, apples, programming languages, warship types), then more questions with their lists. The Gemini key on Fly does nothing now and can be unset. A local-model trial on 11 Nov 2026 (its code was kept out of the repo on purpose) found small local models too slow and too inaccurate.
2. DONE: 22 approved questions; the placeholder seed questions are retired (locally, and on Fly on 5 Nov 2026). **12 Nov 2026: 30 more (Batch 1: dogs, cocktails, countries, movies, airports and so on; 78,938 answers in all) were vetted by the owner and are LIVE on Fly: 52 approved.** They are built from Wikidata by `src/expand/newq.ts` + `batch1.ts` (cold-start rarity by fame rank, a hand-listed `mustHave` head, `docs/ANSWER_LISTS.md`). The owner wants more in batches (target about 100 to 150 approved). **Batch 2 (48 questions, 94k answers; `src/expand/batch2.ts`) is LIVE on Fly since 13 Nov 2026** (the owner: "commit them and have them deployed"; cleaned first of wrong-class answers, see `docs/ANSWER_LISTS.md`): 100 approved questions, 173,137 answers. The Dailies were not re-planned. **Batch 3 (50 questions, 68k answers; `src/expand/batch3.ts`, helpers in `src/expand/recipes.ts`) is LIVE on Fly since 13 Nov 2026** (the owner: "Put Batch 3 live too"): 150 approved questions, 241,064 answers in all. Committed in 34553fc. Lessons and the importing steps are in `docs/ANSWER_LISTS.md` (Batch 3 added seven: preflight the recipes, people by occupation need the description filter, subclasses leak, check display names). Run `src/expand/labelcheck.ts` on every new batch (Wikidata labels can be vandalised) and read tiers 0 to 2 of every question in `review.md`: the sheet the owner reads shows only the best-known answers, so junk in the lower tiers goes unseen. Another batch starts only when the owner says go.
3. Play with the key set and listen to the sound (never heard by a person). Then `answers review`.
4. Rarity for NEW answers comes from how many Wikipedia languages know the thing (Wikidata sitelinks), calibrated against the answers already in that question (`expand/build.ts`, `tierFromPairs`); a person should still look at them (`answers list <question> --source wikidata`).
5. DONE on 5 Nov 2026: first deploy (app `minitude-lwb`, 22 approved questions imported over `fly ssh`, Daily sets planned; see the "Learned on the first deploy" notes in `docs/DEPLOY.md`). Still to do: a Daily played by real visitors on the live site, and look at the Fly bill after a week (Fly has no spending limit or billing alerts).
6. Unlimited Solo (section 12 of the planning notes). Multiplayer rooms (private and public) were built on 6 Nov 2026: see `docs/MULTIPLAYER.md`; what is left there is a trial with real players and phones. `npm audit` flags `vitest` 2.x (dev only). Upgrade vitest to the current major and re-run the tests.
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
- `normalize()` produces the stored keys (`answers.norm`, `spellings.norm`): changing it means re-keying the database. New ways of treating text go in `looseKey` / `match.ts`, which are computed at lookup time and never stored.
- Tests use `testRepo()`, `FakeLlm` and a fake clock (`test/helpers.ts`); nothing in the unit tests touches the network or a real database file.
- A decided rarity is stored per canonical answer: do not re-score stored answers on every request. Corrections go through `answers set-tier` so they are logged.
- **Keep the bank sheet current (owner's standing request, 12 Nov 2026).** There is one published, searchable page with every question and answer (live, draft, rejected): `docs/BANK_SHEET.md` has the link and the two steps (`tools/bank-sheet/refresh.ps1`, then publish `list-build\sheet\bank-sheet.html` again with the same file path so the link stays). Do this whenever questions or answers change: a new batch drafted, a draft approved or rejected, answers added or removed, an expansion imported, a tier fixed, a deploy that changes the bank. Say in your reply that the sheet was refreshed.
- **Keep the privacy page true** (`packages/web/privacy.html`, `docs/SITE.md`). It tells visitors there are no cookies, no analytics or third-party scripts, Cloudflare for DNS only, typed answers kept for solo and Daily runs but not multiplayer, and what ratings and ideas keep. If a change makes any of that false (analytics, cookies, proxying through Cloudflare, storing new personal data), change the page and its date in the same change. It must never say how answers are checked (`packages/web/test/private.test.ts` scans it).
- Git: there is no history yet. Run `git init`, check `.gitignore`, and make a first commit before changing anything.
