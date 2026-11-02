import sys, os, time
sys.path.insert(0, '/tmp/claude-0/-home-claude/3fd5d84e-d272-5730-bf2c-7b023869af54/scratchpad/v21')
import numpy as np
from PIL import Image
import minui21 as U
OUT = '/tmp/claude-0/-home-claude/3fd5d84e-d272-5730-bf2c-7b023869af54/scratchpad/v21/test/'
os.makedirs(OUT, exist_ok=True)
tag = os.environ.get('MINI_RUN', 'main')
for a in sys.argv[1:]:
    t = float(a); t0 = time.time(); fr = U.render(t)
    Image.fromarray(fr).save(OUT + '%s_%06.2f.png' % (tag, t)); print(t, round((time.time() - t0) * 1000), 'ms', flush=True)
