/**
 * Batch 21: History & Mythology, Science & Technology, Miscellaneous and Places (the things, not the people), for the 250 questions the owner asked
 * for on 18 Nov 2026 (docs/GROWTH_TO_1000.md).
 * Build with: npx tsx src/expand/newq.ts --batch batch21 --out C:/Users/weibi/minitude/list-build/batch21
 */
import type { NewQuestion } from './newq'
import { mk } from './batch8'
import { CITY } from './batch17'
import { HUMAN, heldPosition, kindOf, nameIs, personForms } from './recipes'

/** people who held a position */
const HOLDER = (cat: string, id: string, prompt: string, what: string, pos: string, minSignal: number, mustHave: string[], modern = true): NewQuestion =>
  mk(cat, {
    id, prompt, what, not: 'People who held other offices do not count.',
    source: `People in Wikidata who held the position, known in at least ${minSignal} languages, plus the best-known added by hand.`,
    pattern: heldPosition(pos) + HUMAN, minSignal, mustHave,
    alsoWritten: modern ? personForms : (n) => { const b = n.replace(/, (Holy Roman Emperor|Emperor of Japan)$/i, '').replace(/^Emperor /, ''); return [b, 'Emperor ' + b].filter((x) => x !== n && x.length >= 3) },
  })

/** a fictional thing of a class */
const FICT = (id: string, prompt: string, what: string, cls: string, minSignal: number, mustHave: string[], not = 'Real places, companies and languages do not count.'): NewQuestion =>
  mk('Miscellaneous', {
    id, prompt, what, not, source: `Wikidata fictional items of the class, known in at least ${minSignal} languages.`,
    pattern: `?item wdt:P31/wdt:P279* wd:${cls} .`, minSignal, mustHave,
  })

/** a product or service of a technology company (made by it, or developed by it) */
const PRODUCT = (id: string, company: string, q: string, minSignal: number, mustHave: string[]): NewQuestion =>
  mk('Science & Technology', {
    id, prompt: `Name ${/^[aeiou]/i.test(company) ? 'an' : 'a'} ${company} product or service.`, what: `any product, device, software or online service made or developed by ${company}, past or present`,
    not: 'Products of other companies and the company itself do not count.',
    source: `Wikidata products and software whose manufacturer or developer is ${company}, known in at least ${minSignal} languages.`,
    pattern: `{ ?item wdt:P176 wd:${q} } UNION { ?item wdt:P178 wd:${q} } .`, minSignal, mustHave,
  })

/** a landmark in a city (a tourist attraction in it or in any part of it) */
const LANDMARK = (id: string, city: string, q: string, minSignal: number, mustHave: string[]): NewQuestion =>
  mk('Places', {
    id: `places-landmark-${id}`, prompt: `Name a landmark or tourist attraction in ${city}.`, what: `any landmark, monument, museum, building, park or other tourist attraction in ${city}`,
    not: 'Attractions in other cities do not count.',
    source: `Wikidata tourist attractions located in ${city}, known in at least ${minSignal} languages.`,
    pattern: `?item wdt:P31/wdt:P279* wd:Q570116 . ?item wdt:P131* wd:${q} .`, minSignal, mustHave,
  })

export const BATCH: NewQuestion[] = [
  // ================================================================ History & Mythology
  HOLDER('History & Mythology', 'history-roman-emperor', 'Name a Roman emperor.', 'any emperor of Rome, of the Western or the unified empire, from Augustus to Romulus Augustulus', 'Q842606', 6,
    ['Augustus', 'Nero', 'Caligula', 'Claudius', 'Tiberius', 'Trajan', 'Hadrian', 'Marcus Aurelius', 'Constantine the Great', 'Diocletian', 'Commodus', 'Vespasian', 'Titus', 'Domitian', 'Septimius Severus', 'Caracalla', 'Nerva', 'Antoninus Pius', 'Vitellius', 'Galba', 'Otho', 'Theodosius I', 'Romulus Augustulus', 'Elagabalus', 'Aurelian', 'Julian'], false),
  HOLDER('History & Mythology', 'history-japanese-emperor', 'Name an emperor of Japan.', 'any emperor of Japan, legendary or historical, by his reign name or personal name', 'Q208233', 5,
    ['Hirohito', 'Akihito', 'Naruhito', 'Emperor Meiji', 'Emperor Taishō', 'Emperor Jimmu', 'Emperor Kōmei', 'Emperor Go-Daigo', 'Emperor Kammu', 'Emperor Tenmu', 'Emperor Shōmu', 'Emperor Kōtoku', 'Emperor Ōjin', 'Emperor Nintoku', 'Emperor Antoku', 'Emperor Go-Toba', 'Empress Suiko', 'Empress Jitō'], false),
  HOLDER('History & Mythology', 'history-byzantine-emperor', 'Name a Byzantine emperor.', 'any emperor of the Eastern Roman or Byzantine Empire', 'Q18577504', 5,
    ['Justinian I', 'Constantine XI Palaiologos', 'Heraclius', 'Basil II', 'Theodora', 'Alexios I Komnenos', 'Leo III the Isaurian', 'Irene of Athens', 'Michael VIII Palaiologos', 'Justin I', 'Manuel I Komnenos', 'Romanos IV Diogenes', 'Nikephoros II Phokas', 'John II Komnenos', 'Theodosius II', 'Zeno', 'Anastasius I Dicorus', 'Maurice', 'Phocas', 'Constantine VII'], false),
  HOLDER('History & Mythology', 'history-holy-roman-emperor', 'Name a Holy Roman Emperor.', 'any Holy Roman Emperor, from Charlemagne to Francis II', 'Q181765', 1,
    ['Charlemagne', 'Otto I', 'Frederick Barbarossa', 'Charles V', 'Frederick II', 'Henry IV', 'Maximilian I', 'Rudolf II', 'Ferdinand II', 'Joseph II', 'Francis II', 'Leopold I', 'Sigismund', 'Charles IV', 'Conrad II', 'Lothair I', 'Louis the Pious', 'Otto III', 'Henry II', 'Matthias'], false),
  HOLDER('History & Mythology', 'history-us-secretary-of-state', 'Name a United States Secretary of State.', 'any person who has served as United States Secretary of State', 'Q14213', 8,
    ['Thomas Jefferson', 'John Quincy Adams', 'Henry Clay', 'Daniel Webster', 'William H. Seward', 'Henry Kissinger', 'Hillary Clinton', 'John Kerry', 'Colin Powell', 'Condoleezza Rice', 'Madeleine Albright', 'James Baker', 'Cyrus Vance', 'George C. Marshall', 'Dean Acheson', 'John Foster Dulles', 'Antony Blinken', 'Mike Pompeo', 'Rex Tillerson', 'James Madison', 'James Monroe']),
  HOLDER('History & Mythology', 'history-supreme-court-justice', 'Name a justice of the United States Supreme Court.', 'any Chief Justice or Associate Justice of the United States Supreme Court, past or present', 'Q11144', 6,
    ['Ruth Bader Ginsburg', 'Antonin Scalia', 'Sonia Sotomayor', 'Clarence Thomas', 'Elena Kagan', 'Brett Kavanaugh', 'Amy Coney Barrett', 'Neil Gorsuch', 'Stephen Breyer', 'Samuel Alito', 'Thurgood Marshall', 'William J. Brennan Jr.', 'Oliver Wendell Holmes Jr.', 'Louis Brandeis', 'Hugo Black', 'William O. Douglas', 'Sandra Day O\'Connor', 'Anthony Kennedy', 'David Souter', 'John Paul Stevens', 'William Rehnquist', 'John Roberts', 'Earl Warren', 'John Marshall']),
  mk('History & Mythology', {
    id: 'history-historical-period', prompt: 'Name a historical period or era.', what: 'any named period, age or era of history (an archaeological age, a ruling period, a cultural era or a political era), anywhere in the world',
    not: 'Single events, wars, battles and dynasties that are not called periods do not count.',
    source: 'Wikidata historical periods, known in at least 12 languages.',
    skip: nameIs(/\b(sex|sexual|porn\w*)\b/i), pattern: kindOf('Q11514315'), minSignal: 12,
    mustHave: ['Renaissance', 'Middle Ages', 'Bronze Age', 'Iron Age', 'Stone Age', 'Victorian era', 'Edo period', 'Meiji period', 'Elizabethan era', 'Regency era', 'Gilded Age', 'Jazz Age', 'Cold War', 'Industrial Revolution', 'Age of Enlightenment', 'Dark Ages', 'Islamic Golden Age', 'Heian period', 'Belle Époque', 'Georgian era', 'Roaring Twenties', 'Great Depression', 'Space Age', 'Information Age', 'Edwardian era', 'Tudor period', 'Viking Age', 'Interwar period', 'Reconstruction era'],
  }),
  mk('History & Mythology', {
    id: 'history-book-of-the-bible', prompt: 'Name a book of the Bible.', what: 'any book of the Christian Bible or Hebrew Bible, including the books of the Apocrypha, by its usual name',
    not: 'Chapters, verses, people and other religious texts do not count.',
    source: 'Wikidata books of the Bible, known in at least 3 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q29154430 .', minSignal: 3,
    mustHave: ['Genesis', 'Exodus', 'Psalms', 'Matthew', 'Mark', 'Luke', 'John', 'Revelation', 'Acts', 'Romans', 'Proverbs', 'Isaiah', 'Job', 'Daniel', 'Ruth', 'Esther', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Jonah', 'Ecclesiastes', 'Song of Solomon', 'Lamentations', 'Hebrews', 'Galatians', 'Philemon', 'Jude', 'Tobit', 'Judith', 'Maccabees'],
    alsoWritten: (n) => [n.replace(/^Book of /i, '').replace(/^Gospel of /i, '')].filter((x) => x !== n && x.length >= 3),
  }),
  mk('History & Mythology', {
    id: 'history-christian-denomination', prompt: 'Name a Christian denomination.', what: 'any Christian church, denomination or movement (a Catholic, Orthodox, Protestant or other body), by its usual name',
    not: 'Individual churches, non-Christian religions and sects of other faiths do not count.',
    source: 'Wikidata Christian denominations, known in at least 8 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q879146 .', minSignal: 8,
    mustHave: ['Catholic Church', 'Eastern Orthodox Church', 'Baptists', 'Methodism', 'Lutheranism', 'Presbyterianism', 'Anglicanism', 'Pentecostalism', 'The Church of Jesus Christ of Latter-day Saints', 'Quakers', 'Amish', 'Mennonites', 'Seventh-day Adventist Church', 'Jehovah\'s Witnesses', 'Episcopal Church', 'Oriental Orthodoxy', 'Calvinism', 'Evangelicalism', 'Coptic Orthodox Church of Alexandria', 'Church of England', 'Moravian Church', 'Salvation Army', 'Church of Scotland', 'Unitarianism'],
  }),
  mk('History & Mythology', {
    id: 'history-mythical-place', prompt: 'Name a mythical or legendary place.', what: 'any place that exists only in myth, legend or religion (a lost land, an underworld, a paradise, a hall of gods)',
    not: 'Real places and places from modern fiction do not count.',
    source: 'Wikidata mythical and legendary places, known in at least 5 languages.',
    skip: nameIs(/deities|\bgods$|pantheon|\bgods\b/i), pattern: '?item wdt:P31/wdt:P279* wd:Q3238337 .', minSignal: 5,
    mustHave: ['Atlantis', 'Avalon', 'Valhalla', 'El Dorado', 'Shangri-La', 'Mount Olympus', 'Asgard', 'Elysium', 'Camelot', 'Hades', 'Tartarus', 'Lemuria', 'Hyperborea', 'Garden of Eden', 'Yggdrasil', 'Midgard', 'Helheim', 'Jötunheimr', 'Lyonesse', 'Cockaigne', 'Mu', 'Eden', 'Hesperides', 'Fortunate Isles', 'Prester John\'s kingdom', 'Xanadu'],
  }),
  mk('History & Mythology', {
    id: 'history-ww2-battle', prompt: 'Name a battle of World War II.', what: 'any battle, siege, campaign or major engagement of World War II, in any theatre',
    not: 'Battles of other wars do not count.',
    source: 'Wikidata battles that are part of World War II, known in at least 8 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q178561 . ?item wdt:P361+ wd:Q362 .', minSignal: 8,
    mustHave: ['Battle of Stalingrad', 'Battle of Midway', 'Battle of Britain', 'D-Day', 'Battle of the Bulge', 'Battle of Berlin', 'Battle of El Alamein', 'Battle of Kursk', 'Battle of Iwo Jima', 'Battle of Okinawa', 'Siege of Leningrad', 'Battle of Guadalcanal', 'Battle of the Atlantic', 'Pearl Harbor', 'Battle of Monte Cassino', 'Battle of Dunkirk', 'Battle of Arnhem', 'Battle of Moscow', 'Battle of France', 'Battle of Crete', 'Battle of Tarawa', 'Battle of Saipan', 'Battle of Normandy'],
    alsoWritten: (n) => [n.replace(/^(Battle|Siege) of /i, '')].filter((x) => x !== n && x.length >= 4),
  }),
  mk('History & Mythology', {
    id: 'history-civil-war-battle', prompt: 'Name a battle of the American Civil War.', what: 'any battle or siege of the American Civil War, by its Union or Confederate name',
    not: 'Battles of other wars do not count.',
    source: 'Wikidata battles that are part of the American Civil War, known in at least 3 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q178561 . ?item wdt:P361+ wd:Q8676 .', minSignal: 3,
    mustHave: ['Battle of Gettysburg', 'Battle of Antietam', 'First Battle of Bull Run', 'Battle of Fort Sumter', 'Battle of Shiloh', 'Battle of Chancellorsville', 'Siege of Vicksburg', 'Battle of Fredericksburg', 'Battle of the Wilderness', 'Battle of Spotsylvania Court House', 'Battle of Cold Harbor', 'Battle of Chickamauga', 'Second Battle of Bull Run', 'Battle of Petersburg', 'Battle of Appomattox Court House', 'Battle of Hampton Roads', 'Atlanta campaign', 'Battle of Franklin', 'Battle of Perryville', 'Battle of Fort Donelson'],
    alsoWritten: (n) => [n.replace(/^(First |Second |Third )?Battle of /i, '').replace(/^Siege of /i, '')].filter((x) => x !== n && x.length >= 4),
  }),

  // ================================================================ Science & Technology
  mk('Science & Technology', {
    id: 'science-scientific-law', prompt: 'Name a scientific law or principle.', what: 'any named law, principle or effect of science (physics, chemistry, biology, economics or maths), by its usual name',
    not: 'Theories, equations that are not called laws or principles, and people do not count.',
    source: 'Wikidata scientific laws and principles, known in at least 6 languages.',
    skip: nameIs(/\b(sex|sexual)\b/i), pattern: kindOf('Q408891'), minSignal: 6,
    mustHave: ['Newton\'s laws of motion', 'Law of universal gravitation', 'Ohm\'s law', 'Boyle\'s law', 'Charles\'s law', 'Hooke\'s law', 'Coulomb\'s law', 'Faraday\'s law of induction', 'Archimedes\' principle', 'Pascal\'s law', 'Law of conservation of energy', 'Laws of thermodynamics', 'Heisenberg uncertainty principle', 'Pauli exclusion principle', 'Murphy\'s law', 'Moore\'s law', 'Kepler\'s laws of planetary motion', 'Snell\'s law', 'Avogadro\'s law', 'Le Chatelier\'s principle', 'Law of supply and demand', 'Gresham\'s law', 'Hubble\'s law', 'Bernoulli\'s principle'],
  }),
  mk('Science & Technology', {
    id: 'science-famous-equation', prompt: 'Name a famous equation.', what: 'any named equation or formula of maths, physics, chemistry or other science, by its usual name',
    not: 'Laws that are not called equations, theorems and constants do not count.',
    source: 'Wikidata named equations, known in at least 10 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q11345 .', minSignal: 10,
    mustHave: ['Mass–energy equivalence', 'Schrödinger equation', 'Pythagorean theorem', 'Quadratic equation', 'Maxwell\'s equations', 'Navier–Stokes equations', 'Euler\'s identity', 'Einstein field equations', 'Dirac equation', 'Black–Scholes equation', 'Bernoulli\'s equation', 'Boltzmann\'s entropy formula', 'Drake equation', 'Lorenz system', 'Fourier transform', 'Arrhenius equation', 'Ideal gas law', 'Nernst equation', 'Heat equation', 'Wave equation', 'Hardy–Weinberg principle', 'Michaelis–Menten kinetics', 'Klein–Gordon equation'],
  }),
  mk('Science & Technology', {
    id: 'science-vitamin', prompt: 'Name a vitamin.', what: 'any vitamin, vitamer or B-complex vitamin, by its letter, number or chemical name',
    not: 'Minerals, supplements and foods do not count.',
    source: 'Wikidata vitamins, known in at least 3 languages.',
    pattern: kindOf('Q34956'), minSignal: 3,
    mustHave: ['Vitamin C', 'Vitamin D', 'Vitamin A', 'Vitamin B12', 'Vitamin E', 'Vitamin K', 'Vitamin B6', 'Folate', 'Niacin', 'Riboflavin', 'Thiamine', 'Biotin', 'Pantothenic acid', 'Retinol', 'Ascorbic acid', 'Cholecalciferol', 'Vitamin B1', 'Vitamin B2', 'Vitamin B3', 'Vitamin B5', 'Vitamin B7', 'Vitamin B9', 'Tocopherol', 'Folic acid', 'Cobalamin', 'Phylloquinone', 'Calciferol'],
  }),
  PRODUCT('science-apple-product', 'Apple', 'Q312', 6, ['iPhone', 'iPad', 'MacBook', 'iMac', 'Apple Watch', 'AirPods', 'Apple TV', 'iPod', 'Apple II', 'Macintosh', 'Apple Lisa', 'Newton', 'Apple Pencil', 'HomePod', 'Apple Vision Pro', 'Mac Mini', 'MacBook Air', 'MacBook Pro', 'iTunes', 'Siri', 'Safari', 'Final Cut Pro', 'GarageBand', 'iCloud', 'macOS', 'iOS', 'Apple Pay', 'Apple Music', 'FaceTime', 'iMessage']),
  PRODUCT('science-google-product', 'Google', 'Q95', 6, ['Gmail', 'Google Maps', 'Google Chrome', 'YouTube', 'Android', 'Google Pixel', 'Google Docs', 'Google Drive', 'Google Earth', 'Google Translate', 'Chromecast', 'Google Nest', 'Google Photos', 'Google Meet', 'Google Search', 'Google Calendar', 'Google Assistant', 'Google Chrome OS', 'Google Glass', 'Google+', 'Google Street View', 'Google Play', 'Google Lens', 'Gemini', 'Waymo', 'Google Sheets']),
  PRODUCT('science-microsoft-product', 'Microsoft', 'Q2283', 6, ['Windows', 'Microsoft Office', 'Microsoft Word', 'Microsoft Excel', 'Xbox', 'Microsoft Surface', 'Microsoft Teams', 'Microsoft Azure', 'Bing', 'Microsoft Outlook', 'Microsoft PowerPoint', 'Internet Explorer', 'Skype', 'Microsoft Edge', 'Visual Studio', 'Minecraft', 'Windows 95', 'Windows XP', 'Windows 10', 'MS-DOS', 'Clippy', 'Microsoft Paint', 'OneDrive', 'Copilot', 'Zune', 'Kinect']),

  // ================================================================ Miscellaneous
  FICT('misc-fictional-country', 'Name a fictional country.', 'any country that exists only in a book, film, show, game or comic', 'Q1145276', 6,
    ['Wakanda', 'Narnia', 'Mordor', 'Genovia', 'Latveria', 'Zamunda', 'Freedonia', 'Ruritania', 'Panem', 'Gilead', 'Sokovia', 'Elbonia', 'Sylvania', 'Borduria', 'Syldavia', 'Westeros', 'Oceania', 'Wadiya', 'Madripoor', 'Atlantis', 'Florin', 'Gondor', 'Rohan', 'Arendelle', 'Sodor'], 'Real countries do not count.'),
  FICT('misc-fictional-planet', 'Name a fictional planet.', 'any planet that exists only in a book, film, show, game or comic', 'Q2775969', 6,
    ['Tatooine', 'Krypton', 'Pandora', 'Arrakis', 'Vulcan', 'Naboo', 'Hoth', 'Endor', 'Alderaan', 'Coruscant', 'Gallifrey', 'Cybertron', 'Namek', 'Mongo', 'Solaris', 'Magrathea', 'Skaro', 'Kamino', 'Mustafar', 'Dagobah', 'Caprica', 'Vegeta', 'Thanagar', 'Asgard', 'Titan', 'Genosha'], 'Real planets do not count.'),
  FICT('misc-fictional-city', 'Name a fictional city.', 'any city or town that exists only in a book, film, show, game or comic', 'Q1964689', 6,
    ['Gotham City', 'Metropolis', 'Springfield', 'Hogsmeade', 'Hill Valley', 'Bedrock', 'Sunnydale', 'Smallville', 'King\'s Landing', 'Rivendell', 'Emerald City', 'Atlantis', 'Mega-City One', 'Pawnee', 'Stars Hollow', 'Bikini Bottom', 'Quahog', 'Springfield', 'Riverdale', 'Duckburg', 'Zootopia', 'Agrabah', 'Radiator Springs', 'Capeside', 'Castle Rock', 'Derry', 'Midgar'], 'Real cities do not count.'),
  FICT('misc-fictional-company', 'Name a fictional company.', 'any company, brand or corporation that exists only in a book, film, show, game or comic', 'Q5446565', 5,
    ['Acme Corporation', 'Wayne Enterprises', 'Cyberdyne Systems', 'Weyland-Yutani', 'Umbrella Corporation', 'Stark Industries', 'Oscorp', 'LexCorp', 'Dunder Mifflin', 'Initech', 'Tyrell Corporation', 'Monsters, Inc.', 'Buy n Large', 'Wonka Industries', 'Los Pollos Hermanos', 'Pied Piper', 'Soylent Corporation', 'Planet Express', 'Duff Beer', 'InGen', 'Aperture Science', 'Black Mesa', 'Rekall', 'Spacely Space Sprockets'], 'Real companies do not count.'),
  mk('Miscellaneous', {
    id: 'misc-stock-market-index', prompt: 'Name a stock market index.', what: 'any stock market index of any country or region (a share price index or its stock-exchange benchmark)',
    not: 'Individual companies and stock exchanges do not count.',
    source: 'Wikidata stock market indices, known in at least 5 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q223371 .', minSignal: 5,
    mustHave: ['Dow Jones Industrial Average', 'S&P 500', 'NASDAQ Composite', 'FTSE 100 Index', 'Nikkei 225', 'DAX', 'CAC 40', 'Hang Seng Index', 'Shanghai Stock Exchange Composite Index', 'Euro Stoxx 50', 'Russell 2000', 'Sensex', 'Nifty 50', 'KOSPI', 'Straits Times Index', 'S&P/ASX 200', 'IBEX 35', 'TOPIX', 'SMI', 'Bovespa Index', 'S&P/TSX Composite Index'],
    alsoWritten: (n) => (/Dow Jones Industrial Average/i.test(n) ? ['Dow Jones', 'The Dow', 'DJIA'] : /^S&P 500$/i.test(n) ? ['S and P 500', 'SP500'] : /^NASDAQ Composite$/i.test(n) ? ['Nasdaq'] : /^FTSE 100 Index$/i.test(n) ? ['FTSE 100', 'FTSE', 'Footsie'] : []),
  }),
  mk('Miscellaneous', {
    id: 'misc-pharmaceutical-company', prompt: 'Name a pharmaceutical company.', what: 'any company that makes medicines or vaccines (a drug maker, a biotech company or a generics maker)',
    not: 'Hospitals, pharmacies and chemical companies that make no medicines do not count.',
    source: 'Wikidata pharmaceutical companies, known in at least 10 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q19644607 .', minSignal: 4,
    mustHave: ['Pfizer', 'Johnson & Johnson', 'Roche', 'Novartis', 'Merck & Co.', 'GlaxoSmithKline', 'Sanofi', 'AstraZeneca', 'Bayer', 'AbbVie', 'Eli Lilly and Company', 'Bristol-Myers Squibb', 'Novo Nordisk', 'Moderna', 'Amgen', 'Takeda Pharmaceutical Company', 'Gilead Sciences', 'Boehringer Ingelheim', 'Teva Pharmaceutical Industries', 'BioNTech', 'Abbott Laboratories', 'Genentech', 'Biogen', 'Regeneron'],
  }),
  mk('Miscellaneous', {
    id: 'misc-oil-company', prompt: 'Name an oil or gas company.', what: 'any company that finds, produces, refines or sells oil and gas (a major, a national oil company or a petrol-station brand)',
    not: 'Power utilities and car makers do not count.',
    source: 'Wikidata oil and gas companies, known in at least 8 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q14941854 .', minSignal: 3,
    mustHave: ['ExxonMobil', 'Shell plc', 'BP', 'Chevron Corporation', 'TotalEnergies', 'ConocoPhillips', 'Saudi Aramco', 'Gazprom', 'Rosneft', 'Petrobras', 'Equinor', 'Eni', 'PetroChina', 'Sinopec', 'Lukoil', 'Texaco', 'Gulf Oil', 'Occidental Petroleum', 'Pemex', 'Repsol', 'Petronas', 'Halliburton', 'Schlumberger', 'Standard Oil'],
  }),

  // ================================================================ Places
  CITY('turkey', 'Turkey', 'Q43', 8, ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Trabzon', 'Gaziantep', 'Bodrum', 'Cappadocia', 'Eskişehir', 'Kayseri', 'Samsun', 'Marmaris', 'Edirne']),
  CITY('south-korea', 'South Korea', 'Q884', 6, ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Suwon', 'Ulsan', 'Jeju City', 'Gyeongju', 'Jeonju', 'Pohang', 'Changwon', 'Chuncheon', 'Andong', 'Yeosu']),
  CITY('indonesia', 'Indonesia', 'Q252', 5, ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Yogyakarta', 'Denpasar', 'Makassar', 'Palembang', 'Malang', 'Balikpapan', 'Batam', 'Manado', 'Pontianak', 'Solo', 'Bogor']),
  CITY('thailand', 'Thailand', 'Q869', 2, ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Hua Hin', 'Ayutthaya', 'Krabi', 'Chiang Rai', 'Khon Kaen', 'Nakhon Ratchasima', 'Udon Thani', 'Hat Yai', 'Sukhothai', 'Koh Samui', 'Kanchanaburi', 'Nonthaburi']),
  CITY('philippines', 'the Philippines', 'Q928', 5, ['Manila', 'Quezon City', 'Cebu City', 'Davao City', 'Makati', 'Baguio', 'Iloilo City', 'Zamboanga City', 'Cagayan de Oro', 'Taguig', 'Pasig', 'Angeles City', 'Bacolod', 'General Santos', 'Puerto Princesa', 'Vigan']),
  CITY('poland', 'Poland', 'Q36', 8, ['Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk', 'Szczecin', 'Lublin', 'Katowice', 'Toruń', 'Białystok', 'Częstochowa', 'Gdynia', 'Sopot', 'Zakopane', 'Oświęcim']),
  CITY('netherlands', 'the Netherlands', 'Q55', 8, ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Groningen', 'Maastricht', 'Haarlem', 'Delft', 'Leiden', 'Arnhem', 'Nijmegen', 'Breda', 'Tilburg', 'Zwolle', 'Alkmaar']),
  CITY('argentina', 'Argentina', 'Q414', 5, ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'Mar del Plata', 'Salta', 'Tucumán', 'Bariloche', 'Ushuaia', 'Santa Fe', 'Neuquén', 'Posadas', 'Resistencia', 'Bahía Blanca', 'Puerto Madryn']),
  CITY('egypt', 'Egypt', 'Q79', 5, ['Cairo', 'Alexandria', 'Giza', 'Luxor', 'Aswan', 'Sharm El Sheikh', 'Hurghada', 'Port Said', 'Suez', 'Mansoura', 'Tanta', 'Asyut', 'Ismailia', 'Faiyum', 'Damietta', 'Dahab']),
  CITY('south-africa', 'South Africa', 'Q258', 2, ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'Soweto', 'Stellenbosch', 'East London', 'Pietermaritzburg', 'Kimberley', 'Polokwane', 'Nelspruit', 'George', 'Knysna', 'Richards Bay']),
  mk('Places', {
    id: 'places-us-county', prompt: 'Name a county in the United States.', what: 'any county or county-equivalent (a parish or a borough) in the United States, written with or without the word "County"',
    not: 'Cities, states and counties of other countries do not count.',
    source: 'Wikidata counties of the United States, known in at least 3 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q47168 .', minSignal: 1,
    mustHave: ['Los Angeles County', 'Cook County', 'Harris County', 'Maricopa County', 'San Diego County', 'Orange County', 'Miami-Dade County', 'Kings County', 'Dallas County', 'Queens County', 'Riverside County', 'King County', 'Clark County', 'Wayne County', 'Santa Clara County', 'New York County', 'Fairfax County', 'Middlesex County', 'Palm Beach County', 'Suffolk County', 'Franklin County', 'Jefferson County', 'Washington County', 'Lincoln County'],
    alsoWritten: (n) => [n.replace(/ (County|Parish|Borough)$/i, '')].filter((x) => x !== n && x.length >= 4),
  }),
]
