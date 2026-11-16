// Hostile-request tests: the attacks in docs/SECURITY.md, with numbers. ONLY for a throw-away server on this computer:
//   cd packages/server
//   PORT=8788 DATABASE_FILE=C:/some/new/empty.db CLIENT_IP_HEADER=x-test-ip NODE_ENV=production node --import tsx src/index.ts
//   cd tools/security && DATABASE_FILE=C:/some/new/empty.db node hostile.cjs
// It refuses to run against anything but localhost: it floods the server and sends an 80 MB body. The server picks the caller's address
// from the x-test-ip header (CLIENT_IP_HEADER=x-test-ip), so the script can pretend to be many networks.
const http = require('http')
const fs = require('fs')
const { execSync } = require('child_process')

const PORT = Number(process.env.PORT || 8788)
const HOST = process.env.HOST || '127.0.0.1'
const DB = process.env.DATABASE_FILE
if (!['127.0.0.1', 'localhost', '::1'].includes(HOST)) { console.error('Refusing to run against ' + HOST + ': this script attacks the server it talks to.'); process.exit(2) }

function req(method, path, { headers = {}, body = null, ip = '9.9.9.9' } = {}) {
  return new Promise((resolve) => {
    const b = body === null ? null : Buffer.isBuffer(body) ? body : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))
    const r = http.request({ host: HOST, port: PORT, method, path, headers: { 'x-test-ip': ip, ...(b ? { 'content-type': 'application/json', 'content-length': b.length } : {}), ...headers } }, (res) => {
      const chunks = []
      res.on('data', (d) => chunks.push(d))
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, text: Buffer.concat(chunks).toString('utf8').slice(0, 300) }))
    })
    r.on('error', (e) => resolve({ status: 'ERR ' + e.code }))
    r.setTimeout(60000, () => { r.destroy(); resolve({ status: 'TIMEOUT' }) })
    if (b) r.write(b)
    r.end()
  })
}
const dbSize = () => (DB && fs.existsSync(DB) ? fs.statSync(DB).size + (fs.existsSync(DB + '-wal') ? fs.statSync(DB + '-wal').size : 0) : 0)
/** memory of the process that listens on the port (Windows; prints ? elsewhere) */
const serverRssMB = () => {
  try {
    return execSync(`powershell -NoProfile -Command "(Get-NetTCPConnection -LocalPort ${PORT} -State Listen | Select-Object -First 1).OwningProcess | ForEach-Object { [math]::Round((Get-Process -Id $_).WorkingSet64/1MB) }"`).toString().trim()
  } catch { return '?' }
}
const line = (s) => console.log(s)
let bad = 0
const expect = (cond, what) => { if (!cond) bad++; line((cond ? 'ok       ' : 'PROBLEM  ') + what) }

;(async () => {
  const guest = 'abcd1234abcd1234abcd1234'
  line('=== 1. malformed and hostile input (the server must answer politely and stay up)')
  const cases = [
    ['invalid JSON to /api/suggest', 'POST', '/api/suggest', { body: '{"text": ' }, [400]],
    ['array instead of object', 'POST', '/api/suggest', { body: '[1,2,3]' }, [400]],
    ['text is an object', 'POST', '/api/suggest', { body: { text: { a: 1 } } }, [400]],
    ['idea with HTML/script', 'POST', '/api/suggest', { body: { text: '<script>alert(1)</script> a question about cats' } }, [200]],
    ['rating 99', 'POST', '/api/rating', { body: { score: 99, mode: 'versus' } }, [400]],
    ['rating with a SQL run id', 'POST', '/api/rating', { body: { score: 3, runId: "' OR 1=1 --" } }, [404]],
    ['answer on an unknown run', 'POST', '/api/run/nope/answer', { body: { index: 0, text: 'x' } }, [404]],
    ['run id with SQL', 'GET', "/api/run/'%20OR%201=1--", {}, [404]],
    ['daily without a guest id', 'GET', '/api/daily', {}, [400]],
    ['daily with a SQL guest id', 'GET', '/api/daily', { headers: { 'x-guest': "'; DROP TABLE runs;--" } }, [400]],
    ['answer list before finishing', 'GET', '/api/daily/answers/list?question=x&tier=0&q=%25%25%25', { headers: { 'x-guest': guest } }, [400, 403, 404]],
    ['versus create, no body', 'POST', '/api/versus/create', { headers: { 'x-guest': guest } }, [400]],
    ['versus create, 100,000 letter name', 'POST', '/api/versus/create', { headers: { 'x-guest': guest }, body: { name: 'A'.repeat(100000), visibility: 'public' } }, [400, 413]],
    ['versus join, path-like code', 'POST', '/api/versus/join', { headers: { 'x-guest': guest }, body: { code: '../../etc', name: 'x' } }, [404, 400]],
    ['unknown API route', 'GET', '/api/admin', {}, [404]],
    ['PUT on a POST route', 'PUT', '/api/run', {}, [404]],
    ['a 20,000 character URL', 'GET', '/api/' + 'a'.repeat(20000), {}, [431, 414, 404]],
  ]
  for (const [name, m, p, o, want] of cases) {
    const r = await req(m, p, o)
    expect(want.includes(r.status), `${String(r.status).padEnd(4)} ${name}`)
  }
  expect((await req('GET', '/api/health')).status === 200, 'the server is still up')
  const nf = await req('GET', '/api/admin')
  expect(/^\{"error"/.test(nf.text), 'an unknown /api path answers in JSON, not the game page')

  line('\n=== 2. CORS: may another website call the API from a visitor\'s browser?')
  const pf = await req('OPTIONS', '/api/run', { headers: { origin: 'https://evil.example', 'access-control-request-method': 'POST' } })
  expect(!pf.headers['access-control-allow-origin'], 'no access-control-allow-origin on a preflight from another site (got: ' + pf.headers['access-control-allow-origin'] + ')')

  line('\n=== 3. flood of new solo runs from ONE address (limit: 90 a minute)')
  const before = dbSize()
  let ok = 0, limited = 0
  for (let i = 0; i < 120; i++) { const r = await req('POST', '/api/run', { ip: '7.7.7.7' }); if (r.status === 200) ok++; else if (r.status === 429) limited++ }
  line(`120 requests: ${ok} accepted, ${limited} refused (429)`)
  expect(ok <= 90 && limited >= 30, 'one address is held to its limit')

  line('\n=== 4. the same flood from many addresses inside ONE IPv6 /64 (a new address on every request)')
  let ok2 = 0
  for (let i = 0; i < 200; i++) { const r = await req('POST', '/api/run', { ip: '2001:db8:1:1::' + (i + 1).toString(16) }); if (r.status === 200) ok2++ }
  line(`200 requests, each from a different address of the same /64: ${ok2} accepted`)
  expect(ok2 <= 90, 'a whole /64 is held to ONE address\'s limit')
  if (DB) {
    const grown = dbSize() - before
    const runs = ok + ok2
    line(`database file grew ${grown} bytes for ${runs} runs = ${(grown / Math.max(1, runs)).toFixed(0)} bytes per run (this counts SQLite's temporary journal file, so it overstates: about 1 KB per run once the journal is merged)`)
  }

  line('\n=== 5. one oversized upload (80 MB of JSON) to the idea form')
  const rssBefore = serverRssMB()
  const payload = Buffer.concat([Buffer.from('{"text":"'), Buffer.alloc(80 * 1024 * 1024, 97), Buffer.from('"}')])
  const t0 = Date.now()
  const r5 = await req('POST', '/api/suggest', { body: payload, ip: '8.8.4.4' })
  const rssAfter = serverRssMB()
  line(`status ${r5.status} after ${Date.now() - t0} ms; server memory ${rssBefore} MB before, ${rssAfter} MB just after`)
  expect(r5.status === 413, 'the body is refused (413) instead of being read')
  expect(rssAfter === '?' || Number(rssAfter) < 250, 'the server\'s memory does not balloon')
  expect((await req('GET', '/api/health')).status === 200, 'the server is still up')

  line('\n=== 6. hammering the cheap routes (start / miss / abandon), which once had no limit at all')
  const made = await req('POST', '/api/run', { ip: '6.6.6.6' })
  let runId = ''
  try { runId = JSON.parse(made.text).runId } catch { /* no run */ }
  let refused = 0
  for (let i = 0; i < 400; i++) { const r = await req('POST', `/api/run/${runId}/miss`, { body: { index: i % 7 }, ip: '6.6.6.6' }); if (r.status === 429) refused++ }
  line(`400 rapid /miss calls from one address: ${refused} refused (429)`)
  expect(refused > 0, 'a script cannot hammer /miss without limit')
  expect((await req('GET', '/api/health')).status === 200, 'the server is still up')

  line('(the per-network daily allowance of new runs, 300, cannot be shown from outside in a minute: the per-minute limit bites first; test/security.test.ts covers it)')
  line(bad ? `\n${bad} PROBLEM(S)` : '\nall attacks were stopped')
  process.exit(bad ? 1 : 0)
})().catch((e) => { console.error('SCRIPT FAILED', e); process.exit(1) })
