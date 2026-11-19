/**
 * Batch 30: a third top-up (Food) for the last 228 questions towards 1,000 (owner, 18 Nov 2026). Spirits and wines are not instances of their class in Wikidata
 * (Batch 29 came out thin), so this batch uses what Wikidata does hold in bulk: beer brands and restaurant chains by country, wine appellations, coffee brands,
 * energy drinks.
 * Build with: npx tsx src/expand/newq.ts --batch batch30 --out C:/Users/weibi/minitude/list-build/batch30
 */
import type { NewQuestion } from './newq'
import { mk } from './batch8'

const an = (w: string): string => (/^[aeiou]/i.test(w) ? 'an' : 'a')

/** a beer brand of a country (country of origin or country) */
const BEER = (id: string, adj: string, place: string, country: string, minSignal: number, mustHave: string[]): NewQuestion =>
  mk('Food', {
    id: `food-beer-${id}`, prompt: `Name ${an(adj)} ${adj} beer.`, what: `any beer brand from ${place}, past or present, written with or without the word beer`,
    not: 'Breweries that are not a beer brand, beer styles and beers of other countries do not count.',
    source: `Wikidata beer brands whose country is ${place}, known in at least ${minSignal} languages.`,
    pattern: `?item wdt:P31/wdt:P279* wd:Q15075508 . { ?item wdt:P17 wd:${country} } UNION { ?item wdt:P495 wd:${country} } .`, minSignal, mustHave,
  })

/** a restaurant chain of a country */
const CHAIN = (id: string, adj: string, place: string, country: string, minSignal: number, mustHave: string[]): NewQuestion =>
  mk('Food', {
    id: `food-restaurant-chain-${id}`, prompt: `Name ${an(adj)} ${adj} restaurant chain.`, what: `any restaurant, fast-food or coffee chain that began in ${place}, past or present`,
    not: 'Single restaurants and chains from other countries do not count.',
    source: `Wikidata restaurant chains of ${place}, known in at least ${minSignal} languages.`,
    pattern: `?item wdt:P31/wdt:P279* wd:Q18534542 . { ?item wdt:P17 wd:${country} } UNION { ?item wdt:P495 wd:${country} } .`, minSignal, mustHave,
  })

export const BATCH: NewQuestion[] = [
  BEER('german', 'German', 'Germany', 'Q183', 2, ['Beck\'s', 'Warsteiner', 'Bitburger', 'Krombacher', 'Paulaner', 'Erdinger', 'Löwenbräu', 'Hofbräu', 'Augustiner', 'Spaten', 'Radeberger', 'Veltins', 'Franziskaner', 'Weihenstephaner', 'Jever', 'Holsten']),
  BEER('belgian', 'Belgian', 'Belgium', 'Q31', 2, ['Stella Artois', 'Leffe', 'Hoegaarden', 'Duvel', 'Chimay', 'Westmalle', 'Orval', 'Rochefort', 'Delirium Tremens', 'Jupiler', 'Kwak', 'La Chouffe', 'Grimbergen', 'Westvleteren', 'Maredsous', 'Kriek']),
  BEER('american', 'American', 'the United States', 'Q30', 2, ['Budweiser', 'Coors', 'Miller', 'Blue Moon', 'Samuel Adams', 'Sierra Nevada Pale Ale', 'Pabst Blue Ribbon', 'Michelob', 'Yuengling', 'Schlitz', 'Busch', 'Rolling Rock', 'Lagunitas IPA', 'Bud Light', 'Coors Light', 'Natural Light']),
  BEER('british', 'British', 'the United Kingdom', 'Q145', 2, ['Guinness', 'Newcastle Brown Ale', 'Boddingtons', 'Carling', 'John Smith\'s', 'Tennent\'s', 'Fuller\'s London Pride', 'Old Speckled Hen', 'Bass', 'Greene King IPA', 'Hobgoblin', 'Spitfire', 'Tetley\'s', 'Theakston Old Peculier', 'BrewDog Punk IPA', 'Caffrey\'s']),
  BEER('japanese', 'Japanese', 'Japan', 'Q17', 2, ['Asahi Super Dry', 'Kirin Ichiban', 'Sapporo', 'Suntory', 'Yebisu', 'Orion', 'Hitachino Nest', 'Kirin', 'Asahi', 'Suntory The Premium Malt\'s', 'Coedo', 'Echigo Beer', 'Kirin Lager', 'Sapporo Black Label']),
  BEER('czech', 'Czech', 'the Czech Republic', 'Q213', 2, ['Pilsner Urquell', 'Budweiser Budvar', 'Staropramen', 'Kozel', 'Gambrinus', 'Krušovice', 'Bernard', 'Starobrno', 'Radegast', 'Svijany', 'Velkopopovický Kozel', 'Zlatopramen', 'Černá Hora', 'Březňák']),
  BEER('mexican', 'Mexican', 'Mexico', 'Q96', 2, ['Corona', 'Modelo', 'Dos Equis', 'Tecate', 'Pacífico', 'Sol', 'Victoria', 'Bohemia', 'Negra Modelo', 'Indio', 'Montejo', 'Carta Blanca', 'Superior', 'Noche Buena']),
  BEER('dutch', 'Dutch', 'the Netherlands', 'Q55', 2, ['Heineken', 'Amstel', 'Grolsch', 'Bavaria', 'Brand', 'Oranjeboom', 'Hertog Jan', 'La Trappe', 'Gulpener', 'Jopen', 'Texels', 'Dommelsch', 'Bokrijk']),
  BEER('irish', 'Irish', 'Ireland', 'Q27', 2, ['Guinness', 'Smithwick\'s', 'Harp Lager', 'Murphy\'s Irish Stout', 'Beamish', 'Kilkenny', 'Caffrey\'s', 'O\'Hara\'s', 'Franciscan Well', 'Galway Hooker', 'Porterhouse', 'Hop House 13']),
  BEER('canadian', 'Canadian', 'Canada', 'Q16', 2, ['Molson Canadian', 'Labatt Blue', 'Moosehead', 'Sleeman', 'Alexander Keith\'s', 'Kokanee', 'Red Baron', 'Big Rock', 'Steam Whistle', 'Unibroue', 'La Fin du Monde', 'Okanagan Spring', 'Sleeman Honey Brown', 'Rickard\'s']),
  CHAIN('american', 'American', 'the United States', 'Q30', 3, ['McDonald\'s', 'Burger King', 'Starbucks', 'Subway', 'KFC', 'Wendy\'s', 'Taco Bell', 'Pizza Hut', 'Domino\'s', 'Chick-fil-A', 'Dunkin\'', 'Chipotle', 'Applebee\'s', 'Denny\'s', 'IHOP', 'Olive Garden', 'In-N-Out Burger', 'Shake Shack']),
  CHAIN('british', 'British', 'the United Kingdom', 'Q145', 2, ['Pret a Manger', 'Wetherspoons', 'Nando\'s', 'Greggs', 'Wagamama', 'Costa Coffee', 'Pizza Express', 'Wimpy', 'Leon', 'Itsu', 'Prezzo', 'Café Rouge', 'Harvester', 'Frankie & Benny\'s']),
  CHAIN('japanese', 'Japanese', 'Japan', 'Q17', 2, ['Yoshinoya', 'Sukiya', 'Matsuya', 'CoCo Ichibanya', 'MOS Burger', 'Mister Donut', 'Saizeriya', 'Gusto', 'Ippudo', 'Ichiran', 'Kura Sushi', 'Sushiro', 'Skylark', 'Tully\'s Coffee']),
  CHAIN('canadian', 'Canadian', 'Canada', 'Q16', 2, ['Tim Hortons', 'A&W Canada', 'Swiss Chalet', 'Harvey\'s', 'Boston Pizza', 'Second Cup', 'Pizza Pizza', 'The Keg', 'Montana\'s', 'Mr. Sub', 'East Side Mario\'s', 'Cora']),
  CHAIN('australian', 'Australian', 'Australia', 'Q408', 2, ['Hungry Jack\'s', 'Red Rooster', 'Oporto', 'Boost Juice', 'Grill\'d', 'Guzman y Gomez', 'Zambrero', 'Muffin Break', 'Michel\'s Patisserie', 'Gloria Jean\'s', 'Crust Gourmet Pizza', 'Nando\'s']),
  mk('Food', {
    id: 'food-french-wine-appellation', prompt: 'Name a French wine appellation.', what: 'any French appellation d\'origine contrôlée (AOC) or protected wine region, such as Chablis, Sancerre or Pomerol',
    not: 'Wineries, grape varieties and appellations of other countries do not count.', source: 'Wikidata French protected geographic appellations, known in at least 2 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q1565828 .', minSignal: 2,
    mustHave: ['Chablis', 'Sancerre', 'Pomerol', 'Saint-Émilion', 'Médoc', 'Margaux', 'Pauillac', 'Sauternes', 'Beaujolais', 'Châteauneuf-du-Pape', 'Chinon', 'Côtes du Rhône', 'Gevrey-Chambertin', 'Meursault', 'Pouilly-Fumé', 'Vouvray'],
  }),
  mk('Food', {
    id: 'food-spanish-denominacion-de-origen', prompt: 'Name a Spanish wine or food denomination of origin.', what: 'any Spanish Denominación de Origen (DO) such as Rioja, Ribera del Duero or Jamón de Guijuelo',
    not: 'Wineries and designations of other countries do not count.', source: 'Wikidata Spanish quality designations (DO), known in at least 2 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q3139487 .', minSignal: 2,
    mustHave: ['Rioja', 'Ribera del Duero', 'Rías Baixas', 'Priorat', 'Jerez-Xérès-Sherry', 'Cava', 'Rueda', 'Penedès', 'Navarra', 'Toro', 'Jumilla', 'Montilla-Moriles', 'Manchego', 'Jamón de Teruel', 'Albariño', 'La Mancha'],
  }),
  mk('Food', {
    id: 'food-coffee-brand', prompt: 'Name a coffee brand.', what: 'any coffee brand or coffee roaster, from any country',
    not: 'Coffee drinks and coffee shop chains do not count.', source: 'Wikidata coffee brands, known in at least 2 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q111651093 .', minSignal: 2,
    mustHave: ['Nescafé', 'Lavazza', 'Illy', 'Maxwell House', 'Folgers', 'Starbucks', 'Jacobs', 'Tchibo', 'Segafredo', 'Kenco', 'Douwe Egberts', 'Peet\'s Coffee', 'Blue Bottle Coffee', 'Dunkin\'', 'Nespresso', 'Melitta'],
  }),
  mk('Food', {
    id: 'food-energy-drink', prompt: 'Name an energy drink.', what: 'any energy drink brand',
    not: 'Soft drinks and sports drinks that are not energy drinks do not count.', source: 'Wikidata energy drinks, known in at least 2 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q215754 .', minSignal: 2,
    mustHave: ['Red Bull', 'Monster Energy', 'Rockstar', 'Relentless', 'Lucozade', 'Burn', 'V', 'Prime', 'NOS', 'Full Throttle', 'Boost', 'Celsius', 'Bang Energy', 'Guarana Antarctica', 'Mountain Dew Kickstart', 'Lipovitan'],
  }),
]
