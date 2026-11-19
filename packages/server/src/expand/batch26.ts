/**
 * Batch 26: Games and Sports, for the last 228 questions towards 1,000 that the owner asked for on 18 Nov 2026 (docs/GROWTH_TO_1000.md).
 * A spread: video games by developer and by platform, footballers of nine countries, football clubs of ten countries, cricketers of four countries.
 * Build with: npx tsx src/expand/newq.ts --batch batch26 --out C:/Users/weibi/minitude/list-build/batch26
 */
import type { NewQuestion } from './newq'
import { mk } from './batch8'
import { P } from './batch14'
import { describedAs } from './nationality'
import { HUMAN, nameIs, occupation, personForms } from './recipes'

const an = (w: string): string => (/^[aeiou]/i.test(w) ? 'an' : 'a')
const VIDEO_GAME = '?item wdt:P31/wdt:P279* wd:Q7889 .'

/** a video game made or published by a company */
const BY = (id: string, company: string, ids: string[], minSignal: number, mustHave: string[]): NewQuestion =>
  mk('Games', {
    id: `games-by-${id}`, prompt: `Name ${an(company)} ${company} game.`, what: `any video game developed or published by ${company}, past or present, on any platform`,
    not: 'Board games and games of other companies do not count.',
    source: `Wikidata video games whose developer or publisher is ${company}, known in at least ${minSignal} languages.`,
    pattern: `${VIDEO_GAME} VALUES ?d { ${ids.map((i) => 'wd:' + i).join(' ')} } { ?item wdt:P178 ?d } UNION { ?item wdt:P123 ?d } .`, minSignal, mustHave,
    // games that a company only published in Japan (a regional publisher credit in Wikidata) are not that company's games
    skip: nameIs(id === 'electronic-arts' ? /^(Grand Theft Auto|Call of Duty|Cyberpunk|The Witcher|Super Smash Bros|Age of Empires|Sonic the Hedgehog)/i : /^(Grand Theft Auto|Call of Duty|Cyberpunk|The Witcher|Super Smash Bros|Age of Empires|Sonic the Hedgehog|Mass Effect)/i),
  })

/** a video game released for a platform */
const ON_PLATFORM = (id: string, name: string, platforms: string[], minSignal: number, mustHave: string[]): NewQuestion =>
  mk('Games', {
    id: `games-${id}-game`, prompt: `Name ${an(name)} ${name} game.`, what: `any video game released for ${name}, including games that also came out on other platforms`,
    not: 'Board games, films and consoles do not count.',
    source: `Wikidata video games released for the platform, known in at least ${minSignal} languages.`,
    pattern: `${VIDEO_GAME} ?item wdt:P400 ?plt . VALUES ?plt { ${platforms.map((p) => 'wd:' + p).join(' ')} }`, minSignal, mustHave,
  })

/** sports people of a nationality (one or more countries of citizenship) */
const NATION = (slug: string, adj: string, noun: string, countries: string[], occ: string, desc: RegExp, min: number, names: string[]): NewQuestion =>
  P('Sports', slug, `${an(adj)} ${adj} ${noun}`, `any ${noun} who was a citizen of ${adj === 'English' ? 'England or the United Kingdom' : adj}, of any era`, occ, describedAs(adj, desc), min, names,
    { pattern: `${occupation(occ)} ${HUMAN} VALUES ?c { ${countries.map((c) => 'wd:' + c).join(' ')} } ?item wdt:P27 ?c .` })

/** football clubs of a country */
const CLUBS = (id: string, adj: string, country: string, minSignal: number, mustHave: string[]): NewQuestion =>
  mk('Sports', {
    id: `sports-football-club-${id}`, prompt: `Name ${an(adj)} ${adj} football club.`, what: `any association football (soccer) club of ${adj === 'British' ? 'the United Kingdom (England, Scotland, Wales or Northern Ireland)' : adj === 'Dutch' ? 'the Netherlands' : adj === 'Spanish' ? 'Spain' : adj === 'Italian' ? 'Italy' : adj === 'German' ? 'Germany' : adj === 'French' ? 'France' : adj === 'Brazilian' ? 'Brazil' : adj === 'Argentine' ? 'Argentina' : adj === 'Portuguese' ? 'Portugal' : 'Turkey'}, of any division, past or present`,
    not: 'Clubs of other countries and national teams do not count.',
    source: `Wikidata association football clubs of the country, known in at least ${minSignal} languages.`,
    pattern: `?item wdt:P31/wdt:P279* wd:Q476028 . ?item wdt:P17 wd:${country} .`, minSignal, mustHave, rename: mustHave, skip: nameIs(/national (association )?football team|national team/i),
    alsoWritten: (n) => [n.replace(/ (F\.?C\.?|A\.?F\.?C\.?|C\.?F\.?|S\.?C\.?|A\.?C\.?|A\.?S\.?)$/i, '').replace(/^(FC|AC|AS|SC|SV|VfB|VfL|TSG|RB|CD|UD|Real) /, (m) => (m === 'Real ' ? m : ''))].filter((x) => x !== n && x.length >= 3),
  })

export const BATCH: NewQuestion[] = [
  // ================================================================ Games
  BY('capcom', 'Capcom', ['Q14428'], 4, ['Resident Evil', 'Street Fighter II', 'Mega Man', 'Monster Hunter', 'Devil May Cry', 'Phoenix Wright: Ace Attorney', 'Dead Rising', 'Okami', 'Ghosts \'n Goblins', 'Final Fight', 'Dragon\'s Dogma', 'Resident Evil 4', 'Street Fighter V', 'Mega Man X']),
  BY('konami', 'Konami', ['Q45700'], 4, ['Metal Gear Solid', 'Castlevania', 'Contra', 'Silent Hill', 'Pro Evolution Soccer', 'Gradius', 'Dance Dance Revolution', 'Frogger', 'Suikoden', 'Bomberman', 'Track & Field', 'Metal Gear Solid 3: Snake Eater', 'Silent Hill 2', 'Teenage Mutant Ninja Turtles']),
  BY('square-enix', 'Square Enix', ['Q207784'], 4, ['Final Fantasy VII', 'Dragon Quest', 'Kingdom Hearts', 'Chrono Trigger', 'Nier: Automata', 'Tomb Raider', 'Final Fantasy X', 'Secret of Mana', 'Life Is Strange', 'Octopath Traveler', 'Deus Ex', 'Parasite Eve', 'Final Fantasy XIV', 'Dragon Quest XI']),
  BY('electronic-arts', 'Electronic Arts', ['Q173941'], 5, ['The Sims', 'Madden NFL', 'Battlefield 1', 'Need for Speed', 'Mass Effect', 'Dead Space', 'Apex Legends', 'Plants vs. Zombies', 'Command & Conquer', 'SimCity', 'Burnout', 'FIFA 23', 'Medal of Honor', 'Titanfall 2']),
  BY('bandai-namco', 'Bandai Namco', ['Q1194689', 'Q309996'], 4, ['Pac-Man', 'Tekken', 'Dark Souls', 'Tales of Symphonia', 'Ace Combat', 'Soulcalibur', 'Dragon Ball FighterZ', 'Katamari Damacy', 'Naruto: Ultimate Ninja', 'Galaga', 'Dig Dug', 'Elden Ring', 'Tekken 3', 'Ridge Racer']),
  BY('bethesda', 'Bethesda', ['Q684425'], 3, ['The Elder Scrolls V: Skyrim', 'Fallout 4', 'Fallout 3', 'The Elder Scrolls IV: Oblivion', 'The Elder Scrolls III: Morrowind', 'Doom', 'Dishonored', 'Wolfenstein', 'Starfield', 'Fallout: New Vegas', 'Prey', 'The Evil Within']),
  BY('snk', 'SNK', ['Q1044563'], 3, ['The King of Fighters \'98', 'Metal Slug', 'Fatal Fury', 'Samurai Shodown', 'Art of Fighting', 'The King of Fighters XV', 'Garou: Mark of the Wolves', 'Ikari Warriors', 'Last Blade', 'Neo Geo Cup \'98', 'Baseball Stars', 'Athena']),
  BY('taito', 'Taito', ['Q1054844'], 3, ['Space Invaders', 'Bubble Bobble', 'Arkanoid', 'Rastan', 'The NewZealand Story', 'Darius', 'Puzzle Bobble', 'Elevator Action', 'Chase H.Q.', 'Operation Wolf', 'Rainbow Islands', 'Qix']),
  BY('fromsoftware', 'FromSoftware', ['Q2414469'], 3, ['Dark Souls', 'Elden Ring', 'Bloodborne', 'Sekiro: Shadows Die Twice', 'Armored Core', 'Demon\'s Souls', 'King\'s Field', 'Dark Souls III', 'Dark Souls II', 'Armored Core VI: Fires of Rubicon', 'Tenchu', 'Otogi']),
  ON_PLATFORM('apple-ii', 'Apple II', ['Q3017175'], 3, ['Oregon Trail', 'Lode Runner', 'Prince of Persia', 'Karateka', 'Choplifter', 'Zork', 'Wizardry', 'Ultima III', 'Bard\'s Tale', 'Castle Wolfenstein', 'Pitfall!', 'Rescue Raiders']),
  ON_PLATFORM('atari-st', 'Atari ST', ['Q627302'], 3, ['Dungeon Master', 'Populous', 'Speedball 2', 'Xenon 2: Megablast', 'Carrier Command', 'Sentinel', 'Lemmings', 'Elite', 'Falcon', 'Starglider', 'Rocket Ranger', 'Defender of the Crown']),
  ON_PLATFORM('windows', 'Windows', ['Q1406'], 40, ['Half-Life 2', 'The Sims', 'Counter-Strike', 'Minecraft', 'World of Warcraft', 'StarCraft', 'Diablo II', 'Age of Empires II', 'Civilization V', 'The Witcher 3: Wild Hunt', 'Portal 2', 'Skyrim', 'Fallout: New Vegas', 'Doom']),
  ON_PLATFORM('macos', 'macOS', ['Q14116'], 12, ['Civilization VI', 'World of Warcraft', 'Minecraft', 'Portal', 'Cities: Skylines', 'Stardew Valley', 'Tomb Raider', 'XCOM: Enemy Unknown', 'Borderlands 2', 'Bioshock Infinite', 'Fortnite', 'The Sims 4']),
  mk('Games', {
    id: 'games-third-person-shooter', prompt: 'Name a third-person shooter.', what: 'any third-person shooter video game',
    not: 'First-person shooters and board games do not count.',
    source: 'Wikidata third-person shooter video games, known in at least 6 languages.',
    pattern: `${VIDEO_GAME} ?item wdt:P136 wd:Q380266 .`, minSignal: 6,
    mustHave: ['Gears of War', 'Uncharted 4: A Thief\'s End', 'Max Payne', 'Resident Evil 4', 'Tomb Raider', 'The Last of Us', 'Mass Effect', 'Splatoon', 'Fortnite', 'Dead Space', 'Control', 'Vanquish', 'Tom Clancy\'s Ghost Recon', 'Mass Effect 3', 'Alan Wake', 'Star Wars Battlefront II'],
  }),

  // ================================================================ Sports: footballers by nationality
  NATION('english-footballer', 'English', 'footballer', ['Q145', 'Q21'], 'Q937857', /footballer|soccer/i, 15, ['David Beckham', 'Wayne Rooney', 'Harry Kane', 'Steven Gerrard', 'Bobby Charlton', 'Bobby Moore', 'Gary Lineker', 'Michael Owen', 'Paul Gascoigne', 'Frank Lampard', 'Alan Shearer', 'Gareth Southgate', 'Jude Bellingham', 'Raheem Sterling', 'Marcus Rashford', 'Jack Grealish']),
  NATION('brazilian-footballer', 'Brazilian', 'footballer', ['Q155'], 'Q937857', /footballer|soccer/i, 12, ['Pelé', 'Ronaldo', 'Ronaldinho', 'Neymar', 'Kaká', 'Rivaldo', 'Romário', 'Zico', 'Garrincha', 'Sócrates', 'Roberto Carlos', 'Cafu', 'Dani Alves', 'Vinícius Júnior', 'Rodrygo', 'Casemiro']),
  NATION('german-footballer', 'German', 'footballer', ['Q183'], 'Q937857', /footballer|soccer/i, 12, ['Franz Beckenbauer', 'Gerd Müller', 'Lothar Matthäus', 'Miroslav Klose', 'Philipp Lahm', 'Manuel Neuer', 'Thomas Müller', 'Toni Kroos', 'Mesut Özil', 'Bastian Schweinsteiger', 'Michael Ballack', 'Oliver Kahn', 'Jürgen Klinsmann', 'Kai Havertz', 'Jamal Musiala', 'Joshua Kimmich']),
  NATION('italian-footballer', 'Italian', 'footballer', ['Q38'], 'Q937857', /footballer|soccer/i, 12, ['Paolo Maldini', 'Roberto Baggio', 'Francesco Totti', 'Alessandro Del Piero', 'Andrea Pirlo', 'Gianluigi Buffon', 'Fabio Cannavaro', 'Franco Baresi', 'Paolo Rossi', 'Giorgio Chiellini', 'Gianni Rivera', 'Dino Zoff', 'Alessandro Nesta', 'Mario Balotelli', 'Federico Chiesa', 'Gianluigi Donnarumma']),
  NATION('spanish-footballer', 'Spanish', 'footballer', ['Q29'], 'Q937857', /footballer|soccer/i, 12, ['Xavi', 'Andrés Iniesta', 'Iker Casillas', 'Sergio Ramos', 'Raúl', 'Carles Puyol', 'Fernando Torres', 'David Villa', 'Gerard Piqué', 'Sergio Busquets', 'Pedri', 'Rodri', 'Lamine Yamal', 'Álvaro Morata', 'Xabi Alonso', 'David Silva']),
  NATION('french-footballer', 'French', 'footballer', ['Q142'], 'Q937857', /footballer|soccer/i, 12, ['Zinedine Zidane', 'Thierry Henry', 'Michel Platini', 'Kylian Mbappé', 'Antoine Griezmann', 'Karim Benzema', 'Paul Pogba', 'Didier Deschamps', 'N\'Golo Kanté', 'Patrick Vieira', 'Franck Ribéry', 'Just Fontaine', 'Raymond Kopa', 'Eric Cantona', 'Hugo Lloris', 'Olivier Giroud']),
  NATION('argentine-footballer', 'Argentine', 'footballer', ['Q414'], 'Q937857', /footballer|soccer/i, 12, ['Lionel Messi', 'Diego Maradona', 'Gabriel Batistuta', 'Mario Kempes', 'Javier Zanetti', 'Sergio Agüero', 'Ángel Di María', 'Juan Román Riquelme', 'Carlos Tevez', 'Hernán Crespo', 'Paulo Dybala', 'Julián Álvarez', 'Emiliano Martínez', 'Alfredo Di Stéfano', 'Ariel Ortega', 'Gonzalo Higuaín']),
  NATION('dutch-footballer', 'Dutch', 'footballer', ['Q55', 'Q29999'], 'Q937857', /footballer|soccer/i, 12, ['Johan Cruyff', 'Marco van Basten', 'Ruud Gullit', 'Dennis Bergkamp', 'Frank Rijkaard', 'Arjen Robben', 'Wesley Sneijder', 'Robin van Persie', 'Virgil van Dijk', 'Edgar Davids', 'Clarence Seedorf', 'Ronald Koeman', 'Patrick Kluivert', 'Frenkie de Jong', 'Memphis Depay', 'Johan Neeskens']),
  NATION('portuguese-footballer', 'Portuguese', 'footballer', ['Q45'], 'Q937857', /footballer|soccer/i, 10, ['Cristiano Ronaldo', 'Eusébio', 'Luís Figo', 'Rui Costa', 'Pepe', 'Bruno Fernandes', 'João Félix', 'Rúben Dias', 'Bernardo Silva', 'Nani', 'Deco', 'Paulo Futre', 'Ricardo Carvalho', 'Rui Patrício', 'Diogo Jota', 'Rafael Leão']),

  // ================================================================ Sports: cricketers by nationality
  NATION('indian-cricketer', 'Indian', 'cricketer', ['Q668'], 'Q12299841', /cricketer/i, 10, ['Sachin Tendulkar', 'Virat Kohli', 'MS Dhoni', 'Kapil Dev', 'Rahul Dravid', 'Sourav Ganguly', 'Sunil Gavaskar', 'Rohit Sharma', 'Anil Kumble', 'Virender Sehwag', 'Jasprit Bumrah', 'Yuvraj Singh']),
  NATION('australian-cricketer', 'Australian', 'cricketer', ['Q408'], 'Q12299841', /cricketer/i, 8, ['Don Bradman', 'Shane Warne', 'Ricky Ponting', 'Steve Smith', 'Glenn McGrath', 'Adam Gilchrist', 'Allan Border', 'Steve Waugh', 'Mark Waugh', 'David Warner', 'Pat Cummins', 'Brett Lee']),
  NATION('english-cricketer', 'English', 'cricketer', ['Q145', 'Q21'], 'Q12299841', /cricketer/i, 8, ['Ian Botham', 'Joe Root', 'Ben Stokes', 'Alastair Cook', 'Andrew Flintoff', 'Kevin Pietersen', 'James Anderson', 'Geoffrey Boycott', 'W. G. Grace', 'Michael Vaughan', 'Graham Gooch', 'David Gower']),
  NATION('pakistani-cricketer', 'Pakistani', 'cricketer', ['Q843'], 'Q12299841', /cricketer/i, 6, ['Imran Khan', 'Wasim Akram', 'Javed Miandad', 'Shoaib Akhtar', 'Babar Azam', 'Inzamam-ul-Haq', 'Waqar Younis', 'Shahid Afridi', 'Younis Khan', 'Abdul Qadir', 'Saeed Anwar', 'Mohammad Yousuf']),

  // ================================================================ Sports: football clubs by country
  CLUBS('british', 'British', 'Q145', 6, ['Manchester United', 'Liverpool', 'Arsenal', 'Chelsea', 'Manchester City', 'Tottenham Hotspur', 'Celtic', 'Rangers', 'Everton', 'Leeds United', 'Newcastle United', 'West Ham United', 'Aston Villa', 'Leicester City']),
  CLUBS('spanish', 'Spanish', 'Q29', 4, ['Real Madrid', 'FC Barcelona', 'Atlético Madrid', 'Sevilla', 'Valencia', 'Athletic Bilbao', 'Real Sociedad', 'Villarreal', 'Real Betis', 'Celta Vigo', 'Getafe', 'Espanyol']),
  CLUBS('italian', 'Italian', 'Q38', 4, ['Juventus', 'AC Milan', 'Inter Milan', 'AS Roma', 'Napoli', 'Lazio', 'Fiorentina', 'Atalanta', 'Torino', 'Sampdoria', 'Genoa', 'Parma']),
  CLUBS('german', 'German', 'Q183', 4, ['Bayern Munich', 'Borussia Dortmund', 'Schalke 04', 'Bayer Leverkusen', 'RB Leipzig', 'Werder Bremen', 'Hamburger SV', 'VfB Stuttgart', 'Eintracht Frankfurt', 'Borussia Mönchengladbach', 'Hertha BSC', 'VfL Wolfsburg']),
  CLUBS('french', 'French', 'Q142', 4, ['Paris Saint-Germain', 'Olympique de Marseille', 'Olympique Lyonnais', 'AS Monaco', 'Lille', 'AS Saint-Étienne', 'FC Nantes', 'Bordeaux', 'OGC Nice', 'Stade Rennais', 'RC Lens', 'Montpellier']),
  CLUBS('brazilian', 'Brazilian', 'Q155', 3, ['Flamengo', 'Palmeiras', 'Corinthians', 'São Paulo', 'Santos', 'Grêmio', 'Cruzeiro', 'Vasco da Gama', 'Fluminense', 'Internacional', 'Botafogo', 'Atlético Mineiro']),
  CLUBS('argentine', 'Argentine', 'Q414', 3, ['Boca Juniors', 'River Plate', 'Independiente', 'Racing Club', 'San Lorenzo', 'Estudiantes de La Plata', 'Newell\'s Old Boys', 'Vélez Sarsfield', 'Rosario Central', 'Lanús', 'Argentinos Juniors', 'Huracán']),
  CLUBS('dutch', 'Dutch', 'Q55', 3, ['Ajax', 'PSV Eindhoven', 'Feyenoord', 'AZ Alkmaar', 'FC Utrecht', 'FC Twente', 'Vitesse', 'SC Heerenveen', 'Willem II', 'NEC Nijmegen', 'FC Groningen', 'Sparta Rotterdam']),
  CLUBS('portuguese', 'Portuguese', 'Q45', 3, ['Benfica', 'FC Porto', 'Sporting CP', 'Braga', 'Vitória de Guimarães', 'Boavista', 'Belenenses', 'Rio Ave', 'Marítimo', 'Famalicão']),
  CLUBS('turkish', 'Turkish', 'Q43', 3, ['Galatasaray', 'Fenerbahçe', 'Beşiktaş', 'Trabzonspor', 'İstanbul Başakşehir', 'Bursaspor', 'Konyaspor', 'Antalyaspor', 'Kasımpaşa', 'Sivasspor']),
]
