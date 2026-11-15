// one self-contained page from index.html + its scripts:  node bundle.cjs <out.html>
const fs = require('fs'), path = require('path')
const root = path.join(__dirname, '..'), out = process.argv[2]
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
const scripts = []
html = html.replace(/<script src="([^"]+)"><\/script>\s*/g, (m, src) => { scripts.push(fs.readFileSync(path.join(root, src), 'utf8')); return '' })
// the skeleton the host adds supplies doctype, html, head and body
html = html.replace(/<!doctype html>\s*<html[^>]*><head>[\s\S]*?<\/head>/i, (m) => m.replace(/<!doctype html>\s*<html[^>]*><head>/i, '').replace(/<\/head>$/i, '').replace(/<meta charset[^>]*>\s*/i, '').replace(/<meta name="viewport"[^>]*>\s*/i, ''))
html = html.replace(/<body>/i, '').replace(/<\/body>\s*<\/html>\s*$/i, '')
const js = scripts.join('\n;\n')
if (/<\/script/i.test(js)) throw new Error('a script contains </script')
fs.writeFileSync(out, html.trim() + '\n<script>\n' + js + '\n</script>\n')
console.log('wrote', out, (fs.statSync(out).size / 1024).toFixed(0) + ' KB')
