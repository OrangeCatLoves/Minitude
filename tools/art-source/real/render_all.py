import sys
sys.path.insert(0, '/tmp/claude-0/-home-claude/3fd5d84e-d272-5730-bf2c-7b023869af54/scratchpad/real')
from PIL import Image
import draft, kit, final
import scenes_a, scenes_b, scenes_c
V1 = '/tmp/claude-0/-home-claude/3fd5d84e-d272-5730-bf2c-7b023869af54/scratchpad/video/scenes_v1/%d.png'
OUT = '/tmp/claude-0/-home-claude/3fd5d84e-d272-5730-bf2c-7b023869af54/scratchpad/real/out/'
frames = {}
for n, r in final.R.items():
    k = n - 1
    if r['art'] == 'old18': sc = Image.open(V1 % 18)
    elif r['art'] == 'old35': sc = Image.open(V1 % 35)
    else: sc = kit.SC[k]()
    fr = draft.frame(k, sc, r['name'], r['desc'], r['kind'], r['label2'], with_card=True)
    fr.save(OUT + 'world_%02d.png' % n)
    frames[n] = fr
# contact sheets: 4 frames per sheet (2 x 2), 960 px each
ns = sorted(frames)
for i in range(0, len(ns), 4):
    grp = ns[i:i + 4]
    S = Image.new('RGB', (1920, 1080))
    for j, n in enumerate(grp):
        S.paste(frames[n].resize((960, 540), Image.LANCZOS), ((j % 2) * 960, (j // 2) * 540))
    S.save(OUT + 'sheet_%d-%d.png' % (grp[0], grp[-1]))
print('ok')
