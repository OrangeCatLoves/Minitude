const { chromium } = require('../../tools/browser-test/node_modules/playwright')
;(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required'] })
  const page = await browser.newPage()
  await page.goto('about:blank')
  const r = await page.evaluate(() => ({
    ua: navigator.userAgent.match(/Chrome\/[\d.]+/)[0],
    mp4_h264_aac: MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E,mp4a.40.2'),
    mp4_any: MediaRecorder.isTypeSupported('video/mp4'),
    webm_vp9_opus: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus'),
    webm_vp8_opus: MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus'),
    audioCtx: typeof AudioContext, offline: typeof OfflineAudioContext,
  }))
  console.log(JSON.stringify(r, null, 1))
  await browser.close()
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
