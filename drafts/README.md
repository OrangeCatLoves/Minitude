# drafts/

Every draft folder lives here. A draft is something the owner reviews (pictures, a review page, notes) **before** anything is built into the game. Nothing in `packages/` imports from this folder, the Docker build ignores it (`.dockerignore`), and a new draft gets its own folder `drafts/draft-<topic>/` with a `README.md` that says what it is, how to look at it and what it would take to build.

| Folder | What it is | State |
| --- | --- | --- |
| `draft-more-worlds/` | Twenty candidate worlds 21 to 30 (two per world, drawn by code, each moving a little, each tied to a real measurement, limit or theory) for stretching the worlds to 600 points, the Unexplored stretch to 600–700 and Planck Foam to 700. Open `index.html`; the README has the arithmetic (10 new worlds, not 8) and what it would take. | **set aside by the owner on 18 Nov 2026** (he chose to stretch the current 20 worlds over 0 to 600 points instead of adding worlds); kept for reference |
| `draft-achievements/` | Banner designs (the owner chose the slim bar), 15 icons in four frames, and the cabinet with an Achievements tab, for achievements (a first of each rarity, then a ladder of how many gems are found). Open `index.html` and `icons.html`. | **BUILT into the game on 19 Nov 2026** (the owner chose the trophy for the last one); `more.html` (26 more) approved in full and BUILT on 22 Nov 2026; kept for the designs |
| `draft-world-motion/` | The "living worlds": three movement designs for each world picture, the review page and the tools that carried the chosen ones into `packages/web/src/life/`. `tools/golden.cjs` takes the fingerprints the game's test compares. | decided and LIVE (16 Nov 2026) |
| `draft-singularity-gems/` | 62 designs for the hidden gem, the sprites, the review sheets, the gem-picking tools and a walkthrough video (the video is not in git). | decided and LIVE (14 Nov 2026; the rainbow Crescent) |
| `draft-favicon/` | Six drafts of the tab icon. | decided and LIVE (16 Nov 2026; the pixel M over the scale bar) |
| `sound-lab/` | Sound experiments. 212 MB, **not in git** (ignored). | closed on 5 Nov 2026, unused |

Running a script from a draft: use the folder itself as the working folder (`cd drafts/draft-world-motion/tools`). A draft script reaches the repo with **three** `..` from its `tools/` folder (`require('../../../tools/browser-test/node_modules/playwright')`, `path.join(__dirname, '..', '..', '..', 'packages', ...)`); they were rewritten when the folders moved here on 18 Nov 2026 and the world-motion golden file was regenerated identical to check it. Scripts that read the answer lists read `C:\Users\weibi\minitude\list-build\` (a folder next to the repo, not in git).

Keep out of git (see `.gitignore`): `sound-lab/` and `draft-singularity-gems/video/`.
