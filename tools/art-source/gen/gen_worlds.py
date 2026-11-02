import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import worlds as WD

PROJ = '/tmp/claude-0/-home-claude/3fd5d84e-d272-5730-bf2c-7b023869af54/scratchpad/canvas/project/'
part = int(sys.argv[1])            # 1, 2 or 3
lo, hi = (part - 1) * 12, part * 12
data = [WD.world(k) for k in range(lo, hi)]
first_pts, last_pts = 20 * lo, 20 * (hi - 1)
title = 'WORLDS %d TO %d OF 36' % (lo + 1, hi)
sub = 'A new world every 20 points. Each one is 10 times smaller than the last.'
right = 'The yellow line is a scale bar. It is drawn the same length on screen in every world, and its label says what that length is in the world you are standing in.'

TPL = r'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Minitude Worlds __PART__</title>
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
<div style="position: relative; width: 2920px; height: 2760px; box-sizing: border-box; padding: 40px; overflow: hidden; display: flex; flex-direction: column; gap: 32px; background: #070b17; font-family: 'Pixelify Sans', monospace; color: #eef2ff">

  <div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 40px">
    <div style="display: flex; flex-direction: column; gap: 8px">
      <h1 style="margin: 0; font-size: 56px; line-height: 1; font-weight: 700; letter-spacing: 2px; color: #ffc857; text-shadow: 4px 4px 0 #8a5a00">__TITLE__</h1>
      <p style="margin: 0; font-size: 28px; color: #eef2ff">__SUB__</p>
    </div>
    <p style="margin: 0; max-width: 900px; text-align: right; font-size: 20px; line-height: 1.2; color: #a3b0d6">__RIGHT__</p>
  </div>

  <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 32px 40px">
    <sc-for list="{{worlds}}" as="w" hint-placeholder-count="12">
      <div style="height: 788px; box-sizing: border-box; padding: 20px; display: flex; flex-direction: column; gap: 10px; background: #101a33; box-shadow: 4px 0 0 0 #3c5190, -4px 0 0 0 #3c5190, 0 4px 0 0 #3c5190, 0 -4px 0 0 #3c5190">
        <div style="position: relative; flex: none; width: 640px; height: 360px; box-shadow: 0 0 0 4px #6f86d6">
          <img src="{{w.src}}" alt="" aria-hidden="true" style="display: block; width: 640px; height: 360px; image-rendering: pixelated">
          <div style="position: absolute; left: 16px; top: 16px; padding: 6px 14px; background: #070b17; font-family: 'Silkscreen', monospace; font-weight: 700; font-size: 16px; letter-spacing: 1px; color: #5be0ff; box-shadow: 2px 0 0 0 #5be0ff, -2px 0 0 0 #5be0ff, 0 2px 0 0 #5be0ff, 0 -2px 0 0 #5be0ff">YOU: {{w.size}}</div>
          <div style="position: absolute; right: 16px; top: 16px; padding: 6px 14px; background: #070b17; font-family: 'Silkscreen', monospace; font-weight: 700; font-size: 16px; letter-spacing: 1px; color: #ffc857; box-shadow: 2px 0 0 0 #ffc857, -2px 0 0 0 #ffc857, 0 2px 0 0 #ffc857, 0 -2px 0 0 #ffc857">{{w.pts}}</div>
          <figure aria-label="{{w.aria}}" style="margin: 0; position: absolute; left: 470px; top: 284px; width: 118px; height: 42px">
            <div style="position: absolute; left: -60px; top: 0; width: 238px; display: flex; justify-content: center">
              <span style="padding: 3px 10px; background: #070b17; font-size: 20px; line-height: 1; font-weight: 700; color: #ffc857; white-space: nowrap; box-shadow: 2px 0 0 0 #ffc857, -2px 0 0 0 #ffc857, 0 2px 0 0 #ffc857, 0 -2px 0 0 #ffc857">{{w.bar}}</span>
            </div>
            <span style="position: absolute; left: 0; top: 32px; width: 118px; height: 4px; background: #ffc857; box-shadow: 0 0 0 2px #070b17"></span>
            <span style="position: absolute; left: 0; top: 26px; width: 4px; height: 16px; background: #ffc857; box-shadow: 0 0 0 2px #070b17"></span>
            <span style="position: absolute; left: 114px; top: 26px; width: 4px; height: 16px; background: #ffc857; box-shadow: 0 0 0 2px #070b17"></span>
          </figure>
        </div>
        <div style="flex: none; height: 32px; margin-top: 6px; display: flex; align-items: baseline; justify-content: space-between; gap: 12px">
          <span style="font-size: 32px; line-height: 1; font-weight: 700; letter-spacing: 1px; color: #ffffff">{{w.name}}</span>
          <span style="font-family: 'Silkscreen', monospace; font-weight: 700; font-size: 14px; letter-spacing: 1px; color: #a3b0d6">WORLD {{w.n}} / 36</span>
        </div>
        <div style="flex: none; height: 54px; overflow: hidden; font-size: 22px; line-height: 1.2; color: #a3b0d6">{{w.desc}}</div>
        <div style="flex: none; height: 30px; display: flex; align-items: center">
          <sc-if value="{{w.tag}}" hint-placeholder-val="{{ false }}">
            <span style="padding: 6px 12px; background: #070b17; font-family: 'Silkscreen', monospace; font-weight: 700; font-size: 14px; line-height: 14px; letter-spacing: 1px; color: #ffd488; box-shadow: 2px 0 0 0 #ffb23f, -2px 0 0 0 #ffb23f, 0 2px 0 0 #ffb23f, 0 -2px 0 0 #ffb23f">{{w.tag}}</span>
          </sc-if>
        </div>
        <sc-if value="{{w.headline}}" hint-placeholder-val="{{ true }}">
          <div style="flex: none; height: 232px; box-sizing: border-box; overflow: hidden; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; background: #0b1224; box-shadow: 2px 0 0 0 #5be0ff, -2px 0 0 0 #5be0ff, 0 2px 0 0 #5be0ff, 0 -2px 0 0 #5be0ff">
            <span style="font-family: 'Silkscreen', monospace; font-weight: 700; font-size: 12px; line-height: 14px; letter-spacing: 1px; color: #5be0ff">DID YOU KNOW?</span>
            <span style="font-size: 26px; line-height: 1.1; font-weight: 700; color: #ffffff">{{w.headline}}</span>
            <span style="font-size: 20px; line-height: 1.25; color: #a3b0d6">{{w.body}}</span>
            <span style="margin-top: auto; font-family: 'Silkscreen', monospace; font-size: 12px; line-height: 14px; letter-spacing: 1px; color: #8a98c4">SOURCE: {{w.source}}</span>
          </div>
        </sc-if>
        <sc-if value="{{w.inv}}" hint-placeholder-val="{{ false }}">
          <div style="flex: none; height: 232px; box-sizing: border-box; overflow: hidden; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; background: #0b1224; border: 4px dashed #ffb23f">
            <span style="align-self: flex-start; padding: 4px 10px; background: #ffb23f; font-family: 'Silkscreen', monospace; font-weight: 700; font-size: 14px; line-height: 14px; letter-spacing: 1px; color: #1b1200">{{w.inv}}</span>
            <span style="font-size: 22px; line-height: 1.25; color: #eef2ff">{{w.invBody}}</span>
          </div>
        </sc-if>
      </div>
    </sc-for>
  </div>

  <p style="margin: 0; font-size: 22px; line-height: 1.25; color: #a3b0d6">Size = 1.7 m ÷ 10 for every 20 points, so world number k starts at 20 × k points, and in it you are 1.7 m ÷ 10 to the power k tall. The scale bar is the biggest round number (1, 2 or 5 × a power of ten) that fits beside you: for a 1.7 unit explorer that is 2 units, drawn 118 px long next to a 100 px explorer. Cards with a blue border carry a fact with a source; orange dashed cards are invented worlds.</p>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":2920,"height":2760}}'>
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
out = (TPL.replace('__PART__', str(part)).replace('__TITLE__', title).replace('__SUB__', sub).replace('__RIGHT__', right)
          .replace('__DATA__', json.dumps(data, ensure_ascii=False, indent=2)))
open(PROJ + 'Worlds%d.dc.html' % part, 'w').write(out)
print('wrote Worlds%d.dc.html' % part, len(out), 'bytes')
