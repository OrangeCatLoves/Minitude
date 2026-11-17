const c = require('../gems/candidates.json')
const [from, to, n] = process.argv.slice(2).map(Number)
c.slice(from, to).forEach((q, k) => {
  const names = q.candidates.filter((x) => x.name.length <= 34).slice(0, n || 10).map((x) => x.name + (x.signal >= 0 ? '~' + x.signal : '')).join(' · ')
  console.log(`${from + k} ${q.id.slice(0, 40)} | ${q.prompt.replace(/^Name /, '')} [${q.mythic}]\n   ${names}`)
})
