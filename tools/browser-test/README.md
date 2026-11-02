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
```

Set `MINITUDE_URL` to test another address (for example the production server: `MINITUDE_URL=http://localhost:8787`).
`daily.cjs` plays today's real Daily, so it uses up that day's attempt for the guests it makes (new random guests each time, so you can run it again). These scripts use the demo checker's seed bank to pick answers of a wanted tier, so they only work against the mock checker.
