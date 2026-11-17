// Builds index.html from src/page.template.html and catalogue.json (the catalogue is put inside the page so that it opens from a file with no server).
//   node build.cjs
const fs = require('fs'), path = require('path')
const catalogue = JSON.parse(fs.readFileSync(path.join(__dirname, 'catalogue.json'), 'utf8'))
const page = fs.readFileSync(path.join(__dirname, 'src', 'page.template.html'), 'utf8').replace('/*CATALOGUE*/null', JSON.stringify(catalogue))
fs.writeFileSync(path.join(__dirname, 'index.html'), page)
console.log('index.html written (' + (page.length / 1024).toFixed(0) + ' KB), ' + catalogue.achievements.length + ' achievements')
