# Living worlds (draft, 15 Nov 2026)

The review page of the living worlds: a little movement for every world, with all the designs the owner was offered. **The chosen designs are in the game since 16 Nov 2026** (`packages/web/src/life`, `docs/ENGINE.md` "The living worlds"); this folder is kept so that the owner can look at every design again. The page opens with the chosen design of each world (10B included).

## Look at it

- Double-click `index.html` (Chrome or Edge). Everything it needs is inside this folder.
- Or open the published copy of the same page (private link, given in the chat).
- Pick a world (1 to 20, UNEXPLORED, PLANCK FOAM). Drag the line: still on the left, alive on the right.
- LIFE turns the amount of movement up or down (1.0 is the draft, 0 is the original picture exactly, 2.0 is double).
- UNEXPLORED has a VARIANT slider (the 15 pictures from dark to the glowing horizon). One design drives all 15; the glow, the faint rings and the grid fade in with the variant, like the pictures do.

## What it does

- Every picture is still the same picture. All movement is drawn at the picture's own 320 x 180 size, in whole pixels, so it stays crisp pixel art.
- Between 0.1 % and 6 % of a picture changes in most worlds. The few bigger ones are on purpose: Gamma Sea (waves), Ripple Sea (a soft wave of light through the rings), Planck Foam (a slow wave of brightness).
- Kinds of movement: twinkling stars and glints, objects that drift or bob (dust, bubbles, quarks), tails and tendrils that wave, soft glows that breathe, light pulses that run along floors, soft waves of light that travel through rings, colour that flows along DNA rungs.
- Each frame is a pure function of time and the picture, like the rest of the engine (`docs/ENGINE.md`), so it can be tested with a fake clock. `tools/check.cjs` renders every world at several times and LIFE values and checks that LIFE 0 gives back the original picture pixel for pixel (it does, for all 36).

## Files

- `src/engine.js`: the motion toolkit (cut an object out and draw it elsewhere, bend a region, rotate rings, glows, particles).
- `src/worlds.js` to `worlds5.js`: what moves in each world (one `def(...)` per world).
- `src/viewer.js`, `index.html`: the viewer. `data/assets.js` holds the 36 pictures and the explorer (made by `tools/build-data.cjs`).
- `tools/`: `frames.cjs` (contact sheet of one world), `overview.cjs` (many worlds, still | alive | what changed), `check.cjs`, `bundle.cjs` (one-file page), and small probes for colours.
- `sheets/`: the pictures those tools made.

## Round 2 (15 Nov 2026, after the owner's feedback)

- Balls (worlds 9, 15, 16, and the beads, cells and loose particles in 6, 7, 15): they showed black spots because only part of each ball was moved (its highlight and dark shading stayed behind). Now each ball is lifted as one whole piece (`fill: true` in `lift`, or a disc), and the exposed background is filled by blending both sides.
- Eye comfort (worlds 8, 12, 19, 20): all four used turning or stretching of fine pixel patterns (`rotate`, `radialMap`, region warps), which makes dither and thin rings crawl. Those are gone from the whole draft. What replaces them is smooth brightness changes (a slow wave of light around the petals, through the ripples, around the detector rings) and rigid one-pixel drifts. World 19 is now only a soft wave travelling slowly outward through the ripples. Twinkles are softer and slower everywhere.
- `tools/flicker.cjs` measures how many pixels change from one frame to the next (calm is small); worlds 8, 12, 19, 20 are now at or near zero.
- Found and fixed along the way: the platform's bright edge was being picked up and moved with the small rings (world 18) and the loose particle (world 15).

## Round 3 (15 Nov 2026, second feedback)

The new definitions are in `src/worlds6.js` and replace the earlier ones of the same worlds (the registry keeps the last one); `src/fx.js` holds small light-drawing helpers.

- World 7 (Bacteria Garden): whips and beads were mixing up. The beads no longer move (a glint runs along them instead) and each whip is picked by hand-measured boxes.
- World 9 (Protein Factory): everything that belongs together moves together: the whole membrane (heads, tails, worm) rolls as one, each pair of spheres floats as one piece, the chain flows in a long wave.
- World 10 (DNA Forest): no colour changes; a band of light climbs the towers and lights the rungs and strands.
- World 12 (Electron Clouds): the wave of light was centred on the wrong point and nothing seemed to move. Now three electrons circle the nucleus with trails, a pulse travels around the six petals, and points of light appear and fade.
- World 13 (Gamma Sea): the rows used to be shifted sideways one by one, which made no sense. Now every wave really travels to the right. Each of the seven curves is a true sine (wavelengths 70, 61, 52, 43, 34, 25, 16 pixels, measured); the picture is scrolled by one wavelength so nothing tears.
- World 14 (The Great Empty): the lights circle the orange nucleus with trails, a sweep of light turns around it and lights the orbit marks.
- World 15 (Nucleus City): the cluster is lifted as one piece and shivers gently; glints flash on the particles one after another; the loose particles circle.
- World 19 (Ripple Sea): the rings themselves grow outward. Two layers cross-fade (one ring shifted by s, one by s minus a ring gap), so the cycle repeats with no pop, and new rings fade in just outside the first ring. Only the rings are moved; the background stays still.
- World 20 (Collision Hall): every seven seconds a collision flashes, the tracks shoot out, the detector rings light up as the front reaches them, then the tracks fade. Between events, light turns slowly around each ring.
- Planck Foam (the special one): bubbles drift and fade in turn, a wave of light leaves the heart every few seconds, soft rays turn around the heart, pairs of tiny particles pop into being and drift apart, new bubbles are born, grow and fade, and light runs along the grid.
- Engine: background that a lifted piece leaves behind is now filled by copying the dither from the same place in its 4-pixel pattern (it used to blur into smooth streaks), and several things can be lifted together (`liftGroups`) so the fill never copies from something that is also being lifted.

## Round 4 (16 Nov 2026): three designs per world

The owner asked for three different movement designs for every world from 7 on, to pick one each. Worlds 7 to 20 and Planck Foam now have designs A, B and C (the Unexplored stretch keeps its one design). `src/variants.js` is the registry (`Motion.variant(slot, 0|1|2, design)`), `src/v1.js` holds worlds 7 to 12 and `src/v2.js` worlds 13 to 20 and Planck Foam. Where a design A was not replaced, it is the earlier definition of that world. The viewer shows a DESIGN row with the three buttons, remembers the picks in the browser, and prints them as one line ("Your picks so far: 7A 8B ...") for the owner to send back. The three are meant to differ in kind: one where things change place, one that is only light, one that adds small things (bubbles, sparks, shooting stars). The tools take the design from the environment: `V=1 node tools/check.cjs` checks every design B.

Also fixed: world 8 fell apart because the virus spike tips were not lifted with it, and the phage legs and the wavy tail broke into fragments when bent. The virus is now one disc, the tail one line, and the legs are not bent any more.

## Round 5 (16 Nov 2026): the owner's picks, whole spheres, spiralling DNA

Picks: 7A, 8A, 9C, 11C, 12A, 13C, 14C, 15B, 16A, 17A, 18C, 19C, 20A, Planck Foam A (world 10: none of the first three; the owner wants the helices to look like they are spiralling). The picks are the designs shown first (`Motion.PICKS` in `src/v3.js`); the other designs are still there to compare.

- `src/dna.js` is a port of the drawing rules of the art source (`tools/art-source/art/art.py`: `vgrad`, `glow`, `sphere`, `haze`, Pillow's 2-pixel line; `art3.py`: `w9`). `tools/dnacheck.cjs` shows it reproduces the DNA picture pixel for pixel (only the 40 stars and the object by the player differ, and those are kept from the original on top).
- World 10: the seven helices are drawn again each frame, turned by an angle, so they truly rotate (strands wind round, rungs shorten, cross and lengthen). Three designs: all turning, neighbours turning opposite ways, only the two near towers.
- World 9, design C: the spheres are painted from the art source too (`w8`), so each is a complete ball where the chain crosses it or the membrane hides it. The far pair floats behind the chain, the near pair in front of it, both clipped by the membrane. Before, a sphere had a chain-shaped hole in it, which showed as dark spots when it moved.
- Lesson: where a picture was made by code that is in the repo, port that code instead of cutting the picture up. It is exact and it allows real movement.

## Round 6 (16 Nov 2026): in the game

The owner chose 10B and asked for it to go live. The chosen designs were carried over to `packages/web/src/life` (the game draws the same frames: `packages/web/test/life.test.ts` compares them with fingerprints taken here by `tools/golden.cjs`). What follows was the plan before that; `docs/ENGINE.md` says what was built.

## If it goes into the game (the plan as it was)

1. The game draws worlds from a WebGL texture array (`gl.ts`, 72 layers: `s0..s35` and the inner pictures `i0..i35`). Each frame, run the world's motion for the one or two slots on screen (about 0.1 to 2 ms each) and upload those layers, so the zoom between worlds carries the motion.
2. The inner pictures need the same motion (their own cut-outs), or the motion fades out as the dive starts.
3. A "reduce motion" setting, off when the browser asks for reduced motion (the viewer already starts paused then). It belongs with the "reduce flashes" setting that is already on the list.
4. Tests in `packages/web`: LIFE 0 equals the still; frames are the same for the same time.
5. Phones: check frame time on a low-end phone before turning it on everywhere.

## Known rough spots

- The unexplored variants share one design; the stars there only twinkle where the picture has stars, so the darkest variants barely move (that is the point: nothing is known there).
- A few lifted objects (dust specks near the beige rope in world 5) can briefly overlap the rope.
- Not heard or seen on a real phone yet.
