# Traffic: how many people play, and from where (built 17 Nov 2026)

The owner asked for a traffic count (17 Nov 2026) to decide which ad network to apply to, because the premium networks care about visitors from certain countries and because "I can't prove" how many people come. Nothing here uses Google Analytics, a cookie or any outside address.

## What it counts

`npm run cli -- traffic [--days 14]` shows, per UTC day:
- **visits**: how many times the game was opened and stayed open (below);
- **solo runs finished**: solo runs in which all seven questions were answered or timed out (from the existing `runs` table; solo runs left half way are deleted after 6 hours, so unfinished runs are not counted);
- **Daily players** and **Daily finished**: from `daily_plays` (one row per browser per day);
- and over the whole period, **where visits came from**, as a share per area (Singapore, US and Canada, UK and Ireland, Australia and New Zealand, rest of Asia, rest of Europe, Latin America, Middle East and Africa, other, unknown), the share of the markets the big ad networks pay most for, and the top time zones.

Multiplayer matches are not recorded anywhere, so they are not in these numbers.

## How a visit is counted

- `src/visit.ts` (browser): once per page load, after the page has been in view for 5 seconds (time in a hidden tab does not count) or the visitor touches it (pointer, key, touch or wheel), it sends `POST /api/visit` with `{ "tz": "Asia/Singapore" }`, the browser's own time zone, and nothing else. It sends nothing from a browser that says it is automated (`navigator.webdriver`) or in the test modes (`?debug=1`, `?manual=1`). A reload counts again.
- `POST /api/visit` (`src/siteRoutes.ts`): counts `visits(day, zone) += 1` (migration 5: only day, zone and a number: no address, no fingerprint, no guest id). It always answers `{ "ok": true }`, so a program learns nothing about whether it was counted. NOT counted: no user agent, a user agent that says it is a crawler, link preview, script, monitor or headless browser (`NOT_A_PERSON`), the developer's own machine (loopback), and a network that has already added 300 visits today (`VISITS_PER_NETWORK_PER_DAY`, held in memory per one-way network fingerprint, reset daily and on restart). 20 calls a minute per address, shared with the ratings and ideas forms. The usual 8 KB body limit applies.
- The zone is checked (`src/regions.ts`): it must have the shape of a zone name and be accepted by the runtime (`Intl.DateTimeFormat`), else it is stored as `other` (made-up names) or `unknown` (nothing usable), so the table cannot be filled with junk. `UTC` and `Etc/...` are stored as `UTC`. `areaOf()` groups zones into the areas above.

## What it cannot tell you (read the numbers as "about")

- **Bots.** A program that pretends to be a person (a normal browser user agent, a browser driven by a script that hides `webdriver`) still gets in; the 300-a-day cap per network limits how much one address can add, nothing more. The Daily and solo runs can also be played by a script through the API (the limits of `docs/SECURITY.md` cap that per network but cannot tell a person from a program). Ad networks measure their own traffic and discard what they judge invalid.
- **Place.** It is the time zone of the device, not the country of the person: a VPN user or a traveller shows as their device's zone. Fine for "Singapore-heavy or US-and-UK-heavy", not for exact country counts. Mediavine's "premium sessions" are counted by THEIR tools by country, not by this report.
- **People.** A visit is a visit, not a person: the same person on two days or two devices is two visits. There is no unique-visitor count on purpose (nothing identifies anybody).

## Privacy

`packages/web/privacy.html` has the row "A visit count" (what is sent, why, that it cannot be tied to a person) and the date was changed to 17 November 2026 (`SITE.privacyUpdated`). Still true: no cookies, no third-party analytics or scripts, nothing new in the browser's storage. `test/pages.test.ts` pins these sentences.

## Deploying it

The first start of the new server runs migration 5 on the live database (it only adds the `visits` table); take a `db backup` first as for any release. Until the new web code is live nothing is counted; the first numbers appear after the first visits following the deploy. Old browser tabs open from before the deploy do not send anything.

## Tests

`packages/server/test/traffic.test.ts` (the route, the filters, the caps, the zones, the report), `packages/web/test/visit.test.ts` (when the browser counts), `packages/web/test/pages.test.ts`, and `tools/browser-test/pages.cjs` (in a real browser: the ping sends only the time zone, once; automated browsers send nothing).
