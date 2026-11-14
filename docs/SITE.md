# The site around the game: the page under the report and the privacy page

Added 13 Nov 2026 at the owner's request ("I want my website to look genuinely professional"). Contact details were set the same day (see "Contact details"). **Deployed to Fly on 13 Nov 2026** (machine version 10) after a `db backup` (`minitude-20261112-163704.db`). The first start ran migration 3 on the live database (52 approved questions and 78,938 answers untouched). Live check: `/privacy` loads on minitude.io, www.minitude.io and minitude-lwb.fly.dev; the new routes answer (400/404/400 for bad requests, nothing stored); one solo run played to the end showed the page under the report with the right footer; server memory 71 MB.

## What the player gets

**Under the end-of-run report** (solo, Daily, multiplayer, and "today's result" opened from the title). The report looks and works as before. Once it has settled (the buttons are showing, 2.6 s) the page becomes scrollable and a sheet slides up over the game as the player scrolls down:

1. **logbook**: `streak · played · avg · best` for this browser (see below).
2. **how was that dive?** `1 = meh · 5 = great`, buttons 1 to 5. Tapping again changes the rating.
3. **got an idea for a question? tell us what to ask**: a text box (placeholder "name a type of cloud…") and SUBMIT.
4. **footer**: `found a bug? lost your streak? contact us · instagram · privacy`, then `© 2026 Minitude`.

Leaving the report (HOME, PLAY AGAIN, Esc) closes the sheet and scrolls back to the top. While a run is being played there is nothing to scroll to.

**The privacy page**, `/privacy` (a new tab from the footer). How the game works, what is stored and why (a table), what stays in the browser (the four local-storage keys, and the visitor's own anonymous ID shown so they can quote it), who else is involved (Fly.io, Cloudflare for the domain name), rights and deletion, children, trademarks and credits, changes, contact. It must say nothing about how answers are checked: `packages/web/test/private.test.ts` guards that (the page is scanned too).

## The logbook

Stored only in the browser (`localStorage` key `minitude.logbook`), maths in `packages/core/src/logbook.ts`:
- **played**: finished runs of any kind (solo, Daily, multiplayer). **avg**: average points per run, rounded. **best**: best run.
- **streak**: days in a row (UTC) on which at least one run was finished, ending today, or yesterday while today is still open. **This is not the Daily streak** shown on the title screen (that one counts only Daily runs and lives on the server).
- A run is counted once, when its report starts. Looking at "today's result" again does not count. Damaged storage starts a fresh logbook rather than show nonsense.

## The two forms (server)

`src/siteRoutes.ts`, migration 3 in `db/schema.ts` (tables `ratings` and `suggestions`; no name, no guest id, only the text or score, the day and the same one-way day-bound network fingerprint the Daily uses).
- `POST /api/rating {runId, score}` or `{mode: 'versus', score}`. Score 1 to 5. One rating per run (a second tap changes it). The kind of run comes from the run itself, not from the browser. At most 200 a day per network.
- `POST /api/suggest {text, website}`. 5 to 140 characters, tidied (control characters, spaces), at least three letters, **no links** (almost always ads), the same idea sent again is kept once, 5 a day per network, and the database stops taking ideas at 5,000 unread. `website` is a hidden field: if a program fills it in, it is told "thanks" and nothing is kept.
- Both: at most 20 calls a minute per address, and the replies pass the same "nothing about how answers are checked" guard as the rest of the API.
- Reading them: `npm run cli -- suggestions list [--status new|used|skipped|all] [--limit 50]`, `suggestions mark <id> new|used|skipped`, `ratings` (count, average, by score and kind). `db stats` shows both counts.

## Contact details (`packages/web/src/site.ts`)

The footer shows only links that have an address, so nothing points nowhere.
- **Set on 13 Nov 2026 by the owner:** `contactEmail` is the owner's own Gmail (chosen by the owner; I had suggested `contact@minitude.io` through Cloudflare Email Routing so a personal address is not public). **On 14 Nov 2026 the owner removed the separate "business inquiries" link** (it only differed by its subject line), so the footer and the privacy page have one address: "contact us" (the `businessEmail` setting and `VITE_BUSINESS_EMAIL` are gone). The privacy page's "last updated" date was moved to 14 November 2026 for that change.
- **`instagramUrl` is empty on purpose** ("not for now"): the Instagram link is simply not shown. Set the full address in `site.ts` to show it.
- The address is visible to anyone, so expect some spam. To change it later, edit one line in `site.ts` and deploy; for a quick look in development the values can also come from `VITE_CONTACT_EMAIL` and `VITE_INSTAGRAM_URL` (build or dev time).

To deploy, follow `docs/DEPLOY.md`. The deploy runs migration 3 on the live database when the server starts (it only adds two tables); take a `db backup` first as always. The server serves `privacy.html` at `/privacy`; the build now has two pages (`vite.config.ts`).

## Decisions made without asking (tell the owner)

1. **"lost an unlock?" became "lost your streak?"**: Minitude has no unlocks. The question shows only when there is a "contact us" to answer it.
2. **Order** under the report: logbook, rating, idea box, footer (the owner listed them bottom to top).
3. **The privacy link opens in a new tab**, so the report and its SHARE button stay on screen.
4. **A report button now acts when the finger is lifted in the same place, not when it first touches.** The page can now be scrolled from the game, and the buttons sit at the bottom where a thumb starts a swipe; a swipe must not press PLAY AGAIN. A tap and a mouse click work as before.
5. **Keys typed in the page under the report belong to it.** An "h" typed in the idea box no longer means HOME, Enter does not start a new run, "m" does not toggle sound.
6. **No scroll hint** is drawn on the report: the owner asked for content people scroll down to find. An arrow or "more below" cue is a small addition if wanted.
7. **Retention.** The privacy page says records are kept as long as they are useful and then deleted or anonymised. **There is no automatic deletion job yet** (known gap: a retention rule for `attempts`). Either build one or soften the sentence.
8. **Deletion on request** is by the browser's anonymous ID, which the privacy page shows to the visitor; there is no self-service delete button.
9. **No Wikidata or Wikipedia credit** on the page: it would say where answers come from, and the owner's rule is that players are not told how answers are checked. Silkscreen (SIL Open Font License 1.1) is credited.
10. The page is a sensible draft, **not legal advice**. A lawyer should read it before the game is promoted, especially the rights, children and trademark sections, and there are no Terms of Use.

## If something changes, change the page

The privacy text is only true while these are: no cookies, no analytics or other third-party scripts, Cloudflare used for DNS only (not proxying the game), typed answers kept for solo and Daily runs but not multiplayer, ratings and ideas as above. Turning on the Cloudflare proxy, adding analytics, or storing multiplayer answers means editing `packages/web/privacy.html` and its date (`privacyUpdated` in `site.ts`).

## Where the code is

`packages/web/src/afterword.ts` (the sheet), `site.ts` (contacts and footer), `site.css` (this and the privacy page), `privacy.html` + `privacy.ts`; `index.html` has the empty `#after` element; `game.ts` opens and closes it (`syncAfter`) and records the run (`enterReport`); `packages/core/src/logbook.ts`; `packages/server/src/siteRoutes.ts`. Tests: `core/test/logbook.test.ts`, `server/test/site.test.ts`, `web/test/site.test.ts`, `web/test/private.test.ts`, and the browser test `tools/browser-test/afterword.cjs` (plays real runs to the end, scrolls, rates, sends an idea, swipes over a button, repeats on a phone size).

## The gem cabinet and the privacy page (14 Nov 2026)

The browser now keeps a **fifth** item, `minitude.gems` (the gems found: question, answer, one line, day). The privacy page says "five small items", lists it, explains the cabinet and the new rarity (Singularity 120, the most a run can score is 840); its date stayed 14 November 2026 because it changed that day. It still says nothing about how answers are checked (`packages/web/test/private.test.ts`). The cabinet itself is `packages/web/src/cabinet.ts` (HTML over the game, styled in `site.css`), opened from `#cabbtn` on the title screen and the report.
