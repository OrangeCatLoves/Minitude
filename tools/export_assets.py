"""Export the pixel art and fonts used by the game from the original Python art pipeline.

This script was run once in the session that built Phase 1. It needs the art pipeline modules (art.py, tfx3.py, mini.py ...),
which are archived in tools/art-source/ for reference but are NOT runnable from this repo as they are (they use absolute paths).
The outputs it wrote are committed under packages/web/public/assets, so you do not need to run it again unless the art changes.

    MINITUDE_SCRATCH=/path/to/scratchpad python3 tools/export_assets.py
"""
import json, os, shutil, sys

SP = os.environ.get('MINITUDE_SCRATCH', '/tmp/claude-0/-home-claude/3fd5d84e-d272-5730-bf2c-7b023869af54/scratchpad')
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.path.join(REPO, 'packages/web/public/assets')
FONTS = os.path.join(REPO, 'packages/web/public/fonts')
sys.path[:0] = [SP + '/v21', SP, SP + '/gen', SP + '/real']

from PIL import Image  # noqa: E402
import art  # noqa: E402
import tfx3 as TF  # noqa: E402  (imports mini, which loads the 36-slot scenes)

os.makedirs(OUT + '/world', exist_ok=True)

# 1. world pictures: 36 slots, each 320 x 180. s = the picture at rest, i = the same world with the next world already baked into its centre.
for k in range(36):
    shutil.copy('%s/v21/scenes/%d.png' % (SP, k), '%s/world/s%d.png' % (OUT, k))
    shutil.copy('%s/v21/inner/%d.png' % (SP, k), '%s/world/i%d.png' % (OUT, k))

# 2. explorer: three glow states, native 1x pixels, cropped. ox/oy = top-left of the crop inside the 320 x 180 picture.
ex = {}
for a in (0, 1, 2):
    im = art.place_player(Image.new('RGBA', (320, 180), (0, 0, 0, 0)), aura=a)
    bb = im.getchannel('A').getbbox()
    im.crop(bb).save('%s/explorer%d.png' % (OUT, a))
    ex[a] = dict(ox=bb[0], oy=bb[1], w=bb[2] - bb[0], h=bb[3] - bb[1])

# 3. rarity gems (32 x 32), index 0..5 = Common..Mythic
for i in range(6):
    shutil.copy('%s/assets/gem%d.png' % (SP, i + 1), '%s/gem%d.png' % (OUT, i))

# 4. accent colour of every slot (used by the world title cards)
accents = {str(k): list(TF.accent(k)) for k in range(36)}

roster = json.load(open(SP + '/v21/roster21.json'))
json.dump(dict(explorer=ex, accents=accents, roster=roster), open(OUT + '/manifest.json', 'w'), indent=1)

# 5. fonts (both are SIL Open Font License families: Pixelify Sans and Silkscreen; PixelifyFix = static instances patched for a distinct "5")
os.makedirs(FONTS, exist_ok=True)
for f in ('PixelifyFix-400.ttf', 'PixelifyFix-500.ttf', 'PixelifyFix-600.ttf', 'PixelifyFix-700.ttf', 'Silkscreen-Bold.ttf', 'Silkscreen-Regular.ttf'):
    shutil.copy('%s/fonts/%s' % (SP, f), '%s/%s' % (FONTS, f))
print('exported', len(os.listdir(OUT + '/world')), 'world pictures; explorer', ex)
