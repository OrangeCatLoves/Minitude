/**
 * Batch 28: a top-up for the last 228 questions towards 1,000 (owner, 18 Nov 2026). Batches 23 to 27 came out short in Transport, Animals, Food, History,
 * Science and Games (and long in Music and Movies), so this batch adds more of those: car models of more makers, airlines and airports of more countries,
 * animal and plant groups, cuisines, pastries and liqueurs, politicians and office-holders, scientists by country, games by platform.
 * Build with: npx tsx src/expand/newq.ts --batch batch28 --out C:/Users/weibi/minitude/list-build/batch28
 */
import type { NewQuestion } from './newq'
import { mk } from './batch8'
import { CAR } from './batch17'
import { AIRLINE, AIRPORT } from './batch23'
import { GROUP, MAKER } from './batch24'
import { DISH } from './batch18'
import { HOLDER, NAT } from './batch25'

const an = (w: string): string => (/^[aeiou]/i.test(w) ? 'an' : 'a')

/** a video game released for a platform */
const ON_PLATFORM = (id: string, name: string, platforms: string[], minSignal: number, mustHave: string[]): NewQuestion =>
  mk('Games', {
    id: `games-${id}-game`, prompt: `Name ${an(name)} ${name} game.`, what: `any video game released for ${name}, including games that also came out on other platforms`,
    not: 'Board games, films and consoles do not count.',
    source: `Wikidata video games released for the platform, known in at least ${minSignal} languages.`,
    pattern: `?item wdt:P31/wdt:P279* wd:Q7889 . ?item wdt:P400 ?plt . VALUES ?plt { ${platforms.map((p) => 'wd:' + p).join(' ')} }`, minSignal, mustHave,
  })

export const BATCH: NewQuestion[] = [
  // ================================================================ Transport & Vehicles
  CAR('hyundai', 'Hyundai', ['Q55931'], ['Hyundai Elantra', 'Hyundai Sonata', 'Hyundai Tucson', 'Hyundai Santa Fe', 'Hyundai Pony', 'Hyundai Kona', 'Hyundai Ioniq 5', 'Hyundai Accent', 'Hyundai i30', 'Hyundai Veloster', 'Hyundai Genesis', 'Hyundai Palisade'], 3),
  CAR('kia', 'Kia', ['Q35349'], ['Kia Sportage', 'Kia Sorento', 'Kia Rio', 'Kia Soul', 'Kia Picanto', 'Kia Optima', 'Kia Stinger', 'Kia Carnival', 'Kia Ceed', 'Kia EV6', 'Kia Telluride', 'Kia Niro'], 3),
  CAR('citroen', 'Citroën', ['Q6746'], ['Citroën 2CV', 'Citroën DS', 'Citroën C3', 'Citroën Traction Avant', 'Citroën Xsara Picasso', 'Citroën Saxo', 'Citroën C4', 'Citroën Berlingo', 'Citroën CX', 'Citroën BX', 'Citroën Ami', 'Citroën SM'], 3),
  CAR('jeep', 'Jeep', ['Q30113'], ['Jeep Wrangler', 'Jeep Cherokee', 'Jeep Grand Cherokee', 'Jeep Renegade', 'Jeep Compass', 'Jeep Gladiator', 'Willys MB', 'Jeep Liberty', 'Jeep Patriot', 'Jeep Wagoneer', 'Jeep CJ', 'Jeep Commander'], 3),
  CAR('land-rover', 'Land Rover', ['Q35907', 'Q26777551'], ['Land Rover Defender', 'Range Rover', 'Land Rover Discovery', 'Range Rover Sport', 'Range Rover Evoque', 'Land Rover Freelander', 'Land Rover Series I', 'Range Rover Velar', 'Land Rover Series III', 'Land Rover Series II'], 3),
  CAR('jaguar', 'Jaguar', ['Q30055'], ['Jaguar E-Type', 'Jaguar XJ', 'Jaguar F-Type', 'Jaguar XK', 'Jaguar XF', 'Jaguar XJ220', 'Jaguar D-Type', 'Jaguar Mark 2', 'Jaguar S-Type', 'Jaguar XE', 'Jaguar F-Pace', 'Jaguar C-Type'], 3),
  CAR('lexus', 'Lexus', ['Q35919'], ['Lexus LS', 'Lexus RX', 'Lexus IS', 'Lexus LFA', 'Lexus GS', 'Lexus NX', 'Lexus ES', 'Lexus LC', 'Lexus SC', 'Lexus GX', 'Lexus LX', 'Lexus RC'], 3),
  CAR('skoda', 'Škoda', ['Q29637'], ['Škoda Octavia', 'Škoda Fabia', 'Škoda Superb', 'Škoda Felicia', 'Škoda Favorit', 'Škoda Kodiaq', 'Škoda Yeti', 'Škoda Rapid', 'Škoda 105', 'Škoda Roomster', 'Škoda Karoq', 'Škoda Enyaq'], 3),
  CAR('alfa-romeo', 'Alfa Romeo', ['Q26921', 'Q124982078'], ['Alfa Romeo Giulia', 'Alfa Romeo Spider', 'Alfa Romeo 156', 'Alfa Romeo Stelvio', 'Alfa Romeo 8C', 'Alfa Romeo 147', 'Alfa Romeo 159', 'Alfa Romeo Giulietta', 'Alfa Romeo Brera', 'Alfa Romeo Montreal', 'Alfa Romeo 33 Stradale', 'Alfa Romeo 4C'], 3),
  CAR('lamborghini', 'Lamborghini', ['Q35886', 'Q124966860'], ['Lamborghini Countach', 'Lamborghini Miura', 'Lamborghini Diablo', 'Lamborghini Murciélago', 'Lamborghini Gallardo', 'Lamborghini Aventador', 'Lamborghini Huracán', 'Lamborghini Urus', 'Lamborghini Espada', 'Lamborghini Reventón', 'Lamborghini LM002', 'Lamborghini Jarama'], 3),
  CAR('opel', 'Opel', ['Q40966'], ['Opel Astra', 'Opel Corsa', 'Opel Kadett', 'Opel Manta', 'Opel Vectra', 'Opel Omega', 'Opel Insignia', 'Opel GT', 'Opel Zafira', 'Opel Rekord', 'Opel Calibra', 'Opel Mokka'], 3),
  AIRLINE('italian', 'Italian', 'Q38', 3, ['Alitalia', 'ITA Airways', 'Air Italy', 'Meridiana', 'Neos', 'Blue Panorama Airlines', 'Volotea', 'Air Dolomiti', 'Ali Italia', 'Aero Transporti Italiani', 'Ryanair Sun', 'Wind Jet']),
  AIRLINE('mexican', 'Mexican', 'Q96', 3, ['Aeroméxico', 'Volaris', 'VivaAerobus', 'Interjet', 'Mexicana de Aviación', 'Aeromar', 'Magnicharters', 'Calafia Airlines', 'TAR Aerolíneas', 'Aladia']),
  AIRLINE('south-korean', 'South Korean', 'Q884', 3, ['Korean Air', 'Asiana Airlines', 'Jeju Air', 'Jin Air', 'T\'way Air', 'Air Busan', 'Eastar Jet', 'Air Seoul', 'Fly Gangwon', 'Hi Air']),
  AIRLINE('thai', 'Thai', 'Q869', 3, ['Thai Airways International', 'Bangkok Airways', 'Thai AirAsia', 'Nok Air', 'Thai Lion Air', 'Thai Smile', 'Thai Vietjet', 'Orient Thai Airlines', 'One-Two-Go Airlines', 'PB Air']),
  AIRPORT('italian', 'Italian', 'Q38', 3, ['Leonardo da Vinci–Fiumicino Airport', 'Milan Malpensa Airport', 'Venice Marco Polo Airport', 'Naples International Airport', 'Linate Airport', 'Bologna Guglielmo Marconi Airport', 'Catania–Fontanarossa Airport', 'Pisa International Airport', 'Turin Airport', 'Palermo Airport', 'Ciampino Airport', 'Florence Airport']),
  AIRPORT('spanish', 'Spanish', 'Q29', 3, ['Madrid–Barajas Airport', 'Barcelona–El Prat Airport', 'Málaga Airport', 'Palma de Mallorca Airport', 'Alicante–Elche Airport', 'Gran Canaria Airport', 'Seville Airport', 'Valencia Airport', 'Tenerife South Airport', 'Ibiza Airport', 'Bilbao Airport', 'Lanzarote Airport']),
  AIRPORT('russian', 'Russian', 'Q159', 3, ['Sheremetyevo International Airport', 'Domodedovo International Airport', 'Vnukovo International Airport', 'Pulkovo Airport', 'Koltsovo Airport', 'Tolmachevo Airport', 'Sochi International Airport', 'Kazan International Airport', 'Vladivostok International Airport', 'Zhukovsky International Airport', 'Kaliningrad Khrabrovo Airport', 'Platov International Airport']),
  AIRPORT('mexican', 'Mexican', 'Q96', 3, ['Mexico City International Airport', 'Cancún International Airport', 'Guadalajara International Airport', 'Monterrey International Airport', 'Tijuana International Airport', 'Los Cabos International Airport', 'Puerto Vallarta International Airport', 'Felipe Ángeles International Airport', 'Toluca International Airport', 'Cozumel International Airport', 'Mérida International Airport', 'Oaxaca International Airport']),

  // ================================================================ Animals & Nature
  GROUP('deer', 'Name a deer.', 'any deer, elk, moose, caribou or reindeer by its common name', ['Q23390'], 3, /^(deers?|cervids?)$/i,
    ['White-tailed deer', 'Red deer', 'Moose', 'Reindeer', 'Roe deer', 'Elk', 'Fallow deer', 'Mule deer', 'Sika deer', 'Chital', 'Père David\'s deer', 'Muntjac', 'Sambar deer', 'Pudú', 'Water deer', 'Wapiti']),
  GROUP('kangaroo-wallaby', 'Name a kangaroo, wallaby or similar marsupial.', 'any kangaroo, wallaby, wallaroo, pademelon or tree-kangaroo by its common name', ['Q23193'], 2, /^(kangaroos?|wallab(y|ies)|macropods?)$/i,
    ['Red kangaroo', 'Eastern grey kangaroo', 'Western grey kangaroo', 'Antilopine kangaroo', 'Tammar wallaby', 'Red-necked wallaby', 'Quokka', 'Swamp wallaby', 'Euro', 'Agile wallaby', 'Bennett\'s wallaby', 'Goodfellow\'s tree-kangaroo', 'Parma wallaby', 'Black-footed rock-wallaby', 'Bridled nail-tail wallaby']),
  GROUP('weasel-family', 'Name a weasel, otter, badger or other mustelid.', 'any weasel, stoat, ferret, otter, badger, marten, mink, wolverine or polecat by its common name', ['Q25437'], 3, /^(weasels?|mustelids?|otters?|badgers?)$/i,
    ['European badger', 'Sea otter', 'Wolverine', 'Stoat', 'European polecat', 'European otter', 'American mink', 'Honey badger', 'Fisher', 'Pine marten', 'Least weasel', 'Giant otter', 'Black-footed ferret', 'Sable', 'American badger', 'Eurasian otter']),
  GROUP('pine', 'Name a pine tree.', 'any pine tree species by its common name, with or without the word pine', ['Q12024'], 3, /^(pines?|pinus)$/i,
    ['Scots pine', 'White pine', 'Ponderosa pine', 'Lodgepole pine', 'Stone pine', 'Bristlecone pine', 'Monterey pine', 'Austrian pine', 'Sugar pine', 'Jack pine', 'Red pine', 'Loblolly pine', 'Aleppo pine', 'Japanese red pine', 'Longleaf pine', 'Maritime pine']),
  GROUP('willow', 'Name a willow.', 'any willow or sallow (a tree or shrub of the genus Salix) by its common name', ['Q36050'], 3, /^(willows?|salix|sallows?)$/i,
    ['Weeping willow', 'White willow', 'Pussy willow', 'Crack willow', 'Goat willow', 'Black willow', 'Peachleaf willow', 'Basket willow', 'Bay willow', 'Grey willow', 'Arctic willow', 'Corkscrew willow', 'Creeping willow', 'Almond willow']),
  GROUP('kingfisher', 'Name a kingfisher.', 'any kingfisher, kookaburra or paradise kingfisher by its common name', ['Q8154335'], 2, /^(kingfishers?|kookaburras?)$/i,
    ['Common kingfisher', 'Laughing kookaburra', 'Belted kingfisher', 'Pied kingfisher', 'Blue-winged kookaburra', 'Malachite kingfisher', 'Ringed kingfisher', 'Sacred kingfisher', 'Giant kingfisher', 'Green kingfisher', 'Collared kingfisher', 'White-throated kingfisher', 'Stork-billed kingfisher', 'Amazon kingfisher']),
  GROUP('monitor-lizard', 'Name a monitor lizard.', 'any monitor lizard, goanna or Komodo dragon by its common name', ['Q3082684'], 2, /^(monitors?|monitor lizards?|goannas?|varanids?)$/i,
    ['Komodo dragon', 'Nile monitor', 'Water monitor', 'Perentie', 'Lace monitor', 'Savannah monitor', 'Crocodile monitor', 'Asian water monitor', 'Black-throated monitor', 'Mertens\' water monitor', 'Argus monitor', 'Sand goanna', 'Emerald tree monitor', 'Bengal monitor']),

  // ================================================================ Food
  DISH('vietnamese', 'Vietnamese', 'Vietnamese', ['Q826059'], ['Q881'], ['Phở', 'Bánh mì', 'Bún chả', 'Gỏi cuốn', 'Bún bò Huế', 'Cơm tấm', 'Bánh xèo', 'Cao lầu', 'Chả giò', 'Mì Quảng', 'Cà phê sữa đá', 'Bún riêu']),
  DISH('ethiopian', 'Ethiopian', 'Ethiopian', ['Q257508'], ['Q115'], ['Injera', 'Doro wat', 'Kitfo', 'Tibs', 'Shiro', 'Misir wat', 'Gomen', 'Dulet', 'Firfir', 'Berbere', 'Genfo', 'Kategna']),
  DISH('pakistani', 'Pakistani', 'Pakistani', ['Q1089120'], ['Q843'], ['Biryani', 'Nihari', 'Haleem', 'Chapli kebab', 'Seekh kebab', 'Karahi', 'Paya', 'Sajji', 'Aloo gosht', 'Halwa puri', 'Lassi', 'Chana masala']),
  DISH('sri-lankan', 'Sri Lankan', 'Sri Lankan', ['Q2234037'], ['Q854'], ['Kottu', 'Hoppers', 'String hoppers', 'Pol sambol', 'Lamprais', 'Kiribath', 'Fish ambul thiyal', 'Pol roti', 'Watalappan', 'Dhal curry', 'Parippu', 'Kokis']),
  DISH('cantonese', 'Cantonese', 'Cantonese', ['Q1154790'], [], ['Dim sum', 'Char siu', 'Wonton noodles', 'Congee', 'Har gow', 'Siu mai', 'Roast goose', 'Egg tart', 'Claypot rice', 'Cheung fun', 'Sweet and sour pork', 'Turnip cake']),
  DISH('sichuan', 'Sichuan', 'Sichuan', ['Q691365'], [], ['Mapo tofu', 'Kung Pao chicken', 'Hot pot', 'Dan dan noodles', 'Twice-cooked pork', 'Fish-fragrant eggplant', 'Chongqing noodles', 'Boiled beef', 'Mala Xiang Guo', 'Hui guo rou', 'Husband and wife lung slices', 'Zhong dumplings']),
  DISH('scottish', 'Scottish', 'Scottish', ['Q1897293'], ['Q22'], ['Haggis', 'Cullen skink', 'Scotch broth', 'Cranachan', 'Shortbread', 'Black pudding', 'Tablet', 'Arbroath smokie', 'Scotch pie', 'Clootie dumpling', 'Cock-a-leekie soup', 'Stovies']),
  DISH('australian', 'Australian', 'Australian', ['Q783010'], ['Q408'], ['Pavlova', 'Lamington', 'Vegemite', 'Meat pie', 'Anzac biscuit', 'Chiko Roll', 'Tim Tam', 'Fairy bread', 'Damper', 'Barramundi', 'Sausage sizzle', 'Chicken parmigiana']),
  DISH('israeli', 'Israeli', 'Israeli', ['Q62458'], ['Q801'], ['Falafel', 'Hummus', 'Shakshuka', 'Sabich', 'Israeli salad', 'Bourekas', 'Malawach', 'Jachnun', 'Tahini', 'Za\'atar', 'Cholent', 'Sufganiyot']),
  DISH('egyptian', 'Egyptian', 'Egyptian', ['Q1346230'], ['Q79'], ['Koshari', 'Ful medames', 'Molokhia', 'Ta\'amiya', 'Mahshi', 'Hawawshi', 'Fattah', 'Basbousa', 'Kunafa', 'Umm Ali', 'Feteer meshaltet', 'Shakshouka']),
  DISH('nigerian', 'Nigerian', 'Nigerian', ['Q7033037'], ['Q1033'], ['Jollof rice', 'Egusi soup', 'Suya', 'Pounded yam', 'Moi moi', 'Akara', 'Fufu', 'Puff-puff', 'Pepper soup', 'Ofada rice', 'Efo riro', 'Ogbono soup']),
  DISH('danish', 'Danish', 'Danish', ['Q1196267'], ['Q35'], ['Smørrebrød', 'Frikadeller', 'Flæskesteg', 'Danish pastry', 'Æbleskiver', 'Rødgrød med fløde', 'Stegt flæsk', 'Kransekage', 'Medisterpølse', 'Leverpostej', 'Wienerbrød', 'Hot dog']),
  mk('Food', {
    id: 'food-pastry', prompt: 'Name a pastry.', what: 'any pastry, such as a croissant, éclair, strudel, danish, turnover or tart',
    not: 'Breads, cakes and biscuits do not count.', source: 'Wikidata pastries and their kinds, known in at least 3 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q477248 .', minSignal: 3,
    mustHave: ['Croissant', 'Éclair', 'Baklava', 'Apple strudel', 'Danish pastry', 'Cannoli', 'Profiterole', 'Pain au chocolat', 'Puff pastry', 'Empanada', 'Pastel de nata', 'Palmier', 'Mille-feuille', 'Cream puff', 'Churro', 'Samosa'],
  }),
  mk('Food', {
    id: 'food-liqueur', prompt: 'Name a liqueur.', what: 'any liqueur, cordial or sweetened spirit, by its brand or its kind',
    not: 'Plain spirits, wines and beers do not count.', source: 'Wikidata liqueurs, known in at least 3 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q178780 .', minSignal: 3,
    mustHave: ['Baileys Irish Cream', 'Kahlúa', 'Amaretto', 'Cointreau', 'Grand Marnier', 'Chartreuse', 'Limoncello', 'Sambuca', 'Jägermeister', 'Drambuie', 'Tia Maria', 'Triple sec', 'Midori', 'Frangelico', 'Benedictine', 'Campari'],
  }),
  mk('Food', {
    id: 'food-wine-region', prompt: 'Name a wine region.', what: 'any region or district known for producing wine, such as Bordeaux, Napa Valley or Tuscany',
    not: 'Single wineries and grape varieties do not count.', source: 'Wikidata wine-producing regions, known in at least 4 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q2140699 .', minSignal: 4,
    mustHave: ['Bordeaux', 'Burgundy', 'Champagne', 'Napa Valley', 'Tuscany', 'Rioja', 'Mosel', 'Barossa Valley', 'Douro', 'Marlborough', 'Chianti', 'Sonoma County', 'Loire Valley', 'Piedmont', 'Rhône Valley', 'Mendoza'],
  }),

  // ================================================================ History & Mythology
  HOLDER('History & Mythology', 'history-uk-prime-minister', 'Name a prime minister of the United Kingdom.', 'any person who has been prime minister of the United Kingdom (or of Great Britain)', 'Q14211', 3,
    ['Winston Churchill', 'Margaret Thatcher', 'Tony Blair', 'Boris Johnson', 'David Cameron', 'Theresa May', 'Gordon Brown', 'Clement Attlee', 'Harold Wilson', 'Robert Walpole', 'William Pitt the Younger', 'Benjamin Disraeli', 'William Ewart Gladstone', 'Neville Chamberlain', 'Rishi Sunak', 'Keir Starmer', 'Liz Truss']),
  HOLDER('History & Mythology', 'history-us-vice-president', 'Name a Vice President of the United States.', 'any person who has served as Vice President of the United States', 'Q11699', 3,
    ['Joe Biden', 'Kamala Harris', 'Mike Pence', 'Dick Cheney', 'Al Gore', 'Dan Quayle', 'George H. W. Bush', 'Walter Mondale', 'Nelson Rockefeller', 'Spiro Agnew', 'Richard Nixon', 'Lyndon B. Johnson', 'Harry S. Truman', 'Theodore Roosevelt', 'Aaron Burr', 'Thomas Jefferson', 'John Adams', 'JD Vance']),
  HOLDER('History & Mythology', 'history-archbishop-of-canterbury', 'Name an Archbishop of Canterbury.', 'any person who has been Archbishop of Canterbury', 'Q29282', 2,
    ['Justin Welby', 'Rowan Williams', 'George Carey', 'Robert Runcie', 'Michael Ramsey', 'Thomas Becket', 'Thomas Cranmer', 'Augustine of Canterbury', 'Anselm of Canterbury', 'William Laud', 'Stephen Langton', 'Dunstan', 'Geoffrey Fisher', 'William Temple', 'Cosmo Lang', 'Sarah Mullally']),
  NAT('History & Mythology', 'british-politician', 'British', 'politician', 'Q145 Q174193', 'Q82955', /politician|statesm|prime minister|member of parliament|\bMP\b/i, 10, ['Winston Churchill', 'Margaret Thatcher', 'Tony Blair', 'Clement Attlee', 'David Lloyd George', 'Benjamin Disraeli', 'William Gladstone', 'Boris Johnson', 'Nigel Farage', 'Tony Benn', 'Aneurin Bevan', 'Jeremy Corbyn']),
  NAT('History & Mythology', 'german-politician', 'German', 'politician', 'Q183', 'Q82955', /politician|statesm|chancellor/i, 8, ['Angela Merkel', 'Willy Brandt', 'Konrad Adenauer', 'Helmut Kohl', 'Otto von Bismarck', 'Gerhard Schröder', 'Olaf Scholz', 'Helmut Schmidt', 'Joseph Goebbels', 'Adolf Hitler', 'Rosa Luxemburg', 'Friedrich Merz']),
  NAT('History & Mythology', 'french-politician', 'French', 'politician', 'Q142', 'Q82955', /politician|statesm|president/i, 10, ['Emmanuel Macron', 'Charles de Gaulle', 'François Mitterrand', 'Nicolas Sarkozy', 'Jacques Chirac', 'Georges Clemenceau', 'Marine Le Pen', 'François Hollande', 'Léon Blum', 'Maximilien Robespierre', 'Georges Pompidou', 'Jean-Luc Mélenchon']),
  NAT('History & Mythology', 'indian-politician', 'Indian', 'politician', 'Q668', 'Q82955', /politician|statesm|minister/i, 10, ['Narendra Modi', 'Jawaharlal Nehru', 'Indira Gandhi', 'Mahatma Gandhi', 'Rajiv Gandhi', 'Manmohan Singh', 'Sardar Vallabhbhai Patel', 'Atal Bihari Vajpayee', 'B. R. Ambedkar', 'Subhas Chandra Bose', 'Sonia Gandhi', 'Rahul Gandhi']),

  // ================================================================ Science & Technology
  NAT('Science & Technology', 'american-physicist', 'American', 'physicist', 'Q30', 'Q169470', /physicist/i, 8, ['Richard Feynman', 'J. Robert Oppenheimer', 'Albert A. Michelson', 'Murray Gell-Mann', 'Carl Sagan', 'Neil deGrasse Tyson', 'Edwin Hubble', 'Linus Pauling', 'Kip Thorne', 'Steven Weinberg', 'Enrico Fermi', 'Brian Greene']),
  NAT('Science & Technology', 'japanese-scientist', 'Japanese', 'physicist', 'Q17', 'Q169470', /physicist/i, 5, ['Hideki Yukawa', 'Yoichiro Nambu', 'Masatoshi Koshiba', 'Shin\'ichirō Tomonaga', 'Leo Esaki', 'Makoto Kobayashi', 'Toshihide Maskawa', 'Takaaki Kajita', 'Hantaro Nagaoka', 'Isamu Akasaki', 'Shuji Nakamura', 'Syukuro Manabe']),
  NAT('Science & Technology', 'indian-physicist', 'Indian', 'physicist', 'Q668', 'Q169470', /physicist/i, 4, ['C. V. Raman', 'Satyendra Nath Bose', 'Homi J. Bhabha', 'Meghnad Saha', 'Subrahmanyan Chandrasekhar', 'Jagadish Chandra Bose', 'Vikram Sarabhai', 'E. C. G. Sudarshan', 'Abdus Salam', 'Ashoke Sen', 'K. S. Krishnan', 'Raja Ramanna']),
  NAT('Science & Technology', 'russian-physicist', 'Russian', 'physicist', 'Q159 Q34266 Q15180', 'Q169470', /physicist/i, 6, ['Andrei Sakharov', 'Lev Landau', 'Pyotr Kapitsa', 'Igor Tamm', 'Pavel Cherenkov', 'Zhores Alferov', 'George Gamow', 'Igor Kurchatov', 'Nikolay Basov', 'Alexander Prokhorov', 'Mikhail Lomonosov', 'Vitaly Ginzburg']),
  NAT('Science & Technology', 'american-chemist', 'American', 'chemist', 'Q30', 'Q593644', /chemist/i, 8, ['Linus Pauling', 'Glenn T. Seaborg', 'Gilbert N. Lewis', 'Irving Langmuir', 'Robert Burns Woodward', 'Wallace Carothers', 'Josiah Willard Gibbs', 'Harold Urey', 'Paul J. Flory', 'Roald Hoffmann', 'Willard Libby', 'Leo Baekeland']),
  NAT('Science & Technology', 'american-biologist', 'American', 'biologist', 'Q30', 'Q864503', /biologist/i, 8, ['James Watson', 'Barbara McClintock', 'E. O. Wilson', 'Rachel Carson', 'Thomas Hunt Morgan', 'Stephen Jay Gould', 'Lynn Margulis', 'Craig Venter', 'Jane Goodall', 'Linda Buck', 'Richard Dawkins', 'Carl Woese']),
  NAT('Science & Technology', 'british-biologist', 'British', 'biologist', 'Q145 Q174193', 'Q864503', /biologist/i, 8, ['Charles Darwin', 'Alfred Russel Wallace', 'Richard Dawkins', 'Francis Crick', 'Rosalind Franklin', 'Thomas Henry Huxley', 'J. B. S. Haldane', 'Alexander Fleming', 'Julian Huxley', 'David Attenborough', 'Ronald Fisher', 'John Sulston']),

  // ================================================================ Games
  ON_PLATFORM('amstrad-cpc', 'Amstrad CPC', ['Q478829'], 3, ['Head over Heels', 'Sorcery', 'Dizzy', 'Chase H.Q.', 'Sim City', 'Barbarian', 'Prince of Persia', 'R-Type', 'Operation Wolf', 'Bomb Jack', 'Gryzor', 'Paperboy']),
  ON_PLATFORM('msx', 'MSX', ['Q853547'], 3, ['Metal Gear', 'Metal Gear 2: Solid Snake', 'Penguin Adventure', 'Nemesis', 'Vampire Killer', 'King\'s Valley', 'Knightmare', 'Salamander', 'Bomber Man', 'Hydlide', 'Xevious', 'Contra']),
  ON_PLATFORM('bbc-micro', 'BBC Micro', ['Q749976'], 3, ['Elite', 'Chuckie Egg', 'Repton', 'Exile', 'Planetoid', 'Citadel', 'Revs', 'Zalaga', 'Frak!', 'Stryker\'s Run', 'Imogen', 'Castle Quest']),
  ON_PLATFORM('turbografx-16', 'TurboGrafx-16', ['Q1057377'], 2, ['Bonk\'s Adventure', 'Devil\'s Crush', 'R-Type', 'Bomberman \'93', 'Splatterhouse', 'Ys Book I & II', 'Dungeon Explorer', 'Blazing Lazers', 'Neutopia', 'Military Madness', 'Gradius', 'Bloody Wolf']),
  ON_PLATFORM('3do', '3DO', ['Q229429'], 2, ['Road Rash', 'Gex', 'Need for Speed', 'Crash \'n Burn', 'Star Control II', 'Twisted: The Game Show', 'Super Street Fighter II Turbo', 'Wing Commander III', 'The Need for Speed', 'Return Fire', 'Myst', 'Alone in the Dark']),
  ON_PLATFORM('android', 'Android', ['Q94'], 15, ['Angry Birds', 'Candy Crush Saga', 'Pokémon Go', 'Minecraft', 'Clash of Clans', 'Subway Surfers', 'Temple Run', 'Among Us', 'Genshin Impact', 'Fortnite', 'PUBG Mobile', 'Monument Valley', 'Plants vs. Zombies', 'Fruit Ninja']),
  ON_PLATFORM('linux', 'Linux', ['Q388'], 15, ['Counter-Strike', 'Portal', 'Team Fortress 2', 'Dota 2', 'Minecraft', 'Civilization V', 'Left 4 Dead 2', 'Half-Life', 'Stardew Valley', 'Terraria', 'Factorio', 'Cities: Skylines', 'Hades', 'Celeste']),
]
