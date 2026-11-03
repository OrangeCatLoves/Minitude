# Status (29 October 2026): Phases 1, 2 and 3

Phase 1 = the playable solo game. Phase 2 = the database, the AI answer checker, the AI question generator and the server clock. Phase 3 = the Daily Challenge (same seven questions for everyone each UTC day, one attempt, guests only, standings, streak) and the files to put it online on Fly.io. Everything below was run in the build environment unless it says otherwise. **Two things could not be run here: the real Gemini call** (the build environment cannot reach Google, so every AI part was tested against a scripted fake model only) **and a real Fly.io deploy** (no Docker, no Fly account).

## Done and checked

| Area | State | How it was checked |
| --- | --- | --- |
| Scoring core (tiers, depth, sizes, hints, report, share) | Done | 23 unit tests |
| Daily maths (UTC day, countdown, streak, standings wording, share text with the daily number) | Done | 13 unit tests |
| API (start run, start/answer/miss, rate limit, no answer leaks, prompts only at question start) | Done | 20 API tests with a fake clock |
| SQLite database (questions, answers, spellings, runs, attempts, model log, corrections), migrations, seeding, export/import, backup | Done | 13 database tests; played through the real game in headless Chromium |
| Answer checker pipeline: stored ruling first, then the model once, decision stored; typo / "same as" auto-correction; same answer = same tier; low-confidence answers never counted; one call for simultaneous identical answers; prompt text only as quoted data | Done against a **fake model** | 22 judge tests |
| Model budget (per minute, per day), call log, retries | Done against a fake model | database tests |
| Server-side question clock (start ping, order, 30 s + grace + checking time, 12 tries) | Done | API tests; browser test `server-clock.cjs` (start sent, "late" becomes a time-out, lost start message is re-sent) |
| Question generator (propose, answer list, audit, automatic checks, drafts only) and review commands (list, show, approve, reject, export, import, answers review/set-tier/ok/remove, db backup) | Done against a fake model | 25 tests |
| Game: title, 7 questions, rarity roll and reveal for all 6 tiers, charge-up, dives, world title cards (tap to skip), scale bar, depth rail, report | Done | Headless Chromium plays: all-Mythic run, mixed runs with wrong answers and time-outs, 4 x Mythic then 3 x Common, and the reveal + charge-up + world card for tiers 0 to 4; screenshots compared with the v5 stills. A run of seven Common answers was not played end to end. |
| Planck Foam finale at 440 points, post-finale lines, "points past the edge" | Done | All-Mythic run (finale on answer 5, lines on answers 6 and 7) |
| Unexplored stretch, edging hints (2nd and 3rd landing in a row), "Planck Foam was N points away" | Done | Scripted run 4 x Mythic then 3 x Common |
| Wrong / unknown answers: message under the field, shake, retry with the remaining time | Done | Scripted |
| Time-out: 0 points, no shrink, grey dot, "TIME UP" | Done | Scripted |
| Share text (colour squares, no answers) | Done | Unit test; the clipboard button itself is not browser-tested |
| Sound: full v5 sound design, live WebAudio | Done, **not listened to** | Rendered offline; loudness per second compared with the v5 audio track (within 2-3 dB, finale impact within 1 dB). Nobody has heard it yet. |
| Production build and one-process server | Done | `npm run build`, typecheck, a real-keyboard run against the production server |
| **Daily Challenge, server side:** one stored set of seven per UTC day (least recently used first, mixed categories, no randomness), numbered DAILY #N; one attempt per guest; prompts sent one at a time; leaving the page or 2 minutes of silence ends the run with 0 for the rest; anonymous standings; streak; per-network limit (10 a day, hashed address); rate limit; "not enough questions" refusal | Done | 38 daily tests plus 6 command-line tests (including the midnight rollover, the per-network limit with the address never stored, and upgrading an old Phase 2 database) |
| **Daily Challenge, in the game:** PLAY DAILY / TODAY'S RESULT / DAILY IN PROGRESS on the title, SOLO RUN as the second button, countdown and streak, rule note, result and standings on the report, share text "MINITUDE DAILY #N", prompt arrives at question start | Done | `daily.cjs` in headless Chromium: new guest, 7 prompts one at a time, total, standings, reload shows the stored result, solo after daily, second guest gets the same questions, reload mid-run ends the daily; no console errors. `server-clock.cjs` still passes with the new start reply. |
| Server for hosting: static files with cache headers and gzip, security headers, hourly job (sets for today and tomorrow, daily database copy, newest 7 kept), clean shutdown, `Dockerfile`, `fly.toml` | Written; **the container image was never built and nothing was deployed** | The Docker steps were copied by hand and the result started: boots, headers, gzip (98 KB to 39.5 KB for the main script), per-network limit, backup file, SIGTERM exit, about 110 MB of memory |

## Not done, or not verified

- **The Gemini calls have never been made.** `llm/gemini.ts` follows the documented request shape, but nobody has seen a real reply. The default model name `gemini-3.8-flash` comes from the planning notes and is unchecked. Run `npm run trial -w @minitude/server` with your key first and read all of its output (see `docs/SERVER.md`).
- **Rarity is the model's own opinion**, judged against example answers. No web search, no real familiarity data. The one-line descriptions the model writes for new answers are unverified facts that players will see.
- **The question bank is still the placeholder.** 11 seed questions (one per category), about 690 answers with guessed tiers. The generator exists but has not been run for real: run `questions generate`, read the drafts, approve the good ones. The plan is 22 verified questions.
- **Sound has not been heard by a person.** Levels and structure match the v5 track numerically. Whether it *sounds* right needs your ears (`packages/web/src/audio.ts`).
- **Nothing stops someone looking answers up on another screen during their 30 seconds.** The server can only guarantee that prompts are not seen early (each one is released by the same message that starts its clock) and that time cannot be stretched. If the Daily ever matters, the answer is how it is presented (no prizes, no public names), not code.
- **Fly.io: nothing has been built or deployed.** `Dockerfile` and `fly.toml` are untested, as is the `fly ssh` way of putting real questions on the disk (`docs/DEPLOY.md`). Expect the first deploy to need a fix or two.
- **The Daily is guests only and can be played again** by clearing the browser's storage, using a private window or another browser. The per-network limit (10 a day) only blunts that. No accounts, so the streak and history live in one browser and are lost with it.
- **Closing the page ends a daily run** (on purpose, so a reload is not a free retry). A flat battery or a dropped connection costs the player their attempt.
- **The Daily needs at least 7 approved questions.** With the 11 placeholders it works but plays placeholders; do not share the link until real questions are on the server.
- **Standings are anonymous and tiny at first**: "you beat N%" shows only from 10 players.
- **No privacy note, cookie text or terms page.** The game keeps a random id in the browser's storage and typed answers in the database (no names, no addresses, the network fingerprint is a day-bound hash). Decide what to say before a public launch.
- **SQLite means one server on one machine**, and a disk that survives restarts. No Postgres, no accounts, no Unlimited mode, no lobbies.
- **`attempts` keeps every typed answer forever** (text only, no names or addresses). Decide a retention rule before launch.
- **No mobile portrait layout.** The game is a fixed 16:9 canvas scaled to fit; it works on a phone held sideways. Touch typing has not been tried on a device.
- **Screen flashes are strong** (Mythic reveal, finale burst). There is no "reduce flashes" setting yet; add one before a public release.
- **Screen readers** get nothing (the game is a canvas). A hidden live region for the question and the result is the obvious fix.
- **Real GPU performance is unmeasured.** The build environment only has software rendering.
- `npm audit` reports 6 advisories, all through `vitest` 2.x (a dev-only test tool, not shipped to players). Upgrading vitest is a major-version change; do it when you next touch the tests.
- The v5 videos were never re-cut for the 440-point scoring; the game is the first thing that shows it.

## Differences from the v5 video, on purpose

- The title screen waits for PLAY instead of pressing it by itself.
- The title has two buttons: PLAY DAILY (the day's shared run) and SOLO RUN. The video had only "DAILY - 26 OCT". A solo report has PLAY AGAIN; a daily report has a SOLO RUN button, the standings and a countdown to the next daily. Every report (the end of a run, and today's result opened from the title) also has HOME (or Esc, or H), which goes back to the title.
- The finale card's top line reads "500 POINTS - ANSWER 5 OF 7" (the video said "PERFECT RUN" because only a perfect run reached it; at 440 points that is no longer true). "PERFECT RUN" now appears only on the report of a true seven-Mythic run.
- A mute button (top-left, also the M key when you are not typing).

## Next steps, in order

1. `npm install`, copy `packages/server/.env.example` to `.env`, put your key in it, then `npm run trial -w @minitude/server -- --generate`. Read every line. Paste the output into Claude Code if anything looks wrong.
2. `npm run cli -- questions generate`, then review the drafts (`questions list --status draft`, `questions show <id>`) and approve the good ones. Aim for 22.
3. `npm run dev`, play it with the key set, and listen to the sound. Then `npm run cli -- answers review` to see what the model decided during play.
4. Decide the rarity policy questions that the trial raises (is the model's tiering believable? does it need web evidence?).
5. Put it online with `docs/DEPLOY.md` (Fly.io), put the approved questions on it, play a Daily there, look at the bill after a week.
6. Unlimited Solo, then private lobbies (`docs/PROJECT_CONTEXT.md`, section 12).
7. Mobile layout, reduce-flash setting, screen-reader text, a licence file, a privacy note, a retention rule for `attempts`.
