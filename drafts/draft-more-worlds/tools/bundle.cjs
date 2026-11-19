// bundle.cjs: builds the one-file review page (index.html) and the publishable copy (artifact.html) from src/index.template.html and the scripts in src/.
//   node tools/bundle.cjs
const fs = require('fs'), path = require('path')
const root = path.join(__dirname, '..')
const order = ['gfx.js', 'scenelib.js', 'scenes_a.js', 'scenes_b.js', 'scenes_c.js', 'scenes_d.js', 'viewer.js']
const js = order.map((f) => '/* ' + f + ' */\n' + fs.readFileSync(path.join(root, 'src', f), 'utf8')).join('\n;\n')
const html = fs.readFileSync(path.join(root, 'src', 'index.template.html'), 'utf8').replace('<!--SCRIPTS-->', '<script>\n' + js.replace(/<\/script/gi, '<\\/script') + '\n</script>')
fs.writeFileSync(path.join(root, 'index.html'), html)
console.log('index.html', (html.length / 1024).toFixed(0) + ' KB')

// the published copy: the page content without the document skeleton (the Artifact tool adds its own)
const frag = html
  .replace(/<!doctype html>\s*/i, '').replace(/<html[^>]*>\s*/i, '').replace(/<head>\s*/i, '').replace(/<\/head>\s*/i, '')
  .replace(/<body>\s*/i, '').replace(/<\/body>\s*/i, '').replace(/<\/html>\s*/i, '')
  .replace(/<meta charset[^>]*>\s*/i, '').replace(/<meta name="viewport"[^>]*>\s*/i, '')
  .replace('<title>More Worlds Draft</title>', '<title>More Worlds Draft</title>\n<meta name="claude:viewport-fit-sides" content="cover">')
fs.writeFileSync(path.join(root, 'artifact.html'), frag)
console.log('artifact.html', (frag.length / 1024).toFixed(0) + ' KB')
