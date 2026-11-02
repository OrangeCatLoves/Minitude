# Art source (reference only)

The pixel art in the game was drawn by Python scripts in an earlier design session, then exported to PNGs.
**The exported PNGs are what the game uses** (`packages/web/public/assets`). You do not need anything in this folder to run or build the game.

It is here so the art can be changed later and so the engine the browser game was ported from can be read side by side.

| Folder | What it is |
| --- | --- |
| `art/` | Original art helpers (`art.py` draws the explorer and the first scenes; `art2-4.py` the later worlds). |
| `gen/`, `real/` | Scene generators for worlds 1-20, the Unexplored stretch and Planck Foam; `real/render_all.py` renders them. |
| `engine-prototype/` | The Python "design tool" that produced the v5 videos: `tl3.py` (timeline), `mini3.py` / `minui21.py` (frame composition and interface), `tfx3.py` (rarity effects), `fin21.py` (the Planck Foam finale), `audio21.py` (sound). `packages/web/src` is a line-by-line port of these. |
| `reference-stills/` | A few frames from the v5 video, for comparing the browser version. |
| `worldtable.md` | The 21 worlds, their sizes and what each shows. |

Caveats:

- These scripts use absolute paths from the machine they were written on and import each other loosely. They are **not runnable as they are**.
  Expect to fix paths (`SP = ...` near the top of most files) before running anything.
- `tools/export_assets.py` is the script that copied the finished pictures out of this pipeline into the web app.
- The fonts (Pixelify Sans and Silkscreen, both SIL Open Font License) are in `packages/web/public/fonts`.
