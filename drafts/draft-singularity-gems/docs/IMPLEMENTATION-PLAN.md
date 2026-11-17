# Building SINGULARITY for real: the plan (nothing here has been done)

Everything below was found by reading the code on 14 Nov 2026 (git `a403691`). The owner decides before any of it starts; several steps touch rules that CLAUDE.md says must not change without asking (tiers and points, the 700 display, the wording files).

## Needs the owner's yes (decided rules that change)

1. **A seventh tier, 120 points** (CLAUDE.md "Rules that are decided": tiers Common 10 to Mythic 100). Already requested in this conversation; to be recorded in CLAUDE.md and `docs/DECISIONS.md`.
2. **The "/ 700 points" display becomes 840** (`MAX_POINTS_DISPLAY` in `core/src/consts.ts`; `MAX_POINTS` in `core/src/tiers.ts`).
3. **Audio:** a new sting (draft in `src/sound.js`). CLAUDE.md says to ask before touching `packages/web/src/audio.ts`.
4. **Privacy page:** it says the game keeps "four small items in your browser's local storage, and nothing else" (`packages/web/privacy.html`, `src/privacy.ts`). A saved cabinet is a fifth item (`minitude.gems`: the list of gem numbers found). The page and its date must change in the same commit; it must not say how answers are checked (a test scans it).
5. **Which answers are gems** (the 200 picks in `gems/gem-picks.md`), that a gem is an obscure **Mythic** answer with one owner-chosen exception (Tonkotsu ramen for "Name a soup", stored Legendary), and the wording of the 200 descriptions (each written from its Wikipedia article, so a person should still read them before they go live).

## The design in code terms

**A gem is not a new stored tier.** `answers.tier` has `CHECK (tier BETWEEN 0 AND 5)` (`server/src/db/schema.ts:27`), and SQLite cannot relax a CHECK without rebuilding a 289,198-row table. Instead:

- New migration (a NEW entry at the end of `MIGRATIONS`, never edit an old one): `CREATE TABLE gems (question_id TEXT PRIMARY KEY REFERENCES questions(id), answer_id INTEGER NOT NULL REFERENCES answers(id))`. One gem per question by construction.
- The answer checker (`server/src/judge/pipeline.ts`) decides the tier as today, then, if the canonical answer is its question's gem, reports `tier: 6`. Every spelling, alias and accepted "Did you mean?" already resolves to the canonical answer, so they all count.
- The stored rarity of the answer is left alone (the bank sheet, `answers list` and the rarity audit keep working).

## Changes by package

### `packages/core` (pure, tested first)
- `tiers.ts`: add the 7th entry (`SINGULARITY`, 120, colours, `factor: '÷ 1,000,000'`, `sub`); `MAX_POINTS` = `RUN_LENGTH * 120`.
- `consts.ts`: `MAX_POINTS_DISPLAY = 840`.
- `report.ts`: `SQUARES` gets a 7th entry `💎`; the report line gets the gem count; text for "N GEM(S) FOUND ...".
- `run.ts` already reads `TIERS[tier].points`, so scoring follows by itself. Check `isPerfect` (it may compare with `MAX_POINTS`) and `stageOfPoints` with totals up to 840 (points above 440 already count, unchanged).
- New `gems.ts`: the cabinet as a pure set of gem numbers (add, count, per-category counts), plus its serialisation (same pattern as `logbook.ts`).
- Tests: scoring with a 120 answer; perfect run; `shareText` with a 💎; `buildReport` for 840; cabinet add/serialise/corrupt-input.

### `packages/server`
- `db/schema.ts`: the new migration (above). `db/repo.ts`: `gemOf(questionId)`, `setGem(questionId, answerId)`, `clearGem`, `listGems()`. All SQL stays in `Repo`.
- `judge/pipeline.ts`: return tier 6 for the gem (every code path that builds an answer response: valid, confirmed, literal). The API response carries `tier` and `points` as today; the **gem's name is not sent before the player has answered** (the existing "answers stay out of the browser" test must keep passing, and I would add one for the gem).
- `app.ts`, `versus.ts`, daily scoring: anywhere that validates `tier` as 0 to 5 or sizes arrays by six. The `attempts` columns have no CHECK, so old rows are fine.
- `cli/commands.ts`: the `tier < 0 || tier > 5` checks at lines 236, 309 and 335 are about stored tiers and stay; add `gems list | set <question> <answer> | clear <question> | import <file>`, and `gems audit` (every question has exactly one gem and it is Mythic, except rows marked as owner exceptions; no gem name collides with another answer of its question). Importing the 200 picks follows the usual steps: backup first, rehearse on a copy, then production only on the owner's yes.
- The bank sheet (`tools/bank-sheet`, `docs/BANK_SHEET.md`): show the gem in each question, then refresh and republish (standing request).
- `test/nomodel.test.ts` and the "players are never told how answers are checked" tests: the new strings must pass them.

### `packages/web` (the largest part)
- `config.ts`: the arrays sized for six tiers get a 7th value: `GEM`, `HOP`, `STOP`, `SHAKE_K`, `VIG_K`, `STAMP`, `ROLL_DUR`, `REV_HOLD`, `TITLES`, `TITLE_COL`.
- `celebrate.ts` (`frontReveal`, `gemCy`, stamp, title), `impact.ts` (shake, flash, vignette keyed by `ti`), `timeline.ts` (`ROLL_DUR[r.ti]`, `REV_HOLD[r.ti]`, `12 + r.ti` roll steps), `ui.ts` (`roll()` cycles six icons; the roll should still show six and then "pull" into the gem, as in the draft).
- The new pull / vacuum / birth sequence: port `drawReveal` from `src/scenes.js` into `celebrate.ts` as a pure function of `tau` (the engine rule: a frame is a function of the clock; `docs/ENGINE.md`). Port `src/gem.js` as `gems.ts` (it already only needs a 2D canvas).
- `audio.ts`: add the sting and `collect` from `src/sound.js` (same helper style: `tone`, `bell`, `noiseExp`, `thump` already exist there). The six stings are pre-rendered into buffers after the first click; the seventh can be the same.
- `assets.ts` / `public/assets`: the tier icon for the HUD and roll (a 32 x 32 `gem6.png`: use `gem-sprites/CHOSEN-gem6-singularity-crescent.png` (the owner chose the Crescent in the Twilight tone on 14 Nov 2026), or draw it with `gem.js`).
- New: the cabinet screen (`cabinet.ts`) and the HUD counter; opened from the report and from a small button on the title screen. Storage: one key, `minitude.gems`, read and written inside `try/catch` like `afterword.ts` does.
- Report (`ui.ts`) and share text from core.
- Tests (`packages/web/test`): cabinet storage; private text scan (the new strings); timeline with a tier-6 record (no NaN, the reveal ends before the next question).
- `tools/browser-test`: a scenario that answers a gem and screenshots the sequence (the `?manual=1` clock exists for this).

### Docs and standing rules
`CLAUDE.md` (rules, layout), `docs/DECISIONS.md`, `docs/STATUS.md`, `docs/SERVER.md` (gems table and commands), `docs/ENGINE.md` (the new sequence), `docs/AUDIO.md`, `docs/SITE.md`, privacy page and its date, and the bank sheet.

## Order of work (each step ends green: `npm test`, `npm run typecheck`)

1. core: tier, scoring, report, cabinet set, tests. 2. server: migration, repo, pipeline, tests; `gems import` rehearsed on a copy. 3. web: arrays and reveal port, sound, cabinet, storage. 4. browser-test run and screenshots; **play it with the key set and listen** (sound has never been heard by a person: known gap 3). 5. Docs, privacy page. 6. Owner reviews, commits. 7. Deploy: backup, deploy the code, import the gems, check `/api/health`, play a Daily-less solo run. The Daily sets are unaffected (a gem is just another answer).

## Risks and things to test

- A 120-point answer crosses six worlds in one dive: check the world cards (`CARD_LEN` 7 s each) and the "edging" hints in Unexplored (a gem can jump from far below 400 to above 440 in one answer; the finale must still play exactly once).
- Players who clear their browser data lose their cabinet (privacy page says so already for the logbook).
- Multiplayer: the reveal is local; make sure a gem does not leak the answer to others before the round ends.
- Flashes and shake: add a "reduce flashes" setting first (known gap 7), or ship a softer flash.
- The 4 junk answers already live (CLAUDE.md known gaps) and the "short name scores Mythic" cases in `docs/FINDINGS.md` should be fixed first, because a gem pick can collide with them.

## Rough size

core and server about a day including tests; web about two to three days (the reveal port, sound and cabinet are most of it); docs and the browser run half a day.
