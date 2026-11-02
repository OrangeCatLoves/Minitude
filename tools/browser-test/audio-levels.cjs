// Renders the sound of a scripted run offline (no speakers needed) and prints its levels.   node audio-levels.cjs 5,5,5,5,5,5,5
// Also writes out/audio_<name>.raw (mono, 11025 Hz, signed 16-bit little endian) which Audacity can import as raw data.
const { open, OUT } = require('./lib.cjs')
const fs = require('fs')
const path = require('path')
;(async () => {
  const tiers = (process.argv[2] || '5,5,5,5,5,5,5').split(',').map(Number)
  const t = await open()
  const r = await t.page.evaluate((x) => window.__mt.audio(x), tiers)
  fs.writeFileSync(path.join(OUT, 'audio_' + tiers.join('') + '.raw'), Buffer.from(r.pcm11k, 'base64'))
  const db = (v) => (20 * Math.log10(v + 1e-9)).toFixed(0)
  console.log(`seconds ${r.seconds}  peak ${r.peak.toFixed(3)} (${db(r.peak)} dB)  rms ${r.rms.toFixed(4)} (${db(r.rms)} dB)  p99.9 ${r.p999.toFixed(3)}`)
  console.log('per second (rms dB / peak dB):')
  console.log(r.perSecond.map(([a, b], i) => `${i}:${db(a)}/${db(b)}`).join('  '))
  console.log(t.logs.join('\n') || 'no console errors')
  await t.browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
