/**
 * Batch 4: new questions, none of them a class we already have (see batch1.ts to batch3.ts and the live bank).
 * Same recipe as before (newq.ts): a Wikidata class or occupation, a minimum number of Wikipedia languages so the list has a head
 * people know, and `mustHave` = the answers a casual English-speaking player thinks of first, most obvious first.
 * Lessons applied from Batches 2 and 3 (docs/ANSWER_LISTS.md): every recipe is preflighted against its head before the long fetch; people are
 * found by occupation, kept only if human and if Wikidata's one-line description names the activity; `skip` removes answers of the wrong class.
 * Build with: npx tsx src/expand/newq.ts --batch batch4 --out C:/Users/weibi/minitude/list-build/batch4
 */
import { speciesBelow } from './build'
import type { NewQuestion } from './newq'
import { anyInstance, anyKind, anyOf, heldPosition, HUMAN, instanceOf, kindOf, latinOnly, latinTaxon, nameIs, NOT_EXTINCT, notDescribedAs, occupation, occupationUnder, personForms, strip } from './recipes'

const PLANTS = /\b(plant|tree|flower|fungus|fungi|lichen|moss|fern|orchid|cactus|shrub|grass|cycad|palm|alga|seaweed|herb|vine|conifer|pine|oak|mushroom|bamboo|aloe|lily)\b/i
const CUISINE = (cuisine: string, country: string) => `{ { ?item wdt:P2012 wd:${cuisine} } UNION { ?item wdt:P361 wd:${cuisine} } UNION { ?item wdt:P495 wd:${country} . ?item wdt:P31/wdt:P279* wd:Q746549 } } .`

export const BATCH: NewQuestion[] = [
  // ================================================================ Animals & Nature
  {
    id: 'animals-bird-of-prey', category: 'Animals & Nature', prompt: 'Name a bird of prey.',
    rules: 'Accept any living bird of prey by its common name (bald eagle, golden eagle, peregrine falcon, barn owl, snowy owl, osprey, red-tailed hawk, Andean condor, secretarybird) or its scientific name, including group names where every member is a bird of prey (eagle, hawk, falcon, owl, vulture, kite, harrier, buzzard). Songbirds, ducks, extinct birds and fictional birds do not count.',
    source: 'Species below the orders of hawks and eagles, falcons, owls and New World vultures in Wikidata (without extinct ones), by their English common names, plus group names added by hand.',
    fetch: () => speciesBelow(['Q21736', 'Q25370', 'Q25222', 'Q20639356'], NOT_EXTINCT, 'Q7432', { depth: 9, commonNames: true, fame: true }), commonNames: true, skip: latinOnly,
    extras: [
      { name: 'Eagle', signal: 120, aliases: ['Eagles'] }, { name: 'Hawk', signal: 110, aliases: ['Hawks'] }, { name: 'Falcon', signal: 110, aliases: ['Falcons'] }, { name: 'Owl', signal: 120, aliases: ['Owls'] },
      { name: 'Vulture', signal: 100, aliases: ['Vultures'] }, { name: 'Kite', signal: 70 }, { name: 'Harrier', signal: 60 }, { name: 'Buzzard', signal: 70 }, { name: 'Condor', signal: 80 }, { name: 'Bird of prey', signal: 60, aliases: ['Raptor'] },
    ],
    mustHave: ['Eagle', 'Owl', 'Hawk', 'Falcon', 'Vulture', 'Bald eagle', 'Golden eagle', 'Peregrine falcon', 'Barn owl', 'Snowy owl', 'Osprey', 'Red-tailed hawk', 'Andean condor', 'California condor', 'Harpy eagle', 'Great horned owl', 'Secretarybird', 'Kestrel', 'Common buzzard', 'Sparrowhawk', 'Northern goshawk', 'Gyrfalcon', 'Merlin', 'Eurasian hobby', 'Turkey vulture', 'Griffon vulture', 'Bearded vulture', 'Philippine eagle', 'White-tailed eagle', "Steller's sea eagle", 'Martial eagle', 'Crowned eagle', 'Eurasian eagle-owl', 'Tawny owl', 'Little owl', 'Burrowing owl', 'Great grey owl', 'Kite', 'Harrier', 'Buzzard'],
    rename: ['Barn owl', 'Bearded vulture'],
  },
  {
    id: 'animals-tree', category: 'Animals & Nature', prompt: 'Name a tree.',
    rules: 'Accept any kind of tree by its everyday name (oak, pine, maple, birch, willow, baobab, redwood, palm, cherry tree), by its scientific name, or by a group name where every member is a tree. Shrubs, bushes, flowers and plants that are not trees do not count.',
    source: 'Wikidata plants described as a tree or filed under tree life forms, known in at least 6 languages, by their English common names.',
    pattern: '{ { ?item wdt:P31 wd:Q10884 } UNION { ?item wdt:P279 wd:Q10884 } } .', commonNames: true, minSignal: 6, skip: anyOf(latinOnly, latinTaxon, nameIs(/^(roadside tree|shade tree|Easter egg tree|street tree|tree)$/i)),
    mustHave: ['Oak', 'Pine', 'Maple', 'Birch', 'Willow', 'Elm', 'Cedar', 'Palm tree', 'Baobab', 'Redwood', 'Sequoia', 'Apple tree', 'Cherry tree', 'Olive tree', 'Fir', 'Spruce', 'Beech', 'Ash', 'Poplar', 'Cypress', 'Eucalyptus', 'Banyan', 'Mahogany', 'Teak', 'Ebony', 'Bamboo', 'Walnut', 'Chestnut', 'Hawthorn', 'Yew', 'Lime tree', 'Sycamore', 'Acacia', 'Magnolia', 'Coconut palm', 'Date palm', 'Mango tree', 'Orange tree', 'Jacaranda', 'Weeping willow'],
    rename: ['Eucalyptus', 'Lime tree'],
  },
  {
    id: 'animals-endangered', category: 'Animals & Nature', prompt: 'Name an endangered animal.',
    rules: 'Accept any animal that the IUCN Red List classes as vulnerable, endangered or critically endangered (tiger, giant panda, blue whale, black rhinoceros, orangutan, hawksbill turtle, snow leopard), by its common or scientific name, or by a group name where every member is threatened. Extinct animals, safe species such as the house sparrow, and plants do not count.',
    source: 'Wikidata animals whose conservation status is vulnerable, endangered or critically endangered, known in at least 6 languages, by their English common names.',
    pattern: '?item wdt:P141 ?status . VALUES ?status { wd:Q278113 wd:Q96377276 wd:Q219127 } .', commonNames: true, minSignal: 10, skip: anyOf(latinOnly, latinTaxon, (c) => PLANTS.test(c.desc ?? '')),
    mustHave: ['Tiger', 'Giant panda', 'Blue whale', 'Polar bear', 'African elephant', 'Asian elephant', 'Black rhinoceros', 'Gorilla', 'Orangutan', 'Snow leopard', 'Leatherback sea turtle', 'Cheetah', 'African wild dog', 'Pangolin', 'Red panda', 'Hawksbill sea turtle', 'Mountain gorilla', 'Chimpanzee', 'Bonobo', 'Lion', 'Giraffe', 'Hippopotamus', 'Koala', 'Whale shark', 'Great white shark', 'Saola', 'Vaquita', 'Amur leopard', 'Javan rhinoceros', 'Sumatran rhinoceros', 'California condor', 'Kakapo', 'Axolotl', 'Komodo dragon', 'Sea otter', 'Green sea turtle', 'Bengal tiger', 'Sumatran orangutan', 'Cross River gorilla', 'Philippine eagle'],
    rename: ['Leatherback sea turtle', 'African wild dog', 'Hawksbill sea turtle', 'Hippopotamus', 'Sumatran rhinoceros', 'Komodo dragon'],
  },
  {
    id: 'animals-extinct', category: 'Animals & Nature', prompt: 'Name an extinct animal.',
    rules: 'Accept any animal that no longer exists, whether it died out recently or in prehistoric times (dodo, woolly mammoth, thylacine, passenger pigeon, saber-toothed cat, great auk, Tyrannosaurus rex), by its common or scientific name. Living animals, endangered animals, mythical creatures and extinct plants do not count.',
    source: 'Wikidata animals whose conservation status is extinct, known in at least 6 languages, plus well-known prehistoric animals added by hand.',
    pattern: '?item wdt:P141 wd:Q237350 .', commonNames: true, minSignal: 6, skip: anyOf(latinOnly, latinTaxon, nameIs(/^culo mojao$/i), (c) => PLANTS.test(c.desc ?? '')),
    extras: [
      { name: 'Woolly mammoth', signal: 150, aliases: ['Mammoth', 'Mammuthus primigenius'] }, { name: 'Mastodon', signal: 100 }, { name: 'Saber-toothed cat', signal: 110, aliases: ['Sabre-toothed tiger', 'Saber-toothed tiger', 'Smilodon'] },
      { name: 'Megalodon', signal: 100 }, { name: 'Trilobite', signal: 90 }, { name: 'Giant ground sloth', signal: 70 }, { name: 'Dire wolf', signal: 90 }, { name: 'Woolly rhinoceros', signal: 70 },
      { name: 'Cave bear', signal: 70 }, { name: 'Irish elk', signal: 60 }, { name: 'Tyrannosaurus', signal: 150, aliases: ['T. rex', 'Tyrannosaurus rex', 'T rex'] }, { name: 'Triceratops', signal: 110 }, { name: 'Velociraptor', signal: 100 },
      { name: 'Stegosaurus', signal: 100 }, { name: 'Brachiosaurus', signal: 80 }, { name: 'Pterodactyl', signal: 80, aliases: ['Pterosaur'] }, { name: 'Ammonite', signal: 70 }, { name: 'Dunkleosteus', signal: 50 }, { name: 'Archaeopteryx', signal: 90 },
      { name: 'Glyptodon', signal: 50 }, { name: 'Terror bird', signal: 40 }, { name: 'Dinosaur', signal: 140, aliases: ['Dinosaurs'] }, { name: 'Neanderthal', signal: 100 },
    ],
    mustHave: ['Dodo', 'Woolly mammoth', 'Tyrannosaurus', 'Thylacine', 'Passenger pigeon', 'Saber-toothed cat', 'Great auk', 'Quagga', "Steller's sea cow", 'Megalodon', 'Dire wolf', 'Triceratops', 'Velociraptor', 'Stegosaurus', 'Mastodon', 'Trilobite', 'Moa', 'Elephant bird', 'Carolina parakeet', 'Golden toad', 'Pyrenean ibex', 'Baiji', 'Caribbean monk seal', 'Heath hen', 'Labrador duck', 'Bali tiger', 'Javan tiger', 'Aurochs', 'Giant ground sloth', 'Western black rhinoceros', 'Archaeopteryx', 'Pterodactyl', 'Ammonite', 'Irish elk', 'Cave bear', 'Woolly rhinoceros', 'Dunkleosteus', 'Glyptodon', 'Terror bird', 'Falkland Islands wolf'],
    rename: ['Golden toad', 'Western black rhinoceros', 'Falkland Islands wolf'],
  },
  {
    id: 'animals-gemstone', category: 'Animals & Nature', prompt: 'Name a gemstone.',
    rules: 'Accept any gemstone, precious or semi-precious, cut or raw (diamond, ruby, emerald, sapphire, amethyst, opal, topaz, garnet, jade, turquoise, pearl). Metals such as gold and silver, rocks, and the word "gem" on its own do not count.',
    source: 'Wikidata items that are a gemstone or a kind of one, known in at least 4 languages.', pattern: kindOf('Q83437'), minSignal: 4,
    mustHave: ['Diamond', 'Ruby', 'Emerald', 'Sapphire', 'Amethyst', 'Opal', 'Topaz', 'Garnet', 'Pearl', 'Jade', 'Turquoise', 'Aquamarine', 'Peridot', 'Citrine', 'Moonstone', 'Onyx', 'Lapis lazuli', 'Tourmaline', 'Zircon', 'Tanzanite', 'Agate', 'Jasper', 'Amber', 'Obsidian', 'Bloodstone', 'Alexandrite', 'Spinel', 'Quartz', 'Rose quartz', 'Tiger eye', 'Malachite', 'Carnelian', 'Cat\'s eye', 'Beryl', 'Morganite', 'Kunzite', 'Rhodonite', 'Sunstone', 'Labradorite', 'Jet'],
    skip: nameIs(/^(cabochon|brilliant|bi|nanodiamonds?|detonation nanodiamond|Aggregated diamond nanorod|yttrium aluminium garnet|synthetic diamond|rough diamond|ballas|He Shi Bi)$/i),
  },

  // ================================================================ Food
  {
    id: 'food-sauce', category: 'Food', prompt: 'Name a sauce or condiment.',
    rules: 'Accept any sauce, dressing, dip or condiment used to flavour food, from any cuisine (ketchup, mayonnaise, soy sauce, pesto, hollandaise, sriracha, salsa, gravy, tartar sauce). Whole dishes, soups, spices on their own and the word "sauce" on its own do not count.',
    source: 'Wikidata items that are a sauce or a kind of one, known in at least 3 languages.', pattern: kindOf('Q178359'), minSignal: 3,
    mustHave: ['Ketchup', 'Mayonnaise', 'Mustard', 'Soy sauce', 'Hot sauce', 'Barbecue sauce', 'Tomato sauce', 'Pesto', 'Hollandaise sauce', 'Tartar sauce', 'Worcestershire sauce', 'Teriyaki', 'Sriracha', 'Salsa', 'Gravy', 'Béchamel sauce', 'Aioli', 'Ranch dressing', 'Chimichurri', 'Hoisin sauce', 'Oyster sauce', 'Fish sauce', 'Tabasco sauce', 'Alfredo sauce', 'Bolognese sauce', 'Marinara sauce', 'Béarnaise sauce', 'Cranberry sauce', 'Apple sauce', 'Chili sauce', 'Sweet and sour sauce', 'Tzatziki', 'Hummus', 'Satay sauce', 'Vinaigrette', 'Caesar dressing', 'Guacamole', 'Mole', 'Wasabi', 'Horseradish'],
    skip: nameIs(/^(ghee|clarified butter|roux|dip|Chateaubriand steak)$/i),
    rename: ['Sriracha'],
  },
  {
    id: 'food-beer-brand', category: 'Food', prompt: 'Name a beer brand.',
    rules: 'Accept any brand of beer, lager, ale or stout from any country (Heineken, Budweiser, Guinness, Corona, Carlsberg, Stella Artois, Asahi, Tsingtao, Kingfisher, Peroni). Breweries named only as a company, other drinks, and the word "beer" on its own do not count.',
    source: 'Wikidata items that are a brand of beer, known in at least 3 languages.', pattern: '?item wdt:P31 wd:Q15075508 .', minSignal: 3, alsoWritten: strip(/ (beer|lager|Brewery|Brewing Company|Brauerei)$/i),
    mustHave: ['Budweiser', 'Heineken', 'Corona', 'Guinness', 'Stella Artois', 'Carlsberg', 'Coors', 'Miller', 'Bud Light', 'Asahi', 'Tsingtao', 'Kirin', 'Sapporo', 'Tiger', 'Peroni', "Beck's", 'Leffe', 'Hoegaarden', "Foster's", 'Modelo', 'Pabst Blue Ribbon', 'Michelob', 'Samuel Adams', 'Sierra Nevada', 'Singha', 'Chang', 'San Miguel', 'Efes', 'Kingfisher', 'Castle', 'Amstel', 'Grolsch', 'Löwenbräu', 'Paulaner', 'Erdinger', 'Warsteiner', 'Bitburger', "Tennent's", 'Newcastle Brown Ale', 'Boddingtons', 'Kilkenny', 'Harp', 'Yuengling', 'Labatt', 'Molson', 'Pilsner Urquell', 'Staropramen', 'Kronenbourg', 'Red Stripe', 'Quilmes', 'Brahma', 'Skol', 'Tecate', 'Dos Equis', 'Pacifico'],
  },
  {
    id: 'food-tea', category: 'Food', prompt: 'Name a type of tea.',
    rules: 'Accept any kind or blend of tea or herbal tea (green tea, black tea, Earl Grey, chai, matcha, oolong, jasmine tea, chamomile, Darjeeling, rooibos, bubble tea). Coffee, soft drinks and the word "tea" on its own do not count.',
    source: 'Wikidata items that are a kind of tea, known in at least 3 languages.', pattern: kindOf('Q6097'), minSignal: 3,
    mustHave: ['Green tea', 'Black tea', 'Earl Grey tea', 'Masala chai', 'Matcha', 'Oolong', 'White tea', 'Jasmine tea', 'Herbal tea', 'Chamomile tea', 'Peppermint tea', 'English breakfast tea', 'Darjeeling tea', 'Assam tea', 'Ceylon tea', 'Lapsang souchong', 'Pu-erh tea', 'Rooibos', 'Iced tea', 'Bubble tea', 'Yerba mate', 'Sencha', 'Genmaicha', 'Hojicha', 'Gunpowder tea', 'Tieguanyin', 'Longjing tea', 'Milk tea', 'Thai tea', 'Hibiscus tea', 'Ginger tea', 'Barley tea', 'Butter tea', 'Lady Grey', 'Kombucha', 'Mint tea', 'Lemon tea', 'Fruit tea', 'Chai', 'Moroccan mint tea'],
  },
  {
    id: 'food-indian-dish', category: 'Food', prompt: 'Name an Indian dish.',
    rules: 'Accept any dish, snack, bread or sweet from Indian cuisine (butter chicken, biryani, samosa, naan, dal, tandoori chicken, masala dosa, palak paneer, gulab jamun). Chinese or Western food, drinks, and spices on their own do not count.',
    source: 'Wikidata dishes that belong to Indian cuisine or come from India, known in at least 3 languages.', pattern: CUISINE('Q192087', 'Q668'), minSignal: 3,
    mustHave: ['Butter chicken', 'Biryani', 'Samosa', 'Naan', 'Dal', 'Tandoori chicken', 'Masala dosa', 'Palak paneer', 'Gulab jamun', 'Chicken tikka masala', 'Paneer tikka', 'Rogan josh', 'Vindaloo', 'Korma', 'Chana masala', 'Aloo gobi', 'Dosa', 'Idli', 'Vada', 'Pani puri', 'Pav bhaji', 'Raita', 'Roti', 'Paratha', 'Chapati', 'Jalebi', 'Kheer', 'Lassi', 'Bhaji', 'Pakora', 'Saag paneer', 'Tikka', 'Kulfi', 'Poori', 'Upma', 'Sambar', 'Rasgulla', 'Dhokla', 'Chaat', 'Kebab'],
    skip: nameIs(/cuisine$|^(fish and chips|garam masala)$/i),
  },
  {
    id: 'food-japanese-dish', category: 'Food', prompt: 'Name a Japanese dish.',
    rules: 'Accept any dish, snack or sweet from Japanese cuisine (sushi, ramen, tempura, udon, teriyaki, miso soup, okonomiyaki, takoyaki, mochi, tonkatsu). Chinese or Korean food, drinks, and ingredients on their own do not count.',
    source: 'Wikidata dishes that belong to Japanese cuisine or come from Japan, known in at least 3 languages.', pattern: CUISINE('Q234138', 'Q17'), minSignal: 3,
    mustHave: ['Sushi', 'Ramen', 'Tempura', 'Udon', 'Teriyaki', 'Miso soup', 'Okonomiyaki', 'Takoyaki', 'Mochi', 'Tonkatsu', 'Sashimi', 'Yakitori', 'Soba', 'Gyoza', 'Katsu curry', 'Onigiri', 'Donburi', 'Sukiyaki', 'Shabu-shabu', 'Teppanyaki', 'Edamame', 'Dorayaki', 'Taiyaki', 'Bento', 'Karaage', 'Unagi', 'Nabemono', 'Oden', 'Natto', 'Yakisoba', 'Tamagoyaki', 'Chawanmushi', 'Wagashi', 'Dango', 'Katsudon', 'Gyudon', 'Omurice', 'Kaiseki', 'Maki'],
    skip: nameIs(/cuisine$|^(tofu|soy sauce|miso|congee|izakaya|kinako)$/i),
  },

  // ================================================================ Games
  {
    id: 'games-rpg', category: 'Games', prompt: 'Name a role-playing video game.',
    rules: 'Accept any role-playing video game (RPG), of any kind: action RPG, Japanese RPG, tactical RPG or online RPG (The Witcher 3, Skyrim, Final Fantasy VII, Dark Souls, Pokémon Red, Baldur\'s Gate 3, Persona 5, World of Warcraft). Games from other genres, board game RPGs and whole series on their own do not count.',
    source: 'Wikidata video games whose genre is role-playing video game or a kind of one, known in at least 8 languages.',
    pattern: '?item wdt:P31 wd:Q7889 . ?item wdt:P136/wdt:P279* wd:Q744038 .', minSignal: 8,
    mustHave: ['The Witcher 3: Wild Hunt', 'The Elder Scrolls V: Skyrim', 'Final Fantasy VII', 'Dark Souls', 'Pokémon Red and Blue', "Baldur's Gate 3", 'Persona 5', 'World of Warcraft', 'Elden Ring', 'Mass Effect', 'Fallout 4', 'Fallout 3', 'Diablo II', 'Diablo III', 'Dragon Age: Origins', 'Chrono Trigger', 'Kingdom Hearts', 'Cyberpunk 2077', 'Genshin Impact', 'Undertale', 'Final Fantasy X', 'Final Fantasy VI', 'Dragon Quest XI', 'The Elder Scrolls IV: Oblivion', 'The Elder Scrolls III: Morrowind', 'Star Wars: Knights of the Old Republic', "Baldur's Gate", 'EarthBound', 'Disco Elysium', 'Divinity: Original Sin 2', 'Fable', 'Xenoblade Chronicles', 'Path of Exile', 'Octopath Traveler', 'Bloodborne', 'Sekiro: Shadows Die Twice', 'Skyrim', 'Pokémon Gold and Silver', 'Final Fantasy XIV', 'Monster Hunter: World'],
  },
  {
    id: 'games-fps', category: 'Games', prompt: 'Name a first-person shooter game.',
    rules: 'Accept any first-person shooter video game, old or new (Doom, Halo, Call of Duty, Counter-Strike, Half-Life, Quake, Battlefield, Overwatch, Valorant, Borderlands, BioShock). Third-person shooters, other genres and whole series on their own do not count.',
    source: 'Wikidata video games whose genre is first-person shooter or a kind of one, known in at least 8 languages.',
    pattern: '?item wdt:P31 wd:Q7889 . ?item wdt:P136/wdt:P279* wd:Q185029 .', minSignal: 8,
    mustHave: ['Doom', 'Halo: Combat Evolved', 'Call of Duty: Modern Warfare', 'Counter-Strike', 'Half-Life 2', 'Quake', 'Battlefield 1942', 'Overwatch', 'Valorant', 'Borderlands 2', 'BioShock', 'Far Cry 3', 'Titanfall 2', 'Apex Legends', 'GoldenEye 007', 'Wolfenstein 3D', 'Team Fortress 2', 'Destiny 2', 'Crysis', 'Left 4 Dead', 'Portal', 'Metroid Prime', 'Rainbow Six Siege', 'Medal of Honor', 'Unreal Tournament', 'Duke Nukem 3D', 'Serious Sam', 'Halo 3', 'Halo 2', 'Call of Duty 4: Modern Warfare', 'Call of Duty: Black Ops', 'Half-Life', 'Doom Eternal', 'Counter-Strike: Global Offensive', 'Killzone 2', 'S.T.A.L.K.E.R.: Shadow of Chernobyl', 'Prey', 'Deus Ex', 'System Shock', 'Resistance: Fall of Man'],
  },
  {
    id: 'games-fighting', category: 'Games', prompt: 'Name a fighting game.',
    rules: 'Accept any fighting video game, old or new (Street Fighter II, Mortal Kombat, Tekken 3, Super Smash Bros., Soulcalibur, Virtua Fighter, Killer Instinct, Dead or Alive, The King of Fighters). Beat-em-ups such as Streets of Rage, other genres and whole series on their own do not count.',
    source: 'Wikidata video games whose genre is fighting game (hack-and-slash and beat-em-up games left out), known in at least 6 languages.',
    pattern: '?item wdt:P31 wd:Q7889 . ?item wdt:P136 wd:Q846224 .', minSignal: 6,
    mustHave: ['Street Fighter II', 'Mortal Kombat', 'Tekken 3', 'Super Smash Bros.', 'Soulcalibur', 'Virtua Fighter', 'Killer Instinct', 'Dead or Alive', 'The King of Fighters', 'Street Fighter V', 'Street Fighter 6', 'Mortal Kombat 11', 'Tekken 7', 'Super Smash Bros. Ultimate', 'Super Smash Bros. Melee', 'Marvel vs. Capcom 2', 'Guilty Gear', 'Injustice: Gods Among Us', 'Fatal Fury', 'Samurai Shodown', 'Bloody Roar', 'Brawlhalla', 'Street Fighter Alpha', 'Mortal Kombat II', 'Tekken Tag Tournament', 'Soulcalibur II', 'Virtua Fighter 2', 'Mortal Kombat X', 'Street Fighter III', 'BlazBlue', 'Dragon Ball FighterZ', 'Power Stone', 'Rival Schools', 'Primal Rage', 'Tekken 2', 'Street Fighter IV', 'Super Street Fighter II Turbo', 'Darkstalkers', 'Skullgirls', 'Under Night In-Birth'],
  },
  {
    id: 'games-mobile', category: 'Games', prompt: 'Name a mobile game.',
    rules: 'Accept any video game made for phones and tablets, free or paid (Candy Crush Saga, Angry Birds, Flappy Bird, Pokémon Go, Clash of Clans, Subway Surfers, Among Us, Genshin Impact, Fruit Ninja). Console and PC games that merely have a mobile version, and app stores, do not count.',
    source: 'Wikidata video games released for Android or iOS and not for PCs or consoles, known in at least 8 languages.',
    pattern: '?item wdt:P31 wd:Q7889 . ?item wdt:P400 ?platform . VALUES ?platform { wd:Q94 wd:Q48493 } FILTER NOT EXISTS { ?item wdt:P400 ?desk . VALUES ?desk { wd:Q1406 wd:Q14116 wd:Q388 wd:Q5014725 wd:Q19610114 wd:Q10683 wd:Q10680 wd:Q48263 wd:Q63184502 wd:Q13361286 } } .', minSignal: 8,
    mustHave: ['Candy Crush Saga', 'Angry Birds', 'Flappy Bird', 'Pokémon Go', 'Clash of Clans', 'Subway Surfers', 'Temple Run', 'Fruit Ninja', 'Among Us', 'Genshin Impact', 'Monument Valley', 'Clash Royale', 'PUBG Mobile', 'Garena Free Fire', 'Honor of Kings', 'Roblox', 'Minecraft', 'Plants vs. Zombies', 'Cut the Rope', 'Words with Friends', '2048', 'Doodle Jump', 'Crossy Road', 'Asphalt 9: Legends', 'Mobile Legends: Bang Bang', 'Call of Duty: Mobile', 'Fortnite', 'Brawl Stars', 'Hay Day', 'FarmVille', 'Draw Something', 'Piano Tiles', 'Hill Climb Racing', "Alto's Adventure", 'Pou', 'My Talking Tom', 'Homescapes', 'Gardenscapes', 'Royal Match', 'Coin Master'],
  },

  // ================================================================ History & Mythology
  {
    id: 'history-pope', category: 'History & Mythology', prompt: 'Name a pope.',
    rules: 'Accept any real pope of the Catholic Church, from the first centuries to today (Pope Francis, John Paul II, Benedict XVI, Pius XII, Gregory the Great, Urban II, Leo X, Alexander VI, Leo XIV), by their papal name, with or without "Pope". Antipopes, cardinals, saints who were never pope and patriarchs of other churches do not count.',
    source: 'People in Wikidata who held the position of pope, known in at least 8 languages.',
    pattern: heldPosition('Q19546') + HUMAN, minSignal: 8, alsoWritten: (n) => [...strip(/^Pope /)(n), ...strip(/ (I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI)$/)(n.replace(/^Pope /, ''))],
    mustHave: ['Pope Francis', 'John Paul II', 'Benedict XVI', 'Pius XII', 'John XXIII', 'Paul VI', 'Leo XIII', 'Gregory I', 'Urban II', 'Pius IX', 'Leo X', 'Alexander VI', 'Julius II', 'Innocent III', 'Leo XIV', 'John Paul I', 'Pius X', 'Pius XI', 'Gregory VII', 'Clement VII', 'Sixtus IV', 'Boniface VIII', 'Nicholas V', 'Leo I', 'Gregory XIII', 'Urban VIII', 'Pius V', 'Paul III', 'Benedict XV', 'Celestine V', 'Innocent X', 'Clement XIV', 'Pius VII', 'Adrian IV', 'Sylvester II', 'Formosus', 'Stephen VI', 'Linus', 'Pius XII'],
  },
  {
    id: 'history-empire', category: 'History & Mythology', prompt: 'Name an empire.',
    rules: 'Accept any historical or colonial empire (Roman Empire, British Empire, Ottoman Empire, Mongol Empire, Byzantine Empire, Aztec Empire, Inca Empire, Mughal Empire, Persian Empire, Holy Roman Empire), with or without "Empire". Modern countries, single dynasties named only as a house, and fictional empires such as the Galactic Empire do not count.',
    source: 'Wikidata items that are an empire, or a historical country with "Empire" in its name, known in at least 12 languages.', pattern: '{ { ?item wdt:P31/wdt:P279* wd:Q48349 } UNION { ?item wdt:P279+ wd:Q48349 } } UNION { ?item wdt:P31 wd:Q3024240 . ?item rdfs:label ?empireLabel FILTER(LANG(?empireLabel) = "en" && CONTAINS(STR(?empireLabel), "Empire")) } .', minSignal: 12, alsoWritten: strip(/ Empire$/),
    mustHave: ['Roman Empire', 'British Empire', 'Ottoman Empire', 'Mongol Empire', 'Byzantine Empire', 'Achaemenid Empire', 'Holy Roman Empire', 'Russian Empire', 'Aztec Empire', 'Inca Empire', 'Mughal Empire', 'Austro-Hungarian Empire', 'French colonial empire', 'German Empire', 'Spanish Empire', 'Portuguese Empire', 'Empire of Japan', 'Carolingian Empire', 'Maurya Empire', 'Gupta Empire', 'Songhai Empire', 'Mali Empire', 'Khmer Empire', 'Sasanian Empire', 'Parthian Empire', 'Seleucid Empire', 'Neo-Assyrian Empire', 'Neo-Babylonian Empire', 'Akkadian Empire', 'First French Empire', 'Dutch Empire', 'Empire of Brazil', 'Ethiopian Empire', 'Macedonian Empire', 'Ghana Empire', 'Mauryan Empire', 'Timurid Empire', 'Ming dynasty', 'Qing dynasty', 'Han dynasty'],
    skip: anyOf(nameIs(/^(colonial empire|global empire|Soviet empire|German Empire of 1848\/1849|Byzantine Empire under the Palaiologos dynasty)$/i), nameIs(/^hydraulic empire$/i)),
  },
  {
    id: 'history-treaty', category: 'History & Mythology', prompt: 'Name a treaty or peace agreement.',
    rules: 'Accept any historical treaty, peace settlement or international agreement (Treaty of Versailles, Treaty of Tordesillas, Peace of Westphalia, Treaty of Waitangi, Treaty of Rome, Maastricht Treaty, Paris Agreement, Camp David Accords, Treaty of Paris, Kyoto Protocol), with or without "Treaty of". Laws, wars, ceasefires with no treaty and the word "treaty" on its own do not count.',
    source: 'Wikidata items that are a treaty or a kind of one, known in at least 8 languages.', pattern: kindOf('Q131569'), minSignal: 8, alsoWritten: strip(/^Treaty of /),
    mustHave: ['Treaty of Versailles', 'Treaty of Tordesillas', 'Peace of Westphalia', 'Treaty of Waitangi', 'Treaty of Rome', 'Maastricht Treaty', 'Treaty of Lisbon', 'Paris Agreement', 'Camp David Accords', 'Treaty of Paris', 'Kyoto Protocol', 'Treaty of Utrecht', 'Treaty of Ghent', 'Treaty of Brest-Litovsk', 'Treaty of Trianon', 'Treaty of Nanking', 'Treaty of Verdun', 'Convention of Kanagawa', 'Treaty of Guadalupe Hidalgo', 'Treaty of Sèvres', 'Treaty of Lausanne', 'Treaty of Portsmouth', 'Treaty of Amiens', 'Warsaw Pact', 'North Atlantic Treaty', 'Treaty of Tilsit', 'Treaty of Fontainebleau', 'Treaty of Frankfurt', 'Treaty of Berlin', 'Treaty of Union', 'Anglo-Irish Treaty', 'Good Friday Agreement', 'Oslo Accords', 'Treaty of Nonproliferation', 'Munich Agreement', 'Molotov–Ribbentrop Pact', 'Treaty of Saint-Germain-en-Laye', 'Treaty of Neuilly', 'Louisiana Purchase', 'Treaty of Kadesh'],
  },
  {
    id: 'history-revolution', category: 'History & Mythology', prompt: 'Name a revolution.',
    rules: 'Accept any revolution, political or social, successful or not (French Revolution, American Revolution, Russian Revolution, Cuban Revolution, Industrial Revolution, Glorious Revolution, Iranian Revolution, Velvet Revolution, Haitian Revolution), with or without "Revolution". Wars of independence named only as wars, coups and the word "revolution" on its own do not count.',
    source: 'Wikidata items that are a revolution or a kind of one, known in at least 8 languages.', pattern: kindOf('Q10931'), minSignal: 8, alsoWritten: strip(/ Revolution$/),
    mustHave: ['French Revolution', 'American Revolution', 'Russian Revolution', 'Industrial Revolution', 'Cuban Revolution', 'Haitian Revolution', 'Glorious Revolution', 'Iranian Revolution', 'Velvet Revolution', 'October Revolution', 'February Revolution', 'Mexican Revolution', 'Orange Revolution', 'Rose Revolution', 'Cultural Revolution', 'Xinhai Revolution', 'Carnation Revolution', 'Singing Revolution', 'Sexual revolution', 'Arab Spring', 'Agricultural Revolution', 'Digital revolution', 'Scientific Revolution', 'Green Revolution', 'July Revolution', 'Revolutions of 1848', 'Egyptian revolution of 2011', 'Tunisian Revolution', 'Bolshevik Revolution', 'Spanish Revolution', 'Hungarian Revolution of 1956', 'Meiji Restoration', 'Bloodless Revolution', 'Saffron Revolution'],
  },
  {
    id: 'history-ethnic-group', category: 'History & Mythology', prompt: 'Name an ethnic group or a people.',
    rules: 'Accept any ethnic group, nation or people, ancient or modern (Han Chinese, Arabs, Maori, Zulu, Vikings, Celts, Inuit, Navajo, Slavs, Kurds, Romani, Aboriginal Australians, Basques), by the usual English name. Countries named only as countries, religions, languages and the word "people" on its own do not count.',
    source: 'Wikidata items that are an ethnic group (not religious bodies), known in at least 12 languages.', pattern: '?item wdt:P31 wd:Q41710 .', minSignal: 12,
    mustHave: ['Han Chinese', 'Arabs', 'Jews', 'Slavs', 'Germans', 'French people', 'English people', 'Irish people', 'Scottish people', 'Italians', 'Japanese people', 'Koreans', 'Persians', 'Turkish people', 'Kurds', 'Romani people', 'Māori people', 'Aboriginal Australians', 'Inuit', 'Navajo', 'Cherokee', 'Sioux', 'Zulu people', 'Yoruba people', 'Igbo people', 'Hausa people', 'Pashtuns', 'Bengalis', 'Tamils', 'Punjabis', 'Tibetans', 'Uyghurs', 'Vikings', 'Celts', 'Gauls', 'Franks', 'Basques', 'Catalans', 'Ashkenazi Jews', 'Apache'],
    skip: nameIs(/^race$|^history of |^Jews (in|of) /i),
  },

  // ================================================================ Places
  {
    id: 'places-sea', category: 'Places', prompt: 'Name an ocean, sea, bay or gulf.',
    rules: 'Accept any named ocean, sea, bay, gulf or similar large stretch of salt water (Pacific Ocean, Mediterranean Sea, Caribbean Sea, Gulf of Mexico, Hudson Bay, Bay of Bengal, Persian Gulf, North Sea, Sargasso Sea), with or without "Sea" or "Ocean". Lakes, rivers, straits, harbours and fictional seas do not count.',
    source: 'Wikidata items that are an ocean, sea, bay or gulf, or a kind of one, known in at least 12 languages.', pattern: anyKind('Q165', 'Q9430', 'Q39594', 'Q1322134'), minSignal: 12, alsoWritten: strip(/ (Sea|Ocean)$/),
    mustHave: ['Pacific Ocean', 'Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Southern Ocean', 'Mediterranean Sea', 'Caribbean Sea', 'Red Sea', 'Black Sea', 'Baltic Sea', 'North Sea', 'South China Sea', 'Caspian Sea', 'Arabian Sea', 'Sea of Japan', 'Bay of Bengal', 'Gulf of Mexico', 'Persian Gulf', 'Adriatic Sea', 'Aegean Sea', 'Tasman Sea', 'Coral Sea', 'Bering Sea', 'Sargasso Sea', 'Hudson Bay', 'Bay of Biscay', 'Gulf of Aden', 'Ionian Sea', 'Yellow Sea', 'East China Sea', 'Philippine Sea', 'Barents Sea', 'Weddell Sea', 'Ross Sea', 'Irish Sea', 'Celtic Sea', 'Gulf of California', 'Gulf of Guinea', 'Bay of Fundy', 'San Francisco Bay'],
    skip: anyOf(nameIs(/^(port|lagoon|harbou?r|bay|gulf|sea|ocean|Malmö|Portus|Old Siraf Port|Kerala backwaters)$|^Port of /i), nameIs(/\bPort$|Treaty Port|Naval Base/i)),
  },
  {
    id: 'places-theme-park', category: 'Places', prompt: 'Name a theme park or amusement park.',
    rules: 'Accept any theme park or amusement park anywhere in the world (Disneyland, Walt Disney World, Universal Studios, Six Flags, Cedar Point, Europa-Park, Tivoli Gardens, Legoland, Efteling, Alton Towers), with or without the owner\'s name. Single rides, zoos, water parks with no rides, and fairs do not count.',
    source: 'Wikidata items that are an amusement park or a kind of one, known in at least 6 languages.', pattern: kindOf('Q194195'), minSignal: 6,
    mustHave: ['Disneyland', 'Walt Disney World', 'Universal Studios Hollywood', 'Six Flags Magic Mountain', 'Cedar Point', 'Europa-Park', 'Tivoli Gardens', 'Legoland Billund', 'Efteling', 'Disneyland Paris', 'Tokyo Disneyland', 'Universal Studios Japan', 'Busch Gardens Tampa Bay', 'SeaWorld Orlando', "Knott's Berry Farm", 'Alton Towers', 'Gardaland', 'Phantasialand', 'Ocean Park Hong Kong', 'Everland', 'Lotte World', 'Dollywood', 'Hersheypark', 'Magic Kingdom', 'Epcot', "Disney's Hollywood Studios", "Disney's Animal Kingdom", 'Coney Island', 'Blackpool Pleasure Beach', 'Thorpe Park', 'Chessington World of Adventures', 'PortAventura Park', 'Parc Astérix', 'Ferrari World', 'Chimelong Ocean Kingdom', 'Hong Kong Disneyland', 'Shanghai Disneyland', 'Universal Studios Singapore', 'Universal Orlando Resort', 'Islands of Adventure'],
    skip: nameIs(/^(water park|Gorky Park|Koningin Juliana Toren|Gobindgarh Fort|Belle Vue Zoological Gardens|City of Space)$/i),
    rename: ['Blackpool Pleasure Beach', 'Busch Gardens Tampa Bay', 'Ferrari World', 'Shanghai Disneyland', 'Islands of Adventure'],
  },
  {
    id: 'places-cathedral', category: 'Places', prompt: 'Name a cathedral or great church.',
    rules: 'Accept any cathedral, basilica or great church anywhere in the world (Notre-Dame de Paris, St Peter\'s Basilica, Cologne Cathedral, Sagrada Família, St Paul\'s Cathedral, Westminster Abbey, Canterbury Cathedral, Milan Cathedral, Saint Basil\'s Cathedral), with or without "Cathedral" or "Basilica". Ordinary parish churches, mosques and temples do not count.',
    source: 'Wikidata items that are a cathedral, a basilica or an abbey, or a kind of one, known in at least 20 languages.', pattern: anyKind('Q2977', 'Q163687', 'Q160742'), minSignal: 20, alsoWritten: strip(/ (Cathedral|Basilica|Abbey)$/),
    mustHave: ['Notre-Dame de Paris', "St. Peter's Basilica", 'Cologne Cathedral', 'Sagrada Família', "St Paul's Cathedral", 'Westminster Abbey', 'Canterbury Cathedral', 'Milan Cathedral', "Saint Basil's Cathedral", 'Florence Cathedral', 'Chartres Cathedral', 'Reims Cathedral', 'Seville Cathedral', 'Salisbury Cathedral', 'Washington National Cathedral', "St. Patrick's Cathedral", 'Hagia Sophia', 'Sacré-Cœur', "St Mark's Basilica", 'York Minster', 'Durham Cathedral', 'Ely Cathedral', 'Lincoln Cathedral', 'Winchester Cathedral', 'Strasbourg Cathedral', 'Burgos Cathedral', 'Santiago de Compostela Cathedral', 'Pisa Cathedral', 'St. Stephen\'s Cathedral', 'Cathedral of Christ the Saviour', 'Church of the Holy Sepulchre', 'Basilica of Our Lady of Guadalupe', 'Aachen Cathedral', 'Ulm Minster', 'St. Vitus Cathedral', 'Mont-Saint-Michel Abbey', 'Basilica of Saint-Denis', 'Wells Cathedral', 'Gloucester Cathedral', 'Exeter Cathedral'],
    rename: ['Sagrada Família', 'Chartres Cathedral', 'Strasbourg Cathedral'],
  },
  {
    id: 'places-palace', category: 'Places', prompt: 'Name a palace.',
    rules: 'Accept any palace anywhere in the world, royal, imperial or official (Buckingham Palace, Palace of Versailles, Forbidden City, Alhambra, Schönbrunn Palace, Winter Palace, Topkapı Palace, Palace of Westminster, Potala Palace, Kensington Palace). Castles, fortresses, mansions that were never a palace and fictional palaces do not count.',
    source: 'Wikidata items that are a palace or a kind of one, known in at least 15 languages.', pattern: kindOf('Q16560'), minSignal: 15, alsoWritten: strip(/ Palace$/),
    mustHave: ['Buckingham Palace', 'Palace of Versailles', 'Forbidden City', 'Alhambra', 'Schönbrunn Palace', 'Winter Palace', 'Topkapı Palace', 'Palace of Westminster', 'Potala Palace', 'Kensington Palace', 'Palace of Fontainebleau', 'Louvre Palace', 'Hofburg Palace', 'Royal Palace of Madrid', 'Mysore Palace', 'Peterhof Palace', 'Catherine Palace', 'Grand Palace', 'Dolmabahçe Palace', 'Summer Palace', 'Palazzo Pitti', "Doge's Palace", 'Sanssouci', 'Blenheim Palace', 'Hampton Court Palace', 'Palace of Knossos', 'Palace of Holyroodhouse', 'Royal Palace of Amsterdam', 'Quirinal Palace', 'Palais Garnier', 'Imperial Palace, Tokyo', 'Gyeongbokgung', 'Palace of Culture and Science', 'Rashtrapati Bhavan', 'City Palace, Jaipur', 'Palace of Fine Arts', 'Linderhof Palace'],
    skip: nameIs(/Castle$|Château|Fort$|^(White House|Uffizi Gallery|Kafes|Amber Fort)$/i),
    rename: ['Sanssouci', 'Palace of Holyroodhouse'],
  },
  {
    id: 'places-street', category: 'Places', prompt: 'Name a famous street or square.',
    rules: 'Accept any famous street, avenue, boulevard, road or public square anywhere in the world (Times Square, Champs-Élysées, Wall Street, Fifth Avenue, Abbey Road, Downing Street, Red Square, Trafalgar Square, Las Ramblas, Broadway). Whole districts, bridges, roads known only by a number and fictional streets do not count.',
    source: 'Wikidata items that are a street or a town square, or a kind of either, known in at least 15 languages.', pattern: anyKind('Q79007', 'Q174782'), minSignal: 15,
    mustHave: ['Times Square', 'Champs-Élysées', 'Wall Street', 'Fifth Avenue', 'Broadway', 'Abbey Road', 'Downing Street', 'Red Square', 'Trafalgar Square', 'Oxford Street', 'Piccadilly Circus', "St. Mark's Square", 'Tiananmen Square', 'Lombard Street', 'Hollywood Boulevard', 'Rodeo Drive', 'La Rambla', 'Nevsky Prospect', 'Las Vegas Strip', 'Bourbon Street', 'Pennsylvania Avenue', 'Park Avenue', 'Madison Avenue', 'Baker Street', 'Regent Street', 'Carnaby Street', 'Via Appia', 'Unter den Linden', 'Kurfürstendamm', 'Royal Mile', 'Ginza', 'Rue de Rivoli', 'Place de la Concorde', 'Grafton Street', 'Orchard Road', 'Nathan Road', 'Beale Street', 'Haight-Ashbury'],
    skip: anyOf(nameIs(/^(Al-Aqsa Mosque|Roman Forum|Charles Bridge|Akihabara|Nymphenburg Palace|boulevard|street|avenue|square|Loschwitz Bridge|Blue Bridge|Naschmarkt|Nieuwmarkt)$/i), nameIs(/Autostrada|motorway|^forum$/i)),
    rename: ['Champs-Élysées'],
  },

  // ================================================================ Science & Technology
  {
    id: 'science-chemical-element', category: 'Science & Technology', prompt: 'Name a chemical element.',
    rules: 'Accept any of the 118 chemical elements by its English name, its symbol, or the other spelling (hydrogen, oxygen, gold, iron, helium, uranium, carbon, "Fe", aluminium or aluminum, sulfur or sulphur). Compounds such as water or salt, alloys such as steel and bronze, isotopes and fictional elements do not count.',
    source: 'Wikidata items that are a chemical element.', pattern: '?item wdt:P31 wd:Q11344 .', minSignal: 0, codeProp: 'P246',
    extraAliases: { Aluminium: ['Aluminum'], Sulfur: ['Sulphur'], Caesium: ['Cesium'] },
    mustHave: ['Hydrogen', 'Oxygen', 'Carbon', 'Gold', 'Silver', 'Iron', 'Helium', 'Nitrogen', 'Sodium', 'Calcium', 'Uranium', 'Lead', 'Copper', 'Mercury', 'Zinc', 'Aluminium', 'Neon', 'Chlorine', 'Potassium', 'Silicon', 'Sulfur', 'Tin', 'Platinum', 'Titanium', 'Lithium', 'Plutonium', 'Radium', 'Argon', 'Iodine', 'Magnesium', 'Nickel', 'Cobalt', 'Chromium', 'Phosphorus', 'Fluorine', 'Boron', 'Tungsten', 'Arsenic', 'Krypton', 'Xenon', 'Radon', 'Oganesson'],
    skip: nameIs(/^un[a-z]*ium$/i), // placeholder names of elements nobody has made yet (unquadpentium ...)
  },
  {
    id: 'science-moon', category: 'Science & Technology', prompt: 'Name a moon.',
    rules: 'Accept any natural satellite of a planet or dwarf planet in our solar system (the Moon, Titan, Europa, Ganymede, Io, Callisto, Phobos, Deimos, Triton, Enceladus, Charon, Miranda). Planets, stars, asteroids with no moon status, artificial satellites and fictional moons (Endor, Pandora in Avatar) do not count.',
    source: 'Wikidata items that are a natural satellite or a kind of one, known in at least 8 languages.', pattern: kindOf('Q2537'), minSignal: 8,
    mustHave: ['Moon', 'Titan', 'Europa', 'Ganymede', 'Io', 'Callisto', 'Phobos', 'Deimos', 'Triton', 'Enceladus', 'Charon', 'Miranda', 'Mimas', 'Titania', 'Oberon', 'Ariel', 'Umbriel', 'Rhea', 'Iapetus', 'Dione', 'Tethys', 'Hyperion', 'Phoebe', 'Amalthea', 'Nereid', 'Proteus', 'Puck', 'Himalia', 'Pan', 'Atlas', 'Prometheus', 'Pandora', 'Epimetheus', 'Janus', 'Helene', 'Telesto', 'Calypso', 'Larissa', 'Despina', 'Nix'],
    skip: anyOf(nameIs(/^(moon of .*|Inner moon|Gallic group|Ananke group|Black Knight satellite conspiracy theory|S\/\d{4} .*)$/i), nameIs(/^icy moon$/i)),
  },
  {
    id: 'science-physicist', category: 'Science & Technology', prompt: 'Name a physicist.',
    rules: 'Accept any real physicist, theoretical or experimental, from any period or country (Albert Einstein, Isaac Newton, Stephen Hawking, Richard Feynman, Niels Bohr, Marie Curie, Werner Heisenberg, Erwin Schrödinger, Michael Faraday, Max Planck), by their usual name or surname. Chemists, engineers, inventors and fictional physicists do not count.',
    source: 'People in Wikidata whose occupation is physicist and whose description names physics, known in at least 12 languages.', pattern: occupation('Q169470') + HUMAN, minSignal: 12, alsoWritten: personForms,
    skip: notDescribedAs(/physic|astrophysic|cosmolog/i),
    mustHave: ['Albert Einstein', 'Isaac Newton', 'Stephen Hawking', 'Richard Feynman', 'Niels Bohr', 'Marie Curie', 'Werner Heisenberg', 'Erwin Schrödinger', 'Michael Faraday', 'Max Planck', 'Galileo Galilei', 'J. Robert Oppenheimer', 'Enrico Fermi', 'Paul Dirac', 'Wolfgang Pauli', 'Ernest Rutherford', 'Peter Higgs', 'Roger Penrose', 'Michio Kaku', 'Neil deGrasse Tyson', 'Max Born', 'Ludwig Boltzmann', 'Heinrich Hertz', 'Georg Ohm', 'Lord Kelvin', 'James Prescott Joule', 'André-Marie Ampère', 'Alessandro Volta', 'Wilhelm Röntgen', 'Henri Becquerel', 'J. J. Thomson', 'James Chadwick', 'Lise Meitner', 'Chien-Shiung Wu', 'Murray Gell-Mann', 'Edward Witten', 'Steven Weinberg', 'Hans Bethe', 'Edward Teller', 'Hendrik Lorentz'],
    rename: ['Georg Ohm', 'Lord Kelvin', 'Henri Becquerel', 'J. J. Thomson'],
  },
  {
    id: 'science-application', category: 'Science & Technology', prompt: 'Name a computer program or app.',
    rules: 'Accept any well-known computer program or app, for computers or phones (Microsoft Word, Excel, Photoshop, Google Chrome, Firefox, Zoom, Skype, WhatsApp, Spotify, Notepad, VLC, Slack). Operating systems, programming languages, video games, websites and companies do not count.',
    source: 'Wikidata items that are application software or a kind of it (including web browsers, word processors and messaging apps), known in at least 12 languages.', pattern: kindOf('Q166142'), minSignal: 12,
    mustHave: ['Microsoft Word', 'Microsoft Excel', 'Adobe Photoshop', 'Google Chrome', 'Mozilla Firefox', 'Zoom', 'Skype', 'WhatsApp', 'Spotify', 'Notepad', 'VLC media player', 'Slack', 'Microsoft PowerPoint', 'Microsoft Outlook', 'Safari', 'Microsoft Edge', 'Telegram', 'Signal', 'Dropbox', 'Evernote', 'Adobe Acrobat', 'Adobe Illustrator', 'Final Cut Pro', 'GarageBand', 'Audacity', 'Blender', 'GIMP', 'LibreOffice', 'Google Maps', 'Google Docs', 'Gmail', 'Instagram', 'TikTok', 'Snapchat', 'Discord', 'Steam', 'iTunes', 'Winamp'],
    skip: anyOf(nameIs(/^(email|web browser|mobile app|geographic information system|fish|Ubuntu|Wikipedia:.*|MediaWiki|Wikispecies|Wayback Machine|Internet Archive|Netflix|Classic Visual Basic)$/i), nameIs(/^(word processor|spreadsheet|echo|sleep|Unix shell|alien)$/i)),
  },

  // ================================================================ Movies & TV
  {
    id: 'movies-animated-film', category: 'Movies & TV', prompt: 'Name an animated film.',
    rules: 'Accept any animated feature film from any studio or country (Toy Story, The Lion King, Shrek, Spirited Away, Frozen, Finding Nemo, Despicable Me, Kung Fu Panda, Ice Age, Moana, Coco, Zootopia). Live-action films with some animation, short films, TV series and anime series do not count.',
    source: 'Wikidata items that are an animated film, known in at least 8 languages.', pattern: instanceOf('Q202866'), minSignal: 8,
    mustHave: ['Toy Story', 'The Lion King', 'Shrek', 'Spirited Away', 'Frozen', 'Finding Nemo', 'Despicable Me', 'Kung Fu Panda', 'Ice Age', 'Moana', 'Coco', 'Zootopia', 'Up', 'Inside Out', 'The Incredibles', 'Monsters, Inc.', 'Cars', 'Ratatouille', 'WALL-E', 'Aladdin', 'Beauty and the Beast', 'Snow White and the Seven Dwarfs', 'My Neighbor Totoro', 'Princess Mononoke', "Howl's Moving Castle", 'The Simpsons Movie', 'The Lego Movie', 'Madagascar', 'How to Train Your Dragon', 'Minions', 'Sing', 'The Secret Life of Pets', 'Spider-Man: Into the Spider-Verse', 'Your Name', 'Akira', 'Persepolis', 'The Iron Giant', 'Bambi', 'Finding Dory', 'Encanto'],
  },
  {
    id: 'movies-horror-film', category: 'Movies & TV', prompt: 'Name a horror film.',
    rules: 'Accept any horror film, from any country and period (The Exorcist, Psycho, The Shining, Halloween, Scream, Alien, The Conjuring, Get Out, A Nightmare on Elm Street, Nosferatu, The Ring, Hereditary). Thrillers with no horror, TV series, books and the word "horror" on its own do not count.',
    source: 'Wikidata films whose genre is horror film, known in at least 10 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q11424 . ?item wdt:P136 ?hg . ?hg wdt:P279? wd:Q200092 .', minSignal: 10,
    mustHave: ['The Exorcist', 'Psycho', 'The Shining', 'Halloween', 'Scream', 'Alien', 'The Conjuring', 'Get Out', 'A Nightmare on Elm Street', 'Friday the 13th', 'The Texas Chain Saw Massacre', 'Hereditary', 'Saw', 'Nosferatu', 'Dracula', 'Frankenstein', 'The Ring', 'Insidious', 'Paranormal Activity', 'The Omen', "Rosemary's Baby", 'Poltergeist', 'The Thing', 'Candyman', "Child's Play", 'The Evil Dead', 'Annabelle', 'The Blair Witch Project', 'A Quiet Place', 'Midsommar', 'Us', 'Carrie', 'Final Destination', 'Pet Sematary', 'The Babadook', 'Train to Busan', 'The Grudge', 'Sinister', 'It', 'Jaws'],
    skip: anyOf(nameIs(/^(Apocalypse Now|Gravity|Black Swan|Seven|Memento|Shutter Island|The Terminator|Predator|Donnie Darko|I Am Legend|Mulholland Drive|Blue Velvet|Doctor Strange in the Multiverse of Madness|The Twilight Saga: New Moon)$/i), nameIs(/^(RoboCop|District 9|Hotel Transylvania|The Walking Dead|The Girl on the Train|Coma|Climax)$/i)),
  },
  {
    id: 'movies-sitcom', category: 'Movies & TV', prompt: 'Name a sitcom.',
    rules: 'Accept any situation comedy series from any country (Friends, Seinfeld, The Office, The Big Bang Theory, How I Met Your Mother, Frasier, Cheers, Fawlty Towers, Only Fools and Horses, Parks and Recreation, Brooklyn Nine-Nine). Sketch shows, dramas, talk shows and films do not count.',
    source: 'Wikidata television series whose genre is sitcom, known in at least 8 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q5398426 . ?item wdt:P136/wdt:P279* wd:Q170238 .', minSignal: 8,
    mustHave: ['Friends', 'Seinfeld', 'The Office', 'The Big Bang Theory', 'How I Met Your Mother', 'Frasier', 'Cheers', 'Fawlty Towers', 'Only Fools and Horses', 'Parks and Recreation', 'Brooklyn Nine-Nine', 'Modern Family', 'Arrested Development', 'Community', 'Blackadder', 'Mr. Bean', 'The Simpsons', 'Family Guy', '30 Rock', 'Curb Your Enthusiasm', 'Scrubs', 'Two and a Half Men', 'Everybody Loves Raymond', 'The Fresh Prince of Bel-Air', 'Married... with Children', 'That \'70s Show', 'Malcolm in the Middle', "Schitt's Creek", 'Ted Lasso', "It's Always Sunny in Philadelphia", 'New Girl', 'Last of the Summer Wine', 'Dad\'s Army', 'The IT Crowd', 'Black Books', 'Peep Show', 'Gilligan\'s Island', 'I Love Lucy', 'M*A*S*H', 'Happy Days'],
    skip: nameIs(/^(SpongeBob SquarePants|Rick and Morty|The Flintstones|The Amazing World of Gumball|Johnny Bravo|BoJack Horseman|Disenchantment|Father of the Pride)$/i),
  },
  {
    id: 'movies-animated-series', category: 'Movies & TV', prompt: 'Name an animated TV series.',
    rules: 'Accept any animated television series from any country, for children or adults (The Simpsons, SpongeBob SquarePants, South Park, Family Guy, Rick and Morty, Tom and Jerry, Scooby-Doo, Adventure Time, Futurama, Bluey, Peppa Pig). Animated films, live-action series and anime that are only known as films do not count.',
    source: 'Wikidata items that are an animated television series or a kind of one, known in at least 8 languages.', pattern: anyKind('Q581714', 'Q63952888'), minSignal: 8,
    mustHave: ['The Simpsons', 'SpongeBob SquarePants', 'South Park', 'Family Guy', 'Rick and Morty', 'Tom and Jerry', 'Scooby-Doo', 'Adventure Time', 'Futurama', 'Bluey', 'Peppa Pig', 'The Flintstones', "Bob's Burgers", 'Gravity Falls', 'Avatar: The Last Airbender', 'Teenage Mutant Ninja Turtles', 'He-Man and the Masters of the Universe', 'American Dad!', 'King of the Hill', 'Phineas and Ferb', 'Courage the Cowardly Dog', "Dexter's Laboratory", 'The Powerpuff Girls', 'Ben 10', 'Pokémon', 'Dragon Ball', 'The Jetsons', 'Animaniacs', 'Batman: The Animated Series', 'Arthur', 'Dora the Explorer', "Rugrats", 'Hey Arnold!', 'Daria', 'Beavis and Butt-Head', 'Archer', 'BoJack Horseman', 'Steven Universe', 'Paw Patrol'],
  },
  {
    id: 'movies-got-character', category: 'Movies & TV', prompt: 'Name a character from Game of Thrones.',
    rules: 'Accept any named character from the Game of Thrones television series or the A Song of Ice and Fire books (Jon Snow, Daenerys Targaryen, Tyrion Lannister, Cersei Lannister, Arya Stark, Sansa Stark, Jaime Lannister, Ned Stark, Joffrey, Hodor, Brienne of Tarth). Actors, houses, places and dragons named only as animals do not count.',
    source: 'Wikidata characters filed as a Game of Thrones character or an A Song of Ice and Fire character, known in at least 2 languages.',
    pattern: '{ { ?item wdt:P31 wd:Q20086263 } UNION { ?item wdt:P31 wd:Q20086260 } } .', minSignal: 2,
    mustHave: ['Jon Snow', 'Daenerys Targaryen', 'Tyrion Lannister', 'Cersei Lannister', 'Arya Stark', 'Sansa Stark', 'Jaime Lannister', 'Ned Stark', 'Joffrey Baratheon', 'Hodor', 'Brienne of Tarth', 'Samwell Tarly', 'Petyr Baelish', 'Varys', 'Robb Stark', 'Theon Greyjoy', 'Bran Stark', 'Stannis Baratheon', 'Sandor Clegane', 'Gregor Clegane', 'Melisandre', 'Davos Seaworth', 'Catelyn Stark', 'Khal Drogo', 'Robert Baratheon', 'Tywin Lannister', 'Margaery Tyrell', 'Olenna Tyrell', 'Ygritte', 'Jorah Mormont', 'Tormund', 'Bronn', 'Gendry', 'The Night King', 'Oberyn Martell', 'Ramsay Bolton', 'Roose Bolton', 'Daario Naharis', 'Missandei', 'Shae'],
    rename: ['Ned Stark'],
  },

  // ================================================================ Music
  {
    id: 'music-genre', category: 'Music', prompt: 'Name a genre of music.',
    rules: 'Accept any genre or style of music, broad or narrow, from any country (rock, pop, jazz, hip hop, classical, blues, country, reggae, heavy metal, punk, techno, K-pop, flamenco, bossa nova, dubstep). Instruments, single songs, bands and the word "music" on its own do not count.',
    source: 'Wikidata items that are a music genre, known in at least 12 languages.', pattern: instanceOf('Q188451'), minSignal: 12, alsoWritten: strip(/ music$/i),
    mustHave: ['Rock music', 'Pop music', 'Jazz', 'Hip hop music', 'Classical music', 'Blues', 'Country music', 'Reggae', 'Heavy metal', 'Punk rock', 'Folk music', 'Soul music', 'Rhythm and blues', 'Funk', 'Disco', 'Techno', 'House music', 'Electronic dance music', 'K-pop', 'Salsa', 'Gospel music', 'Ska', 'Grunge', 'Indie rock', 'Bossa nova', 'Flamenco', 'Samba', 'Dubstep', 'Trap', 'Drum and bass', 'Ambient music', 'Synth-pop', 'New wave', 'Hard rock', 'Progressive rock', 'Psychedelic rock', 'Bluegrass', 'Swing', 'Bebop', 'Reggaeton'],
    skip: anyOf(nameIs(/^(opera|symphony|rapping|hymn|adhan|mantra|musical play|lullaby|sonata|psalm|funeral march|ballade|operetta)$/i), nameIs(/^(noh|cantata|oratorio|fugue|piyyut|Hamd|runo song|Henan opera|Tin Pan Alley)$/i)),
    rename: ['Heavy metal', 'Soul music', 'Trap', 'Bluegrass'],
  },
  {
    id: 'music-rapper', category: 'Music', prompt: 'Name a rapper.',
    rules: 'Accept any real rapper or hip hop artist, current or from the past, from any country (Eminem, Jay-Z, Kanye West, Drake, Kendrick Lamar, Snoop Dogg, Tupac Shakur, The Notorious B.I.G., Nas, Nicki Minaj, Cardi B), by their stage name or real name. Singers who never rapped, producers and groups named only as a group do not count.',
    source: 'People in Wikidata whose occupation is rapper and whose description names rap or hip hop, known in at least 8 languages.', pattern: occupation('Q2252262') + HUMAN, minSignal: 8,
    skip: anyOf(notDescribedAs(/rap|hip.?hop/i), nameIs(/^(Lisa|Lucas|Gray)$/)),
    mustHave: ['Eminem', 'Jay-Z', 'Kanye West', 'Drake', 'Kendrick Lamar', 'Snoop Dogg', 'Tupac Shakur', 'The Notorious B.I.G.', 'Nas', '50 Cent', 'Lil Wayne', 'Nicki Minaj', 'Cardi B', 'Travis Scott', 'Post Malone', 'Dr. Dre', 'Ice Cube', 'LL Cool J', 'Lil Nas X', 'Future', 'J. Cole', 'Megan Thee Stallion', 'Tyler, the Creator', 'ASAP Rocky', 'Ludacris', 'Missy Elliott', 'Queen Latifah', 'Lauryn Hill', 'Busta Rhymes', 'Ice-T', 'Flavor Flav', 'Vanilla Ice', 'MC Hammer', 'Coolio', 'Method Man', 'Common', 'Childish Gambino', 'Doja Cat', 'Lil Wayne', 'Wiz Khalifa'],
  },
  {
    id: 'music-vocal-group', category: 'Music', prompt: 'Name a boy band or girl group.',
    rules: 'Accept any pop vocal group of young men or young women, from any country (Backstreet Boys, NSYNC, One Direction, BTS, Spice Girls, Destiny\'s Child, Take That, Blackpink, Little Mix, TLC, New Kids on the Block, Westlife, Girls\' Generation). Rock bands, solo singers, choirs and the words "boy band" on their own do not count.',
    source: 'Wikidata musical groups that are typed as a boy band or a girl group, or play K-pop, known in at least 8 languages.',
    pattern: '{ { ?item wdt:P31 wd:Q216337 } UNION { ?item wdt:P31 wd:Q641066 } UNION { ?item wdt:P31/wdt:P279* wd:Q215380 . ?item wdt:P136 wd:Q213665 } } .', minSignal: 8,
    mustHave: ['Backstreet Boys', 'NSYNC', 'One Direction', 'BTS', 'Spice Girls', "Destiny's Child", 'Take That', 'Blackpink', 'Little Mix', 'TLC', 'New Kids on the Block', 'Westlife', "Girls' Generation", 'Jonas Brothers', 'Boyzone', 'Twice', 'Fifth Harmony', 'The Pussycat Dolls', 'All Saints', 'Atomic Kitten', 'Bananarama', 'The Supremes', 'The Ronettes', 'B*Witched', 'Girls Aloud', 'Jackson 5', '98 Degrees', 'Boyz II Men', 'EXO', 'Big Bang', 'Super Junior', 'Red Velvet', 'Stray Kids', 'Seventeen', 'NCT', 'Monsta X', 'ITZY', 'Wonder Girls', 'Hanson', 'Menudo'],
  },
  {
    id: 'music-guitarist', category: 'Music', prompt: 'Name a guitarist.',
    rules: 'Accept any real guitarist, electric or acoustic, from any country and style (Jimi Hendrix, Eric Clapton, Jimmy Page, Slash, Eddie Van Halen, Brian May, David Gilmour, Carlos Santana, B.B. King, Chuck Berry, Keith Richards, Angus Young), by their usual name. Singers who only strum a little, bassists and bands named only as a band do not count.',
    source: 'People in Wikidata whose occupation is guitarist and whose description names the guitar, known in at least 8 languages.', pattern: occupation('Q855091') + HUMAN, minSignal: 8, alsoWritten: personForms,
    skip: notDescribedAs(/guitar/i),
    mustHave: ['Jimi Hendrix', 'Eric Clapton', 'Jimmy Page', 'Slash', 'Eddie Van Halen', 'Brian May', 'David Gilmour', 'Carlos Santana', 'B.B. King', 'Chuck Berry', 'Keith Richards', 'Angus Young', 'Tom Morello', 'Kurt Cobain', 'Stevie Ray Vaughan', 'Jeff Beck', 'Mark Knopfler', 'Prince', 'John Mayer', 'Joe Satriani', 'Steve Vai', 'Randy Rhoads', 'Les Paul', 'Django Reinhardt', 'Pete Townshend', 'George Harrison', 'The Edge', 'Yngwie Malmsteen', 'Zakk Wylde', 'Jack White', 'Joan Jett', 'Jerry Garcia', 'Duane Allman', 'Dimebag Darrell', 'Kirk Hammett', 'Richie Blackmore', 'Ritchie Blackmore', 'Johnny Marr', 'Nile Rodgers', 'Bo Diddley'],
  },
  {
    id: 'music-abba-song', category: 'Music', prompt: 'Name a song by ABBA.',
    rules: "Accept any song that ABBA recorded and released, including album tracks and songs from the films and musicals (Dancing Queen, Mamma Mia, Waterloo, Fernando, Super Trouper, Gimme! Gimme! Gimme!, Take a Chance on Me, The Winner Takes It All, SOS, Chiquitita), by its title. Albums, musicals, and songs by other artists do not count.",
    source: 'Musical works that Wikidata lists as performed or composed by ABBA.',
    pattern: '{ { ?item wdt:P175 wd:Q18233 } UNION { ?item wdt:P86 wd:Q18233 } } ?item wdt:P31/wdt:P279* wd:Q105543609 .',
    mustHave: ['Dancing Queen', 'Mamma Mia', 'Waterloo', 'Fernando', 'Super Trouper', 'Gimme! Gimme! Gimme! (A Man After Midnight)', 'Take a Chance on Me', 'The Winner Takes It All', 'SOS', 'Chiquitita', 'Money, Money, Money', 'Knowing Me, Knowing You', 'Voulez-Vous', 'I Have a Dream', 'Thank You for the Music', 'Does Your Mother Know', 'Lay All Your Love on Me', 'One of Us', 'Honey, Honey', 'Ring Ring', 'Eagle', 'The Name of the Game', 'Our Last Summer', 'Summer Night City', 'Angeleyes', 'Happy New Year', 'Slipping Through My Fingers', 'When All Is Said and Done', 'Head Over Heels', 'I Do, I Do, I Do, I Do, I Do', 'Hasta Mañana', 'Andante, Andante', 'Under Attack', 'Visitors', 'The Day Before You Came', 'Our Last Summer', 'Dum Dum Diddle', 'Bang-A-Boomerang', 'I Wonder (Departure)', 'Kisses of Fire'],
  },

  // ================================================================ Sports
  {
    id: 'sports-american-football-player', category: 'Sports', prompt: 'Name an American football player.',
    rules: 'Accept any real American football player, professional or college, current or retired (Tom Brady, Patrick Mahomes, Peyton Manning, Joe Montana, Jerry Rice, Lawrence Taylor, Walter Payton, Emmitt Smith, Barry Sanders, Jim Brown), by their usual name or surname. Soccer players, coaches who never played and fictional players do not count.',
    source: 'People in Wikidata whose occupation is American football player and whose description names football, known in at least 8 languages.', pattern: occupation('Q19204627') + HUMAN, minSignal: 8, alsoWritten: personForms,
    skip: notDescribedAs(/football|quarterback|NFL|running back|receiver|linebacker|tight end|lineman|cornerback|punter|kicker/i, /association football|soccer/i),
    mustHave: ['Tom Brady', 'Patrick Mahomes', 'Peyton Manning', 'Joe Montana', 'Jerry Rice', 'Lawrence Taylor', 'Walter Payton', 'Emmitt Smith', 'Barry Sanders', 'Jim Brown', 'Dan Marino', 'John Elway', 'Brett Favre', 'Aaron Rodgers', 'Travis Kelce', 'Randy Moss', 'Terrell Owens', 'Deion Sanders', 'Eli Manning', 'Drew Brees', 'O. J. Simpson', 'Joe Namath', 'Johnny Unitas', 'Tony Romo', 'Colin Kaepernick', 'Russell Wilson', 'Josh Allen', 'Lamar Jackson', 'Jalen Hurts', 'J. J. Watt', 'Aaron Donald', 'Rob Gronkowski', 'Odell Beckham Jr.', 'Ray Lewis', 'Troy Polamalu', 'Reggie White', 'Bo Jackson', 'Michael Vick', 'Cam Newton', 'Terry Bradshaw'],
  },
  {
    id: 'sports-rugby-player', category: 'Sports', prompt: 'Name a rugby player.',
    rules: 'Accept any real rugby union or rugby league player, men\'s or women\'s, current or retired, from any country (Jonah Lomu, Richie McCaw, Jonny Wilkinson, Dan Carter, Brian O\'Driscoll, Martin Johnson, Gareth Edwards, Johnny Sexton, Siya Kolisi, Antoine Dupont), by their usual name or surname. Coaches who never played, American football players and fictional players do not count.',
    source: 'People in Wikidata whose occupation is rugby union player and whose description names rugby, known in at least 8 languages.', pattern: occupation('Q14089670') + HUMAN, minSignal: 8, alsoWritten: personForms,
    skip: notDescribedAs(/rugby/i),
    mustHave: ['Jonah Lomu', 'Richie McCaw', 'Jonny Wilkinson', 'Dan Carter', "Brian O'Driscoll", 'Martin Johnson', 'Sam Warburton', 'Gareth Edwards', 'Johnny Sexton', 'Siya Kolisi', 'François Pienaar', 'Joost van der Westhuizen', 'Bryan Habana', 'George Gregan', 'David Campese', 'Shane Williams', 'Will Carling', 'Owen Farrell', 'Maro Itoje', 'Antoine Dupont', 'Beauden Barrett', 'Sonny Bill Williams', 'Michael Jones', 'Sean Fitzpatrick', 'Jason Robinson', 'Lawrence Dallaglio', 'Jeremy Guscott', "Ma'a Nonu", 'Gavin Hastings', 'Serge Blanco', 'Philippe Sella', 'Tana Umaga', 'Keven Mealamu', 'Eben Etzebeth', 'Duane Vermeulen', 'Pieter-Steph du Toit', 'Ardie Savea', 'Cheslin Kolbe', 'Johnny Wilkinson', 'Dan Cole'],
    rename: ['Johnny Sexton'],
  },
  {
    id: 'sports-swimmer', category: 'Sports', prompt: 'Name a swimmer.',
    rules: 'Accept any real competitive swimmer, men\'s or women\'s, current or retired, from any country (Michael Phelps, Mark Spitz, Ian Thorpe, Katie Ledecky, Ryan Lochte, Missy Franklin, Caeleb Dressel, Janet Evans, Natalie Coughlin, Adam Peaty), by their usual name or surname. Divers, water polo players and fictional swimmers do not count.',
    source: 'People in Wikidata whose occupation is swimmer and whose description names swimming, known in at least 8 languages.', pattern: occupation('Q10843402') + HUMAN, minSignal: 8, alsoWritten: personForms,
    skip: notDescribedAs(/swim/i),
    mustHave: ['Michael Phelps', 'Mark Spitz', 'Ian Thorpe', 'Katie Ledecky', 'Ryan Lochte', 'Missy Franklin', 'Caeleb Dressel', 'Natalie Coughlin', 'Dara Torres', 'Janet Evans', 'Grant Hackett', 'Kristin Otto', 'Alexander Popov', 'Pieter van den Hoogenband', 'Eric Moussambani', 'Léon Marchand', 'Summer McIntosh', 'Adam Peaty', 'Duncan Goodhew', 'Johnny Weissmuller', 'Don Schollander', 'Rebecca Adlington', 'Libby Trickett', 'Sun Yang', 'Ariarne Titmus', 'Mollie O\'Callaghan', 'Emma McKeon', 'Cate Campbell', 'Kyle Chalmers', 'Gertrude Ederle', 'Duke Kahanamoku', 'Dawn Fraser', 'Shane Gould', 'Matt Biondi', 'Nathan Adrian', 'Aaron Peirsol', 'Michael Gross', 'Tom Dolan', 'Mary T. Meagher', 'Federica Pellegrini'],
    rename: ['Alexander Popov'],
  },
  {
    id: 'sports-athlete', category: 'Sports', prompt: 'Name a track and field athlete.',
    rules: 'Accept any real athlete in running, jumping or throwing events, men\'s or women\'s, current or retired, from any country (Usain Bolt, Carl Lewis, Jesse Owens, Michael Johnson, Florence Griffith Joyner, Eliud Kipchoge, Mo Farah, Allyson Felix, Jackie Joyner-Kersee, Sebastian Coe), by their usual name or surname. Swimmers, cyclists, footballers and fictional athletes do not count.',
    source: 'People in Wikidata whose occupation is a kind of athletics competitor and whose description names athletics, known in at least 8 languages.', pattern: occupationUnder('Q11513337') + HUMAN, minSignal: 12, alsoWritten: personForms,
    skip: notDescribedAs(/sprint|runner|athlet|hurdl|jump|vault|thrower|javelin|discus|marathon|track and field|decathl|heptath|shot put|hammer|walker|steeplechase/i),
    mustHave: ['Usain Bolt', 'Carl Lewis', 'Jesse Owens', 'Michael Johnson', 'Florence Griffith Joyner', 'Eliud Kipchoge', 'Mo Farah', 'Haile Gebrselassie', 'Allyson Felix', 'Jackie Joyner-Kersee', 'Sebastian Coe', 'Roger Bannister', 'Paavo Nurmi', 'Emil Zátopek', 'Wilma Rudolph', 'Justin Gatlin', 'Tyson Gay', 'Yohan Blake', 'Shelly-Ann Fraser-Pryce', 'Elaine Thompson-Herah', 'Noah Lyles', 'Sydney McLaughlin-Levrone', 'Armand Duplantis', 'Sergey Bubka', 'Bob Beamon', 'Dick Fosbury', 'Kenenisa Bekele', 'Abebe Bikila', 'Steve Ovett', 'Marion Jones', 'Ben Johnson', 'Linford Christie', 'Maurice Greene', 'Donovan Bailey', 'Kirani James', 'Wayde van Niekerk', 'Tirunesh Dibaba', 'Paula Radcliffe', 'Jessica Ennis-Hill', 'Caster Semenya'],
    rename: ['Sergey Bubka'],
  },
  {
    id: 'sports-wrestler', category: 'Sports', prompt: 'Name a professional wrestler.',
    rules: 'Accept any real professional wrestler, men\'s or women\'s, current or retired (The Rock, Hulk Hogan, John Cena, Stone Cold Steve Austin, The Undertaker, Ric Flair, Randy Savage, Andre the Giant, Triple H, Shawn Michaels, Bret Hart, Becky Lynch), by their ring name or real name. Olympic wrestlers, boxers, MMA fighters and fictional wrestlers do not count.',
    source: 'People in Wikidata whose occupation is professional wrestler and whose description names wrestling, known in at least 6 languages.', pattern: occupation('Q13474373') + HUMAN, minSignal: 6,
    skip: notDescribedAs(/wrestl/i),
    mustHave: ['Dwayne Johnson', 'Hulk Hogan', 'John Cena', 'Stone Cold Steve Austin', 'The Undertaker', 'Ric Flair', 'Randy Savage', 'André the Giant', 'Triple H', 'Shawn Michaels', 'Bret Hart', 'Roman Reigns', 'Brock Lesnar', 'Batista', 'Rey Mysterio', 'Kane', 'Edge', 'Mick Foley', 'Becky Lynch', 'Charlotte Flair', 'Ronda Rousey', 'CM Punk', 'Kurt Angle', 'Big Show', 'Goldberg', 'Jake Roberts', 'The Ultimate Warrior', 'Dusty Rhodes', 'Eddie Guerrero', 'Chris Jericho', 'Daniel Bryan', 'AJ Styles', 'Seth Rollins', 'Cody Rhodes', 'Sting', 'Rikishi', 'Jimmy Snuka', 'Bray Wyatt', 'Sasha Banks', 'Trish Stratus'],
    rename: ['Batista', 'Goldberg', 'Daniel Bryan', 'AJ Styles', 'Sasha Banks'],
  },

  // ================================================================ Transport & Vehicles
  {
    id: 'transport-rocket', category: 'Transport & Vehicles', prompt: 'Name a rocket.',
    rules: 'Accept any rocket or launch vehicle that carried things into space, old or new (Saturn V, Falcon 9, Falcon Heavy, Soyuz, Ariane 5, Atlas V, Long March, Proton, Titan, Vostok, Starship, V-2, Space Launch System). Spacecraft and capsules that ride on rockets, missiles, fireworks and fictional rockets do not count.',
    source: 'Wikidata items that are a launch vehicle or a kind of one, known in at least 6 languages.', pattern: kindOf('Q697175'), minSignal: 6,
    mustHave: ['Saturn V', 'Falcon 9', 'Falcon Heavy', 'Soyuz', 'Ariane 5', 'Atlas V', 'Long March', 'Proton', 'Titan', 'Vostok', 'Starship', 'V-2 rocket', 'Space Launch System', 'Delta IV', 'Redstone', 'Energia', 'N1', 'Saturn I', 'Jupiter-C', 'Vega', 'Angara', 'H-IIA', 'PSLV', 'GSLV', 'Vulcan Centaur', 'New Glenn', 'Antares', 'Electron', 'New Shepard', 'Atlas', 'Delta II', 'Titan II', 'Ariane 6', 'Zenit', 'Scout', 'Black Brant', 'Saturn IB', 'Space Shuttle', 'Voskhod', 'Molniya'],
    skip: anyOf(nameIs(/^(Challenger|Discovery|Columbia|Atlantis|Endeavour|Buran|Enterprise)$/i), nameIs(/^reusable launch vehicle$/i)),
    rename: ['PSLV', 'GSLV', 'Vulcan Centaur', 'Titan II'],
  },
  {
    id: 'transport-metro', category: 'Transport & Vehicles', prompt: 'Name a metro or subway system.',
    rules: 'Accept any underground, metro, subway or rapid-transit railway system of a city (London Underground, New York City Subway, Paris Métro, Tokyo Metro, Moscow Metro, Hong Kong MTR, Singapore MRT, Berlin U-Bahn, Washington Metro, Delhi Metro), by the usual name. Single stations, trams, buses and ordinary commuter trains do not count.',
    source: 'Wikidata items that are a rapid transit system, known in at least 8 languages.', pattern: anyInstance('Q5503', 'Q25615850'), minSignal: 8,
    mustHave: ['London Underground', 'New York City Subway', 'Paris Métro', 'Tokyo Metro', 'Moscow Metro', 'MTR', 'Singapore MRT', 'Berlin U-Bahn', 'Washington Metro', 'Delhi Metro', 'Madrid Metro', 'Beijing Subway', 'Shanghai Metro', 'Seoul Metropolitan Subway', 'Mexico City Metro', 'Chicago "L"', 'Bay Area Rapid Transit', 'Vienna U-Bahn', 'Munich U-Bahn', 'Barcelona Metro', 'Milan Metro', 'Rome Metro', 'Athens Metro', 'Istanbul Metro', 'Cairo Metro', 'Buenos Aires Underground', 'São Paulo Metro', 'Santiago Metro', 'Toronto subway', 'Montreal Metro', 'Boston subway', 'Philadelphia subway', 'Stockholm metro', 'Copenhagen Metro', 'Amsterdam Metro', 'Budapest Metro', 'Prague Metro', 'Saint Petersburg Metro', 'Kiev Metro', 'Taipei Metro'],
  },
  {
    id: 'transport-helicopter', category: 'Transport & Vehicles', prompt: 'Name a helicopter.',
    rules: 'Accept any model or family of helicopter, civil or military (Black Hawk, Apache, Chinook, Huey, Sea King, Super Puma, Robinson R22, Mi-24, Ka-52, Tiger, Lynx, Osprey as a tiltrotor). Airplanes, drones, gliders and fictional helicopters do not count.',
    source: 'Wikidata items that are a helicopter or a kind of one, known in at least 6 languages.', pattern: kindOf('Q34486'), minSignal: 6,
    mustHave: ['Sikorsky UH-60 Black Hawk', 'Black Hawk', 'Boeing AH-64 Apache', 'Boeing CH-47 Chinook', 'Bell UH-1 Iroquois', 'Sikorsky SH-3 Sea King', 'Eurocopter AS332 Super Puma', 'Robinson R22', 'Mil Mi-24', 'Kamov Ka-52', 'Eurocopter Tiger', 'Westland Lynx', 'Bell V-22 Osprey', 'Bell 206', 'Mil Mi-8', 'Aérospatiale Gazelle', 'AgustaWestland AW101', 'Sikorsky CH-53 Sea Stallion', 'Bell AH-1 Cobra', 'Boeing Vertol CH-46 Sea Knight', 'Bell OH-58 Kiowa', 'Hughes MD 500', 'Sikorsky S-76', 'Eurocopter EC135', 'Airbus H145', 'Robinson R44', 'Aérospatiale Alouette II', 'Sikorsky R-4', 'Focke-Wulf Fw 61', 'Westland Wasp', 'Aérospatiale Dauphin', 'Kaman K-MAX', 'Sikorsky S-64 Skycrane', 'Mil Mi-26', 'Sikorsky MH-60 Seahawk', 'Bell 47', 'Bell 412', 'Boeing-Sikorsky RAH-66 Comanche', 'Hiller UH-12', 'Piasecki H-21', 'Kamov Ka-27'],
    skip: nameIs(/^(attack helicopter|Marine One|helicopter)$/i),
    rename: ['Eurocopter Tiger', 'Westland Lynx', 'Aérospatiale Gazelle', 'Eurocopter EC135', 'Airbus H145', 'Robinson R44', 'Aérospatiale Alouette II', 'Focke-Wulf Fw 61', 'Westland Wasp', 'Mil Mi-26', 'Boeing-Sikorsky RAH-66 Comanche', 'Hiller UH-12', 'Piasecki H-21', 'Black Hawk'],
  },

  // ================================================================ Miscellaneous
  {
    id: 'misc-color', category: 'Miscellaneous', prompt: 'Name a color.',
    rules: 'Accept any named colour, basic or fancy, in either spelling (red, blue, green, yellow, purple, orange, pink, black, white, turquoise, magenta, crimson, indigo, beige, teal, lavender). Materials, brand names, and the word "colour" on its own do not count.',
    source: 'Wikidata items that are a color or a shade of one, known in at least 4 languages.', pattern: '?item wdt:P31 ?colorClass . VALUES ?colorClass { wd:Q1075 wd:Q4725 wd:Q8097 } .', minSignal: 4,
    extraAliases: { Gray: ['Grey'], Grey: ['Gray'] },
    mustHave: ['Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'Black', 'White', 'Brown', 'Gray', 'Gold', 'Silver', 'Turquoise', 'Violet', 'Indigo', 'Magenta', 'Cyan', 'Beige', 'Maroon', 'Navy blue', 'Teal', 'Lavender', 'Crimson', 'Scarlet', 'Cream', 'Tan', 'Olive', 'Lime', 'Mint', 'Coral', 'Salmon', 'Peach', 'Ivory', 'Burgundy', 'Mauve', 'Amber', 'Aqua', 'Fuchsia', 'Khaki'],
    skip: anyOf(nameIs(/hair|skin|vision|fluorescent|movement|bioluminescence|mimicry|phosphorescence|iridescence|aposematism|roan|lion|incarnate|complex$/i), nameIs(/^monochrome$/i)),
  },
  {
    id: 'misc-painter', category: 'Miscellaneous', prompt: 'Name a painter.',
    rules: 'Accept any real painter, old master or modern, from any country (Pablo Picasso, Vincent van Gogh, Leonardo da Vinci, Claude Monet, Rembrandt, Salvador Dalí, Frida Kahlo, Michelangelo, Raphael, Jackson Pollock), by their usual name or surname. Sculptors, photographers, illustrators who never painted and fictional painters do not count.',
    source: 'People in Wikidata whose occupation is painter and whose description names painting, known in at least 12 languages.', pattern: occupation('Q1028181') + HUMAN, minSignal: 12, alsoWritten: personForms,
    skip: notDescribedAs(/paint/i),
    mustHave: ['Pablo Picasso', 'Vincent van Gogh', 'Leonardo da Vinci', 'Claude Monet', 'Rembrandt', 'Salvador Dalí', 'Frida Kahlo', 'Michelangelo', 'Raphael', 'Jackson Pollock', 'Sandro Botticelli', 'Edvard Munch', 'Peter Paul Rubens', 'Johannes Vermeer', 'Francisco Goya', 'Diego Velázquez', 'Henri Matisse', 'Paul Cézanne', 'Pierre-Auguste Renoir', 'Edgar Degas', 'Édouard Manet', 'Paul Gauguin', 'Gustav Klimt', 'Mark Rothko', 'Wassily Kandinsky', 'Piet Mondrian', 'René Magritte', 'Edward Hopper', "Georgia O'Keeffe", 'Caravaggio', 'Titian', 'J. M. W. Turner', 'John Constable', 'Katsushika Hokusai', 'Jean-Michel Basquiat', 'David Hockney', 'Francis Bacon', 'Roy Lichtenstein', 'Georges Seurat', 'Henri de Toulouse-Lautrec'],
  },
  {
    id: 'misc-publication', category: 'Miscellaneous', prompt: 'Name a newspaper or magazine.',
    rules: 'Accept any newspaper or magazine, from any country, print or online, current or defunct (The New York Times, The Guardian, Time, Vogue, National Geographic, The Washington Post, The Economist, Rolling Stone, Le Monde, Der Spiegel, Reader\'s Digest), with or without "The". Books, TV channels, websites that are not publications, and the words "newspaper" or "magazine" on their own do not count.',
    source: 'Wikidata items that are a newspaper or a magazine, or a kind of either, known in at least 25 languages.', pattern: anyKind('Q41298', 'Q11032'), minSignal: 25, alsoWritten: strip(/^The /),
    mustHave: ['The New York Times', 'The Guardian', 'Time', 'Vogue', 'National Geographic', 'The Washington Post', 'The Wall Street Journal', 'The Times', 'Forbes', "Reader's Digest", 'Playboy', 'Rolling Stone', 'The Economist', 'Cosmopolitan', 'People', 'Vanity Fair', 'The New Yorker', 'Le Monde', 'Der Spiegel', 'The Sun', 'Daily Mail', 'Financial Times', 'USA Today', 'Los Angeles Times', 'Pravda', 'Asahi Shimbun', 'The Hindu', 'The Times of India', 'South China Morning Post', 'Mad', 'Wired', 'GQ', 'Elle', 'Newsweek', 'Life', 'Esquire', "Harper's Bazaar", 'Marie Claire', 'Sports Illustrated', 'Le Figaro'],
    skip: nameIs(/^(British Broadcasting Corporation|Voice of America|Norwegian Broadcasting Corporation|The World Factbook|IGN|pornographic magazine|daily newspaper|Business Insider|Vox)$/i),
  },
  {
    id: 'misc-typeface', category: 'Miscellaneous', prompt: 'Name a font or typeface.',
    rules: 'Accept any named typeface or font family, classic or modern (Helvetica, Arial, Times New Roman, Comic Sans, Calibri, Verdana, Georgia, Courier, Futura, Garamond, Baskerville, Gill Sans, Papyrus, Impact, Roboto, Open Sans). Font sizes, styles such as "bold" or "italic" on their own, and the words "font" or "typeface" on their own do not count.',
    source: 'Wikidata items that are a typeface or a typeface family, known in at least 6 languages.', pattern: '{ { ?item wdt:P31 wd:Q58481926 } UNION { ?item wdt:P31/wdt:P279* wd:Q17451 } } .', minSignal: 6,
    mustHave: ['Helvetica', 'Arial', 'Times New Roman', 'Comic Sans', 'Calibri', 'Verdana', 'Georgia', 'Courier', 'Futura', 'Garamond', 'Baskerville', 'Gill Sans', 'Palatino', 'Impact', 'Tahoma', 'Trebuchet MS', 'Papyrus', 'Roboto', 'Open Sans', 'Lato', 'Century Gothic', 'Bodoni', 'Didot', 'Rockwell', 'Frutiger', 'Univers', 'Optima', 'Cambria', 'Consolas', 'Segoe UI', 'San Francisco', 'Avenir', 'Franklin Gothic', 'Gotham', 'Lucida', 'Minion', 'Myriad', 'Bookman', 'Clarendon', 'Caslon'],
    skip: nameIs(/^(Nastaʿlīq|Kurrent|Sütterlin|blackboard bold)$/i),
    rename: ['Comic Sans', 'Segoe UI'],
  },
]
