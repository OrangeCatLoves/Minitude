/**
 * Batch 5: 50 new questions, none of them a class we already have (see batch1.ts to batch4.ts and the live bank of 200).
 * Same recipe as before (newq.ts): a Wikidata class or occupation, a minimum number of Wikipedia languages so the list has a head
 * people know, and `mustHave` = the answers a casual English-speaking player thinks of first, most obvious first.
 * Lessons applied from Batches 2 to 4 (docs/ANSWER_LISTS.md): every recipe is preflighted against its head before the long fetch; people are
 * found by occupation, kept only if human and if Wikidata's one-line description names the activity; `skip` removes answers of the wrong class;
 * the ids are checked against the live bank AND the rejected questions.
 * Build with: npx tsx src/expand/newq.ts --batch batch5 --out C:/Users/weibi/minitude/list-build/batch5
 */
import { speciesBelow } from './build'
import type { NewQuestion } from './newq'
import { anyInstance, anyKind, anyOf, HUMAN, kindOf, latinOnly, nameIs, NOT_EXTINCT, notDescribedAs, occupation, occupationUnder, personForms, strip } from './recipes'

/** dishes of a cuisine: filed under the cuisine (P2012), part of it (P361, regional cuisines are parts or subclasses of it) or from its country (P495), and ONLY if the item is a dish (ingredients, techniques and products leaked in otherwise) */
const CUISINE = (cuisine: string, country: string) => `{ { ?item wdt:P2012 ?cu . ?cu (wdt:P279|wdt:P361)* wd:${cuisine} } UNION { ?item wdt:P361 wd:${cuisine} } UNION { ?item wdt:P495 wd:${country} } } . { ?item wdt:P31/wdt:P279* wd:Q746549 } UNION { ?item wdt:P279+ wd:Q746549 } .`

export const BATCH: NewQuestion[] = [
  // ================================================================ Animals & Nature
  {
    id: 'animals-parrot', category: 'Animals & Nature', prompt: 'Name a parrot.',
    rules: 'Accept any kind of parrot, macaw, cockatoo, parakeet, lorikeet or lovebird by its common or scientific name (African grey parrot, budgerigar, cockatiel, scarlet macaw, sulphur-crested cockatoo, kakapo, kea, rainbow lorikeet, eclectus parrot), or a group name where every member is a parrot (macaw, cockatoo, parakeet, lorikeet, lovebird). Other birds do not count.',
    source: 'Species of the order of parrots (Psittaciformes) in Wikidata, without extinct ones, by their English common names, plus group names added by hand.',
    fetch: () => speciesBelow(['Q31431'], NOT_EXTINCT, 'Q7432', { depth: 9, commonNames: true, fame: true }), commonNames: true, skip: latinOnly,
    extras: [
      { name: 'Parrot', signal: 150, aliases: ['Parrots'] }, { name: 'Macaw', signal: 110, aliases: ['Macaws'] }, { name: 'Cockatoo', signal: 110, aliases: ['Cockatoos'] }, { name: 'Parakeet', signal: 100, aliases: ['Parakeets', 'Parrakeet'] },
      { name: 'Lorikeet', signal: 70, aliases: ['Lorikeets'] }, { name: 'Lovebird', signal: 90, aliases: ['Lovebirds'] }, { name: 'Amazon parrot', signal: 70, aliases: ['Amazon'] }, { name: 'Conure', signal: 60, aliases: ['Conures'] },
    ],
    extraAliases: { 'Monk parakeet': ['Quaker parrot', 'Quaker parakeet'], Budgerigar: ['Budgie', 'Budgerigar parakeet', 'Shell parakeet'], Cockatiel: ['Cockatiel parrot'] },
    mustHave: ['Parrot', 'Macaw', 'Cockatoo', 'Budgerigar', 'Cockatiel', 'African grey parrot', 'Scarlet macaw', 'Blue-and-yellow macaw', 'Hyacinth macaw', 'Sulphur-crested cockatoo', 'Rainbow lorikeet', 'Kakapo', 'Kea', 'Eclectus parrot', 'Lovebird', 'Monk parakeet', 'Rose-ringed parakeet', 'Galah', 'Parakeet', 'Lorikeet', 'Amazon parrot', 'Senegal parrot', 'Green-winged macaw', 'Palm cockatoo', "Major Mitchell's cockatoo", 'Yellow-crested cockatoo', 'Alexandrine parakeet', 'Conure', 'Sun conure', 'Pionus', 'Blue-fronted amazon', 'Military macaw', 'Moluccan cockatoo', 'Umbrella cockatoo', 'Gang-gang cockatoo'],
    rename: ['African grey parrot', 'Kakapo', 'Galah'],
  },
  {
    id: 'animals-marsupial', category: 'Animals & Nature', prompt: 'Name a marsupial.',
    rules: 'Accept any marsupial, the mammals that carry their young in a pouch (kangaroo, koala, wombat, wallaby, Tasmanian devil, opossum, possum, sugar glider, quokka, numbat, bandicoot, quoll, bilby, thylacine), by its common or scientific name, or a group name where every member is a marsupial. Other mammals, such as rabbits and monotremes like the platypus and echidna, do not count.',
    source: 'Species of the marsupials (infraclass Marsupialia) in Wikidata, without extinct ones, by their English common names, plus group names and the thylacine added by hand.',
    fetch: () => speciesBelow(['Q25336'], NOT_EXTINCT, 'Q7432', { depth: 9, commonNames: true, fame: true }), commonNames: true, skip: latinOnly,
    extras: [
      { name: 'Kangaroo', signal: 150, aliases: ['Kangaroos', 'Roo'] }, { name: 'Wallaby', signal: 100, aliases: ['Wallabies'] }, { name: 'Possum', signal: 100, aliases: ['Possums'] }, { name: 'Opossum', signal: 100, aliases: ['Opossums'] },
      { name: 'Wombat', signal: 100, aliases: ['Wombats'] }, { name: 'Bandicoot', signal: 70, aliases: ['Bandicoots'] }, { name: 'Quoll', signal: 60, aliases: ['Quolls'] }, { name: 'Thylacine', signal: 110, aliases: ['Tasmanian tiger', 'Tasmanian wolf', 'Thylacinus cynocephalus'] },
      { name: 'Tree kangaroo', signal: 70 }, { name: 'Cuscus', signal: 50 }, { name: 'Marsupial', signal: 60 }, { name: 'Dunnart', signal: 40 }, { name: 'Pademelon', signal: 40 }, { name: 'Bettong', signal: 40 },
    ],
    mustHave: ['Kangaroo', 'Koala', 'Wombat', 'Wallaby', 'Tasmanian devil', 'Opossum', 'Possum', 'Sugar glider', 'Quokka', 'Numbat', 'Bandicoot', 'Quoll', 'Bilby', 'Red kangaroo', 'Eastern grey kangaroo', 'Thylacine', 'Tree kangaroo', 'Virginia opossum', 'Common brushtail possum', 'Wallaroo', 'Marsupial mole', 'Cuscus', 'Potoroo', 'Bettong', 'Pademelon', 'Dunnart', 'Antechinus', 'Honey possum', 'Common ringtail possum', 'Common wombat', 'Southern hairy-nosed wombat', 'Yapok', 'Monito del monte', 'Rock wallaby'],
    rename: ['Tasmanian devil', 'Virginia opossum', 'Sugar glider', 'Marsupial mole'],
  },
  {
    id: 'animals-rodent', category: 'Animals & Nature', prompt: 'Name a rodent.',
    rules: 'Accept any rodent by its common or scientific name (house mouse, brown rat, squirrel, hamster, guinea pig, beaver, capybara, porcupine, chipmunk, gerbil, chinchilla, lemming, prairie dog, naked mole-rat), or a group name where every member is a rodent (mouse, rat, squirrel, vole, gopher). Rabbits, hares, hedgehogs, shrews, bats and mice from cartoons do not count.',
    source: 'Species of the order of rodents (Rodentia) in Wikidata, without extinct ones, by their English common names, plus group names added by hand.',
    fetch: () => speciesBelow(['Q10850'], NOT_EXTINCT, 'Q7432', { depth: 10, commonNames: true, fame: true }), commonNames: true, skip: latinOnly,
    extras: [
      { name: 'Mouse', signal: 150, aliases: ['Mice'] }, { name: 'Rat', signal: 150, aliases: ['Rats'] }, { name: 'Squirrel', signal: 140, aliases: ['Squirrels'] }, { name: 'Hamster', signal: 120, aliases: ['Hamsters'] },
      { name: 'Vole', signal: 70, aliases: ['Voles'] }, { name: 'Gopher', signal: 70, aliases: ['Gophers'] }, { name: 'Porcupine', signal: 110, aliases: ['Porcupines'] }, { name: 'Marmot', signal: 90, aliases: ['Marmots'] }, { name: 'Gerbil', signal: 90, aliases: ['Gerbils'] },
      { name: 'Chipmunk', signal: 100, aliases: ['Chipmunks'] }, { name: 'Lemming', signal: 90, aliases: ['Lemmings'] }, { name: 'Dormouse', signal: 70, aliases: ['Dormice'] }, { name: 'Guinea pig', signal: 130, aliases: ['Cavy', 'Guinea pigs'] }, { name: 'Rodent', signal: 60, aliases: ['Rodents'] },
    ],
    mustHave: ['Mouse', 'Rat', 'Squirrel', 'Hamster', 'Guinea pig', 'Beaver', 'Capybara', 'Porcupine', 'Chipmunk', 'Gerbil', 'Chinchilla', 'Lemming', 'Vole', 'Groundhog', 'Prairie dog', 'Marmot', 'Muskrat', 'Nutria', 'Dormouse', 'Gopher', 'House mouse', 'Brown rat', 'Black rat', 'Red squirrel', 'Eastern gray squirrel', 'Naked mole-rat', 'Kangaroo rat', 'Flying squirrel', 'Ground squirrel', 'Field mouse', 'Harvest mouse', 'Syrian hamster', 'Degu', 'Agouti', 'Paca', 'Coypu'],
    rename: ['House mouse', 'Brown rat', 'Black rat', 'Beaver', 'Groundhog', 'Nutria'],
  },
  {
    id: 'animals-whale-dolphin', category: 'Animals & Nature', prompt: 'Name a whale, dolphin or porpoise.',
    rules: 'Accept any whale, dolphin or porpoise by its common or scientific name (blue whale, humpback whale, orca or killer whale, sperm whale, bottlenose dolphin, beluga, narwhal, minke whale, harbour porpoise, pilot whale), or the group names whale, dolphin and porpoise. Seals, sea lions, manatees, sharks and fish do not count.',
    source: 'Species of whales, dolphins and porpoises (the cetaceans) in Wikidata, without extinct ones, by their English common names, plus group names added by hand.',
    fetch: () => speciesBelow(['Q160'], NOT_EXTINCT, 'Q7432', { depth: 9, commonNames: true, fame: true }), commonNames: true, skip: latinOnly,
    extras: [
      { name: 'Whale', signal: 150, aliases: ['Whales'] }, { name: 'Dolphin', signal: 150, aliases: ['Dolphins'] }, { name: 'Porpoise', signal: 90, aliases: ['Porpoises'] }, { name: 'Orca', signal: 130, aliases: ['Killer whale', 'Orcinus orca'] },
      { name: 'Beaked whale', signal: 50 }, { name: 'River dolphin', signal: 50 }, { name: 'Right whale', signal: 60 }, { name: 'Irrawaddy dolphin', signal: 50 }, { name: 'Atlantic spotted dolphin', signal: 50 },
    ],
    mustHave: ['Blue whale', 'Humpback whale', 'Orca', 'Sperm whale', 'Bottlenose dolphin', 'Beluga', 'Narwhal', 'Minke whale', 'Fin whale', 'Gray whale', 'Right whale', 'Bowhead whale', 'Pilot whale', 'Harbour porpoise', 'Common dolphin', 'Spinner dolphin', "Risso's dolphin", 'Sei whale', "Bryde's whale", 'Amazon river dolphin', 'Vaquita', 'False killer whale', 'Dusky dolphin', "Hector's dolphin", 'Pygmy sperm whale', "Dall's porpoise", 'Striped dolphin', 'Whale', 'Dolphin', 'Porpoise'],
    rename: ['Orca', 'Beluga', 'Narwhal', 'Humpback whale', 'Gray whale', 'Bottlenose dolphin', 'Fin whale', "Risso's dolphin", 'Bowhead whale', 'Sei whale'],
  },
  {
    id: 'animals-cattle-breed', category: 'Animals & Nature', prompt: 'Name a breed of cattle.',
    rules: 'Accept any breed of domestic cattle, for beef or milk (Holstein Friesian, Angus, Hereford, Jersey, Guernsey, Highland, Charolais, Limousin, Simmental, Brahman, Wagyu, Texas Longhorn, Brown Swiss, Ayrshire, Belted Galloway). Breeds of other animals, wild cattle such as bison and yak, and the word "cow" on its own do not count.',
    source: 'Wikidata items that are a cattle breed, known in at least 3 languages.', pattern: '?item wdt:P31 wd:Q12045585 .', minSignal: 3,
    alsoWritten: strip(/ (cattle|Cattle)$/),
    extraAliases: { Holstein: ['Holstein Friesian', 'Holstein-Friesian', 'Friesian', 'Holstein cattle'], 'Aberdeen Angus': ['Angus', 'Black Angus', 'Angus cattle'], 'Ankole-Watusi': ['Watusi', 'Ankole'], 'Gyr Cattle': ['Gir', 'Gir cattle'], 'Texas Longhorn': ['Longhorn', 'Longhorn cattle'], 'Spanish Fighting Bull': ['Fighting bull', 'Toro bravo'], Braunvieh: ['Brown Swiss', 'Brown Swiss cattle'], 'Belgian Blue': ['Belgian Blue cattle'] },
    mustHave: ['Holstein', 'Aberdeen Angus', 'Hereford', 'Highland cattle', 'Wagyu', 'Jersey cattle', 'Brahman cattle', 'Simmental cattle', 'Ayrshire cattle', 'Guernsey cattle', 'Charolais', 'Limousin', 'Texas Longhorn', 'Belgian Blue', 'Shorthorn', 'Galloway cattle', 'Braunvieh', 'Dexter cattle', 'Chianina', 'Piedmontese', 'Ankole-Watusi', 'Gyr Cattle', 'Sahiwal cattle', 'Santa Gertrudis cattle', 'Belted Galloway', 'Red Poll', 'Welsh Black', 'Brangus', 'Murray Grey', 'Nelore'],
    skip: nameIs(/^(cattle|cow|bull|ox|oxen|zebu|auroch|aurochs|Kobe beef|beef cattle|beefalo|dairy cattle)$/i),
  },

  // ================================================================ Food
  {
    id: 'food-chinese-dish', category: 'Food', prompt: 'Name a Chinese dish.',
    rules: 'Accept any dish, snack, soup or sweet from Chinese cuisine, from any region (Kung Pao chicken, fried rice, Peking duck, dim sum, chow mein, hot pot, mapo tofu, wonton soup, spring roll, xiaolongbao, congee). Japanese or Korean food, drinks, and ingredients on their own do not count.',
    source: 'Wikidata dishes that belong to Chinese cuisine (or one of its regional cuisines) or come from China, known in at least 3 languages.', pattern: CUISINE('Q10876842', 'Q148'), minSignal: 3,
    rename: ['Sweet and sour pork', 'Mapo tofu', 'Baozi', 'Dumpling'],
    mustHave: ['Fried rice', 'Chow mein', 'Kung Pao chicken', 'Sweet and sour pork', 'Peking duck', 'Dim sum', 'Spring roll', 'Dumpling', 'Wonton soup', 'Hot pot', 'Mapo tofu', "General Tso's chicken", 'Egg roll', 'Char siu', 'Congee', 'Lo mein', 'Xiaolongbao', 'Baozi', 'Hot and sour soup', 'Egg drop soup', 'Crab rangoon', 'Chop suey', 'Century egg', 'Zongzi', 'Tangyuan', 'Mooncake', 'Jiaozi', 'Dan dan noodles', 'Orange chicken', 'Beef and broccoli', 'Wonton', 'Siu mai', 'Har gow', 'Char kway teow', 'Cheung fun', 'Scallion pancake', 'Tofu', 'Moo shu pork', 'Twice cooked pork', 'Chinese roast duck'],
    skip: nameIs(/cuisine$|^(soy sauce|tea|rice|noodle|noodles|fortune cookie|chopsticks|wok|ramen|miso soup|jajangmyeon|pierogi|momo|pilaf|katsuobushi|caldo verde|shrimp paste|fish sauce|grass jelly|tofu|brittle|takuan|takikomi gohan|narutomaki|head cheese|dark soy sauce|pizza in China)$/i),
  },
  {
    id: 'food-italian-dish', category: 'Food', prompt: 'Name an Italian dish.',
    rules: 'Accept any dish, snack or sweet from Italian cuisine (pizza, lasagna, spaghetti carbonara, risotto, gnocchi, ravioli, tiramisu, minestrone, osso buco, bruschetta, cannoli, panna cotta, arancini). Pasta shapes on their own, cheeses, drinks and ingredients do not count.',
    source: 'Wikidata dishes that belong to Italian cuisine or come from Italy, known in at least 3 languages.', pattern: CUISINE('Q192786', 'Q38'), minSignal: 3, alsoWritten: strip(/ PAT$/),
    mustHave: ['Pizza', 'Spaghetti carbonara', 'Lasagna', 'Risotto', 'Spaghetti bolognese', 'Gnocchi', 'Ravioli', 'Tiramisu', 'Margherita pizza', 'Minestrone', 'Osso buco', 'Chicken parmigiana', 'Fettuccine Alfredo', 'Bruschetta', 'Panna cotta', 'Cannoli', 'Gelato', 'Caprese salad', 'Calzone', 'Arancini', 'Focaccia', 'Polenta', 'Cacio e pepe', 'Saltimbocca', 'Panettone', 'Cassata', 'Affogato', 'Panzanella', 'Ribollita', 'Spaghetti alle vongole', 'Pasta e fagioli', 'Carpaccio', 'Vitello tonnato', 'Eggplant parmigiana', 'Tortellini', 'Cappelletti', 'Frittata', 'Stromboli', 'Pizza Napoletana', 'Pasta alla Norma'],
    skip: nameIs(/cuisine$|^(pasta|olive oil|parmesan|mozzarella|espresso|cappuccino|coffee|wine|prosciutto|salami|pesto|balsamic vinegar|ricotta|mascarpone|gorgonzola|pecorino romano|Parmigiano-Reggiano|latte|limoncello|grappa|amaro|Campari|Aperol|Chianti|Nutella|Kinder Surprise|Ferrero Rocher|Caesar salad)$/i),
  },
  {
    id: 'food-cake', category: 'Food', prompt: 'Name a cake.',
    rules: 'Accept any kind of cake, from any country (chocolate cake, cheesecake, carrot cake, red velvet cake, Victoria sponge, Black Forest gateau, birthday cake, wedding cake, fruitcake, pound cake, angel food cake, cupcake, Bundt cake, Swiss roll). Biscuits, bread, pastries, pies and the word "cake" on its own do not count.',
    source: 'Wikidata items that are a cake or a kind of one, known in at least 3 languages.', pattern: kindOf('Q13276'), minSignal: 3, alsoWritten: strip(/ PAT$/),
    mustHave: ['Chocolate cake', 'Cheesecake', 'Carrot cake', 'Red velvet cake', 'Sponge cake', 'Victoria sponge cake', 'Black Forest gateau', 'Birthday cake', 'Wedding cake', 'Fruitcake', 'Pound cake', 'Angel food cake', "Devil's food cake", 'Cupcake', 'Bundt cake', 'Swiss roll', 'Lemon drizzle cake', 'Battenberg cake', 'Coffee cake', 'Marble cake', 'Funnel cake', 'Lava cake', 'Madeleine', 'Tres leches cake', 'Upside-down cake', 'Banana cake', 'Genoise', 'Sachertorte', 'Opera cake', 'Yule log', 'Fondant fancy', 'Lamington', 'Baumkuchen', 'Kuchen', 'Stollen', 'Simnel cake', 'Dundee cake', 'Eccles cake', 'Ice cream cake'],
    skip: nameIs(/^(cake|pie|bread|biscuit|cookie|pastry|pancake|brownie|muffin|waffle|doughnut|tiramisu|tart|cake decorating|layer cake|dessert|mochi|daifuku|tteok|ketupat|nian gao|chimaki|puto|kue mangkok|Fanta Cake|rice cake)$/i),
  },
  {
    id: 'food-cookie', category: 'Food', prompt: 'Name a cookie or biscuit.',
    rules: 'Accept any kind of cookie or biscuit, sweet or savoury, from any country (chocolate chip cookie, Oreo, shortbread, gingerbread, digestive biscuit, macaron, biscotti, snickerdoodle, oatmeal cookie, Hobnob, Jaffa Cake, fortune cookie, Tim Tam). Cakes, crackers meant as a cracker, bread and the word "cookie" on its own do not count.',
    source: 'Wikidata items that are a cookie or biscuit or a kind of one, known in at least 3 languages.', pattern: anyKind('Q13266', 'Q13270'), minSignal: 3, alsoWritten: strip(/ PAT$/),
    mustHave: ['Chocolate chip cookie', 'Oreo', 'Shortbread', 'Gingerbread', 'Digestive biscuit', 'Macaron', 'Biscotti', 'Snickerdoodle', 'Oatmeal raisin cookie', 'Hobnob', 'Jaffa Cake', 'Fortune cookie', 'Tim Tam', 'Sugar cookie', 'Peanut butter cookie', 'Wafer', 'Ladyfinger', 'Rich tea', 'Custard cream', 'Bourbon biscuit', 'Fig Newton', 'Graham cracker', 'Nilla Wafers', 'Pepperidge Farm Milano', 'Stroopwafel', 'Amaretti', 'Speculoos', 'Lotus Biscoff', 'Ginger nut', 'Anzac biscuit', 'Florentine', 'Black and white cookie', 'Thin Mints', 'Chips Ahoy!', 'Pocky', 'Choco Pie', 'Alfajor', 'Rugelach', 'Linzer cookie', 'Madeleine'],
    skip: nameIs(/^(cookie|biscuit|cracker|crackers|cookies|biscuits|sacramental bread|hardtack|crispbread|rusk|Special K|Wheat Thins|arare|hina-arare|senbei|souka senbei|egg shrimp cracker|oatcake)$/i),
  },

  // ================================================================ History & Mythology
  {
    id: 'history-greek-myth', category: 'History & Mythology', prompt: 'Name a character from Greek mythology.',
    rules: 'Accept any god, goddess, Titan, hero, monster, nymph, mortal or other figure from ancient Greek mythology (Zeus, Athena, Hercules, Achilles, Odysseus, Medusa, Perseus, Persephone, Hades, Poseidon, Minotaur, Cerberus), by the Greek or the Roman name (Heracles or Hercules, Odysseus or Ulysses). Characters from other mythologies, such as Thor or Anubis, and real historical people do not count.',
    source: 'Wikidata items that are a mythological Greek character, known in at least 6 languages, plus the Roman names of the main gods as other spellings.', pattern: anyKind('Q22988604', 'Q22989102'), minSignal: 6,
    extraAliases: { Zeus: ['Jupiter'], Hera: ['Juno'], Poseidon: ['Neptune'], Athena: ['Minerva'], Ares: ['Mars'], Aphrodite: ['Venus'], Artemis: ['Diana'], Hermes: ['Mercury'], Hephaestus: ['Vulcan'], Demeter: ['Ceres'], Hades: ['Pluto'], Dionysus: ['Bacchus'], Eros: ['Cupid'], Persephone: ['Proserpina'], Heracles: ['Hercules'], Odysseus: ['Ulysses'], Cronus: ['Saturn'], Rhea: ['Ops'], Hestia: ['Vesta'], Nike: ['Victoria'] },
    mustHave: ['Zeus', 'Athena', 'Apollo', 'Poseidon', 'Hades', 'Heracles', 'Achilles', 'Odysseus', 'Medusa', 'Perseus', 'Persephone', 'Artemis', 'Aphrodite', 'Ares', 'Hermes', 'Hera', 'Demeter', 'Dionysus', 'Hephaestus', 'Minotaur', 'Cerberus', 'Theseus', 'Orpheus', 'Pandora', 'Prometheus', 'Icarus', 'Daedalus', 'Narcissus', 'Oedipus', 'Helen of Troy', 'Paris', 'Hector', 'Agamemnon', 'Jason', 'Medea', 'Atlas', 'Cronus', 'Gaia', 'Uranus', 'Eros', 'Pan', 'Hydra', 'Cyclops', 'Pegasus', 'Sphinx', 'Midas', 'Antigone', 'Circe', 'Calypso', 'Eurydice', 'Penelope', 'Sisyphus', 'Tantalus', 'Charon', 'Nike', 'Hestia'],
    skip: nameIs(/^(Greek mythology|Greek gods|Olympian gods|Twelve Olympians)$/i),
  },
  {
    id: 'history-ancient-city', category: 'History & Mythology', prompt: 'Name a city of the ancient world.',
    rules: 'Accept any city that existed in the ancient world, whether it is now in ruins or still inhabited (Rome, Athens, Babylon, Troy, Pompeii, Carthage, Sparta, Alexandria, Thebes, Persepolis, Petra, Ephesus, Knossos, Mycenae, Ur, Nineveh, Mohenjo-daro, Teotihuacan, Tikal). Cities founded after about 500 CE, and countries or empires on their own, do not count.',
    source: 'Wikidata items that are an ancient city, known in at least 8 languages, plus the best-known ones added by hand.', pattern: '?item wdt:P31 wd:Q15661340 .', minSignal: 8,
    mustHave: ['Rome', 'Athens', 'Babylon', 'Troy', 'Pompeii', 'Carthage', 'Sparta', 'Alexandria', 'Thebes', 'Persepolis', 'Petra', 'Ephesus', 'Knossos', 'Mycenae', 'Ur', 'Nineveh', 'Mohenjo-daro', 'Teotihuacan', 'Tikal', 'Jerusalem', 'Memphis', 'Corinth', 'Herculaneum', 'Byzantium', 'Antioch', 'Tyre', 'Damascus', 'Uruk', 'Delphi', 'Olympia', 'Palmyra', 'Susa', 'Chichen Itza', 'Harappa', 'Luxor', 'Syracuse', 'Constantinople', 'Pergamon', 'Miletus', 'Tiryns', 'Ostia Antica', 'Leptis Magna', 'Timgad', 'Ctesiphon', 'Nippur', 'Hattusa'],
    skip: nameIs(/^(ancient city|city|polis|ancient Greek city|Hellenistic city|Cairo|Machu Picchu|Kamakura|Angkor|Bagan|Cusco)$/i),
  },
  {
    id: 'history-military-leader', category: 'History & Mythology', prompt: 'Name a famous military leader or general.',
    rules: 'Accept any real military commander, general, admiral or warlord, from any period or country (Napoleon Bonaparte, Alexander the Great, Julius Caesar, Hannibal, Genghis Khan, Attila, Joan of Arc, the Duke of Wellington, George Patton, Dwight Eisenhower, Erwin Rommel, Saladin), by their usual name or surname. Politicians who never led an army, and fictional commanders, do not count.',
    source: 'People in Wikidata whose occupation is military leader, military officer or general and whose description names the military, known in at least 15 languages.', pattern: occupation('Q1402561', 'Q189290', 'Q83460') + HUMAN, minSignal: 15, alsoWritten: personForms,
    skip: anyOf(notDescribedAs(/military|army|general|admiral|commander|warlord|marshal|conquer|soldier|warrior|naval|officer|Mongol|Hun /i), nameIs(/^(James Stewart|Pol Pot|Adolf Eichmann|Alfred Thayer Maan)$/i)),
    extras: [{ name: 'Alfred Thayer Mahan', signal: 30 }],
    extraAliases: { Napoleon: ['Napoleon Bonaparte', 'Napoleon I', 'Bonaparte'] },
    mustHave: ['Napoleon', 'Alexander the Great', 'Julius Caesar', 'Hannibal', 'Genghis Khan', 'Attila', 'Joan of Arc', 'Arthur Wellesley, 1st Duke of Wellington', 'George S. Patton', 'Dwight D. Eisenhower', 'Erwin Rommel', 'Bernard Montgomery', 'Ulysses S. Grant', 'Robert E. Lee', 'George Washington', 'Douglas MacArthur', 'Saladin', 'Charlemagne', 'Cyrus the Great', 'Leonidas I', 'Scipio Africanus', 'Pompey', 'Horatio Nelson, 1st Viscount Nelson', 'Georgy Zhukov', 'Che Guevara', 'Simón Bolívar', 'Shaka', 'Sun Tzu', 'Kublai Khan', 'Tamerlane', 'Richard I of England', 'William the Conqueror', 'Frederick the Great', 'Gustavus Adolphus of Sweden', 'Suleiman the Magnificent', 'Tokugawa Ieyasu', 'Oda Nobunaga', 'Miyamoto Musashi', 'Hernán Cortés', 'Francisco Pizarro', 'Ramesses II', 'Xerxes I', 'Mark Antony', 'Augustus', 'Constantine the Great', 'Vercingetorix', 'Spartacus', 'Boudica', 'Charles Martel', 'Hindenburg'],
    rename: ['Arthur Wellesley, 1st Duke of Wellington', 'Horatio Nelson, 1st Viscount Nelson', 'Leonidas I', 'Richard I of England', 'Gustavus Adolphus of Sweden', 'Xerxes I'],
  },
  {
    id: 'history-pirate', category: 'History & Mythology', prompt: 'Name a real pirate or privateer.',
    rules: 'Accept any real pirate, buccaneer or privateer from history (Blackbeard, Captain Kidd, Henry Morgan, Anne Bonny, Calico Jack, Black Bart, Barbarossa, Jean Lafitte, Grace O\'Malley, Mary Read, Ching Shih, Francis Drake), by their name or nickname. Fictional pirates such as Jack Sparrow or Captain Hook do not count.',
    source: 'People in Wikidata whose occupation is pirate, known in at least 3 languages, plus privateers added by hand.', pattern: occupation('Q10729326') + HUMAN, minSignal: 3, alsoWritten: personForms,
    mustHave: ['Blackbeard', 'William Kidd', 'Henry Morgan', 'Anne Bonny', 'Calico Jack', 'Bartholomew Roberts', 'Hayreddin Barbarossa', 'Jean Lafitte', "Grace O'Malley", 'Mary Read', 'Ching Shih', 'Francis Drake', 'Stede Bonnet', 'Edward Low', 'Henry Every', 'Samuel Bellamy', 'Charles Vane', 'Benjamin Hornigold', 'Thomas Tew', "François l'Olonnais", 'Edward England', 'Black Caesar', 'Oruç Reis', 'Eustace the Monk', 'Zheng Zhilong', 'Walter Raleigh', 'Anne Dieu-le-Veut', 'Rachel Wall', 'Dragut', 'Jack Ward'],
    extras: [{ name: 'Edward Teach', signal: 60 }, { name: 'Captain Kidd', signal: 80, aliases: ['Kidd'] }, { name: 'Black Bart', signal: 80 }, { name: 'Pirate', signal: 40 }],
    rename: ['William Kidd', 'Bartholomew Roberts', 'Hayreddin Barbarossa', 'Calico Jack'],
  },
  {
    id: 'history-samurai', category: 'History & Mythology', prompt: 'Name a samurai or shogun.',
    rules: 'Accept any real samurai, daimyo or shogun of Japanese history (Miyamoto Musashi, Oda Nobunaga, Tokugawa Ieyasu, Toyotomi Hideyoshi, Minamoto no Yoshitsune, Takeda Shingen, Date Masamune, Saigō Takamori, Tomoe Gozen, Yasuke), by their usual name, given name or surname. Fictional samurai, ninja who were not samurai and emperors on their own do not count.',
    source: 'People in Wikidata whose occupation is samurai, known in at least 3 languages, plus shoguns added by hand.', pattern: occupation('Q38142') + HUMAN, minSignal: 3, alsoWritten: personForms,
    mustHave: ['Miyamoto Musashi', 'Oda Nobunaga', 'Tokugawa Ieyasu', 'Toyotomi Hideyoshi', 'Minamoto no Yoshitsune', 'Takeda Shingen', 'Date Masamune', 'Saigō Takamori', 'Tomoe Gozen', 'Yasuke', 'Uesugi Kenshin', 'Sanada Yukimura', 'Honda Tadakatsu', 'Hattori Hanzō', 'Akechi Mitsuhide', 'Kusunoki Masashige', 'Minamoto no Yoritomo', 'Taira no Kiyomori', 'Sakamoto Ryōma', 'Hijikata Toshizō', 'Kondō Isami', 'Okita Sōji', 'Katsu Kaishū', 'Yamamoto Tsunetomo', 'Ashikaga Takauji', 'Tokugawa Yoshinobu', 'Tokugawa Hidetada', 'Tokugawa Iemitsu', 'Ishida Mitsunari', 'Mōri Motonari'],
    extras: [{ name: 'Tokugawa Yoshimune', signal: 40 }],
  },

  // ================================================================ Places
  {
    id: 'places-mountain-range', category: 'Places', prompt: 'Name a mountain range.',
    rules: 'Accept any mountain range or mountain chain in the world, large or small (Himalayas, Alps, Andes, Rocky Mountains, Appalachians, Pyrenees, Carpathians, Urals, Atlas Mountains, Caucasus, Sierra Nevada, Cascade Range, Dolomites, Karakoram), with or without "Mountains" or "Range". Single mountains, hills and plateaus do not count.',
    source: 'Wikidata items that are a mountain range, known in at least 4 languages.', pattern: '?item wdt:P31 wd:Q46831 .', minSignal: 4, alsoWritten: strip(/ (Mountains|Mountain Range|Range|Mountain|Ranges)$/i),
    extraAliases: { Himalayas: ['Himalaya', 'The Himalayas'], Alps: ['The Alps'], Andes: ['The Andes', 'Andes Mountains'], 'Rocky Mountains': ['Rockies', 'The Rockies', 'Rocky Mountain'], 'Appalachian Mountains': ['Appalachians', 'The Appalachians'], 'Ural Mountains': ['Urals', 'The Urals'], 'Carpathian Mountains': ['Carpathians', 'The Carpathians'], 'Pyrenees': ['The Pyrenees'], Caucasus: ['Caucasus Mountains', 'The Caucasus'], Dolomites: ['The Dolomites'] },
    rename: ['Southern Alps'],
    extras: [{ name: 'Jura Mountains', signal: 60, aliases: ['Jura', 'Jura mountains', 'Swiss Jura'] }],
    mustHave: ['Himalayas', 'Alps', 'Andes', 'Rocky Mountains', 'Appalachian Mountains', 'Pyrenees', 'Carpathian Mountains', 'Ural Mountains', 'Atlas Mountains', 'Caucasus Mountains', 'Sierra Nevada', 'Cascade Range', 'Dolomites', 'Karakoram', 'Apennine Mountains', 'Hindu Kush', 'Altai Mountains', 'Tian Shan', 'Alaska Range', 'Blue Ridge Mountains', 'Great Smoky Mountains', 'Black Forest', 'Balkan Mountains', 'Zagros Mountains', 'Taurus Mountains', 'Drakensberg', 'Kunlun Mountains', 'Pamir Mountains', 'Brooks Range', 'Ozark Mountains', 'Sierra Madre', 'Transantarctic Mountains', 'Vosges Mountains', 'Tatra Mountains', 'Southern Alps', 'Great Dividing Range', 'Scottish Highlands', 'Cairngorms', 'Pennines'],
    skip: nameIs(/^(mountain range|range|mountains|Phlegraean Fields|Vinson Massif|Huangshan|Armenian Highlands|Ethiopian Highlands|Annapurna|Central Siberian Plateau)$|Częstochowa/i),
  },
  {
    id: 'places-peninsula', category: 'Places', prompt: 'Name a peninsula.',
    rules: 'Accept any peninsula in the world, large or small (Iberian Peninsula, Italian Peninsula, Korean Peninsula, Arabian Peninsula, Balkan Peninsula, Scandinavian Peninsula, Florida, Yucatán, Baja California, Kamchatka, Crimea, Sinai, Malay Peninsula, Cape Cod, Jutland), with or without the word "Peninsula". Islands, capes on their own and countries that are not on a peninsula do not count.',
    source: 'Wikidata items that are a peninsula, known in at least 5 languages.', pattern: '?item wdt:P31 wd:Q34763 .', minSignal: 5, alsoWritten: strip(/ (Peninsula|Península|Peninsular)$/i),
    mustHave: ['Iberian Peninsula', 'Italian Peninsula', 'Korean Peninsula', 'Arabian Peninsula', 'Balkan Peninsula', 'Scandinavian Peninsula', 'Florida', 'Yucatán Peninsula', 'Baja California Peninsula', 'Kamchatka Peninsula', 'Crimea', 'Sinai Peninsula', 'Malay Peninsula', 'Cape Cod', 'Jutland', 'Peloponnese', 'Anatolia', 'Indochina', 'Labrador Peninsula', 'Antarctic Peninsula', 'Gaspé Peninsula', 'Istria', 'Brittany', 'Cape York Peninsula', 'Olympic Peninsula', 'Upper Peninsula of Michigan', 'Kola Peninsula', 'Taymyr Peninsula', 'Chukchi Peninsula', 'Gallipoli', 'Cornwall', 'Kowloon Peninsula', 'Cotentin Peninsula', 'Peninsula of Sorrento', 'Sorrentine Peninsula', 'Halkidiki', 'Mani Peninsula', 'Alaska Peninsula'],
    extraAliases: { 'Iberian Peninsula': ['Iberia', 'Iberian'], 'Korean Peninsula': ['Korea Peninsula'], 'Baja California Peninsula': ['Baja California', 'Baja'], 'Yucatán Peninsula': ['Yucatan', 'Yucatan Peninsula'], 'Balkan Peninsula': ['Balkans', 'The Balkans'], 'Arabian Peninsula': ['Arabia'] },
    skip: nameIs(/^(peninsula|peninsulas|cape|Dejima|Vozrozhdeniya island|Foxe Basin)$/i),
  },
  {
    id: 'places-strait', category: 'Places', prompt: 'Name a strait or channel.',
    rules: 'Accept any strait, sound, channel or narrow sea passage that links two bodies of water (Strait of Gibraltar, Bosphorus, English Channel, Strait of Hormuz, Strait of Malacca, Bering Strait, Dardanelles, Strait of Magellan, Drake Passage, Taiwan Strait, Strait of Dover, Bass Strait), with or without the word "Strait". Canals, rivers, bays and gulfs do not count.',
    source: 'Wikidata items that are a strait, known in at least 4 languages, plus the English Channel added by hand.', pattern: '?item wdt:P31 wd:Q37901 .', minSignal: 4, alsoWritten: (n) => [...strip(/^Strait of /i)(n), ...strip(/ Strait$/i)(n)],
    extras: [{ name: 'English Channel', signal: 130, aliases: ['The Channel', 'Channel', 'La Manche'] }],
    skip: nameIs(/^(Foxe Basin|Gulf of Boothia|strait|channel)$/i),
    mustHave: ['Strait of Gibraltar', 'Bosporus', 'English Channel', 'Strait of Hormuz', 'Strait of Malacca', 'Bering Strait', 'Dardanelles', 'Strait of Magellan', 'Drake Passage', 'Taiwan Strait', 'Strait of Dover', 'Bass Strait', 'Cook Strait', 'Davis Strait', 'Strait of Messina', 'Øresund', 'Bab-el-Mandeb', 'Strait of Bonifacio', 'Torres Strait', 'Korea Strait', 'Menai Strait', 'Skagerrak', 'Kattegat', 'Palk Strait', 'Mozambique Channel', 'Golden Gate', 'Hudson Strait', 'Denmark Strait', 'Strait of Juan de Fuca', 'The Minch', 'Solent', 'Strait of Otranto', 'Tsugaru Strait', 'Lombok Strait', 'Sunda Strait', 'Strait of Georgia', 'Kerch Strait', 'North Channel', 'Strait of Sicily', 'Strait of Florida'],
    rename: ['Bosporus'],
    extraAliases: { Bosporus: ['Bosphorus', 'Bosphorus Strait'], 'Strait of Gibraltar': ['Gibraltar Strait'] },
  },
  {
    id: 'places-statue', category: 'Places', prompt: 'Name a famous statue or sculpture.',
    rules: 'Accept any famous statue or sculpture anywhere in the world, ancient or modern (Statue of Liberty, Christ the Redeemer, Michelangelo\'s David, The Little Mermaid, the Great Sphinx of Giza, Venus de Milo, Statue of Unity, Manneken Pis, Charging Bull, Moai of Easter Island, Terracotta Army, Merlion, Great Buddha of Kamakura). Buildings, towers, obelisks and paintings do not count.',
    source: 'Wikidata items that are a statue or a kind of one (colossal, equestrian), known in at least 12 languages, plus the best-known sculptures added by hand.', pattern: kindOf('Q179700'), minSignal: 12,
    extraAliases: { 'Statue of Liberty': ['Lady Liberty', 'Liberty Enlightening the World'], 'Christ the Redeemer': ['Cristo Redentor', 'Christ the Redeemer statue'] },
    mustHave: ['Statue of Liberty', 'Christ the Redeemer', 'David', 'The Little Mermaid', 'Great Sphinx of Giza', 'Venus de Milo', 'Statue of Unity', 'Manneken Pis', 'Charging Bull', 'Moai', 'Terracotta Army', 'Merlion', 'Great Buddha of Kamakura', 'The Thinker', 'Motherland Calls', 'Spring Temple Buddha', 'Fearless Girl', 'Angel of the North', 'Leshan Giant Buddha', 'Tian Tan Buddha', 'Cristo Rei', 'Colossus of Rhodes', 'Statue of Zeus at Olympia', 'Lincoln Memorial', 'Pietà', 'Discobolus', 'Laocoön and His Sons', 'Winged Victory of Samothrace', 'Apollo Belvedere', 'Mount Rushmore', 'Hachikō', 'Cloud Gate', 'The Kiss', "Nelson's Column", 'Eros', 'Peter Pan statue', 'Rocky statue', 'Statue of Bruce Lee', 'Statue of Peter the Great'],
    skip: nameIs(/^(statue|statues|monument|sculpture|Filmfare Awards|mannequin|caganer|Amiibo|Daruma doll|maneki-neko|herma|Venus figurine|totem pole|caryatid|equestrian statue|daibutsu|shīsā|Holy Trinity Column in Olomouc|Venus of Willendorf)$/i),
  },
  {
    id: 'places-zoo', category: 'Places', prompt: 'Name a zoo.',
    rules: 'Accept any zoo or zoological garden anywhere in the world (San Diego Zoo, London Zoo, Bronx Zoo, Berlin Zoo, Taronga Zoo, Singapore Zoo, Smithsonian National Zoo, Schönbrunn Zoo, Toronto Zoo, Chester Zoo, Edinburgh Zoo, Beijing Zoo, Ueno Zoo), with or without the word "Zoo". Aquariums, safari parks that are not zoos and wildlife reserves do not count.',
    source: 'Wikidata items that are a zoo, known in at least 4 languages.', pattern: '?item wdt:P31 wd:Q43501 .', minSignal: 4, alsoWritten: strip(/ (Zoo|Zoological Garden|Zoological Gardens|Zoological Park)$/i),
    mustHave: ['San Diego Zoo', 'London Zoo', 'Bronx Zoo', 'Berlin Zoological Garden', 'Taronga Zoo', 'Singapore Zoo', 'Smithsonian National Zoological Park', 'Tiergarten Schönbrunn', 'Toronto Zoo', 'Chester Zoo', 'Edinburgh Zoo', 'Beijing Zoo', 'Ueno Zoo', 'Philadelphia Zoo', 'Whipsnade Zoo', 'Melbourne Zoo', 'Zoo Zürich', 'Copenhagen Zoo', 'Artis Royal Zoo', 'Cincinnati Zoo', 'Lincoln Park Zoo', 'Woodland Park Zoo', 'Brookfield Zoo', 'Saint Louis Zoo', 'Houston Zoo', 'Dublin Zoo', 'Bristol Zoo', 'Paignton Zoo', 'Jersey Zoo', 'Chengdu Research Base of Giant Panda Breeding', 'Night Safari', 'Jurong Bird Park', 'Prague Zoo', 'Vincennes Zoo', 'Hagenbeck Zoo', 'Wilhelma', 'Basel Zoo', 'Pretoria National Zoological Gardens', 'Auckland Zoo', 'Wellington Zoo'],
    extraAliases: { 'Berlin Zoological Garden': ['Berlin Zoo', 'Zoo Berlin'], 'Tiergarten Schönbrunn': ['Schönbrunn Zoo', 'Vienna Zoo'], 'Smithsonian National Zoological Park': ['National Zoo', 'Smithsonian National Zoo', 'Washington Zoo'], 'Zoo Zürich': ['Zurich Zoo'] },
    skip: nameIs(/^(zoo|zoos|zoological garden|petting zoo|safari park|Georgia Aquarium|Harewood House|Xcaret)$/i),
  },

  {
    id: 'food-salad', category: 'Food', prompt: 'Name a salad.',
    rules: 'Accept any kind of salad, hot or cold, from any country (Caesar salad, Greek salad, Cobb salad, Waldorf salad, caprese, coleslaw, Niçoise salad, potato salad, fruit salad, garden salad, chef salad, pasta salad, tabbouleh, fattoush, egg salad, tuna salad, Russian salad). Whole meals that are not salads, sandwiches, soups and the word "salad" on its own do not count.',
    source: 'Wikidata items that are a salad or a kind of one, known in at least 3 languages.', pattern: kindOf('Q9266'), minSignal: 3,
    mustHave: ['Caesar salad', 'Greek salad', 'Cobb salad', 'Waldorf salad', 'Caprese salad', 'Coleslaw', 'Niçoise salad', 'Potato salad', 'Fruit salad', 'Garden salad', 'Chef salad', 'Pasta salad', 'Tabbouleh', 'Fattoush', 'Panzanella', 'Olivier salad', 'Egg salad', 'Tuna salad', 'Chicken salad', 'Taco salad', 'Som tam', 'Wedge salad', 'Spinach salad', 'Macaroni salad', 'Three-bean salad', 'Shopska salad', 'Larb', 'Ambrosia', 'Jello salad', 'Caprese', 'Russian salad', 'Seaweed salad', 'Quinoa salad', 'Couscous salad', 'Kachumbari', 'Gado-gado', 'Salade lyonnaise', 'Insalata', 'Horiatiki', 'Bean salad'],
    skip: nameIs(/^(salad|salads|dressing|vinaigrette|green salad|side dish)$/i),
  },


  // ================================================================ Games
  {
    id: 'games-racing', category: 'Games', prompt: 'Name a racing video game.',
    rules: 'Accept any racing video game, realistic or arcade, on any platform (Mario Kart 8, Gran Turismo, Need for Speed: Most Wanted, Forza Horizon, Burnout 3, Crazy Taxi, OutRun, Ridge Racer, F-Zero, Wipeout, Rocket League, Crash Team Racing). Sports games, flight games and whole series on their own do not count unless the series name is also a game.',
    source: 'Wikidata video games whose genre is racing video game or a kind of one, known in at least 8 languages.', pattern: '?item wdt:P31 wd:Q7889 . ?item wdt:P136/wdt:P279* wd:Q860750 .', minSignal: 8,
    mustHave: ['Mario Kart 8 Deluxe', 'Super Mario Kart', 'Mario Kart 64', 'Mario Kart Wii', 'Gran Turismo', 'Need for Speed: Most Wanted', 'Forza Horizon 4', 'Burnout 3: Takedown', 'Crazy Taxi', 'OutRun', 'Sega Rally Championship', 'Daytona USA', 'Ridge Racer', 'F-Zero', 'Wipeout', 'Micro Machines', 'Rocket League', "Cruis'n USA", 'Crash Team Racing', 'Diddy Kong Racing', 'Burnout Paradise', 'TrackMania', 'Colin McRae Rally', 'Project Gotham Racing', 'Pole Position', 'Road Rash', 'Excitebike', 'Top Gear', 'Need for Speed: Underground', 'Forza Motorsport', 'Gran Turismo 7', 'Mario Kart 7', 'Need for Speed: Hot Pursuit', 'Gran Turismo 4', 'Mario Kart DS', 'Need for Speed', 'Test Drive', 'Asphalt 8: Airborne'],
    skip: nameIs(/^(Cars|Hot Wheels|Rocket League)$/i),
  },
  {
    id: 'games-strategy', category: 'Games', prompt: 'Name a strategy video game.',
    rules: 'Accept any strategy video game, real-time or turn-based (Civilization, Age of Empires II, StarCraft, Warcraft III, Command & Conquer, XCOM, Total War, Heroes of Might and Magic III, Company of Heroes, Anno 1800, Stellaris, Crusader Kings, Advance Wars), by its title with or without a number. Role-playing games, shooters and board games do not count.',
    source: 'Wikidata video games whose genre is strategy video game or a kind of one, known in at least 8 languages.', pattern: '?item wdt:P31 wd:Q7889 . ?item wdt:P136/wdt:P279* wd:Q472055 .', minSignal: 8,
    mustHave: ["Sid Meier's Civilization", 'Age of Empires II: The Age of Kings', 'StarCraft', 'Warcraft III: Reign of Chaos', 'Command & Conquer', 'XCOM: Enemy Unknown', 'Total War: Rome II', 'Age of Empires', 'Empire Earth', 'Rise of Nations', 'Company of Heroes', 'Supreme Commander', 'Dune II', 'Advance Wars', 'Heroes of Might and Magic III', 'Cossacks: European Wars', 'Stronghold', 'Anno 1800', 'Stellaris', 'Crusader Kings II', 'Europa Universalis IV', 'Hearts of Iron IV', 'Plants vs. Zombies', 'Clash of Clans', 'StarCraft II: Wings of Liberty', "Sid Meier's Civilization VI", "Sid Meier's Civilization V", 'Age of Mythology', 'Red Alert', 'Tiberian Sun', 'The Settlers', 'Tropico', 'SimCity', 'Cities: Skylines', 'Frostpunk', 'Northgard', 'Warhammer 40,000: Dawn of War', 'Total War: Shogun 2', 'Battle for Wesnoth'],
    skip: nameIs(/^(Fire Emblem|Chrono Trigger|Final Fantasy IV|Final Fantasy VI|Battlefield 1|Brawl Stars|Hearthstone|Ingress|League of Legends|Dota 2|Hades|Clair Obscur: Expedition 33|Super Mario RPG|Bravely Default|Mega Man Battle Network|Star Wars Battlefront: Renegade Squadron)$/i),
  },
  {
    id: 'games-platformer', category: 'Games', prompt: 'Name a platform video game.',
    rules: 'Accept any platform video game, where the player runs and jumps between platforms, 2D or 3D (Super Mario Bros., Sonic the Hedgehog, Donkey Kong Country, Crash Bandicoot, Rayman, Mega Man, Celeste, Super Meat Boy, Limbo, Super Mario 64, Banjo-Kazooie, Spyro the Dragon, Ori and the Blind Forest, Prince of Persia). Shooters, racing games and role-playing games do not count.',
    source: 'Wikidata video games whose genre is platform game or a kind of one, known in at least 8 languages.', pattern: '?item wdt:P31 wd:Q7889 . ?item wdt:P136/wdt:P279* wd:Q828322 .', minSignal: 8,
    mustHave: ['Super Mario Bros.', 'Sonic the Hedgehog', 'Donkey Kong Country', 'Crash Bandicoot', 'Rayman', 'Mega Man', 'Celeste', 'Super Meat Boy', 'Limbo', 'Super Mario 64', 'Banjo-Kazooie', 'Spyro the Dragon', 'Ori and the Blind Forest', 'Prince of Persia', 'Super Mario World', 'Super Mario Bros. 3', 'Super Mario Odyssey', 'Donkey Kong', 'Kirby\'s Dream Land', "Yoshi's Island", 'Braid', 'LittleBigPlanet', 'Shovel Knight', 'Hollow Knight', 'Cuphead', 'Jak and Daxter: The Precursor Legacy', 'Ratchet & Clank', 'Pitfall!', 'Sonic the Hedgehog 2', 'Earthworm Jim', 'Castlevania', 'A Hat in Time', 'New Super Mario Bros.', 'Super Mario Galaxy', 'Super Mario Land', 'Wario Land', 'Metroid', 'Rayman Legends', 'Crash Bandicoot 2: Cortex Strikes Back', 'Sonic Mania'],
    skip: anyOf(nameIs(/^(Batman: Arkham Asylum|Star Wars Jedi: Fallen Order|Mirror's Edge|Fall Guys|Subway Surfers|Temple Run|Paper Mario)$/i), nameIs(/^Uncharted/i)),
  },
  {
    id: 'games-puzzle', category: 'Games', prompt: 'Name a puzzle video game.',
    rules: 'Accept any puzzle video game, on any platform (Tetris, Candy Crush Saga, Portal, Bejeweled, Minesweeper, 2048, Lemmings, Puyo Puyo, Dr. Mario, The Witness, Monument Valley, Zuma, Peggle, Cut the Rope, Baba Is You, Professor Layton). Board games, crosswords, shooters and action games do not count.',
    source: 'Wikidata video games whose genre is puzzle video game or a kind of one, known in at least 6 languages.', pattern: '?item wdt:P31 wd:Q7889 . ?item wdt:P136/wdt:P279* wd:Q54767 .', minSignal: 6,
    mustHave: ['Tetris', 'Candy Crush Saga', 'Portal', 'Bejeweled', 'Minesweeper', '2048', 'Lemmings', 'Puyo Puyo', 'Dr. Mario', 'The Witness', 'Monument Valley', 'Zuma', 'Peggle', 'Cut the Rope', 'Baba Is You', 'Professor Layton and the Curious Village', 'Portal 2', 'Angry Birds', 'Columns', 'Bust-a-Move', 'Pipe Dream', 'Picross', 'Solitaire', 'Mahjong', 'Sokoban', 'The Talos Principle', 'Braid', 'Threes', 'Wordle', 'Fez', 'Machinarium', 'Brain Age', 'Tetris Effect', "Dr. Robotnik's Mean Bean Machine", 'Pushmo', 'Gorogoa', 'Opus Magnum', 'Human: Fall Flat'],
    skip: nameIs(/^(Pac-Man|Ms\. Pac-Man|Undertale|Clash Royale|Plants vs\. Zombies|Poppy Playtime|Stray|Spelunky|Katamari Damacy)$/i),
  },
  {
    id: 'games-action-adventure', category: 'Games', prompt: 'Name an action-adventure video game.',
    rules: 'Accept any action-adventure video game (The Legend of Zelda: Ocarina of Time, Tomb Raider, Assassin\'s Creed, God of War, Uncharted, Grand Theft Auto V, The Last of Us, Red Dead Redemption 2, Resident Evil, Batman: Arkham Asylum, Shadow of the Colossus, Metal Gear Solid, Horizon Zero Dawn). Pure shooters, racing games, puzzle games and sports games do not count.',
    source: 'Wikidata video games whose genre is action-adventure game or a kind of one, known in at least 8 languages.', pattern: '?item wdt:P31 wd:Q7889 . ?item wdt:P136/wdt:P279* wd:Q343568 .', minSignal: 8,
    mustHave: ['The Legend of Zelda: Ocarina of Time', 'Tomb Raider', "Assassin's Creed", 'God of War', "Uncharted: Drake's Fortune", 'Grand Theft Auto V', 'The Last of Us', 'Red Dead Redemption 2', 'Resident Evil', 'Batman: Arkham Asylum', 'Shadow of the Colossus', 'Metal Gear Solid', 'Horizon Zero Dawn', 'The Legend of Zelda: Breath of the Wild', 'Grand Theft Auto III', 'Grand Theft Auto: San Andreas', 'Red Dead Redemption', 'Devil May Cry', 'Prince of Persia: The Sands of Time', 'Castlevania: Symphony of the Night', "Marvel's Spider-Man", 'Metroid', 'Hollow Knight', 'Death Stranding', 'Sekiro: Shadows Die Twice', 'Bayonetta', 'Dishonored', 'The Legend of Zelda', "Link's Awakening", 'Ghost of Tsushima', 'Control', 'Alan Wake', 'Watch Dogs', 'Just Cause'],
    skip: anyOf(nameIs(/^(Minecraft|Terraria|The Elder Scrolls V: Skyrim|Hades|Max Payne|Saints Row|Sleeping Dogs)$/i), nameIs(/^(Far Cry|S\.T\.A\.L\.K\.E\.R\.|Left 4 Dead|Mafia)/i)),
  },

  // ================================================================ Science & Technology
  {
    id: 'science-chemist', category: 'Science & Technology', prompt: 'Name a chemist.',
    rules: 'Accept any real chemist, from any period or country (Marie Curie, Antoine Lavoisier, Dmitri Mendeleev, Louis Pasteur, Linus Pauling, Robert Boyle, Humphry Davy, John Dalton, Fritz Haber, Alfred Nobel, Rosalind Franklin, Joseph Priestley), by their usual name or surname. Physicists, doctors, pharmacists on their own and fictional chemists such as Walter White do not count.',
    source: 'People in Wikidata whose occupation is chemist and whose description names chemistry, known in at least 12 languages.', pattern: occupation('Q593644') + HUMAN, minSignal: 12, alsoWritten: personForms,
    skip: notDescribedAs(/chemi|alchem/i),
    mustHave: ['Marie Curie', 'Antoine Lavoisier', 'Dmitri Mendeleev', 'Louis Pasteur', 'Linus Pauling', 'Robert Boyle', 'Humphry Davy', 'John Dalton', 'Fritz Haber', 'Alfred Nobel', 'Rosalind Franklin', 'Joseph Priestley', 'Carl Wilhelm Scheele', 'Svante Arrhenius', 'Michael Faraday', 'Dorothy Hodgkin', 'Frederick Sanger', 'Jöns Jacob Berzelius', 'Friedrich Wöhler', 'Justus von Liebig', 'August Kekulé', 'Robert Bunsen', 'Amedeo Avogadro', 'Henry Cavendish', 'Joseph Louis Gay-Lussac', 'Ernest Rutherford', 'Otto Hahn', 'Glenn T. Seaborg', 'Ahmed Zewail', 'Paul Ehrlich', 'Gertrude B. Elion', 'Stephanie Kwolek', 'Percy Julian', 'Jabir ibn Hayyan', 'Hennig Brand', 'Wallace Carothers', 'Irène Joliot-Curie', 'Max Perutz', 'Walter Gilbert'],
  },
  {
    id: 'science-inventor', category: 'Science & Technology', prompt: 'Name an inventor.',
    rules: 'Accept any real inventor, from any period or country (Thomas Edison, Nikola Tesla, Alexander Graham Bell, Leonardo da Vinci, Benjamin Franklin, Orville and Wilbur Wright, Johannes Gutenberg, James Watt, Guglielmo Marconi, Samuel Morse, Henry Ford, Tim Berners-Lee), by their usual name or surname. Scientists known only for discoveries, and fictional inventors, do not count.',
    source: 'People in Wikidata whose occupation is inventor and whose description names invention, engineering or a related craft, known in at least 15 languages.', pattern: occupation('Q205375') + HUMAN, minSignal: 15, alsoWritten: personForms,
    skip: anyOf(notDescribedAs(/invent|engineer|pioneer|industrialist|designer|entrepreneur|polymath|aviator|aviation|mechanic|machinist|craftsman|clockmaker|watchmaker/i), nameIs(/^(Margaret Atwood|Walt Disney|Arthur C\. Clarke|Antoine de Saint-Exupéry|Leonhard Euler|Douglas Adams)$/i)),
    mustHave: ['Thomas Edison', 'Nikola Tesla', 'Alexander Graham Bell', 'Leonardo da Vinci', 'Benjamin Franklin', 'Orville Wright', 'Wilbur Wright', 'Johannes Gutenberg', 'James Watt', 'Guglielmo Marconi', 'Samuel Morse', 'Henry Ford', 'Tim Berners-Lee', 'Archimedes', 'Alfred Nobel', 'Eli Whitney', 'Isambard Kingdom Brunel', 'George Stephenson', 'Charles Babbage', 'Louis Daguerre', 'Auguste Lumière', 'Louis Lumière', 'John Logie Baird', 'Rudolf Diesel', 'Gottlieb Daimler', 'Karl Benz', 'Alessandro Volta', 'Elisha Otis', 'Willis Carrier', 'James Dyson', 'Hedy Lamarr', 'Steve Jobs', 'Elon Musk', 'Bill Gates', 'George Westinghouse', 'Charles Goodyear', 'Cyrus McCormick', 'Elias Howe', 'Isaac Singer', 'Christopher Latham Sholes', 'Mikhail Kalashnikov', 'Ada Lovelace', 'Johann Philipp Reis', 'Antonio Meucci', 'Richard Arkwright', 'Thomas Newcomen', 'Hero of Alexandria', 'Zhang Heng', 'Cai Lun', 'Ts\'ai Lun'],
  },
  {
    id: 'science-file-format', category: 'Science & Technology', prompt: 'Name a computer file format.',
    rules: 'Accept any computer file format, by its name or its file extension (PDF, JPEG, PNG, GIF, MP3, MP4, ZIP, DOCX, HTML, TXT, CSV, XML, JSON, WAV, AVI, SVG, EXE, ISO, FLAC, PSD, RTF). Programs, programming languages, and the words "file" or "format" on their own do not count.',
    source: 'Wikidata items that are a file format or a kind of one, known in at least 6 languages.', pattern: kindOf('Q235557'), minSignal: 6,
    extraAliases: { 'JPEG File Interchange Format': ['JPEG', 'JPG', 'JPEG image'], 'Portable Network Graphics': ['PNG'], 'MPEG-4 Part 14': ['MP4', 'MPEG-4'], 'Waveform Audio File Format': ['WAV', 'WAVE'], 'text file': ['TXT', 'Plain text', 'Text file'], 'comma-separated values': ['CSV'], 'optical disc image': ['ISO', 'ISO image', 'ISO file'], 'Windows Executable': ['EXE', 'Portable Executable'], 'Windows Bitmap': ['BMP'], 'Office Open XML': ['DOCX', 'XLSX', 'PPTX'], 'Audio Video Interleave': ['AVI'], 'Rich Text Format': ['RTF'], 'Advanced Audio Coding': ['AAC'], Matroska: ['MKV'], 'Windows Media Video': ['WMV'], 'Adobe Photoshop': ['PSD'], 'QuickTime File Format': ['MOV', 'QuickTime'], 'Excel Binary File Format': ['XLS'], 'Cascading Style Sheets': ['CSS'] },
    mustHave: ['PDF', 'JPEG', 'PNG', 'GIF', 'MP3', 'MPEG-4 Part 14', 'ZIP', 'Office Open XML', 'HTML', 'Comma-separated values', 'XML', 'JSON', 'WAV', 'Audio Video Interleave', 'Scalable Vector Graphics', 'Windows Executable', 'ISO image', 'FLAC', 'Adobe Photoshop', 'Rich Text Format', 'TIFF', 'WebP', 'Matroska', 'QuickTime File Format', 'Windows Media Video', 'Ogg', 'Advanced Audio Coding', 'EPUB', 'RAR', '7z', 'Tar', 'PPT', 'MIDI', 'YAML'],
    extras: [{ name: 'DOC', signal: 70, aliases: ['Microsoft Word document'] }, { name: 'RAR', signal: 50 }],
    skip: nameIs(/^(file format|computer file|document file format|image file format|audio file format|video file format|container format|short film|VHS|IMAX|4K resolution|Blu-ray Disc|HD DVD|Jakarta Server Pages|24p|Video 2000|Extended Display Identification Data|inttypes\.h|zone file|proxy auto-config|DVD|Betamax|LaserDisc|Compact Disc|simplified molecular input line entry specification|Ultra-high-definition television|1080i|Todd-AO|Super 35|WS-Addressing|Free Lossless Audio Codec|MP3 Audio|Advanced Video Coding|MPEG-4|package format)$/i),
  },
  {
    id: 'science-cryptocurrency', category: 'Science & Technology', prompt: 'Name a cryptocurrency.',
    rules: 'Accept any cryptocurrency or crypto token (Bitcoin, Ethereum, Dogecoin, Litecoin, Ripple or XRP, Tether, Cardano, Solana, Monero, Binance Coin, Polkadot, Shiba Inu, Bitcoin Cash, Stellar, Chainlink, USD Coin), by its name or ticker. Ordinary money such as the dollar, companies and exchanges do not count.',
    source: 'Wikidata items that are a cryptocurrency, known in at least 3 languages.', pattern: '?item wdt:P31/wdt:P279* wd:Q13479982 .', minSignal: 3,
    mustHave: ['Bitcoin', 'Ethereum', 'Dogecoin', 'Litecoin', 'XRP', 'Tether', 'Cardano', 'Solana', 'Monero', 'Binance Coin', 'Polkadot', 'Shiba Inu', 'Bitcoin Cash', 'Stellar', 'Chainlink', 'USD Coin', 'Avalanche', 'Zcash', 'Dash', 'Tron', 'EOS', 'IOTA', 'NEM', 'Tezos', 'Cosmos', 'Uniswap', 'Polygon', 'Algorand', 'VeChain', 'Filecoin', 'Terra', 'Dai', 'Namecoin', 'Peercoin', 'Ethereum Classic', 'Bitcoin SV', 'Toncoin', 'Pepe', 'Memecoin', 'Libra'],
    extraAliases: { Bitcoin: ['BTC', 'XBT'], Ethereum: ['ETH', 'Ether'], XRP: ['Ripple'], 'SHIBA INU': ['Shiba Inu', 'SHIB'], 'Binance Coin': ['BNB'], Tether: ['USDT'], Cardano: ['ADA'], Solana: ['SOL'], Dogecoin: ['DOGE'], Litecoin: ['LTC'] },
    skip: anyOf(nameIs(/^(cryptocurrency|crypto|altcoin|stablecoin|token|digital currency|virtual currency|digital asset|BTC|Ripple)$/i), nameIs(/exchange|^(bitflyer|upbit|coinsquare|coinbase|bitstamp|kraken|bithumb|coincheck|WhopperCoin|Luno|BTCC|Bitso|Wirex Limited)$/i)),
  },

  // ================================================================ Movies & TV
  {
    id: 'movies-scifi-film', category: 'Movies & TV', prompt: 'Name a science fiction film.',
    rules: 'Accept any science fiction film, from any country and period (Star Wars, The Matrix, Blade Runner, Alien, Terminator 2, Back to the Future, Jurassic Park, E.T., 2001: A Space Odyssey, Interstellar, Inception, Avatar, Dune, Arrival). Fantasy, horror with no science fiction, TV series and books do not count.',
    source: 'Wikidata films whose genre is science fiction film or a kind of one, known in at least 10 languages.', pattern: '?item wdt:P31/wdt:P279* wd:Q11424 . ?item wdt:P136/wdt:P279* wd:Q471839 .', minSignal: 10,
    mustHave: ['Star Wars', 'The Matrix', 'Blade Runner', 'Alien', 'Terminator 2: Judgment Day', 'Back to the Future', 'Jurassic Park', 'E.T. the Extra-Terrestrial', 'Close Encounters of the Third Kind', '2001: A Space Odyssey', 'Interstellar', 'Inception', 'Avatar', 'The Terminator', 'Men in Black', 'Independence Day', 'Gravity', 'The Martian', 'Dune', 'Arrival', 'District 9', 'Minority Report', 'Total Recall', 'RoboCop', 'Predator', 'The Fifth Element', 'Ex Machina', 'Tron', 'Planet of the Apes', 'The Thing', 'Aliens', 'Edge of Tomorrow', 'Guardians of the Galaxy', 'Metropolis', 'Ready Player One', 'Star Trek', 'Moon', 'Looper', 'Her', 'Wall-E'],
    skip: nameIs(/^(Spirited Away|Pan's Labyrinth)$/i),
  },
  {
    id: 'movies-action-film', category: 'Movies & TV', prompt: 'Name an action film.',
    rules: 'Accept any action film, from any country and period (Die Hard, Mad Max: Fury Road, The Dark Knight, Raiders of the Lost Ark, John Wick, Gladiator, Speed, Mission: Impossible, Lethal Weapon, First Blood, Kill Bill, Casino Royale, Top Gun, The Fast and the Furious, Predator, Commando, Rush Hour, Bad Boys, True Lies). Dramas, comedies, TV series and games do not count.',
    source: 'Wikidata films whose genre is action film or a kind of one (animated films left out), known in at least 10 languages.', pattern: '?item wdt:P31/wdt:P279* wd:Q11424 . ?item wdt:P136/wdt:P279* wd:Q188473 . FILTER NOT EXISTS { ?item wdt:P31/wdt:P279* wd:Q202866 }', minSignal: 10,
    mustHave: ['Die Hard', 'Mad Max: Fury Road', 'The Dark Knight', 'Raiders of the Lost Ark', 'John Wick', 'Gladiator', 'Speed', 'Mission: Impossible', 'Lethal Weapon', 'First Blood', 'Kill Bill: Volume 1', 'Casino Royale', 'Top Gun', 'The Fast and the Furious', 'Predator', 'Commando', 'Rush Hour', 'Bad Boys', 'True Lies', 'The Rock', 'Face/Off', 'Point Break', 'Taken', 'Mad Max 2', 'Crouching Tiger, Hidden Dragon', 'Enter the Dragon', '300', 'Braveheart', 'The Raid', 'Terminator 2: Judgment Day', 'Skyfall', 'GoldenEye', 'Top Gun: Maverick', 'The Matrix', 'Rambo: First Blood Part II', 'Mission: Impossible – Fallout', 'Gladiator II', 'Heat', 'Léon: The Professional', 'The Expendables'],
  },
  {
    id: 'movies-comedian', category: 'Movies & TV', prompt: 'Name a comedian.',
    rules: 'Accept any real comedian or comic actor, stand-up, sketch or screen, from any country and period (Charlie Chaplin, Robin Williams, Eddie Murphy, Jim Carrey, Rowan Atkinson, Jerry Seinfeld, Dave Chappelle, Kevin Hart, Chris Rock, Ricky Gervais, John Cleese, Peter Sellers, Buster Keaton, Lucille Ball, Bob Hope, George Carlin), by their usual name or surname. Fictional characters do not count.',
    source: 'People in Wikidata whose occupation is comedian and whose description names comedy, known in at least 15 languages.', pattern: occupation('Q245068') + HUMAN, minSignal: 15, alsoWritten: personForms,
    skip: anyOf(notDescribedAs(/comed|comic|humor|satir|clown|jester/i), nameIs(/^Douglas Adams$/i)),
    mustHave: ['Charlie Chaplin', 'Robin Williams', 'Eddie Murphy', 'Jim Carrey', 'Rowan Atkinson', 'Jerry Seinfeld', 'Dave Chappelle', 'Kevin Hart', 'Chris Rock', 'Ricky Gervais', 'John Cleese', 'Peter Sellers', 'Buster Keaton', 'Lucille Ball', 'Bob Hope', 'George Carlin', 'Richard Pryor', 'Jerry Lewis', 'Mel Brooks', 'Will Ferrell', 'Adam Sandler', 'Mike Myers', 'Dan Aykroyd', 'Bill Murray', 'John Belushi', 'Chevy Chase', 'Whoopi Goldberg', 'Joan Rivers', 'Trevor Noah', 'Russell Brand', 'Jimmy Carr', 'Billy Connolly', 'Sacha Baron Cohen', 'Seth Rogen', 'Eddie Izzard', 'Jon Stewart', 'Amy Schumer', 'Tina Fey', 'Michael Palin', 'Stan Laurel', 'Oliver Hardy', 'Groucho Marx', 'Lee Evans', 'Peter Kay', 'Jack Black', 'Steve Martin', 'Ben Stiller', 'Jonah Hill', 'Melissa McCarthy', 'Kristen Wiig'],
  },
  {
    id: 'movies-crime-series', category: 'Movies & TV', prompt: 'Name a crime TV series.',
    rules: 'Accept any crime drama, detective or police television series from any country (Breaking Bad, The Sopranos, The Wire, Law & Order, CSI, NCIS, Criminal Minds, Sherlock, Peaky Blinders, Narcos, Dexter, True Detective, Mindhunter, Ozark, Fargo, Line of Duty, Better Call Saul, Columbo, Money Heist). Sitcoms, documentaries and films do not count.',
    source: 'Wikidata television series whose genre is crime television series or a kind of one, known in at least 8 languages.', pattern: '?item wdt:P31/wdt:P279* wd:Q5398426 . ?item wdt:P136/wdt:P279* wd:Q9335577 .', minSignal: 8,
    mustHave: ['Breaking Bad', 'The Sopranos', 'The Wire', 'Law & Order', 'CSI: Crime Scene Investigation', 'NCIS', 'Criminal Minds', 'Sherlock', 'Peaky Blinders', 'Narcos', 'Dexter', 'True Detective', 'Mindhunter', 'Ozark', 'Fargo', 'Line of Duty', 'Better Call Saul', 'Columbo', 'Money Heist', 'Luther', 'Miami Vice', 'Monk', 'Castle', 'Bones', 'The Mentalist', 'Hawaii Five-0', 'Prison Break', 'Broadchurch', 'Death in Paradise', 'Midsomer Murders', 'Poirot', 'Killing Eve', 'Hannibal', 'Elementary', 'The Killing', 'Bosch', 'Mare of Easttown', 'Happy Valley', 'Vera'],
    skip: nameIs(/^(Brooklyn Nine-Nine|Arrow|Daredevil|The Boys|Gotham|Jessica Jones|Agent Carter|Knight Rider|Lucifer|Orange Is the New Black|Supergirl|The Flash|Batwoman|Luke Cage|Batman|Inspector Gadget|The Punisher|Altered Carbon)$/i),
  },
  {
    id: 'movies-childrens-tv', category: 'Movies & TV', prompt: "Name a children's TV show.",
    rules: "Accept any television series made for children, from any country, animated or live (Sesame Street, Teletubbies, Peppa Pig, Bluey, Paw Patrol, Thomas & Friends, Barney & Friends, Blue's Clues, Dora the Explorer, Mister Rogers' Neighborhood, Postman Pat, Bob the Builder, Pocoyo, The Wiggles). Shows meant for adults and films do not count.",
    source: "Wikidata television series whose genre is children's television series or a kind of one, known in at least 6 languages.", pattern: '?item wdt:P31/wdt:P279* wd:Q5398426 . ?item wdt:P136/wdt:P279* wd:Q1273568 .', minSignal: 6,
    mustHave: ['Sesame Street', 'Teletubbies', 'Peppa Pig', 'Bluey', 'Paw Patrol', 'Thomas & Friends', 'Barney & Friends', "Blue's Clues", 'Dora the Explorer', "Mister Rogers' Neighborhood", 'Postman Pat', 'Fireman Sam', 'Bob the Builder', 'Hey Duggee', 'Arthur', 'The Magic School Bus', 'Power Rangers', 'Pocoyo', 'The Wiggles', 'Octonauts', 'Play School', 'Bananas in Pyjamas', 'Rainbow', 'Blue Peter', 'Captain Planet and the Planeteers', 'Pingu', 'Noddy', 'Magic Roundabout', 'Mickey Mouse Clubhouse', 'Wonder Pets!', 'The Backyardigans', 'Franklin', 'Clifford the Big Red Dog', 'Caillou', 'Lazytown', 'Fraggle Rock', 'The Muppet Show', 'Dinosaur Train', 'Ben & Holly\'s Little Kingdom', 'Numberblocks'],
    skip: nameIs(/^(The Muppet Show|Power Rangers|Captain Planet and the Planeteers)$/i),
  },

  // ================================================================ Music
  {
    id: 'music-drummer', category: 'Music', prompt: 'Name a drummer.',
    rules: 'Accept any real drummer or percussionist of a band or solo act, from any country and period (Ringo Starr, John Bonham, Neil Peart, Keith Moon, Phil Collins, Dave Grohl, Buddy Rich, Gene Krupa, Travis Barker, Lars Ulrich, Charlie Watts, Stewart Copeland, Roger Taylor, Karen Carpenter, Meg White), by their usual name or surname. Fictional drummers such as Animal from the Muppets do not count.',
    source: 'People in Wikidata whose occupation is drummer and whose description names drums or percussion, known in at least 8 languages.', pattern: occupation('Q386854') + HUMAN, minSignal: 8, alsoWritten: personForms,
    skip: notDescribedAs(/drum|percuss/i),
    mustHave: ['Ringo Starr', 'John Bonham', 'Neil Peart', 'Keith Moon', 'Phil Collins', 'Dave Grohl', 'Buddy Rich', 'Gene Krupa', 'Travis Barker', 'Lars Ulrich', 'Charlie Watts', 'Stewart Copeland', 'Roger Taylor', 'Karen Carpenter', 'Meg White', 'Mike Portnoy', 'Art Blakey', 'Max Roach', 'Tommy Lee', 'Questlove', 'Taylor Hawkins', 'Sheila E.', 'Larry Mullen Jr.', 'Don Henley', 'Nick Mason', 'Bill Bruford', 'Ginger Baker', 'Ian Paice', 'Cozy Powell', 'Chad Smith', 'Matt Cameron', 'Joey Jordison', 'Danny Carey', 'Dave Lombardo', 'Tré Cool', 'Mick Fleetwood', 'Levon Helm', 'Steve Gadd', 'Jeff Porcaro', 'Tony Williams'],
  },
  {
    id: 'music-dj', category: 'Music', prompt: 'Name a DJ or electronic music producer.',
    rules: 'Accept any real DJ or electronic music producer, from any country (Calvin Harris, David Guetta, Avicii, Skrillex, Tiësto, Marshmello, Deadmau5, Martin Garrix, Zedd, Diplo, Kygo, Alan Walker, Steve Aoki, Armin van Buuren, Paul van Dyk, Carl Cox, Fatboy Slim, Afrojack), by their stage name or real name. Singers who are not DJs, rappers who only produce hip hop, and radio presenters do not count. Electronic duos and groups such as Daft Punk and Swedish House Mafia do count.',
    source: 'People in Wikidata whose occupation is disc jockey and whose description names DJing or electronic music, known in at least 8 languages.', pattern: occupation('Q130857') + HUMAN, minSignal: 8,
    skip: anyOf(notDescribedAs(/\bDJ\b|disc jockey|electronic|producer|house|techno|trance|dance/i), nameIs(/^(Dr\. Dre|Timbaland|will\.i\.am|Ansel Elgort|Ruby Rose|John Peel|Juicy J|Lil Jon|Howard Donald|Jermaine Dupri)$/i)),
    mustHave: ['Calvin Harris', 'David Guetta', 'Avicii', 'Skrillex', 'Tiësto', 'Marshmello', 'Deadmau5', 'Martin Garrix', 'Zedd', 'Diplo', 'Kygo', 'Alan Walker', 'Steve Aoki', 'Armin van Buuren', 'Paul van Dyk', 'Carl Cox', 'Fatboy Slim', 'Afrojack', 'Paul Oakenfold', 'Pete Tong', 'Hardwell', 'Axwell', 'Steve Angello', 'Sebastian Ingrosso', 'Moby', 'John Digweed', 'Sasha', 'Eric Prydz', 'Swedish House Mafia', 'Kaskade', 'Porter Robinson', 'Flume', 'Disclosure', 'Jax Jones', 'Joel Corry', 'Fred again..', 'Peggy Gou', 'Black Coffee', 'Honey Dijon'],
    extras: [{ name: 'Swedish House Mafia', signal: 70 }, { name: 'Daft Punk', signal: 100 }, { name: 'The Chainsmokers', signal: 70 }, { name: 'Disclosure', signal: 60 }],
  },
  {
    id: 'music-stones-song', category: 'Music', prompt: 'Name a song by The Rolling Stones.',
    rules: 'Accept any song that The Rolling Stones recorded and released, including album tracks, singles and covers they made their own ((I Can\'t Get No) Satisfaction, Paint It Black, Sympathy for the Devil, Start Me Up, Jumpin\' Jack Flash, Angie, Gimme Shelter, Brown Sugar, You Can\'t Always Get What You Want, Wild Horses, Miss You, Honky Tonk Women), by its title. Albums and songs by other artists do not count.',
    source: 'Musical works that Wikidata lists as performed or composed by The Rolling Stones.', pattern: '{ { ?item wdt:P175 wd:Q11036 } UNION { ?item wdt:P86 wd:Q11036 } } ?item wdt:P31/wdt:P279* wd:Q105543609 .',
    mustHave: ["(I Can't Get No) Satisfaction", 'Paint It Black', 'Sympathy for the Devil', 'Start Me Up', "Jumpin' Jack Flash", 'Angie', 'Gimme Shelter', 'Brown Sugar', "You Can't Always Get What You Want", 'Wild Horses', 'Miss You', 'Honky Tonk Women', 'Ruby Tuesday', "Let's Spend the Night Together", 'Get Off of My Cloud', 'As Tears Go By', '19th Nervous Breakdown', 'Under My Thumb', "Mother's Little Helper", 'Street Fighting Man', "It's Only Rock 'n Roll (But I Like It)", 'Beast of Burden', 'Tumbling Dice', 'Happy', 'Waiting on a Friend', 'Emotional Rescue', 'Undercover of the Night', 'Harlem Shuffle', 'Mixed Emotions', 'Love Is Strong', 'Doom and Gloom', 'Heart of Stone', 'The Last Time', "Time Is on My Side", 'Fool to Cry', 'Shine a Light', 'Rocks Off', 'Dead Flowers', 'Midnight Rambler', "She's a Rainbow", 'Angry'],
  },
  {
    id: 'music-christmas-song', category: 'Music', prompt: 'Name a Christmas song.',
    rules: 'Accept any Christmas song, carol or hymn, traditional or modern, from any country (Jingle Bells, White Christmas, Silent Night, All I Want for Christmas Is You, Last Christmas, Rudolph the Red-Nosed Reindeer, Let It Snow, Santa Claus Is Comin\' to Town, Rockin\' Around the Christmas Tree, Do They Know It\'s Christmas?, Feliz Navidad, Deck the Halls, Joy to the World, O Holy Night). Winter songs with no Christmas theme and albums do not count.',
    source: 'Wikidata musical works whose genre is Christmas music, known in at least 3 languages.', pattern: '?item wdt:P31/wdt:P279* wd:Q105543609 . ?item wdt:P136/wdt:P279* wd:Q1443316 .', minSignal: 3,
    rename: ['Silent Night', 'O Holy Night'],
    mustHave: ['Jingle Bells', 'White Christmas', 'Silent Night', 'All I Want for Christmas Is You', 'Last Christmas', 'Rudolph the Red-Nosed Reindeer', 'Let It Snow! Let It Snow! Let It Snow!', "Santa Claus Is Comin' to Town", "Rockin' Around the Christmas Tree", "Do They Know It's Christmas?", 'Feliz Navidad', 'Deck the Halls', 'Joy to the World', 'O Holy Night', 'Frosty the Snowman', "Hark! The Herald Angels Sing", 'Jingle Bell Rock', 'Winter Wonderland', 'The Little Drummer Boy', 'Blue Christmas', 'Fairytale of New York', 'Wonderful Christmastime', "Baby, It's Cold Outside", 'Carol of the Bells', 'The First Noel', 'O Come, All Ye Faithful', 'Away in a Manger', 'God Rest Ye Merry, Gentlemen', 'We Wish You a Merry Christmas', 'The Twelve Days of Christmas', 'Santa Baby', "It's Beginning to Look a Lot Like Christmas", 'Have Yourself a Merry Little Christmas', 'Silver Bells', 'Sleigh Ride', 'The Christmas Song', 'Mistletoe', "Merry Xmas Everybody", 'Driving Home for Christmas'],
    skip: nameIs(/^(Christmas carol|Christmas music|Christmas song)$/i),
  },
  {
    id: 'music-national-anthem', category: 'Music', prompt: 'Name a national anthem.',
    rules: 'Accept the national anthem of any country by its title or by its first line or usual name (La Marseillaise, The Star-Spangled Banner, God Save the King, O Canada, Advance Australia Fair, Das Lied der Deutschen, Il Canto degli Italiani, Kimigayo, Jana Gana Mana, Hino Nacional Brasileiro, Hatikvah, Himno Nacional Mexicano). Regional or team songs, hymns and patriotic songs that are not an anthem do not count.',
    source: 'Wikidata items that are a national anthem, known in at least 3 languages.', pattern: '?item wdt:P31 wd:Q23691 .', minSignal: 3,
    extraAliases: { 'The Star-Spangled Banner': ['Star-Spangled Banner', 'Star Spangled Banner', 'The Star Spangled Banner'], 'God Save the King': ['God Save the Queen', 'National Anthem of the United Kingdom'], 'La Marseillaise': ['Marseillaise', 'French national anthem'], 'Das Lied der Deutschen': ['Deutschlandlied', 'German national anthem'], 'Himno Nacional de Chile': ['National Anthem of Chile', 'Chilean national anthem'], 'Himno Nacional Argentino': ['Argentine National Anthem', 'Argentine national anthem'], 'Du gamla, du fria': ['Sweden Anthem', 'Swedish national anthem'] },
    mustHave: ['La Marseillaise', 'The Star-Spangled Banner', 'God Save the King', 'O Canada', 'Advance Australia Fair', 'Das Lied der Deutschen', 'Il Canto degli Italiani', 'Kimigayo', 'Jana Gana Mana', 'Hino Nacional Brasileiro', 'Hatikvah', 'Himno Nacional Mexicano', 'Marcha Real', 'Aegukga', 'March of the Volunteers', 'State Anthem of the Russian Federation', 'Wilhelmus', 'Amhrán na bhFiann', 'Flower of Scotland', 'Land of My Fathers', 'God Defend New Zealand', "Nkosi Sikelel' iAfrika", 'Himno Nacional Argentino', 'Himno Nacional de Colombia', 'Our Land Is Free', 'Sweden Anthem', 'Maamme', 'Mer Hayrenik', 'Himno Nacional de Chile', 'Hymne National du Sénégal', 'Mukhtar'],
    skip: nameIs(/^(national anthem|anthem|royal anthem|regional anthem|Deutschlandlied|National Anthem of Chile|Argentine National Anthem|Sweden Anthem|Anthem of Europe|Aegukka)$|^Translations of /i),
  },

  // ================================================================ Sports
  {
    id: 'sports-cyclist', category: 'Sports', prompt: 'Name a professional cyclist.',
    rules: 'Accept any real road, track or mountain-bike cyclist, men\'s or women\'s, current or retired (Eddy Merckx, Lance Armstrong, Chris Froome, Bradley Wiggins, Tadej Pogačar, Miguel Indurain, Bernard Hinault, Fausto Coppi, Greg LeMond, Mark Cavendish, Peter Sagan, Marco Pantani, Chris Hoy), by their usual name or surname. Motorcycle racers, triathletes who never cycled professionally and fictional riders do not count.',
    source: 'People in Wikidata whose occupation is a kind of cyclist and whose description names cycling, known in at least 8 languages.', pattern: occupationUnder('Q2309784') + HUMAN, minSignal: 8, alsoWritten: personForms,
    skip: notDescribedAs(/cycl|bicycle|bike|track rider/i),
    mustHave: ['Eddy Merckx', 'Lance Armstrong', 'Chris Froome', 'Bradley Wiggins', 'Tadej Pogačar', 'Jonas Vingegaard', 'Miguel Induráin', 'Bernard Hinault', 'Fausto Coppi', 'Jacques Anquetil', 'Greg LeMond', 'Mark Cavendish', 'Peter Sagan', 'Marco Pantani', 'Alberto Contador', 'Vincenzo Nibali', 'Jan Ullrich', 'Laurent Fignon', 'Chris Hoy', 'Victoria Pendleton', 'Tom Boonen', 'Fabian Cancellara', 'Egan Bernal', 'Mathieu van der Poel', 'Wout van Aert', 'Primož Roglič', 'Geraint Thomas', 'Nairo Quintana', 'Cadel Evans', 'Andy Schleck', 'Alejandro Valverde', 'Julian Alaphilippe', 'Remco Evenepoel', 'Gino Bartali', 'Raymond Poulidor', 'Sean Kelly', 'Laura Kenny', 'Jason Kenny', 'Marianne Vos', 'Tom Dumoulin'],
  },
  {
    id: 'sports-mma-fighter', category: 'Sports', prompt: 'Name a mixed martial arts fighter.',
    rules: 'Accept any real mixed martial arts (MMA or UFC) fighter, men\'s or women\'s, current or retired (Conor McGregor, Khabib Nurmagomedov, Anderson Silva, Georges St-Pierre, Jon Jones, Ronda Rousey, Israel Adesanya, Nate Diaz, Chuck Liddell, Randy Couture, Brock Lesnar, Fedor Emelianenko, Amanda Nunes, Royce Gracie), by their usual name, nickname or surname. Pure boxers and wrestlers who never fought MMA do not count.',
    source: 'People in Wikidata whose occupation is mixed martial arts fighter and whose description names MMA, known in at least 6 languages.', pattern: occupation('Q11607585') + HUMAN, minSignal: 6, alsoWritten: personForms,
    skip: notDescribedAs(/mixed martial|MMA|UFC|martial artist|fighter/i),
    mustHave: ['Conor McGregor', 'Khabib Nurmagomedov', 'Anderson Silva', 'Georges St-Pierre', 'Jon Jones', 'Ronda Rousey', 'Israel Adesanya', 'Jorge Masvidal', 'Nate Diaz', 'Chuck Liddell', 'Randy Couture', 'Brock Lesnar', 'Fedor Emelianenko', 'Daniel Cormier', 'Amanda Nunes', 'Holly Holm', 'Dustin Poirier', 'Charles Oliveira', 'Francis Ngannou', 'Max Holloway', 'Royce Gracie', 'Ken Shamrock', 'Tito Ortiz', 'Cain Velasquez', 'Stipe Miocic', 'Alex Pereira', 'Islam Makhachev', 'Sean O\'Malley', 'Tony Ferguson', 'B. J. Penn', 'Frankie Edgar', 'Quinton Jackson', 'Dan Henderson', 'Wanderlei Silva', 'Mirko Cro Cop', 'Joanna Jędrzejczyk', 'Valentina Shevchenko', 'Zhang Weili', 'Kamaru Usman', 'Leon Edwards'],
    extras: [{ name: 'Rampage Jackson', signal: 40 }],
  },
  {
    id: 'sports-chess-player', category: 'Sports', prompt: 'Name a chess player.',
    rules: 'Accept any real chess player, of any period or country (Magnus Carlsen, Garry Kasparov, Bobby Fischer, Anatoly Karpov, José Raúl Capablanca, Mikhail Tal, Viswanathan Anand, Boris Spassky, Emanuel Lasker, Paul Morphy, Hikaru Nakamura, Fabiano Caruana, Judit Polgár, Ding Liren), by their usual name or surname. Chess engines such as Deep Blue and fictional players do not count.',
    source: 'People in Wikidata whose occupation is chess player, known in at least 10 languages.', pattern: occupation('Q10873124') + HUMAN, minSignal: 10, alsoWritten: personForms,
    skip: notDescribedAs(/chess/i),
    mustHave: ['Magnus Carlsen', 'Garry Kasparov', 'Bobby Fischer', 'Anatoly Karpov', 'José Raúl Capablanca', 'Mikhail Tal', 'Viswanathan Anand', 'Boris Spassky', 'Emanuel Lasker', 'Paul Morphy', 'Wilhelm Steinitz', 'Alexander Alekhine', 'Vladimir Kramnik', 'Hikaru Nakamura', 'Fabiano Caruana', 'Judit Polgár', 'Ding Liren', 'Ian Nepomniachtchi', 'Wesley So', 'Levon Aronian', 'Mikhail Botvinnik', 'Tigran Petrosian', 'Vasily Smyslov', 'Max Euwe', 'Gukesh Dommaraju', 'Rameshbabu Praggnanandhaa', 'Veselin Topalov', 'Boris Gelfand', 'Nigel Short', 'Peter Svidler', 'Maxime Vachier-Lagrave', 'Alireza Firouzja', 'Anna Rudolf', 'Susan Polgar', 'Hou Yifan', 'Daniil Dubov', 'Alexandra Botez', 'Levy Rozman', 'Eric Rosen', 'Hans Niemann'],
  },
  {
    id: 'sports-gymnast', category: 'Sports', prompt: 'Name a gymnast.',
    rules: 'Accept any real gymnast, artistic, rhythmic or trampoline, men\'s or women\'s, current or retired (Simone Biles, Nadia Comăneci, Olga Korbut, Larisa Latynina, Gabby Douglas, Shawn Johnson, Aly Raisman, Kohei Uchimura, Mary Lou Retton, Kerri Strug, Nastia Liukin, Sunisa Lee, Max Whitlock, Dominique Dawes), by their usual name or surname. Acrobats of circus shows, cheerleaders and fictional gymnasts do not count.',
    source: 'People in Wikidata whose occupation is a kind of gymnast and whose description names gymnastics, known in at least 6 languages.', pattern: occupationUnder('Q13381572') + HUMAN, minSignal: 6, alsoWritten: personForms,
    skip: notDescribedAs(/gymnast/i),
    mustHave: ['Simone Biles', 'Nadia Comăneci', 'Olga Korbut', 'Larisa Latynina', 'Gabby Douglas', 'Shawn Johnson', 'Aly Raisman', 'Kohei Uchimura', 'Mary Lou Retton', 'Kerri Strug', 'Nastia Liukin', 'Sunisa Lee', 'Max Whitlock', 'Dominique Dawes', 'Svetlana Khorkina', 'Vitaly Scherbo', 'Carly Patterson', 'Jordan Chiles', 'Li Ning', 'Alexei Nemov', 'Paul Hamm', 'Fabian Hambüchen', 'Oksana Chusovitina', 'Shannon Miller', 'Dominique Moceanu', 'Ellie Black', 'Rebeca Andrade', 'Jade Carey', 'Béla Károlyi', 'Lu Yu', 'Ludmilla Tourischeva', 'Vera Čáslavská', 'Nellie Kim', 'Daiki Hashimoto', 'Sam Mikulak', 'Brooklyn Moors', 'Kyla Ross', 'Laurie Hernandez', 'Mykayla Skinner', 'Suni Lee'],
  },

  // ================================================================ Transport & Vehicles
  {
    id: 'transport-tank', category: 'Transport & Vehicles', prompt: 'Name a tank.',
    rules: 'Accept any model of tank or armoured fighting vehicle with a turret and tracks, from any country and period (M1 Abrams, Tiger I, T-34, M4 Sherman, Leopard 2, Challenger 2, Panzer IV, Panther, Churchill, Merkava, Centurion, T-72, M60 Patton, King Tiger, Matilda, Char B1, Mark I, Leclerc, Type 99, K2 Black Panther). Armoured cars, artillery, aircraft and toy tanks do not count.',
    source: 'Wikidata items that are a tank or a kind of one (light, medium, heavy and main battle tanks, tank models), known in at least 8 languages.', pattern: kindOf('Q12876'), minSignal: 8,
    mustHave: ['M1 Abrams', 'Tiger I', 'T-34', 'M4 Sherman', 'Leopard 2', 'Challenger 2', 'Panzer IV', 'Panther', 'Churchill tank', 'Merkava', 'Centurion', 'T-72', 'M60 Patton', 'Tiger II', 'Matilda II', 'Char B1', 'Mark I', 'Leclerc', 'Type 99', 'K2 Black Panther', 'Panzer III', 'Cromwell', 'M48 Patton', 'T-90', 'Challenger 1', 'M3 Stuart', 'Maus', 'IS-2', 'KV-1', 'Chieftain', 'Valentine', 'Crusader', 'M26 Pershing', 'M3 Lee', 'T-54', 'Arjun', 'Ariete', 'Strv 103', 'Little Willie', 'Tiger'],
    extraAliases: { 'M4 Sherman': ['Sherman', 'Sherman tank'], 'Tiger I': ['Tiger', 'Tiger tank', 'Panzer VI'], 'M1 Abrams': ['Abrams'], 'Panther': ['Panzer V', 'Panther tank'], 'Churchill tank': ['Churchill'] },
    skip: nameIs(/^(tank|tanks|heavy tank|light tank|medium tank|main battle tank|armoured fighting vehicle|infantry tank|cruiser tank|tank destroyer|tankette|armored car)$/i),
  },

  {
    id: 'transport-tunnel', category: 'Transport & Vehicles', prompt: 'Name a famous tunnel.',
    rules: 'Accept any famous road, rail, canal or undersea tunnel anywhere in the world (Channel Tunnel, Gotthard Base Tunnel, Seikan Tunnel, Holland Tunnel, Lincoln Tunnel, Mont Blanc Tunnel, Simplon Tunnel, Lærdal Tunnel, Brooklyn-Battery Tunnel, Marmaray, Eurotunnel). Bridges, metro lines, caves, mines and the word "tunnel" on its own do not count.',
    source: 'Wikidata items that are a tunnel or a kind of one, known in at least 6 languages.', pattern: kindOf('Q44377'), minSignal: 6, alsoWritten: strip(/ (Base Tunnel|Tunnel|tunnel)$/),
    mustHave: ['Channel Tunnel', 'Gotthard Base Tunnel', 'Seikan Tunnel', 'Holland Tunnel', 'Lincoln Tunnel', 'Mont Blanc Tunnel', 'Simplon Tunnel', 'Lærdal Tunnel', 'Brooklyn–Battery Tunnel', 'Marmaray', 'Ted Williams Tunnel', 'Sydney Harbour Tunnel', 'Fréjus Road Tunnel', 'Gotthard Road Tunnel', 'Hampton Roads Bridge–Tunnel', 'Lötschberg Base Tunnel', 'Eurasia Tunnel', 'Thames Tunnel', 'Blackwall Tunnel', 'Queensway Tunnel', 'Tokyo Bay Aqua-Line', 'Eisenhower Tunnel', 'Caldecott Tunnel', 'Hoosac Tunnel', 'Severn Tunnel', 'Box Tunnel', 'Kanmon Tunnel', 'Arlberg Road Tunnel', 'Gran Sasso Tunnel', 'Oslofjord Tunnel'],
    extraAliases: { 'Channel Tunnel': ['Chunnel', 'Eurotunnel', 'The Chunnel', 'Channel tunnel'] },
    skip: nameIs(/^(tunnel|railway tunnel|road tunnel|subsea tunnel|undersea tunnel|water tunnel|underwater tunnel|tunnels|qanat|Great Belt Fixed Link|Hong Kong–Zhuhai–Macau Bridge|Waterloo & City line|King Fahd Causeway|Fehmarn Belt fixed link|secret passage|subway|helical tunnel|Julius Nyerere Hydropower Station|Operation Gold|Barendrecht railway station|Third Tunnel of Aggression)$/i),
  },
  {
    id: 'transport-fighter-aircraft', category: 'Transport & Vehicles', prompt: 'Name a fighter aircraft.',
    rules: 'Accept any fighter jet or fighter plane, from any country and period (F-16 Fighting Falcon, F-35 Lightning II, F-22 Raptor, Supermarine Spitfire, MiG-29, Sukhoi Su-27, F-15 Eagle, F/A-18 Hornet, F-14 Tomcat, P-51 Mustang, Messerschmitt Bf 109, Mitsubishi A6M Zero, Eurofighter Typhoon, Dassault Rafale, Gripen, F-4 Phantom II). Passenger airliners, helicopters, bombers, transport planes and drones do not count.',
    source: 'Wikidata items that are a fighter aircraft or a kind of one (aircraft families and models), known in at least 8 languages.', pattern: kindOf('Q127771'), minSignal: 8,
    mustHave: ['General Dynamics F-16 Fighting Falcon', 'Lockheed Martin F-35 Lightning II', 'Lockheed Martin F-22 Raptor', 'Supermarine Spitfire', 'Mikoyan MiG-29', 'Sukhoi Su-27', 'McDonnell Douglas F-15 Eagle', 'McDonnell Douglas F/A-18 Hornet', 'Grumman F-14 Tomcat', 'North American P-51 Mustang', 'Messerschmitt Bf 109', 'Mitsubishi A6M Zero', 'Eurofighter Typhoon', 'Dassault Rafale', 'Saab JAS 39 Gripen', 'McDonnell Douglas F-4 Phantom II', 'Mikoyan-Gurevich MiG-15', 'Mikoyan-Gurevich MiG-21', 'Hawker Hurricane', 'Focke-Wulf Fw 190', 'Sukhoi Su-57', 'Chengdu J-20', 'Northrop F-5', 'Lockheed P-38 Lightning', 'Vought F4U Corsair', 'Grumman F6F Hellcat', 'Messerschmitt Me 262', 'Sopwith Camel', 'Fokker Dr.I', 'Harrier Jump Jet', 'Mirage III', 'Dassault Mirage 2000', 'Panavia Tornado', 'Mikoyan MiG-25', 'Lockheed F-104 Starfighter', 'North American F-86 Sabre', 'HAL Tejas', 'Sukhoi Su-30'],
    extraAliases: { 'General Dynamics F-16 Fighting Falcon': ['F-16', 'F16', 'Fighting Falcon', 'F-16 Fighting Falcon'], 'Lockheed Martin F-35 Lightning II': ['F-35', 'F35', 'Lightning II', 'F-35 Lightning II'], 'Lockheed Martin F-22 Raptor': ['F-22', 'F22', 'Raptor', 'F-22 Raptor'], 'Supermarine Spitfire': ['Spitfire'], 'North American P-51 Mustang': ['P-51', 'Mustang', 'P-51 Mustang'], 'Messerschmitt Bf 109': ['Bf 109', 'Me 109'], 'Mitsubishi A6M Zero': ['Zero', 'A6M', 'Mitsubishi Zero'] },
    skip: nameIs(/^(fighter aircraft|fighter|fighter plane|aircraft|jet fighter|military aircraft|combat aircraft|interceptor|air superiority fighter|first-generation jet fighter|Horten Ho 229fkd|Chengdumivrg J-36)$/i),
    extras: [{ name: 'Horten Ho 229', signal: 30, aliases: ['Horten Ho 229 Gotha Go 229', 'Horten Ho IX'] }, { name: 'Chengdu J-36', signal: 25 }],
  },


  // ================================================================ Miscellaneous
  {
    id: 'misc-poet', category: 'Miscellaneous', prompt: 'Name a poet.',
    rules: 'Accept any real poet, from any period or country (William Shakespeare, Homer, Dante Alighieri, Walt Whitman, Emily Dickinson, Robert Frost, Maya Angelou, William Wordsworth, Lord Byron, John Keats, Percy Shelley, T. S. Eliot, Edgar Allan Poe, Rumi, Sylvia Plath, W. B. Yeats, Pablo Neruda), by their usual name or surname. Songwriters who are not known as poets and fictional poets do not count.',
    source: 'People in Wikidata whose occupation is poet and whose description names poetry, known in at least 20 languages.', pattern: occupation('Q49757') + HUMAN, minSignal: 20, alsoWritten: personForms,
    skip: notDescribedAs(/poet|poem|verse|lyric/i),
    mustHave: ['William Shakespeare', 'Homer', 'Dante Alighieri', 'Walt Whitman', 'Emily Dickinson', 'Robert Frost', 'Maya Angelou', 'William Wordsworth', 'Lord Byron', 'John Keats', 'Percy Bysshe Shelley', 'T. S. Eliot', 'Edgar Allan Poe', 'Rumi', 'Sylvia Plath', 'W. B. Yeats', 'Pablo Neruda', 'Rudyard Kipling', 'Alfred, Lord Tennyson', 'Oscar Wilde', 'Rabindranath Tagore', 'William Blake', 'Sappho', 'Virgil', 'Ovid', 'Johann Wolfgang von Goethe', 'Langston Hughes', 'Allen Ginsberg', 'Dylan Thomas', 'Seamus Heaney', 'Ted Hughes', 'Wilfred Owen', 'Rupert Brooke', 'John Donne', 'John Milton', 'Geoffrey Chaucer', 'Charles Baudelaire', 'Arthur Rimbaud', 'Federico García Lorca', 'Li Bai', 'Du Fu', 'Matsuo Bashō', 'Omar Khayyam', 'Hafez', 'Elizabeth Barrett Browning', 'Robert Burns', 'Christina Rossetti', 'Wisława Szymborska', 'Rainer Maria Rilke'],
  },
  {
    id: 'misc-architect', category: 'Miscellaneous', prompt: 'Name an architect.',
    rules: 'Accept any real architect, from any period or country (Frank Lloyd Wright, Zaha Hadid, Le Corbusier, Antoni Gaudí, Frank Gehry, I. M. Pei, Norman Foster, Christopher Wren, Ludwig Mies van der Rohe, Walter Gropius, Renzo Piano, Oscar Niemeyer, Tadao Ando, Santiago Calatrava), by their usual name or surname. Engineers, interior designers and fictional architects do not count.',
    source: 'People in Wikidata whose occupation is architect and whose description names architecture, known in at least 15 languages.', pattern: occupation('Q42973') + HUMAN, minSignal: 15, alsoWritten: personForms,
    skip: anyOf(notDescribedAs(/architect/i), nameIs(/^(Adolfo Pérez Esquivel|Raoul Wallenberg|Tahmineh Milani|Phidias|El Greco|Fayez al-Sarraj|Aa)$/i)),
    mustHave: ['Frank Lloyd Wright', 'Zaha Hadid', 'Le Corbusier', 'Antoni Gaudí', 'Frank Gehry', 'I. M. Pei', 'Norman Foster', 'Christopher Wren', 'Ludwig Mies van der Rohe', 'Walter Gropius', 'Renzo Piano', 'Oscar Niemeyer', 'Tadao Ando', 'Santiago Calatrava', 'Daniel Libeskind', 'Rem Koolhaas', 'Bjarke Ingels', 'Louis Sullivan', 'Eero Saarinen', 'Filippo Brunelleschi', 'Andrea Palladio', 'Michelangelo', 'Imhotep', 'Vitruvius', 'Inigo Jones', 'Alvar Aalto', 'Philip Johnson', 'Jørn Utzon', 'Richard Rogers', 'Kenzo Tange', 'Gustave Eiffel', 'Donato Bramante', 'Gian Lorenzo Bernini', 'Francesco Borromini', 'Karl Friedrich Schinkel', 'Charles Rennie Mackintosh', 'Victor Horta', 'Louis Kahn', 'Richard Meier', 'Thomas Heatherwick'],
  },
  {
    id: 'misc-retail-chain', category: 'Miscellaneous', prompt: 'Name a retail chain or supermarket.',
    rules: 'Accept any chain of shops, supermarkets, department stores or discount stores, from any country (Walmart, Target, Costco, Tesco, IKEA, Carrefour, Aldi, Lidl, Kroger, Home Depot, 7-Eleven, Best Buy, Zara, H&M, Marks & Spencer, Whole Foods, Sainsbury\'s, Walgreens, CVS, Woolworths). Online-only shops, single department stores, restaurants and the word "shop" on its own do not count.',
    source: 'Wikidata items that are a retail chain or a kind of one, known in at least 10 languages.', pattern: '?item wdt:P31/wdt:P279* wd:Q507619 .', minSignal: 10, alsoWritten: strip(/ (Stores|Store|Inc\.|Supermarkets|Supermarket|Holdings)$/i),
    mustHave: ['Walmart', 'Target', 'Costco', 'Tesco', 'IKEA', 'Carrefour', 'Aldi', 'Lidl', 'Kroger', 'The Home Depot', '7-Eleven', 'Best Buy', 'Zara', 'H&M', 'Marks & Spencer', 'Whole Foods Market', "Sainsbury's", 'Walgreens', 'CVS Pharmacy', 'Woolworths', 'Auchan', 'Mercadona', 'Asda', 'Morrisons', 'Waitrose', "Trader Joe's", 'Publix', 'Safeway', 'Dollar General', 'Dollar Tree', "Macy's", 'Nordstrom', 'Kmart', 'Sears', 'JCPenney', 'Staples', 'Boots', 'Primark', "Lowe's", 'Toys "R" Us', 'Uniqlo', 'Spar', 'Coles', 'Loblaws', 'Tesco Express'],
    skip: anyOf(nameIs(/^(retail chain|supermarket chain|chain store|retail|supermarket|department store|Super Bowl|Outback Steakhouse|Mere)$/i), (c) => !!c.desc && (!/retail|supermarket|store|shop|chain|hypermarket|grocery|pharmacy|drug|discount|market|mall|convenience|apparel|furniture|variety|department/i.test(c.desc) || /restaurant|fast.?food|oil|petrol|gas station|energy|hotel|cinema|theat|coffee|pizza|burger|chicken|ice cream|sandwich/i.test(c.desc))),
  },
  {
    id: 'misc-watch-brand', category: 'Miscellaneous', prompt: 'Name a watch brand.',
    rules: 'Accept any brand of wrist or pocket watches, luxury or cheap, analogue or smart (Rolex, Omega, Seiko, Casio, Swatch, Patek Philippe, Audemars Piguet, TAG Heuer, Breitling, Cartier, Citizen, Timex, Tissot, Longines, Hublot, IWC, Tudor, Fossil, Apple Watch). Clock makers, jewellers that do not sell watches and the word "watch" on its own do not count.',
    source: 'Wikidata companies and brands in the watchmaking industry, known in at least 5 languages.', pattern: '{ { ?item wdt:P452 wd:Q41767 } UNION { ?item wdt:P31 wd:Q3329096 } } .', minSignal: 5, alsoWritten: strip(/ (watches|watch|Co\.|AG|SA|S\.A\.)$/i),
    skip: nameIs(/^(watch|watches|Allgemeine Gesellschaft der Schweizerischen Uhrenindustrie|Geneva seal)$/i),
    mustHave: ['Rolex', 'Omega', 'Seiko', 'Casio', 'Swatch', 'Patek Philippe', 'Audemars Piguet', 'TAG Heuer', 'Breitling', 'Cartier', 'Citizen', 'Timex', 'Tissot', 'Longines', 'Hublot', 'IWC Schaffhausen', 'Tudor', 'Fossil', 'Apple Watch', 'Vacheron Constantin', 'Jaeger-LeCoultre', 'Panerai', 'Rado', 'Hamilton', 'Bulova', 'Garmin', 'G-Shock', 'Richard Mille', 'A. Lange & Söhne', 'Blancpain', 'Zenith', 'Piaget', 'Chopard', 'Bell & Ross', 'Casio G-Shock', 'Orient', 'Fitbit', 'Movado', 'Oris', 'Maurice Lacroix'],
  },
]
