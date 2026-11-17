// Draft helper (read-only on the game): builds the data files the prototype page loads.
//   data/gems-data.js   the 200 gem picks
//   data/play-data.js   14 sample questions with (a large part of) their real answer lists, for the playtest
//   data/assets.js      the game's pixel fonts and the six existing tier icons, as data (so the page works when opened from a file)
const fs = require('fs'), path = require('path')
const ROOT = path.join(__dirname, '..'), REPO = path.join(ROOT, '..', '..'), LB = path.join(REPO, '..', 'list-build')
fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true })

// a name stored in all lower case (painite, taikonaut) is shown with a capital letter
const pretty = (n) => (n === n.toLowerCase() ? n.charAt(0).toUpperCase() + n.slice(1) : n)
const picks = JSON.parse(fs.readFileSync(path.join(ROOT, 'gems', 'gem-picks.json'), 'utf8'))
const gems = picks.map((p) => ({ n: p.n, id: p.questionId, cat: p.category, prompt: p.prompt, gem: pretty(p.gem), why: p.why, tier: p.storedTier, aliases: p.aliases, langs: p.langs, src: p.src, note: p.note, exc: !!p.exception }))
fs.writeFileSync(path.join(ROOT, 'data', 'gems-data.js'), 'window.GEMS = ' + JSON.stringify(gems) + '\n')

// ---- the same list as a plain markdown file
const byCat = {}; for (const g of gems) (byCat[g.cat] = byCat[g.cat] || []).push(g)
const NL = String.fromCharCode(10)
let md = ['# The 200 gem picks (draft)', '', 'One obscure gem answer per question (a Mythic answer: almost nobody would think of it). "Wikipedia languages" is how many language editions of Wikipedia have an article about it. Each description is based on the English Wikipedia article linked as its source. As a gem each would be worth 120 points.', ''].join(NL)
for (const [cat, list] of Object.entries(byCat)) {
  md += NL + '## ' + cat + ' (' + list.length + ')' + NL + NL + '| # | Question | Gem | Wikipedia languages | What it is |' + NL + '|---|---|---|---|---|' + NL
  for (const g of list) md += '| ' + g.n + ' | ' + g.prompt + ' | **' + g.gem + '** | ' + (g.langs == null ? (g.exc ? "the owner's own pick" : 'no article of its own') : g.langs) + ' | ' + g.why + (g.src ? ' ([source](' + g.src + '))' : '') + ' |' + NL
}
fs.writeFileSync(path.join(ROOT, 'gems', 'gem-picks.md'), md)

// ---- the playtest questions
const PLAY_IDS = ['animals-dog-breed', 'places-capital-city', 'science-mineral', 'music-instrument', 'games-video-game', 'places-island', 'movies-tv-series',
  'animals-mammal', 'history-philosopher', 'misc-occupation', 'science-chemical-element', 'games-console', 'animals-shark-species', 'places-country', 'food-soup']
const banks = []
for (const b of ['batch1', 'batch2', 'batch3', 'batch4']) banks.push(...JSON.parse(fs.readFileSync(path.join(LB, b, 'bank.json'), 'utf8')).questions)
const byId = new Map(banks.map((q) => [q.id, q]))
const play = []
for (const id of PLAY_IDS) {
  const q = byId.get(id), pk = picks.find((p) => p.questionId === id)
  if (!q || !pk) throw new Error('missing ' + id)
  const take = { 0: 500, 1: 500, 2: 500, 3: 500, 4: 700, 5: 700 }, seen = {}, list = []
  for (const a of q.answers) {
    seen[a.tier] = (seen[a.tier] || 0) + 1
    if (seen[a.tier] > take[a.tier] && a.name !== pk.gem) continue
    list.push([a.name, a.tier, (a.aliases || []).slice(0, 4)])
  }
  play.push({ id, cat: q.category, prompt: q.prompt, gem: pretty(pk.gem), why: pk.why, answers: list })
}
fs.writeFileSync(path.join(ROOT, 'data', 'play-data.js'), 'window.PLAY = ' + JSON.stringify(play) + '\n')

// ---- fonts + tier icons as data
const pub = path.join(REPO, 'packages', 'web', 'public')
const b64 = (f) => fs.readFileSync(f).toString('base64')
const assets = {
  fonts: {
    'Silkscreen-400': b64(path.join(pub, 'fonts', 'Silkscreen-Regular.ttf')), 'Silkscreen-700': b64(path.join(pub, 'fonts', 'Silkscreen-Bold.ttf')),
    'PixelifyFix-400': b64(path.join(pub, 'fonts', 'PixelifyFix-400.ttf')), 'PixelifyFix-500': b64(path.join(pub, 'fonts', 'PixelifyFix-500.ttf')),
    'PixelifyFix-600': b64(path.join(pub, 'fonts', 'PixelifyFix-600.ttf')), 'PixelifyFix-700': b64(path.join(pub, 'fonts', 'PixelifyFix-700.ttf')),
  },
  tierIcons: [0, 1, 2, 3, 4, 5].map((i) => 'data:image/png;base64,' + b64(path.join(pub, 'assets', `gem${i}.png`))),
}
fs.writeFileSync(path.join(ROOT, 'data', 'assets.js'), 'window.ASSETS = ' + JSON.stringify(assets) + '\n')
const kb = (f) => (fs.statSync(path.join(ROOT, 'data', f)).size / 1024).toFixed(0) + ' KB'
console.log('gems-data.js', kb('gems-data.js'), '| play-data.js', kb('play-data.js'), `(${play.length} questions, ${play.reduce((s, q) => s + q.answers.length, 0)} answers)`, '| assets.js', kb('assets.js'))
