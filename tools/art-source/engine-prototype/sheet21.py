import sys, os
from PIL import Image, ImageDraw
OUT = '/tmp/claude-0/-home-claude/3fd5d84e-d272-5730-bf2c-7b023869af54/scratchpad/v21/test/'
tag = sys.argv[1]; ts = [float(a) for a in sys.argv[3:]]; name = sys.argv[2]
cols = 3; w, h = 640, 360
rows = (len(ts) + cols - 1) // cols
sh = Image.new('RGB', (cols * w, rows * h))
for n, t in enumerate(ts):
    im = Image.open(OUT + '%s_%06.2f.png' % (tag, t)).resize((w, h), Image.LANCZOS)
    d = ImageDraw.Draw(im); d.text((6, h - 14), '%.2f' % t, fill=(255, 255, 0))
    sh.paste(im, ((n % cols) * w, (n // cols) * h))
sh.save(OUT + name)
