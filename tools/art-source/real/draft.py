"""Compose a game-like draft frame (1280x720) for one world: the world, explorer, HUD, tag, scale bar and the world title card."""
import sys, math, os
sys.path.insert(0, '/tmp/claude-0/-home-claude/3fd5d84e-d272-5730-bf2c-7b023869af54/scratchpad/video')
sys.path.insert(0, '/tmp/claude-0/-home-claude/3fd5d84e-d272-5730-bf2c-7b023869af54/scratchpad')
os.environ.setdefault('MINI_RUN', 'main')
import numpy as np, cv2
from PIL import Image, ImageDraw
import mini as M
import fx3 as X
import tfx3 as TF
import ui3 as U
import mini3 as M3
from mini import W, H, INK, AMBER, CYAN, TXT, DIM, PX, SIL, tw, text, rect, smooth, ease_out, fmt, nice_bar, size_of, clamp01

_SC = {}
M.scene = lambda k: _SC[k]
TF.scene = lambda k: _SC[k]
TF.accent.cache_clear()
KIND_COL = {'MEASURED': (141, 255, 180), 'LIMIT': (91, 224, 255), 'THEORY': (255, 200, 87)}


def card(F, k, name, desc, kind, label2, t=3.2):
    """Copy of tfx3.title_card for a finished card, with the bottom line showing what is real (replaces the world ruler)."""
    tau = t; cy = 178; h = 196
    acc = TF.accent(k)
    X.shade(F, 0, cy - h / 2, W, cy + h / 2, (4, 7, 18), 0.64)
    X.rect_a(F, 0, cy - h / 2, W, 3, acc, 0.9); X.rect_a(F, 0, cy + h / 2 - 3, W, 3, acc, 0.9)
    X.put_text(F, str(k + 1), 1010, cy + 78, 'px', 230, acc, 0.10, w=700, anchor='c')
    lab = 'WORLD %d / 36' % (k + 1)
    X.put_text(F, lab, 640, cy - 56, 'sil', 20, acc, 1.0, ls=6, anchor='c')
    lw = tw(SIL(20), lab, 6) / 2 + 30; ln = 240
    X.rect_a(F, 640 - lw - ln, cy - 63, ln, 3, acc, 0.8); X.rect_a(F, 640 + lw, cy - 63, ln, 3, acc, 0.8)
    for sx_ in (640 - lw - 8, 640 + lw + 8):
        X.rect_a(F, sx_ - 5, cy - 68, 10, 10, (255, 255, 255), 0.9)
    top = X.lerpc((255, 255, 255), acc, 0.22); bot = acc
    ls_ = 7 + 5 * smooth(0, 7.0, tau)
    TF.letters(F, name, 84, 500, ls_, 640, cy + 30, tau, 0.12, 0.05, top, bot, X.ck(acc, 0.16), acc, pop=1.1, glow=0.8, shine_at=None, alpha=1.0)
    X.put_text(F, desc, 640, cy + 66, 'px', 22, (226, 233, 252), 1.0, w=400, anchor='c')
    kc = KIND_COL[kind]
    X.put_text(F, 'REAL · ' + kind + (' · ' + label2 if label2 else ''), 640, cy + 90, 'sil', 13, kc, 1.0, ls=3, anchor='c')
    X.put_text(F, 'TAP TO SKIP', 1150, cy + 86, 'sil', 11, (163, 176, 214), 0.9, ls=2, anchor='r')


def frame(k, scene_img, name, desc, kind, label2='', size_val=None, with_card=True, score=None, show_ui=True):
    _SC[k] = np.asarray(scene_img.convert('RGB'))
    TF.accent.cache_clear()
    big = cv2.resize(_SC[k], (W, H), interpolation=cv2.INTER_NEAREST)
    wf = big[60:]
    F = np.empty((H, W, 3), np.uint8); F[:wf.shape[0]] = wf
    nb = H - wf.shape[0]
    refl = wf[wf.shape[0] - nb - 4:wf.shape[0] - 4][::-1].astype(np.float32)
    F[wf.shape[0]:] = (refl * np.linspace(0.62, 0.22, nb, dtype=np.float32)[:, None, None]).astype(np.uint8)
    M3.put_explorer(F, dict(sx=1.0, sy=1.0, dx=0, dy=0, aura=0))
    if with_card: card(F, k, name, desc, kind, label2)
    S = 1.7 * 10 ** (-k)
    if show_ui:
        X.shade(F, 0, 0, W, 76, INK, 0.80, 0.0)
    im = Image.fromarray(F); d = ImageDraw.Draw(im); d._image = im
    if show_ui:
        sc = score if score is not None else 20 * k
        U.draw_hud(d, 0, dict(rnd=7, nsq=7, cur_open=-1, score=sc, size_txt=fmt(S)), 0)
        if not with_card:
            U.draw_tag(d, 'YOU: ' + fmt(S), CYAN)
        B = nice_bar(S); L = B / S * 200
        U.draw_scalebar(d, L, fmt(B), 0.0)
    return im


if __name__ == '__main__':
    k = int(sys.argv[1]) if len(sys.argv) > 1 else 16
    src = Image.open('/tmp/claude-0/-home-claude/3fd5d84e-d272-5730-bf2c-7b023869af54/scratchpad/video/scenes_v1/%d.png' % k)
    im = frame(k, src, 'TEST WORLD', 'A line of text that describes the world in one short line.', 'MEASURED')
    im.save('/tmp/claude-0/-home-claude/3fd5d84e-d272-5730-bf2c-7b023869af54/scratchpad/real/test_frame.png')
    print('ok')
