from kit import *

# ------------------------------------------------------------ the unexplored stretch (between the last kept world and Planck Foam): honest emptiness
@scene(100)
def unexplored():
    c = C(); rnd = random.Random(2100)
    vgrad(c, 0, 0, W, H, ramp('#02030a', '#04061a', '#070b26', '#0a1030'))
    # a few very dim specks, so the dark does not look like a missing picture
    starfield(c, rnd, 46, [rgb('#3a4478'), rgb('#4a5690')], 0, 134, 0)
    starfield(c, rnd, 10, [rgb('#7a86c0')], 0, 100, 0)
    glow(c, 160, 140, 130, rgb('#141c44'), .35, 1.5)
    ledge(c, 140, '#3a4a7a', '#141c3c', '#04061a', 0, W, 9, None)
    # tick marks along the floor: only a ruler, nothing else is known to be here
    for x in range(10, W, 20):
        c.r(x, 150, x + 1, 153, rgb('#26305a'))
    return c.im
