# Ads: the layout (built 17 Nov 2026, DRAFT, SWITCHED OFF)

The owner wants to earn money from ads ("money is the priority", 17 Nov 2026) but no full-screen ads, and said the audience is "literally everyone" (the owner is 24). This file records what was decided, what has been built, and what is still missing before a single real ad can show. **Nothing here loads an ad or calls an outside address: the slots are empty boxes.**

## What the owner decided (17 Nov 2026)

- **Only the TITLE SCREEN has ads.** Not during a run, not in the lobby, not on the report or the finish screen, not over the gem cabinet. They go when PLAY is pressed and come back with the title screen. (The owner chose this from three options; "title and menu screens" and "every screen" were offered and not chosen.)
- **A large screen (a window at least 1200 x 600, so a laptop and up) gets three ads:** one left of the game (160 x 600), one right of it (160 x 600) and a banner under it (728 x 90), and no floating video ad.
- **A smaller screen gets one small banner (320 x 50) at the very bottom**, with the existing buttons moved if needed. (Phones, tablets, a window narrower than 1200 or shorter than 600.)
- **No full-screen ads (interstitial or rewarded video), no sticky banner during play, no ads on the finish screen.**
- Money first, but a network is chosen later: see "What is not done".

## What was built

- `packages/web/src/ads.ts`: `adMode(enabled, onTitle, width, height)` decides `'off' | 'wide' | 'small'`; `AdFrame` writes it on `<html>` as `data-ads` and follows window resizes; `ADS_ENABLED` is the master switch (**false**). A unit test (`test/ads.test.ts`) pins the thresholds and checks that the switch is off.
- `packages/web/index.html`: the room the game gives up (`--ad-side` 176 px each side and `--ad-bottom` 110 px for wide, 80 px for small; all 0 without the attribute, so the page is the page of before), the sound and cabinet buttons moved right of the left ad (`html[data-ads] #mute, #cabbtn`), and three empty slots (`#ads .ad-left / .ad-right / .ad-bottom`). The game keeps its 16:9 shape and gets a smaller part of the window while the title screen is up (it eases back over 0.2 s when PLAY is pressed).
- `packages/web/src/site.css`: where the slots sit, and the preview boxes.
- `packages/web/src/game.ts`: one line in `update()` tells `AdFrame` whether the title screen is up with nothing on top (`phase === 'title'`, PLAY not pressed, cabinet closed). `main.ts` creates the `AdFrame` only if `ADS_ENABLED` or `?adpreview=1`.
- `tools/browser-test/ads.cjs`: opens the title screen at ten sizes, checks the layout numerically (three ads or one, inside the window, clear of the game and of the buttons, 16:9 kept, a click on an ad does not start the game, the ads go on PLAY and while the cabinet is open and come back, the page without `?adpreview` is unchanged) and saves pictures to `tools/browser-test/out/ads-*.png`.

**To look at it:** `npm run dev`, then open `http://localhost:5173/?adpreview=1` (dashed boxes with their size). Resize the window or use the phone view of the browser's developer tools. Without `?adpreview=1` nobody sees anything. (`?adpreview=1` also works on the live site once this code is deployed; it only shows empty dashed boxes.)

## What it costs the game

On the title screen the game gets smaller to make room: on a 1440 x 800 window from 1422 px wide to 1088 (23% less), on a 1920 x 1080 window about the same share, in the smallest wide window (1200 x 600) 848 x 477, on a phone on its side 693 to 551 px, on an upright phone and a tablet no change (the game is width-limited there already). The picture itself is not touched: it is the same 1280 x 720 canvas drawn smaller.

## What is NOT done (all of this before `ADS_ENABLED` can become true)

1. **An ad network must approve the site.** Candidates, in the order I would try them for banner-only: Journey by Mediavine (reported entry bar about 1,000 "premium" sessions a month; check what "premium" means for visitors outside the US, UK and so on, and whether it needs Google Analytics), Google AdSense (no official traffic bar, wants real content around the game, the account holder must be 18 or over), Raptive (25,000 pageviews a month). Traffic was about 0 to 3 Daily runs a day on 16 Nov 2026, so nothing earns yet.
2. **The ad code itself** goes into the three slots (160 x 600, 728 x 90, 320 x 50), from the network. None is in the game.
3. **The privacy page** (it already carries the visit-count row; ads are a bigger change) (`packages/web/privacy.html`) says no cookies, no analytics, no third-party scripts: it must be rewritten and re-dated in the same change (CLAUDE.md "Keep the privacy page true"). `private.test.ts` and `site.test.ts` guard parts of it.
4. **A consent banner** for visitors in the EEA, the UK and Switzerland (the networks require a certified one), shown before the title screen loads ads; and the child-related settings, because the audience is everyone.
5. **The security policy** (`packages/server/src/securityHeaders.ts`) allows only the site's own address; the network's hosts must be added on purpose, with `tools/browser-test/csp.cjs` passing (this weakens the policy built on 16 Nov).
6. **`ads.txt`** at the site root, if the network asks for it.
7. **Accidental clicks.** Google's guidance for games is to keep ad units about 150 px away from the game's controls. The layout leaves 12 to 24 px between the game's picture and an ad. On a laptop the title screen's buttons are well over 100 px from the bottom banner; on a phone on its side they are closer. Raise it with the network before applying (Mediavine's rules differ from AdSense's).
8. **Real phones.** Tested only in a headless desktop browser. Also test the page weight and the speed of the world pictures with the ad scripts loaded.

## Content around the game (built 17 Nov 2026)

AdSense wants real content around a game (the game itself is a picture). `/how-to-play` and `/about` exist now, linked from the title screen, listed in `sitemap.xml` (see `docs/SITE.md`). The owner plans to apply to Google AdSense early; applying also needs the ad code, the privacy page, a consent banner and the security policy (list above). Traffic is counted with `npm run cli -- traffic` (`docs/TRAFFIC.md`).

## Rules for whoever changes this

- Do not add ads to the run, the lobby, the report or the finish screen, or full-screen or floating formats, without asking the owner.
- Keep `ADS_ENABLED` false until the owner says go AND items 1 to 5 above are done.
- Any change to `index.html`'s `--ad-*` numbers must keep `ads.test.ts` (the smallest wide window leaves the game 848 wide) and `tools/browser-test/ads.cjs` passing.
