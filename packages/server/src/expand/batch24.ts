/**
 * Batch 24: Animals & Nature and Food, for the last 228 questions towards 1,000 that the owner asked for on 18 Nov 2026 (docs/GROWTH_TO_1000.md).
 * A spread: animals found only in one country, more groups of living things, national parks of seven regions, cheeses, breweries, wineries and
 * distilleries of several countries, and more national cuisines.
 * Build with: npx tsx src/expand/newq.ts --batch batch24 --out C:/Users/weibi/minitude/list-build/batch24
 */
import type { NewQuestion } from './newq'
import { namedBelow, TAXON } from './batch6'
import { DISH } from './batch18'
import { mk } from './batch8'
import { anyOf, NOT_EXTINCT, notDescribedAs, strip } from './recipes'

/** Wikidata's one-line description of an animal species (plants that are endemic too are left out by it) */
const ANIMAL = /(?:\bmammal|\bbird|\breptile|\bamphibian|\bfish|\bfrog|\btoad|\blizard|\bsnake|\bgecko|\bskink|\bturtle|\btortoise|\bcrocodil|\bsalamander|\bnewt|\binsect|\bbutterfl|\bmoth|\bbeetle|\bbee\b|\bant\b|\bwasp|\bdragonfly|\bspider|\bscorpion|\bcrab|\bcrayfish|\bsnail|\bmollus|\bshark|\bray\b|\beel|\bprimate|\bmonkey|\blemur|\bmarsupial|\brodent|\bbat\b|\bdeer|\bantelope|\beagle|\bowl|\bparrot|\bdolphin|\bwhale|\bseal\b|\bhawk|\bfalcon|\bhornbill|\bpheasant|\bpigeon|\bcuckoo|\bwren|\bfinch|\bwarbler|\banimal|\bchameleon|\bgibbon|\bmacaque|\btarsier|\bsquirrel|\bhare|\brabbit|\bmouse|\brat\b|\bshrew|\bhedgehog|\bkangaroo|\bwallaby|\bpossum|\bwombat|\bkoala|\bechidna|\bplatypus|\bpenguin|\bkiwi|\bduck|\bgoose|\bswan|\bheron|\bcrane|\brail\b|\bpetrel|\balbatross|\btern\b|\bgull\b)/i
/** a description that says it is a plant or a fungus: not an animal, whatever else it says */
const PLANTISH = /\b(plants?|trees?|shrubs?|ferns?|mosses|moss|orchids?|grass(es)?|flowering|fungus|fungi|lichens?|alga|algae|vines?|herbs?)\b/i

const an = (w: string): string => (/^[aeiou]/i.test(w) ? 'an' : 'a')
export const GROUP = (id: string, prompt: string, what: string, roots: string[], min: number, subject: RegExp, mustHave: string[]): NewQuestion =>
  mk('Animals & Nature', {
    id: `animals-${id}`, prompt, what, not: 'Animals or plants of other groups do not count.',
    source: `Wikidata taxa below the group, with an English common name, known in at least ${min} languages.`,
    fetch: namedBelow(roots, min), commonNames: true, minSignal: min, skip: TAXON(subject), mustHave,
  })

/** animals that live in the wild only in one country (Wikidata "endemic to"), by their English common names */
const ENDEMIC = (id: string, place: string, country: string, mustHave: string[]): NewQuestion =>
  mk('Animals & Nature', {
    id: `animals-only-in-${id}`, prompt: `Name an animal that is found in the wild only in ${place}.`, what: `any wild animal that lives naturally only in ${place} (an endemic species or subspecies), by its common name`,
    not: `Animals that also live in other countries do not count.`,
    source: `Wikidata animals whose "endemic to" is ${place}, with an English common name, known in at least 2 languages.`,
    pattern: `?item wdt:P183 wd:${country} . ?item wdt:P1843 ?cnx . FILTER(lang(?cnx) = "en") ${NOT_EXTINCT}`, commonNames: true, minSignal: 2,
    skip: anyOf(TAXON(/^animals?$/i), notDescribedAs(ANIMAL), (c) => !!c.desc && PLANTISH.test(c.desc)), mustHave,
  })

export const PARK = (id: string, place: string, countries: string[], minSignal: number, mustHave: string[]): NewQuestion =>
  mk('Animals & Nature', {
    id: `animals-national-park-${id}`, prompt: `Name a national park in ${place}.`, what: `any national park (or similar protected park) in ${place}, written with or without the words National Park`,
    not: 'Parks in other countries do not count.',
    source: `Wikidata national parks in the countries, known in at least ${minSignal} languages.`,
    pattern: `{ ?item wdt:P31/wdt:P279* wd:Q46169 } UNION { ?item wdt:P31/wdt:P279* wd:Q483423 } . VALUES ?c { ${countries.map((c) => 'wd:' + c).join(' ')} } ?item wdt:P17 ?c .`, minSignal, mustHave,
    alsoWritten: strip(/ National Park$/i),
  })

const DOG = (id: string, adj: string, country: string, mustHave: string[]): NewQuestion =>
  mk('Animals & Nature', {
    id: `animals-dog-${id}`, prompt: `Name ${an(adj)} ${adj} dog breed.`, what: `any dog breed that originated in ${adj === 'British' ? 'the United Kingdom' : adj === 'American' ? 'the United States' : adj}`,
    not: 'Breeds from other countries do not count.',
    source: 'Wikidata dog breeds by country of origin, known in at least 2 languages.',
    pattern: `?item wdt:P31/wdt:P279* wd:Q39367 . ?item wdt:P495 wd:${country} .`, minSignal: 2, mustHave,
  })

const CHEESE = (id: string, adj: string, country: string, mustHave: string[]): NewQuestion =>
  mk('Food', {
    id: `food-cheese-${id}`, prompt: `Name ${an(adj)} ${adj} cheese.`, what: `any cheese that originated in ${adj === 'British' ? 'the United Kingdom' : adj === 'Dutch' ? 'the Netherlands' : adj === 'Swiss' ? 'Switzerland' : adj === 'French' ? 'France' : adj === 'Italian' ? 'Italy' : 'Spain'}, written with or without the word cheese`,
    not: 'Cheeses from other countries do not count.',
    source: 'Wikidata cheeses by country of origin, known in at least 2 languages.',
    pattern: `?item wdt:P31/wdt:P279* wd:Q10943 . ?item wdt:P495 wd:${country} .`, minSignal: 2, mustHave,
    alsoWritten: strip(/ cheese$/i),
  })

export const MAKER = (id: string, noun: string, place: string, cls: string, where: string, minSignal: number, mustHave: string[]): NewQuestion =>
  mk('Food', {
    id: `food-${id}`, prompt: `Name ${an(noun)} ${noun} in ${place}.`, what: `any ${noun} in ${place}, written with or without the word ${noun}`,
    not: `Those of other countries do not count.`,
    source: `Wikidata items of the class in ${place}, known in at least ${minSignal} languages.`,
    pattern: `?item wdt:P31/wdt:P279* wd:${cls} . ?item ${where}`, minSignal, mustHave,
  })

const RAW: NewQuestion[] = [
  // ================================================================ Animals & Nature
  ENDEMIC('australia', 'Australia', 'Q408', ['Koala', 'Platypus', 'Tasmanian devil', 'Red kangaroo', 'Emu', 'Short-beaked echidna', 'Common wombat', 'Sugar glider', 'Quokka', 'Eastern grey kangaroo', 'Bilby', 'Frilled lizard', 'Thorny devil', 'Numbat']),
  ENDEMIC('madagascar', 'Madagascar', 'Q1019', ['Ring-tailed lemur', 'Aye-aye', 'Fossa', 'Panther chameleon', 'Indri', 'Verreaux\'s sifaka', 'Tomato frog', 'Brown mouse lemur', 'Giraffe weevil', 'Red ruffed lemur', 'Parson\'s chameleon', 'Golden mantella']),
  ENDEMIC('new-zealand', 'New Zealand', 'Q664', ['Kiwi', 'Kakapo', 'Kea', 'Takahē', 'Tuatara', 'Weka', 'Tūī', 'New Zealand fantail', 'Hector\'s dolphin', 'Kākā', 'Yellow-eyed penguin', 'Morepork']),
  ENDEMIC('china', 'China', 'Q148', ['Giant panda', 'Golden snub-nosed monkey', 'Chinese alligator', 'Chinese giant salamander', 'Chinese water deer', 'Père David\'s deer', 'Crested ibis', 'Chinese pangolin', 'Chinese tree shrew', 'Yangtze finless porpoise', 'Red panda']),
  ENDEMIC('philippines', 'the Philippines', 'Q928', ['Philippine tarsier', 'Philippine eagle', 'Tamaraw', 'Philippine crocodile', 'Philippine cockatoo', 'Philippine flying lemur', 'Philippine deer', 'Visayan warty pig', 'Palawan peacock-pheasant', 'Philippine tarsier']),
  ENDEMIC('indonesia', 'Indonesia', 'Q252', ['Komodo dragon', 'Babirusa', 'Javan rhinoceros', 'Sumatran tiger', 'Anoa', 'Javan hawk-eagle', 'Bali myna', 'Sumatran rhinoceros', 'Javan gibbon', 'Celebes crested macaque']),
  ENDEMIC('mexico', 'Mexico', 'Q96', ['Axolotl', 'Vaquita', 'Volcano rabbit', 'Mexican wolf', 'Xoloitzcuintle', 'Cozumel raccoon', 'Mexican beaded lizard', 'Mexican redknee tarantula', 'Tehuantepec jackrabbit', 'Guadalupe fur seal']),
  ENDEMIC('brazil', 'Brazil', 'Q155', ['Golden lion tamarin', 'Hyacinth macaw', 'Spix\'s macaw', 'Maned sloth', 'Brazilian porcupine', 'Brown howler', 'Lear\'s macaw', 'Muriqui', 'Pink river dolphin', 'Blond capuchin']),
  ENDEMIC('india', 'India', 'Q668', ['Lion-tailed macaque', 'Nilgiri tahr', 'Indian giant squirrel', 'Malabar grey hornbill', 'Great Indian bustard', 'Indian pangolin', 'Nilgiri langur', 'Malabar civet', 'Malabar giant squirrel', 'Asiatic lion']),
  ENDEMIC('cuba', 'Cuba', 'Q241', ['Bee hummingbird', 'Cuban crocodile', 'Cuban solenodon', 'Cuban tody', 'Cuban hutia', 'Cuban boa', 'Cuban trogon', 'Zapata wren', 'Cuban parakeet', 'Cuban painted snail']),
  GROUP('frog-toad', 'Name a frog or toad.', 'any frog, toad or tree frog by its common name', ['Q6408', 'Q55372', 'Q53750'], 3, /^(frogs?|toads?)$/i,
    ['American bullfrog', 'Common frog', 'Cane toad', 'Red-eyed tree frog', 'Poison dart frog', 'Common toad', 'Green tree frog', 'Wood frog', 'Natterjack toad', 'Goliath frog', 'Glass frog', 'Pacman frog', 'Strawberry poison-dart frog', 'Golden poison frog']),
  GROUP('hawk-eagle', 'Name a hawk, eagle or kite.', 'any hawk, eagle, kite, buzzard or harrier by its common name', ['Q25510'], 3, /^(hawks?|eagles?|kites?|buzzards?|harriers?)$/i,
    ['Bald eagle', 'Golden eagle', 'Red-tailed hawk', 'Harpy eagle', 'Cooper\'s hawk', 'Red kite', 'White-tailed eagle', 'Common buzzard', 'Philippine eagle', 'Steller\'s sea eagle', 'Martial eagle', 'Northern goshawk', 'Eurasian sparrowhawk', 'Osprey']),
  GROUP('beetle', 'Name a beetle.', 'any beetle (ladybird, weevil, stag beetle, scarab or similar) by its common name', ['Q22671'], 25, /^(beetles?|ladybirds?|ladybugs?)$/i,
    ['Ladybird', 'Stag beetle', 'Dung beetle', 'Goliath beetle', 'Hercules beetle', 'Colorado potato beetle', 'Firefly', 'Rhinoceros beetle', 'Japanese beetle', 'Cockchafer', 'Death watch beetle', 'Longhorn beetle', 'Scarab beetle', 'Asian long-horned beetle']),
  GROUP('oak', 'Name an oak.', 'any oak by its common name', ['Q12004'], 3, /^oaks?$/i,
    ['English oak', 'White oak', 'Red oak', 'Cork oak', 'Holm oak', 'Live oak', 'Sessile oak', 'Pin oak', 'Black oak', 'Turkey oak', 'Bur oak', 'Scarlet oak', 'Chestnut oak', 'Pedunculate oak']),
  GROUP('maple', 'Name a maple.', 'any maple by its common name', ['Q42292'], 3, /^maples?$/i,
    ['Sugar maple', 'Red maple', 'Japanese maple', 'Silver maple', 'Norway maple', 'Sycamore maple', 'Field maple', 'Bigleaf maple', 'Box elder', 'Paperbark maple', 'Striped maple', 'Amur maple']),
  GROUP('eucalyptus', 'Name a eucalyptus or gum tree.', 'any eucalyptus or gum tree by its common name', ['Q45669'], 2, /^(eucalypt(us)?|gum trees?)$/i,
    ['Blue gum', 'Ghost gum', 'River red gum', 'Rainbow eucalyptus', 'Mountain ash', 'Snow gum', 'Tasmanian blue gum', 'Manna gum', 'Karri', 'Jarrah', 'Lemon-scented gum', 'Silver dollar gum']),
  GROUP('fig', 'Name a fig or fig tree.', 'any fig or fig tree (a Ficus) by its common name', ['Q59798'], 2, /^figs?$/i,
    ['Common fig', 'Weeping fig', 'Banyan', 'Rubber plant', 'Fiddle-leaf fig', 'Sacred fig', 'Sycamore fig', 'Creeping fig', 'Moreton Bay fig', 'Indian laurel', 'Strangler fig', 'Cluster fig']),
  GROUP('prunus', 'Name a cherry, plum, peach or almond tree.', 'any tree or shrub of the genus Prunus (cherry, plum, peach, apricot, almond) by its common name', ['Q190545'], 3, /^(cherry|plum|peach|apricot|almond)$/i,
    ['Sweet cherry', 'Sour cherry', 'Peach', 'Apricot', 'Almond', 'Japanese cherry', 'Blackthorn', 'Bird cherry', 'Wild cherry', 'Damson', 'Cherry plum', 'Nectarine', 'Black cherry', 'Cherry laurel']),
  GROUP('daisy-family', 'Name a plant of the daisy family.', 'any plant of the daisy family (a daisy, sunflower, thistle, dandelion, aster, lettuce or similar) by its common name', ['Q25400'], 5, /^(daisy|daisies|asters?|thistles?)$/i,
    ['Sunflower', 'Daisy', 'Dandelion', 'Marigold', 'Chrysanthemum', 'Lettuce', 'Artichoke', 'Echinacea', 'Aster', 'Cornflower', 'Gerbera', 'Zinnia', 'Dahlia', 'Chicory', 'Thistle', 'Edelweiss']),
  GROUP('mint-family', 'Name a plant of the mint family.', 'any plant of the mint family (a mint, basil, sage, lavender, thyme, rosemary or similar) by its common name', ['Q53476'], 4, /^(mints?|sages?)$/i,
    ['Peppermint', 'Basil', 'Lavender', 'Rosemary', 'Sage', 'Thyme', 'Oregano', 'Spearmint', 'Lemon balm', 'Catnip', 'Marjoram', 'Patchouli', 'Perilla', 'Self-heal']),
  GROUP('allium', 'Name an onion, garlic or other allium.', 'any plant of the genus Allium (an onion, garlic, leek, chive, shallot or ornamental allium) by its common name', ['Q49391'], 3, /^(onions?|alliums?)$/i,
    ['Onion', 'Garlic', 'Leek', 'Chives', 'Shallot', 'Spring onion', 'Ramsons', 'Chinese chives', 'Elephant garlic', 'Wild garlic', 'Welsh onion', 'Rakkyo']),
  GROUP('rose', 'Name a rose.', 'any wild rose or rose species by its common name', ['Q34687'], 3, /^roses?$/i,
    ['Dog rose', 'Damask rose', 'Rosa rugosa', 'Sweet briar', 'Cabbage rose', 'Apothecary\'s rose', 'Burnet rose', 'Musk rose', 'Cherokee rose', 'Banksia rose', 'Multiflora rose', 'Prairie rose']),
  PARK('united-states', 'the United States', ['Q30'], 4, ['Yellowstone National Park', 'Yosemite National Park', 'Grand Canyon National Park', 'Zion National Park', 'Glacier National Park', 'Rocky Mountain National Park', 'Acadia National Park', 'Arches National Park', 'Everglades National Park', 'Great Smoky Mountains National Park', 'Grand Teton National Park', 'Olympic National Park', 'Bryce Canyon National Park', 'Death Valley National Park']),
  PARK('canada', 'Canada', ['Q16'], 3, ['Banff National Park', 'Jasper National Park', 'Yoho National Park', 'Kootenay National Park', 'Gros Morne National Park', 'Fundy National Park', 'Pacific Rim National Park Reserve', 'Waterton Lakes National Park', 'Wood Buffalo National Park', 'Riding Mountain National Park', 'Cape Breton Highlands National Park']),
  PARK('united-kingdom', 'the United Kingdom', ['Q145'], 2, ['Lake District', 'Peak District', 'Snowdonia', 'Cairngorms National Park', 'Dartmoor', 'Yorkshire Dales', 'Exmoor', 'New Forest', 'Brecon Beacons', 'Loch Lomond and The Trossachs National Park', 'Pembrokeshire Coast National Park', 'South Downs']),
  PARK('australia', 'Australia', ['Q408'], 2, ['Kakadu National Park', 'Uluru-Kata Tjuta National Park', 'Blue Mountains National Park', 'Daintree National Park', 'Great Otway National Park', 'Kosciuszko National Park', 'Wilsons Promontory National Park', 'Fraser Island', 'Cradle Mountain', 'Litchfield National Park', 'Nitmiluk National Park']),
  PARK('india', 'India', ['Q668'], 2, ['Jim Corbett National Park', 'Ranthambore National Park', 'Kaziranga National Park', 'Bandhavgarh National Park', 'Gir National Park', 'Sundarbans National Park', 'Kanha National Park', 'Periyar National Park', 'Bandipur National Park', 'Nagarhole National Park', 'Keoladeo National Park']),
  PARK('africa', 'Africa', ['Q114', 'Q924', 'Q258', 'Q963', 'Q1030', 'Q1036', 'Q953', 'Q954'], 2, ['Serengeti National Park', 'Kruger National Park', 'Masai Mara', 'Ngorongoro Conservation Area', 'Etosha National Park', 'Amboseli National Park', 'Tsavo National Park', 'Chobe National Park', 'Victoria Falls National Park', 'South Luangwa National Park', 'Bwindi Impenetrable National Park', 'Kafue National Park']),
  DOG('british', 'British', 'Q145', ['Labrador Retriever', 'Golden Retriever', 'Bulldog', 'English Springer Spaniel', 'Border Collie', 'Yorkshire Terrier', 'Cocker Spaniel', 'Greyhound', 'Corgi', 'Beagle', 'Whippet', 'Jack Russell Terrier', 'West Highland White Terrier', 'Cavalier King Charles Spaniel']),
  DOG('german', 'German', 'Q183', ['German Shepherd', 'Rottweiler', 'Dachshund', 'Doberman Pinscher', 'Boxer', 'Great Dane', 'Schnauzer', 'Pomeranian', 'Weimaraner', 'German Shorthaired Pointer', 'Pinscher', 'Affenpinscher', 'Leonberger', 'Spitz']),
  DOG('japanese', 'Japanese', 'Q17', ['Akita', 'Shiba Inu', 'Japanese Chin', 'Tosa', 'Shikoku', 'Kishu', 'Hokkaido', 'Japanese Spitz', 'Kai Ken', 'Japanese Terrier']),

  // ================================================================ Food
  CHEESE('french', 'French', 'Q142', ['Brie', 'Camembert', 'Roquefort', 'Comté', 'Munster', 'Époisses', 'Reblochon', 'Chèvre', 'Cantal', 'Boursin', 'Morbier', 'Livarot', 'Saint-Nectaire', 'Neufchâtel']),
  CHEESE('italian', 'Italian', 'Q38', ['Parmigiano Reggiano', 'Mozzarella', 'Gorgonzola', 'Pecorino Romano', 'Ricotta', 'Mascarpone', 'Provolone', 'Fontina', 'Grana Padano', 'Asiago', 'Burrata', 'Taleggio', 'Bel Paese', 'Scamorza']),
  CHEESE('swiss', 'Swiss', 'Q39', ['Emmental', 'Gruyère', 'Appenzeller', 'Raclette', 'Tête de Moine', 'Vacherin Mont-d\'Or', 'Sbrinz', 'Tilsit', 'Vacherin Fribourgeois', 'Raclette du Valais']),
  CHEESE('dutch', 'Dutch', 'Q55', ['Gouda', 'Edam', 'Leerdammer', 'Maasdam', 'Leyden', 'Boerenkaas', 'Limburger', 'Old Amsterdam', 'Beemster', 'Frisian clove cheese']),
  CHEESE('british', 'British', 'Q145', ['Cheddar', 'Stilton', 'Red Leicester', 'Wensleydale', 'Cheshire', 'Double Gloucester', 'Caerphilly', 'Lancashire', 'Stinking Bishop', 'Cornish Yarg', 'Shropshire Blue', 'Derby', 'Sage Derby']),
  CHEESE('spanish', 'Spanish', 'Q29', ['Manchego', 'Cabrales', 'Idiazabal', 'Mahón', 'Tetilla', 'Torta del Casar', 'Zamorano', 'Roncal', 'Murcia al Vino', 'Majorero']),
  MAKER('brewery-germany', 'brewery', 'Germany', 'Q131734', 'wdt:P17 wd:Q183 .', 2, ['Paulaner', 'Löwenbräu', 'Weihenstephan', 'Bitburger', 'Warsteiner', 'Beck\'s', 'Krombacher', 'Erdinger', 'Spaten', 'Hofbräu', 'Augustiner', 'Radeberger', 'Veltins']),
  MAKER('brewery-united-states', 'brewery', 'the United States', 'Q131734', 'wdt:P17 wd:Q30 .', 3, ['Anheuser-Busch', 'Coors Brewing Company', 'Boston Beer Company', 'Sierra Nevada Brewing Company', 'Yuengling', 'Stone Brewing', 'Brooklyn Brewery', 'Dogfish Head Brewery', 'Miller Brewing Company', 'Pabst Brewing Company', 'Lagunitas Brewing Company', 'New Belgium Brewing Company']),
  MAKER('brewery-belgium', 'brewery', 'Belgium', 'Q131734', 'wdt:P17 wd:Q31 .', 2, ['Duvel Moortgat', 'Chimay', 'Westvleteren', 'Orval', 'Rochefort', 'Hoegaarden', 'Leffe', 'Anheuser-Busch InBev', 'Delirium', 'Palm Breweries', 'Brasserie Cantillon', 'Straffe Hendrik']),
  MAKER('brewery-united-kingdom', 'brewery', 'the United Kingdom', 'Q131734', 'wdt:P17 wd:Q145 .', 2, ['Fuller\'s Brewery', 'Greene King', 'Young\'s Brewery', 'Theakston', 'Adnams', 'Shepherd Neame', 'Marston\'s Brewery', 'BrewDog', 'Samuel Smith Old Brewery', 'Newcastle Breweries', 'Harvey\'s Brewery', 'Timothy Taylor']),
  MAKER('brewery-japan', 'brewery', 'Japan', 'Q131734', 'wdt:P17 wd:Q17 .', 2, ['Asahi Breweries', 'Kirin Brewery Company', 'Sapporo Breweries', 'Suntory', 'Yebisu', 'Orion Breweries', 'Hitachino Nest', 'Kinshachi Brewery', 'Coedo Brewery', 'Ozeki', 'Gekkeikan', 'Hakutsuru']),
  MAKER('winery-france', 'winery', 'France', 'Q156362', 'wdt:P17 wd:Q142 .', 2, ['Château Lafite Rothschild', 'Château Margaux', 'Château Latour', 'Château Mouton Rothschild', 'Château d\'Yquem', 'Domaine de la Romanée-Conti', 'Château Pétrus', 'Château Haut-Brion', 'Château Cheval Blanc', 'Château Lynch-Bages', 'Moët & Chandon', 'Veuve Clicquot']),
  MAKER('winery-united-states', 'winery', 'the United States', 'Q156362', 'wdt:P17 wd:Q30 .', 2, ['Robert Mondavi Winery', 'Opus One Winery', 'Beringer Vineyards', 'E & J Gallo Winery', 'Stag\'s Leap Wine Cellars', 'Chateau Montelena', 'Kendall-Jackson', 'Screaming Eagle', 'Duckhorn Vineyards', 'Ridge Vineyards', 'Francis Ford Coppola Winery', 'Sutter Home']),
  MAKER('winery-italy', 'winery', 'Italy', 'Q156362', 'wdt:P17 wd:Q38 .', 2, ['Antinori', 'Gaja', 'Frescobaldi', 'Biondi-Santi', 'Tenuta San Guido', 'Ornellaia', 'Masi Agricola', 'Allegrini', 'Banfi', 'Bertani', 'Ca\' del Bosco', 'Bellavista']),
  MAKER('distillery-scotland', 'distillery', 'Scotland', 'Q1251750', 'wdt:P131* wd:Q22 .', 2, ['Glenfiddich', 'The Macallan', 'The Glenlivet', 'Laphroaig', 'Lagavulin', 'Talisker', 'Ardbeg', 'Highland Park', 'Glenmorangie', 'Oban', 'Bowmore', 'Dalmore', 'Springbank', 'Bruichladdich']),
  MAKER('distillery-united-states', 'distillery', 'the United States', 'Q1251750', 'wdt:P17 wd:Q30 .', 2, ['Jack Daniel\'s', 'Maker\'s Mark', 'Jim Beam', 'Buffalo Trace Distillery', 'Wild Turkey', 'Woodford Reserve', 'Four Roses', 'Heaven Hill', 'Tito\'s Handmade Vodka', 'Old Forester', 'Knob Creek', 'Bulleit']),
  MAKER('distillery-japan', 'distillery', 'Japan', 'Q1251750', 'wdt:P17 wd:Q17 .', 2, ['Yamazaki Distillery', 'Hakushu Distillery', 'Yoichi Distillery', 'Miyagikyo Distillery', 'Chichibu Distillery', 'Fuji Gotemba Distillery', 'Mars Shinshu Distillery', 'Karuizawa Distillery', 'Hanyu Distillery', 'Nikka Whisky']),
  DISH('georgian', 'Georgian', 'Georgian', ['Q1199026'], ['Q230'], ['Khachapuri', 'Khinkali', 'Lobio', 'Churchkhela', 'Pkhali', 'Satsivi', 'Mtsvadi', 'Chakapuli', 'Badrijani nigvzit', 'Ajapsandali', 'Kharcho', 'Chakhokhbili'], true),
  DISH('austrian', 'Austrian', 'Austrian', ['Q42029'], ['Q40'], ['Wiener Schnitzel', 'Sachertorte', 'Apfelstrudel', 'Tafelspitz', 'Kaiserschmarrn', 'Knödel', 'Gulasch', 'Palatschinken', 'Linzer torte', 'Salzburger Nockerl', 'Leberkäse', 'Kasnocken']),
  DISH('swiss', 'Swiss', 'Swiss', ['Q13497'], ['Q39'], ['Fondue', 'Raclette', 'Rösti', 'Zürcher Geschnetzeltes', 'Birchermüesli', 'Älplermagronen', 'Basler Läckerli', 'Zopf', 'Cervelat', 'Capuns']),
  DISH('czech', 'Czech', 'Czech', ['Q871595'], ['Q213'], ['Svíčková', 'Trdelník', 'Knedlíky', 'Vepřo knedlo zelo', 'Smažený sýr', 'Guláš', 'Bramboráky', 'Kulajda', 'Koláče', 'Palačinky']),
  DISH('ukrainian', 'Ukrainian', 'Ukrainian', ['Q1503789'], ['Q212'], ['Borscht', 'Varenyky', 'Holubtsi', 'Salo', 'Chicken Kyiv', 'Deruny', 'Pampushky', 'Kutia', 'Banosh', 'Syrnyky']),
  DISH('punjabi', 'Punjabi', 'Punjabi', ['Q2090705'], [], ['Butter chicken', 'Sarson da saag', 'Makki di roti', 'Chole bhature', 'Dal makhani', 'Paneer tikka', 'Amritsari kulcha', 'Lassi', 'Tandoori chicken', 'Rajma']),
  DISH('bengali', 'Bengali', 'Bengali', ['Q1572982'], [], ['Hilsa curry', 'Rasgulla', 'Sandesh', 'Mishti doi', 'Shorshe ilish', 'Chingri malai curry', 'Kosha mangsho', 'Luchi', 'Aloo posto', 'Panta bhat']),
  DISH('caribbean', 'Caribbean', 'Caribbean', ['Q1729345'], [], ['Jerk chicken', 'Callaloo', 'Ackee and saltfish', 'Roti', 'Pelau', 'Doubles', 'Rice and peas', 'Conch fritters', 'Pepperpot', 'Bake and shark']),
  DISH('lebanese', 'Lebanese', 'Lebanese', ['Q929239'], ['Q822'], ['Hummus', 'Tabbouleh', 'Falafel', 'Kibbeh', 'Fattoush', 'Shawarma', 'Baba ghanoush', 'Labneh', 'Manakish', 'Mujaddara'], true),
  DISH('hunan', 'Hunan', 'Hunan', ['Q1156889'], [], ['Chairman Mao\'s braised pork', 'Steamed fish head with chopped chili', 'Dong\'an chicken', 'Hunan beef', 'Stinky tofu', 'Spicy frog', 'Smoked pork with dried vegetables']),
]

/** after the first build: listed names that landed on an item with another name (read by a person, 18 Nov 2026) */
const PATCH: Record<string, Partial<NewQuestion>> = {
  'animals-only-in-australia': { rename: ['Red kangaroo', 'Common wombat'] },
  'animals-only-in-madagascar': { rename: ['Fossa', 'Golden mantella'] },
  'animals-only-in-new-zealand': { rename: ['Kākā', 'Morepork'] },
  'animals-only-in-china': { rename: ['Golden snub-nosed monkey'] },
  'animals-only-in-philippines': { rename: ['Philippine cockatoo'] },
  'animals-only-in-indonesia': { rename: ['Komodo dragon', 'Babirusa'] },
  'animals-only-in-mexico': { rename: ['Mexican redknee tarantula'] },
  'animals-frog-toad': { rename: ['Strawberry poison-dart frog'], extras: [{ name: 'Green tree frog', signal: 40, aliases: ['White\'s tree frog', 'Australian green tree frog'] }] },
  'animals-oak': { rename: ['English oak', 'White oak'], extras: [{ name: 'Scarlet oak', signal: 12, aliases: [] }] },
  'animals-maple': { rename: ['Sycamore maple', 'Striped maple'] },
  'animals-eucalyptus': { rename: ['Rainbow eucalyptus'], extras: [{ name: 'Mountain ash', signal: 12, aliases: [] }] },
  'animals-fig': { rename: ['Common fig', 'Rubber plant', 'Sacred fig', 'Sycamore fig'] },
  'animals-prunus': { rename: ['Sweet cherry', 'Almond', 'Japanese cherry', 'Cherry plum'] },
  'animals-daisy-family': { rename: ['Echinacea', 'Gerbera'], extras: [{ name: 'Chrysanthemum', signal: 60, aliases: ['Mums', 'Chrysanthemums'] }] },
  'animals-mint-family': { rename: ['Lemon balm', 'Marjoram'] },
  'animals-allium': { rename: ['Garlic'], extras: [{ name: 'Shallot', signal: 40, aliases: [] }, { name: 'Chinese chives', signal: 12, aliases: ['Garlic chives'] }] },
  'animals-rose': { rename: ['Rosa rugosa', 'Multiflora rose'], extras: [{ name: 'Cherokee rose', signal: 10, aliases: ['Rosa laevigata'] }] },
}
export const BATCH: NewQuestion[] = RAW.map((q) => (PATCH[q.id] ? { ...q, ...PATCH[q.id] } : q))
