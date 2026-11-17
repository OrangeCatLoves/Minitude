# Draft: SINGULARITY gems (the Crescent was chosen on 14 Nov 2026)

A design draft for a seventh rarity above Mythic. **Nothing here is in the game, nothing is committed, pushed or deployed**, and no file outside this folder was changed.
Delete the folder and the game is exactly as it was.

## The gem is chosen: Crescent, Twilight tone

On 14 Nov 2026 you picked design 23, the **Crescent**, in the rightmost tone (**Twilight**), as the one gem for **all 200 questions**. It is now the default everywhere: the ladder, the chain, the reveal, the cabinet, the top bar, the report and the video. The sprite is `gem-sprites/CHOSEN-gem6-singularity-crescent.png` (32 x 32, ready to become the game's `gem6.png`; `x8/` has an 8 times bigger copy). The other 61 designs are still in the files and can be tried with CHOOSE GEM; the tour and the video no longer show them.

## What changed in round 5 (before the choice)

You asked for **50 more designs and to keep the current ones**. The earlier set had **12** designs (you said 10), so I kept all 12 and added **50 new ones: 62 designs in total, each in 3 rainbow tones = 186 sprites.** The new 50 are numbers 13 to 62 and none repeats a shape from the earlier rounds.

The rules are the same as before: **32 x 32 pixels, one shared near-black outline, flat blocks with hard edges, light from the top left, no gloss, no gradient, no glow.** A rainbow needs several hues, so a sprite uses between 5 and 30 flat colours (the agreed icons use 5 or 6).

## The 62 designs

| # | Designs |
|---|---|
| 1 to 12 (kept) | Prism, Opal, Spectrum Wheel, Banded Kite, Fan, Bubble, Cube, Arch, Kaleidoscope, Marquise, Halo, Hexagon |
| 13 to 22 (cut gems) | Octagon Rings, Pentagon, Heptagon, Cushion Quad, Oval Rings, Emerald Bands, Lozenge, Cut Diamond, Octahedron, Pyramid |
| 23 to 32 (sky and nature) | Crescent, Sun, Blossom, Clover, Butterfly, Leaf, Cloud, Comet, Peaks, Ribbon Wave |
| 33 to 48 (symbols) | Bolt, Chevrons, Infinity, Atom, Honeycomb, Crown, Cross, Hourglass, Snowflake, Pinwheel, Cog, Pentastar, Steps, Mosaic, Seven Pearls, Trio |
| 49 to 62 (crystals and objects) | Crystal Cluster, Blade, Crystal Ball, Spires, Medal, Potion, Egg, Kite Flyer, Umbrella, Bow Tie, Fish, Candy, Popsicle, Twins |

Three rainbow tones for every design: **Spectrum** (vivid), **Opal** (soft pastel) and **Twilight** (deeper jewel tones).

## Open these, in this order

| What | File | How |
|---|---|---|
| 1. The chosen gem next to the six agreed icons | `index.html` > **THE CHAIN**, `gem-art/screens-overview.png` | |
| 1b. All 62 designs, for the record | `gem-art/designs-01-24.png`, `designs-25-48.png`, `designs-49-62.png` | look |
| 2. The clickable prototype | `index.html` | double-click (Chrome or Edge). **CHOOSE GEM** opens a grid of all 62 with a tone switch; pick, then **PLAY WITH THIS GEM**. Click once on the page so the sound can start. |
| 3. The walkthrough video (about 1 minute, with the sound) | `video/singularity-walkthrough.mp4` | double-click |
| 4. The sprite files | `gem-sprites/` (and `x8/`) | 186 PNG files, 32 x 32, like the game's `gem0.png`..`gem5.png`; named `d33-bolt-spectrum.png` etc. |
| 5. The 200 picks, with source links | `gem-review.html` (also `gems/gem-picks.md`) | tick "swap", press "Copy my swap list", paste it to me |
| 6. The sounds | `sound/*.wav` | `singularity-reveal.wav` is the main one |
| 7. Rules, look, wording / build plan / list findings | `docs/DESIGN.md`, `docs/IMPLEMENTATION-PLAN.md`, `docs/FINDINGS.md` | |

## Playing with your gem

1. **CHOOSE GEM**: click a tone (Spectrum, Opal, Twilight), then any tile; the big preview updates. The grid opens on your current choice.
2. **PLAY WITH THIS GEM** goes to the PLAYTEST: seven real questions from 15 sample lists. **PEEK** shows the gem answer so you can find it; type it to see the full reveal with your gem. **WATCH THE REVEAL** replays it without playing.
3. The Crescent is used in the reveal, the cabinet, the top bar and the report. If you try another design with CHOOSE GEM it is remembered in your browser; delete this browser's site data (or open the page in a private window) to get the Crescent back.
4. It is the same gem for all 200 answers (like the six tier icons, one icon per tier).

## What the prototype is, and is not

- **Is:** the real design of the SINGULARITY moment, the gem sprites, the sound, the cabinet, the report line and the 200 picks. The reveal and the report are unchanged since you approved them.
- **Is not:** the real engine. The playtest uses a simplified answer matcher, the six old rarities get a simplified reveal, no 30-second clock, no world zoom, no server. The cabinet is saved only in your browser.
- **The sound was designed and measured, but not heard by me.**
- **The walkthrough video** (`video/singularity-walkthrough.mp4`, 59 s, 1280 x 780, picture and the synthesised sound) was recorded on 14 Nov 2026 with the Crescent. Its audio levels were checked (the reveal peaks near -2 dBFS, no clipping) but I have not heard it.

## Folder map

```
index.html            the prototype            gem-review.html   the 200 picks
src/gem.js            designs 1-12, the engine src/designs2.js   designs 13-62
src/scenes.js         every screen             src/app.js        tour, playtest, cabinet, picker
src/sound.js          the sounds (code)        gem-sprites/      the 186 PNG sprites
gem-art/              preview images           data/ gems/ sound/ docs/ tools/
```

Folder `video/` holds the walkthrough. To export the sprites again: `node tools/export-sprites.cjs`. To look at any range: `gem-sheet.html?from=13&to=24&s=3&cols=4`.

## Things to know before you commit anything

- The scripts in `tools/` read `list-build/*/bank.json` (the folder next to the repo, outside it). The lookup scripts talk to Wikipedia and Wikidata only, with a generic client name.
- When a gem is chosen for real, only that design's sprite is needed (one PNG like `gem6.png`).
