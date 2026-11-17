# How the browser game works

`packages/web/src` is a port of the Python design tool in `tools/art-source/engine-prototype`. The Python tool rendered the v5 walkthrough videos frame by frame; the browser version draws the same frames live. If you need to know why something is the way it is, the matching Python file is the first place to look.

## The one idea: a frame is a pure function of time

Nothing in the picture is simulated. `Game.render()` takes the clock `T` and the list of records so far and draws that instant from scratch: where the camera is, which effect is at which age, how far each text has faded in. That is why the same effect code can run in a video renderer and in a game, and why any moment can be inspected by setting the clock (see `docs/TESTING.md`).

### Records and the timeline (`timeline.ts`)

One `Rec` per question. In the video every record was known in advance. In the game a record is **created when its question appears** and its schedule is **filled in when the judge answers**:

```
start -> (typing) -> lock -> chk -> val -> roll -> rev -> chg -> fs -> fe -> card -> next
```

| Time | Meaning |
| --- | --- |
| `start` | the question appears |
| `lock` | Enter pressed (the answer was sent) |
| `chk`, `val` | "CHECKING", then "VALID" (`val` = max(`chk` + 0.65 s, the moment the server answered)) |
| `roll` .. `rev` | the rarity roll runs, then the tier is revealed (`rev`) |
| `chg` | the charge-up and the divide-by stamp |
| `fs` .. `fe` | the dive (`fe` is the landing) |
| `card` | the world title card (only when the picture changes) |
| `next` | the next question appears (or the report, after the 7th) |

Every time that is not known yet is `Infinity`, so each "has this happened yet?" test is simply false. `schedule()` fills the times in; `computeNext()` decides how long to hold after the landing (longer when a hint or post-finale line is shown); `skipCard()` shortens a title card when the player taps it; `makeMiss()` closes a question that timed out.

`Timeline.cam(t)` returns the camera (depth `u`, picture position `z`, zoom punch, speed) for any time by walking the records. The dive speed profile is `prof()`. The Planck Foam dive uses `finZ`/`finV`, a monotone cubic through `FIN_PTS` (the same curve scipy's PCHIP gave in Python); a dive of any length (`dz` worlds) is mapped onto it, so the finale works whether the player crosses the Planck Foam score (555 points) from world 5 or from Unexplored.

### Depth, size and pictures (`packages/core`)

`u` = depth in powers of ten. `u = p / 20` up to 400 points, then `20 + (p - 400) * 15 / 155` up to 555 (`PLANCK_POINTS`; it was 440 and `/ 40` until 16 Nov 2026), then 35. Size = 1.7 m / 10^u. The picture slot is `floor(u)`: 36 slots (0-19 are worlds 1-20, 20-34 are variants of the Unexplored void, 35 is Planck Foam). Everything about this is in `scoring.ts` and covered by `test/scoring.test.ts`.

## Painting a frame (`game.ts`, `render()`)

The order is the order of `render()` in the Python `minui21.py` and it matters (later things draw over earlier ones):

1. **World** - WebGL2 (`gl.ts`). 73 layers in one texture array: 36 world pictures, 36 "inner" versions with the next world already in the middle, and one layer for the LIVING picture of the world the camera is in (see "The living worlds" below). The outer picture is zoomed by 10^f, the inner window by 10^(f-1), cross-faded and feathered at its edge; a second pass adds zoom blur, chromatic aberration (both scale with speed) and the darkening reflection in the bottom 60 rows. The picture is 320 x 180 shown at 4x with a "sharp bilinear" filter so it stays crisp at any zoom.
2. Finale dimming, then the **tier backgrounds** (`bgReveal`, `bgCharge`) and the finale bloom.
3. **Explorer** sprite (native pixels at 4x, squashed and stretched with feet fixed).
4. **Additive layer** (`fx.ts` `AddLayer`): all light and particle effects are drawn on a black canvas that is added on top with `lighter` plus a blurred copy for glow.
5. Vignette, then the dark top and bottom gradients that replace panels.
6. **Front elements**: reveal gem and title, divide-by stamp, world gates, world title cards, finale card, hint and post-finale lines.
7. **Interface** (`ui.ts`): top bar, depth rail, scale bar, then the one bottom block that is on screen (question / rarity roll / result / time up), or the title button, or the report. Each piece is drawn through `Groups`, which fades a whole group by one alpha.
8. To the screen: **shake** (integer shift with edge repeat), **flash**, fade-in (`impact.ts`).

Text is drawn one character at a time (`draw.ts`). The fonts have ligature and kerning tables the Python never used; per-character drawing reproduces the Python layout exactly.

## The game around it (`game.ts`)

`Game` owns the state machine (`title` -> `run` -> `report`), the hidden `<input>` the player types into, the API calls and the clock. The loop is in `main.ts`: `T += min(dt, 0.1)`, `update()`, `render()`.

- The timer starts 0.55 s after a question appears and **pauses while an answer is being checked**.
- A rejected or unresolved answer shakes the field, shows the server's message and lets the player edit and resend, with the time they had left.
- Time running out sends `miss` to the server and closes the question (grey dot, "TIME UP", 0 points).
- Tapping or pressing Enter/Space on a world title card shortens it.
- `SoundHook` (in `game.ts`) is everything the game tells the sound engine; `audio.ts` implements it.

## File map

| Browser (TypeScript) | Python original |
| --- | --- |
| `timeline.ts` | `tl3.py` |
| `gl.ts`, `game.ts` (`render`) | `mini.py`, `mini3.py`, `minui21.py` |
| `celebrate.ts` | `tfx3.py` (rarity effects, cards, gates, intro) |
| `finale.ts` | `fin21.py` |
| `fx.ts`, `draw.ts` | `fx3.py` |
| `ui.ts` | `minui21.py` (interface) |
| `impact.ts` | `mini3.py` (`shake_amp`, `flash_at`, `vignette_at`) |
| `audio.ts` | `audio21.py` |

## Changing the look

- Colours, sizes and every timing constant are in `config.ts` (with the Python name beside most of them).
- A rarity celebration lives in `celebrate.ts` as three small functions per kind: background, additive effects, front text. Add or change one without touching the timeline.
- Pictures are PNGs in `packages/web/public/assets/world` (`s*` = at rest, `i*` = with the next world inside). If you redraw a world, redraw both, or the zoom into the next world will show the old picture. A redrawn world also needs its movement looked at again (`src/life/designs.ts` finds things by their colours and places), and new fingerprints for the test (see below).

## The gem (tier 6) reveal

A frame is still a pure function of the clock and the records. A gem adds one phase between the roll and the reveal: `rev = roll + ROLL_DUR[6] + GEM_PULL`. `timeline.pullStart(r)` = `rev - GEM_PULL`.

1. **The roll** stops on the Mythic icon (17 steps, not 18: the gem is never in the roll).
2. **The pull** (`GEM_PULL` 1.4 s, `celebrate.ts`: `inPull`, `pullQ`, `bgPull`, `addPull`, `frontPull`, `pose`): the world is tinted dark, particles and rings are drawn inward, the explorer shrinks and is lifted into a black disc that grows (`PULL_C`), the question block fades, the vignette goes dark.
3. **The vacuum** (the last `GEM_VACUUM` 0.14 s): everything stays dark and the sound mix is ducked.
4. **The birth** at `rev`: white flash (`impact.ts`), shake, the explorer pops back, rainbow rays (`bgReveal`), seven coloured rings, rainbow bursts and confetti (`addReveal`), the rainbow title (`bigTitle(..., { rainbow: true })`), "SINGULARITY +120" with the answer and its line, "NEW GEM · CATEGORY · CABINET n / 200" (`ui.result`).
5. **The flight**: at `chg` the gem flies up to `GEM_COUNTER` in the top bar (the others drop into the explorer) and the counter ticks up once it has landed; then the usual stamp and dive.

`Rec.gem` (`GemInfo`) carries what the reveal says; `Game.recordGem` fills it and adds the gem to the cabinet. Pictures: `tools/browser-test/gem.cjs`.

## The living worlds (`src/life`, since 16 November 2026)

Every world picture moves a little (stars twinkle, dust and bubbles drift, tails wave, the DNA helices turn, the gamma waves roll, the ripples grow, Planck Foam bubbles). The owner reviewed the designs in `drafts/draft-world-motion/` and chose one of three for worlds 7 to 20 and Planck Foam; that folder keeps every design that was offered and its review page (`index.html`).

- **A frame is still a pure function of time.** `LifeCore.render(slot, t, k)` draws the picture of a slot at `t` seconds with the amount of life `k`: `k = 0` gives the original picture pixel for pixel, `k = 1` is what was reviewed. Everything is done at the picture's own 320 x 180 pixels with whole-pixel moves, so it stays crisp pixel art and zooms like the still picture.
- **Only the world the camera is in is alive.** `WorldLife.frame(z, T)` (called from `render()`) keeps a clock that starts when the camera arrives in a slot, lets `k` grow from 0 to 1 over `RAMP` (1.5 s) so nothing jumps at a landing, and hands the pixels to `WorldGL.setLive()`. Pass A of `gl.ts` reads that layer in place of the slot's still picture (`uOuter`). The next world, seen through the zoom window during a dive, is the still picture.
- **Preparation.** Each picture is cut up once (`setup`: 3 to 80 ms). `WorldLife` does that one picture at a time while the browser is idle, starting when the game has loaded; a world that is not ready yet is simply still until it is.
- **Slow devices.** The time a frame takes is averaged: above 3 ms the living picture is redrawn 30 times a second, above 10 ms 15 times (the rest of the frame is not affected).
- **No motion on request.** With the device's "reduce motion" setting on, or `?still=1` in the address, the pictures are still (`WorldLife.enabled`). Nothing is stored for this.
- **Files.** `life/engine.ts` (the toolkit: cut an object out and draw it elsewhere, bend, brighten, glow), `life/designs.ts` (what moves in each world), `life/artsource.ts` (a port of the Python that painted the pictures, `tools/art-source/art`: with it the DNA helices are drawn at any turning angle and the spheres of world 9 are whole where the bead chain hides them), `life/light.ts` (lines, dots, stars), `life/index.ts` (`LifeCore`, `WorldLife`). The first four are the reviewed JavaScript carried over as it was (`// @ts-nocheck`); the test below is what guards them.
- **Rules that came out of the review** (keep them when a world is changed): do not rotate or stretch a fine pixel pattern (dither and thin rings crawl, and it hurt the owner's eyes); an object moves as ONE whole piece (a ball whose highlight stays behind shows black spots); things that hang together move together; light changes are smooth and slow. Where the picture was made by code, port that code instead of cutting the picture up.
- **Changing a world's movement.** Change it in `drafts/draft-world-motion/src` first (the review page shows it), carry it over to `life/designs.ts`, then run `node drafts/draft-world-motion/tools/golden.cjs` to take new fingerprints and `npm test`.
