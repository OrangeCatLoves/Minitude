// Draft helper: render the draft sounds offline to WAV files (sound/*.wav) and print a loudness report.
const { chromium } = require('../../../tools/browser-test/node_modules/playwright')
const fs = require('fs'), path = require('path')
const ROOT = path.join(__dirname, '..')
;(async () => {
  fs.mkdirSync(path.join(ROOT, 'sound'), { recursive: true })
  const browser = await chromium.launch({ channel: 'chrome' })
  const page = await browser.newPage()
  await page.goto('about:blank')
  await page.addScriptTag({ path: path.join(ROOT, 'src', 'sound.js') })
  const jobs = [['singularity-reveal', 'singularity', 7.2], ['gem-collect', 'collect', 2.2], ['gem-hover', 'hover', 1.2], ['ui-blip', 'blip', 0.6]]
  for (const [file, name, secs] of jobs) {
    const b64 = await page.evaluate(async ([name, secs]) => {
      const buf = await Sound.render(name, secs), wav = new Uint8Array(Sound.toWav(buf)); let s = ''
      for (let i = 0; i < wav.length; i += 0x8000) s += String.fromCharCode.apply(null, wav.subarray(i, i + 0x8000))
      return btoa(s)
    }, [name, secs])
    const wav = Buffer.from(b64, 'base64'); fs.writeFileSync(path.join(ROOT, 'sound', file + '.wav'), wav)
    // loudness report
    const n = (wav.length - 44) / 4, sr = 44100; let peak = 0, clip = 0; const win = Math.floor(sr * 0.25), rms = []
    let acc = 0, cnt = 0
    for (let i = 0; i < n; i++) {
      const l = wav.readInt16LE(44 + i * 4) / 32768, r = wav.readInt16LE(46 + i * 4) / 32768, m = Math.max(Math.abs(l), Math.abs(r))
      peak = Math.max(peak, m); if (m > 0.999) clip++
      acc += (l * l + r * r) / 2; cnt++
      if (cnt === win) { rms.push(Math.sqrt(acc / cnt)); acc = 0; cnt = 0 }
    }
    const db = (x) => (x > 0 ? (20 * Math.log10(x)).toFixed(0) : '-inf')
    console.log(`${file}.wav  ${secs}s  peak ${db(peak)} dBFS  clipped samples ${clip}  size ${(wav.length / 1024).toFixed(0)} KB`)
    if (rms.length > 3) console.log('  loudness every 0.25 s (dBFS): ' + rms.map((x) => db(x)).join(' '))
  }
  await browser.close()
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
