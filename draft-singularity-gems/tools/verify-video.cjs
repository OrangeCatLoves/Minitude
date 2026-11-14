// Draft helper: load the recorded video back in Chrome; report size, length, loudness per 2 seconds, and save a contact sheet of sample frames.
const { chromium } = require('../../tools/browser-test/node_modules/playwright')
const fs = require('fs'), path = require('path')
;(async () => {
  const root = path.join(__dirname, '..'), file = path.join(root, 'video', 'singularity-walkthrough.mp4')
  const browser = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required'] })
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } }); page.setDefaultTimeout(0)
  await page.goto('file:///' + root.replace(/\\/g, '/') + '/index.html')
  const b64 = fs.readFileSync(file).toString('base64')
  const times = (process.argv[2] || '3,14,30,44,50,53,58,64').split(',').map(Number)
  const r = await page.evaluate(async ([b64, times]) => {
    const bin = atob(b64), bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const url = URL.createObjectURL(new Blob([bytes], { type: 'video/mp4' })), v = document.createElement('video'); v.src = url; v.muted = true; v.preload = 'auto'
    await new Promise((res, rej) => { v.onloadedmetadata = res; v.onerror = () => rej(new Error('video error ' + (v.error && v.error.message))) })
    const info = { duration: v.duration, w: v.videoWidth, h: v.videoHeight }
    const cv = document.createElement('canvas'); cv.width = 640; cv.height = 390; const g = cv.getContext('2d'), frames = []
    for (const t of times) { v.currentTime = Math.min(t, v.duration - 0.2); await new Promise((r) => (v.onseeked = r)); await new Promise((r) => setTimeout(r, 150)); g.drawImage(v, 0, 0, 640, 390); frames.push(cv.toDataURL('image/jpeg', 0.8)) }
    let audio = null
    try {
      const ac = new AudioContext(), buf = await ac.decodeAudioData(bytes.buffer.slice(0)), d = buf.getChannelData(0), sr = buf.sampleRate, per = []
      for (let s = 0; s < buf.duration; s += 2) { let m = 0; for (let i = Math.floor(s * sr); i < Math.min(d.length, Math.floor((s + 2) * sr)); i++) m = Math.max(m, Math.abs(d[i])); per.push(m) }
      audio = { channels: buf.numberOfChannels, sr, dur: buf.duration, peakDbPer2s: per.map((m) => (m > 0 ? Math.round(20 * Math.log10(m)) : -120)) }
    } catch (e) { audio = { error: String(e) } }
    return { info, frames, audio }
  }, [b64, times])
  console.log('video:', JSON.stringify(r.info))
  console.log('audio:', JSON.stringify(r.audio))
  // contact sheet
  const sheet = await browser.newPage({ viewport: { width: 1600, height: 900 } })
  await sheet.setContent('<body style="margin:0;background:#000"></body>')
  const png = await sheet.evaluate(async ([frames, times]) => {
    const imgs = await Promise.all(frames.map((s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = s })))
    const cols = 4, w = 400, h = Math.round(400 * 390 / 640), rows = Math.ceil(imgs.length / cols), cv = document.createElement('canvas'); cv.width = w * cols; cv.height = h * rows
    const g = cv.getContext('2d'); imgs.forEach((im, k) => { g.drawImage(im, (k % cols) * w, Math.floor(k / cols) * h, w, h); g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect((k % cols) * w + 4, Math.floor(k / cols) * h + 4, 60, 20); g.fillStyle = '#fff'; g.font = '14px monospace'; g.fillText(times[k] + 's', (k % cols) * w + 10, Math.floor(k / cols) * h + 19) })
    return cv.toDataURL('image/png')
  }, [r.frames, times])
  fs.writeFileSync(path.join(root, 'gem-art', '_video-check.png'), Buffer.from(png.split(',')[1], 'base64'))
  await browser.close()
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
