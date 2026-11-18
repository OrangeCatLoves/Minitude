# Draft: achievements (18 Nov 2026)

**Status: a draft for the owner to review. Nothing here is in the game.** The owner asked (18 Nov 2026) for achievements: one for the first answer of each rarity (Common, Uncommon, Rare, Exotic, Legendary, Mythic, Singularity), then a ladder of how many different Singularity gems are found, a banner that drops in from the top when one is earned, and several designs for it.

## Look at it

- **`index.html`** (open it from the folder, no server needed): six banner designs that really animate (slide in from the top, a glow pulse, stay about 3.5 s, slide out), shown over real frames of the game. At the top: choose the achievement, the frame (the answer card, a question, the title), the icon style (the game's own tier gems, or a medal around the gem) and whether the banner sits just below the seven progress squares or covers them. "Play all six" runs them one after another. The lower half shows the whole list of 15 in any one design.
- **`designs/`**: pictures of the same. `overview.png` is the page. `zoom-<design>--<achievement>.png` are 1:1 crops of the top of the game (one game pixel = one picture pixel), the best way to judge size and legibility. `<design>--<achievement>.png` are the scaled previews, `shelf-<design>.png` the whole list in each design.
- `catalogue.json`: the 15 achievements (id, rarity, name, text, goal). The numbers are the suggestions below; change them there, run `node build.cjs`, and the page follows. `tools/shots.cjs` takes the pictures again, `tools/context-shots.cjs` takes new game frames (needs the game running on a throw-away copy of the database; see its header).

## Second round (18 Nov 2026): the owner's answers, the icons and the cabinet tab

The owner's decisions on the first round: **the slim bar** for the banner; achievements count in **solo, the Daily and multiplayer**; kept **only in the browser** (accepted); the gem cabinet gets **another tab for the achievements**, and **every achievement needs its own icon**.

- **`icons.html`** (open it from the folder): (1) the 15 pictograms, one drawing each (24 x 24 pixels): a pebble, a signpost, a cut gem, a flower, a crown, a lone figure under a star and the rainbow Crescent for the seven rarity firsts; a pouch, a jar, a magnifier, a shield, a pile of gems, a vault door, a half-lit cabinet and a golden full cabinet for the eight gem steps; (2) four frames for them (tile, badge, medal, plain), earned and not earned; (3) the cabinet with a **GEMS | ACHIEVEMENTS** tab bar, the achievements in two groups (firsts, gem steps) with the day each was earned and a progress bar on the gem steps that are not reached yet; (4) the slim bar with the framed icon. Two menus at the top choose the frame and how many are earned.
- `designs/icons-pictograms.png`, `icons-frames.png`, `cabinet-tab-<frame>.png`, `slim-bar-icon-<frame>.png` are pictures of the same (`tools/icon-shots.cjs` takes them again; `node build.cjs` builds both pages from `src/*.template.html` and `catalogue.json`).
- **My suggestion:** the **tile** frame in the cabinet (it matches the gem slots) and the **plain pictogram with the tier colour edge** on the slim bar, or the tile there too. The medal is the most "award" but the biggest and the busiest.
- Not decided: the tab's exact look in the real game (it would be HTML over the game like the cabinet, so the icons would be drawn onto small canvases by the same code the page uses), and whether achievements that are not earned should show their text (the draft shows it: they are not secret).

## The six designs

| # | Name | Idea | Cost |
| --- | --- | --- | --- |
| 1 | Slim bar | 440 x 58 px, one line of text, one glow pulse, the tier gem on the left, a small count chip. The closest to how the game already speaks (a hint is one line, one pulse, one sound). | smallest, least in the way |
| 2 | Top strip | Full width, 46 px, tier-coloured, like a news ticker. Reads from far away. | covers the whole top edge while it shows |
| 3 | Medal plate | 500 x 88 px with a stepped pixel border, a medal badge, a light sheen, and "Next: ..." underneath. | the largest; touches the top of the "RARE!" letters unless it waits for them to fade |
| 4 | Terminal | A console read-out in the pixel font with the text typing in. | looks like a system message, a different voice from the game |
| 5 | Prism | A dark plate in a moving border: the tier colour for rarities, the full rainbow for gems (the Crescent's colours). | the best tie to the gems |
| 6 | Ticket stub | A stub with a stamp tab (the "÷ 100" stamp of the answer card) and a perforated edge. | busiest |

**My suggestion:** design 1 for everything, with design 5's rainbow border for the gem achievements (the first gem and the whole ladder). That keeps the common case quiet and makes a gem feel like an event. Icons: the game's own tier gems (they are already the art for each rarity, so a "first Rare" achievement shows the Rare gem the player just saw); the medal style is there to compare.

## The achievements and the numbers

Seven "firsts" and eight steps of the gem ladder (15 in all).

| Group | Achievement | Rule |
| --- | --- | --- |
| Rarity firsts | Down to Earth, Off the Beaten Path, Rare Find, Exotic Taste, Legend Has It, Almost Nobody | the first answer scored at Common, Uncommon, Rare, Exotic, Legendary, Mythic |
| | Singularity | the first hidden gem |
| Gem ladder | Pocketful 5, Collector 10, Curator 25, Gem Warden 50, A Hundred Gems 100, The Vault 250, Half the Cabinet 500, Complete Cabinet (all) | how many DIFFERENT gems the cabinet holds (a gem found again does not count twice) |

Why these numbers: the owner suggested 1, 10 and 50. Each step is about 2 to 2.5 times the work of the one before, so the early ones come quickly (1, 5, 10 reward a new player within a few sessions) and the later ones are a long goal. 250 and 500 are half of today's bank and half of the 1,000 questions planned; the last step is "every gem there is", so it grows with the bank (it is earned when the cabinet is complete at that moment, and an achievement is never taken back). We have **no data yet on how often a player finds a gem** (gems are kept only in the player's browser), so the top steps may take a long time; they can be trimmed to 1, 5, 10, 25, 50, 100 and "all" without any change to the design.

Also worth considering, not drawn here: a gem in every category (11 today), a whole category of gems completed (11 of these), ten and a hundred Mythic answers, a perfect run (700 points or more), reaching Planck Foam, the first Daily and 7 and 30 day Daily streaks, 10, 50 and 100 runs played.

## How it would work (if built)

- **Where it is kept:** only in the player's browser, like the gem cabinet and the logbook (there are no accounts): a key `minitude.achievements` holding which rarities have scored and the day each achievement was earned. Clearing the browser's data loses it. **The privacy page must get one sentence saying so** (the same page that already says the gems are kept only on the device).
- **Counting rule:** answers in a solo run or the Daily (the same place a gem is recorded today, `game.ts`). Multiplayer is not counted unless the owner says so.
- **The gem ladder is backfilled** from the cabinet the first time the new code runs (a player with 12 gems gets Pocketful and Collector at once, quietly); the rarity firsts cannot be (the browser never stored them), so they are earned going forward.
- **When it shows:** after the answer card has finished (for a gem, after the flight into the counter, so it never fights the white flash), never over the answer box or the timer. It sits just below the seven progress squares (design 1 and 5 fit there; design 3 needs the card to fade first). Two or more at once wait in a queue, one after another; more than three are folded into "+2 more".
- **Sound and motion:** one short sound from the existing audio engine (nothing new to download), only if sound is on; with "reduce motion" on the device the banner fades in place instead of sliding.
- **A list:** an "Achievements 7 / 15" line in the gem cabinet screen, with locked ones greyed and their text visible (they are not secret).
- **Code:** a pure `packages/core/src/achievements.ts` (catalogue, the rules, parsing a stored value that may be damaged, like `gems.ts`), a small `packages/web/src/achievements.ts` (storage, the banner, the queue), tests for both, and a browser test that takes pictures like `gem.cjs` does. No server change, no new request, so the security policy and the privacy page's "no third-party scripts" stay true.

## Open questions for the owner

1. Which design (or mix)? 2. Solo and Daily only, or multiplayer too? 3. Is "kept only in this browser" fine (nothing follows the player to another device)? 4. Should the cabinet screen get the list, or should the banner be all there is? 5. Keep all eight gem steps, or trim the top ones?
