# Minitude — Project Context and Build Brief

Created: 19 October 2026 (Asia/Singapore).
Updated: 26 October 2026 — project name confirmed as Minitude; run fixed at seven prompts; six rarity tiers (10, 20, 40, 60, 80, 100); pixel-art style; the player starts as a person.
Updated: 28 October 2026 — the player cut the game to 21 real worlds (worlds 1 to 20 and Planck Foam, with an empty "unexplored" stretch between), removed fun facts from the UI, and asked for a minimal UI (pending critique). The walkthrough video v4 is still the approved design EXCEPT where the player's later decisions in the next section differ. Earlier notes: one standard length for every world card; all worlds linked into one zoom; best-case chapter added.
Audience: Claude Code, Codex, or another coding agent implementing this project.

## 1. Purpose and status

Build Minitude, a browser trivia game in which players answer seven open-ended category questions. Valid but less familiar answers earn more points. The selected visual concept is SMALL WONDER: better answers shrink the player farther into increasingly extraordinary worlds hidden inside ordinary surroundings.

This file captures the decisions made in the planning conversation. It is a build brief, not a claim that an application, API integration, or final art assets already exist. Draft design mockups exist (see section 6).

**The walkthrough video is the approved design (27 October 2026).** The player wants the finished game built exactly as the walkthrough video shows it: layout, timings, text, colours, effects and sound. Where the video, the design canvas and any older note in this file disagree, the video wins. Ask before deviating from it. The video is `Minitude_Walkthrough_v4.mp4`. Chapter 1 (162 s) is a full run of seven answers that ends in world 17. Chapter 2 (125 s) is a perfect run that reaches world 36. The numbers in section 6 (timings, sizes, text limits) were copied from the script that rendered the video, so they are exact. The design canvas is out of date. It still shows the 6 × 6 world grid, a field-note panel that covers the world, the old answer layout, a single plain reveal panel and the old names and art for worlds 3 and 4.

**Decisions made after video v4 (28 October 2026). These override the video and every older note below. The video no longer matches them, so ask the player before re-cutting or building from the video for these parts.**
1. **21 worlds, not 36 (decided by the player, 28 October 2026, 16:07 SGT).** Keep worlds 1 to 20 and Planck Foam. Cut old worlds 21 to 35. The player's reasons: the worlds in the lower half felt like a real event forced into a place at a tiny size. Roster: 1 The Room, 2 The Bookshelf, 3 The Desktop, 4 Sand Beach, 5 Thread Forest, 6 Droplet World, 7 Bacteria Garden, 8 Germ Reef, 9 Protein Factory, 10 DNA Forest, 11 Crystal Lattice, 12 Electron Clouds, **13 Gamma Sea (renamed from X-Ray Sea)**, 14 The Great Empty, 15 Nucleus City, 16 Inside The Proton, **17 First Quarks, 18 Short Reach, 19 Ripple Sea, 20 Collision Hall** (the real-world replacements for the old invented worlds 17 and 18 and the old Laser Hall; texts in the table in the real-worlds section below), and **21 Planck Foam** (old world 36, kept as the player likes it; labelled THEORY).
2. **World 13 fix.** At 1.7 pm light is gamma rays, not X-rays (X-rays run about 10 pm to 10 nm, and the two overlap by energy; the old name and the line about waves shorter than you were wrong for this size). New: name GAMMA SEA, line "Gamma rays from radioactive atoms have waves about as long as you are tall.", label REAL · MEASURED · CAESIUM-137, 662 KEV. Maths: wavelength = h × c ÷ energy = 1.239841984 × 10⁻⁶ eV·m ÷ 662,000 eV = 1.87 × 10⁻¹² m, which is 1.1 times the player's 1.7 pm. Source: the 662 keV main line of caesium-137 (radiacode isotope page); Wikipedia "Gamma ray" for the overlap with X-rays. The picture (stacked waves) is unchanged.
3. **Numbering.** World cards read "WORLD n / 21", with n = 1 to 21 in order (Planck Foam is "WORLD 21 / 21"). This is a default the assistant chose; the player has not commented. The size and points rules do not change: the player's size is still 1.7 m ÷ 10^(points ÷ 20), so the size passes smoothly through every size whether or not a world is drawn there. Worlds 1 to 20 still start at 20 × (n − 1) points (world 20 starts at 380 points, 1.7 × 10⁻¹⁹ m). Planck Foam still starts at 700 points, which only a perfect run (seven Mythic answers) reaches.
4. **Unexplored stretch (draft, NOT yet confirmed by the player).** From 400 points (1.7 × 10⁻²⁰ m) up to 700 points the player is in one dark stretch called UNEXPLORED: almost empty sky of dim specks, a dim floor with tick marks, the explorer, the size counter and the scale bar. Title card on entry: "BETWEEN WORLD 20 AND WORLD 21", "UNEXPLORED", "No experiment has looked this small. Nothing is known to exist here.", "NO DATA · NOTHING MEASURED HERE". The top-right world label reads "UNEXPLORED" with no number. The result-screen comparison line for any size below world 20 would read "Smaller than any experiment has looked." (replaces "Smaller than a proton." style lines there). All-one-tier run ends: 7 × Exotic (420) and 7 × Legendary (560) now end in the unexplored stretch; 7 × Mythic (700) ends in Planck Foam. The depth rail keeps its 35-decade ticks (sizes, not worlds); the rail label beside the marker reads UNEXPLORED in the stretch. The boundary ring and flash play at 400 points like any world boundary.
5. **Chapter 2 (best case) changes.** It would pass worlds 17 to 20, then cross the unexplored stretch, and end in Planck Foam (21 of 21) at 700 points, with no stops in the cut worlds. Four Mythic answers still land at 400, 500, 600 and 700 points; the cards at 400, 500 and 600 would be the unexplored stretch (one card on entry, no new card at 500 and 600). Not re-cut yet.
6. **Fun facts removed from the UI entirely** (28 October 2026): no field notes, field guide, fact-check page, "INVENTED WORLD" labels or the 8-second field note after the last landing.
7. **Tap to skip the world title card** (28 October 2026): see the skip rule in section 6.
8. **Minimal UI**: proposal only, pending the player's critique (see section 6). Do not build it as final yet.
9. **Not yet done:** the video has not been re-cut for any of these, the design canvas still shows 36 worlds and the fun-facts pages, and the lobby, daily route, share and how-to screens have not been redrawn.

Distinguish confirmed requirements from proposed implementation defaults throughout this file. The confirmed project name is Minitude. SMALL WONDER remains the name of the selected shrinking-world visual concept. A public domain has not been selected or registered.

## 2. Confirmed decisions

| Area | Decision |
| --- | --- |
| Project name | Minitude. |
| Core interaction | Answer open-ended questions with any valid answer that satisfies the prompt. |
| Run length | Seven questions per run. |
| Scoring principle | Less familiar valid answers score more highly. |
| Rarity methodology | Familiarity data plus LLM assistance; manual review may be used for auditing or exceptions. Live player submission frequency is not the scoring basis. |
| Content generation | Use the automated generation, verification, scoring, caching, and missing-answer flow described below. |
| Formats | Shared Daily Challenge, Unlimited Solo, and Competitive Multiplayer are all desired. |
| Question categories | The 11 categories in section 4 are approved. |
| Visual direction | SMALL WONDER: a shrinking expedition through hidden worlds. |
| Art style | Pixel art, inspired by Krillion but with original art and interface. |
| Starting point | The player starts as a person (about 1.7 m) and shrinks through many magnitudes. |
| Rarity tiers | Six tiers worth 10, 20, 40, 60, 80 and 100 points. The lowest is named Common. Names for the other five are proposals (section 7). |
| Initial LLM budget | Test a genuinely free API tier first. Do not silently enable paid usage. |
| Builder | The user will use Claude Code or Codex to develop the project. |

## 3. Inspiration and differentiation

Reference projects supplied by the user:

- [Krillion](https://krillion.io/)
- [Scallion](https://scallion.anselmlong.com/)

Retain the short open-answer loop and the pleasure of recalling an unusual correct answer. Give this project its own art, interface, content, scoring implementation, and identity.

Krillion's official FAQ describes assembling answer sets from datasets and reference sources. It describes rarity assessment using familiarity data for some prompts and LLM assistance plus a manual pass for others. It also says its highest-tier answer can be chosen partly for its satisfying discovery value. These are reference observations, not access to Krillion's private scoring algorithm.

For this project, a special decorative discovery should not secretly override the published rarity scoring rule.

Research limitation: Krillion's official text pages were accessible during planning. Scallion could not be inspected directly in that browsing environment. Do not invent details about Scallion or imply that both games were fully playtested.

## 4. Approved question categories

The following 11 categories are fixed product categories. Prompt examples illustrate scope; they are not a verified launch question bank.

| Category | Scope | Illustrative prompt |
| --- | --- | --- |
| Places | Countries, cities, landmarks, rivers, mountains, islands, and other geographic places | Name a landlocked country. |
| Food | Dishes, ingredients, beverages, cuisines, cooking methods, and food varieties | Name a type of cheese. |
| Music | Artists, bands, songs, albums, instruments, and musical genres | Name a percussion instrument. |
| Miscellaneous | Everyday objects, occupations, hobbies, household products, and approachable unusual categories | Name something commonly sold in a tube. |
| Animals & Nature | Animals, plants, habitats, and natural phenomena | Name a living species of flightless bird. |
| Movies & TV | Films, television shows, actors, directors, and fictional characters | Name a Pixar feature film. |
| Sports | Sports, athletes, teams, competitions, and sporting equipment | Name a racket sport. |
| Games | Video games, board games, card games, franchises, and game characters | Name a video-game franchise. |
| Science & Technology | Chemistry, space, inventions, computing, devices, and related subjects | Name a chemical element. |
| History & Mythology | Historical people, rulers, civilizations, events, and mythological beings | Name an ancient Greek deity. |
| Transport & Vehicles | Vehicles, manufacturers, transport modes, vessels, and transport infrastructure | Name a car manufacturer. |

Books & Language and Art & Fashion were suggested but were not selected as separate categories.

Content guidance:

- Aim for prompts where a typical intended player can recall at least one answer, while knowledgeable players have several less obvious alternatives.
- Ensure a meaningful range of accepted answers and familiarity. Avoid prompts with only a handful of plausible answers.
- Specify boundaries: species versus broad animal groups, fictional versus real entities, brands versus product types, historical versus current membership, and so on.
- Define the source date or version for changing facts such as sports rosters, software, and game character lists.
- Avoid using disputed national origins of dishes or vague subjective classifications without a clear acceptance rule.
- Miscellaneous should offer approachable surprises, rather than function as a dumping ground for inaccessible trivia.
- A model generating a prompt does not establish that the prompt is good or its answer set is complete.

Recommended default: mix categories in the shared Daily Challenge. Add category selection to Unlimited and lobby configuration when practical. Category selection behavior has not been explicitly finalized.

## 5. Core gameplay

Recommended first implementation defaults, all configurable:

- Seven questions per run (confirmed, not just a default).
- Approximately 25 seconds of answering time per question.
- One submitted answer per round; typo correction and retry behavior remain a product decision.
- Six rarity tiers worth 10, 20, 40, 60, 80 and 100 points (confirmed; see section 7).
- Brief feedback between questions, with a final expedition summary.

Expected loop:

1. Enter the expedition and see the rules.
2. Reveal a category and a precise question.
3. Start the answering timer only when the question is ready and playable.
4. Submit one answer.
5. Show the recognized answer, validity decision, rarity tier, points, and resulting shrink.
6. Transition through the shrinking environment.
7. Continue until the run ends.
8. Show total score, final scale or destination, round history, and a spoiler-safe share result.

Generation or adjudication delays must not consume the player's answering time. Submitted answers should have a clear received state while awaiting evaluation.

Do not make factual validity, rarity, and presentation one opaque decision. Players should be able to understand why an answer qualifies and how its tier was assigned.

## 6. SMALL WONDER visual direction

Premise: the player operates an experimental shrinking capsule or similar expedition device. The more points earned, the smaller the expedition becomes.

The central pleasure is discovering extraordinary landscapes inside familiar surroundings.

Illustrative progression:

- An ordinary desk or room, with an identifiable object establishing scale.
- Fabric fibers becoming towering structures.
- Dust and surface textures becoming a landscape.
- A water droplet becoming an enormous suspended environment.
- Microscopic-inspired surroundings becoming increasingly abstract and fantastical.

These are art-direction examples, not fixed assets or a literal scientific itinerary. Distinguish stylized fantasy environments from claims about real biology or physics.

Design guidance:

- Smaller means better performance. Make that understandable immediately.
- Use visual scale references and a persistent score indicator; do not rely only on tiny numerical units.
- Shrink according to cumulative points, not merely the number of rounds completed.
- Make progression monotonic: additional earned points must never make the player's expedition larger.
- A logarithmic mapping between score and displayed size is used in the design draft below. It is proposed, not final.
- Let ordinary runs encounter interesting scenery. Exceptional runs should reveal the most remarkable destinations.
- Keep the question and answer interface legible throughout the transformations.
- Build a coherent visual world with considered lighting, texture, sound, and transitions.
- Give players reduced-motion and sound controls.
- Verify the input experience on mobile, especially when the software keyboard is open.

No commitment has been made to a 3D engine, first-person movement, a controllable avatar, Unity, or Blender. This is a separate project from the user's other game ideas. Choose the lightest rendering approach that delivers the intended experience.

A polished layered 2D implementation is a reasonable first option; evaluate WebGL or 3D if it materially improves the result.

### Confirmed visual choices

- Pixel-art style. Take inspiration from Krillion's look but draw original art.
- The player starts as a person, about 1.7 m tall, standing in an ordinary room.
- The player is drawn at the same size in every world. The world grows around them, so the scale is always clear.

### Proposed design details (design drafts of 26 October 2026, not yet approved)

The drafts are a Claude design canvas called "Minitude Design Draft" with 19 screens. Treat it as a visual reference, not final art.

- **Size formula:** size = 1.7 m ÷ 10^(total points ÷ 20). Every 20 points makes the player ten times smaller. Shrink depends on total points, so it can only go down.
- **Score range for seven prompts:** 70 points (all Common) to 700 points (all Mythic). A perfect run ends at 1.7 × 10⁻³⁵ m, about the Planck length.
[Superseded on 28 October 2026: the game now has 21 worlds, see section 1.] - **36 worlds.** A new world starts every 20 points. World number n starts at 20 × (n − 1) points and its size is 1.7 m ÷ 10^(n − 1). So world 5 starts at 80 points and is 1.7 m ÷ 10,000 = 170 µm. World 36 starts at 700 points.
[Superseded on 28 October 2026: the game now has 21 worlds, see section 1.] - **Where runs end.** Seven prompts of one tier end in world 4 (70, all Common), 8 (140, Uncommon), 15 (280, Rare), 22 (420, Exotic), 29 (560, Legendary) and 36 (700, Mythic). The mock report uses 320 points, which is 1.7 × 10⁻¹⁶ m = 0.17 fm = 170 am, world 17.
- **Scale bar, not a ruler.** Each scene has one short bar with two end caps and a label, in the lower right. The explorer is always drawn the same size, so the bar changes. The bar is the largest 1, 2 or 5 × a power of ten that is at most 1.2 × the explorer's size. Bar pixels = bar length × (explorer pixels ÷ explorer size). For a world sized 1.7 × 10⁻ᵏ m the bar is 2 × 10⁻ᵏ m: 2 ÷ 1.7 × 100 = 118 px beside a 100 px explorer. At 54 cm the bar is 50 cm: 50 ÷ 54 × 100 = 93 px.
[Partly superseded: worlds 32 to 35 are cut; powers of ten are now only used for Planck Foam at 1.7 × 10⁻³⁵ m and the unexplored stretch.] - **Units step down** as the player shrinks: m, cm, mm, µm, nm, pm, fm, am, zm, ym, rm, qm. Below 10⁻³⁰ m there is no prefix, so worlds 32 to 36 show powers of ten (1.7 × 10⁻³¹ m and so on).

| World | Starts at (points) | Size | Name | Content |
| --- | --- | --- | --- | --- |
| 1 | 0 | 1.7 m | The Room | Fact |
| 2 | 20 | 17 cm | The Bookshelf | Fact |
| 3 | 40 | 1.7 cm | The Desktop | Fact |
| 4 | 60 | 1.7 mm | Sand Beach | Fact |
| 5 | 80 | 170 µm | Thread Forest | Fact |
| 6 | 100 | 17 µm | Droplet World | Fact |
| 7 | 120 | 1.7 µm | Bacteria Garden | Fact |
| 8 | 140 | 170 nm | Germ Reef | Fact |
| 9 | 160 | 17 nm | Protein Factory | Fact |
| 10 | 180 | 1.7 nm | Dna Forest | Fact |
| 11 | 200 | 170 pm | Crystal Lattice | Fact |
| 12 | 220 | 17 pm | Electron Clouds | Fact |
| 13 | 240 | 1.7 pm | X-Ray Sea | Fact |
| 14 | 260 | 170 fm | The Great Empty | Fact |
| 15 | 280 | 17 fm | Nucleus City | Fact |
| 16 | 300 | 1.7 fm | Inside The Proton | Fact |
| 17 | 320 | 170 am | Quark Sea | Invented art, no fact |
| 18 | 340 | 17 am | Gluon Rivers | Invented art, no fact |
| 19 | 360 | 1.7 am | Ripple Sea | Fact |
| 20 | 380 | 170 zm | Laser Hall | Fact |
| 21 | 400 | 17 zm | Spark Field | Invented art, no fact |
| 22 | 420 | 1.7 zm | The Unknown | Fact |
| 23 | 440 | 170 ym | Silent Dark | Invented art, no fact |
| 24 | 460 | 17 ym | The Hum | Invented art, no fact |
| 25 | 480 | 1.7 ym | String Garden | Invented art, no fact |
| 26 | 500 | 170 rm | Crystal Void | Invented art, no fact |
| 27 | 520 | 17 rm | Mirror Maze | Invented art, no fact |
| 28 | 540 | 1.7 rm | Foam Shore | Fact |
| 29 | 560 | 170 qm | Loop Forest | Invented art, no fact |
| 30 | 580 | 17 qm | Bubble Tide | Invented art, no fact |
| 31 | 600 | 1.7 qm | Knot City | Fact |
| 32 | 620 | 1.7 × 10⁻³¹ m | Ribbon Sky | Invented art, no fact |
| 33 | 640 | 1.7 × 10⁻³² m | Glass Tide | Invented art, no fact |
| 34 | 660 | 1.7 × 10⁻³³ m | Dream Static | Invented art, no fact |
| 35 | 680 | 1.7 × 10⁻³⁴ m | The Last Door | Invented art, no fact |
| 36 | 700 | 1.7 × 10⁻³⁵ m | Planck Foam | Fact |

[Superseded on 28 October 2026: the game now has 21 worlds, see section 1.] - **Worlds without a fact are invented.** No microscope can show scales that small, so the art is stylised and the cards say "INVENTED WORLD". These are worlds 17, 18, 21, 23 to 27, 29, 30 and 32 to 35 (14 of 36). Worlds from the Proton down are art, not science. Do not present them as real measurements.
- **Shrink animation (revised 27 October 2026 after the first walkthrough video):** a plain continuous zoom. There is no portal, ring or speed lines. The camera pushes in on the ground under the explorer's feet, and every world is what you would really see if you magnified a small patch at the explorer's feet in the world before. That patch is 1/10 of the frame wide, so the next world is already inside the last and simply grows to fill the screen. The explorer keeps the same spot and size, and the ground line stays at the same height in every world. The player's first feedback was that separate-looking worlds felt like entering a different dimension. The bar stays the same length on screen and its label drops 10 times per world. Short falls skip the middle worlds. A 10-point fall crosses at most one border and a 20-point fall exactly one. Reduced-motion mode swaps the fall for a quick fade while the size number still counts down.
[Superseded on 28 October 2026: the game now has 21 worlds, see section 1.] - **Linked worlds (all 36 in video v4).** The whole zoom is one chain, world 1 to world 36. Each world is what you would see if you magnified the patch under the explorer's feet in the world before. The room (a carpeted floor, bookshelf behind the explorer) leads to the bookshelf, a pile of carpet tufts, yarn ropes and the thread forest. World 3 is "The Pile" and world 4 is "Yarn Ropes" (they were The Desktop and Sand Beach). Worlds 1 to 4 were redrawn. Worlds 5 to 36 keep the original art, with each picture's colours and brightness blended at its edges toward the world before, so each world grows out of the last. Art in worlds 5 to 36 does not literally continue the picture before it. The player saw this in v2 and accepted it. The next world is already drawn into a small window at the explorer's feet, and the window grows to fill the screen. The design canvas and the atlas above still show the old names and art for worlds 3 and 4.
- **Desktop layout (revised 27 October 2026, walkthrough video v3, after the player said the panels blocked the world).** The world fills the screen. A translucent top bar holds round, score and size. The question and answer field sit in a solid command bar along the bottom (about 128 px). The bar swaps its content through the round: ask, checking, rarity roll, result. It slides away during the dive so the world has the whole screen. The field note is a translucent caption at the bottom left (about 640 × 190 px) that shows while the player types and then fades. The explorer stands at the same spot in every world.
[The rail keeps its decade ticks, but "WORLD n / 36" is now "WORLD n / 21", see section 1.] - **Depth gauge (replaces the 6 × 6 world grid).** A vertical rail on the right edge with 36 ticks, labelled every 6 worlds (1.7 m, 1.7 µm, 1.7 pm, 1.7 am, 1.7 ym, 1.7 qm, Planck). A bright line marks where the player is and drops continuously during a dive, with a chip "WORLD n / 36" and the world name beside it. Each answer leaves a segment in its rarity colour. A striped band below the line shows how far the player could still reach if every remaining answer were worth 100 (5 decades per answer). After each answer the band shortens by the points not earned, flashing red for a moment, so a weak answer visibly costs reach. Worlds not yet reached are not named.
- **Reveal and dive (v3).** Order per round: lock in, checking (VALID stamp), rarity roll (a cursor runs across the six tier slots and slows to a stop, longer for rarer results), tier celebration, charge-up (explorer crouches, the gem flies into the explorer, a big "÷ factor" stamp slams in), dive, landing, world title card.
- **Celebrations scale with rarity and use the tier colour.** Common: small grey sparks and a pill. Uncommon: green ring, sparkles, pill. Rare: two blue rings, glints, light shake, "RARE!" title. Exotic: purple lightning, three rings, flash, glitch title, vignette. Legendary: brief hit-stop, rotating gold sunburst, four rings, confetti, shine across the title, shake. Mythic: longer hit-stop, white-to-pink flash, full pink halftone sunburst takeover, giant "MYTHIC!" title with glitch, shockwaves, confetti rain, orbiting stars, hard shake. The earlier videos left the Mythic moment out, so the reveal was a plain panel for every tier.
- **Dive effects.** Radial zoom blur and red/blue colour split grow with speed, thin speed streaks stay at the screen edge so the worlds remain visible, camera shake, a ring and flash at each world boundary, a small gate pill for each world passed, sparks off the explorer, a size readout counting down, and a landing impact (ground shockwave, dust, camera punch, explorer squash). The dive is faster to start and slower to finish.
- **World title card: one standard for every world (revised 27 October 2026, after the player said the card vanished before they could finish the description).** Every card lasts exactly 7.0 s, whatever the world. The dark band opens in 0.3 s and a light line shoots out. "WORLD n / 36" appears, then the name pops in letter by letter in a colour taken from the world's own picture. The one-line description fades in at 1.0 s and stays fully visible until 6.4 s, then everything fades out by 7.0 s. That is 5.4 s of reading time. The longest description is 14 words, about 4.2 s for a slow reader (200 words per minute), so every description can be read with time to spare. A second shine crosses the name at about 4 s so the screen stays alive. Rules for the text: the description is one line and at most 1,100 px wide at 22 px (the longest today is 925 px, Planck Foam). The next question slides up 0.4 s after the card ends, and the question timer starts then, so the timer never runs during a card. The video does not show a skip; the skip rule in the next bullet was requested afterwards. Invented worlds add "INVENTED WORLD · ART ONLY". World 36 shows "PERFECT RUN · 7 × MYTHIC = 700 PTS ENDS HERE" instead of the 36-tick ruler. Sound: a soft chord for the whole card, a tick per letter, shimmer cascades, a swish as it leaves. After the very last landing of a run, the field note for that world stays up for 8.0 s (about 26 words at 200 words per minute) before the report slides in.
- **World cards can be skipped (requested 28 October 2026; NOT yet shown in the video, which is still the spec until it is re-cut).** The player wants a tap to dismiss the card and go straight to guessing. Proposed defaults, to confirm: a tap or click anywhere, or Space or Enter, ends the card at once. The band and text fade out in about 0.25 s and the next question slides up immediately, and the question timer starts then, as before, never during a card. A small "TAP TO SKIP" hint sits at the lower right of the band on every card (Silkscreen 11 px, grey-blue, shown from the start; the draft frames show it). Taps are ignored for the first 0.4 s, while the band opens, so a late tap from the dive or landing cannot skip a card the player has not seen. The dive itself cannot be skipped. A card nobody taps still runs the standard 7.0 s. After the very last landing of a run, a tap on the card goes to the field note, and the field note keeps its 8.0 s hold unless tapped again, then the report slides in (proposed). Skip plays only the closing swish. Reduced-motion mode skips with a plain fade. Keyboard and screen-reader users get the same Space or Enter skip, and the hint reads "Press Space to skip" on devices with a keyboard.
- **Font warnings (found 27 October 2026 while checking the v3 video).** Pixelify Sans has two faults that matter for a game full of numbers and trivia text. Its "5" is the same shape as its "S", so "50 cm" reads as "S0 cm". Its "fi" and "fl" ligatures draw broken glyphs, so "flightless" shows as "Aightless" and "fifth" as "Afth". The video fixes both with a patched copy of the font (flat-topped 5, ligatures off). The real build must do the same: either ship a patched font, set `font-variant-ligatures: none` and replace the 5 glyph, or use a different pixel font for numerals and body text. Silkscreen's 5 is fine. Do not ship stock Pixelify Sans for numbers. Two more gaps: the font has no superscript minus ("10⁻³¹"), which the video adds as a short raised bar, and its superscript digits are small and uneven (the raised 5 looks like an S). The video draws every raised digit as a 70% copy of the normal digit (55% was too small: the 3 read as a 9) (which already has the flat-topped 5), placed so its top lines up with the full-size digits, and draws the raised minus as a plain short bar. Use real superscript glyphs only if they pass the same test: "10⁻³⁵" must read as 10, minus, 3, 5 at 20 px. Silkscreen has no superscript digits above 3 at all, so sizes with exponents are always set in Pixelify.
- **Text must never be cut off.** The result bar fits an answer's one-line description in 430 px at 16 px. The first v3 video cut four of the seven short with "..."; the texts were shortened (for example Takahē is now "A flightless rail from New Zealand.", Katamari Damacy "A 2004 Namco game: roll a ball, pick up everything."). World card descriptions must fit on one line. Any new text must be measured, not guessed.
[Superseded on 28 October 2026: the game now has 21 worlds, see section 1.] - **Sizes below the last metric prefix.** Quecto (10⁻³⁰ m) is the last prefix, so from world 32 on sizes are shown as powers of ten, for example "1.7 × 10⁻³¹ m". The size in the top bar shrinks its font to fit in 150 px, and the score moves left so there is always a clear 36 px gap between the score and the size. The result bar uses a compact form ("1.7×10⁻³¹"). There is no "new scale" chip for that jump. The world 31 field note explains it.
[Superseded on 28 October 2026: the game now has 21 worlds, see section 1.] - **Chapter 2: the best case (second part of the video).** After the full run the video shows a perfect day with the same questions. Three Mythic answers are already done (300 points, world 16, Inside the Proton). Four more Mythic answers (percussion instrument, chemical element, car brand, Greek deity) take the player 300, 400, 500, 600, 700 points and land in worlds 21 (Spark Field), 26 (Crystal Void), 31 (Knot City) and 36 (Planck Foam), passing through every world from 17 to 36 with a gate pill for each. Each landing has a card. The end screen says 1.7 × 10⁻³⁵ m, "About one Planck length", 700 / 700, deepest world Planck Foam (36 of 36). The answers are placeholders for the mock-up and the rarity of each is invented: Époisses, Kakapo, Mother 3, Waterphone, Praseodymium, Koenigsegg, Eileithyia. Their one-line descriptions were checked against Wikipedia (waterphone, Koenigsegg, Mother 3; kakapo and praseodymium are common knowledge; Époisses was not checked).
- **Timings in the video (seconds).** Intro 6.4. Per question: 2.2 before typing starts (2.5 for the first), 0.1 per typed character, 0.5 to lock in, 0.2 checking, 0.65 until VALID, 0.4 pause, then the rarity cursor runs 1.3 / 1.45 / 1.6 / 1.8 / 2.1 / 2.5 for Common to Mythic. The celebration holds 1.5 / 1.8 / 2.1 / 2.6 / 3.1 / 3.9. Charge-up 0.7. The dive takes 1.9 when no world border is crossed, otherwise 1.5 plus 0.8 per world crossed (a Mythic dive is 5.5). Landing card 7.0, then a 0.4 pause. A normal run (all seven answers, one landing card each) is about 160 s. Reading times above assume 200 words per minute.
- **Mobile layout:** a short scene strip on top, then the question, then the input. Everything must fit above the phone keyboard (about 300 px).

### Real-world replacements for the old invented worlds (28 October 2026). Worlds 17 to 20 are now APPROVED by the player's 21-world decision; worlds 21 to 35 in the table below were CUT, and world 36 became world 21 (see section 1)

The player said 14 invented worlds in the lower half felt like too many and asked whether each could be replaced by something real at that size. Answer: yes for all of them, with one honest limit. Nothing smaller than about 10⁻¹⁸ m has ever been seen. So below world 18 the real things are not scenes. They are (a) probes, the wavelength of a real particle beam or cosmic ray, (b) limits, a measurement that says "nothing bigger than this was found", and (c) one theory scale, the Planck length. The pictures are drawings of the instrument or the event, not photos of anything at that size. Draft frames for all 20 worlds (17 to 36) were rendered with the real title cards and sent to the player on 28 October 2026. Nothing here is in the walkthrough video yet, so the video is still the spec until the player approves.

- **Rule for choosing.** The real size X must fall within about 0.08 to 3 times your size at the start of the world, so the card can say "about half of you" or "about two of you". Ratios in the table use the size at the start of the world (the same convention as the existing field notes).
- **Labels, shown on the card in place of "INVENTED WORLD · ART ONLY".** MEASURED (green): a real beam, particle or event with this wavelength or size was produced or seen. LIMIT (cyan): a real experiment found nothing bigger than this. THEORY (amber): a calculated scale nobody has reached. Only world 36 is THEORY. The card's bottom line reads, for example, "REAL · MEASURED · SLAC 1968".
- **How each number is obtained.** Wavelength of a particle = h × c ÷ energy, with h × c = 1.239841984 × 10⁻⁶ eV·m (so 17 GeV gives 7.3 × 10⁻¹⁷ m, 13.6 TeV gives 9.1 × 10⁻²⁰ m, 3.2 × 10²⁰ eV gives 3.9 × 10⁻²⁷ m). Reach of a force carried by a particle of mass m = ħ ÷ (m × c) = ħc ÷ (m c²), with ħc = 1.973269804 × 10⁻¹⁶ GeV·m (W boson, 80.37 GeV, gives 2.5 × 10⁻¹⁸ m). An electric dipole moment limit d in e·cm becomes metres by dividing by the charge e and converting cm to m: 1.8 × 10⁻²⁶ e·cm = 1.8 × 10⁻²⁸ m. The size limits from Fermi and H.E.S.S. come from the energy scale: length = ħc ÷ energy (H.E.S.S. 7.2 × 10¹⁷ GeV gives 2.7 × 10⁻³⁴ m) and the Planck length ÷ 1.19 (Fermi; the paper's abstract rounds the limit to 1.2 Planck energies; 1.36 × 10⁻³⁵ m, shown as 1.4 × 10⁻³⁵ m). The arithmetic was run in code, not by hand.
- **The table.** "Your size" is the world's starting size.

| World | Your size | Old name | New name | Real size | Real size ÷ your size | Label |
| --- | --- | --- | --- | --- | --- | --- |
| 17 | 170 am | Quark Sea | First Quarks | 7.3 × 10⁻¹⁷ m | 0.43 | MEASURED · SLAC 1968 |
| 18 | 17 am | Gluon Rivers | Short Reach | 2.5 × 10⁻¹⁸ m | 0.14 | MEASURED · W BOSON MASS |
| 19 | 1.7 am | Ripple Sea | Ripple Sea | 4.0 × 10⁻¹⁸ m | 2.4 | MEASURED · LIGO 2015 |
| 20 | 170 zm | Laser Hall | Collision Hall | 9.1 × 10⁻²⁰ m | 0.54 | MEASURED · LHC 13.6 TEV |
| 21 | 17 zm | Spark Field | Gamma Sky | 1.2 × 10⁻²⁰ m | 0.73 | MEASURED · LHAASO 2021 |
| 22 | 1.7 zm | The Unknown | Record Light | 8.9 × 10⁻²² m | 0.52 | MEASURED · LHAASO 2021 |
| 23 | 170 ym | Silent Dark | One Electron | 1 × 10⁻²² m | 0.59 | LIMIT · PENNING TRAP |
| 24 | 17 ym | The Hum | Deep Sea Eyes | 5.6 × 10⁻²⁴ m | 0.33 | MEASURED · KM3NET 2023 |
| 25 | 1.7 ym | String Garden | Tank Field | 1.2 × 10⁻²⁴ m | 0.73 | MEASURED · AUGER |
| 26 | 170 rm | Crystal Void | Beyond The Galaxy | 1.6 × 10⁻²⁵ m | 0.91 | MEASURED · AUGER 2017 |
| 27 | 17 rm | Mirror Maze | The Sky Limit | 2.5 × 10⁻²⁶ m | 1.5 | MEASURED · GZK LIMIT |
| 28 | 1.7 rm | Foam Shore | Oh-My-God | 3.9 × 10⁻²⁷ m | 2.3 | MEASURED · FLY'S EYE 1991 |
| 29 | 170 qm | Loop Forest | Round Neutron | 1.8 × 10⁻²⁸ m | 1.06 | LIMIT · PSI 2020 |
| 30 | 17 qm | Bubble Tide | Thallium Beam | 1.6 × 10⁻²⁹ m | 0.94 | LIMIT · BERKELEY 2002 |
| 31 | 1.7 qm | Knot City | Cold Molecules | 8.7 × 10⁻³¹ m | 0.51 | LIMIT · ACME 2014 |
| 32 | 1.7 × 10⁻³¹ m | Ribbon Sky | Inside A Molecule | 1.1 × 10⁻³¹ m | 0.65 | LIMIT · ACME 2018 |
| 33 | 1.7 × 10⁻³² m | Glass Tide | Ion Ring | 4.1 × 10⁻³² m | 2.4 | LIMIT · JILA 2023 |
| 34 | 1.7 × 10⁻³³ m | Dream Static | Light's Race | 2.7 × 10⁻³⁴ m | 0.16 | LIMIT · H.E.S.S. 2008 |
| 35 | 1.7 × 10⁻³⁴ m | The Last Door | Dead Heat | 1.4 × 10⁻³⁵ m | 0.08 | LIMIT · FERMI 2009 |
| 36 | 1.7 × 10⁻³⁵ m | Planck Foam | Planck Foam | 1.6 × 10⁻³⁵ m | 0.95 | THEORY · PLANCK LENGTH |

- **Card text and field notes (final draft wording).** Descriptions are one line, at most 14 words and at most 925 px at 22 px, measured.
  - **World 17, FIRST QUARKS** (MEASURED · SLAC 1968). Card line: "Fast electrons bounce off tiny hard points inside a proton." Field note "ELECTRONS AS TINY RULERS": A 17 GeV electron has a wavelength of 7.3 × 10⁻¹⁷ m (h × c ÷ energy). SLAC fired electrons in this range at protons and saw them bounce off tiny hard parts, later called quarks. You are 2.3 times that wavelength. Source: WIKIPEDIA: DEEP INELASTIC SCATTERING.
  - **World 18, SHORT REACH** (MEASURED · W BOSON MASS). Card line: "The weak force reaches only about 1/700th of a proton." Field note "A FORCE THAT BARELY REACHES": The weak force is carried by the W boson, mass 80.37 GeV. A force reaches about ħ ÷ (m × c) = 2.5 × 10⁻¹⁸ m, roughly 1/700 of a proton. You are about 7 times that reach. Textbook figures vary from 10⁻¹⁸ to 10⁻¹⁶ m. Source: PDG (W MASS) · WIKIPEDIA: WEAK INTERACTION.
  - **World 19, RIPPLE SEA** (MEASURED · LIGO 2015). Card line: "A passing gravitational wave stretched LIGO's arms by about two of you." Field note "SPACE STRETCHED BY ~2 OF YOU": In 2015 LIGO caught a gravitational wave with a peak strain of 1.0 × 10⁻²¹. Strain × arm length (4,000 m) gives about 4 × 10⁻¹⁸ m of arm-length difference, a little over two of you. Source: LIGO, PHYS. REV. LETT. 116, 061102 (2016).
  - **World 20, COLLISION HALL** (MEASURED · LHC 13.6 TEV). Card line: "The LHC reaches this small. Quarks still show no parts inside." Field note "THE SMALLEST THING WE CAN PROBE": The LHC collides protons at a total of 13.6 TeV. The matching wavelength is h × c ÷ energy = 9.1 × 10⁻²⁰ m, about half of you. Nothing has been found inside quarks or electrons down to about 10⁻¹⁹ m. Source: CERN · WIKIPEDIA: QUARK.
  - **World 21, GAMMA SKY** (MEASURED · LHAASO 2021). Card line: "Twelve sources in our galaxy send light with wavelengths near your size." Field note "100 TEV LIGHT FROM SPACE": A 100 TeV photon has a wavelength of 1.2 × 10⁻²⁰ m, about three-quarters of you. In 2021 the LHAASO observatory in China reported a dozen sources in our galaxy sending photons above 100 TeV. Source: LHAASO, NATURE, 2021.
  - **World 22, RECORD LIGHT** (MEASURED · LHAASO 2021). Card line: "A 2021 photon carried 1.4 quadrillion electronvolts. Its wavelength is half of you." Field note "THE MOST ENERGETIC LIGHT, 2021": LHAASO detected photons up to 1.4 PeV (1.4 × 10¹⁵ eV). Its wavelength is 8.9 × 10⁻²² m (h × c ÷ energy), about half of you. Source: LHAASO, NATURE, 2021.
  - **World 23, ONE ELECTRON** (LIMIT · PENNING TRAP). Card line: "An electron has no measurable size. It cannot be bigger than this circle." Field note "A POINT WITH NO INSIDE": As far as any experiment can tell, an electron is a point: no size and no parts inside. Experiments only give an upper limit. Its radius is under about 10⁻²² m, the dashed circle, a little over half of you. Source: WIKIPEDIA: ELECTRON.
  - **World 24, DEEP SEA EYES** (MEASURED · KM3NET 2023). Card line: "An undersea detector caught a neutrino of about 220 PeV in 2023." Field note "THE MOST ENERGETIC NEUTRINO": On 13 February 2023 KM3NeT, off the coast of Sicily at 3,500 m deep, caught a neutrino of an estimated 220 PeV. Its wavelength is 5.6 × 10⁻²⁴ m (h × c ÷ energy), a third of you. The energy has a wide error range. Source: KM3NET, NATURE, 2025 · WIKIPEDIA: KM3NET.
  - **World 25, TANK FIELD** (MEASURED · AUGER). Card line: "Cosmic rays strike a field of 1,600 water tanks across 3,000 km²." Field note "A DETECTOR THE SIZE OF A COUNTY": The Pierre Auger Observatory in Argentina has 1,600 water tanks over 3,000 km². It records air showers from cosmic rays above 1 EeV (10¹⁸ eV). Such a particle has a wavelength of 1.2 × 10⁻²⁴ m, about three-quarters of you. Source: WIKIPEDIA: PIERRE AUGER OBSERVATORY.
  - **World 26, BEYOND THE GALAXY** (MEASURED · AUGER 2017). Card line: "Auger found the highest-energy cosmic rays come from beyond our galaxy." Field note "COSMIC RAYS FROM OUTSIDE": In 2017 Auger reported that cosmic rays above 8 EeV (8 × 10¹⁸ eV) arrive unevenly from the sky, which points to sources outside the Milky Way. At 8 EeV the wavelength is 1.6 × 10⁻²⁵ m, almost your size. Source: AUGER, SCIENCE, 2017.
  - **World 27, THE SKY LIMIT** (MEASURED · GZK LIMIT). Card line: "Few cosmic rays pass 5 × 10¹⁹ eV. Big Bang microwaves slow them." Field note "AN ENERGY CEILING IN SPACE": Cosmic rays lose energy hitting the microwave glow left by the Big Bang. This should cap them near 5 × 10¹⁹ eV (the GZK limit), and experiments do see the flux drop there. Whether GZK is the cause is still debated. That energy has a wavelength of 2.5 × 10⁻²⁶ m, about 1.5 of you. Source: WIKIPEDIA: GZK LIMIT.
  - **World 28, OH-MY-GOD** (MEASURED · FLY'S EYE 1991). Card line: "A 1991 particle carried the energy of a 100 km/h baseball." Field note "ONE PARTICLE, A BASEBALL'S ENERGY": The Oh-My-God particle (1991) had about 3.2 × 10²⁰ eV, around 51 joules, the energy of a 140 g baseball at about 28 m/s (100 km/h). Its wavelength is 3.9 × 10⁻²⁷ m (h × c ÷ energy), over two of you. Source: WIKIPEDIA: OH-MY-GOD PARTICLE.
  - **World 29, ROUND NEUTRON** (LIMIT · PSI 2020). Card line: "A neutron is lopsided by no more than about your own height." Field note "HOW ROUND IS A NEUTRON?": A neutron could have its positive and negative charge slightly apart (an electric dipole moment). In 2020 the nEDM experiment at PSI, Switzerland, found less than 1.8 × 10⁻²⁶ e·cm. Divide by the charge e: 1.8 × 10⁻²⁸ m, about one of you. Source: WIKIPEDIA: NEUTRON ELECTRIC DIPOLE MOMENT.
  - **World 30, THALLIUM BEAM** (LIMIT · BERKELEY 2002). Card line: "The electron's charge is lopsided by less than your height." Field note "A ROUND ELECTRON, 2002": In 2002 a Berkeley team sent a beam of thallium atoms between charged plates. A lopsided electron would shift the atoms' energy, and they saw no shift. Limit: under 1.6 × 10⁻²⁷ e·cm, or 1.6 × 10⁻²⁹ m, about one of you. Source: REGAN ET AL., PHYS. REV. LETT., 2002.
  - **World 31, COLD MOLECULES** (LIMIT · ACME 2014). Card line: "A cold molecule beam shows an electron lopsided by under half of you." Field note "A ROUNDER ELECTRON, 2014": ACME sent pulses of very cold thorium monoxide (ThO) molecules through lasers. The molecule's huge internal electric field would twist a lopsided electron's spin. Result: under 8.7 × 10⁻²⁹ e·cm, or 8.7 × 10⁻³¹ m, about half of you. Source: ACME, SCIENCE, 2014.
  - **World 32, INSIDE A MOLECULE** (LIMIT · ACME 2018). Card line: "ACME's second try is eight times sharper. Still no lopsidedness." Field note "EIGHT TIMES ROUNDER, 2018": In 2018 ACME repeated the test with better control. Result: under 1.1 × 10⁻²⁹ e·cm, or 1.1 × 10⁻³¹ m, about two-thirds of you. That is eight times tighter than in 2014. Source: ACME, NATURE, 2018 · PHYSICS WORLD.
  - **World 33, ION RING** (LIMIT · JILA 2023). Card line: "Trapped molecule ions tighten the limit to 2.4 times your size." Field note "TRAPPED IONS, 2023": In 2023 JILA (Colorado) trapped hafnium fluoride (HfF⁺) ions and measured the electron's spin for a long time. Result: under 4.1 × 10⁻³⁰ e·cm (90% confidence), or 4.1 × 10⁻³² m, about 2.4 of you. Source: JILA · ROUSSY ET AL., SCIENCE, 2023.
  - **World 34, LIGHT'S RACE** (LIMIT · H.E.S.S. 2008). Card line: "Different colours of light race from a far-off flare and arrive together." Field note "IS SPACE GRAINY?": In 2006 H.E.S.S. in Namibia watched a flare from a galaxy over a billion light-years away. Light of different energies arrived within minutes. If space were grainy, higher-energy light would lag. No lag means any grain is shorter than 2.7 × 10⁻³⁴ m (for a lag growing in step with energy), 0.16 of you. Source: H.E.S.S., PHYS. REV. LETT. 101, 170402 (2008).
  - **World 35, DEAD HEAT** (LIMIT · FERMI 2009). Card line: "A 31 GeV photon crossed 7 billion light-years and arrived within a second." Field note "A TIGHTER LIMIT ON GRAININESS": In 2009 NASA's Fermi telescope caught the burst GRB 090510 and a 31 GeV photon from it, 0.83 s after the burst began. Same test, tighter result: any grain is shorter than 1.4 × 10⁻³⁵ m (for a lag growing in step with energy), a twelfth of you. Source: FERMI LAT AND GBM, NATURE, 2009.
  - **World 36, PLANCK FOAM** (THEORY · PLANCK LENGTH). Card line: "About the Planck length, where physicists expect today's theories to stop working." Field note "THE END OF THE SCALE?": The Planck length is 1.616255 × 10⁻³⁵ m. A proton is about 10²⁰ Planck lengths across. Nobody knows if anything shorter even makes sense. Source: CODATA 2022, VIA WIKIPEDIA: PLANCK UNITS.
- **Honest caveats to keep in the build.** (1) The LHC's 13.6 TeV is the total collision energy. The matching wavelength is a rule of thumb for how finely it can look, not one beam particle's wavelength. (2) Whether the GZK limit causes the drop in the highest-energy cosmic rays is still debated (the page says so). (3) KM3NeT's neutrino energy of about 220 PeV has a wide error range. (4) The Fermi and H.E.S.S. limits only apply to a model where the lag grows in step with energy. A different model gives a different limit. (5) The electric dipole limits turn into a length by assuming the limit is one electron charge displaced. That is the usual way to picture it, not a measured distance. (6) Weak-force range: sources vary between 10⁻¹⁸ and 10⁻¹⁶ m; the card uses the calculation and says so. (7) The Auger 2017 result is described as an uneven sky pattern pointing to sources outside the galaxy; the page confirms an anisotropy above 8 × 10¹⁸ eV and an extragalactic origin.
- **What was checked.** Fetched and read this session: GRB 090510 abstract (31 GeV, limit 1.2 Planck energy, redshift 0.903), JILA page (HfF⁺ ions in an ion trap), Physics World (ACME uses ThO, result under 1.1 × 10⁻²⁹ e·cm), Wikipedia on the Oh-My-God particle (140 g baseball at about 28 m/s, 100 km/h), GZK limit (5 × 10¹⁹ eV, HiRes drop, Auger confirmed the drop, cause debated), KM3NeT (13 February 2023, 220 PeV, 3,500 m deep off Sicily), Pierre Auger (3,000 km², 1,600 tanks, anisotropy above 8 × 10¹⁸ eV), LHAASO (a dozen sources, photons up to 1.4 PeV), neutron EDM (under 1.8 × 10⁻²⁶ e·cm, PSI 2020), deep inelastic scattering (SLAC 1968, internal structure of protons). Earlier in the session: JILA 4.1 × 10⁻³⁰ e·cm on arXiv 2212.11841, H.E.S.S. 7.2 × 10¹⁷ GeV on arXiv 0810.3475, the ACME and thallium values, and the electron radius limit. Not re-opened: the SLAC beam energy range (the card only says electrons "in this range"), journal page numbers (left out on purpose). All art is a draft and has not been seen on a phone.
- **Facts that would be displaced.** The 247-zeptosecond fact (world 20), the ronto prefix (world 28), the quecto prefix and "the last named size" (world 31) lose their world. Proposal: keep them in the field guide as extra facts at the same size, since the world 31 to 32 jump to powers of ten still needs explaining. The player has not decided this.
- **What changes in the build if approved.** 18 new scenes (every world from 17 to 35 except 19) replace the old art; worlds 19 and 36 keep their art. All 14 invented worlds disappear, so the "INVENTED WORLD" flag and the unit notes are no longer needed, and the "Worlds without a fact are invented" bullet above would become "every world has a sourced real item". The scenes keep the rule that the key subject stays out of the HUD strip: the build darkens the strip under the HUD (rows 14 to 34 of the 320 × 180 scene) to 55%, fading out by row 42.

### Request of 28 October 2026 (afternoon): fewer worlds, only real ones, Planck Foam stays (settled at 16:07 SGT: 21 worlds, see section 1)

The player said 36 worlds is too many. They want to keep only the significant ones, remove every imaginary world, and keep Planck Foam at the very end. They asked where the real-world replacements were, and asked for all 36 as real worlds with an image for each, so they can choose which worlds to remove. **They made the call at 16:07 SGT: keep 1 to 20 and Planck Foam (21 worlds), fix 13, cut 21 to 35.**

What went wrong: the replacements for worlds 17 to 36 were sent earlier only as five separate contact sheets, and the later 36-world sheets (before/after atlas) still showed the old invented art, so the player never saw one set of 36 real worlds.

What was made: one image per world (all 36) plus a one-page overview, in the minimal UI style. Worlds 1 to 16 keep their v4 art. Worlds 17 to 35 (except 19) use the new real-world scenes from the proposal above. World 19 (Ripple Sea) and world 36 (Planck Foam) keep their v4 art. Each image shows: the world number, name, a one-line description, and a line "REAL · KIND · SOURCE".
- Kinds: SEEN (people have looked at it directly: naked eye, light or electron microscope, tunnelling microscope), MEASURED (a real size, beam or event at this scale), LIMIT (an experiment found nothing bigger than this), THEORY (a calculated scale nobody has reached; only Planck Foam).
- Worlds 1 to 16: 1 to 5 SEEN naked eye; 6 and 7 SEEN light microscope; 8 and 9 SEEN electron microscope; 10 MEASURED X-ray diffraction; 11 SEEN tunnelling microscope; 12 MEASURED Bohr radius; 13 MEASURED X-ray wavelengths; 14 MEASURED Rutherford 1911; 15 MEASURED nuclear sizes; 16 MEASURED proton radius. (These labels were written in this pass from the earlier sourced facts; they were not re-checked against new sources.)
- Worlds 17 to 36: names, descriptions, kinds and sources exactly as in the table above.
- The honest limit still applies: nothing below about 10⁻¹⁸ m has been seen, so worlds 19 to 35 are drawings of an instrument, event or limit, not pictures of anything at that size.
- Files: `w36/world_01.png` to `world_36.png`, `w36/worlds_overview.png`, six sheets of six (`worlds_01-06.png` to `worlds_31-36.png`), and `Minitude_36_real_worlds.zip`.
- Final 21-world set (16:07 SGT): `w21/world_01.png` to `world_21.png`, `w21/unexplored.png` (draft), `w21/worlds21_overview.png`, `w21/changed_worlds.png` (world 13, unexplored, 20, 21), and `Minitude_21_worlds.zip`. Rendered with `w21/worlds21.py` and `w21/sheets21.py` (scene for the unexplored stretch is `real/scene_void.py`).
- Displaced facts (247 zeptoseconds, ronto and quecto prefixes) are not needed: fun facts were removed from the UI on 28 October.

### Player feedback, 28 October 2026 (late afternoon): many of the real worlds at the bottom make no sense (assessment given; the player accepted the suggested cut)

The player said worlds such as OH-MY-GOD, THE SKY LIMIT, LIGHT'S RACE and DEAD HEAT read as a real event forced into a place at a tiny size, and asked for an honest assessment of every world, especially the last ones, saying which are genuinely nonsensical. They then accepted my suggested cut (see section 1).

Assessment given (my judgement, not the player's):
- Make sense (an actual thing, length or scale at that size): worlds 1 to 12, 14 to 16, 18 (weak-force reach), 19 (LIGO arm change, a real measured length), 36 (labelled theory).
- Make sense as "how far have we looked" milestones: 17 (SLAC 1968) and 20 (LHC today).
- Weak: 13 (X-RAY SEA: X-ray wavelengths run about 10 pm to 10 nm, so at 1.7 pm the light is gamma rays and the waves are longer than you; the name and the line "waves shorter than you are tall" do not match the size), 23 (a limit, not a thing), 29 (a limit, abstract).
- Nonsensical: 21, 22, 24, 26, 27, 28 (the "size" is only the wavelength of one particle or photon, nobody can be at a place of that size, and the pictures cannot show it; 28's headline is about energy, not size; 27's cause is still debated); 25 (the picture is a county-wide detector while the player is 10⁻²⁴ m); 30 to 33 (the same electron-roundness test four times, in 2002, 2014, 2018, 2023, and 29 is a fifth on the neutron); 34 and 35 (the same "is space grainy" test twice, valid for one model only).
- Root cause: nothing is known to exist at sizes below about 10⁻¹⁸ m, so every world there is a stand-in: a wavelength, a limit, or a unit conversion (the electric-dipole worlds turn e·cm into metres by convention, not by measuring a distance).
- Game-rule fact: world n starts at 20 × (n − 1) points, so world 21 starts at 400 of 700 points. Few runs reach it.
- Design question raised when worlds are cut (my proposal is now item 4 in section 1; the player has not confirmed it): the player's size is continuous in points (1.7 m ÷ 10^(points ÷ 20)), so the size passes through every size whether or not a world exists. Proposal: one empty "unexplored" stretch between the last kept world and Planck Foam, with only the size counter and scale bar. Not decided.
- My suggested cut: keep 1 to 20 and 36 (rename or fix 13), remove 21 to 35. **The player approved this at 16:07 SGT.**

### Request of 28 October 2026 (evening): two new walkthrough videos and a special world 21 finale (answers given by the player at 16:13 to 16:20 SGT)

The player asked for (1) a much more satisfying and special shrinking animation into world 21, because only a perfect run (seven Mythic answers) reaches it, and (2) two new walkthrough videos covering the stages from world 1. They asked to be asked about doubts first. Answers (all the recommended options):
- **UI:** the minimal UI (the clean look from the before/after sheets). It is still not approved by the player, so the videos are the first time they see it in motion.
- **The two videos:** (A) a perfect run from world 1: seven Mythic answers, every world from 1 to 21, ending in Planck Foam; (B) a typical mixed run that ends partway (the same answers as chapter 1 of v4: Cheddar, Takahē, Katamari Damacy, Marimba, Ytterbium, Toyota, Eileithyia = 320 points, ending in world 17).
- **The Unexplored stretch during the perfect run (landings at 400, 500, 600 points):** "dark that builds". The dark gets deeper and a faint glow of Planck Foam grows on the horizon, so each landing feels closer to the end. This also means the unexplored stretch is accepted in principle.
- **World 21 finale feel:** "quiet build, then burst". Time slows and the sound drops away. One point of light grows, then it opens into the foam with a big light and a music swell.

### Walkthrough videos v5 (28 October 2026): what was built for the request above

Two videos, both from world 1, in the minimal UI, with the 21 named worlds. v4 files stay as they were. Delivered files: `Minitude_v5_perfect_run_share.mp4` (61 MB) and `Minitude_v5_typical_run_share.mp4` (38 MB), 1280x720, 60 fps; full-quality masters are `Minitude_v5_perfect_run.mp4` and `Minitude_v5_typical_run.mp4` in `scratchpad/v21/`. Engine copy: `scratchpad/v21/` (`chain21.py` zoom chain, `void.py` unexplored art, `minui21.py` interface, `fin21.py` finale, `audio21.py` sound, `roster21.json` names and honesty labels, `render21.py`, `run21.sh`).
- **Video A, perfect run (3 min 12 s):** answers Époisses, Kakapo, Mother 3, Waterphone, Praseodymium, Koenigsegg, Eileithyia, all Mythic. Landings at worlds 6, 11, 16, then Unexplored (400 pts, with a title card), Unexplored (500, no card), Unexplored (600, no card), then Planck Foam (700, the finale).
- **Video B, typical run (2 min 35 s):** the v4 chapter 1 answers (320 points). Landings in worlds 1, 5, 7, 8, 11, 12 and 17 (First Quarks), then the report ("170 am, smaller than a proton, 320 / 700 points, world 17 of 21").
- **Interface:** minimal UI only. No field notes, no fun facts, no boxes. World title cards say "WORLD n / 21", the world name, one line, and one small honesty line (SEEN, MEASURED, THEORY, or NO DATA) in a colour by kind. A world that is passed in the middle of a dive gets a text-only caption (number and name, about one second). The rail on the right shows the Unexplored stretch (20 to 35 decades) as a dotted line. The world number is dropped inside the Unexplored stretch.
- **Title card rule:** one card per displayed world. Slots 20 to 34 are one displayed world (Unexplored): the card shows only when you first enter it ("BETWEEN WORLD 20 AND WORLD 21"). Later landings inside it have no card, just the result and the dark.
- **Unexplored art:** 15 variants of one empty dark world (one per size slot, 20 to 34). The dark deepens, the stars thin out, a violet glow of Planck Foam grows at the horizon, dim foam bubbles and the cyan floor grid appear in the last few variants. The art is smooth and banded, because dithered art becomes a loud checkerboard when the dive magnifies it.
- **World 21 finale (13.4 s dive, then a 9 s card):** the Mythic celebration and the charge-up are as normal. Then (seconds after the dive starts): 0 to 1.4 fast launch; 1.4 to 4 the camera still moves fast through the dark, the interface dims to 28 per cent, the sound drains away; 3 to 12.4 one point of light appears at the horizon (where the Planck Foam core will be) and grows exponentially as the camera slows to a crawl, nine heartbeats, particles fall into it, thin rings close on it; 12 to 12.45 a held breath (the light shrinks, one pure tone); 12.4 to 13.4 the window of Planck Foam opens with a bloom, rays and zoom blur; at the landing a short white flash, rings in five colours, two particle bursts, 150 pieces of confetti, 70 twinkles, a hop and a strong shake. The card (gold) shows "PERFECT RUN · 7 OF 7 MYTHIC", "WORLD 21 / 21", PLANCK FOAM, its one line, "THEORY · PLANCK LENGTH". The report is gold-tagged: "PERFECT RUN, 1.7 × 10⁻³⁵ m, about one Planck length, 700 / 700 points, world 21 of 21".
- **Finale sound:** the normal mix is ducked to 3 per cent from 0.5 s to 2.4 s after the dive starts. The finale has its own stems (not compressed): a falling tone, a sub bed, heartbeats, a slowly climbing tone, sparse high bells, a held breath, a riser, then a D-major pad swell, a sub impact, a bell arpeggio and a sparkle cascade at the landing, then a slow bell line under the card. Loudness (RMS): about 0.05 in the drift, about 0.38 at the landing (a normal Mythic reveal is 0.20).
- **Corrections found while building:** worlds 3 and 4 are named THE PILE and YARN ROPES in the video; the old v4 one-liners for them were stale (they described a mug and a beach) and are replaced by "Each carpet tuft is a tower, and a crumb lies like a fallen log." and "Strands of yarn rise as thick twisted ropes. A dust ball rolls past." World 13 is GAMMA SEA (not X-Ray Sea).
- **Still open:** the minimal UI, the "WORLD n / 21" numbering and the text-only gate captions have not been approved by the player (the videos are the first time they see them in motion). The lobby, route, share and how-to screens have not been redrawn in the minimal style.

### Scale bars and fun facts (third design pass, 26 October 2026, not yet approved)

**Superseded on 28 October 2026:** the player asked for the fun-facts component to be removed entirely from the UI (see the next section). Everything below about fun facts, the field guide and the fact-check page is kept as a record only. The scale-bar and 36-world parts still stand.

The player asked for a plain scale bar instead of a ruler, and for far more worlds. This pass has a bar on every scene, 36 worlds, and a sourced fun fact in 22 of them.

- **Screens.** 9 all 36 worlds (overview); 10 to 12 worlds 1 to 12, 13 to 24 and 25 to 36 (one card each); 13 field guide (23 facts, 12 per page); 14 lobby race; 15 today's route; 16 Mythic moment; 17 how to play; 18 share cards; 19 fact check. The earlier ruler, zoom-the-ruler and ladder screens were removed.
- **Field guide.** Each fun fact belongs to a size and unlocks when the player shrinks to it. Locked facts show as silhouettes.
- **Fact rule.** Only facts with a named source go into the game. Every number was checked against a source page, and arithmetic was redone by hand. Original papers were mostly not opened. The canvas page "19 · Fact check" lists every claim, its source, how it was checked and how strong it is (primary source, two sources, one source, maths, or hedged).
- **Facts used** (source in brackets): Robert Wadlow 2.72 m (Guinness World Records); Miracle Milly, a Chihuahua, 9.65 cm (3.8 in) tall in 2013, the smallest dog by height then (Wikipedia, citing Guinness); US dime 17.91 mm wide and 1.35 mm thick (US Mint); sand grains 0.0625 to 2 mm by the geologists' definition (Wikipedia); human egg cell about 0.1 mm (NCBI Bookshelf); cloud droplet 20 µm, raindrop 2 mm, about a million droplets per raindrop (LibreTexts, Wikipedia); E. coli about 2.0 µm long and 0.25 to 1.0 µm wide (Wikipedia); Abbe's 0.2 µm limit and the 2014 Chemistry Nobel (Nobel Prize press release); bacterial ribosome around 20 nm (Wikipedia); DNA about 2 nm wide, about 2 m per human cell (Wikipedia, Science Focus); typical atom about 100 pm (Wikipedia); IBM's 35 xenon atoms in 1989 (IBM, Wikipedia); Bohr radius 52.9 pm (Wikipedia, CODATA); X-ray wavelengths roughly 10 nm to 10 pm (Wikipedia); nucleus 1.7 fm (hydrogen) to 11.7 fm (uranium), 27,000 to 60,000 times narrower than its atom (Wikipedia); quarks are about 1% of a proton's mass (Physics, APS, 2018; Wikipedia); proton charge radius about 0.84 fm (CODATA 2022 via Wikipedia); LIGO's first wave, strain 1.0 × 10⁻²¹ over 4 km arms, about 4 × 10⁻¹⁸ m, a little over two explorers (LIGO paper abstract, HyperPhysics; maths by me); a photon crossing a hydrogen molecule in about 247 zeptoseconds (Phys.org, Goethe University); electron has no known inner structure (Wikipedia); four new metric prefixes ronna, quetta, ronto, quecto adopted on 18 November 2022 (BIPM); Planck length 1.616255 × 10⁻³⁵ m (CODATA via Wikipedia).
- **Claims removed or softened.** "Nothing smaller than about 10⁻¹⁸ m has been measured" and "the smallest length that means anything" were removed because they overstated what is known. Caesium's atom size was dropped because the source page gives two different figures. "Shortest time ever measured" was not claimed for the zeptosecond result. The weak force's range was dropped because sources disagree (Wikipedia gives 10⁻¹⁷ to 10⁻¹⁶ m; ħ ÷ (W mass × c) gives about 2.5 × 10⁻¹⁸ m). A "fraction of a proton" comparison for LIGO was dropped because only one page made it. The red blood cell and SARS-CoV-2 facts were dropped from the game, not found wrong. "Quecto is the smallest prefix" is marked as my inference.
- **Still placeholders.** Player names, answers, tiers, scores and lobby codes on the race, route, Mythic and share screens are invented for the mockups.
- **Not checked.** These layouts and the new art were written but not rendered or looked at in the canvas. Expect spacing problems.

### Request of 28 October 2026: remove fun facts entirely, and make the whole UI minimal (designs only, pending the player's critique)

The player said the UI looks cluttered and messy, asked for **the fun-facts component to be removed entirely from the UI**, and asked for a minimal look like Krillion.io. They asked for before/after designs to critique, not a walkthrough video.

**Decided by the player (binding):**
- No fun facts, field notes, "FIELD NOTE" panels, field guide, fact-check page, "INVENTED WORLD · ART ONLY" labels or the 8-second field note after the last landing. This replaces the "Scale bars and fun facts" notes above wherever they describe UI. The sourced-facts work is kept in the record only as research; none of it appears in the game.
- Direction: minimal, Krillion-style. Krillion.io could not be opened from the build environment (blocked), so the direction was taken from the player's description, not from looking at the site. Ask the player for screenshots of the parts they like.

**Proposed minimal UI (designs delivered as 9 before/after sheets of all 18 screen states of a run, plus 2 sheets showing all 36 worlds; NOT yet approved, NOT yet in the video; the video v4 is still the spec until the player approves):**
- Rules: no boxes, panels or chips; one text style per level; colour is used only for the rarity tier; every text sits on a soft fade, not on a card; the scene stays the hero.
- Top: seven round dots only (tier colour once answered, white ring on the current one). Top right: the player's size, large, with the world number and name very small underneath. Removed: MINITUDE wordmark, round counter, score box, the "YOUR SIZE" label.
- Right edge: the depth bar becomes one thin line with a marker and a few tier-coloured ticks. No labels.
- Question (screens 1 to 5): small category above, the question in one line, an answer line under it. A line under the answer turns green when valid; a quiet word (VALID, CHECKING) sits under the line. Timer is a thin line along the bottom. Submit with Enter (no LOCK IN button; a touch-screen submit control still has to be designed).
- Rarity roll: six gems in a row; the active one grows and names itself with its points. No boxed slots.
- Result: gem, one small line "TIER +points", the answer in large type, one short line describing the answer. Removed: tier ladder, size arrow, "SMALLER BY" box, VALID tag, tier chip over the gem for Common and Uncommon. RARE!, EXOTIC!, LEGENDARY! and MYTHIC! title takeovers stay.
- Scale bar: a thin line with end ticks, label to the right of the line. Hidden during the roll, charge-up, dive and title cards.
- Charge-up: the "÷ 10,000" stays; the word SMALLER and all panels go.
- Dive: no bottom SHRINKING strip, no gate pills, no world chip, no explorer tag. The size counts down at the top right and the world name changes under it.
- World title card: "WORLD n / 36", the name, the one-line description (the player may want this dropped too). Tap to skip stays (see the skip rule above).
- Report: one column on a darkened left side: "YOU SHRANK TO", the size, "Smaller than a proton." style line, one small score line, the seven answers with a tier-coloured square and points, SHARE, and the next-dive timer. Removed: both boxed panels, the share preview box, the bottom bar.
- Questions put to the player: is the score gone from the top bar acceptable (it shows only in the result line and the report)? Keep or drop the one-line answer description in the result? Keep or drop the description on the title card? Enter instead of a LOCK IN button? Keep the thin depth line, or remove it?
- Known weaknesses: the smallest text (world label under the size, state words) is only legible at full size; the pixel font draws "2" like "8" at small sizes; the world names and descriptions are still the v4 ones, so the real-world replacement proposal above still decides them (its field-note facts are no longer needed, only the names and one-line descriptions).
- Not covered by these designs (not in the video): lobby race, daily route, share cards, how-to-play, and the Mythic moment screen from the third design pass. They need the same treatment once the player approves the direction.

## 7. Rarity scoring principles

### Meaning of rarity

Rarity means estimated unfamiliarity or obscurity for a defined audience. It does not mean the percentage of today's players who submitted that answer.

The intended audience and reference languages still need a default definition. English-language casual players are a reasonable starting assumption, not a finalized demographic requirement.

### Separate three questions

1. Identity: what entity did the player mean?
2. Validity: does that entity satisfy this specific question?
3. Familiarity: how familiar is that entity under the scoring policy?

An obscure-sounding invented answer is invalid. A valid obscure answer missing from the initial list is not automatically invalid.

### Score construction

- Use suitable familiarity evidence where available, with LLM assistance and a consistent rubric.
- Use broad anchored tiers initially instead of pretending an unsupported precise number measures real-world rarity.
- Define reference examples for each tier. The tier-to-points mapping is fixed (below).
- Word frequency alone is insufficient for many proper names and ambiguous terms. Normalize aliases to the intended entity and consider the relevant context.
- Source verification establishes validity; it does not automatically establish familiarity.
- Do not equate an LLM's stated confidence with calibrated factual accuracy.
- Ranking a generated candidate list is insufficient if the same answer changes score whenever different candidates are generated.

### Tiers and points

The number of tiers and the points are confirmed. Only the name Common is confirmed; the other five names are proposals.

| Tier | Points |
| --- | --- |
| Common | 10 |
| Uncommon (proposed name) | 20 |
| Rare (proposed name) | 40 |
| Exotic (proposed name) | 60 |
| Legendary (proposed name) | 80 |
| Mythic (proposed name) | 100 |

A run of seven answers scores between 70 and 700 points. The score-to-size mapping is proposed in section 6.

Store the scoring policy version and relevant model/data versions. Equivalent aliases for the same answer within the same question and policy version should receive the same score.

Caching creates consistency, not correctness. Define a controlled correction policy for mistakes. If a competitive result is corrected, apply the correction consistently to affected players rather than silently changing rules for later players.

## 8. Automated content and answer workflow

The user wants substantially less dependence on a manually written question bank. Automatic generation can occur ahead of play and be reused; it does not need to happen while each player waits.

### A. Prepare a question

1. Select a category and generate a candidate prompt.
2. Generate explicit acceptance rules, ambiguity notes, and an initial candidate answer set.
3. Verify candidates using appropriate structured datasets or retrieved reference sources.
4. Resolve aliases and duplicate entities.
5. Assess whether the prompt has enough verified answers and a useful familiarity spread.
6. Assign initial rarity tiers using the fixed policy and reference anchors.
7. Reject questions that are ambiguous, unsupported, repetitive, or unsuitable for the intended difficulty.
8. Store the approved question, rules, evidence, answer records, and policy version.

A generated answer list is a seed set. It need not enumerate every possible correct answer.

Do not accept a source URL merely because the model produced it. Retrieve and inspect the source material or validate against an imported dataset. Keep supporting evidence for decisions that depend on external facts.

### B. Evaluate a submitted answer

1. Normalize spelling and formatting conservatively.
2. Resolve the answer to a known canonical entity or alias where possible.
3. If the entity is already approved for this question/version, use the stored result.
4. Otherwise investigate the answer using the same acceptance rules and external evidence.
5. If verified, assign its tier under the existing scoring policy and store the result.
6. If disproved, return a concise invalid-answer explanation.
7. If verification remains inconclusive, record an unresolved outcome; do not invent certainty or grant automatic maximum rarity.

Prevent concurrent first-time evaluations from producing conflicting stored decisions.

Keep answer keys, sources used internally for evaluation, and model credentials on the server. Do not ship hidden accepted-answer lists to the browser before a round.

### C. Handle delays and uncertainty

- Prefetch upcoming questions while players answer the current one.
- Maintain a reserve of already validated questions.
- Use bounded retries, timeouts, and clear failure states.
- Replace an unsuitable question before showing it.
- For an unresolved submitted answer, use a predefined fair resolution policy.
- Recommended competitive default: if a round cannot be adjudicated fairly, void it consistently for all affected participants. Final policy remains open.

### D. Human involvement

Nobody needs to be online to approve each submission. Manual review can mean reviewing generated content before publication, auditing a sample, or resolving reported disputes later.

Automate routine verification first. Do not promise that all mistakes disappear or that a second LLM agreeing guarantees truth.

## 9. Desired game formats

### Shared Daily Challenge

- All players receive the same questions and order for a given challenge.
- Use the same question rules and scoring versions.
- Generate and validate the shared set before release.
- Recommended default: one official scored attempt, with clearly separate practice.
- Choose one global reset time and display the next reset clearly.
- Reset time, identity requirements, and replay rules remain open.

### Unlimited Solo

- Generate fresh runs on demand or draw from a replenished validated pool.
- Support category-focused and mixed runs when implemented.
- Cache and reuse suitable content and answer decisions.
- Avoid immediate question repetition where practical.
- Different generated runs can vary in difficulty. Do not assume their raw totals support one fair global leaderboard.

### Competitive Multiplayer

- Recommended first multiplayer format: private lobbies with an invite link or code.
- Everyone in the lobby receives the same questions, rules, and scoring policy.
- Use server-authoritative timing and adjudication.
- Stop answer leakage until the relevant participants have submitted or time expires.
- Network delay and model latency must not change the answer window unfairly.
- Define disconnect, reconnect, tie, and unresolved-round behavior.
- Public matchmaking and persistent ranked competition are later possibilities, not confirmed requirements.

The three formats are in scope. Phasing their delivery is acceptable; do not describe a partial release as completion of the entire vision.

## 10. Initial free API trial

### Candidate

Start by checking availability of the Gemini API free tier, with Gemini 3.8 Flash as the first candidate discussed during planning.

Planning-time model identifier: `gemini-3.8-flash`.

On 19 October 2026, Google's official pricing page listed free input and output tokens for this model. Its official model page listed structured outputs and configurable reasoning. Exact quotas depend on the project and must be checked in Google AI Studio.

Built-in Google Search grounding for this model was listed as unavailable on the free API tier. A free implementation therefore needs its own suitable datasets or retrieval process; free model inference alone does not make an entire verification system free.

Model names, access, pricing, and quotas can change. Recheck official documentation before implementation. Do not silently replace an unavailable free option with a paid model.

A comparison candidate discussed was GPT-OSS 120B hosted by Groq, model identifier `openai/gpt-oss-120b`. It is optional, not a requirement to use two providers or two judges.

### Trial status and first milestone

No live API trial has been performed in this conversation. No API key or provider account has been configured for this project.

The first implementation milestone should demonstrate a real free-tier API call and a small end-to-end content/adjudication experiment. Obtain any required key through the normal secure development configuration; never ask the user to paste secrets into a public file or commit them.

Recommended configurable variables:

- `GEMINI_API_KEY`
- `LLM_PROVIDER`
- `LLM_MODEL`

A mock/demo mode can support UI work, but label it clearly and never report it as a successful live integration.

### Evaluation

Use an initially manageable set of roughly 100–200 submissions spanning the approved categories. Include:

- Common valid answers.
- Obscure valid answers.
- Valid answers omitted from the generated seed set.
- Aliases, abbreviations, accents, and plausible misspellings.
- Invalid but convincing names.
- Ambiguous answers and category-boundary cases.
- Repeated equivalent submissions to check consistency.

Measure false rejection, false acceptance, unresolved cases, tier consistency, latency, and token/request usage. Include a small human-checked reference sample to assess accuracy; that development evaluation is separate from requiring a human during every game.

Do not call a model the most accurate for this task without comparative evidence.

### Staying within a free budget

- Keep provider limits and remaining budget visible to the developer.
- Reuse daily questions and stored answer decisions.
- Bound request size, reasoning effort, and output length.
- Rate-limit the application and prevent unbounded generation requests.
- Respect quota errors and retry guidance; use queued work or cached content.
- Do not rotate accounts or keys to evade provider restrictions.
- Stop or degrade gracefully when the free allowance is exhausted.
- Paid API use is outside the current approved budget.
- Hosting, storage, retrieval, and custom domains can have separate costs.

## 11. Technical direction and records

No framework, hosting provider, database, or rendering engine has been selected.

Recommended approach:

- Browser-first, mobile-friendly frontend.
- Server-side generation, source retrieval, adjudication, and score authority.
- Structured model outputs validated by application code.
- Separate provider adapters from gameplay and scoring logic.
- Persistent storage for questions, canonical entities/aliases, evidence, scoring versions, sessions, round results, and multiplayer lobbies.
- Maintain provider response/model metadata needed to investigate errors.
- Treat player answers as untrusted data, not instructions to the model.
- Use conservative input limits and protect API keys on the server.

Inspect any existing repository and its instructions before choosing a stack. If starting from scratch, pick a simple mainstream stack that supports the required real-time lobby behavior. Avoid unnecessary infrastructure in the prototype.

Useful conceptual records:

- Question: category, prompt, acceptance rules, source snapshot/date, version, status.
- Answer decision: question version, canonical entity, aliases, validity, evidence, rarity tier, points, policy version.
- Session: mode, shared question set, player/lobby association, progress, round results, total score.
- Model job: purpose, provider/model version, status, latency, usage, and failure reason.

## 12. Suggested delivery order

1. Free API feasibility experiment, source-assisted answer checking, and a report of observed limitations.
2. Playable Minitude solo expedition with real shrinking progression.
3. Shared Daily Challenge with consistent persisted questions and scoring.
4. Unlimited Solo with the approved category set.
5. Private multiplayer lobbies sharing the same question/evaluation infrastructure.
6. Visual polish, mobile refinement, performance work, and targeted reliability improvements.

Recommended verification priorities: scoring consistency, alias handling, unseen valid answers, unresolved outcomes, monotonic shrink, server-side timers, and reconnect behavior. Use realistic end-to-end checks where those behaviors matter.

## 13. Open decisions

Resolve routine implementation choices with sensible defaults and document them. Ask the user when a choice materially changes scope, cost, or identity.

- Public domain for Minitude. The project name is confirmed; domain selection and availability remain open.
- Art production approach. The player starting as a person (about 1.7 m) is confirmed; the 21-world list is decided (section 1) and the size formula is in section 6. Still open: whether the unexplored stretch is accepted, and the numbering "n / 21".
- Timer duration. The run is fixed at seven prompts.
- Reference audience for rarity, and final names for the five proposed tiers. The tier count and points are confirmed.
- Mixed versus category-specific Daily behavior.
- Typo handling, retries, and unresolved-answer resolution.
- Daily reset time, accounts, guest identity, and attempt enforcement.
- Multiplayer lobby size, host controls, and tie handling.
- Framework, database, deployment, and graphics stack.
- Provider/model selection after the free trial.
- Whether occasional human audits are performed and how reported disputes are handled.

Minitude is the selected project name. Earlier suggestions such as Oddillion and Crumbillion were not selected. Availability of a Minitude domain has not been established.

## 14. Instructions to the implementation agent

Read this context before making product decisions. Use Minitude as the project name. Build the game to match the walkthrough video v4 exactly (see section 1), except for the decisions listed in section 1 under "Decisions made after video v4" (21 worlds, world 13 fix, no fun facts, tap to skip), which the player made later and which win over the video. Where the video and any other note disagree, the video wins, and the player wants to be asked before you change it. Preserve the approved 11 categories, seven prompts per run, six rarity tiers (10, 20, 40, 60, 80, 100), rarity philosophy, SMALL WONDER visual direction, pixel-art style, and three desired formats.

Start with the free API feasibility milestone. Explain any material limitations using observed results. Use real external evidence for factual checks and distinguish measured familiarity from model estimates.

Keep the experience enjoyable and visually coherent while preserving a clear question interface. Produce a functioning game through sensible phases, and state honestly which requirements have been completed.

Do not claim the current document establishes final model accuracy, exhaustive answer coverage, zero running costs at arbitrary scale, or domain availability.

## 15. Reference links

Planning references; recheck time-sensitive provider details before building.

- [Krillion](https://krillion.io/)
- [Scallion](https://scallion.anselmlong.com/) — supplied inspiration; direct inspection was unavailable during planning.
- [Krillion FAQ: answer curation and rarity](https://krillion.io/faq)
- [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Gemini 3.8 Flash model documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash)
- [Groq free-plan and other rate limits](https://console.groq.com/docs/rate-limits)
- [LongTailQA research](https://aclanthology.org/2026.lrec-1.405/) — evidence about long-tail factual recall, ambiguity, and retrieval; not a benchmark of this game's chosen model.


## Scoring redesign (28 October 2026): APPROVED and BUILT in Phase 1 (see "Phase 1 build progress" at the end)
- Why: the void (old 400-699 points) felt too long, and world 21 needed 7 perfect Mythic answers.
- Proposal (player went back to the 440 version after looking at 460): worlds 1-20 unchanged (20 points each). Unexplored = 400-439 (40 points). Planck Foam (world 21) starts at 440 (was 700).
- Unexplored sizes: 15 powers of ten over 40 points = 3 powers per 8 points. Size = 1.7 m / 10^(20 + (p - 400) x 15/40). 408 = 1.7e-23 m, 416 = 1.7e-26 m, 424 = 1.7e-29 m, 432 = 1.7e-32 m, 440 = 1.7e-35 m (Planck length). Void moves 7.5x faster than a normal world (20 points per power).
- Edging hint (kept): a landing in Unexplored right after another landing in Unexplored (2nd in a row) shows a small line "Something is getting closer." (horizon glow pulses once, low pulse sound, no card). 3rd+ in a row: stronger line. 1st landing keeps the Unexplored card. If the run ends in Unexplored, result screen says "Planck Foam was N points away." "Same region" = the whole Unexplored stretch.
- Build impact: no new art (15 void variants stay, stretched over 40 points). New parts: one text line, one glow pulse, one sound. Videos not re-rendered.
- DECIDED by player: the finale plays the moment the total crosses 440 (not after the last answer). Crossing is possible from answer 5 on, so at most 2 more answers follow it.
- After the finale the player stays in world 21 with the same Planck Foam background; points keep counting. Size readout holds at "< 1.7e-35 m" with "Our physics stops here." Player asked for a short text like "you are shrinking to the point where it makes no sense anymore" (wording written by me, awaiting approval):
  - 1st answer after crossing: ONE of 3 main lines, picked at random each run (player's choice, shuffled; no repeat of the line shown last time): "The numbers stop making sense here." / "Even the word \"small\" has stopped working." / "You have gone past the smallest size we can talk about." Small line always: "Our physics stops here. Keep going."
  - 2nd answer after crossing: "There is nothing left to measure you with." / "You are still shrinking." (APPROVED by player, fixed)
  - Result screen extra line: "N points past the edge" where N = total - 440 (e.g. 560 -> 120, 700 -> 260).
- Wording of the hint lines and post-finale lines is final as listed above and is built (`packages/core/src/hints.ts`).

## Build kickoff (28 October 2026, 20:40 SGT)
- Player said "Yes, let's get started on building it" and wants the codebase generated HERE, zipped, then continued by the player in Claude Code. Each zip is the WHOLE repo so far (cumulative), the player only unzips the newest. No git history needed in the zip.
- APPROVED by player: the v5 UI (minimal UI, "WORLD n / 21" numbering, text-only dive captions). Scoring redesign (440, Unexplored 400-439, edging hints, post-finale lines) is also the build spec. Finale plays the moment total crosses 440.
- Plan: Phase 1 = playable solo game (exact v5 look, timings, sound), seed question bank (placeholders, unverified), mock answer checker, small Node API. Stack: Vite + TypeScript + canvas; Hono API; SQLite now, Postgres later. Gemini is NOT reachable from the cloud container (tested), so no live LLM call is verified here; provide an adapter + trial script for the player to run with their own key.
- Later phases: LLM adjudication + DB, Daily Challenge, Unlimited, private lobbies.

## Phase 1 build progress (28 October 2026, delivered as a zip of the whole repo)
Built: a playable solo game in a Vite + TypeScript monorepo (`packages/core`, `packages/web`, `packages/server`). It follows this document: 7 prompts, 6 tiers (10/20/40/60/80/100), 21 worlds, 440-point Planck Foam, Unexplored 400-439, edging hints, post-finale lines, "N points past the edge", v5 interface, 30 s timer, tap-to-skip world cards, no fun facts.
- Game: WebGL2 world zoom + Canvas 2D, every effect of the v5 video ported from the Python pipeline (kept in `tools/art-source`), live WebAudio sound ported from `audio21.py`.
- Server: Hono API with a MOCK answer checker over a small PLACEHOLDER seed bank (11 questions), plus a Gemini adapter that has NEVER been run (the build sandbox could not reach the API). In-memory run store.
- Not built yet: LLM checker verified with a real key, the real 22-question verified bank, database, server-side timer, Daily Challenge, Unlimited Solo, private lobbies, accounts, mobile portrait layout, reduce-flash setting, screen-reader text.
- Nobody has listened to the sound yet. Loudness was matched numerically to the v5 audio track.
- Choices made without asking (all listed in `docs/DECISIONS.md`): wrong/unknown answers do not use up the question; a time-out scores 0 and does not shrink; the title waits for PLAY; "SOLO RUN" replaces "DAILY"; mute button; in-memory store instead of SQLite.
- Where things stand and what to do next: `docs/STATUS.md` and `CLAUDE.md` in the repo.

## Phase 2 build progress (29 October 2026, delivered as a zip of the whole repo)
Player decisions that shaped it: Gemini (free tier) generates the questions and judges and scores rarity of answers, with some auto-correction; the player does not want a monthly database cost, so SQLite first (one file; Neon's free Postgres is the later option). The player keeps the API key on their own machine; the build sandbox cannot reach Gemini.
Built: SQLite database (questions, answers with the tier on the canonical answer, spellings, runs, attempts, model-call log, corrections); answer checker pipeline (stored ruling, else ask the model once and store its decision; typos and other names map to the known answer and its tier; low-confidence answers are never counted or stored); model budget guard (default 10/minute, 200/day); server-side question clock; question generator (propose, answer list, audit; saves DRAFTS; a person approves) with review and backup commands (`npm run cli -- help`); live trial script for the player's key.
NOT verified: any real Gemini call (all AI code ran only against a scripted fake model), the default model name, the quality of the model's rarity judgements, the generated questions. Rarity is the model's own judgement against example answers (no web evidence yet). Seed bank is still the 11 placeholder questions.
Still to build: Daily Challenge (needs prompts revealed one at a time), Unlimited Solo, private lobbies, accounts/guest identity, Postgres if needed, mobile layout, reduce-flash setting, screen-reader text.
Details: `docs/SERVER.md`, `docs/STATUS.md`, `docs/DECISIONS.md` (Phase 2 choices 21 to 35).

## Phase 3 build progress (29 October 2026, delivered as a zip of the whole repo)
Player decisions that shaped it: the Daily resets at midnight UTC (08:00 Singapore); guests only, tracked by the browser, no sign-up; mixed categories; hosting must be long-term, charged by usage and cheap, and the player asked whether moving host later is easy (yes: one container, one database file) and then chose Fly.io.
Built: Daily Challenge. Same seven questions for everyone each UTC day, chosen once and stored (least recently used first, at most one per category), numbered DAILY #N. One attempt per guest (random id kept in the browser); closing or reloading the page ends the run (the rest scores 0); prompts are sent one at a time when each question starts, so they cannot be read ahead; anonymous standings (players, rank, best; "beat N%" only from 10 players); streak; share text "MINITUDE DAILY #N". Title has PLAY DAILY and SOLO RUN. Limit of 10 daily runs per network per day (hashed, day-bound). Server: static files with cache headers and gzip, security headers, hourly job (sets for today and tomorrow, daily database copy, newest 7 kept), clean shutdown. `Dockerfile`, `fly.toml` and `docs/DEPLOY.md` for Fly.io (one machine, Singapore, 1 GB volume, about $3 to $4 a month while small).
NOT verified: the container image was never built and nothing was deployed (no Docker or Fly account in the build environment; the steps were run by hand instead); the `fly ssh` route for putting questions on the volume; any real Gemini call. Guests can replay by clearing browser storage (accepted). No privacy note yet.
Still to build: Unlimited Solo, private lobbies, accounts if ever wanted, Postgres if more than one server, mobile layout, reduce-flash setting, screen-reader text.
Details: `docs/DEPLOY.md`, `docs/SERVER.md` (The Daily Challenge), `docs/DECISIONS.md` (Phase 3 choices 36 to 50).
