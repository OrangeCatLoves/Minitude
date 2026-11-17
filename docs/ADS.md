# Ads: the layout (built 17 Nov 2026, reworked the same day, DRAFT, SWITCHED OFF)

The owner wants to earn money from ads ("money is the priority", 17 Nov 2026) but no full-screen ads, and said the audience is "literally everyone" (the owner is 24). This file records what was decided, what has been built, and what is still missing before a single real ad can show. **Nothing here loads an ad or calls an outside address: the slots are empty boxes.** What Google asks of the site, and the plan, are in `docs/ADSENSE.md`.

## What the owner decided (17 Nov 2026)

- **On the game page, only the TITLE SCREEN has ads.** Not during a run, not in the lobby, not on the report or the finish screen, not over the gem cabinet. They go when PLAY is pressed and come back with the title screen. (The owner chose this from three options.)
- **A large monitor gets three ads:** one left of the game (160 x 600), one right of it (160 x 600) and a banner under it (728 x 90), and no floating video ad.
- **A smaller screen gets one small banner (320 x 50) at the very bottom.**
- **No full-screen ads (interstitial or rewarded video), no sticky banner during play, no ads on the finish screen.**
- **NO RISK OF A VIOLATION NOTICE (the owner, after reading `docs/ADSENSE.md`):** Google's guidance for games is at least 150 px between ads and the edge of a game, so every ad on the game page is kept 150 px from the game and from the buttons in its corners, whatever that costs in size. Where that cannot be done without crushing the game (a phone on its side) there is no ad on the game page.
- **Ads on the text pages too** (how to play, about): they have real text and no game controls, which is the safest place under Google's rules. One ad place in each, between two sections that have no links or buttons. None on the privacy page.
- Money first; the network is Google AdSense (publisher id `ca-pub-8003325864730114`, public), Mediavine not soon.

## What the rule means for the screen (numbers)

The ads take room from the game on the title screen: each side ad needs 8 (edge) + 160 (ad) + 150 (gap) = **318 px on each side**, the 728 x 90 banner needs 8 + 90 + 150 = **248 px at the bottom**, the small banner 6 + 50 + 150 = **206 px at the bottom** (`ROOM` in `src/ads.ts`, `--ad-side` and `--ad-bottom` in `index.html`; a test keeps them equal). The layout is chosen by what is left for the game (16:9):

| Window | Layout | The game on the title screen (without ads) |
| --- | --- | --- |
| 1920 x 1080 monitor (page about 1920 x 950) | three ads | 1248 x 702 (1689 x 950) |
| 1600 x 900 | three ads | 964 x 542 (1600 x 900) |
| 1516 x 900 and wider: the three ads leave the game at least 880 wide | three ads | at least 880 wide |
| 1440 x 800 laptop | bottom banner only | 1056 x 594 (1422 x 800) |
| 1366 x 650 | bottom banner only | 790 x 444 (1155 x 650) |
| 1024 x 700 tablet on its side | bottom banner only | 878 x 494 (1024 x 576) |
| 768 x 1024 tablet, 390 x 844 phone, 320 x 568 phone | bottom banner only | no change (the game is as wide as the screen already) |
| 844 x 390 or 932 x 430 phone on its side | **no ad on the game page** (it would leave a game under 330 px wide) | unchanged |

So a typical 1440 x 800 or 1536 x 864 laptop gets the small banner only, not three ads: three ads with 150 px around the game would shrink it to about 800 px wide. The three-ad layout is for monitors of about 1500 px and wider. The game eases back to its full size over 0.2 s when PLAY is pressed.

## What was built

- `packages/web/src/ads.ts`: `ADS_ENABLED` is the master switch (**false**); `ADSENSE_CLIENT`; `ROOM`, `gameSize()` and `adMode(enabled, onTitle, width, height)` decide `'off' | 'wide' | 'small'`; `AdFrame` writes it on `<html>` as `data-ads` and follows window resizes. `test/ads.test.ts` pins the rules, the numbers (also against `index.html`) and the switch.
- `packages/web/index.html`: the room the game gives up (0 without the attribute, so the page is the page of before), the sound and cabinet buttons and the three title links kept inside the game's part of the window (so they are 150 px from the side ads too), and three empty slots (`#ads .ad-left / .ad-right / .ad-bottom`).
- `packages/web/src/site.css`: where the slots sit, the preview boxes, and the text-page ad place (`.doc-ad`).
- `packages/web/src/docpage.ts`, `how-to-play.html`, `about.html`: one `.doc-ad` place each, hidden unless `ADS_ENABLED` or `?adpreview=1`.
- `packages/web/src/game.ts`: one line in `update()` tells `AdFrame` whether the title screen is up with nothing on top (`phase === 'title'`, PLAY not pressed, cabinet closed). `main.ts` creates the `AdFrame` only if `ADS_ENABLED` or `?adpreview=1`.
- **AdSense verification (Phase A, `docs/ADSENSE.md`):** `<meta name="google-adsense-account" content="ca-pub-8003325864730114">` in the head of the game and of the three plain pages, and `public/ads.txt` (`google.com, pub-8003325864730114, DIRECT, f08c47fec0942fa0`). No script, no cookie. `test/pages.test.ts` checks the tags, the file, and that nothing from Google is loaded.
- `tools/browser-test/ads.cjs`: opens the title screen at thirteen sizes and checks the numbers above in a real browser (each ad at least 150 px from the game, the sound and cabinet buttons and the title links; 16:9 kept; the ads go on PLAY and while the cabinet is open; a click on an ad does not start the game; nothing changes without `?adpreview=1`) and the text pages (one hidden ad place, shown in the preview, at least 100 px from any link or button); pictures in `tools/browser-test/out/ads-*.png`.

**To look at it:** `npm run dev`, then open `http://localhost:5173/?adpreview=1` (dashed boxes with their size), and `/how-to-play?adpreview=1`. Resize the window or use the phone view of the browser's developer tools. Without `?adpreview=1` nobody sees anything. (`?adpreview=1` also works on the live site once this code is deployed; it only shows empty dashed boxes.)

## What is NOT done (all of this before `ADS_ENABLED` can become true)

1. **AdSense must approve the site** (`docs/ADSENSE.md`, Phase A: the owner verifies the site and asks for a review; a few days to four weeks). Traffic was about 0 to 3 Daily runs a day on 16 Nov 2026, so nothing earns yet.
2. **The ad code itself** goes into the slots (160 x 600, 728 x 90, 320 x 50, and a responsive one on the text pages), from the account. None is in the game.
3. **The privacy page** (`packages/web/privacy.html`) says no cookies, no analytics, no third-party scripts, no advertising: it must be rewritten and re-dated in the same change (CLAUDE.md "Keep the privacy page true"). `private.test.ts`, `pages.test.ts` and `site.test.ts` guard parts of it.
4. **A consent message** for visitors in the EEA, the UK and Switzerland (Google's own, set up in the AdSense account), and the child-related decision, because the audience is everyone.
5. **The security policy** (`packages/server/src/securityHeaders.ts`) allows only the site's own address. Google does NOT support a list of its hosts: it supports only a strict policy with a fresh nonce in the page's HTML on every request, and says nothing about pictures and frames, so those would have to be loosened on the game page (details in `docs/ADSENSE.md`, section 3), with `tools/browser-test/csp.cjs` passing. This weakens the policy built on 16 Nov, a little.
6. **Real phones.** Tested only in a headless desktop browser. Also test the page weight and the speed of the world pictures with the ad scripts loaded.

## Content around the game (built 17 Nov 2026)

AdSense wants real content around a game (the game itself is a picture). `/how-to-play` and `/about` exist now, linked from the title screen, listed in `sitemap.xml` (see `docs/SITE.md`). The owner plans to apply to Google AdSense early. Applying does not need the ad code, the consent banner or a changed security policy (the site is verified with the meta tag and `ads.txt`, which load no script); showing ads does (list above). Traffic is counted with `npm run cli -- traffic` (`docs/TRAFFIC.md`).

## Rules for whoever changes this

- Do not add ads to the run, the lobby, the report or the finish screen, or full-screen or floating formats, without asking the owner.
- Do not bring an ad closer than 150 px to the game, its corner buttons or the title links, and never hold PLAY back for an ad (Google's rules, `docs/ADSENSE.md`).
- Keep `ADS_ENABLED` false until the owner says go AND items 1 to 5 above are done.
- Any change to the `--ad-*` numbers in `index.html` must keep `ads.test.ts` and `tools/browser-test/ads.cjs` passing.
