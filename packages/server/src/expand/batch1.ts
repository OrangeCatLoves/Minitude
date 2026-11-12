/**
 * Batch 1: 30 new questions, each a clear class that Wikidata models, spread over the categories (3 each; Transport 2, Miscellaneous 1).
 * Chosen for a long tail (so all six tiers have real answers), a head that casual players know, and a yes-or-no validity rule.
 * `mustHave` lists the obvious answers a casual English-speaking player thinks of first (most obvious first): they lead the ranking,
 * and any the Wikidata class lacks is added by hand and reported on the review sheet.
 * Build with: npx tsx src/expand/newq.ts --batch batch1
 */
import { speciesBelow } from './build'
import type { NewQuestion } from './newq'

const CLUB_PREFIX = /^(FC|AFC|SC|CF|AC|AS|SS|US|RC|CD|SV|TSV|VfB|VfL|FK|SK|BK|IF|CA|CS|SD|UD|RCD|KV|KRC|SL|SSC|ACF|ASD|ES|OGC) /
const CLUB_SUFFIX = / (FC|AFC|CF|SC|FK|SK|BK|IF)$/

/** "FC Bayern Munich" -> "Bayern Munich"; "Arsenal F.C." -> "Arsenal" */
const clubForms = (n: string): string[] => {
  const out: string[] = []
  const a = n.replace(CLUB_PREFIX, '')
  if (a !== n && a.length >= 4) out.push(a)
  const b = n.replace(CLUB_SUFFIX, '').replace(/ F\.C\.$/, '')
  if (b !== n && b.length >= 4) out.push(b)
  return out
}
const carForms = (n: string): string[] => {
  const a = n.replace(/ (Motor Company|Motor Corporation|Motors|Automobiles|Automobile|Automotive|Cars|Car Company|Group|Corporation|Company|Co\.|Ltd\.?|AG|SA|S\.p\.A\.)$/i, '')
  return a !== n && a.length >= 3 ? [a] : []
}
const airportForms = (n: string): string[] => {
  const out: string[] = []
  const a = n.replace(/ (International |Intl\.? )?Airport$/i, '')
  if (a !== n && a.length >= 3) out.push(a)
  if (/ International Airport$/i.test(n)) out.push(n.replace(/ International Airport$/i, ' Airport'))
  return out
}
const battleForms = (n: string): string[] => (/^Battle of /i.test(n) ? [n.replace(/^Battle of /i, '')] : [`Battle of ${n}`])
/** instances of a class or of any of its subclasses, AND the subclasses themselves (a baguette is a kind of bread, not an instance of it) */
const kindOf = (q: string) => `{ ?item wdt:P31/wdt:P279* wd:${q} } UNION { ?item wdt:P279+ wd:${q} } .`

export const BATCH: NewQuestion[] = [
  // ---------------------------------------------------------------- Animals & Nature
  {
    id: 'animals-dog-breed', category: 'Animals & Nature', prompt: 'Name a breed of dog.',
    rules: 'Accept any recognised dog breed, including rare, regional and landrace breeds and well-known designer crossbreeds that have their own breed name (for example Labradoodle). Individual dogs, fictional dogs, wild canids such as the dingo, and the word "dog" do not count.',
    source: 'Wikidata items that are a "dog breed" (about 1,150).', pattern: '?item wdt:P31 wd:Q39367 .', minSignal: 1, skip: (c) => /^dingo$/i.test(c.name),
    mustHave: ['Labrador Retriever', 'Poodle', 'German Shepherd', 'Golden Retriever', 'Bulldog', 'Beagle', 'Pug', 'Chihuahua', 'Siberian Husky', 'Dalmatian', 'Rottweiler', 'Border Collie', 'Boxer', 'Dachshund', 'Pembroke Welsh Corgi', 'Shih Tzu', 'Great Dane', 'Doberman Pinscher', 'Greyhound', 'Yorkshire Terrier'],
  },
  {
    id: 'animals-horse-breed', category: 'Animals & Nature', prompt: 'Name a breed of horse.',
    rules: 'Accept any recognised horse or pony breed, light, draft or warmblood (for example Arabian, Shire, Shetland pony). Individual horses, fictional horses, wild species such as the zebra, and the word "horse" do not count.',
    source: 'Wikidata items that are a "horse breed" (about 850).', pattern: '?item wdt:P31 wd:Q1160573 .', minSignal: 1,
    mustHave: ['Arabian horse', 'Thoroughbred', 'Clydesdale', 'Shire', 'Appaloosa', 'Mustang', 'Quarter Horse', 'Shetland pony', 'Percheron', 'Friesian horse', 'Icelandic horse', 'Lipizzan', 'Morgan horse', 'Andalusian horse', 'Clydesdale horse'],
  },
  {
    id: 'animals-shark-species', category: 'Animals & Nature', prompt: 'Name a species of shark.',
    rules: 'Accept any living species of shark, by its common name or its scientific name. Group names where every member is a shark (such as hammerhead or reef shark) also count. Rays, skates, chimaeras and extinct sharks do not count.',
    source: 'Species below the taxon "shark" in Wikidata, without extinct ones; the English common name is the answer, the scientific name an alias.',
    fetch: () => speciesBelow(['Q7372'], 'FILTER NOT EXISTS { ?item wdt:P141 wd:Q237350 }', 'Q7432', { depth: 8, commonNames: true, fame: true }), commonNames: true,
    extras: [{ name: 'Hammerhead', signal: 60, aliases: ['hammerhead shark', 'hammerheads'] }, { name: 'Reef shark', signal: 30, aliases: ['reef sharks'] }, { name: 'Requiem shark', signal: 12 }, { name: 'Mako', signal: 40, aliases: ['mako shark'] }],
    mustHave: ['Great white shark', 'Tiger shark', 'Hammerhead', 'Bull shark', 'Whale shark', 'Mako shark', 'Nurse shark', 'Blue shark', 'Lemon shark', 'Basking shark', 'Greenland shark', 'Thresher shark', 'Goblin shark', 'Megamouth shark', 'Cookiecutter shark', 'Blacktip reef shark', 'Porbeagle', 'Spiny dogfish'],
  },
  // ---------------------------------------------------------------- Food
  {
    id: 'food-cocktail', category: 'Food', prompt: 'Name a cocktail.',
    rules: 'Accept any named cocktail or mixed drink, classic, tiki or modern, alcoholic or not (for example Mojito, Negroni, Shirley Temple). Single spirits, beer, wine, plain soft drinks and shots with no mixer do not count.',
    source: 'Wikidata items that are a cocktail or a kind of cocktail (about 400).', pattern: kindOf('Q134768'), minSignal: 1,
    mustHave: ['Mojito', 'Margarita', 'Martini', 'Old Fashioned', 'Cosmopolitan', 'Negroni', 'Daiquiri', 'Manhattan', 'Piña Colada', 'Bloody Mary', 'Mai Tai', 'Moscow Mule', 'Whiskey Sour', 'Long Island Iced Tea', 'Tequila Sunrise', 'Espresso Martini', 'Aperol Spritz', 'Sex on the Beach', 'Mimosa', 'Gin and tonic'],
  },
  {
    id: 'food-cheese-type', category: 'Food', prompt: 'Name a type of cheese.',
    rules: 'Accept any named cheese, cheese style or protected-name cheese from anywhere in the world (Cheddar, Halloumi, Roquefort). Brands of processed cheese do not count unless the name is also a cheese style.',
    source: 'Wikidata items that are a cheese or a kind of cheese (about 400).', pattern: kindOf('Q10943'), minSignal: 1,
    mustHave: ['Cheddar', 'Mozzarella', 'Brie', 'Parmesan', 'Gouda', 'Feta', 'Swiss cheese', 'Camembert', 'Blue cheese', 'Gorgonzola', 'Halloumi', 'Edam', 'Stilton', 'Roquefort', 'Cream cheese', 'Cottage cheese', 'Ricotta', 'Provolone', 'Monterey Jack', 'Havarti', 'Emmental', 'Manchego', 'Pecorino Romano'],
  },
  {
    id: 'food-bread-type', category: 'Food', prompt: 'Name a type of bread.',
    rules: 'Accept any named bread, flatbread, roll or bun from any cuisine (sourdough, naan, baguette, bagel). Cakes, pastries, crackers and biscuits do not count.',
    source: 'Wikidata items that are a bread or a kind of bread (about 450).', pattern: kindOf('Q7802'), minSignal: 1,
    mustHave: ['Baguette', 'Sourdough', 'Naan', 'Pita', 'Ciabatta', 'Bagel', 'Focaccia', 'Brioche', 'Rye bread', 'Chapati', 'Tortilla', 'Pretzel', 'Cornbread', 'Challah', 'White bread', 'Whole wheat bread', 'Soda bread', 'Roti', 'Pumpernickel', 'English muffin', 'Flatbread', 'Banana bread'],
  },
  // ---------------------------------------------------------------- Games
  {
    id: 'games-board-game', category: 'Games', prompt: 'Name a board game.',
    rules: 'Accept any published board game, classic, family or strategy (Monopoly, Catan, Go, Chess). Video games, card games on their own, and sports do not count.',
    source: 'Wikidata items that are a board game, known in at least 2 languages (about 1,000).', pattern: '?item wdt:P31 wd:Q131436 .', minSignal: 2,
    mustHave: ['Monopoly', 'Chess', 'Scrabble', 'Risk', 'Cluedo', 'Catan', 'Checkers', 'Backgammon', 'Trivial Pursuit', 'Battleship', 'Ticket to Ride', 'Pandemic', 'Carcassonne', 'Go', 'Othello', 'Connect Four', 'Jenga', 'Stratego', 'Sorry!', 'Candy Land', 'The Game of Life', 'Chinese checkers', 'Mahjong', 'Snakes and ladders', 'Ludo'],
  },
  {
    id: 'games-video-game', category: 'Games', prompt: 'Name a video game.',
    rules: 'Accept any commercially released video game, on any platform, including individual titles of a series (for example Super Mario Bros. or The Legend of Zelda: Breath of the Wild). Franchises as a whole, consoles, game companies and characters do not count.',
    source: 'Wikidata items that are a video game, known in at least 15 languages (about 2,400).', pattern: '?item wdt:P31 wd:Q7889 .', minSignal: 15,
    mustHave: ['Minecraft', 'Tetris', 'Super Mario Bros.', 'Pac-Man', 'Fortnite', 'The Legend of Zelda', 'Pong', 'Doom', 'The Elder Scrolls V: Skyrim', 'Halo', 'Call of Duty', 'Among Us', 'Stardew Valley', 'Portal', 'Half-Life', 'Sonic the Hedgehog', 'Overwatch', 'Grand Theft Auto V', 'The Sims', 'World of Warcraft', 'League of Legends', 'Space Invaders', 'Donkey Kong', 'Street Fighter II', 'Roblox', 'Fall Guys', 'Elden Ring', 'The Witcher 3: Wild Hunt'],
  },
  {
    id: 'games-pokemon', category: 'Games', prompt: 'Name a Pokémon.',
    rules: 'Accept any Pokémon species by its English name (Pikachu, Mewtwo, Sprigatito). Trainers, moves, items, regions and the word "Pokémon" itself do not count.',
    source: 'Wikidata items with a Pokédex number (about 1,000).', pattern: '?item wdt:P1685 ?dex .',
    mustHave: ['Pikachu', 'Charizard', 'Eevee', 'Mewtwo', 'Snorlax', 'Bulbasaur', 'Squirtle', 'Charmander', 'Jigglypuff', 'Gengar', 'Magikarp', 'Psyduck', 'Lucario', 'Mew', 'Gyarados', 'Gardevoir', 'Greninja', 'Meowth', 'Togepi', 'Rayquaza'],
  },
  // ---------------------------------------------------------------- History & Mythology
  {
    id: 'history-emperor', category: 'History & Mythology', prompt: 'Name an emperor or empress.',
    rules: 'Accept any historical emperor or empress who ruled an empire, from any country or period (Augustus, Napoleon, Ashoka, Qin Shi Huang, Peter the Great, Empress Wu), under any title translated as emperor or empress. Kings and queens who were not also emperors, regents, and fictional emperors do not count.',
    source: 'People in Wikidata whose position is a kind of emperor, known in at least 6 languages (about 1,100).', pattern: '?item wdt:P39 ?pos . ?pos wdt:P279* wd:Q39018 .', minSignal: 6,
    mustHave: ['Napoleon', 'Augustus', 'Nero', 'Constantine the Great', 'Qin Shi Huang', 'Hirohito', 'Akbar', 'Charlemagne', 'Hadrian', 'Marcus Aurelius', 'Caligula', 'Peter the Great', 'Justinian I', 'Trajan', 'Ashoka', 'Nicholas II of Russia', 'Wu Zetian', 'Catherine the Great', 'Haile Selassie', 'Franz Joseph I of Austria', 'Wilhelm II, German Emperor', 'Shah Jahan', 'Diocletian', 'Tiberius', 'Atahualpa', 'Kangxi Emperor', 'Cixi'],
  },
  {
    id: 'history-deity', category: 'History & Mythology', prompt: 'Name a god or goddess from any mythology or religion.',
    rules: 'Accept any deity from any mythology or religion, ancient or living (Zeus, Thor, Vishnu, Isis, Amaterasu, Quetzalcoatl). Saints, angels, heroes, demons, and mythical creatures do not count unless they are also worshipped as a deity.',
    source: 'Wikidata items that are a deity or a kind of deity, known in at least 6 languages (about 2,400).', pattern: '?item wdt:P31/wdt:P279* wd:Q178885 .', minSignal: 6,
    mustHave: ['Zeus', 'Thor', 'Odin', 'Athena', 'Apollo', 'Poseidon', 'Hades', 'Aphrodite', 'Ra', 'Anubis', 'Isis', 'Osiris', 'Horus', 'Vishnu', 'Shiva', 'Kali', 'Ganesha', 'Brahma', 'Loki', 'Freya', 'Hera', 'Hermes', 'Artemis', 'Ares', 'Amaterasu', 'Quetzalcoatl', 'Jupiter', 'Mars', 'Venus', 'Neptune', 'Lakshmi', 'Thoth', 'Baal'],
  },
  {
    id: 'history-battle', category: 'History & Mythology', prompt: 'Name a battle.',
    rules: 'Accept any named battle from any period or place (Waterloo, Thermopylae, Gettysburg, Stalingrad), with or without the words "Battle of". Whole wars, campaigns and sieges not named as a battle, and fictional battles do not count.',
    source: 'Wikidata items that are a battle, known in at least 8 languages (about 3,000).', pattern: '?item wdt:P31 wd:Q178561 .', minSignal: 8, alsoWritten: battleForms,
    mustHave: ['Battle of Waterloo', 'Battle of Hastings', 'Battle of Gettysburg', 'Battle of Thermopylae', 'Battle of Stalingrad', 'Battle of Trafalgar', 'Battle of Marathon', 'Battle of Midway', 'Battle of Agincourt', 'Battle of Verdun', 'Battle of the Somme', 'Battle of Bunker Hill', 'Battle of Saratoga', 'Battle of Antietam', 'Battle of Austerlitz', 'Battle of Culloden', 'Battle of Lepanto', 'Battle of Britain', 'Battle of the Bulge', 'Battle of Normandy', 'Battle of the Little Bighorn', 'Battle of the Alamo', 'Battle of Actium', 'Battle of Salamis', 'Battle of Cannae', 'Battle of Borodino', 'Battle of Gallipoli', 'Battle of Iwo Jima', 'Battle of Tours', 'Battle of Leipzig'],
  },
  // ---------------------------------------------------------------- Places
  {
    id: 'places-country', category: 'Places', prompt: 'Name a country.',
    rules: 'Accept any sovereign state today: UN members and observers (such as the Vatican and Palestine), widely recognised states such as Taiwan and Kosovo, and the constituent countries of the United Kingdom (England, Scotland, Wales, Northern Ireland). Territories and dependencies (such as Greenland or Puerto Rico), regions, continents and countries that no longer exist do not count.',
    source: 'Wikidata sovereign states and constituent countries of the UK that have not ended (about 200).',
    pattern: '{ ?item wdt:P31 wd:Q3624078 } UNION { ?item wdt:P31 wd:Q3336843 } FILTER NOT EXISTS { ?item wdt:P576 ?end } .',
    extraAliases: { "People's Republic of China": ['China', 'PRC', 'Mainland China'], 'United States': ['USA', 'US', 'America', 'United States of America', 'the States'], 'United Kingdom': ['UK', 'Britain', 'Great Britain', 'GB'], Netherlands: ['Holland', 'the Netherlands'], Czechia: ['Czech Republic'], 'Czech Republic': ['Czechia'], Myanmar: ['Burma'], Eswatini: ['Swaziland'], 'North Macedonia': ['Macedonia'], Turkey: ['Turkiye', 'Türkiye'], Türkiye: ['Turkey'], 'Ivory Coast': ["Cote d'Ivoire", 'Côte d’Ivoire'], "Côte d'Ivoire": ['Ivory Coast'], 'East Timor': ['Timor-Leste'], 'Timor-Leste': ['East Timor'], 'Cape Verde': ['Cabo Verde'], 'Cabo Verde': ['Cape Verde'], 'South Korea': ['Korea', 'Republic of Korea'], 'North Korea': ['DPRK'], Russia: ['Russian Federation'], 'United Arab Emirates': ['UAE'] },
    mustHave: ['United States', 'China', 'India', 'Russia', 'France', 'Germany', 'United Kingdom', 'Japan', 'Brazil', 'Canada', 'Australia', 'Italy', 'Spain', 'Mexico', 'Egypt', 'Nigeria', 'South Africa', 'Argentina', 'England', 'Scotland', 'Wales', 'Ireland', 'Turkey', 'South Korea', 'Saudi Arabia', 'Vatican City', 'Taiwan', 'Palestine', 'Kosovo', 'Tuvalu', 'Bhutan'],
  },
  {
    id: 'places-capital-city', category: 'Places', prompt: 'Name a national capital city.',
    rules: 'Accept the capital city of any sovereign state today, including states with more than one capital (Pretoria, Cape Town and Bloemfontein for South Africa) and de facto capitals. State, provincial and historical capitals, and the largest city of a country when it is not the capital, do not count.',
    source: 'Cities that Wikidata lists as the capital of a sovereign state that has not ended (about 200).',
    pattern: '?c wdt:P31 wd:Q3624078 . FILTER NOT EXISTS { ?c wdt:P576 ?end } ?c wdt:P36 ?item .',
    mustHave: ['Paris', 'London', 'Washington, D.C.', 'Tokyo', 'Beijing', 'Moscow', 'Berlin', 'Rome', 'Madrid', 'Canberra', 'Ottawa', 'Brasília', 'Cairo', 'New Delhi', 'Nairobi', 'Pretoria', 'Cape Town', 'Bern', 'Wellington', 'Reykjavík', 'Buenos Aires', 'Mexico City', 'Seoul', 'Bangkok', 'Athens', 'Lisbon', 'Dublin', 'Vienna', 'Amsterdam', 'Stockholm', 'Oslo'],
  },
  {
    id: 'places-island', category: 'Places', prompt: 'Name an island.',
    rules: 'Accept any named island, from continent-sized (Greenland) to small, including island countries and islands that belong to an archipelago (Maui, Skye, Java). Archipelagos as a whole, peninsulas, continents and artificial islands inside buildings do not count.',
    source: 'Wikidata items that are an island, known in at least 20 languages (about 1,500).', pattern: '?item wdt:P31 wd:Q23442 .', minSignal: 20,
    mustHave: ['Manhattan', 'Bali', 'Madagascar', 'Iceland', 'Cuba', 'Sicily', 'Crete', 'Tasmania', 'Greenland', 'Borneo', 'Jamaica', 'Ireland', 'Great Britain', 'Sri Lanka', 'Honshu', 'Maui', 'Isle of Skye', 'Zanzibar', 'Java', 'Sumatra', 'Corsica', 'Sardinia', 'Cyprus', 'Malta', 'Long Island', 'Easter Island', 'Madeira', 'Tenerife', 'New Guinea', 'Hong Kong Island'],
  },
  // ---------------------------------------------------------------- Science & Technology
  {
    id: 'science-mineral', category: 'Science & Technology', prompt: 'Name a mineral.',
    rules: 'Accept any mineral species (quartz, calcite, gypsum, turquoise) and the well-known gem varieties of minerals (ruby, sapphire, emerald, amethyst). Rocks (granite, marble), pure chemical elements as nutrients, and man-made materials do not count.',
    source: 'Wikidata mineral species approved by the International Mineralogical Association, known in at least 3 languages (about 5,000), plus well-known gem varieties added by hand.',
    pattern: '?item wdt:P31 wd:Q12089225 .', minSignal: 3,
    extras: [
      { name: 'Ruby', signal: 70 }, { name: 'Sapphire', signal: 70 }, { name: 'Emerald', signal: 70 }, { name: 'Amethyst', signal: 65 }, { name: 'Aquamarine', signal: 45 },
      { name: 'Citrine', signal: 40 }, { name: 'Jade', signal: 65 }, { name: 'Moonstone', signal: 35 }, { name: 'Onyx', signal: 45 }, { name: 'Agate', signal: 45 },
      { name: 'Jasper', signal: 40 }, { name: 'Morganite', signal: 25 }, { name: 'Tiger\'s eye', signal: 30, aliases: ['tigers eye', 'tiger eye'] }, { name: 'Lapis lazuli', signal: 50, aliases: ['lapis'] },
    ],
    mustHave: ['Quartz', 'Diamond', 'Calcite', 'Gypsum', 'Talc', 'Pyrite', 'Galena', 'Fluorite', 'Topaz', 'Ruby', 'Emerald', 'Sapphire', 'Amethyst', 'Malachite', 'Hematite', 'Magnetite', 'Olivine', 'Halite', 'Graphite', 'Sulfur', 'Opal', 'Garnet', 'Turquoise', 'Jade', 'Mica', 'Feldspar', 'Apatite', 'Corundum', 'Beryl'],
  },
  {
    id: 'science-nobel-laureate', category: 'Science & Technology', prompt: 'Name a Nobel Prize laureate.',
    rules: 'Accept any person who has been awarded a Nobel Prize in any category (Physics, Chemistry, Physiology or Medicine, Literature, Peace, Economic Sciences), by their name. Organisations that received the Peace Prize, and people who were only nominated, do not count.',
    source: 'People in Wikidata who received a Nobel Prize (about 900).', pattern: '?item wdt:P31 wd:Q5 . ?item wdt:P166 ?aw . ?aw wdt:P279* wd:Q7191 .',
    mustHave: ['Albert Einstein', 'Marie Curie', 'Malala Yousafzai', 'Barack Obama', 'Winston Churchill', 'Ernest Hemingway', 'Mother Teresa', 'Martin Luther King Jr.', 'Nelson Mandela', 'Niels Bohr', 'Richard Feynman', 'Toni Morrison', 'Bob Dylan', 'Gabriel García Márquez', 'Alexander Fleming', 'Linus Pauling', 'Theodore Roosevelt', 'Rabindranath Tagore', 'Tenzin Gyatso, 14th Dalai Lama', 'Aung San Suu Kyi', 'Elie Wiesel', 'Kofi Annan', 'Albert Camus', 'Jean-Paul Sartre', 'Max Planck', 'Werner Heisenberg', 'Erwin Schrödinger', 'Daniel Kahneman', 'Samuel Beckett', 'Pablo Neruda', 'Kazuo Ishiguro', 'Wole Soyinka'],
  },
  {
    id: 'science-dinosaur', category: 'Science & Technology', prompt: 'Name a dinosaur.',
    rules: 'Accept any non-avian dinosaur by its genus name (Tyrannosaurus, Triceratops, Velociraptor) or by a well-known species name (Tyrannosaurus rex), and group names where every member is a dinosaur (such as sauropod, theropod or hadrosaur). Birds, pterosaurs, marine reptiles such as plesiosaurs, and other prehistoric animals such as mammoths do not count.',
    source: 'Genera below Dinosauria in Wikidata (walked level by level, not into birds), plus common group names added by hand.',
    fetch: () => speciesBelow(['Q430'], '', 'Q34740', { depth: 18, fossil: true, exclude: ['Q5113'], commonNames: false, fame: true }),
    extras: [{ name: 'Sauropod', signal: 50 }, { name: 'Theropod', signal: 50 }, { name: 'Ceratopsian', signal: 35 }, { name: 'Hadrosaur', signal: 30, aliases: ['duck-billed dinosaur'] }, { name: 'Raptor', signal: 40, aliases: ['raptors'] }, { name: 'Ankylosaur', signal: 25 }, { name: 'Stegosaur', signal: 25 }, { name: 'Ornithopod', signal: 15 }],
    extraAliases: { Tyrannosaurus: ['T. rex', 'T-rex', 'T rex', 'Tyrannosaurus rex', 'trex'], Brontosaurus: ['Apatosaurus excelsus'], Velociraptor: ['Velociraptor mongoliensis'], Triceratops: ['Triceratops horridus'] },
    mustHave: ['Tyrannosaurus', 'Triceratops', 'Velociraptor', 'Stegosaurus', 'Brachiosaurus', 'Diplodocus', 'Spinosaurus', 'Allosaurus', 'Ankylosaurus', 'Apatosaurus', 'Brontosaurus', 'Iguanodon', 'Parasaurolophus', 'Gallimimus', 'Pachycephalosaurus', 'Dilophosaurus', 'Carnotaurus', 'Giganotosaurus', 'Compsognathus', 'Oviraptor', 'Megalosaurus', 'Baryonyx', 'Utahraptor', 'Therizinosaurus', 'Argentinosaurus'],
  },
  // ---------------------------------------------------------------- Movies & TV
  {
    id: 'movies-movie', category: 'Movies & TV', prompt: 'Name a movie.',
    rules: 'Accept any feature-length film, in any language, released in cinemas or on streaming (Titanic, Parasite, The Godfather). TV series, single episodes, short films, and film franchises as a whole (for example "Star Wars" with no episode named) do not count.',
    source: 'Wikidata items that are a film or an animated film, known in at least 20 languages (about 9,000).', pattern: '{ ?item wdt:P31 wd:Q11424 } UNION { ?item wdt:P31 wd:Q202866 } .', minSignal: 20,
    mustHave: ['Titanic', 'The Godfather', 'Inception', 'Jaws', 'Parasite', 'Avatar', 'Casablanca', 'Forrest Gump', 'The Matrix', 'Pulp Fiction', 'Frozen', 'Toy Story', 'Spirited Away', 'Gladiator', 'Schindler\'s List', 'Psycho', 'Jurassic Park', 'The Lion King', 'Barbie', 'Oppenheimer', 'The Dark Knight', 'Gone with the Wind', 'Citizen Kane', 'Back to the Future', 'E.T. the Extra-Terrestrial', 'Finding Nemo', 'Shrek', 'Home Alone', 'Grease', 'The Shining', 'Fight Club', 'Harry Potter and the Philosopher\'s Stone', 'Black Panther', 'Joker'],
  },
  {
    id: 'movies-tv-series', category: 'Movies & TV', prompt: 'Name a TV series.',
    rules: 'Accept any television series, scripted or not, animated or live action, broadcast or streaming, in any language (Breaking Bad, Friends, Bluey, Squid Game). Single episodes, films, TV channels and networks do not count.',
    source: 'Wikidata items that are a television series or an animated one, known in at least 12 languages (about 3,500).', pattern: '{ ?item wdt:P31 wd:Q5398426 } UNION { ?item wdt:P31 wd:Q117467246 } UNION { ?item wdt:P31 wd:Q581714 } .', minSignal: 12,
    mustHave: ['Friends', 'Breaking Bad', 'The Office', 'Game of Thrones', 'Seinfeld', 'The Simpsons', 'Stranger Things', 'Doctor Who', 'The Sopranos', 'Squid Game', 'Bluey', 'Lost', 'The Wire', 'Sherlock', 'Black Mirror', 'Succession', 'The Crown', 'Money Heist', 'Peaky Blinders', 'The Big Bang Theory', 'How I Met Your Mother', 'South Park', 'Family Guy', 'SpongeBob SquarePants', 'The Walking Dead', 'Grey\'s Anatomy', 'The Mandalorian', 'Sesame Street', 'Mad Men', 'Fawlty Towers', 'Downton Abbey'],
  },
  {
    id: 'movies-simpsons-character', category: 'Movies & TV', prompt: 'Name a character from The Simpsons.',
    rules: 'Accept any named character who appears in The Simpsons TV series, main family, townspeople, recurring and one-off characters, by the name they are usually called (Homer, Mr. Burns, Apu, Sideshow Bob). Actors, writers and places do not count.',
    source: 'Fictional characters that Wikidata lists as present in The Simpsons (about 320).', pattern: '?item wdt:P1441 wd:Q886 . ?item wdt:P31/wdt:P279* wd:Q95074 .',
    mustHave: ['Homer Simpson', 'Bart Simpson', 'Marge Simpson', 'Lisa Simpson', 'Maggie Simpson', 'Ned Flanders', 'Mr. Burns', 'Moe Szyslak', 'Krusty the Clown', 'Milhouse Van Houten', 'Apu Nahasapeemapetilon', 'Sideshow Bob', 'Chief Wiggum', 'Ralph Wiggum', 'Nelson Muntz', 'Seymour Skinner', 'Comic Book Guy', 'Lenny Leonard', 'Carl Carlson', 'Barney Gumble', 'Grampa Simpson', 'Patty Bouvier', 'Selma Bouvier', 'Troy McClure', 'Mayor Quimby', 'Reverend Lovejoy', 'Waylon Smithers'],
  },
  // ---------------------------------------------------------------- Music
  {
    id: 'music-instrument', category: 'Music', prompt: 'Name a musical instrument.',
    rules: 'Accept any musical instrument, traditional or modern, acoustic or electronic, from any culture (guitar, sitar, theremin, didgeridoo). Instrument parts, music software, and the human voice do not count.',
    source: 'Wikidata items that are a kind of musical instrument, known in at least 2 languages (about 700).', pattern: '{ ?item wdt:P279+ wd:Q34379 } UNION { ?item wdt:P31 wd:Q34379 } .', minSignal: 2,
    mustHave: ['Guitar', 'Piano', 'Violin', 'Drum', 'Flute', 'Trumpet', 'Saxophone', 'Sitar', 'Harp', 'Cello', 'Accordion', 'Ukulele', 'Banjo', 'Theremin', 'Didgeridoo', 'Tuba', 'Harmonica', 'Bagpipes', 'Clarinet', 'Trombone', 'Organ', 'Synthesizer', 'Mandolin', 'Xylophone', 'Tambourine', 'Oboe', 'French horn', 'Bass guitar', 'Electric guitar', 'Double bass', 'Bongo', 'Triangle', 'Kazoo', 'Recorder'],
  },
  {
    id: 'music-rock-band', category: 'Music', prompt: 'Name a rock band.',
    rules: 'Accept any band that plays rock music in any of its styles (The Beatles, Nirvana, Queen, Radiohead, Metallica), by its usual name with or without "The". Solo artists, orchestras, and bands that are not rock (pure pop, hip hop or country acts) do not count.',
    source: 'Wikidata items that are a rock band, known in at least 6 languages (about 600). Wikidata files most famous bands as a plain "musical group" with a rock genre, so the well-known ones are added by hand (listed on the review sheet). A query for every band of any rock genre was tried and was too heavy for Wikidata (no answer after 8 minutes).',
    pattern: '?item wdt:P31 wd:Q5741069 .', minSignal: 6,
    mustHave: ['The Beatles', 'Queen', 'Led Zeppelin', 'Pink Floyd', 'Nirvana', 'Metallica', 'Radiohead', 'U2', 'The Rolling Stones', 'AC/DC', 'Foo Fighters', 'Coldplay', 'Green Day', 'Arctic Monkeys', 'Oasis', 'Guns N\' Roses', 'Aerosmith', 'The Who', 'Red Hot Chili Peppers', 'Pearl Jam', 'The Doors', 'Fleetwood Mac', 'Black Sabbath', 'Kiss', 'Van Halen', 'Rush', 'The Clash', 'Ramones', 'Blur', 'Muse', 'Linkin Park', 'My Chemical Romance', 'Deep Purple', 'Eagles', 'Bon Jovi'],
  },
  {
    id: 'music-beatles-song', category: 'Music', prompt: 'Name a song by The Beatles.',
    rules: 'Accept any song that The Beatles recorded and released as a group, including album tracks and covers they recorded (Let It Be, Yesterday, Hey Jude, Twist and Shout). Albums, solo songs by individual members, and songs they only wrote for other artists do not count.',
    source: 'Musical works that Wikidata lists as performed or composed by The Beatles (about 230).',
    pattern: '{ ?item wdt:P175 wd:Q1299 } UNION { ?item wdt:P86 wd:Q1299 } ?item wdt:P31/wdt:P279* wd:Q105543609 .',
    mustHave: ['Hey Jude', 'Let It Be', 'Yesterday', 'Come Together', 'Help!', 'Here Comes the Sun', 'Penny Lane', 'Something', 'Michelle', 'Blackbird', 'Twist and Shout', 'Eleanor Rigby', 'Get Back', 'Revolution', 'Yellow Submarine', 'A Hard Day\'s Night', 'Lucy in the Sky with Diamonds', 'Strawberry Fields Forever', 'Hello, Goodbye', 'Octopus\'s Garden', 'I Want to Hold Your Hand', 'Love Me Do', 'All You Need Is Love', 'Can\'t Buy Me Love', 'Day Tripper', 'Ticket to Ride', 'While My Guitar Gently Weeps', 'Helter Skelter', 'Back in the U.S.S.R.', 'With a Little Help from My Friends'],
  },
  // ---------------------------------------------------------------- Sports
  {
    id: 'sports-sport', category: 'Sports', prompt: 'Name a sport.',
    rules: 'Accept any sport or athletic competition practised anywhere in the world (football, kabaddi, curling, parkour, sumo), including Olympic, traditional and mind sports such as chess, and group names where every member is a sport (such as martial arts or winter sports). Leagues, governing bodies, competitions and events do not count. Video games, board games and card games on their own do not count.',
    source: 'Wikidata items that are a sport (an instance of "sport" or of any kind of sport such as team sport or combat sport), known in at least 5 languages; leagues, governing bodies and the family name "football" removed. Group names such as martial arts are added by hand.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q349 .', minSignal: 5,
    skip: (c) => /^(football|soccer)$/i.test(c.name) || /\b(League|Association|Federation|Confederation|Championships?|Cup|Grand Prix|Games|Tournament|Olympics|Conference|Series|Tour)\b/i.test(c.name)
      // single events and editions (a year, a stage, a named race), football leagues, and gambling or word games that are not sports
      || /^\d{4}\b|, stage \d|\bMarathon$|\bStakes$|\bTrophy$|\bRock Master$|^(La Liga|Serie A|Ligue 1|Bundesliga|Eredivisie|Primera División)$|^(blackjack|cockfight|sudoku|Scrabble|roulette|baccarat)$/i.test(c.name),
    mustHave: ['Association football', 'Basketball', 'Tennis', 'Cricket', 'Golf', 'Rugby union', 'Baseball', 'Swimming', 'Athletics', 'Boxing', 'Cycling', 'Volleyball', 'Badminton', 'Table tennis', 'Ice hockey', 'Curling', 'Kabaddi', 'Sumo', 'Surfing', 'Skiing', 'Archery', 'Fencing', 'Judo', 'Gymnastics', 'Rowing', 'Skateboarding', 'Chess', 'American football', 'Wrestling', 'Karate', 'Taekwondo', 'Snooker', 'Darts', 'Handball', 'Field hockey', 'Netball', 'Lacrosse', 'Rugby league', 'Formula One'],
  },
  {
    id: 'sports-f1-driver', category: 'Sports', prompt: 'Name a Formula One driver.',
    rules: 'Accept any driver who has taken part in a Formula One World Championship race, at any time, by the name they are known by (Hamilton, Ayrton Senna, Max Verstappen). Drivers who only raced in other series, team principals and engineers do not count.',
    source: 'People in Wikidata whose occupation is Formula One driver, known in at least 3 languages (about 1,000).', pattern: '?item wdt:P106 wd:Q10841764 .', minSignal: 3,
    mustHave: ['Lewis Hamilton', 'Michael Schumacher', 'Ayrton Senna', 'Max Verstappen', 'Sebastian Vettel', 'Alain Prost', 'Fernando Alonso', 'Juan Manuel Fangio', 'Niki Lauda', 'Kimi Räikkönen', 'Mika Häkkinen', 'Jenson Button', 'Nico Rosberg', 'Charles Leclerc', 'Lando Norris', 'Oscar Piastri', 'George Russell', 'Damon Hill', 'Nigel Mansell', 'Jackie Stewart', 'Jim Clark', 'Nelson Piquet', 'Jacques Villeneuve', 'Mark Webber', 'Daniel Ricciardo', 'Carlos Sainz Jr.', 'Sergio Pérez', 'Valtteri Bottas', 'Felipe Massa', 'James Hunt', 'Stirling Moss'],
  },
  {
    id: 'sports-football-club', category: 'Sports', prompt: 'Name an association football (soccer) club.',
    rules: 'Accept any association football club in any country, professional or amateur, by its usual name (Real Madrid, Boca Juniors, Arsenal, FC Barcelona or just Barcelona). National teams, other football codes (American, Australian, rugby) and clubs of other sports do not count.',
    source: 'Wikidata items that are an association football club, known in at least 12 languages (about 4,000).', pattern: '?item wdt:P31 wd:Q476028 .', minSignal: 12, alsoWritten: clubForms,
    mustHave: ['Real Madrid CF', 'FC Barcelona', 'Manchester United F.C.', 'Liverpool F.C.', 'Arsenal F.C.', 'Chelsea F.C.', 'FC Bayern Munich', 'Juventus FC', 'AC Milan', 'Inter Milan', 'Paris Saint-Germain F.C.', 'Boca Juniors', 'AFC Ajax', 'Celtic F.C.', 'Borussia Dortmund', 'Flamengo', 'Galatasaray S.K.', 'Tottenham Hotspur F.C.', 'Manchester City F.C.', 'River Plate', 'Atlético Madrid', 'S.L. Benfica', 'FC Porto', 'Santos FC', 'S.S.C. Napoli', 'A.S. Roma', 'Olympique de Marseille', 'Rangers F.C.', 'Newcastle United F.C.', 'Everton F.C.', 'Leeds United F.C.', 'Aston Villa F.C.', 'West Ham United F.C.', 'Leicester City F.C.'],
  },
  // ---------------------------------------------------------------- Transport & Vehicles
  {
    id: 'transport-car-brand', category: 'Transport & Vehicles', prompt: 'Name a car brand.',
    rules: 'Accept any company or brand that makes or made passenger cars, current or defunct (Toyota, Ferrari, Saab, Tesla, Lada). Individual models (Corolla), motorcycle-only makers, car dealers and car-rental companies do not count.',
    source: 'Wikidata items that are an automobile manufacturer, known in at least 3 languages (about 1,000).', pattern: '?item wdt:P31 wd:Q786820 .', minSignal: 3, alsoWritten: carForms,
    mustHave: ['Toyota', 'Ford', 'Honda', 'BMW', 'Mercedes-Benz', 'Volkswagen', 'Tesla', 'Ferrari', 'Lamborghini', 'Porsche', 'Audi', 'Nissan', 'Hyundai', 'Kia', 'Volvo', 'Jaguar', 'Tata Motors', 'Saab', 'Subaru', 'Mazda', 'Chevrolet', 'Peugeot', 'Renault', 'Fiat', 'Rolls-Royce', 'Bentley', 'Aston Martin', 'Bugatti', 'McLaren', 'Maserati', 'Lexus', 'Jeep', 'Dodge', 'Suzuki', 'Mitsubishi', 'Land Rover', 'Mini', 'Citroën', 'Škoda', 'Lotus Cars'],
  },
  {
    id: 'transport-airport', category: 'Transport & Vehicles', prompt: 'Name an airport.',
    rules: 'Accept any airport in the world, by its name (Heathrow, Changi, Schiphol), its name with the word "Airport", or its three-letter IATA code (JFK, LAX). Military air bases that are not open to the public, heliports and airlines do not count.',
    source: 'Wikidata items that are an airport or any kind of airport (international, regional and so on), known in at least 8 languages; air bases and heliports removed; IATA codes are aliases.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q1248784 .', minSignal: 8, codeProp: 'P238', alsoWritten: airportForms,
    skip: (c) => /\b(Air Force Base|Air Base|AFB|Airbase|Army Airfield|Naval Air Station|Heliport|Helipad|Seaplane|Spaceport)\b/i.test(c.name),
    mustHave: ['LHR', 'JFK', 'SIN', 'AMS', 'NRT', 'LAX', 'ORD', 'DXB', 'CDG', 'ATL', 'FRA', 'SYD', 'LGW', 'ICN', 'HND', 'HKG', 'PEK', 'MUC', 'MAD', 'IST', 'YYZ', 'SFO', 'DEN', 'DOH', 'BKK', 'DEL', 'MEL', 'MIA', 'ZRH', 'DUB'],
  },
  // ---------------------------------------------------------------- Miscellaneous
  {
    id: 'misc-occupation', category: 'Miscellaneous', prompt: 'Name an occupation.',
    rules: 'Accept any occupation, job or profession that people are or were paid to do, ordinary or rare, modern or historical (nurse, plumber, astronaut, blacksmith, lighthouse keeper). Hobbies, unpaid roles, titles of nobility and generic words such as "worker" or "job" do not count.',
    source: 'Wikidata items that are an occupation or a kind of one, known in at least 6 languages (about 2,500).', pattern: '?item wdt:P31/wdt:P279* wd:Q12737077 .', minSignal: 6, skip: (c) => /^translation$/i.test(c.name),
    mustHave: ['Nurse', 'Teacher', 'Plumber', 'Physician', 'Engineer', 'Firefighter', 'Police officer', 'Lawyer', 'Farmer', 'Chef', 'Electrician', 'Carpenter', 'Pilot', 'Astronaut', 'Blacksmith', 'Accountant', 'Dentist', 'Pharmacist', 'Baker', 'Librarian', 'Actor', 'Writer', 'Soldier', 'Scientist', 'Mechanic', 'Software developer', 'Journalist', 'Musician', 'Waiter', 'Barber', 'Cashier', 'Taxi driver', 'Janitor', 'Secretary', 'Architect', 'Judge'],
  },
]
