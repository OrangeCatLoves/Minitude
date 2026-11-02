import sys, shutil
from fontTools.ttLib import TTFont
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.recordingPen import RecordingPen
S = float(sys.argv[1]); OUT = sys.argv[2]
SUP = {'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9'}
for w in (400,500,600,700):
    f = TTFont('fonts/backup_v4/PixelifyFix-%d.ttf' % w); cm = f.getBestCmap(); gs = f.getGlyphSet(); glyf = f['glyf']; hm = f['hmtx']
    top = 638; y0 = top - 649 * S      # digit spans -11..638 -> scaled; top stays at 638
    for sup, dig in SUP.items():
        gname = cm[ord(sup)]; bname = cm[ord(dig)]
        pen = TTGlyphPen(gs)
        gs[bname].draw(TransformPen(pen, (S, 0, 0, S, 61 - 61 * S, y0 + 11 * S)))
        g = pen.glyph(); glyf[gname] = g; g.recalcBounds(glyf)
        bw = hm[bname][0]
        hm[gname] = (int(61 + (bw - 61 - 61) * S + 61 + 20), g.xMin)   # left side 61, right side ~81
    # raised minus: centred on the exponent's middle
    mn = cm[0x207B]; g = glyf[mn]; cy = (top + y0) / 2; hgt = 66
    pen = TTGlyphPen(gs); x0, x1 = 60, 60 + int(260 * S / 0.55 * 0.62)
    pen.moveTo((x0, int(cy - hgt/2))); pen.lineTo((x0, int(cy + hgt/2))); pen.lineTo((x1, int(cy + hgt/2))); pen.lineTo((x1, int(cy - hgt/2))); pen.closePath()
    glyf[mn] = pen.glyph(); glyf[mn].recalcBounds(glyf); hm[mn] = (x1 + 80, x0)
    f.save(OUT + '/PixelifyFix-%d.ttf' % w)
print('ok', S)
