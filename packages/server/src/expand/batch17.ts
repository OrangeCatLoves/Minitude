/**
 * Batch 17: Transport & Vehicles and Places, for the 250 questions the owner asked for on 18 Nov 2026 (docs/GROWTH_TO_1000.md: Transport is the thinnest category).
 * Build with: npx tsx src/expand/newq.ts --batch batch17 --out C:/Users/weibi/minitude/list-build/batch17
 */
import type { NewQuestion } from './newq'
import { mk } from './batch8'
import { anyOf, nameIs, strip } from './recipes'

const TR = 'Transport & Vehicles'
const an = (w: string): string => (/^[aeiou]/i.test(w) ? 'an' : 'a')

/** a car model made by a brand (one or more Wikidata ids of the maker and its brand) */
export const CAR = (id: string, brand: string, makers: string[], mustHave: string[], minSignal = 4, extra: Partial<NewQuestion> = {}): NewQuestion =>
  mk(TR, {
    id: `transport-${id}-model`, prompt: `Name ${an(brand)} ${brand} car model.`,
    what: `any ${brand} car, SUV, van or sports car model, past or present, written with or without the brand name`,
    not: 'Concept cars, engines, and models of other brands do not count.',
    source: `Wikidata automobile models whose manufacturer is ${brand}, known in at least ${minSignal} languages.`,
    pattern: `?item wdt:P31/wdt:P279* wd:Q3231690 . { VALUES ?mk { ${makers.map((m) => 'wd:' + m).join(' ')} } ?item wdt:P176 ?mk } UNION { ?item rdfs:label ?bl . FILTER(LANG(?bl) = "en" && STRSTARTS(?bl, "${brand} ")) } .`,
    minSignal, mustHave,
    alsoWritten: strip(new RegExp('^' + brand.replace(/[-.]/g, '\\$&') + ' ')),
    skip: anyOf(nameIs(/concept|prototype/i), nameIs(new RegExp('^(?!' + brand.replace(/[-.]/g, '\\$&') + ')'))),
    ...extra,
  })

/** a city or large town of a country */
export const CITY = (id: string, name: string, country: string, minSignal: number, mustHave: string[], extra: Partial<NewQuestion> = {}): NewQuestion =>
  mk('Places', {
    id: `places-city-${id}`, prompt: `Name a city in ${name}.`,
    what: `any city or large town in ${name}, of any size`,
    not: 'Regions, provinces, villages and neighbourhoods do not count.',
    source: `Wikidata cities and towns of ${name}, known in at least ${minSignal} languages.`,
    pattern: `?item wdt:P31/wdt:P279* wd:Q515 . ?item wdt:P17 wd:${country} .`,
    minSignal, mustHave, ...extra,
  })

export const BATCH: NewQuestion[] = [
  // ================================================================ Transport: car models by brand
  CAR('toyota', 'Toyota', ['Q53268'], ['Toyota Corolla', 'Toyota Camry', 'Toyota Prius', 'Toyota RAV4', 'Toyota Land Cruiser', 'Toyota Hilux', 'Toyota Yaris', 'Toyota Supra', 'Toyota Tacoma', 'Toyota Highlander', 'Toyota 4Runner', 'Toyota Tundra', 'Toyota Sienna', 'Toyota Avalon', 'Toyota Celica', 'Toyota MR2'], 4, { extras: [{ name: 'Toyota Corolla', signal: 60 }, { name: 'Toyota Camry', signal: 60 }, { name: 'Toyota Prius', signal: 55 }] }),
  CAR('ford', 'Ford', ['Q44294'], ['Ford Mustang', 'Ford Model T', 'Ford F-Series', 'Ford Focus', 'Ford Fiesta', 'Ford Explorer', 'Ford Escort', 'Ford Ranger', 'Ford Bronco', 'Ford Thunderbird', 'Ford Taurus', 'Ford Fusion', 'Ford GT40', 'Ford Transit', 'Ford Capri', 'Ford Cortina']),
  CAR('volkswagen', 'Volkswagen', ['Q246'], ['Volkswagen Golf', 'Volkswagen Beetle', 'Volkswagen Passat', 'Volkswagen Polo', 'Volkswagen Jetta', 'Volkswagen Transporter', 'Volkswagen Tiguan', 'Volkswagen Touareg', 'Volkswagen Scirocco', 'Volkswagen Up', 'Volkswagen Phaeton', 'Volkswagen Arteon', 'Volkswagen Karmann Ghia', 'Volkswagen Type 2', 'Volkswagen ID.3', 'Volkswagen Corrado']),
  CAR('bmw', 'BMW', ['Q26678'], ['BMW 3 Series', 'BMW 5 Series', 'BMW 7 Series', 'BMW X5', 'BMW M3', 'BMW 1 Series', 'BMW Z4', 'BMW i8', 'BMW X3', 'BMW Isetta', 'BMW 2002', 'BMW M5', 'BMW Z3', 'BMW i3', 'BMW X1', 'BMW 507']),
  CAR('mercedes', 'Mercedes-Benz', ['Q36008'], ['Mercedes-Benz S-Class', 'Mercedes-Benz E-Class', 'Mercedes-Benz C-Class', 'Mercedes-Benz G-Class', 'Mercedes-Benz A-Class', 'Mercedes-Benz SL', 'Mercedes-Benz 300 SL', 'Mercedes-Benz SLK', 'Mercedes-Benz CLK', 'Mercedes-Benz GLE', 'Mercedes-Benz Sprinter', 'Mercedes-Benz SLS AMG', 'Mercedes-Benz Vito', 'Mercedes-Benz GLA', 'Mercedes-Benz B-Class']),
  CAR('honda', 'Honda', ['Q9584'], ['Honda Civic', 'Honda Accord', 'Honda CR-V', 'Honda Fit', 'Honda Odyssey', 'Honda Pilot', 'Honda Prelude', 'Honda NSX', 'Honda S2000', 'Honda Element', 'Honda Insight', 'Honda HR-V', 'Honda Ridgeline', 'Honda Integra', 'Honda Jazz', 'Honda Legend']),
  CAR('chevrolet', 'Chevrolet', ['Q29570'], ['Chevrolet Corvette', 'Chevrolet Camaro', 'Chevrolet Impala', 'Chevrolet Silverado', 'Chevrolet Malibu', 'Chevrolet Bel Air', 'Chevrolet Tahoe', 'Chevrolet Suburban', 'Chevrolet Cruze', 'Chevrolet Corvair', 'Chevrolet Chevelle', 'Chevrolet El Camino', 'Chevrolet Blazer', 'Chevrolet Volt', 'Chevrolet Nova', 'Chevrolet Spark']),
  CAR('nissan', 'Nissan', ['Q20165', 'Q1131469'], ['Nissan GT-R', 'Nissan Leaf', 'Nissan Skyline', 'Nissan Micra', 'Nissan Qashqai', 'Nissan Altima', 'Nissan Maxima', 'Nissan Sentra', 'Nissan Patrol', 'Nissan Juke', 'Nissan 350Z', 'Nissan Navara', 'Nissan X-Trail', 'Nissan Silvia', 'Nissan Murano', 'Nissan Pathfinder'], 4, { extras: [{ name: 'Nissan Pathfinder', signal: 25 }] }),
  CAR('porsche', 'Porsche', ['Q40993'], ['Porsche 911', 'Porsche 356', 'Porsche Cayenne', 'Porsche Macan', 'Porsche Boxster', 'Porsche Cayman', 'Porsche Panamera', 'Porsche Taycan', 'Porsche 924', 'Porsche 944', 'Porsche 928', 'Porsche 918 Spyder', 'Porsche Carrera GT', 'Porsche 959', 'Porsche 914', 'Porsche 917'], 3, { extras: [{ name: 'Porsche 911', signal: 90 }] }),
  CAR('audi', 'Audi', ['Q23317'], ['Audi A4', 'Audi A3', 'Audi A6', 'Audi Q5', 'Audi Q7', 'Audi TT', 'Audi R8', 'Audi A8', 'Audi Quattro', 'Audi A1', 'Audi Q3', 'Audi e-tron', 'Audi RS6', 'Audi A5', 'Audi 80', 'Audi 100'], 3, { extras: [{ name: 'Audi A4', signal: 40 }, { name: 'Audi e-tron', signal: 25 }, { name: 'Audi 100', signal: 25 }] }),
  CAR('fiat', 'Fiat', ['Q27597', 'Q940689'], ['Fiat 500', 'Fiat Panda', 'Fiat Punto', 'Fiat Uno', 'Fiat Tipo', 'Fiat 124 Spider', 'Fiat Multipla', 'Fiat Topolino', 'Fiat Bravo', 'Fiat Doblò', 'Fiat Ducato', 'Fiat Cinquecento', 'Fiat Seicento', 'Fiat Stilo', 'Fiat Barchetta', 'Fiat X1/9'], 3),

  // ================================================================ Transport: aircraft, ships, spacecraft, transit
  mk(TR, {
    id: 'transport-boeing-aircraft', prompt: 'Name a Boeing aircraft.', what: 'any aircraft designed or built by Boeing (including the companies it absorbed, such as McDonnell Douglas), airliner, bomber, fighter, helicopter or spacecraft',
    not: 'Aircraft of other makers do not count.',
    source: 'Wikidata aircraft whose manufacturer is Boeing, known in at least 3 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q11436 . { ?item wdt:P176 wd:Q66 } UNION { ?item rdfs:label ?bl . FILTER(LANG(?bl) = "en" && STRSTARTS(?bl, "Boeing ")) } .', minSignal: 3, skip: nameIs(/^(?!Boeing )/),
    mustHave: ['Boeing 747', 'Boeing 737', 'Boeing 777', 'Boeing 787 Dreamliner', 'Boeing 707', 'Boeing 727', 'Boeing 757', 'Boeing 767', 'Boeing B-17 Flying Fortress', 'Boeing B-29 Superfortress', 'Boeing B-52 Stratofortress', 'Boeing 314 Clipper', 'Boeing CH-47 Chinook', 'Boeing AH-64 Apache', 'Boeing 737 MAX', 'Boeing F-15 Eagle'],
    alsoWritten: strip(/^Boeing /),
  }),
  mk(TR, {
    id: 'transport-airbus-aircraft', prompt: 'Name an Airbus aircraft.', what: 'any aircraft designed or built by Airbus, airliner, freighter, military transport or helicopter',
    not: 'Aircraft of other makers do not count.',
    source: 'Wikidata aircraft whose manufacturer is Airbus, known in at least 3 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q11436 . { ?item wdt:P176 wd:Q2311 } UNION { ?item rdfs:label ?bl . FILTER(LANG(?bl) = "en" && STRSTARTS(?bl, "Airbus ")) } .', minSignal: 3, skip: nameIs(/^(?!Airbus )/),
    mustHave: ['Airbus A380', 'Airbus A320', 'Airbus A350', 'Airbus A330', 'Airbus A340', 'Airbus A300', 'Airbus A310', 'Airbus A400M Atlas', 'Airbus Beluga', 'Airbus A321', 'Airbus A319', 'Airbus A220', 'Airbus A318', 'Airbus A321neo', 'Airbus A320neo', 'Airbus H145'],
    alsoWritten: strip(/^Airbus /),
  }),
  mk(TR, {
    id: 'transport-us-navy-ship', prompt: 'Name a ship of the United States Navy.', what: 'any ship of the United States Navy, past or present (a warship, submarine, carrier or auxiliary), written with or without USS and the hull number',
    not: 'Ships of other navies and merchant ships do not count.',
    source: 'Wikidata ships operated by the United States Navy, known in at least 10 languages.',
    pattern: '?item wdt:P137 wd:Q11220 . ?item wdt:P31/wdt:P279* wd:Q11446 .', minSignal: 10,
    mustHave: ['USS Enterprise', 'USS Constitution', 'USS Missouri', 'USS Arizona', 'USS Nautilus', 'USS Intrepid', 'USS Yorktown', 'USS Maine', 'USS Indianapolis', 'USS Texas', 'USS Monitor', 'USS Forrestal', 'USS Nimitz', 'USS Ronald Reagan', 'USS Cole', 'USS Pueblo', 'USS Liberty', 'USS Iowa', 'USS Wasp', 'USS Hornet'],
    alsoWritten: (n) => { const a = n.replace(/\s*\([^)]*\)\s*/g, '').trim(); const b = a.replace(/^USS /, ''); return [a, b].filter((x) => x && x !== n && x.length >= 3) },
  }),
  mk(TR, {
    id: 'transport-royal-navy-ship', prompt: 'Name a ship of the Royal Navy.', what: 'any ship of the Royal Navy, past or present (a warship, submarine, carrier or auxiliary), written with or without HMS',
    not: 'Ships of other navies and merchant ships do not count.',
    source: 'Wikidata ships operated by the Royal Navy, known in at least 10 languages.',
    pattern: '?item wdt:P137 wd:Q172771 . ?item wdt:P31/wdt:P279* wd:Q11446 .', minSignal: 10,
    mustHave: ['HMS Victory', 'HMS Beagle', 'HMS Belfast', 'HMS Hood', 'HMS Dreadnought', 'HMS Warrior', 'HMS Bounty', 'HMS Endeavour', 'HMS Ark Royal', 'HMS Queen Elizabeth', 'HMS Prince of Wales', 'HMS Sheffield', 'HMS Invincible', 'HMS Illustrious', 'HMS Cutty Sark', 'HMS Pinafore'].filter((n) => n !== 'HMS Cutty Sark' && n !== 'HMS Pinafore'),
    alsoWritten: (n) => { const a = n.replace(/\s*\([^)]*\)\s*/g, '').trim(); const b = a.replace(/^HMS /, ''); return [a, b].filter((x) => x && x !== n && x.length >= 3) },
  }),
  mk(TR, {
    id: 'transport-space-probe', prompt: 'Name a space probe.', what: 'any uncrewed space probe, orbiter, lander or flyby mission, from any space agency',
    not: 'Crewed spacecraft, rockets and satellites of Earth do not count.',
    source: 'Wikidata space probes, known in at least 6 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q26529 .', minSignal: 6,
    mustHave: ['Voyager 1', 'Voyager 2', 'Cassini–Huygens', 'New Horizons', 'Pioneer 10', 'Viking 1', 'Mariner 4', 'Juno', 'Galileo', 'Magellan', 'Hayabusa', 'Rosetta', 'MESSENGER', 'Dawn', 'Mars Pathfinder', 'Pioneer 11', 'Venera 7', 'Luna 9', 'Parker Solar Probe', 'OSIRIS-REx'],
  }),
  mk(TR, {
    id: 'transport-space-telescope', prompt: 'Name a space telescope.', what: 'any telescope or observatory placed in space, from any space agency',
    not: 'Ground-based telescopes do not count.',
    source: 'Wikidata space telescopes, known in at least 4 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q148578 .', minSignal: 4,
    mustHave: ['Hubble Space Telescope', 'James Webb Space Telescope', 'Kepler space telescope', 'Spitzer Space Telescope', 'Chandra X-ray Observatory', 'Gaia', 'Transiting Exoplanet Survey Satellite', 'Planck', 'Herschel Space Observatory', 'Compton Gamma Ray Observatory', 'Wide-field Infrared Survey Explorer', 'Fermi Gamma-ray Space Telescope', 'Euclid', 'Neil Gehrels Swift Observatory', 'XMM-Newton', 'Cosmic Background Explorer'],
  }),
  mk(TR, {
    id: 'transport-london-underground-station', prompt: 'Name a London Underground station.', what: 'any station on the London Underground (the Tube), on any line',
    not: 'Overground, DLR, Elizabeth line only stations and mainline stations without Tube platforms do not count.',
    source: 'Wikidata stations of the London Underground.',
    pattern: '?item wdt:P31 wd:Q14562709 .', minSignal: 1,
    mustHave: ['King\'s Cross St Pancras', 'Oxford Circus', 'Piccadilly Circus', 'Waterloo', 'Baker Street', 'Paddington', 'Victoria', 'Euston', 'Liverpool Street', 'Bank', 'Covent Garden', 'Leicester Square', 'Tottenham Court Road', 'Canary Wharf', 'London Bridge', 'Westminster', 'Charing Cross', 'Green Park', 'Camden Town', 'Notting Hill Gate', 'Angel', 'Brixton', 'Stratford', 'Mornington Crescent', 'Cockfosters', 'Bond Street'],
    alsoWritten: (n) => (/ tube station$| Underground station$/i.test(n) ? [n.replace(/ (tube|Underground) station$/i, '').replace(/ \([^)]*\)$/, '')] : []),
    rename: ['King\'s Cross St Pancras', 'Bank', 'Oxford Circus', 'Piccadilly Circus', 'Waterloo', 'Baker Street', 'Paddington', 'Victoria', 'Euston', 'Liverpool Street', 'Covent Garden', 'Leicester Square', 'Tottenham Court Road', 'Canary Wharf', 'London Bridge', 'Westminster', 'Charing Cross', 'Green Park', 'Camden Town', 'Notting Hill Gate', 'Angel', 'Brixton', 'Stratford', 'Mornington Crescent', 'Cockfosters', 'Bond Street'],
  }),
  mk(TR, {
    id: 'transport-singapore-mrt-station', prompt: 'Name an MRT station in Singapore.', what: 'any station of the Singapore Mass Rapid Transit (MRT) network, on any line, open or planned',
    not: 'LRT stations of the Bukit Panjang, Sengkang and Punggol lines and bus interchanges do not count.',
    source: 'Wikidata metro stations in Singapore.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q928830 . ?item wdt:P17 wd:Q334 .', minSignal: 1,
    mustHave: ['Raffles Place', 'City Hall', 'Orchard', 'Dhoby Ghaut', 'Jurong East', 'Changi Airport', 'Bugis', 'Marina Bay', 'Bishan', 'Ang Mo Kio', 'Tampines', 'Woodlands', 'HarbourFront', 'Somerset', 'Clarke Quay', 'Chinatown', 'Little India', 'Paya Lebar', 'Outram Park', 'Serangoon', 'Punggol', 'Sengkang', 'Bedok', 'Clementi', 'Buona Vista', 'Novena', 'Toa Payoh', 'Yishun', 'Pasir Ris', 'Boon Lay'],
    alsoWritten: (n) => (/ MRT station$/i.test(n) ? [n.replace(/ MRT station$/i, '')] : []),
    rename: ['Raffles Place', 'City Hall', 'Orchard', 'Dhoby Ghaut', 'Jurong East', 'Changi Airport', 'Bugis', 'Bishan', 'Ang Mo Kio', 'Tampines', 'Woodlands', 'HarbourFront', 'Somerset', 'Clarke Quay', 'Chinatown', 'Little India', 'Paya Lebar', 'Outram Park', 'Serangoon', 'Punggol', 'Sengkang', 'Bedok', 'Clementi', 'Buona Vista', 'Novena', 'Toa Payoh', 'Yishun', 'Pasir Ris', 'Boon Lay'],
  }),

  // ================================================================ Places: cities of a country
  CITY('japan', 'Japan', 'Q17', 8, ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya', 'Sapporo', 'Kobe', 'Fukuoka', 'Hiroshima', 'Nagasaki', 'Nara', 'Sendai', 'Kawasaki', 'Kanazawa', 'Nikko', 'Naha']),
  CITY('china', 'China', 'Q148', 10, ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hangzhou', 'Xi\'an', 'Wuhan', 'Nanjing', 'Chongqing', 'Tianjin', 'Suzhou', 'Harbin', 'Qingdao', 'Kunming', 'Lhasa']),
  CITY('india', 'India', 'Q668', 8, ['Mumbai', 'Delhi', 'Bangalore', 'Kolkata', 'Chennai', 'Hyderabad', 'Jaipur', 'Agra', 'Pune', 'Ahmedabad', 'Varanasi', 'Lucknow', 'Amritsar', 'Kochi', 'Udaipur', 'Mysore'], { rename: ['Bangalore'] }),
  CITY('germany', 'Germany', 'Q183', 14, ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart', 'Dresden', 'Düsseldorf', 'Leipzig', 'Bremen', 'Nuremberg', 'Hanover', 'Heidelberg', 'Bonn', 'Aachen', 'Potsdam']),
  CITY('france', 'France', 'Q142', 14, ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Bordeaux', 'Lille', 'Montpellier', 'Cannes', 'Reims', 'Rennes', 'Avignon', 'Dijon', 'Versailles']),
  CITY('italy', 'Italy', 'Q38', 14, ['Rome', 'Milan', 'Naples', 'Turin', 'Florence', 'Venice', 'Bologna', 'Genoa', 'Palermo', 'Verona', 'Pisa', 'Siena', 'Bari', 'Catania', 'Padua', 'Parma']),
  CITY('spain', 'Spain', 'Q29', 12, ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Bilbao', 'Granada', 'Toledo', 'Córdoba', 'San Sebastián', 'Salamanca', 'Pamplona', 'Alicante', 'Palma', 'Santiago de Compostela']),
  CITY('uk', 'the United Kingdom', 'Q145', 12, ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Edinburgh', 'Glasgow', 'Bristol', 'Leeds', 'Cardiff', 'Oxford', 'Cambridge', 'Newcastle upon Tyne', 'Sheffield', 'Bath', 'York', 'Belfast']),
  CITY('brazil', 'Brazil', 'Q155', 8, ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre', 'Belém', 'Santos', 'Florianópolis', 'Natal', 'Goiânia', 'Campinas']),
  CITY('russia', 'Russia', 'Q159', 12, ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan', 'Nizhny Novgorod', 'Vladivostok', 'Sochi', 'Volgograd', 'Samara', 'Omsk', 'Krasnoyarsk', 'Irkutsk', 'Murmansk', 'Kaliningrad', 'Rostov-on-Don']),
  CITY('usa', 'the United States', 'Q30', 20, ['New York City', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Francisco', 'Seattle', 'Boston', 'Miami', 'Las Vegas', 'Washington, D.C.', 'New Orleans', 'Atlanta', 'Denver', 'Detroit', 'Austin']),
  CITY('canada', 'Canada', 'Q16', 8, ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Halifax', 'Victoria', 'Saskatoon', 'Regina', 'Hamilton', 'Kitchener', 'London', 'Niagara Falls']),
  CITY('australia', 'Australia', 'Q408', 6, ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Gold Coast', 'Newcastle', 'Hobart', 'Darwin', 'Cairns', 'Wollongong', 'Geelong', 'Townsville', 'Alice Springs', 'Ballarat']),
  CITY('mexico', 'Mexico', 'Q96', 8, ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'Cancún', 'Mérida', 'Acapulco', 'Oaxaca', 'León', 'Veracruz', 'Querétaro', 'Chihuahua', 'Ciudad Juárez', 'Cabo San Lucas', 'Guanajuato'], { rename: ['Acapulco', 'León', 'Querétaro', 'Chihuahua'] }),
]
