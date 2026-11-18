# Security notes

Written 16 Nov 2026 after the owner asked: "I want to ensure that the application is secure ... attackers cannot attack my application". "Attack" means several different things; this file lists them, what was tried against a local copy of the server, what was fixed, what is left, and how to relax the limits when the game grows.

**The limits are for a new, small game, and the owner said they will be relaxed as it scales (16 Nov 2026).** Every number is a setting: see "When you scale".

## What the internet can reach

One Fly machine (Singapore, fixed size, never scaled automatically) serves the game, the API and the privacy page over HTTPS (`force_https`, HSTS). There are **no accounts, no passwords and no cookies**: a visitor is a random id kept in their browser. Anyone can call:

| Area | Routes | What stops abuse |
| --- | --- | --- |
| Solo run | `POST /api/run`, `/api/run/:id/start`, `/answer`, `/miss`, `/abandon`, `GET /api/run/:id` | 90 requests a minute per network for new runs and answers, 270 for start / miss / abandon; 300 new runs a network a day; 20,000 new runs a day for the whole server; a stop when the disk is nearly full; run ids are random UUIDs |
| Daily | `GET /api/daily`, `POST /api/daily/start`, `GET /api/daily/answers...` | a guest id; 10 runs a network a day; the answer lists only for the guest who finished that Daily |
| Multiplayer | `/api/versus/...` (plain calls and one event stream per player) | a guest id; 300 requests a minute per network; at most 100 rooms |
| Forms | `POST /api/rating`, `/api/suggest` | validated, 20 calls a minute, a daily cap per network, a hidden trap field, no links, at most 5,000 unread ideas |
| Visit count | `POST /api/visit` | stores only a total per day and time zone (no address, no id), 20 calls a minute shared with the forms, 8 KB body, the time zone must be a real one, crawlers, scripts and loopback are not counted, 300 counted visits a day per network (`docs/TRAFFIC.md`) |
| Read only | `/api/health`, `/api/gems` (counts only), `/api/rank` | nothing secret in them |

Everything else is static files (the built game) or the game's front page. A "network" is an IPv4 address or an IPv6 /64.

## What was tried (local copy, never the live site) and what happened

The attack script is `tools/security/hostile.cjs` (it refuses to run against anything but localhost).

| Try | Before | Now |
| --- | --- | --- |
| Garbage input: invalid JSON, arrays, SQL text, script tags, a 100,000 letter name, odd guest ids, very long URLs | refused politely or kept as plain text; the server stayed up | same |
| Path traversal on the file server (`../`, `%2e%2e`, `%5c`, double encoding, `.env`) | always the game's front page, never a file | same |
| **One 80 MB upload** to an idea form | server memory went from 83 MB to 2,283 MB on the test PC. The live machine has 512 MB: one stranger's request could knock it over (it restarts by itself; the database survives) | refused with 413 at 8 KB (`MAX_BODY_BYTES`), whatever the Content-Length says; memory stayed at 83 MB |
| **A flood of new solo runs** | each run adds about 1 KB to the database (measured after SQLite merges its journal; an earlier 10 to 20 KB figure counted the temporary journal file and was wrong). 90 a minute from one address is about 140 MB a day, and the disk had 453 MB free, so about three days. A visitor on IPv6 gets a new address with every request, so the per-address limit did not apply at all | IPv6 is counted by its /64 (`networkOf`); at most 300 new runs a network a day and 20,000 for the whole server; new solo runs are refused below 150 MB free and new Dailies below 40 MB; solo runs left half way for 6 hours are deleted every hour; the nightly backup is skipped when it would leave less than 60 MB free |
| **"Finished" junk runs** (a script starts a run and marks all seven questions as timed out: 8 requests, only one of them limited) | 300 made in 4.7 s; nothing ever deleted them | start / miss / abandon are rate limited too (270 a minute a network); runs older than a day in which nothing was typed and nothing scored are deleted every hour (`purgeEmptyRuns`) |
| One address using up the whole day's allowance of new solo runs (a cheap way to lock every other solo player out) | one address could use the 20,000 in about 4 hours | 300 a network a day, so one person cannot spend everybody's allowance |
| CORS preflight from another website | `access-control-allow-origin: *`: any website could call the API from a visitor's browser | no CORS header |
| A path under `/api` that does not exist | the game's front page with 200 | a JSON 404 |
| Control characters in an answer (escape codes that can rewrite a terminal's screen or clipboard when the owner reads `answers unknown`) | stored as typed | turned into spaces before anything is stored |
| Dependencies (`npm audit --omit=dev`) | 2 moderate findings (hono, @hono/node-server) | 0: hono 4.13.18, @hono/node-server 2.1.8 |
| Secrets in the public GitHub history (all commits, all branches) | none found (no key patterns; `.env` and databases are ignored) | same |
| Browser-side script injection | the game never builds HTML from text (no `innerHTML` anywhere), so there is no known way in | plus a Content-Security-Policy (below) |

## The headers

Every reply carries (`src/securityHeaders.ts`): a Content-Security-Policy that allows only the site's own address for scripts, styles, pictures, fonts, connections and media (no inline script, no outside host, no framing), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, HSTS, and a Permissions-Policy that switches off the camera, microphone, location, payment, USB and the other sensors the game never uses. `tools/browser-test/csp.cjs` plays the game against the production server and fails on any refusal. If a new feature needs an outside host or an inline script, the policy has to be changed on purpose: the test will say so. It was tested in Chrome only.

## What a flood can and cannot cost

The machine is a fixed size, there is one of it, and nothing scales it automatically, so a flood makes the game slow, busy or (at worst) restart; it cannot raise the machine's price. The volume is a fixed 1 GB. The only metered item is data going out: $0.04 per GB from Singapore (checked 16 Nov 2026; inbound is free). A first visit downloads about 2.4 MB, so 1 GB is about 400 visits and $10 would take about 250 GB. If that ever becomes a worry, put Cloudflare's free proxy in front (it caches the static files and absorbs floods; the privacy page and `CLIENT_IP_HEADER=cf-connecting-ip` would have to change).

## When you scale: every limit and how to relax it

Set a setting in `fly.toml` under `[env]` and run `fly deploy --ha=false` (a deploy restarts the machine for about a minute). `0` switches a limit off unless noted. The limits protect one small machine; raise them together with the machine (`[[vm]]` memory and CPU) and the volume (`fly volumes extend`).

| Limit | Default | Setting / where | Raise it when |
| --- | --- | --- | --- |
| New solo runs a day, whole server | 20,000 | `MAX_RUNS_PER_DAY` | players start more than about 15,000 solo games a day |
| New solo runs a day, one network | 300 | `MAX_RUNS_PER_NETWORK_PER_DAY` | a big school or an office reports "That is a lot of games from one network today" |
| Daily runs a day, one network | 10 | `DAILY_PER_IP` | schools or offices share one address |
| Requests a minute, one network (new runs and answers; start / miss / abandon get 3 times this) | 90 | `RATE_LIMIT_PER_MINUTE` | many people behind one address (a class of 30 typing at once) |
| Multiplayer requests a minute, one network | 300 | `perMinute` in `versusRoutes.ts` | rarely |
| Multiplayer rooms at once | 100 | `maxRooms` in `versus.ts` | many rooms are played at the same moment |
| Request body size | 8 KB | `MAX_BODY_BYTES` in `app.ts` | never for the current game |
| Free disk below which new solo runs stop / new Dailies stop / the backup is skipped | 150 MB / 40 MB / 60 MB spare | `src/diskguard.ts` | when the volume is bigger, or if they trip too early |
| Solo runs left half way are deleted after / empty runs after | 6 h / 24 h | `ABANDONED_RUN_MS`, `EMPTY_RUN_MS` in `index.ts` | rarely |
| Daily backups kept / hand-made backups kept | 3 / 2 | `BACKUP_KEEP`, `KEEP_MANUAL` | the volume grows |
| Counted visits a day, one network | 300 | `VISITS_PER_NETWORK_PER_DAY` in `siteRoutes.ts` | a big school or an office makes the count look too low |

What the real ceiling is: the one machine's processor. A wrong or misspelled answer takes up to about 35 ms of it on the biggest list; correct answers take a few milliseconds. My estimate (not measured under load) is a few hundred players at the same moment before it slows down. The cure is a bigger machine (`fly scale vm`, `fly scale memory`), not a code change. A real player's runs also store their typed answers, probably a few KB a run, so the disk fills with real players too: at that point extend the volume ($0.15 a GB a month) and decide how long finished runs are kept.

## What is left (in the order I would do them)

1. **Accounts, not code, are the likeliest way in.** Turn on two-step sign-in (an authenticator app, not SMS) for: Fly.io (it holds the database and can open a shell on the machine), GitHub, the Google account behind the privacy-page contact address, Cloudflare and the domain's registrar. Anyone who takes one of these over can change the site, whatever the code does. This is the owner's to do; nothing in the repo can.
2. **An alarm.** If a guard trips ("We are very busy right now") nobody is told. Free option: an uptime monitor (UptimeRobot, Better Stack) that checks `/api/health` every 5 minutes and emails the owner. Also look at Fly's billing and metrics pages once a week, and read the first invoice with the 512 MB machine.
3. **Git author email.** All commits in the public repository show the owner's university email as author. New commits can use GitHub's no-reply address (GitHub, Settings, Emails, "Keep my email addresses private", then `git config user.email <the no-reply address>`). Removing it from the old commits means rewriting history and force-pushing: possible, but it changes every commit id (ask first).
4. **The old Gemini key.** The game no longer uses it and it was removed from Fly, but a key that was ever on this PC can still work at Google. Delete it in Google AI Studio (Get API key).
5. **Multiplayer room hoarding.** One person can create all 100 rooms and keep them (a room is cleared after 2 idle minutes, so they must keep making them), which blocks multiplayer for everyone; many open event streams could also reach Fly's limit of 250 requests at once. Fix when it happens: a cap per network, counted in `VersusHub`.
6. **Wrong guesses cost CPU.** See above. Cheap fixes when needed: keep each question's spellings in memory; or a global "busy" answer when the server is behind.
7. **A spread-out attacker** (many VPN or botnet addresses) is not stopped by any per-network limit; only the whole-server limits and the disk guard hold, and they turn an attack into a "busy" message, not a crash or a bill.
8. **The container runs as root.** A break-in would start with more power than it needs. Running as a plain user needs the volume's owner changed at start; not done.
9. **Development tools** (`vitest`, `vite`, `esbuild`) have known flaws (`npm audit`). They are not in the live image; they matter only while `npm run dev` or `npm test` runs on the owner's PC with other websites open. Upgrading vitest to the current major is on the list in `CLAUDE.md`.
10. **Retention.** Typed answers of solo and Daily runs are kept without an end date (the privacy page says they are kept). Abandoned and empty solo runs are cleared automatically, finished ones stay.
11. **By design, not fixed:** the Daily can be replayed by clearing browser storage (a harsher rule needs the owner's yes); a guest id is not an account; the Daily's standings are anonymous.

## Re-checking

```bash
npm test                                          # includes test/security.test.ts
npm audit --omit=dev                              # the live dependencies
npm run build
# a throw-away production-mode server on port 8788 (never the live site):
cd packages/server && PORT=8788 DATABASE_FILE=<new empty file> CLIENT_IP_HEADER=x-test-ip node --import tsx src/index.ts
cd tools/security && DATABASE_FILE=<the same file> node hostile.cjs      # the attacks above, with numbers
cd tools/browser-test && MINITUDE_URL=http://localhost:8788 MINITUDE_CHANNEL=chrome node csp.cjs
```

## Added 18 Nov 2026: the answer lists of a solo run and of a multiplayer match

`GET /api/run/:id/answers` and `/list` give the accepted answers of a question to whoever holds the id of a FINISHED solo run (a random UUID that only the player's browser has; the same routes refuse a Daily run, and a run with any open question). `GET /api/versus/:code/answers` and `/list` give them to a guest who sits in the room, once the match is over (409 before, 404 for anybody else, closed again by a rematch). Both are rate limited like the Daily's, read-only, and covered by `packages/server/test/answers-solo-room.test.ts`. What they show is what the Daily's screen already shows after the run (what counts, never how it is checked).
