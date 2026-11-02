import sys, importlib
sys.path.insert(0, '/tmp/claude-0/-home-claude/3fd5d84e-d272-5730-bf2c-7b023869af54/scratchpad/real')
from PIL import Image
import draft, kit
def sheet(mods, ks, out, cols=2, w=640, card=False):
    for m in mods: importlib.import_module(m)
    ims = []
    for k in ks:
        sc = kit.SC[k]().convert('RGB')
        fr = draft.frame(k, sc, 'NAME', 'Short description of this world.', 'MEASURED', with_card=card)
        ims.append(fr.resize((w, w * 9 // 16), Image.LANCZOS))
    rows = (len(ims) + cols - 1) // cols
    S = Image.new('RGB', (cols * w, rows * (w * 9 // 16)))
    for i, im in enumerate(ims): S.paste(im, ((i % cols) * w, (i // cols) * (w * 9 // 16)))
    S.save(out)
if __name__ == '__main__':
    mods = sys.argv[1].split(','); ks = [int(x) for x in sys.argv[2].split(',')]
    sheet(mods, ks, sys.argv[3], card=(len(sys.argv) > 4 and sys.argv[4] == 'card'))
