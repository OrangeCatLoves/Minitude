/**
 * Batch 23: Transport & Vehicles and Places, for the last 228 questions towards 1,000 that the owner asked for on 18 Nov 2026 (docs/GROWTH_TO_1000.md).
 * A spread: airlines, airports, bridges, rivers, lakes, islands, mountains and cities of many countries (so that a future genre or region has enough).
 * Build with: npx tsx src/expand/newq.ts --batch batch23 --out C:/Users/weibi/minitude/list-build/batch23
 */
import type { NewQuestion } from './newq'
import { mk } from './batch8'
import { CITY } from './batch17'
import { strip } from './recipes'

const an = (w: string): string => (/^[aeiou]/i.test(w) ? 'an' : 'a')
const TR = 'Transport & Vehicles'

/** a class of things located in (or belonging to) a country */
const IN = (cat: string, id: string, noun: string, country: string, countryName: string, cls: string, minSignal: number, mustHave: string[], extra: Partial<NewQuestion> = {}): NewQuestion =>
  mk(cat, {
    id, prompt: `Name ${an(noun)} ${noun} in ${countryName}.`, what: `any ${noun} in ${countryName}, of any size, written with or without ${/river|lake/.test(noun) ? 'the word River or Lake' : 'its type word'}`,
    not: `Things in other countries do not count.`,
    source: `Wikidata items of the class located in the country, known in at least ${minSignal} languages.`,
    pattern: `?item wdt:P31/wdt:P279* wd:${cls} . ?item wdt:P17 wd:${country} .`, minSignal, mustHave, ...extra,
  })

export const AIRLINE = (id: string, adj: string, country: string, minSignal: number, mustHave: string[]): NewQuestion =>
  mk(TR, {
    id: `transport-airline-${id}`, prompt: `Name ${an(adj)} ${adj} airline.`, what: `any airline of ${adj === 'British' ? 'the United Kingdom' : adj === 'American' ? 'the United States' : adj}${adj === 'American' || adj === 'British' ? '' : ' origin'}, past or present, passenger or cargo`,
    not: 'Airlines of other countries do not count.',
    source: `Wikidata airlines of the country, known in at least ${minSignal} languages.`,
    pattern: `?item wdt:P31/wdt:P279* wd:Q46970 . ?item wdt:P17 wd:${country} .`, minSignal, mustHave,
  })

export const AIRPORT = (id: string, adj: string, country: string, minSignal: number, mustHave: string[]): NewQuestion =>
  mk(TR, {
    id: `transport-airport-${id}`, prompt: `Name ${an(adj)} ${adj} airport.`, what: `any airport in ${adj === 'British' ? 'the United Kingdom' : adj === 'American' ? 'the United States' : adj === 'Brazilian' ? 'Brazil' : adj}, written by its name, its city or its IATA code`,
    not: 'Airports of other countries do not count.',
    source: `Wikidata airports of the country, known in at least ${minSignal} languages, with their IATA codes.`,
    pattern: `?item wdt:P31/wdt:P279* wd:Q1248784 . ?item wdt:P17 wd:${country} .`, minSignal, mustHave, codeProp: 'P238',
    alsoWritten: (n) => [n.replace(/ (International |Intercontinental |Regional |Municipal )?(Airport|Airfield)$/i, '').replace(/ Airport$/i, '')].filter((x) => x !== n && x.length >= 3),
  })

export const BRIDGE = (id: string, adj: string, country: string, minSignal: number, mustHave: string[]): NewQuestion =>
  mk(TR, {
    id: `transport-bridge-${id}`, prompt: `Name a bridge in ${adj}.`, what: `any bridge in ${adj}, of any kind, written with or without the word Bridge`,
    not: 'Bridges in other countries do not count.',
    source: `Wikidata bridges located in the country, known in at least ${minSignal} languages.`,
    pattern: `?item wdt:P31/wdt:P279* wd:Q12280 . ?item wdt:P17 wd:${country} .`, minSignal, mustHave,
    alsoWritten: strip(/ Bridge$/i),
  })

const BODY = (id: string, noun: string, cls: string, minSignal: number, mustHave: string[]): NewQuestion =>
  mk(TR, {
    id: `transport-${id}`, prompt: `Name ${an(noun)} ${noun}.`, what: `any model of ${an(noun)} ${noun} from any maker, written with or without the maker's name`,
    not: 'Concept cars and engines do not count.',
    source: `Wikidata car models of the kind, known in at least ${minSignal} languages.`,
    pattern: `?item wdt:P31/wdt:P279* wd:${cls} . ?item wdt:P176 ?mk .`, minSignal, mustHave,
    alsoWritten: (n) => [n.replace(/^[A-Za-zÀ-ÿ.-]+ /, '')].filter((x) => x !== n && x.length >= 2),
  })

export const BATCH: NewQuestion[] = [
  // ================================================================ Transport: airlines of a country
  AIRLINE('american', 'American', 'Q30', 3, ['Delta Air Lines', 'American Airlines', 'United Airlines', 'Southwest Airlines', 'JetBlue', 'Alaska Airlines', 'Spirit Airlines', 'Pan Am', 'Hawaiian Airlines', 'Frontier Airlines', 'Allegiant Air', 'Trans World Airlines', 'Eastern Air Lines', 'Continental Airlines', 'Northwest Airlines']),
  AIRLINE('british', 'British', 'Q145', 3, ['British Airways', 'easyJet', 'Virgin Atlantic', 'Jet2.com', 'British Overseas Airways Corporation', 'British Midland International', 'Flybe', 'Monarch Airlines', 'Loganair', 'TUI Airways', 'British European Airways', 'Laker Airways']),
  AIRLINE('german', 'German', 'Q183', 3, ['Lufthansa', 'Eurowings', 'Condor', 'TUIfly', 'Air Berlin', 'Germanwings', 'Lufthansa CityLine', 'LTU', 'Hapag-Lloyd Flug', 'Discover Airlines']),
  AIRLINE('french', 'French', 'Q142', 3, ['Air France', 'Transavia France', 'Corsair International', 'French Bee', 'Air Caraïbes', 'Hop!', 'Air Inter', 'UTA', 'Air Austral', 'Aigle Azur']),
  AIRLINE('chinese', 'Chinese', 'Q148', 3, ['Air China', 'China Eastern Airlines', 'China Southern Airlines', 'Hainan Airlines', 'Sichuan Airlines', 'Shenzhen Airlines', 'Spring Airlines', 'Xiamen Airlines', 'Juneyao Airlines', 'Shandong Airlines']),
  AIRLINE('japanese', 'Japanese', 'Q17', 3, ['Japan Airlines', 'All Nippon Airways', 'Peach', 'Skymark Airlines', 'Air Do', 'Zipair Tokyo', 'Star Flyer', 'Japan Air System', 'Fuji Dream Airlines', 'Jetstar Japan']),
  AIRLINE('indian', 'Indian', 'Q668', 3, ['Air India', 'IndiGo', 'SpiceJet', 'Vistara', 'Jet Airways', 'Kingfisher Airlines', 'Akasa Air', 'GoAir', 'Air India Express', 'Indian Airlines']),
  AIRLINE('russian', 'Russian', 'Q159', 3, ['Aeroflot', 'S7 Airlines', 'Ural Airlines', 'Pobeda', 'Rossiya Airlines', 'UTair', 'Transaero', 'Aurora', 'Nordwind Airlines', 'Siberia Airlines']),
  AIRLINE('brazilian', 'Brazilian', 'Q155', 3, ['LATAM Brasil', 'Gol Transportes Aéreos', 'Azul Brazilian Airlines', 'Varig', 'VASP', 'TAM Airlines', 'Avianca Brasil', 'Transbrasil', 'Passaredo', 'Sky Airline']),
  AIRLINE('canadian', 'Canadian', 'Q16', 3, ['Air Canada', 'WestJet', 'Porter Airlines', 'Air Transat', 'Canadian Airlines', 'Flair Airlines', 'Jazz Aviation', 'Pacific Western Airlines', 'Canadian Pacific Air Lines', 'Sunwing Airlines']),
  AIRLINE('australian', 'Australian', 'Q408', 2, ['Qantas', 'Virgin Australia', 'Jetstar Airways', 'Ansett Australia', 'Rex Airlines', 'Tigerair Australia', 'Ansett', 'Trans Australia Airlines', 'Skywest Airlines', 'Alliance Airlines']),
  AIRLINE('spanish', 'Spanish', 'Q29', 3, ['Iberia', 'Vueling', 'Air Europa', 'Binter Canarias', 'Volotea', 'Spanair', 'Iberia Express', 'Air Nostrum', 'Aviaco', 'Pullmantur Air']),
  AIRLINE('turkish', 'Turkish', 'Q43', 2, ['Turkish Airlines', 'Pegasus Airlines', 'SunExpress', 'AnadoluJet', 'Onur Air', 'AtlasGlobal', 'Corendon Airlines', 'Freebird Airlines', 'Borajet', 'Turkish Airlines Cargo']),
  AIRLINE('indonesian', 'Indonesian', 'Q252', 2, ['Garuda Indonesia', 'Lion Air', 'Batik Air', 'Citilink', 'Sriwijaya Air', 'AirAsia Indonesia', 'Merpati Nusantara Airlines', 'Wings Air', 'Mandala Airlines', 'Pelita Air']),

  // ================================================================ Transport: airports of a country
  AIRPORT('american', 'American', 'Q30', 5, ['John F. Kennedy International Airport', 'Los Angeles International Airport', 'O\'Hare International Airport', 'Hartsfield–Jackson Atlanta International Airport', 'Dallas Fort Worth International Airport', 'San Francisco International Airport', 'Denver International Airport', 'Miami International Airport', 'Seattle–Tacoma International Airport', 'Newark Liberty International Airport', 'LaGuardia Airport', 'Logan International Airport', 'McCarran International Airport', 'Orlando International Airport', 'Phoenix Sky Harbor International Airport']),
  AIRPORT('british', 'British', 'Q145', 3, ['Heathrow Airport', 'Gatwick Airport', 'Manchester Airport', 'Stansted Airport', 'Luton Airport', 'Edinburgh Airport', 'Birmingham Airport', 'Glasgow Airport', 'London City Airport', 'Bristol Airport', 'Belfast International Airport', 'Newcastle International Airport']),
  AIRPORT('german', 'German', 'Q183', 3, ['Frankfurt Airport', 'Munich Airport', 'Berlin Brandenburg Airport', 'Düsseldorf Airport', 'Hamburg Airport', 'Cologne Bonn Airport', 'Stuttgart Airport', 'Berlin Tegel Airport', 'Berlin Tempelhof Airport', 'Hannover Airport', 'Nuremberg Airport']),
  AIRPORT('french', 'French', 'Q142', 3, ['Charles de Gaulle Airport', 'Orly Airport', 'Nice Côte d\'Azur Airport', 'Marseille Provence Airport', 'Lyon–Saint-Exupéry Airport', 'Toulouse–Blagnac Airport', 'Bordeaux–Mérignac Airport', 'Beauvais–Tillé Airport', 'Nantes Atlantique Airport', 'Le Bourget Airport']),
  AIRPORT('chinese', 'Chinese', 'Q148', 3, ['Beijing Capital International Airport', 'Shanghai Pudong International Airport', 'Guangzhou Baiyun International Airport', 'Chengdu Shuangliu International Airport', 'Shenzhen Bao\'an International Airport', 'Hong Kong International Airport', 'Beijing Daxing International Airport', 'Shanghai Hongqiao International Airport', 'Kai Tak Airport', 'Xi\'an Xianyang International Airport']),
  AIRPORT('indian', 'Indian', 'Q668', 3, ['Indira Gandhi International Airport', 'Chhatrapati Shivaji Maharaj International Airport', 'Kempegowda International Airport', 'Chennai International Airport', 'Netaji Subhas Chandra Bose International Airport', 'Rajiv Gandhi International Airport', 'Cochin International Airport', 'Sardar Vallabhbhai Patel International Airport', 'Goa International Airport', 'Pune Airport']),
  AIRPORT('japanese', 'Japanese', 'Q17', 3, ['Narita International Airport', 'Haneda Airport', 'Kansai International Airport', 'Chubu Centrair International Airport', 'New Chitose Airport', 'Fukuoka Airport', 'Naha Airport', 'Osaka International Airport', 'Kobe Airport', 'Sendai Airport']),
  AIRPORT('canadian', 'Canadian', 'Q16', 3, ['Toronto Pearson International Airport', 'Vancouver International Airport', 'Montréal–Trudeau International Airport', 'Calgary International Airport', 'Ottawa Macdonald–Cartier International Airport', 'Edmonton International Airport', 'Halifax Stanfield International Airport', 'Winnipeg James Armstrong Richardson International Airport', 'Montréal–Mirabel International Airport', 'Billy Bishop Toronto City Airport']),
  AIRPORT('australian', 'Australian', 'Q408', 2, ['Sydney Airport', 'Melbourne Airport', 'Brisbane Airport', 'Perth Airport', 'Adelaide Airport', 'Gold Coast Airport', 'Cairns Airport', 'Canberra Airport', 'Darwin International Airport', 'Hobart Airport']),
  AIRPORT('brazilian', 'Brazilian', 'Q155', 2, ['São Paulo–Guarulhos International Airport', 'Rio de Janeiro–Galeão International Airport', 'Brasília International Airport', 'Congonhas Airport', 'Viracopos International Airport', 'Santos Dumont Airport', 'Salvador International Airport', 'Recife International Airport', 'Fortaleza International Airport', 'Confins International Airport']),

  // ================================================================ Transport: bridges of a country
  BRIDGE('united-states', 'the United States', 'Q30', 6, ['Golden Gate Bridge', 'Brooklyn Bridge', 'George Washington Bridge', 'Verrazzano-Narrows Bridge', 'Manhattan Bridge', 'Williamsburg Bridge', 'Bay Bridge', 'Mackinac Bridge', 'Tacoma Narrows Bridge', 'Chesapeake Bay Bridge', 'Brooklyn Bridge', 'Queensboro Bridge', 'Sunshine Skyway Bridge', 'Roebling Suspension Bridge']),
  BRIDGE('united-kingdom', 'the United Kingdom', 'Q145', 4, ['Tower Bridge', 'London Bridge', 'Forth Bridge', 'Clifton Suspension Bridge', 'Humber Bridge', 'Menai Suspension Bridge', 'Severn Bridge', 'Millennium Bridge', 'Westminster Bridge', 'Tyne Bridge', 'Iron Bridge', 'Forth Road Bridge', 'Waterloo Bridge', 'Albert Bridge']),
  BRIDGE('china', 'China', 'Q148', 3, ['Hong Kong–Zhuhai–Macau Bridge', 'Danyang–Kunshan Grand Bridge', 'Tsing Ma Bridge', 'Sutong Bridge', 'Nanjing Yangtze River Bridge', 'Zhaozhou Bridge', 'Lugou Bridge', 'Jiaozhou Bay Bridge', 'Stonecutters Bridge', 'Beipanjiang Bridge']),
  BRIDGE('germany', 'Germany', 'Q183', 3, ['Köhlbrandbrücke', 'Rheinbrücke', 'Hohenzollernbrücke', 'Oberbaumbrücke', 'Müngstener Brücke', 'Göltzschtalbrücke', 'Fehmarnsund Bridge']),
  BRIDGE('france', 'France', 'Q142', 3, ['Pont Neuf', 'Pont du Gard', 'Millau Viaduct', 'Pont Alexandre III', 'Pont des Arts', 'Pont d\'Avignon', 'Pont de Normandie', 'Pont de Tancarville', 'Pont Valentré', 'Pont Neuf']),
  BRIDGE('italy', 'Italy', 'Q38', 3, ['Ponte Vecchio', 'Rialto Bridge', 'Bridge of Sighs', 'Ponte Sant\'Angelo', 'Ponte Milvio', 'Ponte Sisto', 'Ponte della Costituzione', 'Ponte Pietra', 'Ponte Scaligero', 'Ponte Morandi']),
  BODY('suv', 'SUV', 'Q192152', 4, ['Toyota RAV4', 'Honda CR-V', 'Jeep Wrangler', 'Ford Explorer', 'Range Rover', 'Tesla Model X', 'Nissan Qashqai', 'Toyota Land Cruiser', 'Jeep Grand Cherokee', 'Chevrolet Tahoe', 'Land Rover Defender', 'BMW X5', 'Porsche Cayenne', 'Volkswagen Tiguan', 'Mazda CX-5']),
  BODY('sports-car', 'sports car', 'Q274586', 4, ['Ford Mustang', 'Chevrolet Corvette', 'Porsche 911', 'Mazda MX-5', 'Nissan GT-R', 'Toyota Supra', 'Lotus Elise', 'Dodge Viper', 'BMW Z4', 'Aston Martin DB5', 'Ferrari 250 GTO', 'Honda NSX', 'Jaguar E-Type', 'Alfa Romeo 4C', 'Audi TT']),
  BODY('pickup-truck', 'pickup truck', 'Q215601', 3, ['Ford F-Series', 'Toyota Hilux', 'Chevrolet Silverado', 'Dodge Ram', 'Ford Ranger', 'Toyota Tacoma', 'Nissan Frontier', 'Tesla Cybertruck', 'Ford Maverick', 'GMC Sierra', 'Isuzu D-Max', 'Mitsubishi L200', 'Volkswagen Amarok', 'Honda Ridgeline']),
  BODY('electric-car', 'electric car', 'Q193692', 3, ['Tesla Model S', 'Tesla Model 3', 'Nissan Leaf', 'Chevrolet Bolt', 'BMW i3', 'Tesla Model Y', 'Renault Zoe', 'Hyundai Ioniq 5', 'Ford Mustang Mach-E', 'Volkswagen ID.3', 'Audi e-tron', 'Kia EV6', 'Porsche Taycan', 'Mitsubishi i-MiEV', 'GM EV1']),
  mk(TR, {
    id: 'transport-high-speed-train', prompt: 'Name a high-speed train.', what: 'any high-speed train or high-speed rail service, by its name (a Shinkansen, a TGV, an ICE, a Eurostar and so on)',
    not: 'Ordinary trains and metro lines do not count.',
    source: 'Wikidata high-speed trains and services, known in at least 2 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q13402959 .', minSignal: 2,
    mustHave: ['Shinkansen', 'TGV', 'ICE', 'Eurostar', 'AVE', 'Acela Express', 'Thalys', 'KTX', 'Frecciarossa', 'Fuxing', 'Italo', 'Pendolino', 'Talgo', 'Maglev', 'Sapsan', 'Railjet', 'Harmony', 'Hayabusa', 'Nozomi'],
  }),
  mk(TR, {
    id: 'transport-airliner', prompt: 'Name an airliner.', what: 'any passenger airliner type from any maker (a jet, a turboprop or an old propliner), by its usual name',
    not: 'Military aircraft and single aircraft do not count.',
    source: 'Wikidata airliner types, known in at least 4 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q210932 .', minSignal: 4,
    mustHave: ['Boeing 747', 'Boeing 737', 'Airbus A380', 'Concorde', 'Boeing 777', 'Airbus A320', 'Boeing 787 Dreamliner', 'Douglas DC-3', 'Boeing 707', 'Lockheed L-1011 TriStar', 'McDonnell Douglas MD-80', 'Tupolev Tu-144', 'De Havilland Comet', 'Fokker F27', 'ATR 72', 'Embraer 190', 'Bombardier CRJ200', 'Airbus A350', 'Boeing 757', 'Boeing 767'],
    alsoWritten: (n) => [n.replace(/^(Boeing|Airbus|Douglas|McDonnell Douglas|Lockheed|Tupolev|De Havilland|Fokker|Embraer|Bombardier|Ilyushin|Antonov|Saab|Dornier|BAe|British Aerospace|Vickers) /, '')].filter((x) => x !== n && x.length >= 2),
  }),

  // ================================================================ Places: rivers, lakes, islands, mountains
  IN('Places', 'places-river-united-states', 'river', 'Q30', 'the United States', 'Q4022', 3, ['Mississippi River', 'Missouri River', 'Colorado River', 'Columbia River', 'Ohio River', 'Rio Grande', 'Hudson River', 'Potomac River', 'Yukon River', 'Snake River', 'Tennessee River', 'Arkansas River'], { alsoWritten: strip(/ River$/i) }),
  IN('Places', 'places-river-china', 'river', 'Q148', 'China', 'Q4022', 3, ['Yangtze', 'Yellow River', 'Pearl River', 'Mekong', 'Huai River', 'Han River', 'Amur', 'Yarlung Tsangpo', 'Liao River', 'Hai River', 'Wei River', 'Min River'], { alsoWritten: strip(/ River$/i) }),
  IN('Places', 'places-river-india', 'river', 'Q668', 'India', 'Q4022', 3, ['Ganges', 'Yamuna', 'Brahmaputra', 'Indus River', 'Godavari River', 'Krishna River', 'Narmada River', 'Kaveri', 'Mahanadi', 'Sutlej', 'Chambal River', 'Tapti River'], { alsoWritten: strip(/ River$/i) }),
  IN('Places', 'places-river-russia', 'river', 'Q159', 'Russia', 'Q4022', 8, ['Volga', 'Lena', 'Ob River', 'Yenisei', 'Amur', 'Don', 'Neva', 'Kama', 'Oka', 'Irtysh', 'Angara', 'Ural River'], { alsoWritten: strip(/ River$/i), pattern: '?item wdt:P31/wdt:P279* wd:Q4022 . ?item wdt:P17 wd:Q159 . ?item wikibase:sitelinks ?slx . FILTER(?slx >= 3)' }),
  IN('Places', 'places-river-brazil', 'river', 'Q155', 'Brazil', 'Q4022', 2, ['Amazon River', 'Paraná River', 'São Francisco River', 'Tocantins River', 'Madeira River', 'Rio Negro', 'Tapajós', 'Xingu River', 'Paraguay River', 'Araguaia River', 'Uruguay River', 'Juruá River'], { alsoWritten: strip(/ River$/i) }),
  IN('Places', 'places-river-canada', 'river', 'Q16', 'Canada', 'Q4022', 2, ['St. Lawrence River', 'Mackenzie River', 'Fraser River', 'Yukon River', 'Ottawa River', 'Saskatchewan River', 'Columbia River', 'Nelson River', 'Churchill River', 'Red River', 'Peace River', 'Athabasca River'], { alsoWritten: strip(/ River$/i) }),
  IN('Places', 'places-river-france', 'river', 'Q142', 'France', 'Q4022', 2, ['Seine', 'Loire', 'Rhône', 'Garonne', 'Marne', 'Dordogne', 'Somme', 'Saône', 'Rhine', 'Meuse', 'Moselle', 'Charente'], { alsoWritten: strip(/ River$/i) }),
  IN('Places', 'places-river-germany', 'river', 'Q183', 'Germany', 'Q4022', 2, ['Rhine', 'Danube', 'Elbe', 'Main', 'Weser', 'Oder', 'Moselle', 'Neckar', 'Spree', 'Ruhr', 'Isar', 'Saale'], { alsoWritten: strip(/ River$/i) }),
  IN('Places', 'places-lake-united-states', 'lake', 'Q30', 'the United States', 'Q23397', 3, ['Lake Michigan', 'Lake Superior', 'Lake Huron', 'Lake Erie', 'Lake Ontario', 'Great Salt Lake', 'Lake Tahoe', 'Lake Okeechobee', 'Lake Champlain', 'Crater Lake', 'Lake Powell', 'Lake Mead'], { alsoWritten: (n) => [n.replace(/^Lake /i, ''), n.replace(/ Lake$/i, '')].filter((x) => x !== n && x.length >= 3) }),
  IN('Places', 'places-lake-canada', 'lake', 'Q16', 'Canada', 'Q23397', 4, ['Great Bear Lake', 'Great Slave Lake', 'Lake Winnipeg', 'Lake Louise', 'Lake Athabasca', 'Lake Nipigon', 'Lake of the Woods', 'Lake Manitoba', 'Moraine Lake', 'Lake Simcoe', 'Reindeer Lake', 'Lake Abitibi'], { alsoWritten: (n) => [n.replace(/^Lake /i, ''), n.replace(/ Lake$/i, '')].filter((x) => x !== n && x.length >= 3) }),
  IN('Places', 'places-island-greece', 'island', 'Q41', 'Greece', 'Q23442', 2, ['Crete', 'Rhodes', 'Corfu', 'Santorini', 'Mykonos', 'Lesbos', 'Kos', 'Naxos', 'Zakynthos', 'Samos', 'Chios', 'Paros']),
  IN('Places', 'places-island-japan', 'island', 'Q17', 'Japan', 'Q23442', 2, ['Honshu', 'Hokkaido', 'Kyushu', 'Shikoku', 'Okinawa Island', 'Sado Island', 'Awaji Island', 'Miyako-jima', 'Ishigaki Island', 'Iriomote Island', 'Yakushima', 'Tanegashima']),
  IN('Places', 'places-island-philippines', 'island', 'Q928', 'the Philippines', 'Q23442', 2, ['Luzon', 'Mindanao', 'Cebu', 'Palawan', 'Boracay', 'Bohol', 'Leyte', 'Samar', 'Mindoro', 'Negros', 'Panay', 'Siargao']),
  IN('Places', 'places-island-indonesia', 'island', 'Q252', 'Indonesia', 'Q23442', 2, ['Java', 'Sumatra', 'Borneo', 'Sulawesi', 'Bali', 'Lombok', 'Flores', 'Timor', 'New Guinea', 'Komodo', 'Sumba', 'Halmahera']),
  IN('Places', 'places-mountain-switzerland', 'mountain', 'Q39', 'Switzerland', 'Q8502', 3, ['Matterhorn', 'Eiger', 'Jungfrau', 'Mönch', 'Piz Bernina', 'Dufourspitze', 'Weisshorn', 'Dom', 'Piz Palü', 'Titlis', 'Rigi', 'Säntis']),
  IN('Places', 'places-mountain-japan', 'mountain', 'Q17', 'Japan', 'Q8502', 3, ['Mount Fuji', 'Mount Hotaka', 'Mount Tate', 'Mount Yari', 'Mount Ontake', 'Mount Aso', 'Mount Asama', 'Mount Hakusan', 'Mount Kita', 'Mount Haku', 'Mount Tsurugi', 'Mount Rishiri']),
  IN('Places', 'places-mountain-united-states', 'mountain', 'Q30', 'the United States', 'Q8502', 3, ['Denali', 'Mount Whitney', 'Mount Rainier', 'Pikes Peak', 'Mount St. Helens', 'Mount Elbert', 'Mount Mitchell', 'Mount Hood', 'Grand Teton', 'Mount Washington', 'Mount Shasta', 'Mount Rushmore']),
  CITY('vietnam', 'Vietnam', 'Q881', 2, ['Hanoi', 'Ho Chi Minh City', 'Da Nang', 'Hue', 'Hai Phong', 'Nha Trang', 'Can Tho', 'Da Lat', 'Hoi An', 'Vung Tau', 'Haiphong', 'Sa Pa']),
  CITY('malaysia', 'Malaysia', 'Q833', 2, ['Kuala Lumpur', 'George Town', 'Johor Bahru', 'Ipoh', 'Malacca City', 'Kota Kinabalu', 'Kuching', 'Shah Alam', 'Petaling Jaya', 'Putrajaya', 'Kuantan', 'Seremban']),
  CITY('pakistan', 'Pakistan', 'Q843', 2, ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Peshawar', 'Quetta', 'Multan', 'Hyderabad', 'Sialkot', 'Gujranwala', 'Abbottabad']),
  CITY('iran', 'Iran', 'Q794', 2, ['Tehran', 'Isfahan', 'Shiraz', 'Mashhad', 'Tabriz', 'Yazd', 'Qom', 'Ahvaz', 'Kerman', 'Rasht', 'Hamadan', 'Persepolis']),
  CITY('nigeria', 'Nigeria', 'Q1033', 2, ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin City', 'Kaduna', 'Enugu', 'Jos', 'Maiduguri', 'Calabar', 'Ilorin']),
  CITY('sweden', 'Sweden', 'Q34', 3, ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås', 'Örebro', 'Linköping', 'Helsingborg', 'Lund', 'Umeå', 'Kiruna', 'Visby']),
  CITY('switzerland', 'Switzerland', 'Q39', 3, ['Zürich', 'Geneva', 'Basel', 'Bern', 'Lausanne', 'Lucerne', 'St. Gallen', 'Lugano', 'Winterthur', 'Zermatt', 'Interlaken', 'Davos']),
  CITY('greece', 'Greece', 'Q41', 3, ['Athens', 'Thessaloniki', 'Patras', 'Heraklion', 'Larissa', 'Volos', 'Rhodes', 'Ioannina', 'Corinth', 'Sparta', 'Chania', 'Kalamata']),
]
