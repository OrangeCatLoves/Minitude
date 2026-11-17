# Browser tests

Scripts that play the game in headless Chromium and save screenshots to `out/`. See `docs/TESTING.md` for the full story.

```bash
# terminal 1, repo root
npm run dev
# terminal 2
cd tools/browser-test
npm install && npm run install-browser
node run-perfect.cjs
node run-scenario.cjs h 5,5,5,5,0,0,0 skip
node reveals.cjs v 0,1,2,3,4,5
node server-clock.cjs      # the game and the server's question clock
node daily.cjs             # the Daily Challenge (uses new guests; best run against a fresh database)
node realtime.cjs
node audio-levels.cjs 5,5,5,5,5,5,5
node focus.cjs             # typing still works after Tab, clicks elsewhere, the sound button, switching tabs (submits nothing)
node pages.cjs             # the how-to-play, about and privacy pages, the three links on the title screen, and the visit count (docs/TRAFFIC.md; MINITUDE_URL=http://localhost:5173 if 127.0.0.1 is refused)
node ads.cjs               # the ad layout on the title screen (docs/ADS.md): three ads on a laptop, one banner on a phone, none after PLAY; pictures in out/ads-*.png (needs the dev server; MINITUDE_URL=http://localhost:5173 if 127.0.0.1 is refused)
node keyboard.cjs          # a phone's on-screen keyboard (FAKED): the answer box and the lobby field rise above it and come back, taps on raised YES / NO work; pictures in out/keyboard-*.png (submits nothing). Needs MINITUDE_URL=http://localhost:5173 on Windows (Vite listens on IPv6 there)
node home.cjs              # the HOME button on every report (plays a solo run, today's Daily and "today's result"; answers nothing)
node afterword.cjs         # the page under the report: logbook, rating, idea box, footer, scrolling, a swipe over a button, a phone size (docs/SITE.md; use a throw-away database)
node gem.cjs gem 7         # SINGULARITY gems: plays seven gems (840 points), pictures of the pull / vacuum / birth, the report and the cabinet (needs a database with the gems: use a throw-away copy)
node daily-answers.cjs ans  # the Daily's report: click an answer to see everything that counted (plays a Daily as a new guest: use a throw-away database that has the gems)
node rank.cjs rank 3        # the rank statistic on the page under the report (plays a solo run; needs a database with the gems: use a throw-away copy)
node glloss.cjs            # the world picture rebuilds itself after the browser takes the graphics context away (submits nothing)
```

Set `MINITUDE_CHANNEL=chrome` (or `msedge`) to use a browser you already have instead of running `install-browser`. Set `MINITUDE_URL` to test another address (for example the production server: `MINITUDE_URL=http://localhost:8787`).
`daily.cjs` plays today's real Daily, so it uses up that day's attempt for the guests it makes (new random guests each time, so you can run it again). These scripts use the demo checker's seed bank to pick answers of a wanted tier, so they only work against the mock checker.
