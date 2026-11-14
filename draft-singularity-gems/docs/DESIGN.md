# SINGULARITY gems: design (draft)

## The idea in one paragraph

Every question hides **one** gem: a hand-picked answer that is worth more than anything else in that question. Typing it triggers a special reveal, scores **120 points** (the old top is Mythic at 100), and puts a gem in your **cabinet**: 200 slots, one per question, each a different stone. The new rarity is called **SINGULARITY**.

## Decided by you (this conversation)

- Name: **SINGULARITY**. Not "One in a ...", not a rename of the game.
- Points: **120** (so the size stamp is **÷ 1,000,000**, a million times smaller, and a perfect run of seven is 840).
- A new sound for it. 200 picks, one per question, for you to review.
- Gems you collect, and they should look rare, eccentric and beautiful.

## Defaults I took (change any of them)

| # | Default | Why |
|---|---|---|
| 1 | The gem is a hand-picked **Mythic** answer that almost nobody would think of (round 2: the owner asked for really obscure answers). Its stored rarity does not change; "being the gem" overrides it when you score. Each pick comes with a description written from its English Wikipedia article. **One exception, chosen by the owner:** "Name a soup" keeps Tonkotsu ramen (stored Legendary) with the owner's own description. | In round 1 the picks were fan-findable Legendary answers; the owner rejected that. The lists hold only entries known in roughly 15 to 50 languages for big categories, so the obscurity has a floor (see the README). A gem is stored in its own table, so the exception costs nothing. |
| 2 | **All spellings and aliases** of the gem answer count (and a "Did you mean?" that you accept). | The rarity belongs to the answer, as today. |
| 3 | The gem is **not marked** in the question. You only learn gems exist from the cabinet's question marks. | Keeps the surprise. Easy to change. |
| 4 | The cabinet lives in the **browser** (like the logbook). | No accounts, nothing new on the server. Clearing browser data loses it. Needs one sentence on the privacy page (see the plan). |
| 5 | Finding a gem again plays the same reveal and scores 120 again; the line says "already in your cabinet" instead of "new gem". | Hitting it must always feel good. |
| 6 | Gems count in solo, Daily and multiplayer scoring alike. | One scoring rule. |

## Why 120 and not 100 or 200

120 points is exactly 6 "worlds" (20 points each): one answer drops you six worlds and a size stamp of ÷ 1,000,000, which is your own "one in a million". Only 20 more than Mythic, so it stays special without wrecking the 440-point Planck Foam finale (with gems it takes four of them, 4 × 120 = 480, to cross 440; one gem plus four Legendary answers is exactly 440; the rule "the finale plays the moment the total crosses 440" is unchanged).

## What the player sees (the reveal, in order)

All times are seconds from the moment the answer is accepted.

| Time | Picture | Sound |
|---|---|---|
| 0 to 1.2 | **The pull.** The rarity roll starts as normal, then the world is drained toward a point: streaks of light run inward, a black ring grows with three orbit lines, heartbeats pulse it. | Rising drone, a rush of air drawn inward, a falling whistle, four heartbeats that speed up |
| 1.2 to 1.32 | **The vacuum.** Black screen, one white pixel. | Everything stops (about 0.1 s of true silence) |
| 1.32 | **The birth.** White flash, three shockwaves, the gem scales in with a shake, rays turn behind it, **SINGULARITY!** drops in (chromatic split, then a shine sweeps across). | A deep boom, a crash of light, glass bells |
| 1.5 to 3 | The gem glints, shards burst and fall. | A rising glass arpeggio, a pad, about 35 sparkles |
| 2.0 to 2.9 | Result block (same place and style as today): "SINGULARITY +120" counting up, the answer, and the gem's one-line description, from its Wikipedia article ("A hydrated nickel carbonate mineral."), and "NEW GEM · SAPPHIRE · No. 8 OF 200". | A warm major-ninth chord, counting ticks |
| 3.1 | **÷ 1,000,000** stamps across the picture. The size and world in the top bar roll down six worlds. | |
| 4.6 to 5.5 | The gem flies to the **GEMS 8 / 200** counter at the top left and the counter pops. | Swish, glass "tink", soft thud (the `collect` sound) |

Total about 6.4 s from the answer to the gem landing in the counter. For comparison, the game's own constants give a Mythic roll plus reveal of 2.5 s + 3.9 s = 6.4 s (`ROLL_DUR[5]` and `REV_HOLD[5]` in `config.ts`), so the length is in the same range. The six old rarities are untouched.

## The gems (version 4: rainbow; Crescent chosen 14 Nov 2026)

Round 1 was pie-slice pixels with a dark centre (read as a hole), round 2 glossy vector jewels ("rich and clean", detached from the agreed six), round 3 eight one-hue pixel gems in five colours. The owner then asked for a **rainbow-ish colour scheme** and scrapped round 3. Version 4 keeps the chain's hand (**32 x 32 sprite, one shared near-black outline (18,10,30), flat blocks with hard edges, light from the top left, no gloss/gradient/glow**, measured from `gem0..5.png`) and changes only the colour: a rainbow needs several hues, so each sprite uses 8 to 30 flat colours instead of 5 or 6.

- **62 designs** (round 5 added 50 to the 12 of round 4): cut gems (Octagon Rings, Pentagon, Heptagon, Cut Diamond, Octahedron ...), sky and nature (Crescent, Sun, Blossom, Butterfly, Comet ...), symbols (Bolt, Infinity, Atom, Crown, Snowflake, Pinwheel ...) and crystals and objects (Crystal Cluster, Blade, Crystal Ball, Medal, Potion, Fish ...). Full list in the README. None reuses a scrapped shape.
- **3 rainbow tones each (186 sprites):** Spectrum (vivid), Opal (pastel), Twilight (deep jewel tones).
- **How it is built:** each design is a list of flat facets rasterised into a 32 x 32 grid; every cell is a SLOT (one of seven spectrum hues) and a TONE (0 lightest .. 3 deepest). A rainbow tone just says which actual colours the seven slots are, so one drawing comes in any number of rainbows. `src/gem.js` has no dependency and the sprites are exported as PNG files (`gem-sprites/`).
- **CHOSEN by the owner on 14 Nov 2026: design 23 CRESCENT in the TWILIGHT tone (the rightmost of its three), used as the one gem for all 200 questions**, as each tier has one icon. It is the default in the prototype, and the sprite is saved as `gem-sprites/CHOSEN-gem6-singularity-crescent.png` (32 x 32; ready to become the real `gem6.png`). The other 61 designs stay in `src/` and can still be tried with CHOOSE GEM, but the tour, the video and the preview images show only the Crescent. The cabinet could vary the tone by category (not built, not asked for).
- **Locked slots** in the cabinet draw the same sprite in a dark blue ramp.
- **The rainbow fits the reveal:** the reveal's light rays are already a rainbow, so a rainbow gem sits naturally in it.

## The cabinet

200 slots, grouped by category (the category tabs show `found / total` and "COMPLETE"). A found slot shows the gem and the answer; an unfound one shows a dim silhouette, a "?" and the question ("a mineral"). Clicking a slot opens a card: the gem large, its stone and category, the answer, its one-line story and the question. Counter in the top bar of the game: "GEMS 8 / 200".

## Report and share text

- Report: "1 GEM FOUND IN THIS DIVE · CABINET 8 / 200" (or "NO GEM THIS TIME ..."), and the points line becomes "N / 840 points".
- Share text: the gem is a **💎** square next to the existing ⬜🟩🟦🟪🟧🟥. No answers are revealed.

## Wording (all in one place, for the review)

`SINGULARITY!` · `SINGULARITY +120` · `÷ 1,000,000` · `The one gem hidden in each question.` · `NEW GEM · <STONE> · No. n OF 200` · `GEMS n / 200` · `GEM CABINET` · `COMPLETE` · `n GEM(S) FOUND IN THIS DIVE · CABINET n / 200` · `NO GEM THIS TIME` · the 200 one-line descriptions in `gems/gem-picks.md`. Nothing here says how answers are checked.

## Known weak spots (be honest about them)

- **Flashes.** The birth has a full-screen white flash that fades in 0.3 s, plus a shake and a chromatic split. The game has no "reduce flashes" setting yet (known gap 7 in CLAUDE.md). I would want that setting first, or at least a softer flash (the draft already caps it at 95% white and one decay).
- **Sound not heard by me** (see the README).
- **Small-size legibility:** the sprites are 32 x 32, like the tier icons, but the top-bar counter shows them at 1x. Checked for the chosen Crescent at 16, 24, 32, 48, 64 and 128 px: it still reads as a rainbow moon at 16 px; its two white sparkle pixels are the first thing to disappear (fine, they are only decoration). Other designs with thin or tiny parts (Arch, Fan, Halo) lose more detail at that size. The rainbow gems use far more colours than the agreed icons (8 to 30 against 5 or 6): a deliberate departure, needed for a rainbow.
- **A gem answer is, by design, one almost nobody types**, so most players will never see the reveal in a normal run. That is the point ("one in a Minitude"), but it makes the first gem a real event, and it means the reveal needs the playtest button's "peek" to be seen at all. If gems turn out to be too rare, the lever is the picks (a slightly less obscure answer), not the points.
- Phone portrait layout is not designed (the game itself has no portrait layout yet).
