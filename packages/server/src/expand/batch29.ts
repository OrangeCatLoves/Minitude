/**
 * Batch 29: a second top-up for the last 228 questions towards 1,000 (owner, 18 Nov 2026). Food came out shortest after Batches 23 to 28 (most "cuisine" and
 * "cheese of a country" lists have fewer than 50 answers in Wikidata), so this batch adds drinks and dishes that are classes of their own: spirits, wines,
 * ciders, chocolate and ice cream brands, puddings, pancakes, kebabs.
 * Build with: npx tsx src/expand/newq.ts --batch batch29 --out C:/Users/weibi/minitude/list-build/batch29
 */
import type { NewQuestion } from './newq'
import { mk } from './batch8'

const an = (w: string): string => (/^[aeiou]/i.test(w) ? 'an' : 'a')

/** things (instances or kinds) of a Wikidata class */
const CLS = (id: string, noun: string, what: string, not: string, cls: string, minSignal: number, mustHave: string[], extra: Partial<NewQuestion> = {}): NewQuestion =>
  mk('Food', {
    id: `food-${id}`, prompt: `Name ${an(noun)} ${noun}.`, what, not,
    source: `Wikidata items of the class ${noun} (brands, kinds and named examples), known in at least ${minSignal} languages.`,
    pattern: `?item wdt:P31/wdt:P279* wd:${cls} .`, minSignal, mustHave, ...extra,
  })

export const BATCH: NewQuestion[] = [
  CLS('vodka', 'vodka', 'any vodka brand or kind of vodka', 'Other spirits and cocktails do not count.', 'Q374', 3,
    ['Absolut Vodka', 'Smirnoff', 'Grey Goose', 'Belvedere', 'Stolichnaya', 'Ciroc', 'Ketel One', 'Skyy', 'Finlandia', 'Russian Standard', 'Tito\'s Handmade Vodka', 'Svedka', 'Wyborowa', 'Żubrówka']),
  CLS('gin', 'gin', 'any gin brand or kind of gin', 'Other spirits and cocktails do not count.', 'Q959362', 3,
    ['Gordon\'s', 'Tanqueray', 'Bombay Sapphire', 'Hendrick\'s', 'Beefeater', 'Plymouth Gin', 'Sipsmith', 'Monkey 47', 'Bulldog', 'Seagram\'s', 'Sloe gin', 'Old Tom gin', 'Genever', 'London dry gin']),
  CLS('rum', 'rum', 'any rum brand or kind of rum', 'Other spirits and cocktails do not count.', 'Q83376', 3,
    ['Bacardi', 'Captain Morgan', 'Havana Club', 'Mount Gay', 'Appleton Estate', 'Kraken', 'Malibu', 'Diplomático', 'Don Papa', 'Zacapa', 'Cachaça', 'Rhum agricole', 'Bundaberg Rum', 'Wray & Nephew']),
  CLS('tequila', 'tequila or mezcal', 'any tequila or mezcal brand or kind', 'Other spirits and cocktails do not count.', 'Q122195', 3,
    ['Jose Cuervo', 'Patrón', 'Don Julio', 'Casamigos', 'Herradura', 'Sauza', 'Olmeca', 'Cazadores', 'Espolòn', 'Mezcal', 'Clase Azul', 'El Jimador', 'Tequila Reposado', 'Tequila Añejo']),
  CLS('brandy', 'brandy or cognac', 'any brandy, cognac, armagnac or similar spirit made from wine or fruit, by brand or kind', 'Whisky, rum and liqueurs do not count.', 'Q146470', 3,
    ['Hennessy', 'Rémy Martin', 'Courvoisier', 'Martell', 'Cognac', 'Armagnac', 'Calvados', 'Pisco', 'Metaxa', 'Grappa', 'Slivovitz', 'Kirsch', 'Fundador', 'Torres']),
  CLS('cider', 'cider', 'any cider brand or kind of cider or perry', 'Beers and wines do not count.', 'Q167296', 3,
    ['Strongbow', 'Magners', 'Bulmers', 'Angry Orchard', 'Kopparberg', 'Rekorderlig', 'Thatchers', 'Woodchuck', 'Somersby', 'Stella Artois Cidre', 'Perry', 'Sidra', 'Scrumpy', 'Aspall']),
  CLS('whisky', 'whisky or whiskey', 'any whisky or whiskey brand or kind, from any country', 'Other spirits and cocktails do not count.', 'Q281', 3,
    ['Johnnie Walker', 'Jack Daniel\'s', 'Jameson', 'Glenfiddich', 'The Macallan', 'Chivas Regal', 'Jim Beam', 'Maker\'s Mark', 'Bushmills', 'Laphroaig', 'Yamazaki', 'Glenlivet', 'Talisker', 'Lagavulin', 'Ardbeg', 'Bourbon whiskey', 'Single malt whisky', 'Scotch whisky']),
  CLS('sparkling-wine', 'sparkling wine', 'any sparkling wine, champagne house, or kind of sparkling wine', 'Still wines and spirits do not count.', 'Q321263', 3,
    ['Champagne', 'Prosecco', 'Cava', 'Moët & Chandon', 'Dom Pérignon', 'Veuve Clicquot', 'Bollinger', 'Krug', 'Cristal', 'Asti', 'Lambrusco', 'Crémant', 'Franciacorta', 'Sekt', 'Taittinger', 'Laurent-Perrier']),
  CLS('fortified-wine', 'fortified wine', 'any fortified wine, such as port, sherry, madeira, marsala or vermouth, by kind or brand', 'Still wines and spirits do not count.', 'Q722338', 3,
    ['Port wine', 'Sherry', 'Madeira wine', 'Marsala wine', 'Vermouth', 'Vin Santo', 'Muscat', 'Banyuls', 'Commandaria', 'Tokaji', 'Malmsey', 'Amontillado', 'Fino', 'Oloroso', 'Cinzano', 'Martini']),
  CLS('chocolate-brand', 'chocolate brand', 'any chocolate maker or chocolate brand', 'Cocoa farms and other sweets do not count.', 'Q131620254', 3,
    ['Cadbury', 'Hershey\'s', 'Lindt', 'Toblerone', 'Godiva', 'Ghirardelli', 'Ferrero Rocher', 'Milka', 'Green & Black\'s', 'Ritter Sport', 'Nestlé', 'Guylian', 'Callebaut', 'Valrhona', 'Mars', 'Côte d\'Or']),
  CLS('ice-cream-brand', 'ice cream brand', 'any ice cream maker or ice cream brand', 'Other desserts do not count.', 'Q124804323', 3,
    ['Ben & Jerry\'s', 'Häagen-Dazs', 'Magnum', 'Cornetto', 'Baskin-Robbins', 'Breyers', 'Walls', 'Carte d\'Or', 'Dairy Queen', 'Cold Stone Creamery', 'Mövenpick', 'Blue Bell', 'Algida', 'Kwality Walls', 'Wall\'s', 'Haagen-Dazs']),
  CLS('pudding', 'pudding', 'any pudding, sweet or savoury, such as rice pudding, Yorkshire pudding or black pudding', 'Cakes and pies do not count.', 'Q9053', 3,
    ['Christmas pudding', 'Yorkshire pudding', 'Rice pudding', 'Black pudding', 'Sticky toffee pudding', 'Bread pudding', 'Bread and butter pudding', 'Banana pudding', 'Chocolate pudding', 'Plum pudding', 'Spotted dick', 'Panna cotta', 'Tapioca pudding', 'Crème brûlée']),
  CLS('pancake', 'pancake', 'any pancake, crêpe, blini, griddle cake or similar flat cake from any country, by its name', 'Waffles, breads and cakes do not count.', 'Q44541', 2,
    ['Crêpe', 'Blini', 'Dosa', 'Okonomiyaki', 'Pannekoek', 'Palatschinke', 'American pancake', 'Injera', 'Poffertjes', 'Pajeon', 'Johnnycake', 'Buttermilk pancake', 'Scotch pancake', 'Bánh xèo']),
  CLS('kebab', 'kebab', 'any kebab, from any country, by its name', 'Other meat dishes do not count.', 'Q179010', 2,
    ['Shish kebab', 'Doner kebab', 'Shawarma', 'Adana kebab', 'Seekh kebab', 'Gyros', 'Souvlaki', 'Tikka', 'Satay', 'Kofta', 'Shashlik', 'Iskender kebab', 'Chapli kebab', 'Kakori kebab', 'Kebab koobideh']),
]
