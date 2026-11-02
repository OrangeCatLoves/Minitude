"""21-world chain. Same geometry as video/chain.py (slot j+1 is a 10x magnification of the patch at the explorer's feet in slot j).
36 slots in all, because the sizes still step by 20 points; 21 of them are named worlds:
  slots 0..19  worlds 1..20   (0-3 new carpet art, 4-15 v4 art, 16/17/19 new real-world scenes, 18 v4 Ripple Sea art)
  slots 20..34 the unexplored stretch (15 dark variants, the glow of Planck Foam grows)
  slot  35     world 21, Planck Foam"""
import os, sys
SP = '/tmp/claude-0/-home-claude/3fd5d84e-d272-5730-bf2c-7b023869af54/scratchpad'
VD4 = SP + '/video'
OUT = SP + '/v21'
sys.path[:0] = [OUT, VD4, SP, SP + '/real', SP + '/gen']
import numpy as np, cv2
from PIL import Image
import chain as CH
import kit, scenes_a, scenes_b, scenes_c
kit._calm_hud_zone = lambda im: im
import void

N = 36
CH.N = N


def raw_for(j):
    if j <= 15 or j == 18 or j == 35:
        return np.array(Image.open('%s/scenes_v1/%d.png' % (VD4, j)).convert('RGB')).astype(np.float32)
    if j in (16, 17, 19):
        return np.array(kit.SC[j]().convert('RGB')).astype(np.float32)
    return np.array(void.void_scene(j - 20).convert('RGB')).astype(np.float32)


def build():
    import newart
    LAM = CH.lam_map()
    rest_pre, inner_pre = {}, {}
    for j in range(N):
        if j == 0:
            rest_pre[0] = inner_pre[0] = np.array(newart.w0().convert('RGB')).astype(np.float32)
        elif j in CH.NEW:
            _bg, fg = (newart.w1, newart.w2, newart.w3)[j - 1]()
            ctx = CH.ctx_of(rest_pre[j - 1])
            fgf = np.array(fg).astype(np.float32); al = fgf[..., 3:4] / 255.0
            rest_pre[j] = inner_pre[j] = fgf[..., :3] * al + ctx * (1 - al)
        else:
            raw = raw_for(j)
            rest_pre[j] = raw
            inner_pre[j] = CH.splice(raw, CH.ctx_of(rest_pre[j - 1]), LAM)
    fin_rest, fin_inner = {N - 1: rest_pre[N - 1]}, {N - 1: inner_pre[N - 1]}
    for j in range(N - 2, -1, -1):
        thumb = cv2.resize(fin_inner[j + 1], (CH.PX1 - CH.PX0, CH.PY1 - CH.PY0), interpolation=cv2.INTER_AREA)
        fin_rest[j] = CH.paste_thumb(rest_pre[j], thumb)
        fin_inner[j] = CH.paste_thumb(inner_pre[j], thumb)
    return fin_rest, fin_inner


if __name__ == '__main__':
    rest, inner = build()
    os.makedirs(OUT + '/scenes', exist_ok=True); os.makedirs(OUT + '/inner', exist_ok=True)
    for k in range(N):
        Image.fromarray(np.clip(rest[k], 0, 255).astype(np.uint8)).save('%s/scenes/%d.png' % (OUT, k))
        Image.fromarray(np.clip(inner[k], 0, 255).astype(np.uint8)).save('%s/inner/%d.png' % (OUT, k))
    print('wrote', N)
