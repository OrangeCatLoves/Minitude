# More worlds, 21 to 30 (draft, 18 Nov 2026) — SET ASIDE

> **Set aside by the owner on 18 Nov 2026.** He chose instead to stretch the current 20 worlds over 0 to 600 points (30 points a world, Common raised from 10 to 20), so no new worlds are needed. This folder is kept for reference only.

The owner wants to stretch the score so the worlds run to 600 points, the Unexplored stretch covers 600 to 700, and Planck Foam starts at 700. This folder holds **20 candidate worlds** (two for each new world, for the owner to criticise and pick from). **Nothing here is in the game.** No file outside this folder was touched.

## Look at it

- Double-click `index.html` (Chrome or Edge). Everything it needs is inside the file (the font comes from Google Fonts when online, with a fallback).
- Or open the private published copy of the same page (the link was given in the chat).
- Click a picture for the big view and the facts ("What is real"). **KEEP** marks a design; the list can be copied and pasted into the chat. The motion can be paused.

## The arithmetic (the owner asked to be corrected if wrong)

- World 20 (Collision Hall) covers **380 to 400 points**, not 440. 440 was the old Planck Foam threshold; it became **555** on 16 Nov 2026 (`PLANCK_POINTS`).
- Every world is 20 points (one factor of ten). From 400, reaching 600 needs **10 new worlds** (400 + 10 × 20), not 8. (8 worlds would reach 560; the Unexplored stretch would then start there.)
- With the game's own formula, size = 1.7 m ÷ 10^(points ÷ 20), **700 points = 1.7 × 10⁻³⁵ m, the Planck length** (the exact crossing is 700.4). So "Planck Foam at 700, with a straight 20 points per power of ten all the way" is physically honest, and it makes the maths simpler than today's compressed Unexplored stretch (155 points for 15 powers of ten).
- The picture slots do not grow: slots 0 to 29 become worlds 1 to 30, slots 30 to 34 are five dark Unexplored pictures (today there are fifteen, 20 to 34), slot 35 stays Planck Foam. The texture array in `gl.ts` (72 layers) is unchanged.

## What "real" means for a world this small

No collider has looked below about 10⁻²⁰ m, so no human has seen anything in worlds 21 to 30 as a place. The rule used for every design: **each world is anchored to something that genuinely exists in physics at that energy**, and its tag says which kind (the game's existing honesty labels, plus `PLAN`):

- `MEASURED`: a particle of this energy was seen (cosmic rays, neutrinos, photons), with the paper named.
- `LIMIT`: experiments looked and found nothing, which rules things out (SN 1987A, ADMX).
- `THEORY`: a published idea that no experiment has tested (the seesaw, cosmic strings, the Higgs potential, a back-of-the-envelope collider).
- `PLAN`: a machine that is proposed and not built (the FCC).

Energy and length are linked by length ≈ 2 × 10⁻¹⁶ GeV·m ÷ energy. For single particles this is the particle's wavelength (the game already does this in world 13, "Gamma Sea"); for collisions it is the collision energy (the game does this in world 20). Each design says which. Nothing is invented: no creatures, no fictional places. The only exaggeration is the glow of the Auger dipole in 26B, and the page says so.

## The twenty designs

| World | Points | Design | Name | Tag | Energy | Wavelength |
|---|---|---|---|---|---|---|
| 21 | 400–420 | 21A | THE NEXT RING | PLAN · FCC · 85–100 TEV · NOT BUILT | 85–100 TeV | ≈ 2 × 10⁻²¹ m |
| 21 | 400–420 | 21B | NATURE’S COLLIDER | MEASURED · PIERRE AUGER · 57 TEV | 57 TeV | ≈ 3.5 × 10⁻²¹ m |
| 22 | 420–440 | 22A | THE RECORD HIT | MEASURED · FLY’S EYE · 1991 | ≈ 770 TeV (collision) | ≈ 2.6 × 10⁻²² m |
| 22 | 420–440 | 22B | THE WIMP LIMIT | THEORY · UNITARITY BOUND · 340 TEV | 340 TeV | ≈ 6 × 10⁻²² m |
| 23 | 440–460 | 23A | GLASHOW’S FLASH | MEASURED · ICECUBE · 2021 · 6.3 PEV | 6.3 PeV | ≈ 3 × 10⁻²³ m |
| 23 | 440–460 | 23B | PEVATRON SKY | MEASURED · LHAASO · 2021 · 1.4 PEV | 1.4 PeV | ≈ 1.4 × 10⁻²² m |
| 24 | 460–480 | 24A | THE IRON KNEE | MEASURED · KASCADE-GRANDE · 80 PEV | ≈ 80 PeV | ≈ 2.5 × 10⁻²⁴ m |
| 24 | 460–480 | 24B | THE MEADOW ARRAY | MEASURED · KASCADE-GRANDE · KARLSRUHE | ≈ 80 PeV | ≈ 2.5 × 10⁻²⁴ m |
| 25 | 480–500 | 25A | THE DEEP-SEA FLASH | MEASURED · KM3NET · 2023 · 220 PEV | ≈ 220 PeV | ≈ 9 × 10⁻²⁵ m |
| 25 | 480–500 | 25B | THE QUIET STAR | LIMIT · SN 1987A · AXION LIMIT | > 4 × 10⁸ GeV | < 5 × 10⁻²⁵ m |
| 26 | 500–520 | 26A | THE ANKLE | MEASURED · PIERRE AUGER · 5 EEV | ≈ 5 EeV | ≈ 4 × 10⁻²⁶ m |
| 26 | 500–520 | 26B | THE LOPSIDED SKY | MEASURED · AUGER · 2017 · >8 EEV | > 8 EeV | ≈ 2.5 × 10⁻²⁶ m |
| 27 | 520–540 | 27A | THE GZK WALL | MEASURED · HIRES · AUGER 2008 · 50 EEV | ≈ 50 EeV | ≈ 4 × 10⁻²⁷ m |
| 27 | 520–540 | 27B | THE SECOND VALLEY | THEORY · HIGGS POTENTIAL · ~10¹¹ GEV | ≈ 10¹⁰–10¹¹ GeV | ≈ 2 × 10⁻²⁷ m |
| 28 | 540–560 | 28A | FROM THE VOID | MEASURED · TELESCOPE ARRAY · 2021 · 244 EEV | ≈ 244 EeV | ≈ 8 × 10⁻²⁸ m |
| 28 | 540–560 | 28B | A RING AS WIDE AS EARTH’S ORBIT | THEORY · LHC MAGNETS · RING ≈ 1 AU | ≈ 3 × 10¹¹ GeV | ≈ 7 × 10⁻²⁸ m |
| 29 | 560–580 | 29A | THE AXION LISTENERS | LIMIT · ADMX · NO SIGNAL YET | ≈ 10¹² GeV | ≈ 10⁻²⁸ m |
| 29 | 560–580 | 29B | THE EMPTY BAND | LIMIT · ADMX 2018–2021 · 2.7–4.2 µEV | ≈ 10¹² GeV | ≈ 10⁻²⁸ m |
| 30 | 580–600 | 30A | THE SEESAW | THEORY · SEESAW MECHANISM · ~10¹⁴ GEV | ≈ 10¹⁴ GeV | ≈ 2 × 10⁻³⁰ m |
| 30 | 580–600 | 30B | COSMIC STRINGS | THEORY · COSMIC STRINGS · ~10¹⁴ GEV | ≈ 4 × 10¹³ GeV | ≈ 5 × 10⁻³⁰ m |

The "real" notes and papers for each are in `src/scenes_*.js` (the `real` and `source` fields) and in the big view. Where a world has two designs, they are either two different real things at the same scale (21, 22, 23, 25, 26, 27, 28) or two treatments of the same real thing (24: the particles in the Galaxy or the detectors on the ground; 29: the experiment or its chart).

## Motion

Every picture moves a little, as the living worlds do, and nothing flickers hard: twinkling stars and aurora, light pulses running round rings, cosmic-ray tracks and showers that play every 7 to 9 seconds, detectors that light up in the order the shower reaches them, marine snow, mist, beams circling. Light turns slowly; there is no turning or stretching of fine pixel patterns. All of it is a pure function of time (`draw(g, t)`), like the rest of the engine, so it can be tested with a fake clock.

## How it is made

- `src/gfx.js`: the pixel toolkit (320 × 180 float buffer, glows, spheres, lines, polygons, noise; a final ordered 4 × 4 dither into 13 levels per channel, fixed to the pixel grid, so gradients band the way the game's pictures do and never shimmer).
- `src/scenelib.js`: shared pieces (ground, mountains, tank arrays, aurora, Milky Way).
- `src/scenes_a.js` to `scenes_d.js`: one `def({...})` per world: name, description, tag, scale, "what is real", source, and the drawing code.
- `src/viewer.js`, `src/index.template.html`, `tools/bundle.cjs`: the review page and the one-file build (`node tools/bundle.cjs` writes `index.html`).
- `tools/shots.cjs` (contact sheets), `tools/page.cjs` (opens the page, checks for errors, takes pictures); `sheets/` holds the outputs.
- Unlike the existing worlds, these are drawn by code each frame and are not ported from the Python art source. A draw takes 2 to 40 ms on a desktop (most under 15 ms).

## If worlds 21 to 30 go into the game (the plan, not done)

1. **Scoring** (`packages/core/src/scoring.ts`, with tests first): `VOID_START_POINTS` 400 → 600, `PLANCK_POINTS` 555 → 700, `VOID_FIRST_SLOT` 20 → 30, `N_WORLDS` 21 → 31, `pointsToU` becomes simply points ÷ 20 up to 700, `VOID_DECADES_PER_POINT` goes. Then `displaySlot`, `worldNoOfSlot` and the timeline tests.
2. **Worlds** (`worlds.ts`): ten new entries with the names, descriptions, kinds and labels chosen here (add `PLAN` to `WorldKind`, or reuse `THEORY`). Accent colours per slot are measured from the pictures into `manifest.json`.
3. **Pictures:** each chosen design must become a picture for its slot and an inner picture for the dive (36 + 36 layers stay). Either bake a still and give it motion with the living-worlds engine, or draw the procedural scene into its layer each frame (2 to 40 ms; the phones have never been measured). The fifteen dark Unexplored pictures shrink to five: the owner picks which.
4. **Texts:** the edging hints ("Something is getting closer"), "N points away" lines, the report and the finale all use the old thresholds; every number in `CLAUDE.md` ("Rules that are decided"), `docs/ENGINE.md` and `docs/DECISIONS.md` changes with it.
5. **Tests and a browser run:** `scoring`, `timeline`, `life` golden files and `tools/browser-test`.

## Things the owner should decide (asked in the chat, not decided here)

- **How hard the finale becomes.** At 700, the only way to reach Planck Foam is seven Mythic answers (7 × 100) or a run with gems (120 each): six Mythic and one Legendary is 680, short of it. Today seven Legendary answers (560) are enough. Is that wanted? Worlds 21 to 30 themselves need 400 to 600 points: an average of 57 to 86 per answer.
- **10 worlds or 8.** 10 reaches 600 as asked; 8 would reach 560 and leave a wider Unexplored band (140 points).
- **Which 5 dark pictures stay** in the Unexplored stretch (of the 15 the owner has seen).
- **Wording of the Unexplored card.** It says "No experiment has looked this small. Nothing is known to exist here." Worlds 21 to 28 show cosmic-ray energies that were measured, which sit above that sentence's claim. A softer wording is probably needed.
