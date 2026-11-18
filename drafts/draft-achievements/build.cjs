// Builds index.html (the banner designs) and icons.html (the icons and the cabinet tab) from src/*.template.html and catalogue.json (the catalogue is put inside
// the pages so that they open from a file with no server).
//   node build.cjs
const fs = require('fs'), path = require('path')
const catalogue = JSON.parse(fs.readFileSync(path.join(__dirname, 'catalogue.json'), 'utf8'))
for (const [src, out] of [['page.template.html', 'index.html'], ['icons.template.html', 'icons.html']]) {
  const page = fs.readFileSync(path.join(__dirname, 'src', src), 'utf8').replace('/*CATALOGUE*/null', JSON.stringify(catalogue))
  fs.writeFileSync(path.join(__dirname, out), page)
  console.log(out + ' written (' + (page.length / 1024).toFixed(0) + ' KB), ' + catalogue.achievements.length + ' achievements')
}
