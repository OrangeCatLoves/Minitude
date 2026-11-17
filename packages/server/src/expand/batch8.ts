/**
 * Batch 8: candidate questions (Animals & Nature, Food, Games, History & Mythology) for the 150 the owner asked for on 17 Nov 2026 (Batches 8, 9, 10).
 * None is a class we already have (see batch1.ts to batch7.ts and the live bank of 350); topics that were tried and dropped before are not repeated
 * (docs/ANSWER_LISTS.md). Same recipe as before (newq.ts): a Wikidata class, a minimum number of Wikipedia languages so the list has a head people know,
 * and `mustHave` = the answers a casual English-speaking player thinks of first, most obvious first. The weakest are dropped after the preflight.
 * The rules text is made from the head of `mustHave` (the `mk` factory), so the examples in it are the ones that were checked.
 * Build with: npx tsx src/expand/newq.ts --batch batch8 --out C:/Users/weibi/minitude/list-build/batch8
 */
import type { NewQuestion } from './newq'
import { namedBelow, ON, TAXON } from './batch6'
import { anyKind, anyOf, characterIn, HUMAN, kindOf, nameIs, occupation, personForms } from './recipes'

type Def = Omit<NewQuestion, 'category' | 'rules'> & { what: string; not?: string }
export const mk = (category: string, d: Def): NewQuestion => {
  const { what, not, ...rest } = d
  return { ...rest, category, rules: `Accept ${what}${rest.mustHave?.length ? ` (${rest.mustHave.slice(0, 14).join(', ')})` : ''}.${not ? ' ' + not : ''}` }
}

/** dishes filed under any of these cuisines (or parts of them) or coming from any of these countries, and ONLY if the item is a dish (Batch 5, lesson 20) */
export const dishesOf = (cuisines: string[], countries: string[], direct = false) =>
  `{ ${[
    // `direct`: only dishes filed straight under the cuisine (the walk through its parts and sub-cuisines is too heavy for some cuisines: Wikidata answers 504)
    ...cuisines.map((c) => (direct ? `{ ?item wdt:P2012 wd:${c} }` : `{ ?item wdt:P2012 ?cu${c} . ?cu${c} (wdt:P279|wdt:P361)* wd:${c} }`)),
    ...cuisines.map((c) => `{ ?item wdt:P361 wd:${c} }`),
    ...countries.map((c) => `{ ?item wdt:P495 wd:${c} }`),
  ].join(' UNION ')} } . { ?item wdt:P31/wdt:P279* wd:Q746549 } UNION { ?item wdt:P279+ wd:Q746549 } .`

const DISH =(id: string, prompt: string, what: string, cuisines: string[], countries: string[], mustHave: string[], extra: Partial<Def> = {}): NewQuestion =>
  mk('Food', {
    id: `food-${id}-dish`, prompt, what,
    not: 'Ingredients alone, drinks that are not part of a dish, and restaurants do not count.',
    source: `Wikidata dishes that belong to the cuisine or come from the country, known in at least 3 languages.`,
    pattern: dishesOf(cuisines, countries), minSignal: 3, mustHave,
    skip: nameIs(/cuisine$|^(food|dish|rice|noodle|soup|meat|fish|bread|sauce|vegetable)$/i), ...extra,
  })

/** a video game released for a platform */
const GAME = (id: string, name: string, platforms: string[], minSignal: number, mustHave: string[], extra: Partial<Def> = {}): NewQuestion =>
  mk('Games', {
    id: `games-${id}-game`, prompt: `Name ${/^[aeiou]/i.test(name) ? 'an' : 'a'} ${name} game.`, what: `any video game released for ${name === 'arcade' ? 'arcade machines' : 'the ' + name}, including games that also came out on other platforms`,
    not: 'Board games, films and consoles do not count.',
    source: `Wikidata video games released for the platform, known in at least ${minSignal} languages.`,
    pattern: ON(...platforms), minSignal, mustHave, ...extra,
  })

const yearless = (n: string): string[] => {
  const out: string[] = []
  const a = n.replace(/^((January|February|March|April|May|June|July|August|September|October|November|December) )?\d{4}( [–-] \d{4})? /, '')
  if (a !== n && a.length >= 4) out.push(a)
  const b = a.replace(/ and tsunami$/i, '')
  if (b !== a && b.length >= 4) out.push(b)
  return out
}
const stormForms = (n: string): string[] => {
  const out = yearless(n)
  const m = n.replace(/^(\d{4} )?(Great |Super |Tropical )?(Hurricane|Typhoon|Cyclone|Tropical Storm|Tropical Cyclone|Super Typhoon|Severe Tropical Cyclone) /i, '')
  if (m !== n && m.length >= 3 && !/\d/.test(m)) out.push(m)
  return out
}
const eventOf = (re: RegExp) => (n: string): string[] => {
  const m = n.replace(re, '').trim()
  return m !== n && m.length >= 3 ? [m, ...yearless(n)] : yearless(n)
}

export const BATCH: NewQuestion[] = [
  // ================================================================ Animals & Nature
  mk('Animals & Nature', {
    id: 'animals-crustacean', prompt: 'Name a crustacean.', what: 'any crustacean by its common or scientific name, or a group name where every member is a crustacean',
    not: 'Insects, spiders, scorpions, molluscs and horseshoe crabs do not count.',
    source: 'Taxa below the subphylum Crustacea in Wikidata that have an English common name, known in at least 10 languages, without extinct ones.',
    fetch: namedBelow(['Q25364'], 20), commonNames: true, minSignal: 20, skip: TAXON(/^crustaceans?$/i),
    mustHave: ['Crab', 'Lobster', 'Shrimp', 'Prawn', 'Crayfish', 'Barnacle', 'Krill', 'Hermit crab', 'King crab', 'Woodlouse', 'Copepod', 'Spider crab', 'Mantis shrimp', 'Dungeness crab', 'Blue crab', 'Fiddler crab', 'Brine shrimp', 'Water flea', 'Langoustine', 'Coconut crab', 'Japanese spider crab', 'Amphipod', 'Isopod', 'Snow crab', 'Spiny lobster'],
  }),
  mk('Animals & Nature', {
    id: 'animals-duck-goose-swan', prompt: 'Name a duck, goose or swan.', what: 'any duck, goose or swan by its common or scientific name, or a group name where every member is one of them',
    not: 'Other water birds (grebes, coots, loons, pelicans) do not count.',
    source: 'Taxa below the family Anatidae in Wikidata that have an English common name, known in at least 8 languages, without extinct ones.',
    fetch: namedBelow(['Q7556'], 15), commonNames: true, minSignal: 15, skip: TAXON(/^(ducks?|gooses?|geese|swans?|waterfowl)$/i),
    mustHave: ['Mallard', 'Canada goose', 'Mute swan', 'Pekin duck', 'Wood duck', 'Eider', 'Teal', 'Pintail', 'Black swan', 'Greylag goose', 'Snow goose', 'Muscovy duck', 'Mandarin duck', 'Goldeneye', 'Merganser', 'Whooper swan', 'Trumpeter swan', 'Barnacle goose', 'Brant', 'Northern shoveler', 'Eurasian wigeon', 'Canvasback', 'Harlequin duck', 'Bufflehead', 'Tundra swan', 'Egyptian goose', 'Nene', 'Bar-headed goose'],
    rename: ['Mallard', 'Canada goose'],
  }),
  mk('Animals & Nature', {
    id: 'animals-pig-breed', prompt: 'Name a breed of pig.', what: 'any breed of domestic pig',
    not: 'Wild boar and other wild pigs do not count unless they are a recognised breed.',
    source: 'Wikidata pig breeds.',
    pattern: '?item wdt:P31 wd:Q18786396 .', minSignal: 0,
    mustHave: ['Duroc', 'Yorkshire', 'Berkshire', 'Landrace', 'Hampshire', 'Tamworth', 'Large White', 'Gloucestershire Old Spots', 'Vietnamese Pot-bellied', 'Kunekune', 'Iberian pig', 'Mangalica', 'Meishan', 'Large Black', 'Saddleback', 'Piétrain', 'Chester White', 'Poland China', 'Hereford', 'Mulefoot', 'Ossabaw Island hog', 'Oxford Sandy and Black', 'Middle White', 'Red Wattle'],
    extraAliases: { 'Large White': ['Yorkshire'], 'Vietnamese Pot-bellied': ['Pot-bellied pig', 'Vietnamese pot-bellied pig', 'Pot bellied pig'], 'black Iberian pig': ['Iberian pig', 'Iberico pig'] },
  }),
  mk('Animals & Nature', {
    id: 'animals-rabbit-breed', prompt: 'Name a breed of rabbit.', what: 'any breed of domestic rabbit',
    source: 'Wikidata rabbit breeds.',
    pattern: '?item wdt:P31 wd:Q12045584 .', minSignal: 0,
    mustHave: ['Holland Lop', 'Netherland Dwarf', 'Flemish Giant', 'Lionhead rabbit', 'Mini Rex', 'Rex rabbit', 'Angora rabbit', 'Dutch rabbit', 'English Lop', 'French Lop', 'Californian rabbit', 'New Zealand white rabbit', 'Himalayan rabbit', 'Belgian Hare', 'Harlequin rabbit', 'Silver Marten', 'Polish rabbit', 'Checkered Giant', 'Jersey Wooly', 'Mini Lop', 'Satin', 'Chinchilla rabbit', 'Tan rabbit', 'Havana'],
    extras: [{ name: 'Netherland Dwarf', signal: 30, aliases: ['Dutch dwarf rabbit', 'Netherlands Dwarf'] }],
    extraAliases: { 'Dutch dwarf Rabbit': ['Netherland Dwarf', 'Netherlands Dwarf'] },
    alsoWritten: (n) => (/ rabbit$/i.test(n) ? [n.replace(/ rabbit$/i, '')] : []),
  }),
  mk('Animals & Nature', {
    id: 'animals-snake', prompt: 'Name a snake.', what: 'any snake by its common or scientific name, venomous or not, or a group name where every member is a snake',
    not: 'Lizards, legless lizards and eels do not count.',
    source: 'Taxa below the suborder Serpentes in Wikidata that have an English common name, known in at least 8 languages, without extinct ones.',
    fetch: namedBelow(['Q25537662'], 15), commonNames: true, minSignal: 15, skip: TAXON(/^snakes?$/i),
    mustHave: ['Cobra', 'Python', 'Boa constrictor', 'Rattlesnake', 'King cobra', 'Black mamba', 'Anaconda', 'Garter snake', 'Corn snake', 'Viper', 'Adder', 'Copperhead', 'Coral snake', 'Sea snake', 'Ball python', 'Milk snake', 'Kingsnake', 'Rat snake', 'Grass snake', 'Taipan', 'Green tree python', 'Reticulated python', 'Burmese python', 'Gaboon viper', 'Cottonmouth', 'Bushmaster', 'Inland taipan', 'Brown tree snake', 'Hognose snake', 'Boomslang'],
  }),
  mk('Animals & Nature', {
    id: 'animals-mollusc', prompt: 'Name a mollusc.', what: 'any mollusc by its common or scientific name (snails, slugs, clams, oysters, mussels, scallops, squid, octopuses and so on), or a group name where every member is a mollusc',
    not: 'Crabs, lobsters, shrimp and other crustaceans do not count.',
    source: 'Taxa below the phylum Mollusca in Wikidata that have an English common name, known in at least 10 languages, without extinct ones.',
    fetch: namedBelow(['Q25326'], 20), commonNames: true, minSignal: 20, skip: TAXON(/^(molluscs?|mollusks?|shellfish)$/i),
    mustHave: ['Snail', 'Slug', 'Oyster', 'Clam', 'Mussel', 'Squid', 'Octopus', 'Cuttlefish', 'Scallop', 'Abalone', 'Nautilus', 'Giant squid', 'Cockle', 'Whelk', 'Limpet', 'Conch', 'Roman snail', 'Banana slug', 'Giant clam', 'Cowry', 'Periwinkle', 'Sea slug', 'Chiton', 'Razor clam', 'Geoduck', 'Vampire squid', 'Blue-ringed octopus', 'Colossal squid'],
  }),
  mk('Animals & Nature', {
    id: 'animals-cactus', prompt: 'Name a cactus.', what: 'any cactus by its common or scientific name (saguaro, prickly pear, barrel cactus, Christmas cactus, peyote, organ pipe cactus, cholla), or a group name where every member is a cactus',
    not: 'Other succulents (aloe, agave, jade plant, euphorbia) do not count.',
    source: 'Taxa below the family Cactaceae in Wikidata that have an English common name, known in at least 5 languages.',
    fetch: namedBelow(['Q14560'], 10), commonNames: true, minSignal: 10, skip: TAXON(/^cacti|^cactus$/i),
    mustHave: ['Saguaro', 'Prickly pear', 'Barrel cactus', 'Christmas cactus', 'Peyote', 'Organ pipe cactus', 'Cholla', 'Golden barrel cactus', 'Old man cactus', 'Dragon fruit', 'San Pedro cactus', 'Easter cactus', 'Moon cactus', 'Bunny ears cactus', 'Fishhook cactus', 'Hedgehog cactus', 'Rat tail cactus', 'Queen of the night', 'Totem pole cactus', 'Pincushion cactus', 'Thanksgiving cactus', 'Opuntia', 'Mammillaria', 'Echinopsis'],
  }),
  mk('Animals & Nature', {
    id: 'animals-palm', prompt: 'Name a palm tree.', what: 'any palm (a member of the palm family) by its common or scientific name (coconut palm, date palm, oil palm, royal palm, sago palm, areca, rattan, açaí, palmetto), or a group name where every member is a palm',
    not: 'Cycads that are called palms (sago palm is accepted because it is commonly called one), ferns and yuccas are not true palms but sago palm is accepted.',
    source: 'Taxa below the family Arecaceae in Wikidata that have an English common name, known in at least 5 languages.',
    fetch: namedBelow(['Q14080'], 10), commonNames: true, minSignal: 10, skip: anyOf(TAXON(/^palms?$/i), nameIs(/^kiko rivera$/i)),
    mustHave: ['Coconut', 'Date palm', 'Oil palm', 'Royal palm', 'Sago palm', 'Areca palm', 'Betel nut', 'Rattan', 'Açaí palm', 'Palmetto', 'Queen palm', 'Washingtonia', 'Palmyra palm', 'Carnauba', 'Raffia palm', 'Fan palm', 'Windmill palm', 'Cabbage palm', 'Bamboo palm', 'Kentia palm', 'Canary Islands date palm', 'Sabal palm', 'Pindo palm', 'Ponytail palm', 'Doum palm', 'Sugar palm'],
    extraAliases: { 'Coconut': ['Coconut palm', 'Coconut tree'] },
  }),
  mk('Animals & Nature', {
    id: 'nature-hurricane', prompt: 'Name a famous hurricane, typhoon or cyclone.', what: 'any named tropical storm that became a hurricane, typhoon or cyclone, by its name with or without the year or the word hurricane/typhoon/cyclone (Hurricane Katrina or Katrina, Typhoon Haiyan, Hurricane Sandy, Hurricane Harvey, Hurricane Andrew, Cyclone Tracy, Galveston hurricane)',
    not: 'Tornadoes, blizzards, floods and general storms do not count.',
    source: 'Wikidata tropical cyclones, known in at least 8 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q8092 .', minSignal: 8, skip: nameIs(/^(mediterranean tropical cyclone|tropical cyclone|hurricane|typhoon|cyclone|.*(season|list of).*)$/i), alsoWritten: stormForms,
    mustHave: ['Hurricane Katrina', 'Hurricane Sandy', 'Hurricane Harvey', 'Hurricane Irma', 'Hurricane Maria', 'Hurricane Andrew', 'Typhoon Haiyan', '1900 Galveston hurricane', 'Hurricane Ian', 'Hurricane Dorian', 'Hurricane Ike', 'Hurricane Camille', 'Hurricane Hugo', 'Hurricane Mitch', 'Cyclone Nargis', 'Typhoon Hagibis', 'Hurricane Michael', 'Hurricane Wilma', 'Hurricane Rita', 'Hurricane Florence', 'Hurricane Matthew', 'Hurricane Helene', 'Hurricane Milton', 'Cyclone Tracy', 'Cyclone Idai', 'Typhoon Mangkhut', 'Hurricane Gilbert', 'Hurricane Dean', 'Hurricane Patricia', '1970 Bhola cyclone'],
  }),
  mk('Animals & Nature', {
    id: 'nature-earthquake', prompt: 'Name a famous earthquake.', what: 'any historic earthquake, by its place and year or by its usual name (the 2011 Tōhoku earthquake or the Tohoku earthquake, the 1906 San Francisco earthquake, the 2004 Indian Ocean earthquake, the 2010 Haiti earthquake, the 1755 Lisbon earthquake, the 2008 Sichuan earthquake, Great Kantō earthquake)',
    not: 'Volcanic eruptions, tsunamis alone and fault lines do not count.',
    source: 'Wikidata earthquakes, known in at least 12 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q7944 .', minSignal: 12, alsoWritten: yearless, skip: nameIs(/^(earthquake|list of|.*(aftershock|swarm|sequence)$)/i),
    mustHave: ['2011 Tōhoku earthquake and tsunami', '2004 Indian Ocean earthquake', '2010 Haiti earthquake', '1906 San Francisco earthquake', '1755 Lisbon earthquake', '2008 Sichuan earthquake', '1923 Great Kantō Earthquake', '1960 Valdivia earthquake', '2023 Turkey–Syria earthquakes', '1989 Loma Prieta earthquake', '1994 Northridge earthquake', 'Great Hanshin Earthquake', '1976 Tangshan earthquake', '1556 Shaanxi earthquake', 'April 2015 Nepal earthquake', '2010 Chile earthquake', '1988 Spitak earthquake', '1999 İzmit earthquake', '2023 Marrakesh-Safi earthquake', '2025 Myanmar earthquake'],
  }),

  // ================================================================ Food
  DISH('malaysian-singaporean', 'Name a Malaysian or Singaporean dish.', 'any dish of Malaysian or Singaporean cuisine, including hawker food and desserts (nasi lemak, laksa, roti canai, satay, char kway teow, Hainanese chicken rice, chilli crab, bak kut teh, Hokkien mee, rojak, cendol)', ['Q772247'], ['Q833', 'Q334'],
    ['Nasi lemak', 'Laksa', 'Roti canai', 'Satay', 'Char kway teow', 'Hainanese chicken rice', 'Chilli crab', 'Bak kut teh', 'Hokkien mee', 'Rojak', 'Cendol', 'Teh tarik', 'Mee goreng', 'Nasi goreng', 'Rendang', 'Curry laksa', 'Murtabak', 'Apam balik', 'Ais kacang', 'Wonton noodles', 'Popiah', 'Otak-otak', 'Kaya toast', 'Fish head curry', 'Carrot cake', 'Kueh', 'Ban mian', 'Mee rebus', 'Katong laksa', 'Roti prata'], { minSignal: 1 }),
  DISH('indonesian', 'Name an Indonesian dish.', 'any dish of Indonesian cuisine, including street food and desserts (nasi goreng, satay, rendang, gado-gado, soto, bakso, mie goreng, nasi padang, tempeh, sambal, rawon)', ['Q787497'], ['Q252'],
    ['Nasi goreng', 'Satay', 'Rendang', 'Gado-gado', 'Soto', 'Bakso', 'Mie goreng', 'Nasi padang', 'Tempeh', 'Sambal', 'Rawon', 'Ayam goreng', 'Nasi uduk', 'Pempek', 'Es cendol', 'Martabak', 'Lontong', 'Opor ayam', 'Babi guling', 'Krupuk', 'Bubur ayam', 'Ketoprak', 'Siomay', 'Pisang goreng', 'Nasi kuning', 'Sayur asem', 'Tahu', 'Tumpeng'], { skip: nameIs(/cuisine$|^(food|dish|rice|noodle|soup|meat|fish|bread|sauce|vegetable|thali|youtiao|jin deui|bibingka|mie bangladesh)$/i) }),
  DISH('filipino', 'Name a Filipino dish.', 'any dish of Filipino cuisine, including street food and desserts (adobo, sinigang, lechon, pancit, lumpia, halo-halo, sisig, kare-kare, balut, tinola, bibingka)', ['Q1520796'], ['Q928'],
    ['Adobo', 'Sinigang', 'Lechon', 'Pancit', 'Lumpia', 'Halo-halo', 'Sisig', 'Kare-kare', 'Balut', 'Tinola', 'Bibingka', 'Turon', 'Puto', 'Tapsilog', 'Dinuguan', 'Kinilaw', 'Pandesal', 'Leche flan', 'Bulalo', 'Longganisa', 'Arroz caldo', 'Taho', 'Ube halaya', 'Chicken inasal', 'Lechon kawali', 'Bagoong', 'Pinakbet', 'Menudo', 'Afritada'], { skip: nameIs(/cuisine$|^(food|dish|rice|noodle|soup|meat|fish|bread|sauce|vegetable|popiah)$/i) }),
  DISH('british', 'Name a British dish.', 'any dish of British cuisine from England, Scotland, Wales or Northern Ireland, including puddings and baked goods (fish and chips, full English breakfast, shepherd\'s pie, Sunday roast, Yorkshire pudding, bangers and mash, Cornish pasty, Scotch egg, haggis, Beef Wellington)', ['Q918277'], ['Q145'],
    ['Fish and chips', 'Full breakfast', 'Shepherd\'s pie', 'Sunday roast', 'Yorkshire pudding', 'Bangers and mash', 'Cornish pasty', 'Scotch egg', 'Haggis', 'Beef Wellington', 'Toad in the hole', 'Cottage pie', 'Trifle', 'Eton mess', 'Bubble and squeak', 'Ploughman\'s lunch', 'Black pudding', 'Jellied eels', 'Welsh rarebit', 'Spotted dick', 'Sticky toffee pudding', 'Scone', 'Chicken tikka masala', 'Kedgeree', 'Pork pie', 'Lancashire hotpot', 'Cullen skink', 'Cranachan', 'Stargazy pie', 'Bakewell tart', 'Victoria sponge cake', 'Crumpet'], { skip: nameIs(/cuisine$|^(food|dish|rice|noodle|soup|meat|fish|bread|sauce|vegetable|pie|chocolate brownie|gelatin dessert|kit kat|colin the caterpillar|faggots?)$/i) }),
  DISH('american', 'Name an American dish.', 'any dish of American cuisine, including regional dishes and desserts (hamburger, hot dog, apple pie, macaroni and cheese, Buffalo wings, fried chicken, clam chowder, barbecue ribs, cornbread, pancakes, meatloaf, Philly cheesesteak, gumbo, jambalaya)', ['Q40578'], ['Q30'],
    ['Hamburger', 'Hot dog', 'Apple pie', 'Macaroni and cheese', 'Buffalo wings', 'Fried chicken', 'Clam chowder', 'Barbecue', 'Cornbread', 'Pancake', 'Meatloaf', 'Philly cheesesteak', 'Chili con carne', 'Gumbo', 'Jambalaya', 'Biscuits and gravy', 'Pumpkin pie', 'Brownie', 'Cobb salad', 'Reuben sandwich', 'Sloppy joe', 'Corn dog', 'S\'more', 'Key lime pie', 'Grits', 'Pot roast', 'Cheeseburger', 'Chicken and waffles', 'Lobster roll', 'Po\' boy'], { skip: nameIs(/cuisine$|^(food|dish|rice|noodle|soup|meat|fish|bread|sauce|vegetable|taco|fish and chips|carbonara|peanut butter|marshmallow)$/i) }),
  DISH('russian', 'Name a Russian dish.', 'any dish of Russian cuisine, including soups, pastries and desserts (borscht, pelmeni, blini, beef Stroganoff, shchi, pirozhki, Olivier salad, solyanka, okroshka, syrniki, vareniki, kulebyaka)', ['Q12505'], ['Q159'],
    ['Borscht', 'Pelmeni', 'Blini', 'Beef Stroganoff', 'Shchi', 'Pirozhki', 'Olivier salad', 'Solyanka', 'Okroshka', 'Syrniki', 'Vareniki', 'Kulebyaka', 'Shashlik', 'Golubtsy', 'Ukha', 'Chicken Kiev', 'Herring under a fur coat', 'Medovik', 'Paskha', 'Kissel', 'Zefir', 'Pryanik', 'Rassolnik', 'Draniki', 'Kholodets', 'Kasha', 'Coulibiac', 'Kotleta'], { skip: nameIs(/cuisine$|^(food|dish|rice|noodle|soup|meat|fish|bread|sauce|vegetable|mcchicken|schweinsbraten|sulze|kringle|nalisniki|russian ice cream)$/i) }),
  DISH('middle-eastern', 'Name a Middle Eastern dish.', 'any dish of Middle Eastern cuisine (Lebanese, Syrian, Palestinian, Israeli, Jordanian, Iraqi, Iranian or Egyptian), including mezze and desserts (hummus, falafel, tabbouleh, shawarma, baba ghanoush, kibbeh, fattoush, manakish, labneh, baklava, shakshouka, kebab)', ['Q929239'], ['Q822', 'Q858', 'Q810', 'Q801', 'Q796', 'Q794', 'Q79'],
    ['Hummus', 'Falafel', 'Tabbouleh', 'Shawarma', 'Baba ghanoush', 'Kibbeh', 'Fattoush', 'Manakish', 'Labneh', 'Baklava', 'Shakshouka', 'Kebab', 'Kofta', 'Mujaddara', 'Knafeh', 'Shish taouk', 'Dolma', 'Koshari', 'Ful medames', 'Sabich', 'Chelow kabab', 'Ghormeh sabzi', 'Fesenjān', 'Tahdig', 'Masgouf', 'Maqluba', 'Halva', 'Pita', 'Gyro', 'Za\'atar']),
  DISH('brazilian', 'Name a Brazilian dish.', 'any dish of Brazilian cuisine, including street food, drinks served with a meal and desserts (feijoada, brigadeiro, pão de queijo, churrasco, moqueca, acarajé, coxinha, farofa, tapioca, quindim, vatapá)', ['Q614394'], ['Q155'],
    ['Feijoada', 'Brigadeiro', 'Pão de queijo', 'Churrasco', 'Moqueca', 'Acarajé', 'Coxinha', 'Farofa', 'Tapioca', 'Quindim', 'Vatapá', 'Caipirinha', 'Pastel', 'Bobó de camarão', 'Beijinho', 'Pudim', 'Escondidinho', 'Cuscuz', 'Picanha', 'Baião de dois', 'Tutu à mineira', 'Açaí na tigela', 'Rabada', 'Empadão', 'Cachaça', 'Mandioca frita', 'Galinhada', 'Bolo de rolo'], { skip: nameIs(/cuisine$|^(food|dish|rice|noodle|soup|meat|fish|bread|sauce|vegetable|schnecken)$/i) }),
  DISH('polish', 'Name a Polish dish.', 'any dish of Polish cuisine, including soups, pastries and desserts (pierogi, bigos, żurek, kiełbasa, gołąbki, barszcz, placki ziemniaczane, rosół, kotlet schabowy, sernik, pączki, makowiec)', ['Q756020'], ['Q36'],
    ['Pierogi', 'Bigos', 'Żurek', 'Kielbasa', 'Gołąbki', 'Barszcz', 'Placki ziemniaczane', 'Rosół', 'Kotlet schabowy', 'Sernik', 'Pączki', 'Makowiec', 'Oscypek', 'Kluski', 'Flaki', 'Zapiekanka', 'Kaszanka', 'Obwarzanek', 'Mizeria', 'Kopytka', 'Szarlotka', 'Chruściki', 'Krupnik', 'Kołacz', 'Pyzy', 'Śledź', 'Bigos', 'Naleśniki', 'Racuchy', 'Pierniki'], { skip: nameIs(/cuisine$|^(food|dish|rice|noodle|soup|meat|fish|bread|sauce|vegetable|schläsches himmelreich|sarburma|cabbage stew a la székely)$/i) }),
  mk('Food', {
    id: 'food-dumpling', prompt: 'Name a dumpling.', what: 'any dumpling or dumpling-like filled or dough food from any cuisine (gyoza, pierogi, wonton, xiaolongbao, momo, ravioli, knödel, mandu, pelmeni, jiaozi, baozi, matzo ball, siu mai, har gow, khinkali, manti)',
    not: 'Pastas that are not called dumplings in English (spaghetti, lasagna) and pastries baked flat (pies) do not count.',
    source: 'Wikidata dumplings and their subclasses, known in at least 3 languages.',
    pattern: kindOf('Q1854639'), minSignal: 3, skip: nameIs(/^(dumpling|food|dish|pasta)$/i),
    mustHave: ['Gyoza', 'Pierogi', 'Wonton', 'Xiaolongbao', 'Momo', 'Ravioli', 'Knödel', 'Mandu', 'Pelmeni', 'Jiaozi', 'Baozi', 'Matzo ball', 'Siu mai', 'Har gow', 'Khinkali', 'Manti', 'Gnocchi', 'Empanada', 'Samosa', 'Tortellini', 'Dim sum', 'Spätzle', 'Vareniki', 'Kreplach', 'Tangyuan', 'Shumai', 'Pasty', 'Gnudi', 'Kluski', 'Dumpling'],
  }),
  mk('Food', {
    id: 'food-curry', prompt: 'Name a curry.', what: 'any curry or curry-style dish from any cuisine (chicken tikka masala, butter chicken, korma, vindaloo, rogan josh, massaman, green curry, red curry, Japanese curry, katsu curry, jalfrezi, madras, balti, dal)',
    not: 'Plain rice, bread and chutneys served with curry do not count.',
    source: 'Wikidata curries and their subclasses, known in at least 3 languages.',
    pattern: kindOf('Q164606'), minSignal: 3, skip: nameIs(/^(curry|dish|food)$/i),
    mustHave: ['Chicken tikka masala', 'Butter chicken', 'Korma', 'Vindaloo', 'Rogan josh', 'Massaman curry', 'Green curry', 'Red curry', 'Japanese curry', 'Katsu curry', 'Jalfrezi', 'Madras curry', 'Balti', 'Dal', 'Palak paneer', 'Chana masala', 'Saag paneer', 'Panang curry', 'Yellow curry', 'Rendang', 'Laksa', 'Thai curry', 'Dhansak', 'Bhuna', 'Pasanda', 'Kheer', 'Sambar', 'Fish curry', 'Goat curry', 'Keema'],
  }),
  mk('Food', {
    id: 'food-stew', prompt: 'Name a stew.', what: 'any stew from any cuisine (Irish stew, goulash, ratatouille, cassoulet, beef bourguignon, chili con carne, tagine, pot-au-feu, gumbo, coq au vin, feijoada, cholent, Lancashire hotpot, Brunswick stew, scouse, daube)',
    not: 'Soups and curries are not stews unless called a stew.',
    source: 'Wikidata stews and their subclasses, known in at least 3 languages.',
    pattern: kindOf('Q2920963'), minSignal: 3, skip: nameIs(/^(stew|dish|food)$/i),
    mustHave: ['Irish stew', 'Goulash', 'Ratatouille', 'Cassoulet', 'Beef bourguignon', 'Chili con carne', 'Tagine', 'Pot-au-feu', 'Gumbo', 'Coq au vin', 'Feijoada', 'Cholent', 'Lancashire hotpot', 'Brunswick stew', 'Scouse', 'Daube', 'Navarin', 'Bouillabaisse', 'Osso buco', 'Pörkölt', 'Hungarian goulash', 'Bigos', 'Hotpot', 'Cocido', 'Fabada asturiana', 'Chakchouka', 'Stifado', 'Jjigae', 'Burgoo', 'Ragout'],
  }),
  mk('Food', {
    id: 'food-rice-dish', prompt: 'Name a rice dish.', what: 'any dish in which rice is the main ingredient, from any cuisine (fried rice, paella, risotto, biryani, sushi, jambalaya, pilaf, congee, nasi goreng, bibimbap, arroz con pollo, kedgeree, Hainanese chicken rice, jollof rice, rice pudding, onigiri, kimbap, arancini, donburi)',
    not: 'Plain steamed rice and rice-based drinks do not count.',
    source: 'Wikidata rice dishes and their subclasses, known in at least 3 languages.',
    pattern: kindOf('Q21976260'), minSignal: 3, skip: nameIs(/^(rice|dish|food|rice dish)$/i),
    mustHave: ['Fried rice', 'Paella', 'Risotto', 'Biryani', 'Sushi', 'Jambalaya', 'Pilaf', 'Congee', 'Nasi goreng', 'Bibimbap', 'Arroz con pollo', 'Kedgeree', 'Hainanese chicken rice', 'Jollof rice', 'Rice pudding', 'Onigiri', 'Kimbap', 'Arancini', 'Donburi', 'Gyudon', 'Katsudon', 'Nasi lemak', 'Khichdi', 'Mujaddara', 'Dolma', 'Rice and beans', 'Pulao', 'Zongzi', 'Arroz negro', 'Paelle'],
  }),

  // ================================================================ Games
  GAME('playstation-2', 'PlayStation 2', ['Q10680'], 20,
    ['Grand Theft Auto: San Andreas', 'Grand Theft Auto III', 'Grand Theft Auto: Vice City', 'God of War', 'Shadow of the Colossus', 'Final Fantasy X', 'Kingdom Hearts', 'Metal Gear Solid 3: Snake Eater', 'Gran Turismo 3: A-Spec', 'Gran Turismo 4', 'Resident Evil 4', 'Devil May Cry', 'Ōkami', 'Jak and Daxter: The Precursor Legacy', 'Ratchet & Clank', 'Silent Hill 2', 'Tekken 5', 'Burnout 3: Takedown', 'Need for Speed: Underground 2', 'Bully', 'Guitar Hero', 'Ico', 'Dragon Quest VIII', 'Katamari Damacy', 'Final Fantasy XII', 'The Sims', 'Kingdom Hearts II', 'Persona 4', 'SSX 3', 'Sly Cooper and the Thievius Raccoonus']),
  GAME('nintendo-64', 'Nintendo 64', ['Q184839'], 8,
    ['Super Mario 64', 'The Legend of Zelda: Ocarina of Time', 'GoldenEye 007', 'Mario Kart 64', 'Super Smash Bros.', 'The Legend of Zelda: Majora\'s Mask', 'Banjo-Kazooie', 'Perfect Dark', 'Star Fox 64', 'Diddy Kong Racing', 'Donkey Kong 64', 'Paper Mario', 'Conker\'s Bad Fur Day', 'Pokémon Stadium', 'Mario Party', 'Wave Race 64', 'F-Zero X', '1080° Snowboarding', 'Pilotwings 64', 'Banjo-Tooie', 'Mario Tennis', 'Excitebike 64', 'Kirby 64: The Crystal Shards', 'Turok: Dinosaur Hunter', 'Rayman 2: The Great Escape', 'WWF No Mercy', 'Mario Golf', 'Yoshi\'s Story', 'Mario Party 2', 'Pokémon Snap']),
  GAME('nintendo-ds', 'Nintendo DS', ['Q170323'], 8,
    ['New Super Mario Bros.', 'Nintendogs', 'Pokémon Diamond and Pearl', 'Brain Age', 'Mario Kart DS', 'Animal Crossing: Wild World', 'The Legend of Zelda: Phantom Hourglass', 'Professor Layton and the Curious Village', 'Pokémon HeartGold and SoulSilver', 'Pokémon Black and White', 'Kirby Super Star Ultra', 'Super Mario 64 DS', 'Advance Wars: Dual Strike', 'Chrono Trigger', 'Dragon Quest IX', 'Metroid Prime Hunters', 'Phoenix Wright: Ace Attorney', 'Cooking Mama', 'Big Brain Academy', 'Elite Beat Agents', 'The World Ends with You', 'Castlevania: Dawn of Sorrow', 'Mario & Luigi: Partners in Time', 'Tetris DS', 'WarioWare: Touched!', 'Hotel Dusk: Room 215', 'Pokémon Platinum', 'The Legend of Zelda: Spirit Tracks', 'Pokémon Mystery Dungeon: Explorers of Time and Explorers of Darkness', 'Final Fantasy III']),
  GAME('game-boy-advance', 'Game Boy Advance', ['Q188642'], 6,
    ['Pokémon Ruby and Sapphire', 'Pokémon FireRed and LeafGreen', 'Pokémon Emerald', 'Advance Wars', 'Fire Emblem', 'Golden Sun', 'Metroid Fusion', 'Metroid: Zero Mission', 'The Legend of Zelda: The Minish Cap', 'Mario Kart: Super Circuit', 'Super Mario Advance 2: Super Mario World', 'Kirby & the Amazing Mirror', 'Mario & Luigi: Superstar Saga', 'Castlevania: Aria of Sorrow', 'Final Fantasy Tactics Advance', 'WarioWare, Inc.: Mega Microgame$!', 'Sonic Advance', 'Tony Hawk\'s Pro Skater 2', 'Yoshi\'s Island: Super Mario Advance 3', 'F-Zero: Maximum Velocity', 'Advance Wars 2: Black Hole Rising', 'Harvest Moon: Friends of Mineral Town', 'Mother 3', 'Drill Dozer', 'Wario Land 4', 'Kingdom Hearts: Chain of Memories', 'Mega Man Zero', 'Final Fantasy VI Advance', 'Golden Sun: The Lost Age', 'Super Mario Advance']),
  GAME('gamecube', 'GameCube', ['Q182172'], 8,
    ['Super Smash Bros. Melee', 'The Legend of Zelda: The Wind Waker', 'Metroid Prime', 'Super Mario Sunshine', 'Luigi\'s Mansion', 'Mario Kart: Double Dash!!', 'Animal Crossing', 'Pikmin', 'Pikmin 2', 'Resident Evil 4', 'Paper Mario: The Thousand-Year Door', 'F-Zero GX', 'Fire Emblem: Path of Radiance', 'Eternal Darkness: Sanity\'s Requiem', 'Star Fox Adventures', 'Mario Party 4', 'Pokémon Colosseum', 'Tales of Symphonia', 'Super Mario Strikers', 'Mario Power Tennis', 'Kirby Air Ride', 'The Legend of Zelda: Twilight Princess', 'Metroid Prime 2: Echoes', 'Soulcalibur II', 'Viewtiful Joe', 'Donkey Konga', 'Sonic Adventure 2: Battle', 'Wario World', 'Super Monkey Ball', 'Star Wars Rogue Squadron II: Rogue Leader']),
  GAME('nintendo-3ds', 'Nintendo 3DS', ['Q203597'], 8,
    ['Super Mario 3D Land', 'Mario Kart 7', 'Animal Crossing: New Leaf', 'Pokémon X and Y', 'Pokémon Sun and Moon', 'Fire Emblem Awakening', 'The Legend of Zelda: Ocarina of Time 3D', 'The Legend of Zelda: A Link Between Worlds', 'Luigi\'s Mansion: Dark Moon', 'Kid Icarus: Uprising', 'Super Smash Bros. for Nintendo 3DS and Wii U', 'Monster Hunter 4 Ultimate', 'Fire Emblem Fates', 'Bravely Default', 'Xenoblade Chronicles 3D', 'Pokémon Omega Ruby and Alpha Sapphire', 'Metroid: Samus Returns', 'Kirby: Planet Robobot', 'Paper Mario: Sticker Star', 'Tomodachi Life', 'Professor Layton vs. Phoenix Wright: Ace Attorney', 'Dragon Quest VII: Fragments of the Forgotten Past', 'Yo-kai Watch', 'Shin Megami Tensei IV', 'Pokémon Ultra Sun and Ultra Moon', 'Star Fox 64 3D', 'Mario & Luigi: Dream Team', 'The Legend of Zelda: Majora\'s Mask 3D', 'Super Mario Maker for Nintendo 3DS', 'Kirby\'s Dream Land 3D']),
  GAME('playstation-4', 'PlayStation 4', ['Q5014725'], 25,
    ['The Last of Us Part II', 'God of War', 'Bloodborne', 'Marvel\'s Spider-Man', 'Horizon Zero Dawn', 'Uncharted 4: A Thief\'s End', 'Persona 5', 'Ghost of Tsushima', 'Red Dead Redemption 2', 'Grand Theft Auto V', 'The Witcher 3: Wild Hunt', 'Fortnite', 'Minecraft', 'Death Stranding', 'Nioh', 'Dark Souls III', 'Detroit: Become Human', 'Monster Hunter: World', 'Final Fantasy XV', 'Overwatch', 'Call of Duty: Modern Warfare', 'The Last of Us Remastered', 'Days Gone', 'Control', 'Cyberpunk 2077', 'Sekiro: Shadows Die Twice', 'Elden Ring', 'Assassin\'s Creed Odyssey', 'Hades', 'Celeste'], { not: 'Board games, films and consoles do not count. Games that came out only on other consoles do not count.' }),
  GAME('arcade', 'arcade', ['Q192851'], 8,
    ['Pac-Man', 'Space Invaders', 'Donkey Kong', 'Street Fighter II', 'Pong', 'Asteroids', 'Galaga', 'Frogger', 'Mortal Kombat', 'Dig Dug', 'Defender', 'Centipede', 'Ms. Pac-Man', 'Missile Command', 'Tetris', 'Q*bert', 'Double Dragon', 'Final Fight', 'Out Run', 'NBA Jam', 'Dragon\'s Lair', 'Donkey Kong Jr.', 'Galaxian', 'Space Harrier', 'Pole Position', 'Mario Bros.', 'Contra', '1942', 'Gauntlet', 'Time Crisis', 'The House of the Dead', 'Dance Dance Revolution', 'Daytona USA', 'Marvel vs. Capcom 2', 'Teenage Mutant Ninja Turtles', 'The Simpsons', 'Berzerk', 'Joust', 'Tempest', 'Breakout', 'Punch-Out!!'],
    { prompt: 'Name an arcade game.' }),
  mk('Games', {
    id: 'games-final-fantasy-character', prompt: 'Name a character from Final Fantasy.', what: 'any named character of the Final Fantasy video games, films and spin-offs (Cloud Strife, Sephiroth, Tifa Lockhart, Aerith Gainsborough, Squall Leonhart, Zidane Tribal, Tidus, Yuna, Lightning, Noctis, Barret, Cid, Vivi, Terra, Kefka, Chocobo), by full name or first name',
    not: 'Places, summons and weapons do not count; summons that are characters (Ifrit, Shiva) are accepted only if they are named characters.',
    source: 'Wikidata fictional characters of the Final Fantasy franchise and its games, known in at least 3 languages.',
    pattern: characterIn('Q12391356', 'Q99416119', 'Q214232'), minSignal: 1, alsoWritten: personForms,
    mustHave: ['Cloud Strife', 'Sephiroth', 'Tifa Lockhart', 'Aerith Gainsborough', 'Squall Leonhart', 'Zidane Tribal', 'Tidus', 'Yuna', 'Lightning', 'Noctis Lucis Caelum', 'Barret Wallace', 'Cid', 'Vivi Ornitier', 'Terra Branford', 'Kefka Palazzo', 'Chocobo', 'Moogle', 'Rinoa Heartilly', 'Vincent Valentine', 'Red XIII', 'Yuffie Kisaragi', 'Auron', 'Rikku', 'Lulu', 'Wakka', 'Kuja', 'Garnet Til Alexandros XVII', 'Cecil Harvey', 'Kain Highwind', 'Cait Sith', 'Zack Fair', 'Edgar Roni Figaro', 'Celes Chere', 'Bahamut', 'Ifrit'],
  }),
  mk('Games', {
    id: 'games-street-fighter-character', prompt: 'Name a character from Street Fighter.', what: 'any named playable or non-playable character of the Street Fighter games (Ryu, Ken, Chun-Li, Guile, Blanka, Zangief, Dhalsim, E. Honda, M. Bison, Sagat, Vega, Balrog, Cammy, Akuma, Sakura, Juri), by full name or short name',
    source: 'Wikidata fictional characters of the Street Fighter series, known in at least 2 languages.',
    pattern: characterIn('Q288035', 'Q1503511', 'Q1133204'), minSignal: 2, alsoWritten: personForms,
    mustHave: ['Ryu', 'Ken Masters', 'Chun-Li', 'Guile', 'Blanka', 'Zangief', 'Dhalsim', 'E. Honda', 'M. Bison', 'Sagat', 'Vega', 'Balrog', 'Cammy', 'Akuma', 'Sakura Kasugano', 'Juri', 'Dan Hibiki', 'Fei Long', 'T. Hawk', 'Dee Jay', 'Rose', 'Cody Travers', 'Guy', 'Birdie', 'Charlie Nash', 'Rashid', 'Laura Matsuda', 'Luke', 'Kimberly', 'Jamie', 'Gouken', 'C. Viper', 'Ibuki', 'Makoto', 'Gill', 'Alex', 'Urien', 'Elena', 'Hugo', 'Poison', 'Dudley'],
  }),
  GAME('atari-2600', 'Atari 2600', ['Q206261'], 3,
    ['Pitfall!', 'Adventure', 'Pac-Man', 'Space Invaders', 'Combat', 'Breakout', 'Asteroids', 'Missile Command', 'River Raid', 'Yars\' Revenge', 'E.T. the Extra-Terrestrial', 'Centipede', 'Frogger', 'Donkey Kong', 'Berzerk', 'Defender', 'Kaboom!', 'Warlords', 'Haunted House', 'Demon Attack', 'Pong', 'Joust', 'Dig Dug', 'Galaxian', 'Ms. Pac-Man', 'Star Wars: The Empire Strikes Back', 'Q*bert', 'Super Breakout', 'Video Pinball', 'Night Driver']),

  // ================================================================ History & Mythology
  mk('History & Mythology', {
    id: 'myth-hindu-deity', prompt: 'Name a Hindu god or goddess.', what: 'any deity of Hinduism, including avatars and minor gods (Shiva, Vishnu, Brahma, Krishna, Ganesha, Hanuman, Lakshmi, Saraswati, Parvati, Durga, Kali, Indra, Rama, Agni, Surya)',
    source: 'Wikidata Hindu deities, known in at least 4 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q979507 .', minSignal: 4, skip: nameIs(/^(hindu deity|deity)$/i),
    mustHave: ['Shiva', 'Vishnu', 'Brahma', 'Krishna', 'Ganesha', 'Hanuman', 'Lakshmi', 'Saraswati', 'Parvati', 'Durga', 'Kali', 'Indra', 'Rama', 'Agni', 'Surya', 'Kartikeya', 'Varuna', 'Yama', 'Radha', 'Vayu', 'Sita', 'Kubera', 'Balarama', 'Nandi', 'Rudra', 'Garuda', 'Vamana', 'Narasimha', 'Matsya', 'Kurma', 'Varaha', 'Parashurama', 'Kalki', 'Shani', 'Chandra'],
    rename: ['Radha', 'Kali'],
  }),
  mk('History & Mythology', {
    id: 'history-biblical-figure', prompt: 'Name a person from the Bible.', what: 'any person named in the Bible, Old or New Testament, including prophets, kings, apostles and women (Adam, Eve, Noah, Abraham, Moses, David, Solomon, Jesus, Mary, Joseph, John the Baptist, Peter, Paul, Judas, Cain, Abel, Jonah, Daniel, Ruth, Esther)',
    not: 'Angels, demons, gods and places do not count.',
    source: 'Wikidata human biblical figures, known in at least 6 languages.',
    pattern: '?item wdt:P31 wd:Q20643955 .', minSignal: 6, alsoWritten: personForms,
    mustHave: ['Adam', 'Eve', 'Noah', 'Abraham', 'Moses', 'David', 'Solomon', 'Jesus', 'Mary', 'Joseph', 'John the Baptist', 'Saint Peter', 'Paul the Apostle', 'Judas Iscariot', 'Cain', 'Abel', 'Jonah', 'Daniel', 'Ruth', 'Esther', 'Isaac', 'Jacob', 'Joseph', 'Samson', 'Delilah', 'Goliath', 'Job', 'Elijah', 'Mary Magdalene', 'Lazarus', 'Pontius Pilate', 'Herod the Great', 'Methuselah', 'Sarah', 'Rebecca', 'Rachel', 'Leah', 'Bathsheba', 'Jezebel', 'Nebuchadnezzar II'],
    extraAliases: { 'Saint Peter': ['Peter', 'Simon Peter'], 'Paul the Apostle': ['Paul', 'Saul'], 'Mary': ['Virgin Mary', 'Mary mother of Jesus'] },
  }),
  mk('History & Mythology', {
    id: 'history-admiral', prompt: 'Name an admiral.', what: 'any person who held the rank of admiral (or fleet admiral, vice admiral, rear admiral) in any navy, in any era (Horatio Nelson, Isoroku Yamamoto, Chester Nimitz, Francis Drake, Zheng He, Yi Sun-sin, Grace Hopper, Hyman Rickover, David Farragut, Karl Dönitz, Ernest King, Togo Heihachiro, Jean Bart)',
    not: 'Admirals of fictional navies (Admiral Ackbar) do not count; honorary royal ranks do not make someone an admiral for this question.',
    source: 'People in Wikidata whose occupation is admiral and whose one-line description names a naval officer, known in at least 8 languages.',
    pattern: occupation('Q132851') + HUMAN, minSignal: 8, alsoWritten: personForms,
    skip: (c) => !!c.desc && !/admiral|naval|navy|sailor|commander|fleet|marine|captain|officer|seaman|pirate|explorer|privateer|vice|rear/i.test(c.desc),
    mustHave: ['Horatio Nelson', 'Isoroku Yamamoto', 'Chester W. Nimitz', 'Francis Drake', 'Zheng He', 'Yi Sun-sin', 'Grace Hopper', 'Hyman G. Rickover', 'David Farragut', 'Karl Dönitz', 'Ernest King', 'Tōgō Heihachirō', 'Christopher Columbus', 'Ferdinand Magellan', 'Vasco da Gama', 'William Halsey Jr.', 'Raymond Spruance', 'Erich Raeder', 'John Paul Jones', 'Oliver Hazard Perry', 'George Dewey', 'Matthew C. Perry', 'Andrea Doria', 'Michiel de Ruyter', 'Jean Lafitte', 'Henry Morgan', 'Hayreddin Barbarossa', 'Alfred Thayer Mahan', 'Jellicoe', 'Fisher'],
    extras: [{ name: 'Grace Hopper', signal: 60, aliases: ['Grace Murray Hopper'] }],
  }),
  mk('History & Mythology', {
    id: 'history-pandemic', prompt: 'Name a famous pandemic or epidemic.', what: 'any historic pandemic or major epidemic by its usual name (Black Death, COVID-19 pandemic, Spanish flu, Plague of Justinian, Great Plague of London, HIV/AIDS pandemic, swine flu, Asian flu, SARS outbreak, Ebola epidemic, Antonine Plague, cholera pandemic)',
    not: 'Individual diseases alone (influenza, smallpox) do not count unless the outbreak is named.',
    source: 'Wikidata pandemics and epidemics, known in at least 6 languages.',
    pattern: anyKind('Q12184', 'Q44512'), minSignal: 6, alsoWritten: yearless,
    skip: (c) => !/pandemic|epidemic|outbreak|plague|\bflu\b|influenza|black death|covid|sars|ebola|aids|cholera|zika|mpox|swine/i.test(c.name) || /septicemic|pneumonic|bubonic|vaccin|syndemic/i.test(c.name),
    mustHave: ['Black Death', 'COVID-19 pandemic', 'Spanish flu', 'Plague of Justinian', 'Great Plague of London', 'HIV/AIDS', '2009 swine flu pandemic', 'Asian flu', 'Hong Kong flu', 'SARS', 'Ebola virus epidemic in West Africa', 'Antonine Plague', 'Third plague pandemic', 'Plague of Athens', 'Russian flu', 'Zika virus epidemic', 'Cholera', 'Great Plague of Marseille', 'Cocoliztli epidemic', '2022–2023 mpox outbreak'],
    extraAliases: { 'COVID-19 pandemic': ['Covid', 'Covid 19', 'Coronavirus pandemic', 'The coronavirus', 'COVID'], 'Spanish flu': ['1918 flu pandemic', '1918 influenza pandemic', 'The Spanish flu'], 'Black Death': ['The Black Death', 'Bubonic plague', 'Black Plague', 'The plague'] },
  }),
  mk('History & Mythology', {
    id: 'history-shipwreck', prompt: 'Name a famous shipwreck.', what: 'any famous ship that was wrecked or sunk, by the ship\'s name with or without its prefix (Titanic, Lusitania, Vasa, Mary Rose, Edmund Fitzgerald, Costa Concordia, Britannic, Empress of Ireland, Andrea Doria, Bismarck, USS Arizona, Hindenburg is not a ship)',
    not: 'Ships that were scrapped or are still afloat do not count.',
    source: 'Wikidata shipwrecks, known in at least 10 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q852190 .', minSignal: 10, skip: nameIs(/^(shipwreck|list of)/i),
    alsoWritten: (n) => { const m = n.replace(/^(RMS|HMS|USS|SS|MV|MS|SMS|HMAS|HMCS|RMS|SMS|USAT|SM U-?|German battleship|Japanese battleship) /i, ''); return m !== n && m.length >= 3 ? [m] : [] },
    mustHave: ['Titanic', 'RMS Lusitania', 'Vasa', 'Mary Rose', 'SS Edmund Fitzgerald', 'Costa Concordia', 'HMS Britannic', 'RMS Empress of Ireland', 'SS Andrea Doria', 'German battleship Bismarck', 'USS Arizona', 'HMS Hood', 'Batavia', 'RMS Carpathia', 'Endurance', 'Whydah Gally', 'SS Eastland', 'Wilhelm Gustloff', 'MS Estonia', 'Costa Concordia', 'USS Indianapolis', 'La Belle', 'San José', 'Atocha', 'USS Maine', 'Bounty', 'Mary Celeste'],
  }),
  mk('History & Mythology', {
    id: 'history-rebellion', prompt: 'Name a famous rebellion or uprising.', what: 'any historic rebellion, revolt or uprising against a ruler or government (Boxer Rebellion, Easter Rising, Indian Rebellion of 1857, Peasants\' Revolt, Taiping Rebellion, Warsaw Uprising, Whiskey Rebellion, Shays\' Rebellion, Hungarian Revolution of 1956, Spartacus\' revolt, Jacobite rising, Bar Kokhba revolt)',
    not: 'Revolutions that replaced a government are a separate question; wars between countries and single battles do not count.',
    source: 'Wikidata rebellions, revolts and uprisings, known in at least 12 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q124734 .', minSignal: 12, skip: nameIs(/^(rebellion|revolt|uprising|list of|insurrection)|revolution|strike|civil war|protest|sit-in|riot|holocaust|shoeing|mutiny of/i),
    mustHave: ['Boxer Rebellion', 'Easter Rising', 'Indian Rebellion of 1857', 'Peasants\' Revolt', 'Taiping Rebellion', 'Warsaw Uprising', 'Whiskey Rebellion', 'Shays\' Rebellion', 'Hungarian Revolution of 1956', 'Third Servile War', 'Jacobite rising of 1745', 'Bar Kokhba revolt', 'Irish Rebellion of 1798', 'Pugachev\'s Rebellion', 'Prague Spring', 'Boer Uprising', 'Mau Mau Uprising', 'Warsaw Ghetto Uprising', 'Nat Turner\'s slave rebellion', 'Kronstadt rebellion', 'Satsuma Rebellion', 'Great Rebellion', 'Bacon\'s Rebellion', 'Jacquerie', 'Sepoy Mutiny'],
    extraAliases: { 'Third Servile War': ['Spartacus revolt', 'Spartacus rebellion', 'Spartacus\' revolt', 'Spartacus\' slave rebellion'], 'Indian Rebellion of 1857': ['Sepoy Mutiny', 'Indian Mutiny', 'First War of Indian Independence'] },
  }),
  mk('History & Mythology', {
    id: 'history-court-case', prompt: 'Name a famous court case or trial.', what: 'any famous court case or trial, by its usual name (Roe v. Wade, Brown v. Board of Education, Marbury v. Madison, Miranda v. Arizona, Dred Scott v. Sandford, Plessy v. Ferguson, Scopes Trial, O. J. Simpson murder case, Nuremberg trials, Salem witch trials, trial of Socrates, Dreyfus affair, Loving v. Virginia)',
    not: 'Crimes, investigations and laws that were not a court case or trial do not count.',
    source: 'Wikidata court cases and trials, known in at least 10 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q2334719 .', minSignal: 10, skip: nameIs(/^(trial|court case|legal case|list of|lawsuit)/i),
    alsoWritten: (n) => (/ v\. /.test(n) ? [n.replace(/ v\. /, ' vs '), n.replace(/ v\. /, ' v ')] : []),
    mustHave: ['Roe v. Wade', 'Brown v. Board of Education', 'Marbury v. Madison', 'Miranda v. Arizona', 'Dred Scott v. Sandford', 'Plessy v. Ferguson', 'Scopes Trial', 'O. J. Simpson murder case', 'Nuremberg trials', 'Salem witch trials', 'Trial of Socrates', 'Dreyfus affair', 'Loving v. Virginia', 'Obergefell v. Hodges', 'Citizens United v. FEC', 'Gideon v. Wainwright', 'Trial of Joan of Arc', 'Trial of Galileo', 'Rosenberg trial', 'Lindbergh kidnapping'],
  }),
  mk('History & Mythology', {
    id: 'history-coup', prompt: 'Name a coup d\'état.', what: 'any coup d\'état or attempted coup, by its usual name (18 Brumaire, the 1973 Chilean coup, Beer Hall Putsch, 1953 Iranian coup, 2021 Myanmar coup, 1991 Soviet coup attempt, 2016 Turkish coup attempt, Kapp Putsch)',
    source: 'Wikidata coups d\'état, known in at least 10 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q45382 .', minSignal: 10, skip: nameIs(/^(coup d'état|coup|list of)|euromaidan|january 6|wagner|military regime/i), alsoWritten: yearless,
    mustHave: ['18 Brumaire', '1973 Chilean coup d\'état', 'Beer Hall Putsch', '1953 Iranian coup d\'état', '2021 Myanmar coup d\'état', 'August 1991 coup d\'état attempt', '2016 Turkish coup attempt', 'Kapp Putsch', '1964 Brazilian coup d\'état', '2013 Egyptian coup d\'état', '1954 Guatemalan coup d\'état', '1980 Turkish coup d\'état', '1981 Spanish coup attempt', '1936 Spanish coup', '2023 Niger coup d\'état', '1966 Argentine coup d\'état'],
    extraAliases: { '1973 Chilean coup d\'état': ['Chilean coup', 'Pinochet coup', '1973 Chilean coup', 'Chilean coup d\'état'], 'Beer Hall Putsch': ['Munich Putsch', 'Hitler Putsch'] },
  }),

  // ================================================================ more candidates (Food and Games), added while the first preflight ran
  mk('Food', {
    id: 'food-coffee-drink', prompt: 'Name a coffee drink.', what: 'any drink made with coffee, hot or cold, from any country (espresso, latte, cappuccino, americano, macchiato, mocha, flat white, cortado, frappé, Irish coffee, affogato, cold brew, Turkish coffee, ristretto, lungo, doppio, café au lait, Vietnamese coffee, kopi)',
    not: 'Coffee beans, coffee shops and coffee makers do not count.',
    source: 'Wikidata coffee drinks and their subclasses, known in at least 3 languages.',
    pattern: anyKind('Q37756327'), minSignal: 3, skip: nameIs(/^(coffee drink|coffee|list of)|^(caffè|georgia|weak coffee|sanka|pharisees)$/i),
    mustHave: ['Espresso', 'Latte', 'Cappuccino', 'Americano', 'Macchiato', 'Mocha', 'Flat white', 'Cortado', 'Frappé coffee', 'Irish coffee', 'Affogato', 'Cold brew', 'Turkish coffee', 'Ristretto', 'Lungo', 'Doppio', 'Café au lait', 'Vietnamese iced coffee', 'Kopi', 'Café con leche', 'Café Cubano', 'Dalgona coffee', 'Iced coffee', 'Drip coffee', 'Instant coffee', 'Red eye', 'Long black', 'Yuanyang', 'Egg coffee', 'Breve'],
    extraAliases: { 'Latte': ['Caffè latte', 'Cafe latte'], 'Espresso': ['Expresso'], 'Frappé coffee': ['Frappe'] },
  }),
  mk('Food', {
    id: 'food-street-food', prompt: 'Name a street food.', what: 'any food commonly sold by vendors on the street or at markets and stalls, from any country (hot dog, kebab, falafel, tacos, takoyaki, satay, pad thai, samosa, churros, crêpe, pretzel, roast chestnuts, bánh mì, arepa, empanada, corn dog, banh xeo, chaat, jianbing, roti prata)',
    source: 'Wikidata street foods and their subclasses, known in at least 3 languages.',
    pattern: anyKind('Q1316209'), minSignal: 3, skip: nameIs(/^(street food|food|list of)/i),
    mustHave: ['Hot dog', 'Kebab', 'Falafel', 'Taco', 'Takoyaki', 'Satay', 'Pad thai', 'Samosa', 'Churro', 'Crêpe', 'Pretzel', 'Roasted chestnuts', 'Bánh mì', 'Arepa', 'Empanada', 'Corn dog', 'Chaat', 'Jianbing', 'Roti prata', 'Pani puri', 'Vada pav', 'Doner kebab', 'Shawarma', 'Gyro', 'Poutine', 'Currywurst', 'Bratwurst', 'Waffle', 'Elote', 'Stinky tofu', 'Dim sum', 'Skewer', 'Pakora', 'Bao'],
  }),
  mk('Games', {
    id: 'games-mortal-kombat-character', prompt: 'Name a character from Mortal Kombat.', what: 'any named character of the Mortal Kombat games, films and series (Scorpion, Sub-Zero, Raiden, Liu Kang, Johnny Cage, Sonya Blade, Kano, Goro, Shang Tsung, Kitana, Mileena, Jax, Reptile, Baraka, Shao Kahn, Quan Chi, Noob Saibot, Kung Lao, Smoke, Ermac, Cyrax, Sektor, Jade, Nightwolf, Sindel)',
    source: 'Wikidata fictional characters of the Mortal Kombat franchise, known in at least 2 languages.',
    pattern: characterIn('Q241163', 'Q150294', 'Q2074880', 'Q106603131'), minSignal: 2, alsoWritten: personForms,
    mustHave: ['Scorpion', 'Sub-Zero', 'Raiden', 'Liu Kang', 'Johnny Cage', 'Sonya Blade', 'Kano', 'Goro', 'Shang Tsung', 'Kitana', 'Mileena', 'Jax Briggs', 'Reptile', 'Baraka', 'Shao Kahn', 'Quan Chi', 'Noob Saibot', 'Kung Lao', 'Smoke', 'Ermac', 'Cyrax', 'Sektor', 'Jade', 'Nightwolf', 'Sindel', 'Kintaro', 'Motaro', 'Stryker', 'Kabal', 'Sheeva', 'Rain', 'Kenshi', 'Frost', 'Tanya', 'Cassie Cage', 'Kotal Kahn', 'D\'Vorah', 'Takeda Takahashi', 'Fujin', 'Shinnok'],
    extraAliases: { 'Jax Briggs': ['Jax'], 'Johnny Cage': ['Cage'] },
  }),
  mk('Games', {
    id: 'games-mmorpg', prompt: 'Name an MMORPG.', what: 'any massively multiplayer online role-playing game (World of Warcraft, RuneScape, Final Fantasy XIV, Guild Wars 2, Lineage, EverQuest, Ultima Online, Elder Scrolls Online, Black Desert Online, Old School RuneScape, MapleStory, Star Wars: The Old Republic, Albion Online, Tibia, Ragnarok Online, Aion)',
    not: 'Single-player role-playing games and games that are only online shooters do not count.',
    source: 'Wikidata video games whose genre is MMORPG, known in at least 4 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q7889 . ?item wdt:P136 wd:Q175173 .', minSignal: 4, skip: nameIs(/^World of Warcraft: |World of Warplanes|^Destiny/i),
    mustHave: ['World of Warcraft', 'RuneScape', 'Final Fantasy XIV', 'Guild Wars 2', 'Lineage', 'EverQuest', 'Ultima Online', 'The Elder Scrolls Online', 'Black Desert Online', 'Old School RuneScape', 'MapleStory', 'Star Wars: The Old Republic', 'Albion Online', 'Tibia', 'Ragnarok Online', 'Aion', 'Guild Wars', 'Lord of the Rings Online', 'City of Heroes', 'Dark Age of Camelot', 'Neverwinter', 'Lost Ark', 'New World', 'Dofus', 'Eve Online', 'Star Trek Online', 'Warhammer Online', 'Final Fantasy XI', 'Asheron\'s Call'],
    extraAliases: { 'World of Warcraft': ['WoW'], 'Final Fantasy XIV': ['FFXIV', 'FF14'], 'Old School RuneScape': ['OSRS'] },
  }),
]
