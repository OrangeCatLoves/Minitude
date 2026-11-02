import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import worlds as WD
PROJ = '/tmp/claude-0/-home-claude/3fd5d84e-d272-5730-bf2c-7b023869af54/scratchpad/canvas/project/'
RUN = dict(WD.RUN); RUN[16] = 'EXAMPLE RUN: 320 PTS ENDS HERE'; RUN[0] = 'EVERY RUN STARTS HERE'
data = []
for k in range(36):
    w = WD.world(k)
    fact = k in WD.F
    data.append({
        'n': str(k + 1), 'src': w['src'], 'name': w['name'], 'size': w['size'], 'pts': w['pts'], 'tag': RUN.get(k, ''),
        'chip': 'FACT' if fact else 'INVENTED',
        'chipFg': '#5be0ff' if fact else '#ffb23f',
        'chipEdge': ('2px 0 0 0 #5be0ff, -2px 0 0 0 #5be0ff, 0 2px 0 0 #5be0ff, 0 -2px 0 0 #5be0ff' if fact else
                     '2px 0 0 0 #ffb23f, -2px 0 0 0 #ffb23f, 0 2px 0 0 #ffb23f, 0 -2px 0 0 #ffb23f'),
    })
TPL = r'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Minitude All 36 Worlds</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500;600;700&amp;family=Silkscreen:wght@400;700&amp;display=swap" rel="stylesheet">
<style>
body{margin:0}
</style>
</helmet>
<div style="position: relative; width: 2200px; height: 2140px; box-sizing: border-box; padding: 40px; overflow: hidden; display: flex; flex-direction: column; gap: 32px; background: #070b17; font-family: 'Pixelify Sans', monospace; color: #eef2ff">

  <div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 40px">
    <div style="display: flex; flex-direction: column; gap: 8px">
      <h1 style="margin: 0; font-size: 56px; line-height: 1; font-weight: 700; letter-spacing: 2px; color: #ffc857; text-shadow: 4px 4px 0 #8a5a00">ALL 36 WORLDS</h1>
      <p style="margin: 0; font-size: 28px; color: #eef2ff">You unlock a world when your total points reach its number. Size = 1.7 m ÷ 10 for every 20 points.</p>
    </div>
    <p style="margin: 0; max-width: 700px; text-align: right; font-size: 20px; line-height: 1.2; color: #a3b0d6">The explorer is drawn at the same size in every world. Only the world changes. The next three boards show every world as a full card.</p>
  </div>

  <div style="display: grid; grid-template-columns: repeat(6, 336px); justify-content: space-between; gap: 20px 0">
    <sc-for list="{{worlds}}" as="w" hint-placeholder-count="36">
      <div style="height: 284px; box-sizing: border-box; padding: 8px; display: flex; flex-direction: column; gap: 6px; background: #101a33; box-shadow: 3px 0 0 0 #3c5190, -3px 0 0 0 #3c5190, 0 3px 0 0 #3c5190, 0 -3px 0 0 #3c5190">
        <div style="position: relative; flex: none; width: 320px; height: 180px">
          <img src="{{w.src}}" alt="" aria-hidden="true" style="display: block; width: 320px; height: 180px; image-rendering: pixelated">
          <div style="position: absolute; left: 8px; top: 8px; min-width: 20px; box-sizing: border-box; padding: 3px 8px; text-align: center; background: #070b17; font-family: 'Silkscreen', monospace; font-weight: 700; font-size: 14px; line-height: 14px; color: #ffc857; box-shadow: 2px 0 0 0 #ffc857, -2px 0 0 0 #ffc857, 0 2px 0 0 #ffc857, 0 -2px 0 0 #ffc857">{{w.n}}</div>
          <div style="position: absolute; right: 8px; top: 8px; padding: 3px 8px; background: #070b17; font-family: 'Silkscreen', monospace; font-weight: 700; font-size: 12px; line-height: 14px; letter-spacing: 1px; color: {{w.chipFg}}; box-shadow: {{w.chipEdge}}">{{w.chip}}</div>
        </div>
        <div style="flex: none; height: 24px; margin-top: 4px; font-size: 22px; line-height: 24px; font-weight: 700; letter-spacing: 1px; color: #ffffff; white-space: nowrap; overflow: hidden">{{w.name}}</div>
        <div style="flex: none; height: 20px; display: flex; align-items: baseline; justify-content: space-between">
          <span style="font-size: 20px; line-height: 20px; font-weight: 700; color: #5be0ff">{{w.size}}</span>
          <span style="font-family: 'Silkscreen', monospace; font-weight: 700; font-size: 13px; line-height: 14px; letter-spacing: 1px; color: #ffc857">{{w.pts}}</span>
        </div>
        <div style="flex: none; height: 22px; display: flex; align-items: center">
          <sc-if value="{{w.tag}}" hint-placeholder-val="{{ false }}">
            <span style="font-family: 'Silkscreen', monospace; font-weight: 700; font-size: 11px; line-height: 13px; letter-spacing: 1px; color: #ffd488; white-space: nowrap">{{w.tag}}</span>
          </sc-if>
        </div>
      </div>
    </sc-for>
  </div>

  <p style="margin: 0; font-size: 22px; line-height: 1.25; color: #a3b0d6">From 1.7 m to 1.7 × 10⁻³⁵ m is 35 steps of ÷ 10, and 35 × 20 = 700 points, the most a run can score (7 Mythic answers × 100). 22 worlds carry a fun fact with a source (blue FACT tag). The other 14 are invented (orange tag): no microscope can show a scale that small. Every picture is stylised art either way.</p>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":2200,"height":2140}}'>
class Component extends DCLogic {
  renderVals() {
    const worlds = __DATA__;
    return { worlds };
  }
}
</script>
</body>
</html>
'''
out = TPL.replace('__DATA__', json.dumps(data, ensure_ascii=False, indent=2))
open(PROJ + 'Atlas.dc.html', 'w').write(out)
print('wrote Atlas.dc.html', len(out))
