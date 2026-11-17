/**
 * Batch 6: 50 new questions (Animals, Food, Games, History, Miscellaneous), none of them a class we already have (see batch1.ts to batch5.ts and the live bank of 250).
 * Same recipe as before (newq.ts): a Wikidata class or occupation, a minimum number of Wikipedia languages so the list has a head people know, and
 * `mustHave` = the answers a casual English-speaking player thinks of first, most obvious first.
 * Lessons applied (docs/ANSWER_LISTS.md): every recipe is preflighted against its head before the long fetch; people are found by occupation, kept only if
 * human and if Wikidata's one-line description names the activity; `skip` removes answers of the wrong class; a class that leaks its neighbours is read in
 * tiers 0 to 2 AND in a tail sample; the ids are checked against the live bank AND the rejected questions.
 * Build with: npx tsx src/expand/newq.ts --batch batch6 --out C:/Users/weibi/minitude/list-build/batch6
 */
import { detailsOf, speciesBelow } from './build'
import { sparql } from './wikidata'
import type { NewQuestion } from './newq'
import { anyOf, characterIn, cuisineDishes, HUMAN, instanceOf, kindOf, latinOnly, nameIs, NOT_EXTINCT, notDescribedAs, occupation, personForms, strip } from './recipes'

/** every taxon below a group that has an English common name (a million insects cannot be walked one level at a time: this asks for the named ones directly) */
const NAMED_BELOW = (root: string) => `?item wdt:P171+ wd:${root} . ?item wdt:P1843 ?cnx . FILTER(lang(?cnx) = "en") ${NOT_EXTINCT}`
/**
 * The named taxa below each group, ONE query per group (the banded fetch of newq.ts splits a group of a million taxa into many queries and they time
 * out one after the other). A group that still times out is asked for in two parts, by number of languages.
 */
const namedBelow = (roots: string[], minSignal: number) => async () => {
  const ids = new Set<string>()
  const ask = async (root: string, lo: number, hi: number): Promise<void> => {
    try {
      const rows = await sparql(`SELECT DISTINCT ?item WHERE { ${NAMED_BELOW(root)} ?item wikibase:sitelinks ?slcut . FILTER(?slcut >= ${lo} && ?slcut < ${hi}) }`, 2)
      for (const r of rows) ids.add(r.item.split('/').pop()!)
    } catch (e) {
      const mid = hi >= 100000 ? Math.max(lo + 1, 30) : Math.floor((lo + hi) / 2)
      if (mid <= lo || mid >= hi) throw e
      await ask(root, lo, mid)
      await ask(root, mid, hi)
    }
  }
  for (const root of roots) await ask(root, minSignal, 100000)
  return detailsOf([...ids], true, '', undefined, true)
}
/** taxon questions: no Latin-only names, no taxonomic synonyms with an author and a year ("Felis mexicana Brass, 1911"), no "sp." entries, and not the question's own subject word */
const TAXON = (subject: RegExp) => anyOf(latinOnly, nameIs(/, ?\d{4}\b|\bspp?\.|\bsensu\b/i), nameIs(subject))
const GAME = '?item wdt:P31/wdt:P279* wd:Q7889 .'
/** video games on any of these platforms */
const ON = (...platforms: string[]) => `${GAME} ?item wdt:P400 ?plt . VALUES ?plt { ${platforms.map((p) => 'wd:' + p).join(' ')} }`
const GENRE = (g: string) => `${GAME} ?item wdt:P136 wd:${g} .`

export const BATCH: NewQuestion[] = [
  // ================================================================ Animals & Nature
  {
    id: 'animals-butterfly-moth', category: 'Animals & Nature', prompt: 'Name a butterfly or moth.',
    rules: 'Accept any butterfly or moth by its common or scientific name (monarch, swallowtail, painted lady, red admiral, peacock, cabbage white, blue morpho, luna moth, atlas moth, hawk-moth, tiger moth, silk moth), or a group name (skipper, hairstreak, swallowtail). Caterpillars alone do not count.',
    source: 'Taxa below the order Lepidoptera in Wikidata that have an English common name, known in at least 12 languages, without extinct ones, plus group names added by hand.',
    fetch: namedBelow(['Q28319'], 12), commonNames: true, minSignal: 12, skip: TAXON(/^(butterfl(y|ies)|moths?)$/i),
    extras: [
      { name: 'Monarch butterfly', signal: 130, aliases: ['Monarch'] }, { name: 'Swallowtail', signal: 100, aliases: ['Swallowtails', 'Swallowtail butterfly'] }, { name: 'Blue morpho', signal: 90, aliases: ['Morpho', 'Morpho butterfly'] },
      { name: 'Luna moth', signal: 90 }, { name: 'Atlas moth', signal: 80 }, { name: 'Painted lady', signal: 90 }, { name: 'Red admiral', signal: 90 }, { name: 'Cabbage white', signal: 80, aliases: ['Cabbage butterfly', 'Large white'] },
    ],
    mustHave: ['Monarch butterfly', 'Swallowtail', 'Painted lady', 'Red admiral', 'Peacock butterfly', 'Cabbage white', 'Blue morpho', 'Luna moth', 'Atlas moth', 'Brimstone', 'Comma', 'Orange tip', 'Small tortoiseshell', 'Mourning cloak', 'Viceroy', 'Birdwing', 'Skipper', 'Emperor moth', 'Death\'s-head hawkmoth', 'Hummingbird hawk-moth', 'Gypsy moth', 'Tiger moth', 'Silk moth', 'Clothes moth', 'Cinnabar moth', 'Peppered moth', 'Hawk moth', 'Glasswing', 'Purple emperor', 'Camberwell beauty'],
    rename: ['Monarch butterfly', 'Cabbage white'],
  },
  {
    id: 'animals-spider', category: 'Animals & Nature', prompt: 'Name a spider.',
    rules: 'Accept any spider by its common or scientific name (black widow, tarantula, brown recluse, huntsman, wolf spider, jumping spider, garden spider, redback, funnel-web, orb-weaver, trapdoor spider, goliath birdeater), or a group name where every member is a spider. Scorpions, ticks, mites, harvestmen (daddy longlegs) and insects are not spiders.',
    source: 'Taxa below the order of spiders (Araneae) in Wikidata that have an English common name, known in at least 10 languages, plus group names added by hand.',
    fetch: namedBelow(['Q1357'], 10), commonNames: true, minSignal: 10, skip: TAXON(/^spiders?$/i),
    extras: [
      { name: 'Tarantula', signal: 120, aliases: ['Tarantulas'] }, { name: 'Black widow', signal: 120, aliases: ['Black widow spider', 'Widow spider'] }, { name: 'Wolf spider', signal: 90, aliases: ['Wolf spiders'] },
      { name: 'Jumping spider', signal: 80, aliases: ['Jumping spiders'] }, { name: 'Orb-weaver', signal: 70, aliases: ['Orb weaver', 'Orb-weaver spider'] }, { name: 'Huntsman spider', signal: 80, aliases: ['Huntsman'] },
      { name: 'Funnel-web spider', signal: 70, aliases: ['Funnel web', 'Funnel-web'] }, { name: 'Trapdoor spider', signal: 70, aliases: ['Trap-door spider'] },
    ],
    mustHave: ['Black widow', 'Tarantula', 'Brown recluse', 'Huntsman spider', 'Wolf spider', 'Jumping spider', 'Garden spider', 'Funnel-web spider', 'Redback spider', 'Goliath birdeater', 'Orb-weaver', 'Crab spider', 'Trapdoor spider', 'House spider', 'Camel spider', 'Spitting spider', 'Water spider', 'Peacock spider', 'Daddy long-legs spider', 'Wandering spider', 'Hobo spider', 'Nursery web spider', 'Fishing spider', 'Bird-eating spider', 'Cellar spider', 'Sydney funnel-web spider', 'Mexican redknee tarantula', 'Cobweb spider', 'Tailless whip spider', 'Giant house spider'],
    rename: ['Black widow', 'Redback spider'],
  },
  {
    id: 'animals-goat-breed', category: 'Animals & Nature', prompt: 'Name a breed of goat.',
    rules: 'Accept any breed of domestic goat, by its name with or without the word "goat" (Boer, Nubian, Saanen, Alpine, Toggenburg, LaMancha, Angora, Pygmy, Nigerian Dwarf, Kiko, Cashmere, Oberhasli, Anglo-Nubian, Jamnapari, Beetal, Black Bengal, Damascus, Myotonic or fainting goat). Sheep, ibex and wild goat species do not count.',
    source: 'Breeds of goat in Wikidata, known in at least 2 languages, with the plain breed name (without "goat") added as another way to write it.',
    pattern: instanceOf('Q15622387'), minSignal: 2, alsoWritten: strip(/ goat$/i),
    mustHave: ['Boer', 'Nubian', 'Saanen', 'Alpine', 'Toggenburg', 'LaMancha', 'Angora', 'Pygmy', 'Nigerian Dwarf', 'Kiko', 'Cashmere', 'Oberhasli', 'Anglo-Nubian', 'Jamnapari', 'Beetal', 'Black Bengal', 'Damascus', 'Myotonic', 'Savanna', 'Kalahari Red', 'Spanish', 'Sirohi', 'Barbari', 'Murciano-Granadina', 'Verata', 'Poitou', 'Rove', 'Valais Blackneck', 'Golden Guernsey', 'Girgentana'],
  },
  {
    id: 'animals-mushroom', category: 'Animals & Nature', prompt: 'Name a mushroom.',
    rules: 'Accept any mushroom (the fruiting body of a fungus), edible or poisonous, by its common or scientific name (button mushroom, portobello, shiitake, chanterelle, porcini, morel, truffle, fly agaric, death cap, oyster mushroom, puffball, enoki). Yeasts, moulds and lichens are not mushrooms.',
    source: 'Taxa of the mushroom-forming fungi (the classes Agaricomycetes and Pezizomycetes) in Wikidata that have an English common name, known in at least 6 languages, plus well-known ones added by hand.',
    pattern: `{ ?item wdt:P171+ wd:Q27720 } UNION { ?item wdt:P171+ wd:Q843232 } . ?item wdt:P1843 ?cnx . FILTER(lang(?cnx) = "en") ${NOT_EXTINCT}`, commonNames: true, minSignal: 6, skip: anyOf(TAXON(/^(mushrooms?|fungus|fungi|toadstools?)$|lichen/i), nameIs(/^(mushroom|mushrooms|fungus|fungi|edible mushroom|toadstool)$/i)),
    extras: [
      { name: 'Button mushroom', signal: 100, aliases: ['White mushroom', 'Champignon', 'Common mushroom'] }, { name: 'Portobello', signal: 100, aliases: ['Portabella', 'Portobello mushroom'] }, { name: 'Shiitake', signal: 100, aliases: ['Shitake'] },
      { name: 'Oyster mushroom', signal: 90 }, { name: 'Truffle', signal: 100 }, { name: 'Fly agaric', signal: 100, aliases: ['Fly amanita'] }, { name: 'Death cap', signal: 100 }, { name: 'Chanterelle', signal: 90 },
    ],
    mustHave: ['Button mushroom', 'Portobello', 'Shiitake', 'Chanterelle', 'Porcini', 'Morel', 'Truffle', 'Fly agaric', 'Death cap', 'Oyster mushroom', 'Puffball', 'Enoki', 'Cremini', 'Maitake', 'Lion\'s mane', 'Reishi', 'King oyster mushroom', 'Shimeji', 'Chicken of the woods', 'Destroying angel', 'Magic mushroom', 'Honey fungus', 'Ink cap', 'Parasol mushroom', 'Cep', 'Matsutake', 'Hen of the woods', 'Straw mushroom', 'Wood ear', 'Stinkhorn', 'Horn of plenty', 'Liberty cap', 'Giant puffball'],
  },
  {
    id: 'animals-bat', category: 'Animals & Nature', prompt: 'Name a bat.',
    rules: 'Accept any bat by its common or scientific name (fruit bat, vampire bat, pipistrelle, horseshoe bat, flying fox, free-tailed bat, long-eared bat, noctule, brown bat, Egyptian fruit bat), or a group name where every member is a bat. Fictional bats such as Batman do not count.',
    source: 'Species of the order of bats (Chiroptera) in Wikidata, without extinct ones, by their English common names, plus group names added by hand.',
    fetch: () => speciesBelow(['Q28425'], NOT_EXTINCT, 'Q7432', { depth: 9, commonNames: true, fame: true }), commonNames: true, skip: TAXON(/^bats?$/i),
    extras: [
      { name: 'Bat', signal: 150, aliases: ['Bats'] }, { name: 'Fruit bat', signal: 100, aliases: ['Fruit bats', 'Megabat'] }, { name: 'Vampire bat', signal: 110, aliases: ['Vampire bats'] }, { name: 'Flying fox', signal: 100, aliases: ['Flying foxes'] },
      { name: 'Pipistrelle', signal: 70, aliases: ['Pipistrelle bat'] }, { name: 'Horseshoe bat', signal: 70, aliases: ['Horseshoe bats'] }, { name: 'Microbat', signal: 50 }, { name: 'Free-tailed bat', signal: 60, aliases: ['Free tailed bat'] },
      { name: 'Noctule', signal: 50, aliases: ['Noctule bat'] }, { name: 'Long-eared bat', signal: 50, aliases: ['Long eared bat'] }, { name: 'Brown bat', signal: 60, aliases: ['Brown bats'] }, { name: 'Leaf-nosed bat', signal: 50 },
    ],
    mustHave: ['Vampire bat', 'Fruit bat', 'Flying fox', 'Pipistrelle', 'Horseshoe bat', 'Little brown bat', 'Egyptian fruit bat', 'Common vampire bat', 'Brown long-eared bat', 'Greater horseshoe bat', 'Mexican free-tailed bat', 'Big brown bat', 'Indiana bat', 'Straw-coloured fruit bat', 'Hoary bat', 'Noctule', 'Daubenton\'s bat', 'Serotine', 'Barbastelle', 'Ghost bat', 'Honduran white bat', 'Tube-nosed bat', 'Hammer-headed bat', 'Spotted bat', 'Bumblebee bat', 'Fishing bat', 'Lesser horseshoe bat', 'Gray bat', 'Pallid bat'],
    rename: ['Common vampire bat'],
  },
  {
    id: 'animals-wild-cat', category: 'Animals & Nature', prompt: 'Name a wild cat.',
    rules: 'Accept any wild cat, big or small, by its common or scientific name (lion, tiger, leopard, jaguar, cheetah, puma or cougar or mountain lion, lynx, ocelot, serval, caracal, snow leopard, clouded leopard, bobcat, wildcat, sand cat, margay, jaguarundi, fishing cat), or a well-known subspecies (Bengal tiger, Siberian tiger). The domestic cat and its breeds do not count.',
    source: 'Species of the cat family (Felidae) in Wikidata, without extinct ones and without the domestic cat, by their English common names, plus subspecies and group names added by hand.',
    fetch: () => speciesBelow(['Q25265'], NOT_EXTINCT, 'Q7432', { depth: 8, commonNames: true, fame: true }), commonNames: true, skip: anyOf(TAXON(/^wild ?cats?$/i), nameIs(/^(domestic cat|cat|house cat|feral cat|tabby cat)$/i)),
    extras: [
      { name: 'Big cat', signal: 100, aliases: ['Big cats'] }, { name: 'Panther', signal: 100, aliases: ['Black panther'] }, { name: 'Mountain lion', signal: 100, aliases: ['Cougar', 'Puma', 'Catamount'] }, { name: 'Bengal tiger', signal: 90 },
      { name: 'Siberian tiger', signal: 90, aliases: ['Amur tiger'] }, { name: 'Sumatran tiger', signal: 60 }, { name: 'White tiger', signal: 80 }, { name: 'Amur leopard', signal: 60 }, { name: 'Persian leopard', signal: 40 },
      { name: 'Asiatic lion', signal: 70, aliases: ['Indian lion'] }, { name: 'Barbary lion', signal: 40 }, { name: 'Iberian lynx', signal: 70 }, { name: 'Eurasian lynx', signal: 70 }, { name: 'Canada lynx', signal: 60 }, { name: 'Bobcat', signal: 80 },
      { name: 'Florida panther', signal: 60 }, { name: 'Black leopard', signal: 70 }, { name: 'Liger', signal: 60 }, { name: 'Tigon', signal: 30 }, { name: 'Savannah cat', signal: 40 }, { name: 'Cheetah', signal: 120 },
    ],
    mustHave: ['Lion', 'Tiger', 'Leopard', 'Jaguar', 'Cheetah', 'Puma', 'Lynx', 'Ocelot', 'Serval', 'Caracal', 'Snow leopard', 'Clouded leopard', 'Bobcat', 'Wildcat', 'Sand cat', 'Margay', 'Jaguarundi', 'Fishing cat', 'Pallas\'s cat', 'Black-footed cat', 'Eurasian lynx', 'Iberian lynx', 'Canada lynx', 'Bengal tiger', 'Siberian tiger', 'Black panther', 'Mountain lion', 'Cougar', 'Leopard cat', 'Jungle cat'],
    rename: ['Puma', 'Snow leopard'],
  },
  {
    id: 'animals-owl', category: 'Animals & Nature', prompt: 'Name an owl.',
    rules: 'Accept any owl by its common or scientific name (barn owl, snowy owl, great horned owl, tawny owl, barred owl, burrowing owl, eagle-owl, screech owl, little owl, long-eared owl, elf owl, spotted owl, boobook), or a group name where every member is an owl. Fictional owls (Hedwig, Owl from Winnie-the-Pooh) do not count.',
    source: 'Species of the order of owls (Strigiformes) in Wikidata, without extinct ones, by their English common names, plus group names added by hand.',
    fetch: () => speciesBelow(['Q25222'], NOT_EXTINCT, 'Q7432', { depth: 8, commonNames: true, fame: true }), commonNames: true, skip: TAXON(/^owls?$/i),
    extras: [
      { name: 'Owl', signal: 150, aliases: ['Owls'] }, { name: 'Eagle-owl', signal: 80, aliases: ['Eagle owl'] }, { name: 'Screech owl', signal: 90, aliases: ['Screech-owl'] }, { name: 'Horned owl', signal: 70, aliases: ['Great horned owl'] },
      { name: 'Snowy owl', signal: 110 }, { name: 'Barn owl', signal: 110 }, { name: 'Tawny owl', signal: 90, aliases: ['Brown owl'] }, { name: 'Burrowing owl', signal: 90 }, { name: 'Elf owl', signal: 60 }, { name: 'Pygmy owl', signal: 60, aliases: ['Pygmy-owl'] },
    ],
    mustHave: ['Barn owl', 'Snowy owl', 'Great horned owl', 'Tawny owl', 'Barred owl', 'Burrowing owl', 'Eurasian eagle-owl', 'Eastern screech owl', 'Little owl', 'Long-eared owl', 'Short-eared owl', 'Elf owl', 'Spotted owl', 'Boreal owl', 'Great grey owl', 'Northern saw-whet owl', 'Ural owl', 'Eastern grass owl', 'Spectacled owl', 'Blakiston\'s fish owl', 'Verreaux\'s eagle-owl', 'Northern pygmy owl', 'Powerful owl', 'Morepork', 'Ferruginous pygmy owl', 'Madagascar red owl', 'Oriental bay owl', 'Marsh owl', 'African wood owl', 'Mottled owl'],
    rename: ['Morepork'],
  },
  {
    id: 'animals-chicken-breed', category: 'Animals & Nature', prompt: 'Name a breed of chicken.',
    rules: 'Accept any breed of domestic chicken, by its name with or without the word "chicken" (Rhode Island Red, Leghorn, Plymouth Rock, Orpington, Sussex, Silkie, Wyandotte, Brahma, Cochin, Australorp, Marans, Ayam Cemani, Polish, Sebright). Wild junglefowl, turkeys, ducks and other birds do not count.',
    source: 'Breeds of chicken in Wikidata, known in at least 3 languages, with the plain breed name (without "chicken") added as another way to write it.',
    pattern: instanceOf('Q15304943'), minSignal: 3, skip: nameIs(/^(broiler|naked neck|chicken|chickens|bantam|rooster|hen|game fowl|laying hen)$/i), alsoWritten: strip(/ (chicken|fowl|hen)$/i),
    mustHave: ['Rhode Island Red', 'Leghorn', 'Plymouth Rock', 'Orpington', 'Sussex', 'Silkie', 'Wyandotte', 'Brahma', 'Cochin', 'Australorp', 'New Hampshire', 'Ancona', 'Minorca', 'Dorking', 'Faverolles', 'Polish', 'Sebright', 'Marans', 'Araucana', 'Ayam Cemani', 'Jersey Giant', 'Barred Rock', 'Cornish', 'Welsummer', 'Bantam', 'Andalusian', 'Hamburg', 'Houdan', 'Campine', 'Barnevelder'],
    rename: ['Plymouth Rock'],
  },
  {
    id: 'animals-sheep-breed', category: 'Animals & Nature', prompt: 'Name a breed of sheep.',
    rules: 'Accept any breed of domestic sheep, by its name with or without the word "sheep" (Merino, Suffolk, Texel, Dorset, Cheviot, Border Leicester, Romney, Jacob, Karakul, Shetland, Hampshire, Southdown, Corriedale, Rambouillet, Herdwick, Soay, Awassi, Dorper). Goats, wild sheep species and cattle do not count.',
    source: 'Breeds of sheep in Wikidata, known in at least 3 languages, with the plain breed name (without "sheep") added as another way to write it.',
    pattern: instanceOf('Q15622363'), minSignal: 3, alsoWritten: strip(/ sheep$/i),
    mustHave: ['Merino', 'Suffolk', 'Texel', 'Dorset', 'Cheviot', 'Border Leicester', 'Romney', 'Jacob', 'Karakul', 'Shetland', 'Hampshire', 'Southdown', 'Corriedale', 'Rambouillet', 'Lincoln', 'Scottish Blackface', 'Herdwick', 'Soay', 'Awassi', 'Dorper', 'Katahdin', 'Leicester Longwool', 'Wensleydale', 'Cotswold', 'Icelandic', 'Navajo-Churro', 'Swaledale', 'Lleyn', 'Poll Dorset', 'Finnsheep'],
  },

  // ================================================================ Food
  {
    id: 'food-mexican-dish', category: 'Food', prompt: 'Name a Mexican dish.',
    rules: 'Accept any dish of Mexican cuisine (taco, burrito, quesadilla, enchilada, guacamole, nachos, tamale, fajita, chilaquiles, pozole, mole, tostada, elote, carnitas, churro), including regional dishes and well-known sauces and desserts. Ingredients alone (avocado, chili) do not count.',
    source: 'Wikidata dishes that belong to Mexican cuisine or come from Mexico, known in at least 3 languages.',
    pattern: cuisineDishes('Q207965', 'Q96'), minSignal: 3,
    mustHave: ['Taco', 'Burrito', 'Quesadilla', 'Enchilada', 'Guacamole', 'Nachos', 'Tamale', 'Fajita', 'Chilaquiles', 'Pozole', 'Mole', 'Tostada', 'Elote', 'Carnitas', 'Churro', 'Huevos rancheros', 'Menudo', 'Tlayuda', 'Torta', 'Flan', 'Tres leches cake', 'Refried beans', 'Sope', 'Barbacoa', 'Birria', 'Tacos al pastor', 'Cochinita pibil', 'Chiles en nogada', 'Salsa', 'Pico de gallo', 'Taquito', 'Chimichanga', 'Burrito bowl', 'Horchata'],
    skip: nameIs(/cuisine$|^(tortilla|chili pepper|chile|maize|corn|food|dish)$/i),
  },
  {
    id: 'food-french-dish', category: 'Food', prompt: 'Name a French dish.',
    rules: 'Accept any dish of French cuisine (croissant, baguette, ratatouille, crêpe, quiche, coq au vin, bouillabaisse, escargots, cassoulet, crème brûlée, macaron, éclair, French onion soup, boeuf bourguignon, soufflé), including pastries, desserts and regional dishes. Ingredients alone do not count.',
    source: 'Wikidata dishes that belong to French cuisine or come from France, known in at least 3 languages.',
    pattern: cuisineDishes('Q6661', 'Q142'), minSignal: 3,
    mustHave: ['Croissant', 'Baguette', 'Ratatouille', 'Crêpe', 'Quiche', 'Coq au vin', 'Bouillabaisse', 'Escargot', 'Cassoulet', 'Crème brûlée', 'Macaron', 'Éclair', 'French onion soup', 'Boeuf bourguignon', 'Soufflé', 'Foie gras', 'Tarte Tatin', 'Pot-au-feu', 'Croque monsieur', 'Salade niçoise', 'Gratin dauphinois', 'Confit', 'Madeleine', 'Profiterole', 'Mille-feuille', 'Clafoutis', 'Fondue', 'Raclette', 'Tartiflette', 'Pain au chocolat', 'Quenelle', 'Vichyssoise', 'Moules-frites', 'Steak tartare', 'French toast', 'French fries'],
    skip: nameIs(/cuisine$|^(baguette de tradition|food|dish|butter|cheese|wine|soup|omelette|sauce)$/i),
    extraAliases: { 'snail as food': ['Escargot', 'Escargots'], 'Niçard salad': ['Salade niçoise', 'Niçoise salad', 'Nicoise salad'] },
  },
  {
    id: 'food-thai-dish', category: 'Food', prompt: 'Name a Thai dish.',
    rules: 'Accept any dish of Thai cuisine (pad Thai, tom yum, green curry, massaman curry, som tam, tom kha gai, pad kra pao, mango sticky rice, satay, red curry, larb, pad see ew, khao soi, Thai fried rice), including curries, soups, salads, noodles and desserts. Ingredients alone (lemongrass, fish sauce) do not count.',
    source: 'Wikidata dishes that belong to Thai cuisine or come from Thailand, known in at least 2 languages.',
    pattern: cuisineDishes('Q841984', 'Q869'), minSignal: 2,
    mustHave: ['Pad Thai', 'Tom yum', 'Green curry', 'Massaman curry', 'Som tam', 'Tom kha gai', 'Pad kra pao', 'Mango sticky rice', 'Satay', 'Red curry', 'Larb', 'Pad see ew', 'Khao soi', 'Thai fried rice', 'Panang curry', 'Yellow curry', 'Khao man gai', 'Thai iced tea', 'Spring roll', 'Gaeng som', 'Kuay teow', 'Pad prik khing', 'Moo ping', 'Thai green papaya salad', 'Boat noodles', 'Tub tim krob', 'Fish cake', 'Roti', 'Jaew', 'Nam prik'],
    skip: nameIs(/cuisine$|^(food|dish|fish sauce|rice|noodle|noodles)$/i),
  },
  {
    id: 'food-spanish-dish', category: 'Food', prompt: 'Name a Spanish dish.',
    rules: 'Accept any dish of Spanish cuisine (paella, tortilla española, gazpacho, churros, patatas bravas, croquetas, fabada, albóndigas, pulpo a la gallega, salmorejo, flan, crema catalana, empanada, cocido madrileño, pan con tomate), including tapas, cured meats and desserts. Ingredients alone do not count.',
    source: 'Wikidata dishes that belong to Spanish cuisine or come from Spain, known in at least 3 languages.',
    pattern: cuisineDishes('Q622512', 'Q29'), minSignal: 3,
    mustHave: ['Paella', 'Tortilla española', 'Gazpacho', 'Churros', 'Patatas bravas', 'Jamón ibérico', 'Croquetas', 'Fabada', 'Albóndigas', 'Pulpo a la gallega', 'Salmorejo', 'Flan', 'Crema catalana', 'Empanada', 'Cocido madrileño', 'Pan con tomate', 'Calamares', 'Gambas al ajillo', 'Pisto', 'Sangria', 'Tapas', 'Chorizo', 'Turrón', 'Pimientos de Padrón', 'Tarta de Santiago', 'Migas', 'Escalivada', 'Fideuà', 'Ensaladilla rusa', 'Bocadillo'],
    skip: nameIs(/cuisine$|^(food|dish|olive oil|wine|sherry)$/i),
  },
  {
    id: 'food-greek-dish', category: 'Food', prompt: 'Name a Greek dish.',
    rules: 'Accept any dish of Greek cuisine (moussaka, souvlaki, gyros, tzatziki, spanakopita, baklava, Greek salad, dolmades, pastitsio, saganaki, kleftiko, taramasalata, loukoumades, avgolemono, keftedes, stifado), including dips, pastries and desserts. Ingredients alone (feta, olives) do not count.',
    source: 'Wikidata dishes that belong to Greek cuisine or come from Greece, known in at least 2 languages.',
    pattern: cuisineDishes('Q744027', 'Q41'), minSignal: 2,
    mustHave: ['Moussaka', 'Souvlaki', 'Gyros', 'Tzatziki', 'Spanakopita', 'Baklava', 'Greek salad', 'Dolmades', 'Pastitsio', 'Saganaki', 'Kleftiko', 'Taramasalata', 'Loukoumades', 'Avgolemono', 'Keftedes', 'Stifado', 'Fasolada', 'Galaktoboureko', 'Tiropita', 'Gemista', 'Briam', 'Horiatiki', 'Halva', 'Kataifi', 'Fava', 'Melomakarona', 'Revithia', 'Bougatsa', 'Kolokithokeftedes', 'Skordalia'],
    skip: nameIs(/cuisine$|^(food|dish|feta|olive|olives|ouzo|retsina)$/i),
  },
  {
    id: 'food-turkish-dish', category: 'Food', prompt: 'Name a Turkish dish.',
    rules: 'Accept any dish of Turkish cuisine (kebab, döner, baklava, börek, dolma, lahmacun, pide, köfte, menemen, mantı, Turkish delight or lokum, İskender kebap, simit, gözleme, künefe, imam bayıldı), including pastries, kebabs and desserts. Ingredients alone do not count.',
    source: 'Wikidata dishes that belong to Turkish cuisine or come from Turkey, known in at least 2 languages.',
    pattern: cuisineDishes('Q654493', 'Q43'), minSignal: 2,
    mustHave: ['Kebab', 'Doner kebab', 'Baklava', 'Börek', 'Dolma', 'Lahmacun', 'Pide', 'Köfte', 'Menemen', 'Mantı', 'Turkish delight', 'İskender kebap', 'Shish kebab', 'Simit', 'Gözleme', 'Künefe', 'İmam bayıldı', 'Adana kebabı', 'Mercimek çorbası', 'Çiğ köfte', 'Kumpir', 'Sarma', 'Pilav', 'Ayran', 'Turkish coffee', 'Hummus', 'Cacık', 'Lokma', 'Revani', 'Aşure'],
    skip: nameIs(/cuisine$|^(food|dish|rice|turkish tea|tea|coffee)$/i),
  },
  {
    id: 'food-german-dish', category: 'Food', prompt: 'Name a German dish.',
    rules: 'Accept any dish of German cuisine (bratwurst, sauerkraut, schnitzel, pretzel, sauerbraten, currywurst, spätzle, strudel, Black Forest cake, Kartoffelsalat, Eisbein, Rouladen, Stollen, Lebkuchen, Weisswurst, Maultaschen), including sausages, breads, cakes and regional dishes. Ingredients alone do not count.',
    source: 'Wikidata dishes that belong to German cuisine or come from Germany, known in at least 3 languages.',
    pattern: cuisineDishes('Q47629', 'Q183'), minSignal: 3,
    mustHave: ['Bratwurst', 'Sauerkraut', 'Schnitzel', 'Pretzel', 'Sauerbraten', 'Currywurst', 'Spätzle', 'Strudel', 'Black Forest cake', 'Kartoffelsalat', 'Eisbein', 'Rouladen', 'Königsberger Klopse', 'Stollen', 'Lebkuchen', 'Weisswurst', 'Maultaschen', 'Käsespätzle', 'Leberkäse', 'Berliner', 'Kartoffelpuffer', 'Labskaus', 'Bienenstich', 'Apfelstrudel', 'Wiener Schnitzel', 'Frankfurter', 'Pumpernickel', 'Rotkohl', 'Knödel', 'Eintopf', 'Currywurst', 'Schweinshaxe', 'Spekulatius', 'Marzipan'],
    skip: nameIs(/cuisine$|^(food|dish|beer|bread|sausage|wurst)$/i),
  },
  {
    id: 'food-sausage', category: 'Food', prompt: 'Name a sausage.',
    rules: 'Accept any kind of sausage by name (bratwurst, chorizo, salami, pepperoni, frankfurter, kielbasa, mortadella, andouille, merguez, black pudding, boudin, sobrasada, Cumberland sausage, weisswurst, bologna, liverwurst, saveloy, Italian sausage, hot dog), or a well-known local sausage. Burgers, meatballs and plant-based "sausages" do not count unless they are sold as a named sausage.',
    source: 'Wikidata items that are a sausage or a kind of one, known in at least 3 languages.',
    pattern: kindOf('Q131419'), minSignal: 3,
    mustHave: ['Bratwurst', 'Chorizo', 'Salami', 'Pepperoni', 'Frankfurter', 'Kielbasa', 'Mortadella', 'Andouille', 'Merguez', 'Black pudding', 'Boudin', 'Sobrasada', 'Cumberland sausage', 'Weisswurst', 'Bologna', 'Liverwurst', 'Saveloy', 'Italian sausage', 'Hot dog', 'Lincolnshire sausage', 'Cervelat', 'Currywurst', 'Haggis', 'Linguiça', 'Cotechino', 'Lap cheong', 'Knackwurst', 'Chipolata', 'Boerewors', 'Nduja', 'Blood sausage', 'Breakfast sausage', 'Polish sausage', 'Vienna sausage'],
    skip: nameIs(/^(sausage|sausages|wurst|sausage roll|sausage casing|ground meat|salumi|cured meat|dry sausage|blood sausage product)$/i),
  },
  {
    id: 'food-breakfast-cereal', category: 'Food', prompt: 'Name a breakfast cereal.',
    rules: 'Accept any breakfast cereal, as a kind (cornflakes, muesli, granola, porridge oats, bran flakes, puffed rice, shredded wheat) or as a brand (Cheerios, Froot Loops, Frosted Flakes, Lucky Charms, Weetabix, Cap\'n Crunch, Rice Krispies, Cocoa Puffs, Shreddies, Special K, Honey Nut Cheerios, Cinnamon Toast Crunch).',
    source: 'Wikidata items that are a breakfast cereal or a kind or brand of one, known in at least 3 languages, plus well-known brands added by hand.',
    pattern: kindOf('Q768267'), minSignal: 3,
    extras: [
      { name: 'Cheerios', signal: 90 }, { name: 'Froot Loops', signal: 70, aliases: ['Fruit Loops'] }, { name: 'Frosted Flakes', signal: 70, aliases: ['Frosties', 'Frosted Corn Flakes'] }, { name: 'Lucky Charms', signal: 70 },
      { name: 'Weetabix', signal: 80 }, { name: 'Rice Krispies', signal: 80, aliases: ['Rice Bubbles'] }, { name: 'Cocoa Puffs', signal: 50 }, { name: 'Special K', signal: 60 }, { name: 'Coco Pops', signal: 50 }, { name: 'Shreddies', signal: 40 },
      { name: 'Cap\'n Crunch', signal: 80, aliases: ['Captain Crunch'] }, { name: 'Honey Nut Cheerios', signal: 75 }, { name: 'Raisin Bran', signal: 60 }, { name: 'Trix', signal: 65 }, { name: 'Cinnamon Toast Crunch', signal: 65 }, { name: 'Golden Grahams', signal: 45 }, { name: 'Grape-Nuts', signal: 55, aliases: ['Grape Nuts'] }, { name: 'Wheaties', signal: 60 }, { name: 'Corn Pops', signal: 45 }, { name: 'Kix', signal: 40 }, { name: 'Fruity Pebbles', signal: 50 }, { name: 'Cocoa Pebbles', signal: 45 }, { name: 'Apple Jacks', signal: 55 }, { name: 'Honey Bunches of Oats', signal: 50 }, { name: 'Frosted Mini-Wheats', signal: 50, aliases: ['Mini-Wheats', 'Frosted Mini Wheats'] }, { name: 'Life', signal: 45, aliases: ['Life cereal'] }, { name: 'Chex', signal: 50, aliases: ['Chex cereal'] }, { name: 'Corn Chex', signal: 35 }, { name: 'Rice Chex', signal: 35 }, { name: 'Wheat Chex', signal: 30 }, { name: 'Count Chocula', signal: 45 }, { name: 'Franken Berry', signal: 35, aliases: ['Frankenberry'] }, { name: 'Boo Berry', signal: 35 }, { name: 'Cookie Crisp', signal: 40 }, { name: 'Reese\'s Puffs', signal: 35 }, { name: 'Honey Smacks', signal: 40, aliases: ['Smacks', 'Sugar Smacks'] }, { name: 'Golden Crisp', signal: 30, aliases: ['Sugar Crisp'] }, { name: 'Fiber One', signal: 30 }, { name: 'Total', signal: 30, aliases: ['Total cereal'] }, { name: 'Product 19', signal: 20 }, { name: 'Quisp', signal: 25 }, { name: 'Quake', signal: 20 }, { name: 'Freakies', signal: 20 }, { name: 'Kaboom', signal: 15 }, { name: 'Crunch Berries', signal: 25, aliases: ['Cap\'n Crunch\'s Crunch Berries'] }, { name: 'Oreo O\'s', signal: 20 }, { name: 'Waffle Crisp', signal: 15 }, { name: 'Honeycomb', signal: 45 }, { name: 'Alpha-Bits', signal: 30, aliases: ['Alpha Bits'] }, { name: 'Kashi', signal: 30 }, { name: 'Krave', signal: 20 }, { name: 'Frosted Cheerios', signal: 20 }, { name: 'Multi Grain Cheerios', signal: 20, aliases: ['Multigrain Cheerios'] }, { name: 'Ricicles', signal: 30 }, { name: 'Sugar Puffs', signal: 40, aliases: ['Honey Monster Puffs'] }, { name: 'Ready Brek', signal: 35 }, { name: 'Alpen', signal: 40 }, { name: 'Weetos', signal: 25 }, { name: 'Golden Nuggets', signal: 20 }, { name: 'Crunchy Nut', signal: 40, aliases: ['Crunchy Nut Cornflakes'] }, { name: 'Chocapic', signal: 30 }, { name: 'Nesquik', signal: 35, aliases: ['Nesquik cereal'] }, { name: 'Lion', signal: 25, aliases: ['Lion cereal'] }, { name: 'Honey Loops', signal: 20 }, { name: 'Curiously Cinnamon', signal: 15 }, { name: 'Cheerios Oat Crunch', signal: 10 }, { name: 'Corn Flakes', signal: 90, aliases: ['Cornflakes', 'Kellogg\'s Corn Flakes'] }, { name: 'Muesli', signal: 70, aliases: ['Müsli'] }, { name: 'Granola', signal: 70 },
    ],
    mustHave: ['Cornflakes', 'Cheerios', 'Muesli', 'Granola', 'Froot Loops', 'Frosted Flakes', 'Lucky Charms', 'Weetabix', 'Rice Krispies', 'Special K', 'Shredded Wheat', 'Bran flakes', 'Porridge', 'Oatmeal', 'Cocoa Puffs', 'Coco Pops', 'Cap\'n Crunch', 'Honey Nut Cheerios', 'Raisin Bran', 'Trix', 'Cinnamon Toast Crunch', 'Golden Grahams', 'Shreddies', 'Alpen', 'Grape-Nuts', 'Puffed rice', 'Wheaties', 'Corn Pops', 'Kix', 'Fruity Pebbles'],
    skip: nameIs(/^(breakfast cereal|cereal|cereals|grain|oat|oats|porridge or oatmeal)$/i),
  },
  {
    id: 'food-noodle-dish', category: 'Food', prompt: 'Name a noodle dish.',
    rules: 'Accept any dish whose main ingredient is noodles, from any cuisine (pad Thai, ramen, pho, chow mein, lo mein, udon, soba, pancit, laksa, jajangmyeon, dan dan noodles, japchae, yakisoba, spaghetti, lasagne, mac and cheese, instant noodles, pasta dishes). Plain uncooked noodles and pasta shapes alone do not count.',
    source: 'Wikidata items that are a noodle dish or a kind of one, known in at least 3 languages.',
    pattern: kindOf('Q98826752'), minSignal: 3,
    mustHave: ['Ramen', 'Pad Thai', 'Pho', 'Chow mein', 'Lo mein', 'Udon', 'Soba', 'Pancit', 'Laksa', 'Jajangmyeon', 'Dan dan noodles', 'Japchae', 'Yakisoba', 'Spaghetti', 'Lasagne', 'Mac and cheese', 'Instant noodles', 'Spaghetti carbonara', 'Spaghetti bolognese', 'Fettuccine Alfredo', 'Naengmyeon', 'Pad see ew', 'Mie goreng', 'Beef noodle soup', 'Char kway teow', 'Hokkien mee', 'Tonkotsu ramen', 'Cold noodles', 'Biang biang noodles', 'Kitsune udon', 'Zaru soba', 'Pasta primavera', 'Lanzhou beef noodle soup', 'Tom yum noodles'],
    skip: nameIs(/^(noodle|noodles|pasta|noodle dish|instant noodle|rice noodles|egg noodles)$/i),
  },

  // ================================================================ Games
  {
    id: 'games-playstation-game', category: 'Games', prompt: 'Name a PlayStation game.',
    rules: 'Accept any video game released for a PlayStation console (PlayStation 1 to 5, PSP or Vita), including games that also came out on other consoles (The Last of Us, God of War, Uncharted, Gran Turismo, Marvel\'s Spider-Man, Horizon Zero Dawn, Bloodborne, Metal Gear Solid, Final Fantasy VII, Crash Bandicoot, Spyro, Ratchet & Clank, Grand Theft Auto V, Minecraft). Board games and films do not count.',
    source: 'Wikidata video games released on PlayStation, PlayStation 2, 3, 4, 5, PSP or Vita, known in at least 25 languages.',
    pattern: ON('Q10677', 'Q10680', 'Q10683', 'Q5014725', 'Q63184502', 'Q170325', 'Q188808'), minSignal: 25,
    mustHave: ['The Last of Us', 'God of War', 'Uncharted 4: A Thief\'s End', 'Gran Turismo', 'Marvel\'s Spider-Man', 'Horizon Zero Dawn', 'Bloodborne', 'Metal Gear Solid', 'Final Fantasy VII', 'Crash Bandicoot', 'Spyro the Dragon', 'Ratchet & Clank', 'Grand Theft Auto V', 'Minecraft', 'Shadow of the Colossus', 'Persona 5', 'Red Dead Redemption 2', 'Tekken 3', 'Resident Evil 2', 'Silent Hill 2', 'Ghost of Tsushima', 'Demon\'s Souls', 'Astro Bot', 'Journey', 'LittleBigPlanet', 'The Last Guardian', 'Death Stranding', 'Tomb Raider', 'Gran Turismo 4', 'Fortnite'],
  },
  {
    id: 'games-xbox-game', category: 'Games', prompt: 'Name an Xbox game.',
    rules: 'Accept any video game released for an Xbox console (Xbox, Xbox 360, Xbox One, Xbox Series X|S), including games that also came out on other consoles (Halo, Gears of War, Forza, Fable, Sea of Thieves, Fallout, Mass Effect, Starfield, Minecraft, Grand Theft Auto V). Board games and films do not count.',
    source: 'Wikidata video games released on Xbox, Xbox 360, Xbox One or Xbox Series X|S, known in at least 25 languages.',
    pattern: ON('Q132020', 'Q48263', 'Q13361286', 'Q98973368'), minSignal: 25,
    mustHave: ['Halo: Combat Evolved', 'Halo 3', 'Halo 2', 'Halo: Reach', 'Gears of War', 'Forza Horizon 4', 'Forza Motorsport', 'Fable', 'Sea of Thieves', 'Fallout 4', 'Mass Effect', 'Starfield', 'Minecraft', 'Grand Theft Auto V', 'Red Dead Redemption', 'Ori and the Blind Forest', 'Alan Wake', 'Crackdown', 'Banjo-Kazooie', 'Skyrim', 'The Elder Scrolls V: Skyrim', 'Call of Duty: Modern Warfare 2', 'Halo Infinite', 'Gears 5', 'Forza Horizon 5', 'Hellblade: Senua\'s Sacrifice', 'Dead Rising', 'Viva Piñata', 'Perfect Dark', 'Fortnite'],
  },
  {
    id: 'games-sega-game', category: 'Games', prompt: 'Name a Sega game.',
    rules: 'Accept any video game made or published by Sega (Sonic the Hedgehog, Shenmue, Streets of Rage, Golden Axe, Virtua Fighter, Yakuza or Like a Dragon, Crazy Taxi, Phantasy Star, Altered Beast, Alex Kidd, Total War, Persona, Football Manager, Super Monkey Ball, Jet Set Radio, Out Run, Space Harrier, After Burner, Panzer Dragoon, Alien: Isolation).',
    source: 'Wikidata video games published or developed by Sega, known in at least 8 languages.',
    pattern: `${GAME} { ?item wdt:P123 wd:Q122741 } UNION { ?item wdt:P178 wd:Q122741 } .`, minSignal: 8,
    mustHave: ['Sonic the Hedgehog', 'Sonic the Hedgehog 2', 'Sonic Adventure', 'Shenmue', 'Streets of Rage', 'Golden Axe', 'Virtua Fighter', 'Yakuza 0', 'Crazy Taxi', 'Phantasy Star', 'Altered Beast', 'Alex Kidd in Miracle World', 'Total War: Shogun 2', 'Persona 5', 'Football Manager', 'Super Monkey Ball', 'Jet Set Radio', 'Out Run', 'Space Harrier', 'After Burner', 'Panzer Dragoon', 'Alien: Isolation', 'Sonic Mania', 'Sonic Colors', 'Virtua Tennis', 'House of the Dead', 'NiGHTS into Dreams', 'Sega Rally Championship', 'Daytona USA', 'Ecco the Dolphin'],
  },
  {
    id: 'games-gameboy-game', category: 'Games', prompt: 'Name a Game Boy game.',
    rules: 'Accept any video game released for the Game Boy, Game Boy Color or Game Boy Advance, including ports of games from other systems (Tetris, Pokémon Red, Blue, Yellow, Gold, Silver, Crystal, Ruby, Sapphire or FireRed, Super Mario Land, The Legend of Zelda: Link\'s Awakening, Kirby\'s Dream Land, Metroid II, Wario Land, Donkey Kong Land, Pokémon Pinball, Dr. Mario, Mega Man, Castlevania, Advance Wars, Fire Emblem, Golden Sun, The Minish Cap, Metroid Fusion).',
    source: 'Wikidata video games released on the Game Boy, Game Boy Color or Game Boy Advance, known in at least 12 languages.',
    pattern: `${GAME} ?item wdt:P400 ?plt . VALUES ?plt { wd:Q10676 wd:Q203992 wd:Q187606 }`, minSignal: 12,
    mustHave: ['Tetris', 'Pokémon Red and Blue', 'Pokémon Yellow', 'Pokémon Gold and Silver', 'Pokémon Crystal', 'Super Mario Land', 'The Legend of Zelda: Link\'s Awakening', 'Kirby\'s Dream Land', 'Metroid II: Return of Samus', 'Wario Land: Super Mario Land 3', 'Donkey Kong Land', 'Pokémon Pinball', 'Dr. Mario', 'Mega Man', 'Castlevania: The Adventure', 'Pokémon Ruby and Sapphire', 'Pokémon FireRed and LeafGreen', 'Advance Wars', 'Fire Emblem', 'Mario Kart: Super Circuit', 'The Legend of Zelda: The Minish Cap', 'Metroid Fusion', 'Golden Sun', 'Mario & Luigi: Superstar Saga', 'Final Fantasy Tactics Advance', 'Super Mario Advance 3: Yoshi\'s Island', 'Super Mario Bros. Deluxe', 'Pac-Man', 'Doom', 'Harvest Moon'],
  },
  {
    id: 'games-simulation-game', category: 'Games', prompt: 'Name a simulation video game.',
    rules: 'Accept any video game of the simulation genre: life, city-building, farming, vehicle, flight or management simulators (The Sims, SimCity, Microsoft Flight Simulator, Farming Simulator, Euro Truck Simulator, Cities: Skylines, RollerCoaster Tycoon, Stardew Valley, Animal Crossing, Planet Zoo, Kerbal Space Program, Goat Simulator, Spore, Harvest Moon, Theme Park, Zoo Tycoon, Tropico).',
    source: 'Wikidata video games whose genre is simulation video game, known in at least 12 languages.',
    pattern: `{ ${GAME.replace(/ \.$/, '')} } UNION { ?item wdt:P31/wdt:P279* wd:Q7058673 } . ?item wdt:P136 ?gx . ?gx wdt:P279* wd:Q1610017 .`, minSignal: 12,
    skip: nameIs(/^(Minecraft|Grand Theft Auto V|Grand Theft Auto Online|Duck Hunt|Spacewar!|Garry's Mod|Papers, Please|Civilization.*|Gran Turismo.*|No Man's Sky|EVE Online|Tamagotchi|Plague Inc\.|RapeLay|Playboy: The Mansion|FIFA.*|eFootball.*|Madden.*|NBA 2K.*)$/i),
    mustHave: ['The Sims', 'SimCity', 'Microsoft Flight Simulator', 'Farming Simulator', 'Euro Truck Simulator 2', 'Cities: Skylines', 'RollerCoaster Tycoon', 'Stardew Valley', 'Animal Crossing: New Horizons', 'Planet Zoo', 'Kerbal Space Program', 'Goat Simulator', 'Spore', 'Harvest Moon', 'Theme Park', 'Zoo Tycoon', 'Tropico', 'The Sims 4', 'SimCity 2000', 'Sim City 4', 'Roller Coaster Tycoon 2', 'Planet Coaster', 'Flight Simulator', 'X-Plane', 'Football Manager', 'Two Point Hospital', 'Theme Hospital', 'Prison Architect', 'Banished', 'Surgeon Simulator'],
  },
  {
    id: 'games-sports-video-game', category: 'Games', prompt: 'Name a sports video game.',
    rules: 'Accept any video game of the sports genre, whichever sport it simulates (FIFA or EA Sports FC, Madden NFL, NBA 2K, Wii Sports, Tony Hawk\'s Pro Skater, Pro Evolution Soccer, NHL, Football Manager, Mario Tennis, Mario Golf, Punch-Out!!, NBA Jam, Skate, Virtua Tennis, Top Spin, Tiger Woods PGA Tour, Fight Night, MLB The Show, Rocket League).',
    source: 'Wikidata video games whose genre is sports video game, known in at least 12 languages.',
    pattern: `{ ${GAME.replace(/ \.$/, '')} } UNION { ?item wdt:P31/wdt:P279* wd:Q7058673 } . ?item wdt:P136 wd:Q868217 .`, minSignal: 8,
    skip: nameIs(/^(Pong|Tennis for Two|Steep|Baseball|Golf|Mario)$/i),
    mustHave: ['FIFA 23', 'FIFA 98', 'Madden NFL', 'NBA 2K', 'Wii Sports', 'Tony Hawk\'s Pro Skater', 'Pro Evolution Soccer', 'NHL 94', 'Football Manager', 'Mario Tennis', 'Mario Golf', 'Punch-Out!!', 'NBA Jam', 'Skate', 'Virtua Tennis', 'Top Spin', 'Tiger Woods PGA Tour', 'Fight Night', 'MLB The Show', 'Rocket League', 'Wii Sports Resort', 'Blood Bowl', 'EA Sports UFC', 'Tony Hawk\'s Pro Skater 2', 'NBA Street', 'FIFA Street', 'Wii Fit', 'Mario Strikers', 'Sensible Soccer', 'Kick Off'],
  },
  {
    id: 'games-horror-game', category: 'Games', prompt: 'Name a survival horror video game.',
    rules: 'Accept any video game of the survival horror genre (Resident Evil, Silent Hill, Dead Space, Alien: Isolation, Amnesia, Five Nights at Freddy\'s, Outlast, The Evil Within, Fatal Frame, Alone in the Dark, Clock Tower, Until Dawn, Layers of Fear, The Last of Us), including sequels and remakes.',
    source: 'Wikidata video games whose genre is survival horror, known in at least 10 languages.',
    pattern: GENRE('Q333967'), minSignal: 10,
    mustHave: ['Resident Evil', 'Resident Evil 2', 'Resident Evil 4', 'Silent Hill', 'Silent Hill 2', 'Dead Space', 'Alien: Isolation', 'Amnesia: The Dark Descent', 'Five Nights at Freddy\'s', 'Outlast', 'The Evil Within', 'Fatal Frame', 'Alone in the Dark', 'Clock Tower', 'Until Dawn', 'Layers of Fear', 'The Last of Us', 'Resident Evil Village', 'Resident Evil 7: Biohazard', 'Dying Light', 'Condemned: Criminal Origins', 'Siren', 'Project Zero', 'Little Nightmares', 'Soma', 'Darkwood', 'Dead Space 2', 'Resident Evil 3', 'Resident Evil Code: Veronica', 'Visage'],
  },
  {
    id: 'games-switch-game', category: 'Games', prompt: 'Name a Nintendo Switch game.',
    rules: 'Accept any video game released for the Nintendo Switch, including games that also came out on other systems (The Legend of Zelda: Breath of the Wild, Mario Kart 8 Deluxe, Super Mario Odyssey, Animal Crossing: New Horizons, Super Smash Bros. Ultimate, Splatoon, Pokémon Sword and Shield, Minecraft, Fortnite, Stardew Valley, Hades, Celeste, Among Us, Undertale, Hollow Knight, Cuphead, Fire Emblem: Three Houses, Xenoblade Chronicles). Board games and films do not count.',
    source: 'Wikidata video games released on the Nintendo Switch, known in at least 12 languages.',
    pattern: ON('Q19610114'), minSignal: 12,
    mustHave: ['The Legend of Zelda: Breath of the Wild', 'Mario Kart 8 Deluxe', 'Super Mario Odyssey', 'Animal Crossing: New Horizons', 'Super Smash Bros. Ultimate', 'Splatoon 2', 'Pokémon Sword and Shield', 'Minecraft', 'Fortnite', 'Stardew Valley', 'Hades', 'Celeste', 'Among Us', 'Undertale', 'Super Mario Party', 'Luigi\'s Mansion 3', 'Metroid Dread', 'Kirby and the Forgotten Land', 'Pokémon Scarlet and Violet', 'The Legend of Zelda: Tears of the Kingdom', 'Ring Fit Adventure', 'Hollow Knight', 'Cuphead', 'Fire Emblem: Three Houses', 'Xenoblade Chronicles 2', 'Super Mario Bros. Wonder', 'Pikmin 4', 'Splatoon 3', 'Doom', 'The Witcher 3: Wild Hunt'],
  },
  {
    id: 'games-wii-game', category: 'Games', prompt: 'Name a Wii game.',
    rules: 'Accept any video game released for the Nintendo Wii, including ports and games that also came out on other consoles (Wii Sports, Mario Kart Wii, Super Smash Bros. Brawl, Wii Fit, Super Mario Galaxy, New Super Mario Bros. Wii, Wii Sports Resort, The Legend of Zelda: Twilight Princess, Just Dance, Metroid Prime 3, Donkey Kong Country Returns, Xenoblade Chronicles, Kirby\'s Epic Yarn, Wii Play, Mario Party 8, Resident Evil 4, Call of Duty: Black Ops, Guitar Hero III, Rock Band, Skyward Sword, Punch-Out!!, Sonic Colors, GoldenEye 007, Epic Mickey, Okami).',
    source: 'Wikidata video games released on the Wii, known in at least 8 languages.',
    pattern: ON('Q8079'), minSignal: 8,
    mustHave: ['Wii Sports', 'Mario Kart Wii', 'Super Smash Bros. Brawl', 'Wii Fit', 'Super Mario Galaxy', 'New Super Mario Bros. Wii', 'Wii Sports Resort', 'The Legend of Zelda: Twilight Princess', 'Just Dance', 'Animal Crossing: City Folk', 'Metroid Prime 3: Corruption', 'Super Paper Mario', 'Donkey Kong Country Returns', 'Xenoblade Chronicles', 'The Last Story', 'Kirby\'s Epic Yarn', 'Wii Play', 'Mario Party 8', 'Resident Evil 4', 'Call of Duty: Black Ops', 'Guitar Hero III: Legends of Rock', 'Rock Band', 'The Legend of Zelda: Skyward Sword', 'Punch-Out!!', 'Sonic Colors', 'GoldenEye 007', 'Epic Mickey', 'Okami', 'Super Mario Galaxy 2', 'Wii Party'],
  },
  {
    id: 'games-snes-game', category: 'Games', prompt: 'Name a Super Nintendo game.',
    rules: 'Accept any video game released for the Super Nintendo Entertainment System (SNES or Super Famicom), including ports (Super Mario World, The Legend of Zelda: A Link to the Past, Super Metroid, Chrono Trigger, Donkey Kong Country, Super Mario Kart, Final Fantasy VI, Street Fighter II, EarthBound, Super Mario All-Stars, Yoshi\'s Island, F-Zero, Star Fox, Secret of Mana, Super Castlevania IV, Mega Man X, Kirby Super Star, Super Punch-Out!!, Contra III, Final Fantasy IV, Killer Instinct, Mortal Kombat II, ActRaiser, Super Ghouls \'n Ghosts).',
    source: 'Wikidata video games released on the Super Nintendo Entertainment System, known in at least 8 languages.',
    pattern: ON('Q183259'), minSignal: 8,
    mustHave: ['Super Mario World', 'The Legend of Zelda: A Link to the Past', 'Super Metroid', 'Chrono Trigger', 'Donkey Kong Country', 'Super Mario Kart', 'Final Fantasy VI', 'Street Fighter II', 'EarthBound', 'Super Mario All-Stars', 'Super Mario World 2: Yoshi\'s Island', 'F-Zero', 'Star Fox', 'Secret of Mana', 'Super Castlevania IV', 'Mega Man X', 'Kirby Super Star', 'Super Punch-Out!!', 'Contra III: The Alien Wars', 'Final Fantasy IV', 'Killer Instinct', 'Mortal Kombat II', 'ActRaiser', 'Super Ghouls \'n Ghosts', 'Pilotwings', 'Donkey Kong Country 2: Diddy\'s Kong Quest', 'Lufia II', 'Illusion of Gaia', 'Super Mario Bros. 3', 'Final Fantasy V'],
  },

  // ================================================================ History & Mythology
  {
    id: 'history-norse-figure', category: 'History & Mythology', prompt: 'Name a god, goddess or other figure from Norse mythology.',
    rules: 'Accept any named god, goddess, giant, creature or hero of Norse mythology (Odin, Thor, Loki, Freya, Frigg, Baldur, Tyr, Heimdall, Freyr, Njord, Hel, Sif, Idun, Bragi, Skadi, Fenrir, Jörmungandr, Sleipnir, Valkyrie, Surtr, Ymir, Norns, Ragnarök\'s monsters). Places (Asgard, Midgard), objects (Mjölnir) and the sagas themselves do not count.',
    source: 'Wikidata Norse deities and figures filed under Norse mythology, known in at least 3 languages.',
    pattern: `{ ?item wdt:P31/wdt:P279* wd:Q16513881 } UNION { ?item wdt:P1080 wd:Q128285 } UNION { ?item wdt:P361 wd:Q128285 } . ?item wdt:P31/wdt:P279* ?kindx . VALUES ?kindx { wd:Q16513881 wd:Q178885 wd:Q2239243 wd:Q95074 wd:Q21070568 wd:Q4271324 wd:Q3030248 wd:Q24334685 }`, minSignal: 3,
    skip: nameIs(/^(elf|elves|dwarf|dwarves|giant|giants|ragnarök|æsir–vanir war|urðarbrunnr|lævateinn|yggdrasil|mjölnir|valhalla|ásgarðr|asgard|midgard|bifröst|gungnir|draupnir)$/i),
    mustHave: ['Odin', 'Thor', 'Loki', 'Freyja', 'Frigg', 'Baldr', 'Týr', 'Heimdall', 'Freyr', 'Njörðr', 'Hel', 'Sif', 'Iðunn', 'Bragi', 'Skaði', 'Fenrir', 'Jörmungandr', 'Sleipnir', 'Valkyrie', 'Surtr', 'Ymir', 'Norns', 'Víðarr', 'Váli', 'Ullr', 'Forseti', 'Hœnir', 'Mímir', 'Sigurd', 'Brynhildr', 'Ægir', 'Rán', 'Gefjon', 'Nidhogg', 'Ratatoskr', 'Huginn and Muninn'],
    rename: ['Freyja', 'Baldr', 'Týr', 'Njörðr', 'Iðunn', 'Skaði'],
  },
  {
    id: 'history-roman-god', category: 'History & Mythology', prompt: 'Name a Roman god or goddess.',
    rules: 'Accept any god or goddess of ancient Roman religion, by its Roman name (Jupiter, Juno, Mars, Venus, Minerva, Neptune, Apollo, Diana, Vulcan, Mercury, Ceres, Bacchus, Saturn, Vesta, Janus, Pluto, Cupid, Aurora, Fortuna, Victoria, Faunus, Flora, Sol, Luna, Proserpina). The Greek names of the same gods (Zeus, Hera, Athena) do not count here.',
    source: 'Wikidata Roman deities (gods and goddesses of ancient Roman religion), known in at least 4 languages.',
    pattern: instanceOf('Q11688446'), minSignal: 4,
    mustHave: ['Jupiter', 'Juno', 'Mars', 'Venus', 'Minerva', 'Neptune', 'Apollo', 'Diana', 'Vulcan', 'Mercury', 'Ceres', 'Bacchus', 'Saturn', 'Vesta', 'Janus', 'Pluto', 'Cupid', 'Aurora', 'Fortuna', 'Victoria', 'Faunus', 'Flora', 'Sol', 'Luna', 'Proserpina', 'Hercules', 'Bellona', 'Terminus', 'Quirinus', 'Somnus', 'Pomona', 'Tellus', 'Orcus', 'Liber', 'Lares', 'Concordia'],
    skip: nameIs(/^(deity|god|goddess|roman deity|gods|di consentes|gaia|lucifer)$/i),
  },
  {
    id: 'history-historian', category: 'History & Mythology', prompt: 'Name a historian.',
    rules: 'Accept any person who wrote or studied history as their main work, ancient or modern (Herodotus, Thucydides, Livy, Tacitus, Plutarch, Edward Gibbon, Thomas Carlyle, Eric Hobsbawm, Mary Beard, Niall Ferguson, Howard Zinn, Yuval Noah Harari, Barbara Tuchman, Simon Schama, A. J. P. Taylor, Ibn Khaldun, Sima Qian), by full name or surname. Novelists and politicians who also wrote history do not count unless they are mainly known as historians.',
    source: 'People in Wikidata whose occupation is historian and whose description names history, known in at least 15 languages.',
    pattern: occupation('Q201788') + HUMAN, minSignal: 15, alsoWritten: personForms,
    skip: anyOf(notDescribedAs(/histor|chronicl|annalist/i), nameIs(/^alfred thayer maan$/i)),
    extras: [{ name: 'Alfred Thayer Mahan', signal: 25 }],
    mustHave: ['Herodotus', 'Thucydides', 'Livy', 'Tacitus', 'Plutarch', 'Edward Gibbon', 'Thomas Carlyle', 'Eric Hobsbawm', 'Mary Beard', 'Niall Ferguson', 'Howard Zinn', 'Yuval Noah Harari', 'Barbara W. Tuchman', 'Simon Schama', 'A. J. P. Taylor', 'Ibn Khaldun', 'Sima Qian', 'Josephus', 'Bede', 'Polybius', 'Xenophon', 'Suetonius', 'Livy', 'Jacob Burckhardt', 'Leopold von Ranke', 'Arnold J. Toynbee', 'Fernand Braudel', 'Antony Beevor', 'Will Durant', 'David McCullough'],
  },
  {
    id: 'history-civil-rights-activist', category: 'History & Mythology', prompt: 'Name a civil rights activist.',
    rules: 'Accept any person known for campaigning for civil rights or racial equality, anywhere in the world (Martin Luther King Jr., Rosa Parks, Malcolm X, Nelson Mandela, Frederick Douglass, Harriet Tubman, Medgar Evers, Thurgood Marshall, John Lewis, Ruby Bridges, W. E. B. Du Bois, Booker T. Washington, Cesar Chavez, Fannie Lou Hamer, Bayard Rustin, Angela Davis, Desmond Tutu, Steve Biko, Mahatma Gandhi), by full name or surname.',
    source: 'People in Wikidata whose occupation is civil rights advocate or activist, with a description naming civil rights, equality, anti-apartheid or the abolition of slavery, known in at least 12 languages.',
    pattern: `${occupation('Q1021386', 'Q15253558')} ${HUMAN}`, minSignal: 12, alsoWritten: personForms,
    skip: notDescribedAs(/civil rights|rights activist|equality|abolition|anti-apartheid|segregation|suffrag|human rights|african.american|black power|pan-africa/i),
    mustHave: ['Martin Luther King Jr.', 'Rosa Parks', 'Malcolm X', 'Nelson Mandela', 'Frederick Douglass', 'Harriet Tubman', 'Medgar Evers', 'Thurgood Marshall', 'John Lewis', 'Ruby Bridges', 'W. E. B. Du Bois', 'Booker T. Washington', 'César Chávez', 'Fannie Lou Hamer', 'Bayard Rustin', 'Angela Davis', 'Desmond Tutu', 'Steve Biko', 'Mahatma Gandhi', 'Sojourner Truth', 'Ella Baker', 'Jesse Jackson', 'Al Sharpton', 'Coretta Scott King', 'Stokely Carmichael', 'Huey P. Newton', 'Marcus Garvey', 'Claudette Colvin', 'Emmett Till', 'Malala Yousafzai'],
  },
  {
    id: 'history-civil-war-general', category: 'History & Mythology', prompt: 'Name a general from the American Civil War.',
    rules: 'Accept any general of the Union or the Confederacy in the American Civil War (Ulysses S. Grant, Robert E. Lee, William Tecumseh Sherman, Stonewall Jackson, George McClellan, George Meade, Joseph Hooker, Ambrose Burnside, James Longstreet, J. E. B. Stuart, Philip Sheridan, Nathan Bedford Forrest, George Pickett, Jubal Early, Braxton Bragg, Joseph E. Johnston, P. G. T. Beauregard, George Custer), by full name or surname.',
    source: 'People in Wikidata who took part in the American Civil War as military officers, whose description names a general or the Union or Confederate army, known in at least 6 languages.',
    pattern: `?item wdt:P607 wd:Q8676 . ?item wdt:P106 ?ocx . VALUES ?ocx { wd:Q189290 wd:Q83460 wd:Q47064 } . ${HUMAN}`, minSignal: 6, alsoWritten: personForms,
    skip: notDescribedAs(/general|union army|confederate|army officer|brigadier|major general|lieutenant general/i),
    mustHave: ['Ulysses S. Grant', 'Robert E. Lee', 'William Tecumseh Sherman', 'Stonewall Jackson', 'George B. McClellan', 'George Meade', 'Joseph Hooker', 'Ambrose Burnside', 'James Longstreet', 'J. E. B. Stuart', 'Philip Sheridan', 'Nathan Bedford Forrest', 'George Pickett', 'Jubal Early', 'Braxton Bragg', 'Joseph E. Johnston', 'P. G. T. Beauregard', 'George Armstrong Custer', 'John Bell Hood', 'Winfield Scott Hancock', 'Henry W. Halleck', 'Don Carlos Buell', 'John Pope', 'Albert Sidney Johnston', 'A. P. Hill', 'Richard S. Ewell', 'George Thomas', 'William Rosecrans', 'Lew Wallace', 'Daniel Sickles'],
  },
  {
    id: 'history-native-american-tribe', category: 'History & Mythology', prompt: 'Name a Native American tribe.',
    rules: 'Accept any Native American or First Nations tribe, nation or people of the United States or Canada (Cherokee, Navajo, Sioux or Lakota, Apache, Cheyenne, Comanche, Mohawk, Iroquois, Seminole, Hopi, Pawnee, Shawnee, Blackfoot, Choctaw, Creek, Crow, Arapaho, Ojibwe, Cree, Ute, Zuni, Huron, Chickasaw, Osage, Kiowa, Nez Perce, Pequot, Powhatan, Wampanoag), by its common name. Mesoamerican and South American peoples (Aztec, Maya, Inca) belong to other questions.',
    source: 'Wikidata Native American tribes and peoples (the class and the tribes filed under it), known in at least 4 languages.',
    pattern: instanceOf('Q12885585'), minSignal: 3, alsoWritten: strip(/ (Nation|people|Tribe|Tribes|Indian Tribe|Pueblo|Band|Indians)$/i),
    extras: [{ name: 'Cherokee', signal: 120 }, { name: 'Navajo', signal: 119 }, { name: 'Sioux', signal: 118 }, { name: 'Apache', signal: 117 }, { name: 'Cheyenne', signal: 116 }, { name: 'Comanche', signal: 115 }, { name: 'Mohawk', signal: 114 }, { name: 'Iroquois', signal: 113 }, { name: 'Seminole', signal: 112 }, { name: 'Hopi', signal: 111 }, { name: 'Pawnee', signal: 110 }, { name: 'Shawnee', signal: 109 }, { name: 'Blackfoot', signal: 108 }, { name: 'Lakota', signal: 107 }, { name: 'Choctaw', signal: 106 }, { name: 'Creek', signal: 105 }, { name: 'Crow', signal: 104 }, { name: 'Arapaho', signal: 103 }, { name: 'Ojibwe', signal: 102 }, { name: 'Cree', signal: 101 }, { name: 'Ute', signal: 100 }, { name: 'Zuni', signal: 99 }, { name: 'Pueblo', signal: 98 }, { name: 'Mohegan', signal: 97 }, { name: 'Huron', signal: 96 }, { name: 'Chickasaw', signal: 95 }, { name: 'Osage', signal: 94 }, { name: 'Kiowa', signal: 93 }, { name: 'Nez Perce', signal: 92 }, { name: 'Pequot', signal: 91 }, { name: 'Powhatan', signal: 90 }, { name: 'Wampanoag', signal: 89 }, { name: 'Delaware', signal: 88 }, { name: 'Miami', signal: 87 }, { name: 'Mandan', signal: 86 }, { name: 'Shoshone', signal: 85 }, { name: 'Paiute', signal: 84 }, { name: 'Yakama', signal: 83 }, { name: 'Inuit', signal: 82 }, { name: 'Haida', signal: 81 }, { name: 'Algonquin', signal: 80 }, { name: 'Oneida', signal: 79 }, { name: 'Seneca', signal: 78 }, { name: 'Cayuga', signal: 77 }, { name: 'Onondaga', signal: 76 }, { name: 'Tuscarora', signal: 75 }, { name: 'Chippewa', signal: 74 }, { name: 'Potawatomi', signal: 73 }, { name: 'Sac and Fox', signal: 72 }, { name: 'Winnebago', signal: 71 }, { name: 'Kickapoo', signal: 70 }, { name: 'Illinois', signal: 69 }, { name: 'Mohican', signal: 68 }, { name: 'Narragansett', signal: 67 }, { name: 'Abenaki', signal: 66 }, { name: 'Micmac', signal: 65 }, { name: 'Salish', signal: 64 }, { name: 'Chinook', signal: 63 }, { name: 'Tlingit', signal: 62 }, { name: 'Aleut', signal: 61 }, { name: 'Yurok', signal: 60 }, { name: 'Modoc', signal: 59 }, { name: 'Klamath', signal: 58 }, { name: 'Cahuilla', signal: 57 }, { name: 'Chumash', signal: 56 }, { name: 'Tohono O\'odham', signal: 55 }, { name: 'Pima', signal: 54 }, { name: 'Yaqui', signal: 53 }, { name: 'Mojave', signal: 52 }, { name: 'Quechan', signal: 51 }, { name: 'Havasupai', signal: 50 }, { name: 'Hualapai', signal: 49 }, { name: 'Wichita', signal: 48 }, { name: 'Caddo', signal: 47 }, { name: 'Tonkawa', signal: 46 }, { name: 'Natchez', signal: 45 }, { name: 'Timucua', signal: 44 }, { name: 'Calusa', signal: 43 }, { name: 'Tuscarora', signal: 42 }],
    mustHave: ['Cherokee', 'Navajo', 'Sioux', 'Apache', 'Cheyenne', 'Comanche', 'Mohawk', 'Iroquois', 'Seminole', 'Hopi', 'Pawnee', 'Shawnee', 'Blackfoot', 'Lakota', 'Choctaw', 'Creek', 'Crow', 'Arapaho', 'Ojibwe', 'Cree', 'Ute', 'Zuni', 'Pueblo', 'Mohegan', 'Huron', 'Chickasaw', 'Osage', 'Kiowa', 'Nez Perce', 'Pequot', 'Powhatan', 'Wampanoag', 'Delaware', 'Miami', 'Mandan', 'Shoshone', 'Paiute', 'Yakama', 'Inuit', 'Haida'],
    skip: nameIs(/^(native american|native americans|indigenous peoples? of the americas|first nations|tribe|american indian)$/i),
  },
  {
    id: 'history-military-operation', category: 'History & Mythology', prompt: 'Name a military operation.',
    rules: 'Accept any named military operation or campaign plan, by its name with or without the word "Operation" (Overlord, Barbarossa, Market Garden, Desert Storm, Torch, Dynamo, Neptune, Sea Lion, Fortitude, Valkyrie, Iraqi Freedom, Enduring Freedom, Husky, Anvil, Citadel, Bagration, Chastise, Eagle Claw). D-Day is accepted as Operation Overlord\'s landings. Battles, wars and sieges are other questions.',
    source: 'Wikidata items that are a military operation, known in at least 12 languages, with the plain codename (without "Operation") added as another way to write it.',
    pattern: kindOf('Q645883'), minSignal: 12, alsoWritten: strip(/^Operation /i),
    mustHave: ['Operation Overlord', 'Operation Barbarossa', 'Operation Market Garden', 'Operation Desert Storm', 'Operation Torch', 'Operation Dynamo', 'Operation Neptune', 'Operation Sea Lion', 'Operation Fortitude', 'Operation Valkyrie', 'Operation Iraqi Freedom', 'Operation Enduring Freedom', 'Operation Husky', 'Operation Anvil', 'Operation Citadel', 'Operation Bagration', 'Operation Chastise', 'Operation Eagle Claw', 'Operation Neptune Spear', 'Operation Paperclip', 'Operation Ajax', 'Operation Mincemeat', 'Operation Frequent Wind', 'Operation Rolling Thunder', 'Operation Linebacker', 'Operation Typhoon', 'Operation Cobra', 'Operation Uranus', 'Operation Opera', 'Operation Entebbe'],
    skip: anyOf(nameIs(/^(military operation|operation|military campaign|special operation|covert operation)$/i), (c) => !/^Operation\b/i.test(c.name)),
  },
  {
    id: 'history-siege', category: 'History & Mythology', prompt: 'Name a siege.',
    rules: 'Accept any siege of a city, castle or fortress, by its full name or just the place (Siege of Vienna or Vienna, Constantinople, Leningrad, Jerusalem, Orléans, Malta, Yorktown, Acre, Masada, Sarajevo, Troy, Tenochtitlan, Rhodes, Stalingrad, Antioch, Carthage, Syracuse, Alesia, Khartoum, Mafeking, Ladysmith, Dien Bien Phu).',
    source: 'Wikidata items that are a siege, known in at least 12 languages, with the plain place name (without "Siege of") added as another way to write it.',
    pattern: kindOf('Q188055'), minSignal: 12, alsoWritten: strip(/^(Siege|Sieges|Battle) of (the )?/i),
    mustHave: ['Siege of Vienna', 'Siege of Constantinople', 'Siege of Leningrad', 'Siege of Jerusalem', 'Siege of Orléans', 'Siege of Malta', 'Siege of Yorktown', 'Siege of Acre', 'Siege of Masada', 'Siege of Sarajevo', 'Siege of Troy', 'Siege of Tenochtitlan', 'Siege of Rhodes', 'Siege of Stalingrad', 'Siege of Antioch', 'Siege of Carthage', 'Siege of Syracuse', 'Siege of Alesia', 'Siege of Khartoum', 'Siege of Mafeking', 'Siege of Ladysmith', 'Siege of Dien Bien Phu', 'Siege of Gibraltar', 'Siege of Calais', 'Siege of Petersburg', 'Siege of Vicksburg', 'Siege of the Alamo', 'Siege of Candia', 'Siege of Famagusta', 'Siege of Mosul'],
    skip: anyOf(nameIs(/^(siege|sieges|siege warfare)$/i), (c) => !/siege|fall of|sack of|blockade|defen[cs]e of/i.test(c.name)),
  },
  {
    id: 'history-spy', category: 'History & Mythology', prompt: 'Name a spy.',
    rules: 'Accept any real spy, double agent or intelligence officer, whichever side or era (Mata Hari, Kim Philby, Aldrich Ames, Robert Hanssen, Julius and Ethel Rosenberg, Sidney Reilly, Richard Sorge, Anna Chapman, Klaus Fuchs, Eddie Chapman, Virginia Hall, Nathan Hale, Belle Boyd, Oleg Gordievsky, Noor Inayat Khan, Violette Szabo, Christine Granville, Juan Pujol García), by full name or surname. Fictional spies (James Bond, Jason Bourne) do not count.',
    source: 'People in Wikidata whose occupation is spy and whose description names spying, espionage or intelligence, known in at least 10 languages.',
    pattern: occupation('Q9352089') + HUMAN, minSignal: 10, alsoWritten: personForms,
    skip: notDescribedAs(/spy|espionage|intelligence|agent|double agent|informant|mole/i),
    mustHave: ['Mata Hari', 'Kim Philby', 'Aldrich Ames', 'Robert Hanssen', 'Julius Rosenberg', 'Ethel Rosenberg', 'Sidney Reilly', 'Richard Sorge', 'Anna Chapman', 'Klaus Fuchs', 'Eddie Chapman', 'Virginia Hall', 'Nathan Hale', 'Belle Boyd', 'Oleg Gordievsky', 'Noor Inayat Khan', 'Violette Szabo', 'Christine Granville', 'Juan Pujol García', 'Benedict Arnold', 'Guy Burgess', 'Donald Maclean', 'Anthony Blunt', 'John Cairncross', 'Rudolf Abel', 'Oleg Penkovsky', 'Cynthia', 'Fritz Joubert Duquesne', 'Moe Berg', 'Josephine Baker'],
  },
  {
    id: 'history-revolutionary', category: 'History & Mythology', prompt: 'Name a revolutionary.',
    rules: 'Accept any person known for leading or fighting in a revolution, anywhere in the world (Lenin, Che Guevara, Fidel Castro, Simón Bolívar, Mao Zedong, Leon Trotsky, Ho Chi Minh, Maximilien Robespierre, Karl Marx, Emiliano Zapata, Pancho Villa, Giuseppe Garibaldi, Toussaint Louverture, José Martí, Sun Yat-sen, Rosa Luxemburg, Georges Danton, Samuel Adams, Thomas Paine), by full name or surname.',
    source: 'People in Wikidata whose occupation is revolutionary and whose description names a revolution or revolutionary, known in at least 15 languages.',
    pattern: occupation('Q3242115') + HUMAN, minSignal: 15, alsoWritten: personForms,
    skip: notDescribedAs(/revolution|insurgent|guerrilla|rebel|independence|communist|socialist|anarchist/i),
    mustHave: ['Vladimir Lenin', 'Che Guevara', 'Fidel Castro', 'Simón Bolívar', 'Mao Zedong', 'Leon Trotsky', 'Ho Chi Minh', 'Maximilien Robespierre', 'Karl Marx', 'Emiliano Zapata', 'Pancho Villa', 'Giuseppe Garibaldi', 'Toussaint Louverture', 'José Martí', 'Sun Yat-sen', 'Rosa Luxemburg', 'Georges Danton', 'Samuel Adams', 'Thomas Paine', 'Jean-Paul Marat', 'Patrick Henry', 'Camilo Cienfuegos', 'Sandino', 'Mikhail Bakunin', 'Friedrich Engels', 'Nestor Makhno', 'Zhou Enlai', 'Subhas Chandra Bose', 'José de San Martín', 'Bernardo O\'Higgins'],
  },

  // ================================================================ Miscellaneous
  {
    id: 'misc-martial-art', category: 'Miscellaneous', prompt: 'Name a martial art.',
    rules: 'Accept any martial art or combat sport, by its name (karate, judo, taekwondo, kung fu, aikido, jiu-jitsu, Brazilian jiu-jitsu, Muay Thai, kickboxing, boxing, wrestling, capoeira, Krav Maga, kendo, sumo, tai chi, Wing Chun, hapkido, sambo, savate, fencing, kali, silat), including its styles. Dances and fictional fighting styles do not count.',
    source: 'Wikidata items that are a martial art or a kind of one, known in at least 4 languages.',
    pattern: kindOf('Q11417'), minSignal: 4,
    mustHave: ['Karate', 'Judo', 'Taekwondo', 'Kung fu', 'Aikido', 'Jujutsu', 'Brazilian jiu-jitsu', 'Muay Thai', 'Kickboxing', 'Boxing', 'Wrestling', 'Capoeira', 'Krav Maga', 'Kendo', 'Sumo', 'Tai chi', 'Wing Chun', 'Hapkido', 'Sambo', 'Savate', 'Fencing', 'Kali', 'Silat', 'Shaolin kung fu', 'Jeet Kune Do', 'Kyokushin', 'Ninjutsu', 'Iaido', 'Mixed martial arts', 'Systema', 'Kalaripayattu', 'Escrima', 'Shotokan', 'Taekkyeon'],
    skip: nameIs(/^(martial arts?|combat sport|fighting style|self-defen[cs]e|combat|.*universiade.*|.*institute.*|side control|.* at the .*)$/i),
  },
  {
    id: 'misc-furniture', category: 'Miscellaneous', prompt: 'Name a piece of furniture.',
    rules: 'Accept any piece of furniture, as a kind or as a famous named design (chair, table, sofa or couch, bed, desk, wardrobe, bookcase, cabinet, stool, bench, dresser, armchair, ottoman, nightstand, futon, hammock, rocking chair, recliner, sideboard, chaise longue, bunk bed, coffee table, bean bag). Rooms, appliances and decorations do not count.',
    source: 'Wikidata items that are furniture or a kind of it, known in at least 5 languages.',
    pattern: kindOf('Q14745'), minSignal: 5,
    mustHave: ['Chair', 'Table', 'Sofa', 'Bed', 'Desk', 'Wardrobe', 'Bookcase', 'Cabinet', 'Stool', 'Bench', 'Couch', 'Dresser', 'Armchair', 'Ottoman', 'Chest of drawers', 'Nightstand', 'Futon', 'Hammock', 'Rocking chair', 'Recliner', 'Sideboard', 'Chaise longue', 'Bunk bed', 'Coffee table', 'Dining table', 'Bean bag', 'Bookshelf', 'Shelf', 'Four-poster bed', 'Footstool', 'Rocking horse', 'Crib', 'Throne', 'Highchair'],
    skip: nameIs(/^(furniture|furnishing|furnishings|piece of furniture|household goods|seat|seating|.*sex.*|.*flagpole.*|annunciation.*|advertising column|salad bar|organ case|.*dental.*|sundial.*|altar|menorah|coffin|curia of pompey)$/i),
  },
  {
    id: 'misc-shoe', category: 'Miscellaneous', prompt: 'Name a type of shoe or boot.',
    rules: 'Accept any kind of shoe, boot or sandal (sneaker or trainer, boot, sandal, high heels, loafer, flip-flops, moccasin, clog, slipper, Oxford, stiletto, ballet flat, espadrille, Wellington boot, cowboy boot, platform shoe, brogue, Mary Jane, Derby, pump, Chelsea boot, Doc Martens). Socks, hats and brands alone do not count.',
    source: 'Wikidata items that are a shoe or a kind of one, known in at least 5 languages.',
    pattern: kindOf('Q22676'), minSignal: 5,
    mustHave: ['Sneaker', 'Boot', 'Sandal', 'High-heeled shoe', 'Loafer', 'Flip-flops', 'Moccasin', 'Clog', 'Slipper', 'Oxford shoe', 'Stiletto', 'Ballet flat', 'Espadrille', 'Wellington boot', 'Cowboy boot', 'Platform shoe', 'Brogue', 'Mary Jane', 'Derby shoe', 'Court shoe', 'Chelsea boot', 'Combat boot', 'Hiking boot', 'Ugg boots', 'Mule', 'Winklepicker', 'Jelly shoes', 'Boat shoe', 'Snow boot', 'Football boot', 'Ballet shoe', 'Tap shoe', 'Slingback', 'Wedge'],
    skip: nameIs(/^(shoe|shoes|footwear|boot|boots)$/i),
  },
  {
    id: 'misc-fabric', category: 'Miscellaneous', prompt: 'Name a fabric or textile.',
    rules: 'Accept any fabric or textile, natural or man-made (cotton, silk, wool, linen, denim, velvet, satin, polyester, nylon, cashmere, tweed, corduroy, flannel, lace, chiffon, fleece, spandex or Lycra, tulle, canvas, muslin, taffeta, gingham, organza, rayon, jersey). Single fibres and leather count when sold as a cloth; clothes and brands do not.',
    source: 'Wikidata items that are a textile or a kind of one, known in at least 5 languages.',
    pattern: kindOf('Q28823'), minSignal: 5,
    mustHave: ['Cotton', 'Silk', 'Wool', 'Linen', 'Denim', 'Velvet', 'Satin', 'Polyester', 'Nylon', 'Cashmere', 'Tweed', 'Corduroy', 'Flannel', 'Lace', 'Chiffon', 'Fleece', 'Spandex', 'Tulle', 'Canvas', 'Muslin', 'Taffeta', 'Gingham', 'Organza', 'Rayon', 'Jersey', 'Leather', 'Suede', 'Mohair', 'Hemp', 'Brocade', 'Damask', 'Felt', 'Twill', 'Seersucker', 'Chambray', 'Poplin', 'Gabardine', 'Tartan'],
    skip: nameIs(/^(textile|textiles|fabric|fabrics|cloth|material|woven fabric|knitted fabric|nonwoven fabric|.*sex.*|wash mitt|net curtain|velum.*)$/i),
  },
  {
    id: 'misc-architectural-style', category: 'Miscellaneous', prompt: 'Name an architectural style.',
    rules: 'Accept any named style or movement of architecture (Gothic, Baroque, Romanesque, Art Deco, Neoclassical, Renaissance, Brutalism, Modernism, Art Nouveau, Georgian, Victorian, Tudor, Bauhaus, Postmodern, Byzantine, Palladian, Rococo, Colonial, Greek Revival, Gothic Revival, International Style, Deconstructivism, Mid-century modern), with or without the word "architecture".',
    source: 'Wikidata items that are an architectural style, known in at least 6 languages, with the plain name (without "architecture") added as another way to write it.',
    pattern: instanceOf('Q32880'), minSignal: 6, alsoWritten: strip(/ (architecture|style|architectural style)$/i),
    mustHave: ['Gothic architecture', 'Baroque architecture', 'Romanesque architecture', 'Art Deco', 'Neoclassical architecture', 'Renaissance architecture', 'Brutalist architecture', 'Modern architecture', 'Art Nouveau', 'Georgian architecture', 'Victorian architecture', 'Tudor architecture', 'Bauhaus', 'Postmodern architecture', 'Byzantine architecture', 'Palladian architecture', 'Rococo', 'Colonial architecture', 'Greek Revival architecture', 'Gothic Revival architecture', 'International Style', 'Deconstructivism', 'Mid-century modern', 'Islamic architecture', 'Moorish architecture', 'Beaux-Arts architecture', 'Prairie School', 'Craftsman', 'Mission Revival Style', 'Streamline Moderne'],
    skip: nameIs(/^(architectural style|style|architecture|building style|nazi architecture|romanticism|cubism|pop art|realism|academic art)$/i),
  },
  {
    id: 'misc-bank', category: 'Miscellaneous', prompt: 'Name a bank.',
    rules: 'Accept any bank, commercial, investment or central, anywhere in the world (JPMorgan Chase, Bank of America, HSBC, Citibank, Wells Fargo, Barclays, Goldman Sachs, Deutsche Bank, UBS, BNP Paribas, Santander, Lloyds, NatWest, Standard Chartered, DBS, Morgan Stanley, Royal Bank of Canada, ICBC, Bank of England, Federal Reserve), by its common name, with or without "Bank".',
    source: 'Wikidata items that are a bank or a kind of one (commercial, investment, central), known in at least 15 languages.',
    pattern: kindOf('Q22687'), minSignal: 15, alsoWritten: strip(/ (Bank|Group|Holdings|plc|Ltd|AG|SA)$/i),
    mustHave: ['JPMorgan Chase', 'Bank of America', 'HSBC', 'Citibank', 'Wells Fargo', 'Barclays', 'Goldman Sachs', 'Deutsche Bank', 'UBS', 'BNP Paribas', 'Santander', 'Lloyds Bank', 'NatWest', 'Standard Chartered', 'DBS Bank', 'Morgan Stanley', 'Royal Bank of Canada', 'Industrial and Commercial Bank of China', 'Bank of England', 'Federal Reserve', 'European Central Bank', 'Credit Suisse', 'ING', 'Société Générale', 'Credit Agricole', 'Commerzbank', 'Bank of China', 'Mizuho', 'MUFG', 'World Bank'],
    skip: nameIs(/^(bank|banks|commercial bank|central bank|investment bank|savings bank|merchant bank|retail bank|development bank)$/i),
  },
  {
    id: 'misc-political-ideology', category: 'Miscellaneous', prompt: 'Name a political ideology.',
    rules: 'Accept any political ideology or "-ism" about how a country should be run (socialism, communism, liberalism, conservatism, fascism, anarchism, nationalism, libertarianism, Marxism, feminism, populism, environmentalism, social democracy, Nazism, monarchism, republicanism, neoliberalism, Maoism, Leninism, Stalinism, Trotskyism, Zionism, progressivism, centrism), with or without the ending.',
    source: 'Wikidata items that are a political ideology, known in at least 10 languages, with the plain word (without "-ism") added as another way to write it.',
    pattern: instanceOf('Q12909644'), minSignal: 10, alsoWritten: (n) => (/ism$/i.test(n) ? [n.replace(/ism$/i, 'ist')] : []),
    mustHave: ['Socialism', 'Communism', 'Liberalism', 'Conservatism', 'Fascism', 'Anarchism', 'Nationalism', 'Libertarianism', 'Marxism', 'Feminism', 'Populism', 'Environmentalism', 'Social democracy', 'Nazism', 'Monarchism', 'Republicanism', 'Neoliberalism', 'Maoism', 'Leninism', 'Stalinism', 'Trotskyism', 'Zionism', 'Progressivism', 'Centrism', 'Capitalism', 'Totalitarianism', 'Authoritarianism', 'Imperialism', 'Pacifism', 'Federalism', 'Syndicalism', 'Christian democracy', 'Green politics', 'Anarcho-capitalism'],
    skip: nameIs(/^(political ideology|ideology|politics|political philosophy|hamas|2020 hanau shootings|nazi-maoism|opposition to pornography)$/i),
  },
  {
    id: 'misc-clothing-item', category: 'Miscellaneous', prompt: 'Name an item of clothing.',
    rules: 'Accept any garment or piece of clothing, worldwide (shirt, trousers or pants, dress, skirt, jacket, coat, jeans, T-shirt, sweater, shorts, suit, tie, scarf, gloves, hoodie, blouse, kimono, sari, cardigan, bikini, poncho, kilt, tuxedo, trench coat). Shoes and hats have their own questions, and fabrics, brands and jewellery do not count.',
    source: 'Wikidata items that are clothing or a kind of it, known in at least 8 languages, without footwear and headwear.',
    pattern: kindOf('Q11460'), minSignal: 8,
    mustHave: ['Shirt', 'Trousers', 'Dress', 'Skirt', 'Jacket', 'Coat', 'Jeans', 'T-shirt', 'Sweater', 'Shorts', 'Suit', 'Necktie', 'Scarf', 'Glove', 'Hoodie', 'Blouse', 'Kimono', 'Sari', 'Cardigan', 'Bikini', 'Poncho', 'Kilt', 'Tuxedo', 'Trench coat', 'Leggings', 'Pyjamas', 'Underwear', 'Socks', 'Belt', 'Vest', 'Waistcoat', 'Overalls', 'Cape', 'Tracksuit', 'Swimsuit', 'Cloak'],
    skip: anyOf(nameIs(/\b(medals?|decorations?|awards?|badges?|diadem|honou?rs?|gallantry|insignia)\b|order of|cross for|cock ring|\bsex\b|dickin|^cockade$|dildo|fetish|bondage|bdsm|explosive belt|suicide vest|sator square/i), nameIs(/^(clothing|clothes|garment|garments|apparel|attire|outerwear|underwear and nightwear|fashion|dress code)$/i), nameIs(/shoe|boot|sandal|sneaker|slipper|footwear|\bhat\b|cap$|helmet|crown|headwear|headgear|hood$/i)),
  },
  {
    id: 'music-record-label', category: 'Music', prompt: 'Name a record label.',
    rules: 'Accept any record label, major or independent, anywhere in the world, by its name with or without the word Records (Universal Music Group, Sony Music, Warner Music Group, EMI, Columbia Records, Atlantic Records, Interscope Records, Island Records, Capitol Records, Motown, RCA Records, Virgin Records, Parlophone, Epic Records, Def Jam Recordings, Geffen Records, Sub Pop, Blue Note Records, Stax Records, Elektra Records, Decca Records, Deutsche Grammophon, XL Recordings, Nuclear Blast, Death Row Records, YG Entertainment, SM Entertainment). Music streaming services, radio stations and television channels do not count.',
    source: 'Wikidata items that are a record label or a kind of one, known in at least 12 languages, plus the best-known labels added by hand.',
    pattern: kindOf('Q18127'), minSignal: 12, alsoWritten: strip(/ (Records|Recordings|Record Company|Music Group|Music Entertainment|Music|Entertainment|Recording Company)$/i),
    skip: nameIs(/^(record label|label|music label|independent record label|major label|imprint|jtbc|gmm grammy|netflix|youtube|spotify|tiktok)$/i),
    mustHave: ['Universal Music Group', 'Sony Music Entertainment', 'Warner Music Group', 'EMI', 'Columbia Records', 'Atlantic Records', 'Interscope Records', 'Island Records', 'Capitol Records', 'Motown', 'RCA Records', 'Virgin Records', 'Parlophone', 'Epic Records', 'Def Jam Recordings', 'Geffen Records', 'Sub Pop', 'Blue Note Records', 'Stax Records', 'Elektra Records', 'Mercury Records', 'Decca Records', 'Deutsche Grammophon', 'Apple Records', 'XL Recordings', '4AD', 'Domino Recording Company', 'Rough Trade Records', 'Warp Records', 'Nuclear Blast', 'Roadrunner Records', 'Death Row Records', 'Bad Boy Records', 'Cash Money Records', 'Roc-A-Fella Records', 'Aftermath Entertainment', 'Shady Records', 'Republic Records', 'Big Machine Records', 'Sire Records', 'Reprise Records', 'Verve Records', 'Chess Records', 'Sun Records', 'Arista Records', 'A&M Records', 'Polydor Records', 'Hollywood Records'],
  },
  // moved to the end: the heaviest query of the batch (millions of insect taxa)
  {
    id: 'animals-insect', category: 'Animals & Nature', prompt: 'Name an insect.',
    rules: 'Accept any insect by its common or scientific name (ant, honey bee, housefly, ladybird, dragonfly, mosquito, cockroach, grasshopper, firefly, praying mantis, termite, flea), or a group name where every member is an insect (beetle, wasp, fly, moth). Spiders, scorpions, ticks, centipedes, worms and snails are not insects.',
    source: 'Taxa of the main insect orders (beetles, bugs, grasshoppers, dragonflies, cockroaches, mantises and others) and of the main families of ants, bees, wasps and flies in Wikidata that have an English common name, known in at least 12 languages, without extinct ones, plus group names added by hand.',
    fetch: namedBelow(['Q22671', 'Q26371', 'Q167810', 'Q25375', 'Q25309', 'Q131250', 'Q156438', 'Q388162', 'Q188029', 'Q13676', 'Q7386', 'Q756082', 'Q7037230', 'Q133302', 'Q1138186', 'Q1280932', 'Q2276661', 'Q530200', 'Q7367', 'Q217905', 'Q474636', 'Q228241', 'Q527224', 'Q28404', 'Q1054318', 'Q626843'], 12), commonNames: true, minSignal: 12, skip: TAXON(/^insects?$/i),
    extras: [
      { name: 'Ant', signal: 150, aliases: ['Ants'] }, { name: 'Bee', signal: 150, aliases: ['Bees'] }, { name: 'Wasp', signal: 130, aliases: ['Wasps'] }, { name: 'Beetle', signal: 130, aliases: ['Beetles'] },
      { name: 'Fly', signal: 140, aliases: ['Flies'] }, { name: 'Mosquito', signal: 140, aliases: ['Mosquitoes', 'Mosquitos'] }, { name: 'Butterfly', signal: 150, aliases: ['Butterflies'] }, { name: 'Moth', signal: 130, aliases: ['Moths'] },
      { name: 'Grasshopper', signal: 120, aliases: ['Grasshoppers'] }, { name: 'Cricket', signal: 100, aliases: ['Crickets'] }, { name: 'Dragonfly', signal: 120, aliases: ['Dragonflies'] }, { name: 'Ladybug', signal: 120, aliases: ['Ladybird', 'Lady bug', 'Ladybirds'] },
      { name: 'Cockroach', signal: 110, aliases: ['Cockroaches', 'Roach'] }, { name: 'Termite', signal: 110, aliases: ['Termites'] }, { name: 'Firefly', signal: 110, aliases: ['Fireflies', 'Lightning bug'] }, { name: 'Praying mantis', signal: 110, aliases: ['Mantis'] },
    ],
    mustHave: ['Ant', 'Bee', 'Butterfly', 'Wasp', 'Beetle', 'Fly', 'Mosquito', 'Ladybug', 'Grasshopper', 'Dragonfly', 'Cockroach', 'Firefly', 'Praying mantis', 'Termite', 'Honey bee', 'Bumblebee', 'Cricket', 'Moth', 'Housefly', 'Locust', 'Cicada', 'Flea', 'Aphid', 'Earwig', 'Stick insect', 'Hornet', 'Mayfly', 'Louse', 'Weevil', 'Stag beetle', 'Monarch butterfly', 'Silverfish', 'Damselfly', 'Lacewing', 'Fire ant', 'Bed bug', 'Horsefly', 'Katydid', 'Dung beetle'],
    rename: ['Ladybug', 'Honey bee'],
  },
]
