/**
 * Batch 2: 48 new questions, each a clear class that Wikidata models, spread over the 11 categories (4 or 5 each).
 * Same recipe as batch 1 (see batch1.ts and newq.ts): a Wikidata class or occupation, a minimum number of Wikipedia languages so the
 * list has a head people know, and `mustHave` = the answers a casual English-speaking player thinks of first, most obvious first.
 * Build with: npx tsx src/expand/newq.ts --batch batch2 --out C:/Users/weibi/minitude/list-build/batch2
 */
import { speciesBelow } from './build'
import type { NewQuestion } from './newq'
import { anyOf, instanceOf, kindOf, latinOnly, latinTaxon, nameIs, NOT_EXTINCT, notDescribedAs, occupation, personForms, strip } from './recipes'

const CAR_BRANDS = /^(Toyota|Honda|Ford|Chevrolet|Volkswagen|BMW|Mercedes-Benz|Audi|Nissan|Mazda|Subaru|Porsche|Ferrari|Lamborghini|Jeep|Dodge|Kia|Hyundai|Volvo|Fiat|Renault|Peugeot|Citroën|Land Rover|Jaguar|Suzuki|Mitsubishi|Lexus|Tesla|Opel|Škoda|Saab|Buick|Cadillac|Chrysler|Lincoln|GMC|Pontiac|Plymouth|Bentley|Rolls-Royce|Aston Martin|McLaren|Maserati|Alfa Romeo|Lancia|Lotus|Bugatti|DeLorean) /
const MAKERS = /^(Boeing|Airbus|Cessna|Supermarine|Lockheed Martin|Lockheed|Messerschmitt|Douglas|McDonnell Douglas|Northrop Grumman|Northrop|Hawker|Avro|Mitsubishi|de Havilland|De Havilland|Fokker|Sopwith|Bell|Sikorsky|Piper|Tupolev|Antonov|Embraer|Cirrus|Learjet|Grumman|North American|Republic|Curtiss|Mikoyan-Gurevich|Sukhoi|Dassault|Vought|Convair|Bombardier|Gulfstream|Beechcraft|Wright|Heinkel|Junkers|Focke-Wulf|Vickers|Handley Page) /
const COMPANY_SUFFIX = / (Interactive Entertainment|Entertainment|Corporation|Inc\.?|Ltd\.?|Co\., Ltd\.|Games|Studios|Softworks|Software)$/
const NATIONALITY = /^(United States|US|Japanese|Chinese|Swiss|Indian|Mexican|Canadian|Australian|New Zealand|British|Russian|Brazilian|South Korean|Turkish|South African|Swedish|Norwegian|Danish|Polish|Thai|Singapore|Hong Kong|Israeli|Saudi|Egyptian|Nigerian|Philippine|Argentine|Indonesian|Malaysian|Vietnamese|Czech|Hungarian|Ukrainian) /

export const BATCH: NewQuestion[] = [
  // ================================================================ Animals & Nature
  {
    id: 'animals-mammal', category: 'Animals & Nature', prompt: 'Name a mammal.',
    rules: 'Accept any living mammal by its common name (lion, blue whale, platypus) or its scientific name, including domestic animals (dog, cat, cow, horse) and group names where every member is a mammal (such as whale, bat, monkey or rodent). Birds, reptiles, fish, extinct animals and fictional animals do not count.',
    source: 'Species below the class "mammal" in Wikidata (without extinct ones), by their English common names, plus domestic animals and group names added by hand.',
    fetch: () => speciesBelow(['Q7377'], NOT_EXTINCT, 'Q7432', { depth: 10, commonNames: true, fame: true }), commonNames: true, skip: latinOnly,
    extras: [
      { name: 'Dog', signal: 150, aliases: ['domestic dog', 'dogs', 'puppy'] }, { name: 'Cat', signal: 150, aliases: ['domestic cat', 'cats', 'kitten'] }, { name: 'Cow', signal: 100, aliases: ['cattle', 'cows'] },
      { name: 'Pig', signal: 100, aliases: ['pigs', 'hog'] }, { name: 'Sheep', signal: 100 }, { name: 'Goat', signal: 90 }, { name: 'Horse', signal: 120, aliases: ['horses'] }, { name: 'Elephant', signal: 120, aliases: ['elephants'] },
      { name: 'Whale', signal: 100, aliases: ['whales'] }, { name: 'Dolphin', signal: 100, aliases: ['dolphins'] }, { name: 'Bear', signal: 100, aliases: ['bears'] }, { name: 'Monkey', signal: 100, aliases: ['monkeys'] },
      { name: 'Ape', signal: 60 }, { name: 'Bat', signal: 90 }, { name: 'Deer', signal: 90 }, { name: 'Rabbit', signal: 100 }, { name: 'Mouse', signal: 100 }, { name: 'Rat', signal: 90 }, { name: 'Squirrel', signal: 80 },
      { name: 'Seal', signal: 80 }, { name: 'Kangaroo', signal: 90 }, { name: 'Zebra', signal: 90 }, { name: 'Fox', signal: 90 }, { name: 'Wolf', signal: 100 }, { name: 'Rodent', signal: 50 }, { name: 'Primate', signal: 50 },
    ],
    mustHave: ['Dog', 'Cat', 'Lion', 'Tiger', 'Elephant', 'Horse', 'Cow', 'Pig', 'Wolf', 'Bear', 'Giraffe', 'Monkey', 'Dolphin', 'Whale', 'Kangaroo', 'Giant panda', 'Rabbit', 'Fox', 'Deer', 'Gorilla', 'Zebra', 'Cheetah', 'Leopard', 'Hippopotamus', 'Rhinoceros', 'Camel', 'Sheep', 'Goat', 'Squirrel', 'Mouse', 'Rat', 'Bat', 'Koala', 'Polar bear', 'Platypus', 'Otter', 'Seal', 'Chimpanzee', 'Hedgehog', 'Hamster'],
  },
  {
    id: 'animals-bird', category: 'Animals & Nature', prompt: 'Name a bird.',
    rules: 'Accept any living bird species by its common name (bald eagle, flamingo, kiwi) or its scientific name, including domestic birds (chicken, duck) and group names where every member is a bird (such as eagle, owl, penguin or parrot). Bats, flying insects, dinosaurs, extinct birds and fictional birds do not count.',
    source: 'Species below the class "bird" in Wikidata (without extinct ones), by their English common names, plus group names added by hand.',
    fetch: () => speciesBelow(['Q5113'], NOT_EXTINCT, 'Q7432', { depth: 10, commonNames: true, fame: true }), commonNames: true, skip: latinOnly,
    extras: [
      { name: 'Eagle', signal: 100, aliases: ['eagles'] }, { name: 'Owl', signal: 100, aliases: ['owls'] }, { name: 'Penguin', signal: 100, aliases: ['penguins'] }, { name: 'Parrot', signal: 100, aliases: ['parrots'] },
      { name: 'Duck', signal: 100, aliases: ['ducks'] }, { name: 'Chicken', signal: 100, aliases: ['hen', 'rooster', 'chickens'] }, { name: 'Swan', signal: 90 }, { name: 'Crow', signal: 90 }, { name: 'Hawk', signal: 90 },
      { name: 'Falcon', signal: 90 }, { name: 'Goose', signal: 90, aliases: ['geese'] }, { name: 'Turkey', signal: 90 }, { name: 'Pelican', signal: 80 }, { name: 'Woodpecker', signal: 80 }, { name: 'Seagull', signal: 90, aliases: ['gull', 'seagulls'] },
      { name: 'Vulture', signal: 70 }, { name: 'Heron', signal: 70 }, { name: 'Stork', signal: 70 }, { name: 'Dove', signal: 80 }, { name: 'Pigeon', signal: 90 }, { name: 'Sparrow', signal: 80 }, { name: 'Finch', signal: 60 },
      { name: 'Hummingbird', signal: 90 }, { name: 'Albatross', signal: 70 }, { name: 'Flamingo', signal: 90 }, { name: 'Peacock', signal: 90, aliases: ['peafowl', 'peahen'] },
    ],
    rename: ['Ostrich', 'Puffin'],
    mustHave: ['Eagle', 'Owl', 'Penguin', 'Parrot', 'Duck', 'Chicken', 'Swan', 'Crow', 'Flamingo', 'Peacock', 'Ostrich', 'Hummingbird', 'Robin', 'Sparrow', 'Pigeon', 'Seagull', 'Toucan', 'Hawk', 'Falcon', 'Goose', 'Turkey', 'Pelican', 'Woodpecker', 'Kiwi', 'Bald eagle', 'Albatross', 'Vulture', 'Heron', 'Stork', 'Raven', 'Magpie', 'Swallow', 'Canary', 'Dove', 'Cockatoo', 'Emu', 'Puffin', 'Kingfisher', 'Blue jay', 'Cardinal'],
  },
  {
    id: 'animals-fish', category: 'Animals & Nature', prompt: 'Name a fish.',
    rules: 'Accept any fish, bony or cartilaginous, by its common name (salmon, clownfish, great white shark) or its scientific name, including group names where every member is a fish (such as shark, ray, eel or tuna). Whales, dolphins, seals, jellyfish, starfish, shellfish and fictional fish do not count.',
    source: 'Species below the classes "ray-finned fish" and "shark" in Wikidata (without extinct ones), by their English common names, plus group names added by hand.',
    fetch: () => speciesBelow(['Q127282', 'Q7372'], NOT_EXTINCT, 'Q7432', { depth: 11, commonNames: true, fame: true }), commonNames: true, skip: latinOnly,
    extras: [
      { name: 'Shark', signal: 100, aliases: ['sharks'] }, { name: 'Ray', signal: 60 }, { name: 'Stingray', signal: 70 }, { name: 'Manta ray', signal: 70 }, { name: 'Skate', signal: 40 }, { name: 'Eel', signal: 70 },
      { name: 'Tuna', signal: 80 }, { name: 'Salmon', signal: 90 }, { name: 'Trout', signal: 80 }, { name: 'Goldfish', signal: 90 }, { name: 'Clownfish', signal: 80, aliases: ['clown fish', 'anemonefish'] },
      { name: 'Seahorse', signal: 80, aliases: ['sea horse'] }, { name: 'Barracuda', signal: 60 }, { name: 'Pufferfish', signal: 70, aliases: ['puffer fish', 'blowfish', 'fugu'] }, { name: 'Swordfish', signal: 70 }, { name: 'Piranha', signal: 70 },
    ],
    mustHave: ['Salmon', 'Tuna', 'Goldfish', 'Shark', 'Clownfish', 'Cod', 'Trout', 'Swordfish', 'Pufferfish', 'Seahorse', 'Eel', 'Piranha', 'Catfish', 'Carp', 'Bass', 'Herring', 'Sardine', 'Anchovy', 'Tilapia', 'Mackerel', 'Great white shark', 'Angelfish', 'Betta', 'Guppy', 'Barracuda', 'Manta ray', 'Stingray', 'Koi', 'Haddock', 'Pike', 'Perch', 'Halibut', 'Flounder', 'Marlin', 'Sturgeon', 'Lionfish', 'Mahi-mahi', 'Snapper', 'Grouper', 'Hammerhead shark'],
  },
  {
    id: 'animals-cat-breed', category: 'Animals & Nature', prompt: 'Name a breed of cat.',
    rules: 'Accept any recognised cat breed, including rare, regional and hybrid breeds that have their own name (Maine Coon, Sphynx, Bengal, Savannah). Wild cats such as the lion, individual cats, fictional cats and the word "cat" do not count.',
    source: 'Wikidata items that are a "cat breed".', pattern: '?item wdt:P31 wd:Q43577 .', minSignal: 1,
    mustHave: ['Siamese cat', 'Persian cat', 'Maine Coon', 'Bengal cat', 'Ragdoll', 'Sphynx cat', 'British Shorthair', 'Abyssinian', 'Scottish Fold', 'Russian Blue', 'Burmese cat', 'Birman', 'Norwegian Forest cat', 'Savannah cat', 'Siberian cat', 'Manx cat', 'Devon Rex', 'American Shorthair', 'Turkish Angora', 'Himalayan cat', 'Munchkin cat', 'Exotic Shorthair', 'Oriental Shorthair', 'Tonkinese', 'Balinese cat', 'Cornish Rex', 'Egyptian Mau', 'Ocicat', 'Chartreux', 'Japanese Bobtail'],
  },
  {
    id: 'animals-national-park', category: 'Animals & Nature', prompt: 'Name a national park.',
    rules: 'Accept any national park in the world, with or without the words "National Park" (Yellowstone, Serengeti, Banff, Kruger). State parks, nature reserves that are not national parks, theme parks and city parks do not count.',
    source: 'Wikidata items that are a national park, known in at least 8 languages.', pattern: '?item wdt:P31 wd:Q46169 .', minSignal: 8, alsoWritten: strip(/ National Park$/i),
    mustHave: ['Yellowstone National Park', 'Grand Canyon National Park', 'Yosemite National Park', 'Banff National Park', 'Kruger National Park', 'Serengeti National Park', 'Zion National Park', 'Glacier National Park', 'Great Smoky Mountains National Park', 'Acadia National Park', 'Arches National Park', 'Bryce Canyon National Park', 'Everglades National Park', 'Rocky Mountain National Park', 'Olympic National Park', 'Denali National Park and Preserve', 'Jasper National Park', 'Torres del Paine National Park', 'Fiordland National Park', 'Kakadu National Park', 'Komodo National Park', 'Joshua Tree National Park', 'Death Valley National Park', 'Sequoia National Park', 'Grand Teton National Park', 'Redwood National Park', 'Lake District National Park', 'Snowdonia National Park', 'Cairngorms National Park', 'Galápagos National Park'],
  },

  // ================================================================ Food
  {
    id: 'food-fruit', category: 'Food', prompt: 'Name a fruit.',
    rules: 'Accept any fruit that people eat, by its everyday name (apple, mango, durian, lychee), including berries and citrus fruits. Vegetables, nuts, grains and mushrooms do not count, and neither do the words "fruit" or "berry" on their own.',
    source: 'Wikidata items that are a fruit or a kind of fruit, known in at least 3 languages.', pattern: kindOf('Q3314483'), minSignal: 3,
    mustHave: ['Apple', 'Banana', 'Orange', 'Strawberry', 'Grape', 'Mango', 'Pineapple', 'Watermelon', 'Lemon', 'Peach', 'Cherry', 'Blueberry', 'Pear', 'Kiwifruit', 'Coconut', 'Raspberry', 'Plum', 'Lime', 'Papaya', 'Avocado', 'Pomegranate', 'Fig', 'Apricot', 'Melon', 'Grapefruit', 'Passion fruit', 'Lychee', 'Durian', 'Dragon fruit', 'Cranberry', 'Blackberry', 'Tangerine', 'Nectarine', 'Guava', 'Cantaloupe', 'Mandarin orange'],
    extraAliases: { Kiwifruit: ['Kiwi'], Cherry: ['Cherries'] },
    rename: ['Lychee', 'Dragon fruit'],
    skip: anyOf(latinTaxon, nameIs(/^(dried fruit|berry|cooking banana|pine nut|umeboshi|Riesling|Apple of Discord|kola nut|windfall fruit|marinated olives|Wikidata Sandbox)$/i)),
  },
  {
    id: 'food-vegetable', category: 'Food', prompt: 'Name a vegetable.',
    rules: 'Accept any vegetable that people eat, by its everyday name, including roots, leaves, stems and the ones cooked as vegetables (carrot, spinach, tomato, potato, pumpkin, bok choy). Fruits eaten sweet, grains, mushrooms and the word "vegetable" on its own do not count.',
    source: 'Wikidata items that are a vegetable or a kind of vegetable, known in at least 3 languages.', pattern: kindOf('Q11004'), minSignal: 3,
    mustHave: ['Carrot', 'Potato', 'Tomato', 'Onion', 'Broccoli', 'Spinach', 'Lettuce', 'Cucumber', 'Cabbage', 'Cauliflower', 'Bell pepper', 'Garlic', 'Sweet corn', 'Pea', 'Celery', 'Pumpkin', 'Zucchini', 'Eggplant', 'Asparagus', 'Kale', 'Beetroot', 'Radish', 'Sweet potato', 'Green bean', 'Leek', 'Artichoke', 'Brussels sprout', 'Turnip', 'Okra', 'Chili pepper', 'Squash', 'Parsnip', 'Bok choy', 'Kohlrabi'],
    extraAliases: { Zucchini: ['Courgette'], Eggplant: ['Aubergine'], Beetroot: ['Beet'] },
    rename: ['Spinach', 'Lettuce', 'Beetroot', 'Squash', 'Bok choy', 'Artichoke'],
    skip: anyOf(latinTaxon, nameIs(/^(kimchi|umeboshi|tsukemono|takuan|beni shōga|gari|achar|torshi|noonsom|Shikrarpuri Achar|pickled cucumber|root vegetable|leaf vegetable|edible plant stem|kombu)$/i)),
  },
  {
    id: 'food-dessert', category: 'Food', prompt: 'Name a dessert.',
    rules: 'Accept any dessert or sweet dish from any cuisine, including cakes, pies, puddings, frozen desserts, pastries and sweets (tiramisu, baklava, ice cream, gulab jamun). Savoury dishes, drinks and the word "dessert" on its own do not count.',
    source: 'Wikidata items that are a dessert or a kind of dessert, known in at least 3 languages.', pattern: kindOf('Q182940'), minSignal: 3,
    rename: ['Brownie', 'Flan'],
    mustHave: ['Ice cream', 'Cake', 'Cheesecake', 'Tiramisu', 'Brownie', 'Pudding', 'Apple pie', 'Pie', 'Cookie', 'Doughnut', 'Cupcake', 'Flan', 'Crème brûlée', 'Macaron', 'Pavlova', 'Baklava', 'Gelato', 'Sundae', 'Waffle', 'Trifle', 'Panna cotta', 'Mousse', 'Churro', 'Éclair', 'Cannoli', 'Mochi', 'Gulab jamun', 'Kheer', 'Chocolate cake', 'Banana split', 'Cobbler', 'Crumble', 'Sorbet', 'Profiterole', 'Rice pudding', 'Custard'],
    skip: nameIs(/^(haggis|aspic|congee|Yorkshire pudding|drisheen|Granita PAT)$/i),
  },
  {
    id: 'food-soft-drink', category: 'Food', prompt: 'Name a soft drink.',
    rules: 'Accept any non-alcoholic fizzy or sweet drink, brand or type (Coca-Cola, Fanta, ginger ale, root beer, lemonade, Irn-Bru). Plain water, juice, milk, tea, coffee, alcoholic drinks and the words "soft drink" or "soda" on their own do not count.',
    source: 'Wikidata items that are a soft drink or a kind of soft drink, known in at least 2 languages.', pattern: kindOf('Q147538'), minSignal: 2,
    rename: ['Orange soda', 'Club soda'],
    mustHave: ['Coca-Cola', 'Pepsi', 'Sprite', 'Fanta', '7 Up', 'Dr Pepper', 'Mountain Dew', 'Root beer', 'Ginger ale', 'Lemonade', 'Cola', 'Orange soda', 'Red Bull', 'Irn-Bru', 'Tonic water', 'Ramune', 'Schweppes', 'Mirinda', 'Inca Kola', 'Gatorade', 'Club soda', 'Cream soda', 'Ginger beer', 'Kombucha', 'Energy drink', 'Vimto', 'Tango', 'Canada Dry', 'Fresca', 'Barq\'s', 'Monster Energy'],
    skip: nameIs(/^(yogurt|kumis|ayran|kefir|lassi|crème fraîche|strained yogurt|Skyr|smetana|soured milk|sour cream|ryazhenka|ice cream float)$/i),
  },
  {
    id: 'food-restaurant-chain', category: 'Food', prompt: 'Name a restaurant chain.',
    rules: 'Accept any restaurant or fast-food chain with several branches, in any country (McDonald\'s, KFC, Nando\'s, Jollibee, Starbucks). Single restaurants, food brands sold in shops, supermarkets and delivery apps do not count.',
    source: 'Wikidata items that are a restaurant chain or a fast-food chain, known in at least 5 languages.', pattern: instanceOf('Q18534542'), minSignal: 5,
    mustHave: ['McDonald\'s', 'KFC', 'Burger King', 'Subway', 'Starbucks', 'Pizza Hut', 'Domino\'s', 'Taco Bell', 'Wendy\'s', 'Dunkin\'', 'Chipotle Mexican Grill', 'Papa John\'s', 'Five Guys', 'Popeyes', 'Chick-fil-A', 'Nando\'s', 'Tim Hortons', 'Dairy Queen', 'Panda Express', 'Pret A Manger', 'Wagamama', 'Jollibee', 'In-N-Out Burger', 'Shake Shack', 'Krispy Kreme', 'Hooters', 'Olive Garden', 'Denny\'s', 'IHOP', 'Carl\'s Jr.', 'Sonic Drive-In', 'Arby\'s', 'Costa Coffee', 'Greggs', 'Red Lobster', 'Applebee\'s', 'Texas Roadhouse', 'Cracker Barrel'],
  },

  // ================================================================ Games
  {
    id: 'games-console', category: 'Games', prompt: 'Name a video game console.',
    rules: 'Accept any home or handheld video game console (PlayStation 2, Nintendo Switch, Game Boy, Sega Genesis, Steam Deck), by its full or usual name. Games, controllers, companies, personal computers and phones do not count.',
    source: 'Wikidata items that are a video game console or a kind of one (a PlayStation 2 is filed as a kind of "home video game console"), known in at least 4 languages.', pattern: kindOf('Q8076'), minSignal: 4,
    mustHave: ['PlayStation 2', 'Nintendo Switch', 'PlayStation', 'Xbox', 'Nintendo Entertainment System', 'Super Nintendo Entertainment System', 'PlayStation 4', 'Xbox 360', 'Wii', 'Game Boy', 'Nintendo 64', 'PlayStation 3', 'PlayStation 5', 'Xbox One', 'Sega Genesis', 'Atari 2600', 'GameCube', 'Nintendo DS', 'Dreamcast', 'Game Boy Advance', 'PlayStation Portable', 'Wii U', 'Nintendo 3DS', 'Sega Saturn', 'Atari Jaguar', 'Neo Geo', 'PlayStation Vita', 'Steam Deck', 'ColecoVision', 'TurboGrafx-16'],
    extraAliases: { 'Nintendo Entertainment System': ['NES'], 'Super Nintendo Entertainment System': ['SNES', 'Super Nintendo'], 'PlayStation Portable': ['PSP'], 'Nintendo Switch': ['Switch'] },
  },
  {
    id: 'games-video-game-character', category: 'Games', prompt: 'Name a video game character.',
    rules: 'Accept any character who appears in a video game, hero or villain, playable or not (Mario, Sonic, Lara Croft, Kratos, Pikachu, Steve). Real people, characters from films or books who are not in a game, whole franchises and companies do not count.',
    source: 'Wikidata items that are a video game character, known in at least 8 languages.', pattern: instanceOf('Q1569167'), minSignal: 8,
    mustHave: ['Mario', 'Sonic the Hedgehog', 'Link', 'Pikachu', 'Donkey Kong', 'Luigi', 'Princess Peach', 'Kirby', 'Samus Aran', 'Lara Croft', 'Pac-Man', 'Master Chief', 'Crash Bandicoot', 'Mega Man', 'Yoshi', 'Bowser', 'Zelda', 'Cloud Strife', 'Solid Snake', 'Steve', 'Kratos', 'Ryu', 'Geralt of Rivia', 'Ezio Auditore', 'Nathan Drake', 'Spyro', 'Tails', 'Knuckles the Echidna', 'Wario', 'Fox McCloud', 'Ganon', 'Sephiroth', 'Chun-Li', 'Scorpion', 'Sub-Zero', 'Doctor Eggman', 'Rayman', 'Diddy Kong', 'Toad', 'Isabelle'],
  },
  {
    id: 'games-card-game', category: 'Games', prompt: 'Name a card game.',
    rules: 'Accept any game played with cards, from the traditional (poker, bridge, rummy, solitaire) to the commercial (Uno, Magic: The Gathering, Yu-Gi-Oh!, Exploding Kittens). Board games, video games, and the words "card game" on their own do not count.',
    source: 'Wikidata items that are a card game or a kind of card game, known in at least 2 languages.', pattern: kindOf('Q142714'), minSignal: 2,
    mustHave: ['Poker', 'Blackjack', 'Bridge', 'Solitaire', 'Uno', 'Hearts', 'Rummy', 'Go Fish', 'Spades', 'Magic: The Gathering', 'Pokémon Trading Card Game', 'Yu-Gi-Oh!', 'Baccarat', 'Cribbage', 'Euchre', 'Gin rummy', 'Canasta', 'Snap', 'Old Maid', 'War', 'Crazy Eights', 'Pinochle', 'Skat', 'Tarot', 'Hanafuda', 'Durak', 'Whist', 'Cards Against Humanity', 'Exploding Kittens', 'Dominion', 'Texas hold \'em', 'Texas Hold \'em'],
    extraAliases: { Poker: ['Texas hold em'], Solitaire: ['Patience'] },
    rename: ['Bridge', 'Tarot'],
    skip: nameIs(/^(Professional eater|collectible card game|deck-building game|tarot card game|Visconti-Sforza tarot|Tarot of Marseilles)$/i),
  },
  {
    id: 'games-video-game-company', category: 'Games', prompt: 'Name a video game company.',
    rules: 'Accept any company that develops or publishes video games, large or small, current or defunct (Nintendo, Ubisoft, Rockstar Games, Valve, FromSoftware, Atari). Individual games, consoles, characters and the word "studio" on its own do not count.',
    source: 'Wikidata items that are a video game developer or a video game publisher, known in at least 6 languages.',
    pattern: '{ ?item wdt:P31/wdt:P279* wd:Q210167 } UNION { ?item wdt:P31/wdt:P279* wd:Q1137109 } .', minSignal: 6, alsoWritten: strip(COMPANY_SUFFIX),
    mustHave: ['Nintendo', 'Sony Interactive Entertainment', 'Microsoft', 'Electronic Arts', 'Ubisoft', 'Activision', 'Blizzard Entertainment', 'Rockstar Games', 'Valve Corporation', 'Capcom', 'Square Enix', 'Sega', 'Konami', 'Bandai Namco Entertainment', 'Epic Games', 'Bethesda Softworks', 'CD Projekt', 'FromSoftware', 'Naughty Dog', 'Bungie', 'Riot Games', 'Mojang Studios', 'Take-Two Interactive', 'Atari', 'Rovio Entertainment', 'Supercell', 'Tencent', 'Game Freak', 'Insomniac Games', 'id Software', 'Gearbox Software', 'Respawn Entertainment', 'Telltale Games', 'Remedy Entertainment', 'Playground Games', 'Santa Monica Studio'],
    skip: (c) => /^(ETH Zurich|École polytechnique fédérale de Lausanne|Google Arts & Culture|NEC|Commodore International)$/.test(c.name) || /\buniversity\b|institute of technology/i.test(c.desc ?? ''),
  },

  // ================================================================ History & Mythology
  {
    id: 'history-mythical-creature', category: 'History & Mythology', prompt: 'Name a mythical creature.',
    rules: 'Accept any creature from myth, legend or folklore, from any culture (dragon, unicorn, kraken, kitsune, banshee, minotaur, yeti). Real animals, gods and goddesses, human heroes, and creatures that exist only in one modern book or film do not count.',
    source: 'Wikidata items that are a mythical creature or a kind of one, known in at least 6 languages.', pattern: instanceOf('Q2239243'), minSignal: 6,
    extras: [{ name: 'Harpy', signal: 40 }],
    mustHave: ['Dragon', 'Unicorn', 'Phoenix', 'Mermaid', 'Centaur', 'Minotaur', 'Griffin', 'Pegasus', 'Cyclops', 'Medusa', 'Hydra', 'Werewolf', 'Vampire', 'Troll', 'Goblin', 'Fairy', 'Kraken', 'Sphinx', 'Yeti', 'Bigfoot', 'Leprechaun', 'Banshee', 'Chimera', 'Cerberus', 'Basilisk', 'Siren', 'Harpy', 'Gnome', 'Ogre', 'Zombie', 'Ghost', 'Elf', 'Dwarf', 'Giant', 'Genie', 'Kitsune', 'Thunderbird', 'Loch Ness Monster', 'Chupacabra', 'Golem'],
    skip: (c) => (/\b(god|goddess|deity|divinity|archangel|angel|prophet|hero|titan|titaness|demigod|Olympians?|personification|warrior|king|queen)\b|mythological figure|figure in|central character|(mother|father|ruler) of/i.test(c.desc ?? '') && !/creature|monster|beast|bird|serpent|dragon/i.test(c.desc ?? '')) || /^(Satan|Lucifer|Betty Ross)$/.test(c.name),
  },
  {
    id: 'history-war', category: 'History & Mythology', prompt: 'Name a war.',
    rules: 'Accept any named war, from any period or place (World War II, the Hundred Years\' War, the Vietnam War, the Trojan War), with or without the word "War". Single battles, sieges, revolutions that were not wars, and fictional wars do not count.',
    source: 'Wikidata items that are a war or a kind of war, known in at least 10 languages.', pattern: instanceOf('Q198'), minSignal: 10,
    extras: [{ name: 'War in Afghanistan', signal: 100, aliases: ['Afghanistan War', 'Afghan War'] }],
    alsoWritten: (n) => (/^(World War|Cold War)/.test(n) ? [] : strip(/ War$/)(n)),
    extraAliases: { 'World War II': ['WWII', 'WW2', 'Second World War'], 'World War I': ['WWI', 'WW1', 'First World War', 'Great War'], 'American Civil War': ['Civil War'] },
    mustHave: ['World War II', 'World War I', 'Vietnam War', 'American Civil War', 'Cold War', 'Korean War', 'Hundred Years\' War', 'Napoleonic Wars', 'Gulf War', 'Iraq War', 'War in Afghanistan', 'Trojan War', 'Punic Wars', 'Crimean War', 'American Revolutionary War', 'Thirty Years\' War', 'Peloponnesian War', 'Wars of the Roses', 'Russo-Japanese War', 'Six-Day War', 'Spanish Civil War', 'Second Boer War', 'Opium Wars', 'Seven Years\' War', 'War of 1812', 'Falklands War', 'Russo-Ukrainian War', 'Crusades', 'Mexican–American War', 'Spanish–American War', 'Franco-Prussian War', 'Yom Kippur War', 'Iran–Iraq War', 'Winter War', 'English Civil War'],
    skip: nameIs(/^(Arab Spring|Arab Winter|Eastern Front|World War III|Year of the Five Emperors)$/),
  },
  {
    id: 'history-explorer', category: 'History & Mythology', prompt: 'Name an explorer.',
    rules: 'Accept any real explorer who travelled to find out about new lands, seas, poles or mountains, from any period (Christopher Columbus, Marco Polo, Ferdinand Magellan, Roald Amundsen, Ibn Battuta). Astronauts, fictional explorers and conquerors known only for war do not count.',
    source: 'People in Wikidata whose occupation is explorer, known in at least 8 languages.', pattern: occupation('Q11900058'), minSignal: 8, alsoWritten: personForms,
    skip: anyOf((c) => /Díaz del Brawl/.test(c.name), notDescribedAs(/explor|navigator|conquistador|adventurer|voyager|mountaineer|traveller|traveler|cartographer|discoverer|seafarer|geograph|pioneer|climber|frontier|cosmonaut|astronaut|settler|expedition|Lewis and Clark/i)), // Wikidata's English label for Bernal Díaz del Castillo was vandalised when this was built
    mustHave: ['Christopher Columbus', 'Marco Polo', 'Ferdinand Magellan', 'James Cook', 'Vasco da Gama', 'Roald Amundsen', 'Leif Erikson', 'Amerigo Vespucci', 'Hernán Cortés', 'Francisco Pizarro', 'Meriwether Lewis', 'William Clark', 'David Livingstone', 'Henry Morton Stanley', 'Ernest Shackleton', 'Robert Falcon Scott', 'Edmund Hillary', 'Tenzing Norgay', 'Jacques Cartier', 'Samuel de Champlain', 'Henry Hudson', 'Abel Tasman', 'Zheng He', 'Ibn Battuta', 'Francis Drake', 'Walter Raleigh', 'John Cabot', 'Hernando de Soto', 'Juan Ponce de León', 'Vitus Bering', 'Jacques Cousteau', 'Thor Heyerdahl', 'Bartolomeu Dias', 'Pedro Álvares Cabral', 'Daniel Boone', 'Willem Barentsz'],
  },
  {
    id: 'history-philosopher', category: 'History & Mythology', prompt: 'Name a philosopher.',
    rules: 'Accept any philosopher from any culture or period (Socrates, Confucius, Kant, Simone de Beauvoir, Nietzsche, Avicenna). Scientists, religious founders and writers who are not mainly known as philosophers do not count.',
    source: 'People in Wikidata whose occupation is philosopher, known in at least 10 languages.', pattern: occupation('Q4964182'), minSignal: 10, alsoWritten: personForms,
    skip: anyOf((c) => c.name === 'Erick Fromm', notDescribedAs(/philosoph|thinker|theologian|scholastic|logician|sophist|ethicist|metaphysic|stoic|cynic|sage|mystic|sociolog|political theor|moralist|strategist|polymath/i)), // a typo in Wikidata's English label; the real name is added below
    extras: [{ name: 'Erich Fromm', signal: 130 }],
    mustHave: ['Socrates', 'Plato', 'Aristotle', 'Immanuel Kant', 'Friedrich Nietzsche', 'René Descartes', 'Confucius', 'Karl Marx', 'John Locke', 'Jean-Jacques Rousseau', 'Voltaire', 'David Hume', 'Thomas Aquinas', 'Augustine of Hippo', 'Jean-Paul Sartre', 'Søren Kierkegaard', 'Ludwig Wittgenstein', 'Georg Wilhelm Friedrich Hegel', 'Arthur Schopenhauer', 'Thomas Hobbes', 'Baruch Spinoza', 'Epicurus', 'Laozi', 'Simone de Beauvoir', 'Bertrand Russell', 'Niccolò Machiavelli', 'John Stuart Mill', 'Michel Foucault', 'Albert Camus', 'Diogenes', 'Pythagoras', 'Heraclitus', 'Seneca', 'Marcus Aurelius', 'Francis Bacon', 'Gottfried Wilhelm Leibniz', 'Hannah Arendt', 'Noam Chomsky'],
  },

  // ================================================================ Places
  {
    id: 'places-mountain', category: 'Places', prompt: 'Name a mountain.',
    rules: 'Accept any single named mountain or peak, in any country, with or without the word "Mount" (Everest, K2, Kilimanjaro, Mont Blanc, Fuji, Denali, the Matterhorn). Mountain ranges as a whole (the Alps, the Himalayas), volcanoes named only as a field, hills, and fictional mountains do not count.',
    source: 'Wikidata items that are a mountain, known in at least 20 languages.', pattern: instanceOf('Q8502'), minSignal: 20, alsoWritten: strip(/^(Mount|Mt\.?) /),
    mustHave: ['Mount Everest', 'K2', 'Kangchenjunga', 'Lhotse', 'Makalu', 'Cho Oyu', 'Denali', 'Mount Kilimanjaro', 'Mont Blanc', 'Matterhorn', 'Mount Fuji', 'Mount Elbrus', 'Aconcagua', 'Mount Kenya', 'Mount Vesuvius', 'Mount Etna', 'Table Mountain', 'Mount Olympus', 'Mount Sinai', 'Mount St. Helens', 'Eiger', 'Mount Ararat', 'Annapurna', 'Nanga Parbat', 'Mount Rainier', 'Mount Whitney', 'Ben Nevis', 'Snowdon', 'Mount Kosciuszko', 'Mount Cook', 'Pikes Peak', 'Jungfrau', 'Mount Hood', 'Mount Rushmore'],
  },
  {
    id: 'places-lake', category: 'Places', prompt: 'Name a lake.',
    rules: 'Accept any named lake, large or small, in any country, with or without the word "Lake" or "Loch" (Superior, Victoria, Baikal, Titicaca, Como, Loch Ness). Seas, rivers, reservoirs named as dams, ponds, and fictional lakes do not count.',
    source: 'Wikidata items that are a lake, known in at least 25 languages.', pattern: instanceOf('Q23397'), minSignal: 25, alsoWritten: strip(/^(Lake|Loch) /),
    mustHave: ['Lake Superior', 'Lake Victoria', 'Lake Michigan', 'Lake Baikal', 'Lake Tanganyika', 'Lake Huron', 'Lake Erie', 'Lake Ontario', 'Lake Titicaca', 'Lake Geneva', 'Lake Como', 'Lake Garda', 'Loch Ness', 'Lake Tahoe', 'Lake Maggiore', 'Lake Constance', 'Windermere', 'Great Bear Lake', 'Great Slave Lake', 'Caspian Sea', 'Dead Sea', 'Lake Chad', 'Lake Malawi', 'Lake Nicaragua', 'Lake Louise', 'Crater Lake', 'Lake Placid', 'Great Salt Lake', 'Lake Balaton', 'Lake Lucerne', 'Lake Eyre', 'Lake Biwa', 'Lake Champlain', 'Lake Mead', 'Lake Powell', 'Lake Ladoga'],
  },
  {
    id: 'places-city', category: 'Places', prompt: 'Name a city.',
    rules: 'Accept any city anywhere in the world, large or small, current or historic (Paris, Tokyo, Lagos, Kyoto, Timbuktu, Pompeii). Countries, states and provinces, villages, neighbourhoods and fictional cities do not count.',
    source: 'Wikidata items that are a city, known in at least 40 languages.', pattern: instanceOf('Q515'), minSignal: 40,
    mustHave: ['New York City', 'London', 'Paris', 'Tokyo', 'Los Angeles', 'Beijing', 'Shanghai', 'Mumbai', 'Delhi', 'Moscow', 'Berlin', 'Rome', 'Madrid', 'Istanbul', 'Cairo', 'Sydney', 'Toronto', 'Chicago', 'Dubai', 'Singapore', 'Hong Kong', 'Bangkok', 'Seoul', 'Mexico City', 'São Paulo', 'Rio de Janeiro', 'Buenos Aires', 'San Francisco', 'Las Vegas', 'Barcelona', 'Amsterdam', 'Vienna', 'Prague', 'Venice', 'Jerusalem', 'Lagos', 'Johannesburg', 'Nairobi', 'Kyoto', 'Miami'],
  },
  {
    id: 'places-world-heritage-site', category: 'Places', prompt: 'Name a UNESCO World Heritage Site.',
    rules: 'Accept any place on UNESCO\'s World Heritage List, cultural or natural, by its usual name (Machu Picchu, the Taj Mahal, the Great Barrier Reef, Angkor, the Acropolis, the Galápagos Islands). Places that are only on a national or tentative list do not count.',
    source: 'Wikidata items whose heritage designation is "World Heritage Site", known in at least 3 languages.', pattern: '?item wdt:P1435 wd:Q9259 .', minSignal: 3,
    // UNESCO's official names are long (and the short ones are what people say): the short name becomes the display name of the official item
    extraAliases: {
      'Historic Sanctuary of Machu Picchu': ['Machu Picchu'],
      'Memphis and its Necropolis – the Pyramid Fields from Giza to Dahshur': ['Pyramids of Giza', 'Giza pyramids', 'Pyramids'],
      'Venice and its Lagoon': ['Venice'], 'Rapa Nui National Park': ['Easter Island', 'Rapa Nui'],
      'Imperial Palaces of the Ming and Qing Dynasties in Beijing and Shenyang': ['Forbidden City'],
      'Historic Areas of Istanbul': ['Hagia Sophia'], 'Iguazú National Park': ['Iguazu Falls', 'Iguazú Falls', 'Iguaçu Falls'],
      'Borobudur Temple Compounds': ['Borobudur'], 'Basilica and Expiatory Church of the Holy Family': ['Sagrada Família', 'Sagrada Familia'],
      'Historic Centre of Rome, the Properties of the Holy See in that City Enjoying Extraterritorial Rights and San Paolo Fuori le Mura': ['Historic Centre of Rome', 'Rome', 'Colosseum'],
    },
    rename: ['Machu Picchu', 'Pyramids of Giza', 'Venice', 'Easter Island', 'Forbidden City', 'Hagia Sophia', 'Iguazu Falls', 'Borobudur', 'Sagrada Família', 'Historic Centre of Rome'],
    mustHave: ['Great Wall of China', 'Taj Mahal', 'Machu Picchu', 'Pyramids of Giza', 'Angkor', 'Petra', 'Acropolis of Athens', 'Colosseum', 'Statue of Liberty', 'Stonehenge', 'Great Barrier Reef', 'Galápagos Islands', 'Venice', 'Palace of Versailles', 'Chichen Itza', 'Easter Island', 'Yellowstone National Park', 'Grand Canyon National Park', 'Old City of Jerusalem', 'Historic Centre of Rome', 'Mont-Saint-Michel', 'Alhambra', 'Sagrada Família', 'Pompeii', 'Forbidden City', 'Tower of London', 'Edinburgh', 'Hagia Sophia', 'Kilimanjaro National Park', 'Victoria Falls', 'Iguazu Falls', 'Borobudur', 'Ha Long Bay', 'Serengeti National Park'],
  },

  // ================================================================ Science & Technology
  {
    id: 'science-disease', category: 'Science & Technology', prompt: 'Name a disease.',
    rules: 'Accept any named disease, illness or medical condition, infectious or not, common or rare (cancer, malaria, diabetes, asthma, COVID-19, Alzheimer\'s disease, measles). Symptoms on their own (a cough, a fever), injuries, medicines and the word "disease" do not count.',
    source: 'Wikidata items that are a disease or a kind of disease, or a "type of disease" (how Wikidata files COVID-19 and malaria), known in at least 20 languages.',
    pattern: '{ ?item wdt:P31/wdt:P279* wd:Q12136 } UNION { ?item wdt:P31 wd:Q112193867 } .', minSignal: 20,
    mustHave: ['Cancer', 'Diabetes mellitus', 'COVID-19', 'Influenza', 'Malaria', 'Tuberculosis', 'HIV/AIDS', 'Asthma', 'Alzheimer\'s disease', 'Parkinson\'s disease', 'Pneumonia', 'Measles', 'Smallpox', 'Poliomyelitis', 'Cholera', 'Ebola', 'Common cold', 'Stroke', 'Hypertension', 'Depression', 'Arthritis', 'Epilepsy', 'Migraine', 'Leukemia', 'Chickenpox', 'Hepatitis B', 'Dengue fever', 'Bubonic plague', 'Rabies', 'Lyme disease', 'Anemia', 'Eczema', 'Psoriasis', 'Autism', 'Schizophrenia', 'Dementia', 'Multiple sclerosis', 'Lupus', 'Gout'],
    extraAliases: { 'Diabetes mellitus': ['Diabetes'], Poliomyelitis: ['Polio'], Hypertension: ['High blood pressure'] },
  },
  {
    id: 'science-unit', category: 'Science & Technology', prompt: 'Name a unit of measurement.',
    rules: 'Accept any unit used to measure something, metric or not, everyday or scientific (metre, mile, kilogram, litre, kelvin, joule, byte, acre, light-year). Quantities on their own (length, mass), instruments and currencies do not count.',
    source: 'Wikidata items that are a unit of measurement, known in at least 6 languages.', pattern: instanceOf('Q47574'), minSignal: 6,
    rename: ['Celsius', 'Fahrenheit'],
    mustHave: ['Metre', 'Kilogram', 'Second', 'Litre', 'Celsius', 'Kelvin', 'Fahrenheit', 'Mile', 'Kilometre', 'Foot', 'Inch', 'Yard', 'Gram', 'Pound', 'Ounce', 'Gallon', 'Hectare', 'Acre', 'Joule', 'Watt', 'Volt', 'Ampere', 'Newton', 'Pascal', 'Hertz', 'Calorie', 'Byte', 'Degree', 'Radian', 'Mole', 'Candela', 'Ohm', 'Tesla', 'Kilowatt-hour', 'Light-year', 'Parsec', 'Nautical mile', 'Knot', 'Decibel', 'Horsepower', 'Tonne'],
    skip: nameIs(/(dollar|euro|yen|mark|shilling|franc|rupee|peso|Bitcoin|Bronze Age|Stone Age|Saarland|Dirichlet's energy|Rhodesia and Nyasaland pound|Lewes Pound)\b|^(pi|sphere)$|pound sterling|renminbi|manat|ruble|rouble/i),
  },
  {
    id: 'science-website', category: 'Science & Technology', prompt: 'Name a website.',
    rules: 'Accept any well-known website or web service (Google, YouTube, Wikipedia, Reddit, Netflix, Amazon, TikTok, GitHub), including social networks and online shops. Companies named only as a company, apps with no website, and the words "website" or "internet" do not count.',
    source: 'Wikidata items that are a website or a kind of one, known in at least 20 languages.', pattern: instanceOf('Q35127'), minSignal: 20,
    extras: [{ name: 'Google', signal: 150, aliases: ['Google Search'] }, { name: 'Zoom', signal: 80, aliases: ['Zoom Video Communications'] }],
    mustHave: ['Google', 'YouTube', 'Facebook', 'Wikipedia', 'Twitter', 'Instagram', 'Amazon', 'Reddit', 'Netflix', 'LinkedIn', 'TikTok', 'Pinterest', 'eBay', 'Yahoo!', 'Bing', 'Twitch', 'Tumblr', 'WhatsApp', 'Snapchat', 'Spotify', 'Discord', 'GitHub', 'Stack Overflow', 'IMDb', 'Craigslist', 'Quora', 'Medium', 'Etsy', 'Airbnb', 'PayPal', 'Dropbox', 'Zoom', 'Telegram', 'Baidu', 'Weibo', 'Imgur', 'Flickr', 'Hulu', 'Disney+'],
    skip: nameIs(/^(Project:Village pump|Wikidata|Wikimedia Commons|Wikisource|Wiktionary|MediaWiki|Wikibooks|Wikiquote|Wikinews|Wikiversity|Wikivoyage|Meta-Wiki|[A-Za-z ]+ Wikipedia|National Basketball Association|Polandball|British Broadcasting Corporation)$/),
  },
  {
    id: 'science-scientist', category: 'Science & Technology', prompt: 'Name a scientist.',
    rules: 'Accept any real scientist, mathematician, inventor or naturalist from any period and field (Albert Einstein, Marie Curie, Isaac Newton, Ada Lovelace, Alan Turing, Charles Darwin). Doctors known only as doctors, engineers known only for one product, fictional scientists and science presenters do not count.',
    source: 'People in Wikidata whose occupation is scientist, physicist, chemist, biologist, mathematician, astronomer, computer scientist, geologist or inventor, known in at least 25 languages.',
    pattern: occupation('Q901', 'Q169470', 'Q593644', 'Q864503', 'Q170790', 'Q11063', 'Q82594', 'Q205375', 'Q520549'), minSignal: 25, alsoWritten: personForms,
    mustHave: ['Albert Einstein', 'Isaac Newton', 'Charles Darwin', 'Marie Curie', 'Galileo Galilei', 'Nikola Tesla', 'Stephen Hawking', 'Louis Pasteur', 'Alexander Fleming', 'Thomas Edison', 'Carl Sagan', 'Richard Feynman', 'Niels Bohr', 'Max Planck', 'Michael Faraday', 'Gregor Mendel', 'James Clerk Maxwell', 'Johannes Kepler', 'Nicolaus Copernicus', 'Ada Lovelace', 'Alan Turing', 'Rosalind Franklin', 'Jane Goodall', 'Neil deGrasse Tyson', 'Archimedes', 'Euclid', 'Antoine Lavoisier', 'Dmitri Mendeleev', 'Rachel Carson', 'Edwin Hubble', 'J. Robert Oppenheimer', 'Werner Heisenberg', 'Erwin Schrödinger', 'Enrico Fermi', 'Edward Jenner', 'Leonardo da Vinci'],
    skip: notDescribedAs(/scien|physic|chemist|biolog|astronom|mathematic|naturalist|botanist|zoolog|geolog|inventor|engineer|polymath|anatom|psycholog|economist|anthropolog|ornitholog|entomolog|geneticist|meteorolog|cosmolog|ecolog|virolog|microbiolog|neuro|researcher|physician|alchemist|statistician|computer|linguist|cognitive/i),
  },
  {
    id: 'science-medicine', category: 'Science & Technology', prompt: 'Name a medicine.',
    rules: 'Accept any medicine or drug used to treat or prevent illness, by its generic or brand name (aspirin, ibuprofen, paracetamol, penicillin, insulin, Prozac, Viagra). Vaccines named as a class, vitamins and herbal supplements, medical devices, and the words "medicine" or "drug" on their own do not count.',
    source: 'Wikidata substances that have a full ATC drug code (the international code for medicines; group codes are left out), known in at least 8 languages.',
    pattern: '?item wdt:P267 ?atc . FILTER(STRLEN(?atc) = 7)', minSignal: 8,
    mustHave: ['Aspirin', 'Ibuprofen', 'Paracetamol', 'Penicillin', 'Insulin', 'Morphine', 'Amoxicillin', 'Fluoxetine', 'Sildenafil', 'Alprazolam', 'Methylphenidate', 'Codeine', 'Lithium', 'Warfarin', 'Metformin', 'Atorvastatin', 'Epinephrine', 'Diazepam', 'Oxycodone', 'Prednisone', 'Sertraline', 'Omeprazole', 'Naproxen', 'Cetirizine', 'Loratadine', 'Diphenhydramine', 'Azithromycin', 'Doxycycline', 'Hydrocodone', 'Tramadol', 'Levothyroxine', 'Salbutamol'],
    rename: ['Warfarin', 'Levothyroxine'],
    extraAliases: { Paracetamol: ['Acetaminophen', 'Tylenol', 'Panadol'], Fluoxetine: ['Prozac'], Sildenafil: ['Viagra'], Alprazolam: ['Xanax'], Methylphenidate: ['Ritalin'], Ibuprofen: ['Advil', 'Nurofen', 'Motrin'], Aspirin: ['Acetylsalicylic acid'], Sertraline: ['Zoloft'], Diazepam: ['Valium'], Atorvastatin: ['Lipitor'], Epinephrine: ['Adrenaline'] },
    skip: nameIs(/^(helium|nitrogen|oxygen|xenon|carbon dioxide|dysprosium|amino acid|red blood cell|platelet|blood plasma|keto-D-fructose|hydrochloric acid|acetic acid|phenol|citric acid|calcium carbonate|sodium chloride|water|urea|glucose)$/i),
  },

  // ================================================================ Movies & TV
  {
    id: 'movies-actor', category: 'Movies & TV', prompt: 'Name an actor or actress.',
    rules: 'Accept any real actor or actress who has appeared in films or on television, from any country and any period (Tom Hanks, Meryl Streep, Charlie Chaplin, Marilyn Monroe, Zendaya, Shah Rukh Khan), by their usual name or surname. Fictional characters, directors who do not act and musicians who only act once as themselves do not count.',
    source: 'People in Wikidata whose occupation is actor, film actor, television actor or voice actor, known in at least 40 languages.',
    pattern: occupation('Q33999', 'Q10800557', 'Q10798782', 'Q2405480'), minSignal: 40, alsoWritten: personForms,
    mustHave: ['Tom Hanks', 'Leonardo DiCaprio', 'Brad Pitt', 'Meryl Streep', 'Robert De Niro', 'Al Pacino', 'Denzel Washington', 'Johnny Depp', 'Will Smith', 'Tom Cruise', 'Morgan Freeman', 'Jack Nicholson', 'Marlon Brando', 'Julia Roberts', 'Angelina Jolie', 'Scarlett Johansson', 'Emma Watson', 'Harrison Ford', 'Samuel L. Jackson', 'Keanu Reeves', 'Robin Williams', 'Anthony Hopkins', 'Charlie Chaplin', 'Marilyn Monroe', 'Audrey Hepburn', 'Arnold Schwarzenegger', 'Sylvester Stallone', 'Dwayne Johnson', 'Ryan Gosling', 'Margot Robbie', 'Nicole Kidman', 'Cate Blanchett', 'Natalie Portman', 'Jennifer Lawrence', 'Christian Bale', 'Hugh Jackman', 'Robert Downey Jr.', 'Clint Eastwood', 'Sean Connery', 'Bruce Willis', 'Eddie Murphy', 'Jim Carrey', 'Matt Damon', 'George Clooney', 'Daniel Radcliffe', 'Zendaya', 'Timothée Chalamet', 'Tom Holland'],
    skip: notDescribedAs(/actor|actress/i),
  },
  {
    id: 'movies-director', category: 'Movies & TV', prompt: 'Name a film director.',
    rules: 'Accept any real film director from any country and period (Steven Spielberg, Alfred Hitchcock, Hayao Miyazaki, Greta Gerwig, Bong Joon-ho), by their usual name or surname. Producers, actors who never directed, and directors known only for television episodes do not count.',
    source: 'People in Wikidata whose occupation is film director, known in at least 25 languages.', pattern: occupation('Q2526255'), minSignal: 25, alsoWritten: personForms,
    mustHave: ['Steven Spielberg', 'Martin Scorsese', 'Alfred Hitchcock', 'Quentin Tarantino', 'Christopher Nolan', 'Stanley Kubrick', 'James Cameron', 'Francis Ford Coppola', 'Ridley Scott', 'George Lucas', 'Tim Burton', 'Peter Jackson', 'Woody Allen', 'Clint Eastwood', 'David Fincher', 'Wes Anderson', 'Akira Kurosawa', 'Hayao Miyazaki', 'Guillermo del Toro', 'Denis Villeneuve', 'Greta Gerwig', 'Orson Welles', 'Spike Lee', 'Michael Bay', 'Sofia Coppola', 'Bong Joon-ho', 'Pedro Almodóvar', 'Federico Fellini', 'Ingmar Bergman', 'Jordan Peele', 'Kathryn Bigelow', 'Robert Zemeckis', 'Ron Howard', 'Mel Gibson', 'David Lynch', 'Danny Boyle', 'Zack Snyder', 'Rob Reiner', 'Charlie Chaplin'],
    skip: notDescribedAs(/director|filmmaker|film-maker|auteur|cinematograph/i),
  },
  {
    id: 'movies-superhero', category: 'Movies & TV', prompt: 'Name a superhero.',
    rules: 'Accept any fictional superhero or superheroine from comics, films, television or games (Superman, Spider-Man, Wonder Woman, Black Panther, Deadpool, Batgirl). Villains, real people, ordinary detectives and the word "superhero" on its own do not count.',
    source: 'Wikidata characters whose occupation is superhero (Wikidata files Spider-Man as a comics character with the occupation "superhero"), known in at least 5 languages.',
    pattern: '{ ?item wdt:P106 wd:Q188784 } UNION { ?item wdt:P31/wdt:P279* wd:Q188784 } .', minSignal: 5,
    // Wikidata knows these by the person's name (Captain America is an alias of Bucky Barnes): the hero's own name gets its own answer
    extras: [
      { name: 'Green Lantern', signal: 80, aliases: ['Hal Jordan'] }, { name: 'Captain America', signal: 150, aliases: ['Steve Rogers'] }, { name: 'Flash', signal: 120, aliases: ['The Flash', 'Barry Allen'] },
      { name: 'Shazam', signal: 90 }, { name: 'Nightwing', signal: 60, aliases: ['Dick Grayson'] }, { name: 'Star-Lord', signal: 70, aliases: ['Peter Quill'] },
    ],
    mustHave: ['Superman', 'Batman', 'Spider-Man', 'Wonder Woman', 'Iron Man', 'Captain America', 'Thor', 'Hulk', 'Black Widow', 'Black Panther', 'Wolverine', 'Flash', 'Aquaman', 'Green Lantern', 'Deadpool', 'Captain Marvel', 'Doctor Strange', 'Ant-Man', 'Hawkeye', 'Daredevil', 'Supergirl', 'Batgirl', 'Robin', 'Storm', 'Cyclops', 'Professor X', 'Scarlet Witch', 'Vision', 'Ms. Marvel', 'Shazam', 'Cyborg', 'Nightwing', 'Green Arrow', 'Star-Lord', 'Gamora', 'Rocket Raccoon', 'Mister Fantastic', 'Human Torch', 'Silver Surfer', 'Punisher'],
  },
  {
    id: 'movies-star-wars-character', category: 'Movies & TV', prompt: 'Name a character from Star Wars.',
    rules: 'Accept any named character from Star Wars in the films, series, comics, novels or games, hero, villain or droid (Luke Skywalker, Darth Vader, Yoda, Rey, Grogu, R2-D2). Actors, planets, ships and species names on their own do not count.',
    source: 'Fictional characters that Wikidata lists as present in Star Wars or its fictional universe, known in at least 3 languages.',
    pattern: '{ ?item wdt:P1080 wd:Q19786052 } UNION { ?item wdt:P1441 wd:Q462 } ?item wdt:P31/wdt:P279* wd:Q95074 .', minSignal: 3,
    extraAliases: { 'Leia Organa': ['Princess Leia', 'Leia'], 'Anakin Skywalker': ['Anakin'], 'Obi-Wan Kenobi': ['Obi Wan', 'Ben Kenobi'], 'Din Djarin': ['The Mandalorian', 'Mando'], 'Sheev Palpatine': ['Emperor Palpatine', 'Darth Sidious'], 'Han Solo': ['Han'] },
    mustHave: ['Luke Skywalker', 'Darth Vader', 'Leia Organa', 'Han Solo', 'Yoda', 'Obi-Wan Kenobi', 'Chewbacca', 'R2-D2', 'C-3PO', 'Palpatine', 'Anakin Skywalker', 'Padmé Amidala', 'Boba Fett', 'Jabba the Hutt', 'Lando Calrissian', 'Rey', 'Kylo Ren', 'Finn', 'Poe Dameron', 'BB-8', 'Mace Windu', 'Darth Maul', 'Count Dooku', 'General Grievous', 'Qui-Gon Jinn', 'Jar Jar Binks', 'Ahsoka Tano', 'Din Djarin', 'Grogu', 'Greedo', 'Wedge Antilles', 'Admiral Ackbar', 'Jango Fett', 'Captain Phasma', 'Snoke', 'Thrawn', 'Cassian Andor', 'Jyn Erso', 'K-2SO', 'Maz Kanata'],
  },

  // ================================================================ Music
  {
    id: 'music-singer', category: 'Music', prompt: 'Name a singer.',
    rules: 'Accept any real solo singer, rapper or singer-songwriter from any country and period (Michael Jackson, Beyoncé, Frank Sinatra, Shakira, Eminem, Dua Lipa), by their usual name, stage name or surname. Bands and groups, instrumentalists, and fictional singers do not count.',
    source: 'People in Wikidata whose occupation is singer, singer-songwriter or rapper, known in at least 40 languages.',
    pattern: occupation('Q177220', 'Q488205', 'Q2252262'), minSignal: 40, alsoWritten: personForms,
    mustHave: ['Michael Jackson', 'Elvis Presley', 'Madonna', 'Beyoncé', 'Taylor Swift', 'Frank Sinatra', 'Whitney Houston', 'Mariah Carey', 'Adele', 'Rihanna', 'Lady Gaga', 'Britney Spears', 'Celine Dion', 'Freddie Mercury', 'Bob Dylan', 'Prince', 'David Bowie', 'Elton John', 'Bruce Springsteen', 'Stevie Wonder', 'Ed Sheeran', 'Justin Bieber', 'Ariana Grande', 'Billie Eilish', 'Bruno Mars', 'Katy Perry', 'Shakira', 'Eminem', 'Drake', 'Kanye West', 'Jay-Z', 'Snoop Dogg', 'Tina Turner', 'Aretha Franklin', 'Ray Charles', 'Johnny Cash', 'Dolly Parton', 'Cher', 'Bob Marley', 'John Lennon', 'Paul McCartney', 'Mick Jagger', 'Harry Styles', 'Dua Lipa', 'The Weeknd', 'Selena Gomez', 'Miley Cyrus', 'Louis Armstrong', 'Kendrick Lamar', 'Nicki Minaj'],
    skip: notDescribedAs(/sing|vocal|rapper|musician|songwriter|recording|pop star|band|crooner|diva|DJ|performer|guitarist|music|jazz|soprano|tenor|baritone|opera/i),
  },
  {
    id: 'music-album', category: 'Music', prompt: 'Name a music album.',
    rules: 'Accept any album released by a recording artist or band, from any country and period (Thriller, Abbey Road, The Dark Side of the Moon, 1989, Lemonade, Nevermind), by its title. Single songs, compilations named only by an artist, soundtracks of films without their own album title, and artists on their own do not count.',
    source: 'Wikidata items that are an album, known in at least 25 languages.', pattern: instanceOf('Q482994'), minSignal: 25,
    mustHave: ['Thriller', 'Abbey Road', 'The Dark Side of the Moon', 'Rumours', 'Back in Black', 'Nevermind', 'Sgt. Pepper\'s Lonely Hearts Club Band', 'Let It Be', 'Revolver', 'Led Zeppelin IV', 'Hotel California', 'Purple Rain', 'Born in the U.S.A.', 'The Wall', 'Bad', 'OK Computer', 'Blue', '1989', 'Lemonade', '21', '25', '30', 'Back to Black', 'Graceland', 'Pet Sounds', 'Born to Run', 'Appetite for Destruction', 'Come Away with Me', 'Songs in the Key of Life', 'Kind of Blue', 'Highway 61 Revisited', 'Rubber Soul', 'Off the Wall', 'Dangerous', 'The Marshall Mathers LP', 'To Pimp a Butterfly', 'Random Access Memories', 'Future Nostalgia', 'Folklore', 'Midnights', 'Renaissance', 'Divide', 'After Hours', 'Illmatic', 'A Night at the Opera', 'Parachutes', 'The College Dropout'],
  },
  {
    id: 'music-composer', category: 'Music', prompt: 'Name a composer.',
    rules: 'Accept any real composer of music from any period or style (Mozart, Beethoven, Bach, Chopin, Hans Zimmer, John Williams, Ennio Morricone, Nobuo Uematsu), by their usual name or surname. Singers and songwriters known only for pop songs, conductors who did not compose, and fictional composers do not count.',
    source: 'People in Wikidata whose occupation is composer, known in at least 15 languages.', pattern: occupation('Q36834'), minSignal: 15, alsoWritten: personForms,
    mustHave: ['Wolfgang Amadeus Mozart', 'Ludwig van Beethoven', 'Johann Sebastian Bach', 'Frédéric Chopin', 'Pyotr Ilyich Tchaikovsky', 'Antonio Vivaldi', 'Claude Debussy', 'Franz Schubert', 'Johannes Brahms', 'Richard Wagner', 'Giuseppe Verdi', 'Joseph Haydn', 'George Frideric Handel', 'Igor Stravinsky', 'Sergei Rachmaninoff', 'Franz Liszt', 'Maurice Ravel', 'Giacomo Puccini', 'Gustav Mahler', 'Erik Satie', 'Edvard Grieg', 'Felix Mendelssohn', 'Robert Schumann', 'Dmitri Shostakovich', 'Aaron Copland', 'Leonard Bernstein', 'John Williams', 'Hans Zimmer', 'Ennio Morricone', 'Ludovico Einaudi', 'Philip Glass', 'Claudio Monteverdi', 'Gioachino Rossini', 'Antonín Dvořák', 'Jean Sibelius', 'Modest Mussorgsky', 'Camille Saint-Saëns', 'Georges Bizet', 'Danny Elfman', 'Joe Hisaishi', 'Nobuo Uematsu'],
    skip: notDescribedAs(/compos|conductor|pianist|violinist|organist|cellist|music|arranger/i),
  },
  {
    id: 'music-taylor-swift-song', category: 'Music', prompt: 'Name a song by Taylor Swift.',
    rules: 'Accept any song that Taylor Swift recorded and released, including album tracks and re-recordings (Shake It Off, Love Story, Anti-Hero, All Too Well, Cruel Summer), with or without "(Taylor\'s Version)". Albums, songs she only wrote for other artists, and songs by other artists do not count.',
    source: 'Musical works that Wikidata lists as performed or composed by Taylor Swift.',
    pattern: '{ ?item wdt:P175 wd:Q26876 } UNION { ?item wdt:P86 wd:Q26876 } ?item wdt:P31/wdt:P279* wd:Q105543609 .',
    alsoWritten: (n) => (/ \(Taylor's Version\)$/i.test(n) ? [n.replace(/ \(Taylor's Version\)$/i, '')] : [`${n} (Taylor's Version)`]),
    mustHave: ['Shake It Off', 'Love Story', 'Blank Space', 'Anti-Hero', 'Bad Blood', 'You Belong with Me', 'All Too Well', 'Cardigan', 'Style', 'Lover', 'Cruel Summer', 'Willow', 'Delicate', 'Look What You Made Me Do', 'We Are Never Ever Getting Back Together', 'Fearless', 'Teardrops on My Guitar', 'Our Song', 'Mean', 'Back to December', 'Red', '22', 'I Knew You Were Trouble', 'Wildest Dreams', 'Fifteen', 'The Man', 'Betty', 'August', 'Karma', 'Lavender Haze', 'Fortnight', 'Bejeweled', 'Enchanted', 'Mine', 'Gorgeous', 'End Game', 'Paper Rings', 'Exile', 'The Archer', 'Tim McGraw'],
  },

  // ================================================================ Sports
  {
    id: 'sports-footballer', category: 'Sports', prompt: 'Name a professional footballer (soccer player).',
    rules: 'Accept any real professional association football (soccer) player, current or retired, from any country (Lionel Messi, Pelé, Marta, Kylian Mbappé, Diego Maradona), by their usual name or surname. Managers who never played professionally, players of other football codes (American, Australian, rugby) and fictional players do not count.',
    source: 'People in Wikidata whose occupation is association football player, known in at least 30 languages.', pattern: occupation('Q937857'), minSignal: 30, alsoWritten: personForms,
    mustHave: ['Lionel Messi', 'Cristiano Ronaldo', 'Pelé', 'Diego Maradona', 'Neymar', 'Kylian Mbappé', 'Zinedine Zidane', 'David Beckham', 'Ronaldinho', 'Ronaldo', 'Johan Cruyff', 'Franz Beckenbauer', 'Michel Platini', 'Thierry Henry', 'Wayne Rooney', 'Zlatan Ibrahimović', 'Erling Haaland', 'Mohamed Salah', 'Luis Suárez', 'Robert Lewandowski', 'Kevin De Bruyne', 'Luka Modrić', 'Andrés Iniesta', 'Xavi', 'Paolo Maldini', 'Gianluigi Buffon', 'Roberto Baggio', 'Eric Cantona', 'Ryan Giggs', 'Steven Gerrard', 'Frank Lampard', 'Harry Kane', 'Gareth Bale', 'Karim Benzema', 'Sergio Ramos', 'Virgil van Dijk', 'Eusébio', 'George Best', 'Bobby Charlton', 'Lev Yashin', 'Ferenc Puskás', 'Gerd Müller', 'Kaká', 'Rivaldo', 'Romário', 'Alan Shearer', 'Didier Drogba', 'Son Heung-min', 'Vinícius Júnior', 'Jude Bellingham'],
    skip: notDescribedAs(/footbal|soccer|goalkeeper|striker|midfielder|defender|winger/i, /American football|Canadian football|Australian rules|gridiron|rugby|quarterback|wide receiver|running back|linebacker/i),
  },
  {
    id: 'sports-basketball-player', category: 'Sports', prompt: 'Name a basketball player.',
    rules: 'Accept any real professional or Olympic basketball player, men\'s or women\'s, from any country (Michael Jordan, LeBron James, Diana Taurasi, Yao Ming, Luka Dončić), by their usual name or surname. Coaches who never played, and fictional players, do not count.',
    source: 'People in Wikidata whose occupation is basketball player, known in at least 12 languages.', pattern: occupation('Q3665646'), minSignal: 12, alsoWritten: personForms,
    mustHave: ['Michael Jordan', 'LeBron James', 'Kobe Bryant', 'Magic Johnson', 'Larry Bird', 'Shaquille O\'Neal', 'Kareem Abdul-Jabbar', 'Stephen Curry', 'Kevin Durant', 'Wilt Chamberlain', 'Bill Russell', 'Tim Duncan', 'Dirk Nowitzki', 'Allen Iverson', 'Giannis Antetokounmpo', 'Nikola Jokić', 'Luka Dončić', 'Yao Ming', 'Dennis Rodman', 'Charles Barkley', 'Scottie Pippen', 'Kawhi Leonard', 'James Harden', 'Russell Westbrook', 'Dwyane Wade', 'Chris Paul', 'Hakeem Olajuwon', 'Patrick Ewing', 'Karl Malone', 'John Stockton', 'Jerry West', 'Julius Erving', 'Steve Nash', 'Carmelo Anthony', 'Kyrie Irving', 'Anthony Davis', 'Damian Lillard', 'Joel Embiid', 'Jayson Tatum', 'Victor Wembanyama', 'Manu Ginóbili'],
    skip: notDescribedAs(/basketball|NBA|WNBA|point guard|power forward/i),
  },
  {
    id: 'sports-tennis-player', category: 'Sports', prompt: 'Name a tennis player.',
    rules: 'Accept any real professional tennis player, men\'s or women\'s, current or retired, from any country (Roger Federer, Serena Williams, Rafael Nadal, Steffi Graf, Naomi Osaka), by their usual name or surname. Coaches who never played professionally, and table tennis or badminton players, do not count.',
    source: 'People in Wikidata whose occupation is tennis player, known in at least 12 languages.', pattern: occupation('Q10833314'), minSignal: 12, alsoWritten: personForms,
    mustHave: ['Roger Federer', 'Rafael Nadal', 'Novak Djokovic', 'Serena Williams', 'Venus Williams', 'Andy Murray', 'Pete Sampras', 'Andre Agassi', 'Björn Borg', 'John McEnroe', 'Steffi Graf', 'Martina Navratilova', 'Chris Evert', 'Billie Jean King', 'Maria Sharapova', 'Naomi Osaka', 'Carlos Alcaraz', 'Jannik Sinner', 'Daniil Medvedev', 'Stefanos Tsitsipas', 'Alexander Zverev', 'Arthur Ashe', 'Rod Laver', 'Boris Becker', 'Ivan Lendl', 'Jimmy Connors', 'Monica Seles', 'Justine Henin', 'Kim Clijsters', 'Ashleigh Barty', 'Iga Świątek', 'Coco Gauff', 'Emma Raducanu', 'Ons Jabeur', 'Aryna Sabalenka', 'Stan Wawrinka', 'Lleyton Hewitt', 'Marat Safin', 'Goran Ivanišević', 'Margaret Court'],
    skip: notDescribedAs(/tennis/i),
  },
  {
    id: 'sports-stadium', category: 'Sports', prompt: 'Name a sports stadium.',
    rules: 'Accept any stadium, arena or ground where sport is played, in any country, with or without the word "Stadium" (Wembley, Camp Nou, Old Trafford, the Maracanã, Yankee Stadium, Madison Square Garden, the MCG). Whole sports clubs, race tracks named only as events, and fictional stadiums do not count.',
    source: 'Wikidata items that are a stadium or a kind of one, known in at least 20 languages.', pattern: instanceOf('Q483110'), minSignal: 20, alsoWritten: strip(/ Stadium$/),
    mustHave: ['Wembley Stadium', 'Camp Nou', 'Santiago Bernabéu Stadium', 'Old Trafford', 'Anfield', 'Maracanã Stadium', 'Allianz Arena', 'San Siro', 'Emirates Stadium', 'Stamford Bridge', 'Estadio Azteca', 'Rose Bowl', 'Yankee Stadium', 'Fenway Park', 'Madison Square Garden', 'Wrigley Field', 'Dodger Stadium', 'Soldier Field', 'Lambeau Field', 'Melbourne Cricket Ground', 'Lord\'s', 'Twickenham Stadium', 'Principality Stadium', 'Croke Park', 'Stade de France', 'Signal Iduna Park', 'Johan Cruyff Arena', 'La Bombonera', 'Beijing National Stadium', 'Etihad Stadium', 'Parc des Princes', 'Stadio Olimpico', 'Estádio da Luz', 'Tottenham Hotspur Stadium', 'Wimbledon'],
    skip: nameIs(/^(Colosseum|Wimbledon)$/),
  },

  // ================================================================ Transport & Vehicles
  {
    id: 'transport-car-model', category: 'Transport & Vehicles', prompt: 'Name a car model.',
    rules: 'Accept any model of car, current or classic, from any maker (Toyota Corolla, Ford Mustang, Volkswagen Beetle, Tesla Model 3, Porsche 911), with or without the maker\'s name where the model name is clear (Corolla, Beetle). Makers on their own (Toyota, Ford), trucks and motorbikes, and fictional cars do not count.',
    source: 'Wikidata items that are a car model, known in at least 10 languages.', pattern: instanceOf('Q3231690'), minSignal: 10, alsoWritten: (n) => {
      const m = n.replace(CAR_BRANDS, '')
      return m !== n && m.length >= 3 ? [m] : []
    },
    // the famous names that Wikidata only knows as an alias of a related model (Corolla -> Auris): each gets its own answer
    extras: [{ name: 'Toyota Corolla', signal: 150 }, { name: 'Honda Civic', signal: 150 }, { name: 'Porsche 911', signal: 150 }, { name: 'Toyota Camry', signal: 140 }, { name: 'Toyota Prius', signal: 140 }],
    mustHave: ['Ford Model T', 'Volkswagen Beetle', 'Toyota Corolla', 'Ford Mustang', 'Honda Civic', 'Tesla Model S', 'Porsche 911', 'Chevrolet Corvette', 'Jeep Wrangler', 'Mini', 'Toyota Camry', 'Ford F-Series', 'Honda Accord', 'Volkswagen Golf', 'BMW 3 Series', 'Mercedes-Benz S-Class', 'Ferrari F40', 'Lamborghini Countach', 'Tesla Model 3', 'Toyota Prius', 'Land Rover Defender', 'Fiat 500', 'Citroën 2CV', 'Chevrolet Camaro', 'Dodge Charger', 'Dodge Viper', 'Nissan GT-R', 'Mazda MX-5', 'Subaru Impreza', 'Toyota Supra', 'Aston Martin DB5', 'Jaguar E-Type', 'DeLorean DMC-12', 'Lotus Elise', 'Bugatti Veyron', 'McLaren F1', 'Rolls-Royce Phantom', 'Ford Focus', 'Chevrolet Impala', 'Hummer H1'],
  },
  {
    id: 'transport-aircraft', category: 'Transport & Vehicles', prompt: 'Name an aircraft.',
    rules: 'Accept any model or type of aeroplane or helicopter, civil or military, past or present (Boeing 747, Concorde, Airbus A380, Cessna 172, Spitfire, Apache), with or without the maker\'s name where the model is clear. Airlines, airports, individual planes with a tail number, spacecraft and fictional aircraft do not count.',
    source: 'Wikidata items that are an aircraft model or an aircraft family, known in at least 6 languages.',
    pattern: '{ ?item wdt:P31 wd:Q15056995 } UNION { ?item wdt:P31 wd:Q15056993 } .', minSignal: 6, alsoWritten: (n) => {
      const m = n.replace(MAKERS, '')
      return m !== n && m.length >= 3 ? [m] : []
    },
    mustHave: ['Boeing 747', 'Concorde', 'Airbus A380', 'Boeing 737', 'Cessna 172', 'Supermarine Spitfire', 'Boeing 787 Dreamliner', 'Airbus A320 family', 'Boeing 777', 'Lockheed SR-71 Blackbird', 'General Dynamics F-16 Fighting Falcon', 'Messerschmitt Bf 109', 'Wright Flyer', 'Douglas DC-3', 'Boeing B-17 Flying Fortress', 'Lockheed Martin F-35 Lightning II', 'Boeing B-52 Stratofortress', 'McDonnell Douglas F-4 Phantom II', 'Northrop Grumman B-2 Spirit', 'Hawker Hurricane', 'Avro Lancaster', 'Mitsubishi A6M Zero', 'Lockheed U-2', 'Boeing 707', 'Airbus A330', 'Fokker Dr.I', 'Sopwith Camel', 'Bell UH-1 Iroquois', 'Boeing AH-64 Apache', 'Sikorsky UH-60 Black Hawk', 'Piper J-3 Cub', 'Boeing 757', 'Antonov An-225 Mriya', 'Tupolev Tu-144', 'Lockheed C-130 Hercules'],
  },
  {
    id: 'transport-bridge', category: 'Transport & Vehicles', prompt: 'Name a bridge.',
    rules: 'Accept any named bridge, famous or local, in any country, with or without the word "Bridge" (Golden Gate, Brooklyn Bridge, Tower Bridge, Rialto, Ponte Vecchio, Millau Viaduct, Akashi Kaikyō). Tunnels, dams, ferries, and fictional bridges do not count.',
    source: 'Wikidata items that are a bridge, known in at least 20 languages.', pattern: instanceOf('Q12280'), minSignal: 20, alsoWritten: strip(/ Bridge$/),
    mustHave: ['Golden Gate Bridge', 'Brooklyn Bridge', 'Tower Bridge', 'London Bridge', 'Sydney Harbour Bridge', 'Rialto Bridge', 'Ponte Vecchio', 'Millau Viaduct', 'Akashi Kaikyō Bridge', 'Charles Bridge', 'Bridge of Sighs', 'Pont du Gard', 'Forth Bridge', 'Øresund Bridge', 'George Washington Bridge', 'Verrazzano-Narrows Bridge', 'Humber Bridge', 'Clifton Suspension Bridge', 'Stari Most', 'Bosphorus Bridge', 'Pont Neuf', 'Pont des Arts', 'Millennium Bridge', 'Menai Suspension Bridge', 'Iron Bridge', 'Tacoma Narrows Bridge', 'Mackinac Bridge', 'Rainbow Bridge', 'Kintai Bridge', 'Helix Bridge', 'Tsing Ma Bridge', 'Chain Bridge', 'Hangzhou Bay Bridge', 'Bixby Creek Bridge'],
  },
  {
    id: 'transport-ship', category: 'Transport & Vehicles', prompt: 'Name a famous ship.',
    rules: 'Accept any real, individually named ship or boat, civil or military, ancient or modern (Titanic, Mayflower, HMS Victory, Cutty Sark, Santa Maria, Bismarck, Queen Mary), with or without prefixes such as RMS, HMS or USS. Types of ship (a galleon, a frigate), shipping lines, aircraft, spacecraft and fictional ships do not count.',
    source: 'Wikidata items that are a ship or a kind of one, known in at least 15 languages.', pattern: instanceOf('Q11446'), minSignal: 15, alsoWritten: strip(/^(RMS|HMS|USS|SS|MS|RRS|HMAS|USCGC|HMNZS|SMS|MV|TS) /),
    mustHave: ['Titanic', 'Mayflower', 'USS Enterprise', 'Queen Mary', 'Santa Maria', 'HMS Victory', 'Bismarck', 'Cutty Sark', 'Lusitania', 'Queen Elizabeth 2', 'Endurance', 'Nautilus', 'HMS Beagle', 'USS Constitution', 'Yamato', 'Costa Concordia', 'Carpathia', 'Mary Rose', 'Vasa', 'Golden Hind', 'Kon-Tiki', 'Mary Celeste', 'Andrea Doria', 'HMS Bounty', 'USS Arizona', 'USS Missouri', 'Admiral Graf Spee', 'Niña', 'Pinta', 'Argo', 'Oasis of the Seas', 'Queen Mary 2', 'HMS Dreadnought', 'Rainbow Warrior', 'Calypso', 'HMS Hood', 'SS Great Britain', 'Fram', 'Amistad'],
  },

  // ================================================================ Miscellaneous
  {
    id: 'misc-language', category: 'Miscellaneous', prompt: 'Name a language.',
    rules: 'Accept any human language, spoken or signed, living or dead, natural or constructed (English, Mandarin, Swahili, Latin, Esperanto, Navajo, Klingon, British Sign Language). Language families (Slavic languages), dialects with no separate name, alphabets and computer programming languages do not count.',
    source: 'Wikidata items that are a language, known in at least 8 languages; language families and groups removed.', pattern: instanceOf('Q34770'), minSignal: 8,
    skip: anyOf((c) => /\blanguages$|\bfamily$|\bdialects?$|\bgroup$/i.test(c.name), nameIs(/^expulsion of/i)),
    mustHave: ['English', 'Spanish', 'French', 'German', 'Mandarin Chinese', 'Arabic', 'Hindi', 'Portuguese', 'Russian', 'Japanese', 'Italian', 'Korean', 'Bengali', 'Turkish', 'Vietnamese', 'Persian', 'Dutch', 'Swedish', 'Polish', 'Greek', 'Hebrew', 'Latin', 'Swahili', 'Thai', 'Urdu', 'Tamil', 'Punjabi', 'Indonesian', 'Ukrainian', 'Norwegian', 'Danish', 'Finnish', 'Czech', 'Hungarian', 'Romanian', 'Cantonese', 'Tagalog', 'Welsh', 'Irish', 'Esperanto', 'Sanskrit', 'Klingon', 'Navajo', 'Zulu', 'Maori', 'Hawaiian', 'Yiddish', 'Basque', 'Catalan', 'Scottish Gaelic'],
    extraAliases: { 'Mandarin Chinese': ['Mandarin', 'Chinese'] },
  },
  {
    id: 'misc-novel', category: 'Miscellaneous', prompt: 'Name a novel.',
    rules: 'Accept any novel, classic or modern, from any country (1984, Pride and Prejudice, The Great Gatsby, Don Quixote, Harry Potter and the Philosopher\'s Stone, Dune), by its title. Short stories, plays, poems, whole series named only as a series, films, and non-fiction books do not count.',
    source: 'Wikidata works that are a novel or a kind of one, or whose "form of creative work" is novel (Wikidata files Pride and Prejudice as a "literary work" with that form), known in at least 25 languages.',
    pattern: '{ ?item wdt:P31/wdt:P279* wd:Q8261 } UNION { ?item wdt:P7937 wd:Q8261 } .', minSignal: 25,
    mustHave: ['Nineteen Eighty-Four', 'Pride and Prejudice', 'The Great Gatsby', 'To Kill a Mockingbird', 'Moby-Dick', 'War and Peace', 'Jane Eyre', 'Wuthering Heights', 'Frankenstein', 'Dracula', 'The Catcher in the Rye', 'Brave New World', 'Animal Farm', 'Don Quixote', 'Les Misérables', 'The Hobbit', 'The Lord of the Rings', 'Harry Potter and the Philosopher\'s Stone', 'The Da Vinci Code', 'The Alchemist', 'Lord of the Flies', 'Crime and Punishment', 'Great Expectations', 'Oliver Twist', 'A Tale of Two Cities', 'Little Women', 'The Adventures of Tom Sawyer', 'Adventures of Huckleberry Finn', 'Alice\'s Adventures in Wonderland', 'Gone with the Wind', 'The Handmaid\'s Tale', 'Fahrenheit 451', 'Catch-22', 'Slaughterhouse-Five', 'The Hunger Games', 'Twilight', 'Anna Karenina', 'The Count of Monte Cristo', 'The Picture of Dorian Gray', 'Treasure Island', 'Robinson Crusoe', 'Gulliver\'s Travels', 'Ulysses', 'Of Mice and Men', 'The Grapes of Wrath', 'One Hundred Years of Solitude', 'The Little Prince', 'The Kite Runner', 'Life of Pi', 'Dune'],
    extraAliases: { 'Nineteen Eighty-Four': ['1984'] },
    skip: nameIs(/^(Odyssey|Epic of Gilgamesh)$/),
  },
  {
    id: 'misc-writer', category: 'Miscellaneous', prompt: 'Name a writer or author.',
    rules: 'Accept any real author of novels, plays, poetry or stories, from any country and period (William Shakespeare, J. K. Rowling, Jane Austen, Haruki Murakami, Maya Angelou), by their usual name or surname. Journalists known only for news, songwriters, screenwriters known only for one film, and fictional authors do not count.',
    source: 'People in Wikidata whose occupation is writer, novelist, poet or playwright, known in at least 40 languages.',
    pattern: occupation('Q36180', 'Q6625963', 'Q49757', 'Q214917'), minSignal: 40, alsoWritten: personForms,
    mustHave: ['William Shakespeare', 'J. K. Rowling', 'Stephen King', 'Agatha Christie', 'Charles Dickens', 'Mark Twain', 'Jane Austen', 'Ernest Hemingway', 'George Orwell', 'Leo Tolstoy', 'Fyodor Dostoevsky', 'Victor Hugo', 'Homer', 'Dante Alighieri', 'Edgar Allan Poe', 'Oscar Wilde', 'Roald Dahl', 'Dr. Seuss', 'J. R. R. Tolkien', 'C. S. Lewis', 'Maya Angelou', 'Haruki Murakami', 'Gabriel García Márquez', 'Franz Kafka', 'Virginia Woolf', 'F. Scott Fitzgerald', 'Herman Melville', 'Emily Dickinson', 'Robert Frost', 'Walt Whitman', 'Pablo Neruda', 'Rumi', 'Miguel de Cervantes', 'Johann Wolfgang von Goethe', 'Jules Verne', 'H. G. Wells', 'Arthur Conan Doyle', 'Lewis Carroll', 'Beatrix Potter', 'Anton Chekhov', 'Margaret Atwood', 'Toni Morrison', 'Paulo Coelho', 'Dan Brown', 'James Patterson', 'George R. R. Martin', 'Neil Gaiman', 'Terry Pratchett'],
    skip: notDescribedAs(/writer|author|novelist|poet|playwright|dramatist|essayist|journalist|historian|screenwriter|biographer|columnist|scribe|storyteller|fabulist|satirist|lyricist|literary|literature|tragedian|bard|chronicler|philosopher|theologian|humanist|polymath|orator/i),
  },
  {
    id: 'misc-currency', category: 'Miscellaneous', prompt: 'Name a currency.',
    rules: 'Accept any currency, current or historic, official or widely used (US dollar, euro, pound sterling, yen, rupee, Deutsche Mark, Bitcoin), with or without the country (dollar, yen, peso). Banknotes of a single value, banks, payment companies and the word "currency" or "money" on their own do not count.',
    source: 'Wikidata items that are a currency or a kind of one, known in at least 4 languages.', pattern: instanceOf('Q8142'), minSignal: 4, alsoWritten: strip(NATIONALITY),
    extras: [{ name: 'Dollar', signal: 100 }, { name: 'Pound', signal: 100 }, { name: 'Peso', signal: 80 }, { name: 'Franc', signal: 70 }, { name: 'Krone', signal: 50 }, { name: 'Rupee', signal: 70 }, { name: 'Dinar', signal: 60 }, { name: 'Dirham', signal: 50 }, { name: 'Riyal', signal: 50 }, { name: 'Bitcoin', signal: 100, aliases: ['BTC'] }],
    extraAliases: { 'Pound sterling': ['British pound', 'GBP', 'Quid'], 'United States dollar': ['US dollar', 'USD', 'American dollar'], Euro: ['EUR'], 'Japanese yen': ['JPY'] },
    mustHave: ['United States dollar', 'Euro', 'Pound sterling', 'Japanese yen', 'Renminbi', 'Swiss franc', 'Indian rupee', 'Canadian dollar', 'Australian dollar', 'Mexican peso', 'Russian ruble', 'Brazilian real', 'South Korean won', 'Turkish lira', 'South African rand', 'Swedish krona', 'Norwegian krone', 'Danish krone', 'Polish złoty', 'Thai baht', 'Singapore dollar', 'Hong Kong dollar', 'New Zealand dollar', 'Israeli new shekel', 'Saudi riyal', 'United Arab Emirates dirham', 'Egyptian pound', 'Nigerian naira', 'Philippine peso', 'Argentine peso', 'Bitcoin', 'Deutsche Mark', 'French franc', 'Italian lira', 'Spanish peseta', 'Dutch guilder'],
    skip: nameIs(/^(Bitget|ancient Chinese coinage)$/i),
  },
  {
    id: 'misc-university', category: 'Miscellaneous', prompt: 'Name a university.',
    rules: 'Accept any university or university-level college in any country, with or without the word "University" (Harvard, Oxford, the Sorbonne, MIT, Tsinghua, the University of Cape Town). Schools below university level, companies that train people, sports teams named after a university, and the word "university" on its own do not count.',
    source: 'Wikidata items that are a university, known in at least 25 languages.', pattern: instanceOf('Q3918'), minSignal: 25,
    alsoWritten: (n) => [...strip(/^University of /)(n), ...strip(/ University$/)(n)],
    extraAliases: { 'Massachusetts Institute of Technology': ['MIT'], 'California Institute of Technology': ['Caltech'], 'University of California, Los Angeles': ['UCLA'], 'University of California, Berkeley': ['UC Berkeley', 'Berkeley'], 'London School of Economics and Political Science': ['LSE'] },
    mustHave: ['Harvard University', 'University of Oxford', 'University of Cambridge', 'Stanford University', 'Massachusetts Institute of Technology', 'Yale University', 'Princeton University', 'Columbia University', 'University of California, Berkeley', 'University of Chicago', 'California Institute of Technology', 'Imperial College London', 'University College London', 'ETH Zurich', 'University of Tokyo', 'Peking University', 'Tsinghua University', 'National University of Singapore', 'University of Toronto', 'McGill University', 'University of Melbourne', 'Australian National University', 'University of Edinburgh', 'Sorbonne University', 'Heidelberg University', 'University of Bologna', 'University of California, Los Angeles', 'New York University', 'Cornell University', 'Duke University', 'Johns Hopkins University', 'University of Michigan', 'Carnegie Mellon University', 'University of Pennsylvania', 'Brown University', 'Dartmouth College', 'King\'s College London', 'London School of Economics and Political Science', 'University of St Andrews', 'Trinity College Dublin', 'Seoul National University', 'University of Cape Town', 'University of São Paulo', 'Humboldt University of Berlin', 'KAIST'],
  },
]
