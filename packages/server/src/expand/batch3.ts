/**
 * Batch 3: 50 new questions (Animals & Nature 5, Food 5, Games 4, History & Mythology 5, Places 5, Science & Technology 5, Movies & TV 5,
 * Music 4, Sports 5, Transport & Vehicles 3, Miscellaneous 4), none of them a class we already have (see batch1.ts and batch2.ts).
 * Same recipe as before (newq.ts): a Wikidata class or occupation, a minimum number of Wikipedia languages so the list has a head
 * people know, and `mustHave` = the answers a casual English-speaking player thinks of first, most obvious first.
 * Classes were chosen by looking at how a FAMOUS example is filed in Wikidata (docs/ANSWER_LISTS.md): Chinese dynasties are not "dynasty",
 * sainthood is a "canonization status", anime series are separate from their manga, and so on.
 * Build with: npx tsx src/expand/newq.ts --batch batch3 --out C:/Users/weibi/minitude/list-build/batch3
 */
import { speciesBelow } from './build'
import type { NewQuestion } from './newq'
import { anyInstance, anyKind, heldPosition, HUMAN, instanceOf, kindOf, latinOnly, nameIs, NOT_EXTINCT, notDescribedAs, occupation, personForms, strip } from './recipes'

const MOTO_SUFFIX = / (Motorcycles|Motorcycle|Motor Company|Motors|Motorrad|Corporation)$/
const STATION_SUFFIX = / (railway |railroad |train )?(station|Station|Terminal)$/
const CASTLE = (n: string): string[] => [...strip(/ Castle$/)(n), ...strip(/^(Château de |Château d'|Schloss |Castello |Castillo de )/)(n)]

export const BATCH: NewQuestion[] = [
  // ================================================================ Animals & Nature
  {
    id: 'animals-reptile', category: 'Animals & Nature', prompt: 'Name a reptile.',
    rules: 'Accept any living reptile by its common name (Komodo dragon, green sea turtle, king cobra) or its scientific name, including group names where every member is a reptile (such as snake, lizard, turtle, gecko or crocodile). Amphibians such as frogs and salamanders, birds, dinosaurs, extinct reptiles and fictional ones do not count.',
    source: 'Species below the four living reptile orders in Wikidata (scaly reptiles, turtles, crocodilians, the tuatara; without extinct ones), by their English common names, plus group names added by hand.',
    fetch: () => speciesBelow(['Q122422', 'Q223044', 'Q25363', 'Q15099738'], NOT_EXTINCT, 'Q7432', { depth: 12, commonNames: true, fame: true }), commonNames: true, skip: latinOnly,
    extras: [
      { name: 'Snake', signal: 120, aliases: ['snakes'] }, { name: 'Lizard', signal: 110, aliases: ['lizards'] }, { name: 'Turtle', signal: 110, aliases: ['turtles', 'sea turtle'] }, { name: 'Tortoise', signal: 100, aliases: ['tortoises'] },
      { name: 'Crocodile', signal: 110, aliases: ['crocodiles'] }, { name: 'Alligator', signal: 100, aliases: ['alligators'] }, { name: 'Gecko', signal: 90 }, { name: 'Iguana', signal: 90 }, { name: 'Chameleon', signal: 90 },
      { name: 'Cobra', signal: 90 }, { name: 'Python', signal: 90 }, { name: 'Rattlesnake', signal: 80 }, { name: 'Viper', signal: 70 }, { name: 'Skink', signal: 50 }, { name: 'Monitor lizard', signal: 60 },
    ],
    mustHave: ['Snake', 'Lizard', 'Crocodile', 'Turtle', 'Alligator', 'Tortoise', 'Gecko', 'Iguana', 'Chameleon', 'Komodo dragon', 'Cobra', 'Python', 'Anaconda', 'Rattlesnake', 'King cobra', 'Boa constrictor', 'Green sea turtle', 'Nile crocodile', 'American alligator', 'Bearded dragon', 'Monitor lizard', 'Black mamba', 'Gila monster', 'Leopard gecko', 'Frilled lizard', 'Skink', 'Tuatara', 'Corn snake', 'Ball python', 'Viper', 'Galápagos tortoise', 'Snapping turtle', 'Box turtle', 'Slow worm', 'Garter snake', 'Saltwater crocodile', 'Green iguana', 'Veiled chameleon', 'Horned lizard', 'Basilisk'],
    rename: ['Komodo dragon', 'King cobra', 'Green sea turtle', 'Bearded dragon', 'Box turtle', 'Veiled chameleon'],
  },
  {
    id: 'animals-amphibian', category: 'Animals & Nature', prompt: 'Name an amphibian.',
    rules: 'Accept any living amphibian by its common name (axolotl, poison dart frog, fire salamander) or its scientific name, including group names where every member is an amphibian (such as frog, toad, newt, salamander or caecilian). Reptiles, fish, extinct amphibians and fictional ones do not count.',
    source: 'Species below the class "amphibian" in Wikidata (without extinct ones), by their English common names, plus group names added by hand.',
    fetch: () => speciesBelow(['Q10908'], NOT_EXTINCT, 'Q7432', { depth: 11, commonNames: true, fame: true }), commonNames: true, skip: latinOnly,
    extras: [
      { name: 'Frog', signal: 120, aliases: ['frogs'] }, { name: 'Toad', signal: 110, aliases: ['toads'] }, { name: 'Salamander', signal: 100 }, { name: 'Newt', signal: 90 }, { name: 'Tree frog', signal: 70, aliases: ['treefrog'] },
      { name: 'Caecilian', signal: 40 }, { name: 'Poison dart frog', signal: 70, aliases: ['poison frog', 'dart frog'] },
    ],
    mustHave: ['Frog', 'Toad', 'Salamander', 'Newt', 'Axolotl', 'Bullfrog', 'Poison dart frog', 'Tree frog', 'Fire salamander', 'Hellbender', 'Caecilian', 'Cane toad', 'Common frog', 'Tiger salamander', 'Red-eyed tree frog', 'Goliath frog', 'Chinese giant salamander', 'Olm', 'Mudpuppy', 'Glass frog', 'Common toad', 'Great crested newt', 'American bullfrog', 'Surinam toad', 'Spadefoot toad', 'Golden poison frog', 'Marsupial frog', 'Smooth newt', 'Eastern newt', 'Natterjack toad'],
    rename: ['Fire salamander', 'Great crested newt'],
  },
  {
    id: 'animals-desert', category: 'Animals & Nature', prompt: 'Name a desert.',
    rules: 'Accept any named desert, hot or cold, sandy or rocky, anywhere in the world (Sahara, Gobi, Kalahari, Atacama, Mojave, Arabian Desert, Thar, Namib, Antarctica as a polar desert). Dry regions that are not called a desert, oases, and fictional deserts do not count.',
    source: 'Wikidata items that are a desert, known in at least 8 languages.', pattern: instanceOf('Q8514'), minSignal: 8, alsoWritten: strip(/ Desert$/),
    mustHave: ['Sahara', 'Gobi Desert', 'Kalahari Desert', 'Atacama Desert', 'Mojave Desert', 'Sonoran Desert', 'Arabian Desert', 'Thar Desert', 'Namib', 'Patagonian Desert', 'Antarctic Desert', 'Great Victoria Desert', 'Gibson Desert', 'Negev', 'Syrian Desert', 'Taklamakan Desert', 'Karakum Desert', 'Kyzylkum Desert', 'Chihuahuan Desert', 'Great Basin Desert', 'Simpson Desert', 'Danakil Desert', 'Judaean Desert', 'Painted Desert', 'Libyan Desert', 'Nubian Desert', 'Ordos Desert', 'Dasht-e Kavir', 'Rub al Khali', 'Western Desert', 'Eastern Desert', 'Tabernas Desert', 'Great Sandy Desert', 'Tanami Desert', 'Colorado Desert', 'Lut Desert', 'Sechura Desert', 'Arctic Desert', 'Death Valley'],
    rename: ['Taklamakan Desert', 'Lut Desert'],
    skip: nameIs(/^(Sinai Peninsula|Highlands of Iceland|Kebira Crater)$/),
  },
  {
    id: 'animals-rock-type', category: 'Animals & Nature', prompt: 'Name a type of rock.',
    rules: 'Accept any named type of rock, igneous, sedimentary or metamorphic (granite, basalt, limestone, sandstone, marble, slate, obsidian, pumice). Individual minerals (quartz, calcite), gemstones, metals, soil and the word "rock" on its own do not count.',
    source: 'Wikidata items that are a rock or a kind of rock, known in at least 4 languages.', pattern: kindOf('Q8063') + ' FILTER NOT EXISTS { ?item wdt:P31 wd:Q60186 }', minSignal: 4,
    mustHave: ['Granite', 'Marble', 'Limestone', 'Sandstone', 'Basalt', 'Slate', 'Obsidian', 'Quartzite', 'Shale', 'Gneiss', 'Schist', 'Pumice', 'Chalk', 'Flint', 'Coal', 'Diorite', 'Gabbro', 'Conglomerate', 'Dolomite', 'Travertine', 'Soapstone', 'Tuff', 'Rhyolite', 'Andesite', 'Peridotite', 'Breccia', 'Mudstone', 'Siltstone', 'Granodiorite', 'Kimberlite'],
    rename: ['Schist', 'Dolomite'],
    skip: nameIs(/^(concrete|meteorite|ore|volcanic ash|regolith|tektite|Allan Hills.*)$|\b(meteorite|ore)$/i),
  },
  {
    id: 'animals-primate', category: 'Animals & Nature', prompt: 'Name a primate.',
    rules: 'Accept any living primate other than humans, by its common name (gorilla, ring-tailed lemur, mandrill, capuchin) or its scientific name, including group names where every member is a primate (such as monkey, ape, lemur or macaque). Humans, other mammals, extinct primates and fictional ones do not count.',
    source: 'Species below the order "primate" in Wikidata (without extinct ones), by their English common names, plus group names added by hand.',
    fetch: () => speciesBelow(['Q7380'], NOT_EXTINCT, 'Q7432', { depth: 9, commonNames: true, fame: true }), commonNames: true, skip: latinOnly,
    extras: [{ name: 'Monkey', signal: 120, aliases: ['monkeys'] }, { name: 'Ape', signal: 100, aliases: ['apes'] }, { name: 'Lemur', signal: 90 }, { name: 'Macaque', signal: 70 }, { name: 'Baboon', signal: 80 }, { name: 'Gibbon', signal: 70 }, { name: 'Marmoset', signal: 60 }, { name: 'Tamarin', signal: 50 }],
    mustHave: ['Gorilla', 'Chimpanzee', 'Orangutan', 'Bonobo', 'Baboon', 'Lemur', 'Gibbon', 'Macaque', 'Marmoset', 'Capuchin monkey', 'Howler monkey', 'Spider monkey', 'Mandrill', 'Tarsier', 'Rhesus macaque', 'Ring-tailed lemur', 'Aye-aye', 'Proboscis monkey', 'Squirrel monkey', 'Colobus', 'Siamang', 'Vervet monkey', 'Japanese macaque', 'Golden lion tamarin', 'Tamarin', 'Sifaka', 'Loris', 'Bushbaby', 'Mountain gorilla', 'Monkey', 'Ape'],
    rename: ['Rhesus macaque', 'Vervet monkey'],
  },

  // ================================================================ Food
  {
    id: 'food-sandwich', category: 'Food', prompt: 'Name a sandwich.',
    rules: 'Accept any sandwich or filled roll from any cuisine, including burgers, hot dogs and wraps (club sandwich, BLT, Reuben, banh mi, Philly cheesesteak, croque monsieur, hamburger). Plain bread, toast on its own, pizzas, burritos and the word "sandwich" on its own do not count.',
    source: 'Wikidata items that are a sandwich or a kind of sandwich, known in at least 3 languages.', pattern: kindOf('Q28803'), minSignal: 3,
    mustHave: ['Hamburger', 'Cheeseburger', 'Hot dog', 'Club sandwich', 'BLT', 'Grilled cheese sandwich', 'Reuben sandwich', 'Submarine sandwich', 'Panini', 'Croque monsieur', 'Bánh mì', 'Philadelphia cheesesteak', 'Peanut butter and jelly sandwich', 'Gyro', 'Sloppy joe', "Po' boy", 'Monte Cristo sandwich', 'Cuban sandwich', 'Pulled pork sandwich', 'Shawarma', 'Tuna sandwich', 'Egg sandwich', 'Muffuletta', 'Torta', 'Bocadillo', 'Smørrebrød', 'Tramezzino', 'Katsu sando', 'Fish finger sandwich', 'Bacon sandwich', 'French dip', 'Lobster roll', 'Wrap', 'Chicken sandwich', 'Cucumber sandwich', 'Sandwich'],
    extraAliases: { Hamburger: ['Burger'], 'Submarine sandwich': ['Sub', 'Hoagie', 'Hero'], 'Philadelphia cheesesteak': ['Philly cheesesteak', 'Cheesesteak'] },
    rename: ['Grilled cheese sandwich', 'Philadelphia cheesesteak', 'Gyro', 'Tuna sandwich', 'Katsu sando'],
    skip: nameIs(/^(taco|burrito|enchilada|quesadilla|chimichanga|eggs Benedict|canapé|corn dog|Krabby Patty|Loco moco|İskender kebap|Iskender kebap)$/i),
  },
  {
    id: 'food-soup', category: 'Food', prompt: 'Name a soup.',
    rules: 'Accept any soup, broth, stew-like soup or chowder from any cuisine (tomato soup, minestrone, miso soup, pho, borscht, gazpacho, clam chowder, tom yum). Sauces, drinks, dry noodles, solid stews and casseroles, and the word "soup" on its own do not count.',
    source: 'Wikidata items that are a soup or a kind of soup, known in at least 3 languages.', pattern: kindOf('Q41415'), minSignal: 3,
    mustHave: ['Tomato soup', 'Chicken soup', 'Minestrone', 'Ramen', 'Miso soup', 'Pho', 'Borscht', 'Gazpacho', 'French onion soup', 'Clam chowder', 'Pea soup', 'Mushroom soup', 'Lentil soup', 'Bouillabaisse', 'Goulash', 'Tom yum', 'Laksa', 'Wonton soup', 'Hot and sour soup', 'Vichyssoise', 'Mulligatawny', 'Gumbo', 'Pozole', 'Bisque', 'Broth', 'Consommé', 'Cullen skink', 'Chowder', 'Egg drop soup', 'Menudo', 'Harira', 'Ribollita', 'Avgolemono', 'Potato soup', 'Cream of mushroom soup', 'Chicken noodle soup', 'Shark fin soup', 'Cock-a-leekie soup', 'Stracciatella', 'Tortilla soup'],
    skip: nameIs(/^(bouillon cube|vegetable stock|nikujaga)$/i),
  },
  {
    id: 'food-herb-or-spice', category: 'Food', prompt: 'Name a herb or spice.',
    rules: 'Accept any culinary herb or spice, fresh or dried, from any cuisine (basil, cinnamon, turmeric, saffron, cumin, coriander, star anise). Mixed blends (curry powder, garam masala), salt, sugar, sauces, vegetables, medicinal herbs not used in cooking, and the words "herb" or "spice" on their own do not count.',
    source: 'Wikidata items that are a herb or a spice, or a kind of either, known in at least 4 languages.', pattern: anyKind('Q207123', 'Q42527'), minSignal: 4,
    mustHave: ['Basil', 'Cinnamon', 'Black pepper', 'Oregano', 'Thyme', 'Rosemary', 'Parsley', 'Mint', 'Coriander', 'Dill', 'Sage', 'Paprika', 'Cumin', 'Turmeric', 'Ginger', 'Nutmeg', 'Clove', 'Saffron', 'Cardamom', 'Vanilla', 'Chili pepper', 'Bay leaf', 'Tarragon', 'Chives', 'Fennel', 'Star anise', 'Mustard seed', 'Allspice', 'Cayenne pepper', 'Lemongrass', 'Curry leaf', 'Sumac', 'Fenugreek', 'Marjoram', 'Anise', 'Caraway', 'Juniper berry', 'Lavender', 'Cilantro', 'Garlic'],
    extraAliases: { Coriander: ['Cilantro'], Clove: ['Cloves'], 'Black pepper': ['Pepper'] },
    rename: ['Coriander', 'Dill', 'Fennel', 'Caraway'],
    skip: (c) =>
      // a plant known only by its Latin name (a taxon: "species of plant"), salt, sugar and plants that are not herbs
      (/^[A-Z][a-z]+ (× )?[a-z-]+( (var|subsp)\. [a-z-]+)?$/.test(c.name) && /(um|us|is|ii|ae|ens|ata|are|ale|a|i)$/.test(c.name) && /^(species|genus) of/i.test(c.desc ?? '')) ||
      /\b(salt|sugar|sunflower|tomato|medicinal plant|cacao|cannabis|celery)\b/i.test(c.name) || /^(liquorice|gruit|Er jing tiao)$/i.test(c.name),
  },
  {
    id: 'food-grape-variety', category: 'Food', prompt: 'Name a grape variety.',
    rules: 'Accept any variety of grape, for wine or for eating (Chardonnay, Merlot, Cabernet Sauvignon, Pinot Noir, Riesling, Concord, Thompson Seedless). Wines named only by a region or a brand (Champagne, Chianti, Rioja), spirits, raisins and the word "grape" on its own do not count.',
    source: 'Wikidata items that are a grape variety, known in at least 3 languages.', pattern: '?item wdt:P31 wd:Q958314 .', minSignal: 3,
    mustHave: ['Chardonnay', 'Merlot', 'Cabernet Sauvignon', 'Pinot noir', 'Sauvignon blanc', 'Syrah', 'Riesling', 'Malbec', 'Pinot gris', 'Grenache', 'Zinfandel', 'Sangiovese', 'Tempranillo', 'Nebbiolo', 'Chenin blanc', 'Gewürztraminer', 'Viognier', 'Semillon', 'Cabernet franc', 'Gamay', 'Carménère', 'Barbera', 'Muscat', 'Albariño', 'Grüner Veltliner', 'Concord', 'Thompson Seedless', 'Mourvèdre', 'Petit verdot', 'Primitivo', 'Moscato', 'Garnacha', 'Pinotage', 'Montepulciano', 'Verdejo', 'Prosecco', 'Glera', 'Trebbiano', 'Cinsault', 'Tannat'],
    rename: ['Thompson Seedless', 'Cinsault'],
  },
  {
    id: 'food-candy', category: 'Food', prompt: 'Name a candy or chocolate bar.',
    rules: 'Accept any sweet or chocolate bar, bag of sweets or branded confection (Snickers, KitKat, Skittles, Haribo, Toblerone, gummy bears, lollipop). Biscuits, cakes, ice cream, chewing gum and the words "candy", "sweets" or "chocolate" on their own do not count.',
    source: 'Wikidata items that are a candy or a chocolate bar, or a kind of either (Snickers is filed as a kind of chocolate bar), known in at least 3 languages.', pattern: anyKind('Q185583', 'Q1361086'), minSignal: 3,
    mustHave: ['Snickers', 'KitKat', 'Twix', "M&M's", 'Skittles', "Reese's Peanut Butter Cups", 'Mars', 'Milky Way', "Hershey's Kisses", 'Cadbury Dairy Milk', 'Toblerone', 'Haribo', 'Gummy bear', 'Jelly Belly', 'Starburst', 'Twizzlers', 'Lollipop', 'Candy cane', 'Bounty', 'Ferrero Rocher', 'Kinder Surprise', 'Smarties', 'Maltesers', 'Creme Egg', "Werther's Original", 'Tic Tac', 'Chupa Chups', 'Nerds', 'Sour Patch Kids', 'Swedish Fish', 'Peeps', 'Baby Ruth', 'Butterfinger', '3 Musketeers', 'Almond Joy', 'Crunch', 'Galaxy', 'Aero', 'Lindt', 'Jelly bean'],
    rename: ['Aero'],
    skip: nameIs(/^(chocolate|white chocolate|milk chocolate|dark chocolate|ruby chocolate|chocolate bar|chocolate liquor|chocolate chip|chocolate syrup|ganache|Milo|cocoa|cocoa bean|hot chocolate|Negro|Midget Gems)$/i),
  },

  // ================================================================ Games
  {
    id: 'games-video-game-series', category: 'Games', prompt: 'Name a video game series.',
    rules: 'Accept any video game series or franchise, as a whole (Super Mario, The Legend of Zelda, Pokémon, Final Fantasy, Call of Duty, Grand Theft Auto, Resident Evil), with or without "series". Single games within a series, companies, consoles and characters on their own do not count.',
    source: 'Wikidata items that are a video game series, or that video games name as the series they belong to, known in at least 8 languages.', pattern: '{ { ?item wdt:P31 wd:Q7058673 } UNION { ?game wdt:P31 wd:Q7889 . ?game wdt:P179 ?item } } .', minSignal: 8, alsoWritten: strip(/ \(series\)$| series$/i),
    mustHave: ['Super Mario', 'The Legend of Zelda', 'Pokémon', 'Final Fantasy', 'Call of Duty', 'Grand Theft Auto', 'Mario Kart', 'Sonic the Hedgehog', 'Resident Evil', "Assassin's Creed", 'Metal Gear', 'Halo', 'Mortal Kombat', 'Street Fighter', 'FIFA', 'The Sims', 'Tomb Raider', 'Gran Turismo', 'God of War', 'Uncharted', 'Animal Crossing', 'Fire Emblem', 'The Elder Scrolls', 'Fallout', 'Doom', 'Mega Man', 'Pac-Man', 'Tekken', 'Kingdom Hearts', 'Dragon Quest', 'Battlefield', 'Need for Speed', 'Civilization', 'Angry Birds', 'Splatoon', 'Crash Bandicoot', 'Spyro', 'Diablo', 'Warcraft', 'StarCraft', 'Dark Souls', 'Metroid', 'Kirby', 'Donkey Kong', 'Persona', 'Borderlands', 'Far Cry', 'Minecraft'],
  },
  {
    id: 'games-toy', category: 'Games', prompt: 'Name a toy.',
    rules: 'Accept any toy, classic or modern, generic or branded (Lego, Barbie, teddy bear, Rubik\'s Cube, yo-yo, Hot Wheels, Play-Doh, kite, Tamagotchi). Video games, board games, playing cards, sports equipment and the word "toy" on its own do not count.',
    source: 'Wikidata items that are a toy or a kind of toy (Lego is filed as a kind of toy), known in at least 5 languages.', pattern: kindOf('Q11422'), minSignal: 5,
    mustHave: ['Lego', 'Barbie', 'Teddy bear', "Rubik's Cube", 'Yo-yo', 'Hot Wheels', 'Play-Doh', 'Slinky', 'Frisbee', 'Doll', 'Action figure', 'Etch A Sketch', 'Kite', 'Tamagotchi', 'Furby', 'Nerf', 'Hula hoop', 'Spinning top', 'Marbles', 'Rocking horse', 'Fidget spinner', 'Beanie Babies', 'Cabbage Patch Kids', 'Transformers', 'G.I. Joe', 'My Little Pony', 'Care Bears', 'Tickle Me Elmo', 'Matchbox', 'Meccano', 'Pogo stick', 'Jack-in-the-box', 'Ball', 'Building block', 'Jigsaw puzzle', 'Water gun', 'Toy car', 'Toy soldier', 'Puppet', 'Rattle'],
    rename: ['Spinning top', 'Beanie Babies'],
    skip: (c) => /\b(PlayStation|Xbox|Wii|Nintendo|Game Boy|GameCube|Dreamcast|Sega|Atari|Neo Geo|dildo|vibrator|butt plug|sex toy)\b/i.test(c.name) || /video game console|game console|handheld console|sex toy|adult toy/i.test(c.desc ?? ''),
  },
  {
    id: 'games-nintendo-game', category: 'Games', prompt: 'Name a Nintendo game.',
    rules: 'Accept any video game that Nintendo developed or published, on any of its consoles (Super Mario Bros., The Legend of Zelda: Breath of the Wild, Mario Kart 8, Animal Crossing, Pokémon Red, Wii Sports). Games by other companies on a Nintendo console, whole series, consoles and characters on their own do not count.',
    source: 'Wikidata video games whose developer or publisher is Nintendo, known in at least 6 languages.',
    pattern: '{ { ?item wdt:P178 wd:Q8093 } UNION { ?item wdt:P123 wd:Q8093 } } ?item wdt:P31/wdt:P279* wd:Q7889 .', minSignal: 6,
    mustHave: ['Super Mario Bros.', 'The Legend of Zelda: Breath of the Wild', 'Mario Kart 8 Deluxe', 'Animal Crossing: New Horizons', 'Super Smash Bros. Ultimate', 'Donkey Kong', 'Metroid', 'Super Mario 64', 'Super Mario Odyssey', 'The Legend of Zelda: Ocarina of Time', 'Splatoon', 'Wii Sports', 'Pikmin', 'Star Fox', 'Mario Party', "Luigi's Mansion", 'Super Mario World', 'Super Metroid', 'EarthBound', 'Fire Emblem', 'Nintendogs', 'Brain Age', 'Paper Mario', 'Mario Kart 64', 'Super Mario Kart', 'Super Smash Bros. Melee', 'Tomodachi Life', 'Xenoblade Chronicles', 'Kid Icarus', 'F-Zero', 'Wii Fit', 'Metroid Prime', 'Pokémon Red and Blue', 'Pokémon Gold and Silver', 'Super Mario Bros. 3', 'The Legend of Zelda', "The Legend of Zelda: Tears of the Kingdom", 'Mario Kart Wii', 'New Super Mario Bros.', 'Kirby\'s Dream Land'],
    skip: nameIs(/^(StarCraft|Pokémon Go)$/),
  },
  {
    id: 'games-mario-character', category: 'Games', prompt: 'Name a character from the Super Mario games.',
    rules: 'Accept any named character from the Mario franchise, hero, friend, villain or enemy (Mario, Luigi, Princess Peach, Bowser, Yoshi, Toad, Wario, Waluigi, Goomba, Boo). Games, items (Super Star, mushroom), places and the voice actors do not count.',
    source: 'Wikidata characters, enemies and species filed in the Super Mario universe (places, levels and power-ups left out).', pattern: '{ { ?item wdt:P1080 wd:Q20203549 } UNION { ?item wdt:P31 wd:Q33093124 } } ?item wdt:P31 ?k . VALUES ?k { wd:Q1569167 wd:Q21192438 wd:Q33093124 wd:Q33095807 wd:Q15702752 wd:Q15632617 wd:Q95074 wd:Q2291541 wd:Q24886755 wd:Q17564712 wd:Q21009831 wd:Q11296888 wd:Q31291170 wd:Q3771604 wd:Q80992314 wd:Q27921916 wd:Q15773347 wd:Q87576284 wd:Q15720625 wd:Q30061299 wd:Q15711870 wd:Q28020127 } .', minSignal: 1,
    mustHave: ['Mario', 'Luigi', 'Princess Peach', 'Bowser', 'Yoshi', 'Toad', 'Wario', 'Donkey Kong', 'Waluigi', 'Princess Daisy', 'Rosalina', 'Bowser Jr.', 'Koopa Troopa', 'Goomba', 'Shy Guy', 'Boo', 'Diddy Kong', 'Birdo', 'Kamek', 'Lakitu', 'Toadette', 'Captain Toad', 'Bullet Bill', 'Piranha Plant', 'Chain Chomp', 'Cappy', 'Pauline', 'Dry Bones', 'Petey Piranha', 'Cranky Kong', 'Wiggler', 'Blooper', 'Cheep Cheep', 'Magikoopa', 'Hammer Bro', 'Monty Mole', 'Fawful', 'Nabbit', 'Koopa Paratroopa'],
  },

  // ================================================================ History & Mythology
  {
    id: 'history-monarch', category: 'History & Mythology', prompt: 'Name a king, queen or emperor.',
    rules: "Accept any real king, queen, emperor, empress, tsar, sultan, pharaoh or other reigning monarch from any country and period (Henry VIII, Elizabeth II, Louis XIV, Queen Victoria, Cleopatra, Charlemagne, Napoleon, King Solomon), by their usual name. Popes, presidents, princes and consorts who never reigned, regents and fictional monarchs do not count.",
    source: 'People in Wikidata who held a position that is a kind of monarch (king, queen, emperor, sultan, pharaoh ...; not the Pope or the French Co-Prince of Andorra), known in at least 8 languages.', pattern: heldPosition('Q116') + ' FILTER(?pos NOT IN (wd:Q19546, wd:Q5574822, wd:Q19808845))' + HUMAN, minSignal: 8,
    mustHave: ['Henry VIII', 'Elizabeth II', 'Queen Victoria', 'Louis XIV', 'Elizabeth I', 'Charles III', 'George III', 'Charles II of England', 'Richard I of England', 'William the Conqueror', 'Alfred the Great', 'Edward VII', 'Henry V of England', 'Henry VII of England', 'Mary I of England', 'Anne, Queen of Great Britain', 'Louis XVI', 'Isabella I of Castile', 'Philip II of Spain', 'Charles V, Holy Roman Emperor', 'Frederick the Great', 'Gustavus Adolphus', 'Harald Hardrada', 'Cnut the Great', 'Herod the Great', 'Leopold II of Belgium', 'Juan Carlos I', 'Felipe VI', 'Willem-Alexander of the Netherlands', 'Margrethe II of Denmark', 'Harald V of Norway', 'Carl XVI Gustaf', 'Richard III of England', 'Edward the Confessor', 'Cleopatra', 'Solomon', 'David', 'Napoleon', 'Catherine the Great'],
    alsoWritten: (n) => [...personForms(n), ...strip(/ of (England|France|Spain|Scotland|Sweden|Denmark|Norway|the Netherlands|Belgium|Prussia|Portugal|Castile|Navarre|Aragon)$/)(n)],
    rename: ['Queen Victoria', 'Frederick the Great', 'Harald Hardrada', 'Catherine the Great'],
  },
  {
    id: 'history-president', category: 'History & Mythology', prompt: 'Name a president.',
    rules: 'Accept any real president of any country, current or past (Abraham Lincoln, Barack Obama, Nelson Mandela, Charles de Gaulle, Emmanuel Macron, Lula da Silva), by their usual name or surname. Prime ministers, kings, company presidents, university presidents and fictional presidents do not count.',
    source: 'People in Wikidata who held a position that is a kind of president (head of state of a republic), known in at least 12 languages.', pattern: heldPosition('Q30461') + HUMAN, minSignal: 12, alsoWritten: personForms,
    mustHave: ['Abraham Lincoln', 'George Washington', 'Barack Obama', 'Donald Trump', 'Joe Biden', 'John F. Kennedy', 'Franklin D. Roosevelt', 'Theodore Roosevelt', 'Thomas Jefferson', 'Ronald Reagan', 'Bill Clinton', 'George W. Bush', 'Richard Nixon', 'Jimmy Carter', 'Dwight D. Eisenhower', 'Nelson Mandela', 'Emmanuel Macron', 'Vladimir Putin', 'Xi Jinping', 'Charles de Gaulle', 'Luiz Inácio Lula da Silva', 'Recep Tayyip Erdoğan', 'Volodymyr Zelenskyy', 'Jair Bolsonaro', 'Hugo Chávez', 'Joko Widodo', 'Ferdinand Marcos', 'Mikhail Gorbachev', 'Barack Obama', 'Harry S. Truman', 'Woodrow Wilson', 'Andrew Jackson', 'George H. W. Bush', 'Lyndon B. Johnson', 'Gerald Ford', 'Ulysses S. Grant', 'Thomas Sankara', 'Julius Nyerere', 'Mustafa Kemal Atatürk', 'Mahmoud Ahmadinejad'],
  },
  {
    id: 'history-prime-minister', category: 'History & Mythology', prompt: 'Name a prime minister.',
    rules: 'Accept any real prime minister of any country, current or past (Winston Churchill, Margaret Thatcher, Jawaharlal Nehru, Justin Trudeau, Jacinda Ardern, Shinzo Abe), by their usual name or surname. Presidents, chancellors, kings and fictional prime ministers do not count.',
    source: 'People in Wikidata who held a position that is a kind of prime minister, known in at least 12 languages.', pattern: heldPosition('Q14212') + HUMAN, minSignal: 12, alsoWritten: personForms,
    mustHave: ['Winston Churchill', 'Margaret Thatcher', 'Tony Blair', 'Boris Johnson', 'Rishi Sunak', 'Keir Starmer', 'Theresa May', 'David Cameron', 'Gordon Brown', 'Narendra Modi', 'Jawaharlal Nehru', 'Indira Gandhi', 'Justin Trudeau', 'Benjamin Netanyahu', 'Shinzo Abe', 'Jacinda Ardern', 'Scott Morrison', 'Julia Gillard', 'Neville Chamberlain', 'Clement Attlee', 'Robert Walpole', 'William Pitt the Younger', 'Benazir Bhutto', 'Golda Meir', 'Lee Kuan Yew', 'Mahathir Mohamad', 'Kevin Rudd', 'John Howard', 'Pierre Trudeau', 'Stephen Harper', 'Anthony Eden', 'Harold Macmillan', 'Harold Wilson', 'Liz Truss', 'Manmohan Singh', 'Atal Bihari Vajpayee', 'Imran Khan', 'Viktor Orbán', 'Giorgia Meloni', 'David Lloyd George'],
  },
  {
    id: 'history-saint', category: 'History & Mythology', prompt: 'Name a saint.',
    rules: 'Accept any person canonised as a saint by a Christian church, from any period (Saint Peter, Saint Francis of Assisi, Saint Patrick, Saint Nicholas, Joan of Arc, Mother Teresa), with or without the word "Saint" or "St". People only called "blessed", sports teams and places named after saints do not count.',
    source: 'People in Wikidata whose canonization status is saint, known in at least 10 languages.',
    pattern: '{ { ?item wdt:P411 wd:Q123110154 } UNION { ?item wdt:P411 wd:Q43115 } } ?item wdt:P31 wd:Q5 .', minSignal: 10, alsoWritten: strip(/^(Saint|St\.?) /),
    mustHave: ['Saint Peter', 'Paul the Apostle', 'Francis of Assisi', 'Saint Patrick', 'Saint George', 'Saint Nicholas', 'Saint Valentine', 'Mother Teresa', 'Joan of Arc', 'Augustine of Hippo', 'Thomas Aquinas', 'Anthony of Padua', 'Saint Christopher', 'Saint Andrew', 'Saint David', 'James, son of Zebedee', 'John the Baptist', 'Luke the Evangelist', 'Mark the Evangelist', 'Matthew the Apostle', 'Bernadette Soubirous', 'Teresa of Ávila', 'Benedict of Nursia', 'Jerome', 'Saint Cecilia', 'Saint Lucy', 'Saint Joseph', 'Saint Stephen', 'Saint Barbara', 'Catherine of Siena', 'Ignatius of Loyola', 'Thérèse of Lisieux', 'Pope John Paul II', 'Padre Pio', 'Saint Jude', 'Saint Bartholomew', 'Saint Francis Xavier', 'Saint Boniface', 'Saint Columba'],
    rename: ['Saint Andrew', 'Pope John Paul II', 'Saint Jude', 'Saint Bartholomew', 'Saint Francis Xavier', 'Saint Columba'],
  },
  {
    id: 'history-dynasty', category: 'History & Mythology', prompt: 'Name a dynasty or royal house.',
    rules: 'Accept any ruling dynasty or royal house from any country and period (Ming, Tang, Tudor, Windsor, Habsburg, Bourbon, Romanov, Ottoman, Medici), with or without the words "dynasty" or "House of". Single rulers, countries, and fictional houses (such as House Stark) do not count.',
    source: 'Wikidata items that are a dynasty or royal house, or a historical Chinese state named as a dynasty, known in at least 6 languages.',
    pattern: '{ { ?item wdt:P31/wdt:P279* wd:Q164950 } UNION { ?item wdt:P31 wd:Q50068795 } } .', minSignal: 6,
    skip: (c) => !/\b(dynasty|dynasties|house of|royal house|house|empire|sultanate|caliphate|khanate)\b/i.test(c.name),
    alsoWritten: (n) => [...strip(/ dynasty$/i)(n), ...strip(/^House of /)(n)],
    mustHave: ['Ming dynasty', 'Qing dynasty', 'Tang dynasty', 'Han dynasty', 'Song dynasty', 'Yuan dynasty', 'House of Tudor', 'House of Stuart', 'House of Windsor', 'House of Habsburg', 'House of Bourbon', 'House of Romanov', 'House of Plantagenet', 'Ottoman dynasty', 'Mughal dynasty', 'House of Medici', 'House of Hanover', 'Capetian dynasty', 'Carolingian dynasty', 'Merovingian dynasty', 'Ptolemaic dynasty', 'Abbasid Caliphate', 'Umayyad Caliphate', 'Safavid dynasty', 'Shang dynasty', 'Zhou dynasty', 'Qin dynasty', 'Sui dynasty', 'Joseon', 'Tokugawa shogunate', 'House of York', 'House of Lancaster', 'House of Orange-Nassau', 'House of Savoy', 'House of Grimaldi', 'House of Windsor', 'Yamato dynasty', 'Chola dynasty', 'Maurya Empire', 'Gupta Empire'],
  },

  // ================================================================ Places
  {
    id: 'places-river', category: 'Places', prompt: 'Name a river.',
    rules: 'Accept any named river, large or small, in any country, with or without the word "River" (Nile, Amazon, Thames, Mississippi, Yangtze, Ganges, Danube, Rhine). Streams with no name, canals, lakes, seas and fictional rivers do not count.',
    source: 'Wikidata items that are a river, known in at least 25 languages.', pattern: instanceOf('Q4022'), minSignal: 25, alsoWritten: strip(/ River$/),
    mustHave: ['Nile', 'Amazon River', 'Yangtze', 'Mississippi River', 'Danube', 'River Thames', 'Rhine', 'Ganges', 'Mekong', 'Volga', 'Congo River', 'Seine', 'Tiber', 'Euphrates', 'Tigris', 'Colorado River', 'Hudson River', 'Yellow River', 'Amur', 'Indus River', 'Niger River', 'Zambezi', 'Murray River', 'Rio Grande', 'Missouri River', 'Ohio River', 'Saint Lawrence River', 'Loire', 'Elbe', 'Jordan River', 'Orinoco', 'Irrawaddy River', 'Brahmaputra', 'Don', 'Dnieper', 'Ob', 'Lena', 'Yenisei', 'River Shannon', 'River Severn', 'Po', 'Tagus', 'Ebro', 'Oder', 'Vistula', 'Orange River', 'Limpopo River', 'Rhône', 'Moselle', 'Arno'],
  },
  {
    id: 'places-waterfall', category: 'Places', prompt: 'Name a waterfall.',
    rules: 'Accept any named waterfall in any country, with or without the word "Falls" (Niagara, Victoria Falls, Angel Falls, Iguazu, Gullfoss, Yosemite Falls). Rapids, dams, fountains and fictional waterfalls do not count.',
    source: 'Wikidata items that are a waterfall, known in at least 12 languages.', pattern: instanceOf('Q34038'), minSignal: 12, alsoWritten: strip(/ (Falls|Fall|Waterfall|Waterfalls)$/),
    mustHave: ['Niagara Falls', 'Victoria Falls', 'Angel Falls', 'Iguazu Falls', 'Yosemite Falls', 'Gullfoss', 'Horseshoe Falls', 'Multnomah Falls', 'Dettifoss', 'Skógafoss', 'Seljalandsfoss', 'Kaieteur Falls', 'Sutherland Falls', 'Havasu Falls', 'Reichenbach Falls', 'Rhine Falls', 'Krimml Waterfalls', 'Tugela Falls', 'Jog Falls', 'Dudhsagar Falls', 'Detian Falls', 'Huangguoshu Waterfall', 'Kegon Falls', 'Bridalveil Fall', 'Shoshone Falls', 'Latourell Falls', 'Iguaçu Falls', 'Aysgarth Falls', 'High Force', 'Falls of Clyde', 'Wallaman Falls', 'Rjukan Falls', 'Vøringsfossen', 'Salto Ángel', 'Takakkaw Falls', 'Bow Falls', 'Mosi-oa-Tunya', 'Gavarnie Falls', 'Staubbach Falls'],
    skip: nameIs(/^Churchill River$/),
  },
  {
    id: 'places-castle', category: 'Places', prompt: 'Name a castle.',
    rules: 'Accept any named castle or fortified palace in any country, with or without the word "Castle" or "Château" (Windsor Castle, Neuschwanstein, Edinburgh Castle, Himeji Castle, Bran Castle, Chambord). Palaces that were never fortified, ruins with no name, fortresses called forts, and fictional castles (Hogwarts) do not count.',
    source: 'Wikidata items that are a castle, known in at least 25 languages.', pattern: instanceOf('Q23413'), minSignal: 25, alsoWritten: CASTLE,
    mustHave: ['Windsor Castle', 'Edinburgh Castle', 'Neuschwanstein Castle', 'Hohenzollern Castle', 'Château de Chambord', 'Warwick Castle', 'Prague Castle', 'Bran Castle', 'Himeji Castle', 'Dover Castle', 'Caernarfon Castle', 'Conwy Castle', 'Leeds Castle', 'Balmoral Castle', 'Stirling Castle', 'Eilean Donan', 'Blarney Castle', 'Malbork Castle', 'Chillon Castle', 'Matsumoto Castle', 'Osaka Castle', 'Krak des Chevaliers', 'Kronborg Castle', 'Heidelberg Castle', 'Wartburg Castle', 'Eltz Castle', 'Corfe Castle', 'Alnwick Castle', 'Bamburgh Castle', 'Cinderella Castle', 'Hearst Castle', 'Castel Sant\'Angelo', 'Chenonceau', 'Château de Versailles', 'Mont Saint-Michel', 'Peleș Castle', 'Hunyad Castle', 'Burg Eltz', 'Schloss Neuschwanstein', 'Windsor'],
    skip: nameIs(/^(Camelot|Hofburg Palace)$/),
  },
  {
    id: 'places-tower-or-skyscraper', category: 'Places', prompt: 'Name a tower or skyscraper.',
    rules: 'Accept any named skyscraper or tall tower, in any country (Burj Khalifa, Empire State Building, Eiffel Tower, Shanghai Tower, Petronas Towers, CN Tower, Tokyo Skytree, The Shard, Leaning Tower of Pisa). Ordinary office blocks that are not famous, whole districts, and fictional towers do not count.',
    source: 'Wikidata items that are a skyscraper or a tower, or a kind of either, known in at least 25 languages.', pattern: anyKind('Q11303', 'Q12518'), minSignal: 25, alsoWritten: strip(/ (Building|Tower|Towers|Center|Centre)$/),
    mustHave: ['Burj Khalifa', 'Empire State Building', 'Eiffel Tower', 'Shanghai Tower', 'Petronas Towers', 'CN Tower', 'Tokyo Skytree', 'The Shard', 'Leaning Tower of Pisa', 'Taipei 101', 'One World Trade Center', 'Willis Tower', 'Chrysler Building', 'Lotte World Tower', 'Ping An Finance Center', 'Burj Al Arab', '30 St Mary Axe', 'Flatiron Building', 'Jin Mao Tower', 'Abraj Al Bait', 'Trump Tower', 'Woolworth Building', 'World Trade Center', 'Space Needle', 'Big Ben', 'Tokyo Tower', 'Oriental Pearl Tower', 'Sears Tower', 'John Hancock Center', 'Transamerica Pyramid', 'Seagram Building', 'Lakhta Center', 'Canton Tower', 'Berlin TV Tower', 'Auckland Sky Tower', 'Sydney Tower', 'Tower of London', 'Blackpool Tower', 'Stratosphere Tower', 'Ostankino Tower'],
    rename: ['John Hancock Center'],
    skip: nameIs(/^(minaret|pagoda|bell tower|water tower|keep|tower|skyscraper|campanile|belfry|Statue of Liberty|clock tower|observation tower|lighthouse|church tower|watchtower)$/i),
  },
  {
    id: 'places-museum', category: 'Places', prompt: 'Name a museum.',
    rules: 'Accept any museum or public art gallery in any country (the Louvre, the British Museum, the Metropolitan Museum of Art, the Rijksmuseum, the Hermitage, the Van Gogh Museum, MoMA), with or without "The" or "Museum". Libraries, archives, zoos, galleries that only sell art, and fictional museums do not count.',
    source: 'Wikidata items that are a museum, known in at least 15 languages.', pattern: instanceOf('Q33506') + ' FILTER NOT EXISTS { ?item wdt:P31 ?bad . VALUES ?bad { wd:Q839954 wd:Q16560 wd:Q23413 wd:Q16970 wd:Q4989906 wd:Q2977 wd:Q44539 } }', minSignal: 15,
    extraAliases: { Louvre: ['Louvre Museum', 'The Louvre', 'Musée du Louvre'], 'Metropolitan Museum of Art': ['The Met', 'Met Museum'], 'Museum of Modern Art': ['MoMA'], 'National Air and Space Museum': ['Air and Space Museum'] },
    mustHave: ['Louvre', 'British Museum', 'Metropolitan Museum of Art', 'Smithsonian Institution', 'Vatican Museums', 'Uffizi', 'Museo del Prado', 'Rijksmuseum', 'Hermitage Museum', 'Museum of Modern Art', 'Solomon R. Guggenheim Museum', 'Tate Modern', "Musée d'Orsay", 'Van Gogh Museum', 'Acropolis Museum', 'Egyptian Museum', 'National Gallery', 'Natural History Museum', 'Science Museum', 'Getty Center', 'Pergamon Museum', 'Palace Museum', 'Anne Frank House', 'National Air and Space Museum', "Madame Tussauds", 'Ghibli Museum', 'Mauritshuis', 'Centre Pompidou', 'Museo Reina Sofía', 'Albertina', 'Kunsthistorisches Museum', 'Neues Museum', 'Field Museum', 'American Museum of Natural History', 'Museum of Fine Arts, Boston', 'Art Institute of Chicago', 'Tate Britain', 'Victoria and Albert Museum', 'National Museum of Anthropology'],
    rename: ['Louvre', 'Uffizi', 'Museo Reina Sofía', 'Field Museum'],
    skip: nameIs(/^(Hagia Sophia|Colosseum|Stonehenge|Auschwitz|Palace of Versailles|Forbidden City|Neuschwanstein Castle|Mausoleum at Halicarnassus|Terracotta Army|Tower of London|Pantheon|Herculaneum|Florence Cathedral|Palatine Hill|Valle dei Templi|Zaanse Schans|Frederiksborg Palace|Achilleion|Southern Fuegian Railway|The Temple Institute)$/),
  },

  // ================================================================ Science & Technology
  {
    id: 'science-astronaut', category: 'Science & Technology', prompt: 'Name an astronaut.',
    rules: "Accept any real astronaut or cosmonaut who has flown or been trained to fly in space, from any country (Neil Armstrong, Yuri Gagarin, Valentina Tereshkova, Sally Ride, Chris Hadfield, Yang Liwei), by their usual name or surname. Fictional astronauts, animals sent into space, and people who only worked on the ground do not count.",
    source: 'People in Wikidata whose occupation is astronaut, known in at least 8 languages.', pattern: occupation('Q11631') + HUMAN, minSignal: 8, alsoWritten: personForms,
    mustHave: ['Neil Armstrong', 'Buzz Aldrin', 'Yuri Gagarin', 'John Glenn', 'Sally Ride', 'Alan Shepard', 'Valentina Tereshkova', 'Michael Collins', 'Chris Hadfield', 'Scott Kelly', 'Peggy Whitson', 'Jim Lovell', 'Gene Cernan', 'Pete Conrad', 'Mae Jemison', 'Christa McAuliffe', 'Thomas Pesquet', 'Tim Peake', 'Samantha Cristoforetti', 'Sergei Krikalev', 'Gherman Titov', 'Alexei Leonov', 'Ed White', 'Gus Grissom', 'Mark Kelly', 'Mike Massimino', 'Story Musgrave', 'Ellen Ochoa', 'Kalpana Chawla', 'Rakesh Sharma', 'Yang Liwei', 'Wang Yaping', 'Soichi Noguchi', 'Mamoru Mohri', 'Dave Scott', 'Charles Duke', 'Harrison Schmitt', 'Eileen Collins', 'Guion Bluford', 'Jeff Williams'],
    rename: ['Gene Cernan', 'Tim Peake', 'Mike Massimino'],
    skip: notDescribedAs(/astronaut|cosmonaut|taikonaut|spationaut|spaceflight|space flight|NASA|ESA\b|Roscosmos|mission specialist|payload specialist/i),
  },
  {
    id: 'science-mathematician', category: 'Science & Technology', prompt: 'Name a mathematician.',
    rules: "Accept any real mathematician from any period or country (Euclid, Pythagoras, Carl Friedrich Gauss, Leonhard Euler, Ada Lovelace, Alan Turing, Srinivasa Ramanujan, Emmy Noether), including polymaths who are also known as mathematicians (Isaac Newton, René Descartes, Gottfried Leibniz), by their usual name or surname. Pure physicists, engineers, philosophers and fictional mathematicians do not count.",
    source: 'People in Wikidata whose occupation is mathematician, known in at least 12 languages.', pattern: occupation('Q170790') + HUMAN, minSignal: 12, alsoWritten: personForms,
    mustHave: ['Euclid', 'Pythagoras', 'Carl Friedrich Gauss', 'Leonhard Euler', 'Archimedes', 'Blaise Pascal', 'René Descartes', 'Pierre de Fermat', 'Alan Turing', 'Ada Lovelace', 'Srinivasa Ramanujan', 'Bernhard Riemann', 'David Hilbert', 'Kurt Gödel', 'John von Neumann', 'Évariste Galois', 'Georg Cantor', 'Fibonacci', 'Emmy Noether', 'Joseph-Louis Lagrange', 'Pierre-Simon Laplace', 'Gottfried Wilhelm Leibniz', 'Henri Poincaré', 'Andrew Wiles', 'Terence Tao', 'Grigori Perelman', 'Paul Erdős', 'Hypatia', 'Muhammad ibn Musa al-Khwarizmi', 'Brahmagupta', 'Aryabhata', 'Katherine Johnson', 'Maryam Mirzakhani', 'John Nash', 'Claude Shannon', 'Thales of Miletus', 'Ptolemy', 'John Napier', 'G. H. Hardy', 'Isaac Newton'],
    rename: ['John Nash'],
    skip: notDescribedAs(/mathematic|geomet|algebra|logician|statistic|topolog|number theor|combinatori|probabili|actuar|cryptolog/i),
  },
  {
    id: 'science-operating-system', category: 'Science & Technology', prompt: 'Name an operating system.',
    rules: 'Accept any computer, phone or console operating system, current or historic (Windows, macOS, Linux, Android, iOS, Ubuntu, Unix, MS-DOS, Windows XP), including named versions and Linux distributions. Programs that run on an operating system, hardware, and companies do not count.',
    source: 'Wikidata items that are an operating system or a kind of one, known in at least 6 languages.', pattern: instanceOf('Q9135'), minSignal: 6,
    mustHave: ['Microsoft Windows', 'macOS', 'Linux', 'Android', 'iOS', 'Ubuntu', 'Unix', 'Windows 10', 'Windows 11', 'Windows XP', 'Windows 95', 'MS-DOS', 'ChromeOS', 'Debian', 'Fedora Linux', 'Red Hat Enterprise Linux', 'FreeBSD', 'OpenBSD', 'Solaris', 'Symbian', 'BlackBerry OS', 'Windows Phone', 'HarmonyOS', 'watchOS', 'tvOS', 'iPadOS', 'Raspberry Pi OS', 'Arch Linux', 'Linux Mint', 'CentOS', 'Haiku', 'BeOS', 'AmigaOS', 'OS/2', 'Plan 9 from Bell Labs', 'Fuchsia', 'Tizen', 'webOS', 'Palm OS', 'Windows 7', 'Windows Vista', 'Windows 98', 'Kali Linux'],
    extraAliases: { 'Microsoft Windows': ['Windows'], macOS: ['Mac OS', 'OS X', 'Mac OS X'], ChromeOS: ['Chrome OS'] },
    rename: ['Linux'],
  },
  {
    id: 'science-technology-company', category: 'Science & Technology', prompt: 'Name a technology company.',
    rules: 'Accept any company known mainly for computers, phones, software, internet services, chips or electronics, current or defunct (Apple, Microsoft, Google, Samsung, Nvidia, Intel, Nokia, Atari, Huawei, OpenAI), with or without "Inc." Car makers, airlines, banks and the word "tech" on its own do not count.',
    source: 'Wikidata companies that are filed as a technology company or work in the information technology, software, semiconductor, electronics or internet industries (Amazon, Intel and Nvidia are filed by industry), known in at least 15 languages.', pattern: '{ { ?item wdt:P31/wdt:P279* wd:Q18388277 } UNION { ?item wdt:P452 ?ind . VALUES ?ind { wd:Q11661 wd:Q880371 wd:Q21157865 wd:Q638608 wd:Q2986369 wd:Q5358497 wd:Q73768396 wd:Q110702998 wd:Q56598901 wd:Q56611700 wd:Q75 } } } .', minSignal: 15,
    alsoWritten: strip(/ (Inc\.?|Corporation|Corp\.?|Ltd\.?|Limited|Company|Co\.|AG|SE|plc|Electronics)$/),
    mustHave: ['Apple Inc.', 'Microsoft', 'Google', 'Amazon', 'Meta Platforms', 'IBM', 'Intel', 'Samsung Electronics', 'Sony', 'Nvidia', 'Oracle Corporation', 'Cisco', 'Adobe Inc.', 'Netflix', 'Twitter', 'Uber', 'Airbnb', 'Dell', 'HP Inc.', 'Huawei', 'Xiaomi', 'Tencent', 'Alibaba Group', 'Baidu', 'Nokia', 'Qualcomm', 'AMD', 'Salesforce', 'SAP', 'Spotify', 'Zoom Video Communications', 'PayPal', 'OpenAI', 'Atari', 'Yahoo!', 'Lenovo', 'Toshiba', 'Panasonic', 'Siemens', 'Philips', 'Facebook', 'Tesla, Inc.'],
    rename: ['Twitter', 'Yahoo!', 'Panasonic', 'Philips'],
    skip: (c) => /^(information technology|ETH Zurich|OCLC, Inc\.|Alexa Internet)$/.test(c.name) || /\buniversity\b/i.test(c.desc ?? ''),
  },
  {
    id: 'science-phone', category: 'Science & Technology', prompt: 'Name a smartphone or mobile phone.',
    rules: 'Accept any model or series of smartphone or mobile phone, from any maker, current or classic (iPhone, Samsung Galaxy S, Google Pixel, Nokia 3310, BlackBerry, Motorola Razr, OnePlus, Xiaomi Mi), with or without the maker\'s name. Makers on their own (Apple, Samsung), tablets, watches and phone plans do not count.',
    source: 'Wikidata items that are a smartphone, a mobile phone or a smartphone model series, or a kind of any of them, known in at least 8 languages.',
    pattern: '{ { ?item wdt:P31/wdt:P279* wd:Q22645 } UNION { ?item wdt:P31/wdt:P279* wd:Q17517 } UNION { ?item wdt:P31 wd:Q71266741 } UNION { ?item wdt:P31 wd:Q19723444 } } .', minSignal: 6,
    alsoWritten: strip(/^(Apple|Samsung|Google|Nokia|Motorola|Sony|Huawei|Xiaomi|OnePlus|HTC|LG|BlackBerry) /),
    mustHave: ['iPhone', 'Samsung Galaxy S', 'Google Pixel', 'Nokia 3310', 'BlackBerry', 'Motorola Razr', 'Xiaomi Mi', 'iPhone 4', 'iPhone X', 'iPhone 6', 'iPhone 15', 'Galaxy Note', 'Nexus One', 'HTC Dream', 'Nokia N95', 'Nokia 1100', 'Samsung Galaxy S23', 'Samsung Galaxy Fold', 'Huawei P30', 'Sony Xperia', 'Nothing Phone', 'Fairphone', 'iPhone SE', 'Galaxy S5', 'Galaxy Z Flip', 'LG Optimus', 'Motorola DynaTAC', 'Palm Pre', 'Nokia Lumia', 'Oppo Find', 'Redmi Note', 'Pixel 7', 'iPhone 14', 'iPhone 13', 'iPhone 12'],
    rename: ['Nokia Lumia'],
  },

  // ================================================================ Movies & TV
  {
    id: 'movies-anime-or-manga', category: 'Movies & TV', prompt: 'Name an anime or manga.',
    rules: 'Accept any Japanese anime series, anime film or manga series, by its usual English or Japanese title (Naruto, One Piece, Dragon Ball, Spirited Away, Attack on Titan, Death Note, Sailor Moon). Western cartoons, Korean webtoons, studios, characters and the words "anime" or "manga" on their own do not count.',
    source: 'Wikidata items that are an anime television series, an anime film or a manga series, known in at least 8 languages.',
    pattern: anyInstance('Q63952888', 'Q20650540', 'Q21198342'), minSignal: 8,
    mustHave: ['Naruto', 'One Piece', 'Dragon Ball', 'Spirited Away', 'Attack on Titan', 'Death Note', 'Sailor Moon', 'My Neighbor Totoro', 'Pokémon', 'Fullmetal Alchemist', 'Demon Slayer: Kimetsu no Yaiba', 'My Hero Academia', 'Bleach', 'Cowboy Bebop', 'Neon Genesis Evangelion', 'Akira', 'Your Name', 'Princess Mononoke', "Howl's Moving Castle", 'Doraemon', 'Astro Boy', 'Jujutsu Kaisen', 'Hunter × Hunter', 'Tokyo Ghoul', 'One-Punch Man', 'Sword Art Online', 'Fairy Tail', 'Ghost in the Shell', 'Yu-Gi-Oh!', 'Digimon', 'Berserk', 'JoJo\'s Bizarre Adventure', 'Gintama', 'Haikyu!!', 'Spy × Family', 'Chainsaw Man', 'Mob Psycho 100', 'Dr. Stone', 'Fruits Basket'],
  },
  {
    id: 'movies-cartoon-character', category: 'Movies & TV', prompt: 'Name a cartoon character.',
    rules: 'Accept any animated character from a cartoon, animated film or animated series, from any country and period (Mickey Mouse, Bugs Bunny, SpongeBob SquarePants, Homer Simpson, Elsa, Scooby-Doo, Totoro). Live-action characters, puppets, video game characters who were never in a cartoon, and the word "cartoon" on its own do not count.',
    source: 'Wikidata items that are an animated character, known in at least 12 languages.', pattern: instanceOf('Q15711870'), minSignal: 12,
    mustHave: ['Mickey Mouse', 'Bugs Bunny', 'Donald Duck', 'Homer Simpson', 'SpongeBob SquarePants', 'Tom', 'Jerry', 'Scooby-Doo', 'Winnie-the-Pooh', 'Peppa Pig', 'Bart Simpson', 'Daffy Duck', 'Goofy', 'Minnie Mouse', 'Pluto', 'Woody', 'Buzz Lightyear', 'Elsa', 'Simba', 'Shrek', 'Garfield', 'Snoopy', 'Popeye', 'Betty Boop', 'Fred Flintstone', 'Road Runner', 'Wile E. Coyote', 'Porky Pig', 'Tweety', 'Sylvester', 'Bambi', 'Dumbo', 'Aladdin', 'Ariel', 'Stewie Griffin', 'Rick Sanchez', 'Eric Cartman', 'Patrick Star', 'Dora the Explorer', 'Doraemon', 'Totoro', 'Astro Boy', 'Pikachu', 'Charlie Brown', 'Mr. Bean'],
  },
  {
    id: 'movies-disney-film', category: 'Movies & TV', prompt: 'Name a Disney film.',
    rules: 'Accept any animated or live-action feature film made by Walt Disney Pictures, Walt Disney Animation Studios or Pixar (The Lion King, Frozen, Snow White and the Seven Dwarfs, Toy Story, Finding Nemo, Encanto, Mary Poppins). Films from other studios that Disney only bought later, television series, theme parks and characters on their own do not count.',
    source: 'Wikidata films whose production company is Walt Disney Pictures, Walt Disney Animation Studios or Pixar, known in at least 5 languages.',
    pattern: '{ { ?item wdt:P272 wd:Q191224 } UNION { ?item wdt:P272 wd:Q1047410 } UNION { ?item wdt:P272 wd:Q127552 } } ?item wdt:P31/wdt:P279* ?kind . VALUES ?kind { wd:Q11424 wd:Q202866 } .', minSignal: 5,
    mustHave: ['The Lion King', 'Frozen', 'Toy Story', 'Beauty and the Beast', 'Aladdin', 'Cinderella', 'Snow White and the Seven Dwarfs', 'The Little Mermaid', 'Moana', 'Tangled', 'Mulan', 'Pocahontas', 'Bambi', 'Dumbo', 'Pinocchio', 'Fantasia', 'Peter Pan', 'Lady and the Tramp', 'One Hundred and One Dalmatians', 'The Jungle Book', 'Sleeping Beauty', 'Hercules', 'Tarzan', 'Encanto', 'Zootopia', 'Big Hero 6', 'Lilo & Stitch', 'Mary Poppins', 'Alice in Wonderland', 'The Aristocats', 'Robin Hood', 'The Hunchback of Notre Dame', 'Finding Nemo', 'The Incredibles', 'Up', 'Inside Out', 'Coco', 'Ratatouille', 'WALL-E', 'Monsters, Inc.', 'Cars', 'Brave', 'Frozen II', 'Toy Story 2', 'Toy Story 3', 'Soul', 'Luca'],
  },
  {
    id: 'movies-harry-potter-character', category: 'Movies & TV', prompt: 'Name a character from Harry Potter.',
    rules: 'Accept any named character from the Harry Potter books, films or related works, human or not (Harry Potter, Hermione Granger, Ron Weasley, Albus Dumbledore, Severus Snape, Voldemort, Hagrid, Dobby). Actors, houses, spells, places and magical creatures named only as a species do not count.',
    source: 'Fictional characters that Wikidata lists as part of the Wizarding World or present in Harry Potter, known in at least 3 languages.',
    pattern: '{ { ?item wdt:P1080 wd:Q30739117 } UNION { ?item wdt:P1441 wd:Q8337 } UNION { ?item wdt:P1441 wd:Q216930 } } ?item wdt:P31/wdt:P279* wd:Q95074 .', minSignal: 3,
    extraAliases: { 'Lord Voldemort': ['Voldemort', 'Tom Riddle', 'He Who Must Not Be Named'], 'Rubeus Hagrid': ['Hagrid'], 'Harry Potter': ['The Boy Who Lived'] },
    mustHave: ['Harry Potter', 'Hermione Granger', 'Ron Weasley', 'Albus Dumbledore', 'Severus Snape', 'Lord Voldemort', 'Rubeus Hagrid', 'Draco Malfoy', 'Sirius Black', 'Neville Longbottom', 'Luna Lovegood', 'Ginny Weasley', 'Minerva McGonagall', 'Bellatrix Lestrange', 'Dobby', 'Fred Weasley', 'George Weasley', 'Remus Lupin', 'Cedric Diggory', 'Cho Chang', 'Peter Pettigrew', 'Dolores Umbridge', 'Gilderoy Lockhart', 'Alastor Moody', 'Nymphadora Tonks', 'Argus Filch', 'Fleur Delacour', 'Viktor Krum', 'Kreacher', 'Hedwig', 'Lucius Malfoy', 'Molly Weasley', 'Arthur Weasley', 'Vernon Dursley', 'Petunia Dursley', 'Dudley Dursley', 'Nagini', 'Buckbeak', 'Fawkes', 'Horace Slughorn'],
  },
  {
    id: 'movies-game-show', category: 'Movies & TV', prompt: 'Name a game show.',
    rules: 'Accept any television or radio game show or quiz show, from any country (Jeopardy!, Wheel of Fortune, Who Wants to Be a Millionaire?, The Price Is Right, Family Feud, The Chase, University Challenge, Deal or No Deal). Scripted dramas, talent contests, reality competitions with no quiz or game format, and the words "game show" on their own do not count.',
    source: 'Wikidata items that are a game show or a kind of one, known in at least 6 languages.', pattern: '{ { ?item wdt:P31/wdt:P279* wd:Q846662 } UNION { ?item wdt:P279+ wd:Q846662 } UNION { ?item wdt:P136 wd:Q846662 } } .', minSignal: 5,
    mustHave: ['Jeopardy!', 'Wheel of Fortune', 'Who Wants to Be a Millionaire?', 'The Price Is Right', 'Family Feud', 'Deal or No Deal', 'The Weakest Link', 'Mastermind', 'Countdown', 'Pointless', 'Blockbusters', 'Press Your Luck', 'Match Game', "Let's Make a Deal", 'Hollywood Squares', 'Catchphrase', 'Tipping Point', 'The Chase', 'Fort Boyard', 'Wipeout', 'Supermarket Sweep', 'Name That Tune', 'Password', 'The Newlywed Game', 'Gladiators', 'Take Me Out', 'University Challenge', 'QI', 'Would I Lie to You?', 'Taskmaster', 'Have I Got News for You', 'The Cube', 'American Ninja Warrior', 'Total Wipeout', 'Bullseye', 'Strike It Rich', 'Cash Cab', 'The Generation Game', 'Play Your Cards Right', 'Beat the Clock'],
    skip: nameIs(/^(talent show|The Voice.*|Thailand's Next Top Model|The Contender|High Stakes Poker|Disney Channel Games|The Amazing Race \d+)$/i),
  },

  // ================================================================ Music
  {
    id: 'music-opera-or-musical', category: 'Music', prompt: 'Name an opera or a musical.',
    rules: 'Accept any opera or stage musical, from any composer, country and period (La Traviata, The Magic Flute, Carmen, Madama Butterfly, Hamilton, The Lion King, Les Misérables, The Phantom of the Opera, Wicked, West Side Story), by its title. Films that were never on stage, ballets, concerts, composers and the words "opera" or "musical" on their own do not count.',
    source: 'Wikidata items filed as a "dramatico-musical work" (the one class Wikidata uses for operas, musicals and operettas), known in at least 12 languages.', pattern: kindOf('Q58483083'), minSignal: 12,
    mustHave: ['The Phantom of the Opera', 'Les Misérables', 'Hamilton', 'The Lion King', 'Wicked', 'Cats', 'Chicago', 'West Side Story', 'The Sound of Music', 'Carmen', 'La traviata', 'The Magic Flute', 'Madama Butterfly', 'La bohème', 'Tosca', 'Aida', 'Rigoletto', 'The Marriage of Figaro', 'Don Giovanni', 'Turandot', 'The Barber of Seville', 'Der Ring des Nibelungen', 'Grease', 'Mamma Mia!', 'Rent', 'Oklahoma!', 'Hairspray', 'Dear Evan Hansen', 'Fiddler on the Roof', 'Cabaret', 'My Fair Lady', 'Oliver!', 'Annie', 'The Book of Mormon', 'Joseph and the Amazing Technicolor Dreamcoat', 'Jesus Christ Superstar', 'Evita', 'Sweeney Todd', 'Tristan und Isolde', 'Otello', 'Fidelio', 'Nabucco', 'Pagliacci', 'Lohengrin', 'Parsifal', 'Die Fledermaus', 'Faust', 'Porgy and Bess', 'Dido and Aeneas', 'Salome', 'Eugene Onegin', 'Boris Godunov', 'Peter Grimes', 'Hansel and Gretel', 'Cosi fan tutte', 'Lucia di Lammermoor', 'Beauty and the Beast', 'Matilda the Musical', 'Come From Away', 'Six', 'Moulin Rouge!'],
    rename: ['Hansel and Gretel'],
  },
  {
    id: 'music-festival', category: 'Music', prompt: 'Name a music festival.',
    rules: 'Accept any music festival held anywhere in the world, one-off or annual, current or historic (Glastonbury, Coachella, Woodstock, Tomorrowland, Lollapalooza, Roskilde, Fuji Rock, Live Aid), with or without the word "Festival". Concert tours, single concerts, arts festivals with no music focus, and the word "festival" on its own do not count.',
    source: 'Wikidata items that are a music festival, known in at least 6 languages.', pattern: instanceOf('Q868557'), minSignal: 6, alsoWritten: strip(/ (Festival|Music Festival)$/),
    mustHave: ['Glastonbury Festival', 'Coachella', 'Woodstock', 'Tomorrowland', 'Lollapalooza', 'Reading and Leeds Festivals', 'Download Festival', 'Rock am Ring', 'Roskilde Festival', 'Sziget Festival', 'Primavera Sound', 'Bonnaroo Music and Arts Festival', 'Electric Daisy Carnival', 'Ultra Music Festival', 'Isle of Wight Festival', 'Montreux Jazz Festival', 'Newport Folk Festival', 'Summerfest', 'Fuji Rock Festival', 'Exit', 'Rock in Rio', 'Wacken Open Air', 'Splendour in the Grass', 'Osheaga', 'Austin City Limits Music Festival', 'Monterey Pop Festival', 'Live Aid', 'Burning Man', 'Latitude Festival', 'Creamfields', 'T in the Park', 'Bestival', 'Parklife', 'Boomtown Fair', 'Pukkelpop', 'Rock Werchter', 'Benicàssim', 'Mawazine', 'Summer Sonic', 'Stagecoach Festival'],
    rename: ['Coachella'],
    skip: nameIs(/Song Contest|^(MAMA Awards|ABU events)$/i),
  },
  {
    id: 'music-michael-jackson-song', category: 'Music', prompt: 'Name a song by Michael Jackson.',
    rules: 'Accept any song that Michael Jackson recorded and released as a solo artist or with the Jackson 5 or The Jacksons (Thriller, Billie Jean, Beat It, Smooth Criminal, Bad, Black or White, I Want You Back), by its title. Albums, songs he only wrote for other artists, and songs by other artists do not count.',
    source: 'Musical works that Wikidata lists as performed or composed by Michael Jackson.',
    pattern: '{ { ?item wdt:P175 wd:Q2831 } UNION { ?item wdt:P86 wd:Q2831 } } ?item wdt:P31/wdt:P279* wd:Q105543609 .',
    mustHave: ['Thriller', 'Billie Jean', 'Beat It', 'Bad', 'Smooth Criminal', 'Black or White', 'Man in the Mirror', 'Heal the World', "Don't Stop 'Til You Get Enough", 'Rock with You', 'Earth Song', "They Don't Care About Us", 'You Are Not Alone', 'Dirty Diana', 'The Way You Make Me Feel', 'Remember the Time', 'Scream', 'Leave Me Alone', 'Human Nature', 'P.Y.T. (Pretty Young Thing)', 'Off the Wall', 'Ben', 'Got to Be There', "Wanna Be Startin' Somethin'", 'Say Say Say', 'Will You Be There', 'Jam', 'Who Is It', 'In the Closet', 'Blood on the Dance Floor', 'Speed Demon', 'Liberian Girl', "I Just Can't Stop Loving You", 'Another Part of Me', 'ABC', 'I Want You Back', 'Dangerous', 'Stranger in Moscow', 'Childhood', 'Rockin\' Robin'],
  },

  {
    id: 'music-queen-song', category: 'Music', prompt: 'Name a song by Queen.',
    rules: "Accept any song that the band Queen recorded and released, including album tracks and songs from soundtracks (Bohemian Rhapsody, We Will Rock You, We Are the Champions, Don't Stop Me Now, Another One Bites the Dust, Under Pressure), by its title. Albums, solo songs by individual members, songs they only wrote for others, and songs by other bands do not count.",
    source: 'Musical works that Wikidata lists as performed or composed by Queen.',
    pattern: '{ { ?item wdt:P175 wd:Q15862 } UNION { ?item wdt:P86 wd:Q15862 } } ?item wdt:P31/wdt:P279* wd:Q105543609 .',
    mustHave: ['Bohemian Rhapsody', 'We Will Rock You', 'We Are the Champions', "Don't Stop Me Now", 'Another One Bites the Dust', 'Under Pressure', 'Somebody to Love', 'I Want to Break Free', 'Killer Queen', 'Radio Ga Ga', 'A Kind of Magic', 'Crazy Little Thing Called Love', 'Bicycle Race', 'Fat Bottomed Girls', 'Flash', 'Who Wants to Live Forever', 'The Show Must Go On', 'Innuendo', 'These Are the Days of Our Lives', 'Hammer to Fall', 'I Want It All', "You're My Best Friend", 'Seven Seas of Rhye', "Now I'm Here", 'Save Me', 'Play the Game', 'Spread Your Wings', 'One Vision', 'Breakthru', 'Too Much Love Will Kill You', 'Love of My Life', 'Tie Your Mother Down', 'Stone Cold Crazy', 'Good Old-Fashioned Lover Boy', "It's a Hard Life", 'Friends Will Be Friends', 'Headlong', 'No-One but You', 'Mustapha', 'Las Palabras de Amor'],
  },
  // ================================================================ Sports
  {
    id: 'sports-cricketer', category: 'Sports', prompt: 'Name a cricketer.',
    rules: 'Accept any real cricketer, men\'s or women\'s, current or retired, from any country (Sachin Tendulkar, Don Bradman, Virat Kohli, Ben Stokes, Shane Warne, Brian Lara), by their usual name or surname. Umpires, commentators, coaches who never played, and fictional players do not count.',
    source: 'People in Wikidata whose occupation is cricketer, known in at least 8 languages.', pattern: occupation('Q12299841') + HUMAN, minSignal: 8, alsoWritten: personForms,
    mustHave: ['Sachin Tendulkar', 'Virat Kohli', 'Donald Bradman', 'MS Dhoni', 'Ricky Ponting', 'Shane Warne', 'Brian Lara', 'Jacques Kallis', 'Kapil Dev', 'Imran Khan', 'Wasim Akram', 'Shoaib Akhtar', 'Muttiah Muralitharan', 'Ian Botham', 'W. G. Grace', 'Ben Stokes', 'Joe Root', 'Kumar Sangakkara', 'Rahul Dravid', 'Sourav Ganguly', 'Glenn McGrath', 'Adam Gilchrist', 'Steve Smith', 'Viv Richards', 'Garfield Sobers', 'James Anderson', 'Anil Kumble', 'Virender Sehwag', 'Chris Gayle', 'AB de Villiers', 'Babar Azam', 'Kane Williamson', 'Rohit Sharma', 'Jasprit Bumrah', 'Shahid Afridi', 'Javed Miandad', 'Allan Border', 'Steve Waugh', 'Alastair Cook', 'Andrew Flintoff'],
    rename: ['Babar Azam'],
    skip: notDescribedAs(/cricket|batsman|batter|bowler|wicket|all-rounder/i),
  },
  {
    id: 'sports-baseball-player', category: 'Sports', prompt: 'Name a baseball player.',
    rules: 'Accept any real professional baseball player, current or retired, from any country (Babe Ruth, Derek Jeter, Hank Aaron, Jackie Robinson, Shohei Ohtani, Ichiro Suzuki), by their usual name or surname. Managers who never played, and fictional players, do not count.',
    source: 'People in Wikidata whose occupation is baseball player, known in at least 8 languages.', pattern: occupation('Q10871364') + HUMAN, minSignal: 8, alsoWritten: personForms,
    mustHave: ['Babe Ruth', 'Derek Jeter', 'Hank Aaron', 'Willie Mays', 'Jackie Robinson', 'Mickey Mantle', 'Lou Gehrig', 'Barry Bonds', 'Ted Williams', 'Joe DiMaggio', 'Sandy Koufax', 'Roberto Clemente', 'Cal Ripken Jr.', 'Ty Cobb', 'Pete Rose', 'Nolan Ryan', 'Shohei Ohtani', 'Mike Trout', 'Ichiro Suzuki', 'Albert Pujols', 'Mark McGwire', 'Sammy Sosa', 'Alex Rodriguez', 'Yogi Berra', 'Cy Young', 'Randy Johnson', 'Greg Maddux', 'Mariano Rivera', 'Ken Griffey Jr.', 'David Ortiz', 'Clayton Kershaw', 'Aaron Judge', 'Satchel Paige', 'Honus Wagner', 'Stan Musial', 'Roger Clemens', 'Bryce Harper', 'Mookie Betts', 'Tom Seaver', 'Reggie Jackson'],
    skip: notDescribedAs(/baseball|baseman|pitcher|catcher|infielder|outfielder|shortstop|\bMLB\b|Major League|\bNPB\b|Negro league/i),
  },
  {
    id: 'sports-boxer', category: 'Sports', prompt: 'Name a boxer.',
    rules: 'Accept any real professional or Olympic boxer, men\'s or women\'s, current or retired, from any country (Muhammad Ali, Mike Tyson, Floyd Mayweather, Manny Pacquiao, Tyson Fury, Laila Ali), by their usual name or surname. Mixed martial artists, wrestlers, trainers who never boxed, and fictional boxers (Rocky Balboa) do not count.',
    source: 'People in Wikidata whose occupation is boxer, known in at least 8 languages.', pattern: occupation('Q11338576') + HUMAN, minSignal: 8, alsoWritten: personForms,
    mustHave: ['Muhammad Ali', 'Mike Tyson', 'Floyd Mayweather Jr.', 'Manny Pacquiao', 'Joe Frazier', 'George Foreman', 'Sugar Ray Leonard', 'Rocky Marciano', 'Joe Louis', 'Jack Johnson', 'Oscar De La Hoya', 'Evander Holyfield', 'Lennox Lewis', 'Sugar Ray Robinson', 'Jake LaMotta', 'Roberto Durán', 'Marvin Hagler', 'Thomas Hearns', 'Canelo Álvarez', 'Tyson Fury', 'Anthony Joshua', 'Wladimir Klitschko', 'Vitali Klitschko', 'Julio César Chávez', 'Ricky Hatton', 'Larry Holmes', 'Ken Norton', 'Archie Moore', 'Jack Dempsey', 'Max Schmeling', 'Gennady Golovkin', 'Deontay Wilder', 'Oleksandr Usyk', 'Naseem Hamed', 'Joe Calzaghe', 'Barry McGuigan', 'Henry Cooper', 'Frank Bruno', 'Floyd Patterson', 'Sonny Liston', 'Laila Ali'],
    skip: notDescribedAs(/box|pugilist|weight/i),
  },
  {
    id: 'sports-golfer', category: 'Sports', prompt: 'Name a golfer.',
    rules: 'Accept any real professional or amateur champion golfer, men\'s or women\'s, current or retired, from any country (Tiger Woods, Jack Nicklaus, Rory McIlroy, Arnold Palmer, Annika Sörenstam, Seve Ballesteros), by their usual name or surname. Caddies, course designers, commentators and fictional golfers do not count.',
    source: 'People in Wikidata whose occupation is golfer, known in at least 8 languages.', pattern: occupation('Q11303721') + HUMAN, minSignal: 8, alsoWritten: personForms,
    mustHave: ['Tiger Woods', 'Jack Nicklaus', 'Arnold Palmer', 'Rory McIlroy', 'Phil Mickelson', 'Gary Player', 'Ben Hogan', 'Seve Ballesteros', 'Nick Faldo', 'Greg Norman', 'Lee Trevino', 'Tom Watson', 'Bobby Jones', 'Sam Snead', 'Jordan Spieth', 'Dustin Johnson', 'Brooks Koepka', 'Scottie Scheffler', 'Justin Thomas', 'Jon Rahm', 'Bryson DeChambeau', 'Annika Sörenstam', 'Lydia Ko', 'Nelly Korda', 'Payne Stewart', 'Walter Hagen', 'Byron Nelson', 'Fred Couples', 'Ernie Els', 'Vijay Singh', 'Sergio García', 'Henrik Stenson', 'Justin Rose', 'Adam Scott', 'Jim Furyk', 'Colin Montgomerie', 'Bernhard Langer', 'Nancy Lopez', 'Babe Zaharias', 'Rickie Fowler'],
    skip: notDescribedAs(/golf/i),
  },
  {
    id: 'sports-ice-hockey-player', category: 'Sports', prompt: 'Name an ice hockey player.',
    rules: 'Accept any real professional or Olympic ice hockey player, men\'s or women\'s, current or retired, from any country (Wayne Gretzky, Mario Lemieux, Bobby Orr, Sidney Crosby, Alexander Ovechkin, Connor McDavid), by their usual name or surname. Field hockey players, coaches who never played, and fictional players do not count.',
    source: 'People in Wikidata whose occupation is ice hockey player, known in at least 8 languages.', pattern: occupation('Q11774891') + HUMAN, minSignal: 8, alsoWritten: personForms,
    mustHave: ['Wayne Gretzky', 'Mario Lemieux', 'Gordie Howe', 'Bobby Orr', 'Sidney Crosby', 'Alexander Ovechkin', 'Connor McDavid', 'Maurice Richard', 'Jaromír Jágr', 'Patrick Roy', 'Martin Brodeur', 'Mark Messier', 'Steve Yzerman', 'Joe Sakic', 'Ray Bourque', 'Brett Hull', 'Bobby Hull', 'Phil Esposito', 'Guy Lafleur', 'Jean Béliveau', 'Dominik Hašek', 'Pavel Bure', 'Teemu Selänne', 'Nicklas Lidström', 'Eric Lindros', 'Jonathan Toews', 'Patrick Kane', 'Auston Matthews', 'Nathan MacKinnon', 'Henrik Lundqvist', 'Carey Price', 'Jarome Iginla', 'Peter Forsberg', 'Mats Sundin', 'Brendan Shanahan', 'Chris Chelios', 'Paul Coffey', 'Denis Potvin', 'Mike Bossy', 'Bryan Trottier'],
    skip: notDescribedAs(/hockey|goaltender|goalie|\bNHL\b|defen[cs]eman|winger/i, /field hockey|roller hockey|inline hockey/i),
  },

  // ================================================================ Transport & Vehicles
  {
    id: 'transport-motorcycle-brand', category: 'Transport & Vehicles', prompt: 'Name a motorcycle brand.',
    rules: 'Accept any company or brand that makes or made motorcycles or scooters, current or defunct (Harley-Davidson, Honda, Yamaha, Ducati, Triumph, Royal Enfield, Vespa, Kawasaki, KTM). Car makers who never built motorcycles, individual models (Fireblade), helmets and clothing brands do not count.',
    source: 'Wikidata items that are a motorcycle manufacturer, known in at least 4 languages.', pattern: '?item wdt:P31 wd:Q15081030 .', minSignal: 4, alsoWritten: strip(MOTO_SUFFIX),
    mustHave: ['Harley-Davidson', 'Honda', 'Yamaha', 'Kawasaki', 'Suzuki', 'Ducati', 'BMW Motorrad', 'Triumph Motorcycles', 'KTM', 'Royal Enfield', 'Indian Motorcycle', 'Vespa', 'Aprilia', 'Husqvarna Motorcycles', 'Piaggio', 'MV Agusta', 'Moto Guzzi', 'Norton Motorcycle Company', 'BSA', 'Bajaj Auto', 'Hero MotoCorp', 'TVS Motor Company', 'Benelli', 'Vincent Motorcycles', 'Buell Motorcycle Company', 'Zero Motorcycles', 'Cagiva', 'Lambretta', 'Ural Motorcycles', 'Jawa', 'Brough Superior', 'Excelsior Motor Company', 'Victory Motorcycles', 'Gilera', 'Kymco', 'Yamaha', ],
    rename: ['Royal Enfield', 'Kymco', 'Yamaha', 'Kawasaki'],
  },
  {
    id: 'transport-railway-station', category: 'Transport & Vehicles', prompt: 'Name a railway station.',
    rules: 'Accept any named railway or train station, large or small, in any country, with or without the word "Station" (Grand Central, King\'s Cross, Waterloo, Gare du Nord, Shinjuku, Penn Station, Roma Termini). Metro-only stops, bus stations, airports, and fictional stations (Platform 9¾) do not count.',
    source: 'Wikidata items that are a railway station, known in at least 25 languages.', pattern: instanceOf('Q55488'), minSignal: 25, alsoWritten: strip(STATION_SUFFIX),
    mustHave: ['Grand Central Terminal', "King's Cross railway station", 'Paddington railway station', 'London Waterloo station', 'London Victoria station', 'Pennsylvania Station', 'Gare du Nord', 'Shinjuku Station', 'Tokyo Station', 'Union Station', 'St Pancras railway station', 'Liverpool Street station', 'Euston railway station', 'Kyoto Station', 'Berlin Hauptbahnhof', 'Milano Centrale railway station', 'Roma Termini railway station', 'Gare de Lyon', 'Chhatrapati Shivaji Maharaj Terminus', 'Howrah Junction railway station', 'Antwerp Central Station', 'Madrid Atocha railway station', 'Zürich Hauptbahnhof', 'Wien Hauptbahnhof', 'Amsterdam Centraal', 'Brussels-South railway station', "Gare de l'Est", 'Gare Saint-Lazare', 'Beijing South railway station', 'Shanghai Hongqiao railway station', 'Central railway station, Sydney', 'Flinders Street railway station', 'Washington Union Station', 'Hamburg Hauptbahnhof', 'Köln Hauptbahnhof', 'München Hauptbahnhof', 'Frankfurt (Main) Hauptbahnhof', 'Gare Montparnasse', 'Gare d\'Austerlitz', 'Kansas City Union Station'],
    skip: nameIs(/tube station|underground station|metro station|^(Bank and Monument stations|Châtelet|La Défense|Charles de Gaulle - Étoile|Sokolniki|South Kensington|Kiyevskaya|Yerevan|Tünel)$/i),
  },
  {
    id: 'transport-spacecraft', category: 'Transport & Vehicles', prompt: 'Name a spacecraft.',
    rules: 'Accept any named spacecraft, space probe, rover, space station or space telescope, crewed or not (Voyager 1, Apollo 11\'s Columbia, Sputnik 1, the International Space Station, the Hubble Space Telescope, Curiosity, Space Shuttle Challenger, Soyuz). Rockets that only launch things, missions named only as a mission, astronauts and fictional ships (the Enterprise) do not count.',
    source: 'Wikidata items that are a spacecraft or a kind of one (a flyby probe, a space telescope, a rover), known in at least 8 languages.', pattern: kindOf('Q40218'), minSignal: 8,
    mustHave: ['Voyager 1', 'Sputnik 1', 'International Space Station', 'Hubble Space Telescope', 'Space Shuttle Columbia', 'Space Shuttle Challenger', 'Space Shuttle Discovery', 'Space Shuttle Atlantis', 'Space Shuttle Endeavour', 'Soyuz', 'Curiosity', 'Voyager 2', 'Cassini–Huygens', 'Juno', 'New Horizons', 'Pioneer 10', 'James Webb Space Telescope', 'Viking 1', 'Luna 2', 'Vostok 1', 'Skylab', 'Mir', 'Tiangong space station', 'Crew Dragon', 'Perseverance', 'Opportunity', 'Spirit', 'Sojourner', 'Philae', 'Rosetta', 'Galileo', 'Magellan', 'Kepler space telescope', 'Chandra X-ray Observatory', 'Hayabusa', 'Apollo Lunar Module', 'Apollo command and service module', 'Mariner 4', 'Pioneer 11', 'Ingenuity'],
    rename: ['Space Shuttle Columbia', 'Space Shuttle Challenger', 'Space Shuttle Discovery', 'Space Shuttle Atlantis', 'Space Shuttle Endeavour'],
    // Wikidata also has an item called just "Columbia" (the Apollo 11 command module) and one called "Endeavour" (a Crew Dragon capsule): typed alone they must mean
    // the shuttles, so those two are listed under longer names instead of beating the shuttles' short names
    skip: (c) => c.id === 'Q85753536' || c.id === 'Q96206891' || nameIs(/^(artificial satellite|Space Shuttle|space station|space probe|communications satellite|space debris|space telescope|satellite|spacecraft|Falcon 9|Falcon Heavy|crewed spacecraft)$/i)(c),
    extras: [
      { name: 'Apollo 11 Command Module Columbia', signal: 60, aliases: ['Command Module Columbia', 'CM-107', 'Apollo 11 Command Module'] },
      { name: 'Crew Dragon Endeavour', signal: 50, aliases: ['SpaceX Dragon C206', 'Dragon C206', 'Crew Dragon C206'] },
    ],
  },

  // ================================================================ Miscellaneous
  {
    id: 'misc-religion', category: 'Miscellaneous', prompt: 'Name a religion.',
    rules: 'Accept any religion, faith or major denomination, old or new, large or small (Christianity, Islam, Hinduism, Buddhism, Judaism, Sikhism, Shinto, Catholicism, Sunni Islam, Wicca, Rastafari). Atheism, political ideologies, philosophies, holy books, gods on their own and the word "religion" on its own do not count.',
    source: 'Wikidata items that are a religion or a kind of one (including denominations), known in at least 10 languages.', pattern: instanceOf('Q9174'), minSignal: 10,
    mustHave: ['Christianity', 'Islam', 'Hinduism', 'Buddhism', 'Judaism', 'Sikhism', 'Taoism', 'Shinto', 'Jainism', 'Zoroastrianism', 'Baháʼí Faith', 'Confucianism', 'Catholicism', 'Protestantism', 'Eastern Orthodox Church', 'Paganism', 'Wicca', 'Rastafari', 'Scientology', 'The Church of Jesus Christ of Latter-day Saints', 'Anglicanism', 'Lutheranism', 'Methodism', 'Baptists', 'Pentecostalism', 'Sunni Islam', 'Shia Islam', 'Haitian Vodou', 'Santería', 'Druze', 'Yazidism', 'Animism', 'Satanism', 'Theravada', 'Mahayana', 'Zen', 'Hare Krishna', 'Calvinism', 'Mormonism', 'Jehovah\'s Witnesses'],
    skip: nameIs(/^(ecstasy|fetishism|monotheism in Islam|I Ching|Tantra massage|Lourdes apparitions|Our Lady of China)$/i),
  },
  {
    id: 'misc-holiday', category: 'Miscellaneous', prompt: 'Name a holiday or festival.',
    rules: 'Accept any public holiday, religious festival or traditional celebration, from any country or faith (Christmas, Easter, Halloween, Thanksgiving, Diwali, Eid al-Fitr, Hanukkah, Chinese New Year, Bastille Day, Mardi Gras). Single birthdays, sports events, music festivals and the words "holiday" or "festival" on their own do not count.',
    source: 'Wikidata items that are a holiday or a kind of one, known in at least 12 languages.', pattern: instanceOf('Q1445650'), minSignal: 12,
    mustHave: ['Christmas', 'Easter', 'Halloween', 'Thanksgiving', "New Year's Day", "Valentine's Day", 'Diwali', 'Eid al-Fitr', 'Eid al-Adha', 'Hanukkah', 'Passover', 'Ramadan', 'Holi', 'Chinese New Year', 'Independence Day', 'Labor Day', 'Memorial Day', "Mother's Day", "Father's Day", 'Bastille Day', 'Boxing Day', "Saint Patrick's Day", 'Guy Fawkes Night', 'Day of the Dead', 'Carnival', 'Mardi Gras', 'Oktoberfest', 'Midsummer', 'Yom Kippur', 'Rosh Hashanah', 'Vesak', 'Martin Luther King Jr. Day', 'Veterans Day', 'Columbus Day', 'Australia Day', 'Anzac Day', 'Canada Day', 'Burns Night', 'Epiphany', 'Pentecost', 'Good Friday', 'Ash Wednesday', "All Saints' Day", "April Fools' Day", 'Earth Day', "International Women's Day", 'Juneteenth', 'Navratri', 'Obon', 'Hogmanay'],
    rename: ['Burns Night', 'Good Friday'],
    skip: nameIs(/^(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}(, \d{4})?$/),
  },
  {
    id: 'misc-fashion-brand', category: 'Miscellaneous', prompt: 'Name a fashion or clothing brand.',
    rules: 'Accept any fashion house or clothing, shoe or sportswear brand, luxury or high street, current or defunct (Gucci, Chanel, Louis Vuitton, Nike, Adidas, Zara, H&M, Levi\'s, Burberry, Prada, Converse). Department stores, jewellers, watchmakers, perfumes named only as a perfume, designers by their own name only, and the word "fashion" on its own do not count.',
    source: 'Wikidata items that are a fashion house, or businesses in the fashion or clothing industry, known in at least 10 languages.',
    pattern: '{ { ?item wdt:P31 wd:Q1941779 } UNION { ?item wdt:P452 wd:Q12684 } UNION { ?item wdt:P452 wd:Q11828862 } } .', minSignal: 10,
    mustHave: ['Gucci', 'Chanel', 'Louis Vuitton', 'Prada', 'Versace', 'Dior', 'Hermès', 'Burberry', 'Armani', 'Ralph Lauren Corporation', 'Nike', 'Adidas', 'Zara', 'H&M', "Levi's", 'Calvin Klein', 'Tommy Hilfiger', 'Balenciaga', 'Givenchy', 'Dolce & Gabbana', 'Fendi', 'Valentino', 'Yves Saint Laurent', 'Uniqlo', 'Gap', 'Lacoste', 'Fila', 'Puma', 'Under Armour', 'Supreme', 'Patagonia', 'The North Face', 'Lululemon', "Victoria's Secret", 'Vans', 'Converse', 'Reebok', 'New Balance', 'Timberland', 'Moncler', 'Off-White', 'Balmain', 'Alexander McQueen', 'Vivienne Westwood', 'Michael Kors', 'Diesel', 'Benetton', 'Primark', 'Mango'],
    rename: ["Levi's", 'Tommy Hilfiger', 'The North Face', 'Timberland', 'Armani'],
    skip: nameIs(/^(streetwear|CoverGirl|Gulf and Western Industries)$/i),
  },
  {
    id: 'misc-dance', category: 'Miscellaneous', prompt: 'Name a dance.',
    rules: 'Accept any named dance or dance style, from any culture and period (ballet, tango, waltz, salsa, hip hop, flamenco, tap, breakdancing, Bharatanatyam, the haka, the Macarena). Single choreographed routines (a music video), dances in fiction only, sports that only look like dancing, and the word "dance" on its own do not count.',
    source: 'Wikidata items that are a dance or a kind of dance, known in at least 6 languages.', pattern: kindOf('Q11639'), minSignal: 6,
    mustHave: ['Ballet', 'Tango', 'Waltz', 'Salsa', 'Hip-hop dance', 'Breakdancing', 'Flamenco', 'Tap dance', 'Ballroom dance', 'Foxtrot', 'Cha-cha-cha', 'Samba', 'Rumba', 'Jive', 'Swing', 'Polka', 'Square dance', 'Belly dance', 'Bharatanatyam', 'Kathak', 'Bollywood dance', 'Folk dance', 'Line dance', 'Twist', 'Macarena', 'Charleston', 'Lindy Hop', 'Quickstep', 'Paso doble', 'Mambo', 'Bachata', 'Merengue', 'Zumba', 'Contemporary dance', 'Jazz dance', 'Irish dance', 'Haka', 'Capoeira', 'Lambada', 'Can-can', 'Hula', 'Polonaise', 'Mazurka', 'Minuet', 'Morris dance', 'Kizomba', 'Hustle', 'Pole dance', 'Floss', 'Moonwalk'],
    rename: ['Breakdancing', 'Rumba'],
    skip: nameIs(/^(rainmaking rites|cheerleading)$/i),
  },
]
