# Testing

## Unit tests

```bash
npm test               # core (36 tests), web (24) and server (198)
npm run typecheck      # all packages
```

`packages/core/test` (36 tests) covers the maths that must never drift: depth and size at every boundary (399/400/439/440/700 points), slot and world numbers, dive durations, hint levels, post-finale counting, report and share text. `packages/server/test` (all on a throw-away in-memory database, a fake clock and a **scripted fake model**):
- `api.test.ts`: the API contract, the server's question clock (start before answer, order, late answers, time spent checking not counted, 12 tries, miss), no answers leaked.
- `judge.test.ts`: the answer checker: stored decisions, one model call per new answer, typo / "same as", same tier for every spelling, low confidence and failures never stored, simultaneous identical answers, prompt text only as quoted data, mock mode.
- `db.test.ts`: migrations, seeding, export/import round trip, corrections, runs keep their points, the model budget, choosing the model from environment variables.
- `generate.test.ts`: the question generator (drafts only, duplicates skipped, automatic rejection, audit drops/flags, budget stop).
- `cli.test.ts`: every command-line command, including approval rules, backup and the `daily` commands.
- `bank.test.ts`: the seed bank is well formed.
- `versus.test.ts` (29): multiplayer rooms: names, joining, the shared clock, what other players see, leaving, rematch, and the live event stream (see `docs/MULTIPLAYER.md`).
- `daily.test.ts` (38): choosing the day's seven (no randomness, every question comes round), the stored set, the daily API (one attempt, prompts one at a time, standings with shared ranks, streak, midnight UTC rollover, leaving a run, stale runs), the per-network limit (and that the address is never stored), daily backups, and upgrading a schema-1 database.

`packages/core/test/daily.test.ts` (13) covers the UTC day, countdown, streak, standings wording and the daily share text.

None of these call Google, and none start a real container: the `Dockerfile` has never been built (`docs/DEPLOY.md`). The real model is only checked by `npm run trial -w @minitude/server` (see `docs/SERVER.md`), which you run with your key.

## Playing it in a headless browser

`tools/browser-test` has Playwright scripts that start the game with `?manual=1`. In that mode the clock does not run by itself: the script moves time forward and takes a screenshot of any instant, so a one-second effect can be inspected frame by frame.

```bash
npm run dev                       # server on 8787, game on 5173
cd tools/browser-test
npm install && npx playwright install chromium
node run-perfect.cjs              # all-Mythic run: finale, post-finale lines, report
node run-scenario.cjs h 5,5,5,5,0,0,0 skip   # edging hints; tag, tiers, optional "skip"
node run-scenario.cjs x b,m,2,m,3,1,0        # b = wrong answer first, m = time out
node reveals.cjs v 0,1,2,3,4,5               # reveal, charge-up and landing frames for each tier
node server-clock.cjs                        # the game and the server's question clock (start ping, "late", lost start message re-sent)
node daily.cjs                               # the Daily Challenge: new guest, 7 prompts one at a time, standings, reload, second guest
node realtime.cjs                 # real clock, real keyboard (waits real seconds)
node home.cjs                     # the HOME button on every report (plays a solo run, today's Daily and "today's result"; answers nothing)
node glloss.cjs                   # the world picture (WebGL) rebuilds itself after the browser takes the graphics context away (submits nothing)
node focus.cjs                    # typing still works after the Tab key, a click on the page or the game, the sound button, another tab (submits nothing)
node audio-levels.cjs 5,5,5,5,5,5,5          # renders the sound offline and prints levels
```

Screenshots go to `tools/browser-test/out/`. Set `MINITUDE_URL` to test another address, for example the production server (`MINITUDE_URL=http://localhost:8787`). WebGL runs through SwiftShader (software) in a container, so it is slow but identical in output.

### The test hook

With `?manual=1` the page exposes `window.__mt`:

| Call | What it does |
| --- | --- |
| `advance(seconds, draw = true)` | move the game clock (in 1/30 s steps); draws once at the end if `draw` |
| `draw()` | draw the current instant |
| `state()` | phase, clock, current record and its schedule, total points, mode, daily state, title button |
| `loadDaily()` / `showResult()` | re-ask the server for today's state / show the stored result |
| `press(mode?)` | press the title button (`'daily'` or `'solo'`; default solo) |
| `pressPrimary()` | press the big button as a player would (PLAY DAILY / TODAY'S RESULT / PLAY) |
| `answer(text)` | type and submit an answer (waits for `state().pending === false`) |
| `skip()` | tap the world title card |
| `audio(tiers)` | render the sound of a scripted run offline; returns peak, RMS and per-second levels |

### Multiplayer and phones

- `tools/browser-test/versus.cjs`: three browsers play a whole multiplayer match through the real screens; `versus-live.cjs`: two browsers on the real clock. Both need a mock-mode server on a copy of the database: the recipe is at the end of `docs/MULTIPLAYER.md`.
- `tools/browser-test/afterword.cjs`: plays real runs to the end screen and checks the page under the report (it opens only once the report has settled, the logbook maths on screen, a rating changes instead of adding, the idea box keeps its keys, a swipe does not press a button, a phone size). Needs a built game on a server with a throw-away `DATABASE_FILE`; build with `VITE_CONTACT_EMAIL`, `VITE_BUSINESS_EMAIL` and `VITE_INSTAGRAM_URL` set to see every footer link (see `docs/SITE.md`).
- `tools/browser-test/phone-layout.cjs`: the game picture fits fully on screen at ten phone, tablet and desktop sizes (`MINITUDE_URL=... node phone-layout.cjs`). It cannot show a real phone's sliding address bar.

## Comparing with the v5 video

`tools/art-source/reference-stills` has a few frames from the video. The browser frames are not pixel-identical (different resampling and text rasteriser) but layout, colours, timing and effects should match. When something looks off, the Python function it came from is named in `docs/ENGINE.md`.
- `nomodel.test.ts`: the live game never reaches a language model (the start-up code and routes are checked), edit distance (a swapped pair is one slip), the typo budget, and `looseKey` (spacing, British spelling, numerals).
- `expand.test.ts`: the answer-list builder's merge (new answers, aliases, what a person ruled out), tiers from how well known something is, and the `answers add / alias / unknown / import-expansion` commands.

## Gems

`packages/core/test/gems.test.ts` (the tier, 840, perfect runs, the share square, the cabinet's add / save / damaged input / layout), `packages/server/test/gems.test.ts` (migration 4, the checker, `/api/gems` leaks nothing, a run scored 120, the `gems` commands, the audit), a gem round in `versus.test.ts`, a gem marker in `banksheet.test.ts`, and the gem schedule in `packages/web/test/timeline.test.ts`. `tools/browser-test/gem.cjs` plays a whole run of gems in Chrome against a server whose database has the gems (use a throw-away copy), saves a picture at each stage of the reveal, the report and the cabinet, and checks 840 points and the cabinet's storage.

## What counted

`packages/server/test/answers.test.ts` (who may read it: no guest, another guest, an open Daily, another day; the counts add up and put the gem under SINGULARITY; A to Z, paging, search, curated aliases shown, learned typos not, `%` and `_` are letters; bad input; nothing about how answers are checked in the replies). `tools/browser-test/daily-answers.cjs` plays a Daily (three gems, four time-outs) in Chrome and checks the arrow and hover on the report, the counts, the names A to Z, SHOW MORE, search, Esc, the number keys, a timed-out question and today's result opened from the title.

## Rank

`packages/core/test/rank.test.ts` (the words), `packages/server/test/rank.test.ts` (ties share a rank, half-played runs are not counted, solo and Daily both count, a score that is not among the runs counts as one more, bad input refused, only two numbers in the reply). `tools/browser-test/rank.cjs` plays a run in Chrome and checks the tile on the page under the report against the server's numbers, on a desktop and a phone-sized screen. `daily-answers.cjs` and `gem.cjs` also check that the panels really use Pixelify Sans.
