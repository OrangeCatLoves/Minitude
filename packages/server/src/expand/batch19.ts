/**
 * Batch 19: Games and Movies & TV, for the 250 questions the owner asked for on 18 Nov 2026 (docs/GROWTH_TO_1000.md).
 * Build with: npx tsx src/expand/newq.ts --batch batch19 --out C:/Users/weibi/minitude/list-build/batch19
 */
import type { NewQuestion } from './newq'
import { ON } from './batch6'
import { mk } from './batch8'
import { kindOf } from './recipes'

const an = (w: string): string => (/^[aeiou]/i.test(w) ? 'an' : 'a')
const VIDEO_GAME = '?item wdt:P31/wdt:P279* wd:Q7889 .'

/** a video game released for a platform */
const GAME = (id: string, name: string, platforms: string[], minSignal: number, mustHave: string[], article = 'the'): NewQuestion =>
  mk('Games', {
    id: `games-${id}-game`, prompt: `Name ${an(name)} ${name} game.`, what: `any video game released for ${article === 'the' ? 'the ' : ''}${name}, including games that also came out on other platforms`,
    not: 'Board games, films and consoles do not count.',
    source: `Wikidata video games released for the platform, known in at least ${minSignal} languages.`,
    pattern: ON(...platforms), minSignal, mustHave,
  })

/** a video game of a genre */
const GENRE = (id: string, prompt: string, what: string, genre: string, minSignal: number, mustHave: string[]): NewQuestion =>
  mk('Games', {
    id: `games-${id}`, prompt, what, not: 'Board games, films and consoles do not count.',
    source: `Wikidata video games of the genre, known in at least ${minSignal} languages.`,
    pattern: `${VIDEO_GAME} ?item wdt:P136 wd:${genre} .`, minSignal, mustHave,
  })

/** feature films first released in a range of years */
const FILMS = (id: string, label: string, from: number, to: number, minSignal: number, mustHave: string[]): NewQuestion =>
  mk('Movies & TV', {
    id: `movies-film-${id}`, prompt: `Name a film released in the ${label}.`, what: `any feature film first released between ${from} and ${to}, from any country`,
    not: 'Short films, TV series and films released outside those years do not count.',
    source: `Wikidata films with a first release date from ${from} to ${to}, known in at least ${minSignal} languages.`,
    pattern: `?item wdt:P31 wd:Q11424 . ?item wdt:P577 ?pd . FILTER(YEAR(?pd) >= ${from} && YEAR(?pd) <= ${to}) FILTER NOT EXISTS { ?item wdt:P577 ?pd2 . FILTER(?pd2 < ?pd) }`, minSignal, mustHave,
  })

/** TV series that began in a range of years */
const SERIES = (id: string, label: string, from: number, to: number, minSignal: number, mustHave: string[]): NewQuestion =>
  mk('Movies & TV', {
    id: `movies-tv-${id}`, prompt: `Name a TV series that began in the ${label}.`, what: `any television series (live action or animated) whose first episode aired between ${from} and ${to}, from any country`,
    not: 'Films, miniseries that began outside those years and web videos do not count.',
    source: `Wikidata television series with a start date from ${from} to ${to}, known in at least ${minSignal} languages.`,
    pattern: `?item wdt:P31/wdt:P279* wd:Q5398426 . ?item wdt:P580 ?st . FILTER(YEAR(?st) >= ${from} && YEAR(?st) <= ${to})`, minSignal, mustHave,
  })

/** a fictional thing of a class */
const FICTIONAL = (cat: string, id: string, prompt: string, what: string, cls: string, minSignal: number, mustHave: string[], not = 'Real people, places and companies do not count.'): NewQuestion =>
  mk(cat, {
    id, prompt, what, not, source: `Wikidata fictional items of the class, known in at least ${minSignal} languages.`,
    pattern: `?item wdt:P31/wdt:P279* wd:${cls} .`, minSignal, mustHave,
  })

export const BATCH: NewQuestion[] = [
  // ================================================================ Games: platforms
  GAME('playstation-3', 'PlayStation 3', ['Q10683'], 15, ['The Last of Us', 'Uncharted 2: Among Thieves', 'God of War III', 'Grand Theft Auto V', 'Red Dead Redemption', 'Metal Gear Solid 4: Guns of the Patriots', 'Demon\'s Souls', 'Journey', 'Heavy Rain', 'LittleBigPlanet', 'Gran Turismo 5', 'Killzone 2', 'Resistance: Fall of Man', 'Skyrim', 'Call of Duty: Modern Warfare 2', 'Batman: Arkham City']),
  GAME('playstation-portable', 'PlayStation Portable', ['Q170325'], 8, ['God of War: Chains of Olympus', 'Monster Hunter Freedom Unite', 'Grand Theft Auto: Vice City Stories', 'Crisis Core: Final Fantasy VII', 'Patapon', 'LocoRoco', 'Metal Gear Solid: Peace Walker', 'Daxter', 'Ape Escape', 'Tekken: Dark Resurrection', 'Persona 3 Portable', 'Gran Turismo', 'Lumines', 'Syphon Filter: Dark Mirror', 'Wipeout Pure']),
  GAME('xbox-360', 'Xbox 360', ['Q48263'], 15, ['Halo 3', 'Gears of War', 'Forza Motorsport 4', 'Fable II', 'Mass Effect', 'BioShock', 'Skyrim', 'Grand Theft Auto V', 'Red Dead Redemption', 'Call of Duty: Modern Warfare 3', 'Dead Rising', 'Alan Wake', 'Halo: Reach', 'Kinect Adventures!', 'Minecraft', 'Fallout 3']),
  GAME('wii-u', 'Wii U', ['Q56942'], 5, ['Super Mario 3D World', 'Mario Kart 8', 'Splatoon', 'The Legend of Zelda: Breath of the Wild', 'Super Smash Bros. for Nintendo 3DS and Wii U', 'Xenoblade Chronicles X', 'Bayonetta 2', 'New Super Mario Bros. U', 'Super Mario Maker', 'Pikmin 3', 'Yoshi\'s Woolly World', 'Star Fox Zero', 'Wii Party U', 'Nintendo Land', 'Captain Toad: Treasure Tracker']),
  GAME('dreamcast', 'Dreamcast', ['Q184198'], 4, ['Sonic Adventure', 'Shenmue', 'Crazy Taxi', 'Jet Set Radio', 'Soulcalibur', 'Skies of Arcadia', 'Power Stone', 'Space Channel 5', 'Phantasy Star Online', 'Resident Evil Code: Veronica', 'Marvel vs. Capcom 2', 'Samba de Amigo', 'Seaman', 'Grandia II', 'Rez']),
  GAME('nes', 'Nintendo Entertainment System', ['Q172742'], 8, ['Super Mario Bros.', 'The Legend of Zelda', 'Metroid', 'Mega Man 2', 'Contra', 'Castlevania', 'Tetris', 'Duck Hunt', 'Donkey Kong', 'Punch-Out!!', 'Final Fantasy', 'Kirby\'s Adventure', 'Ninja Gaiden', 'Excitebike', 'Super Mario Bros. 3', 'Pac-Man']),
  GAME('game-boy-color', 'Game Boy Color', ['Q203992'], 3, ['Pokémon Gold and Silver', 'Pokémon Crystal', 'The Legend of Zelda: Oracle of Seasons', 'The Legend of Zelda: Link\'s Awakening DX', 'Wario Land 3', 'Dragon Quest Monsters', 'Shantae', 'Mario Tennis', 'Tony Hawk\'s Pro Skater 2', 'Metal Gear Solid', 'Harry Potter and the Philosopher\'s Stone', 'Pokémon Pinball', 'Super Mario Bros. Deluxe', 'Pokémon Trading Card Game']),
  GAME('sega-saturn', 'Sega Saturn', ['Q200912'], 3, ['Nights into Dreams...', 'Virtua Fighter 2', 'Panzer Dragoon Saga', 'Sega Rally Championship', 'Saturn Bomberman', 'Radiant Silvergun', 'Guardian Heroes', 'Virtua Cop', 'Dragon Force', 'Daytona USA', 'Burning Rangers', 'Shining Force III', 'Fighters Megamix', 'Street Fighter Alpha 3']),
  GAME('playstation-vita', 'PlayStation Vita', ['Q188808'], 4, ['Persona 4 Golden', 'Uncharted: Golden Abyss', 'Gravity Rush', 'Tearaway', 'Killzone: Mercenary', 'Hotline Miami', 'Soul Sacrifice', 'Freedom Wars', 'Ratchet & Clank Collection', 'Rayman Origins', 'Sly Cooper: Thieves in Time', 'Danganronpa', 'Spelunky', 'Hatsune Miku: Project DIVA f', 'Dragon\'s Crown']),
  GAME('xbox-one', 'Xbox One', ['Q13361286', 'Q66712951'], 15, ['Halo 5: Guardians', 'Forza Horizon 4', 'Gears 5', 'Sea of Thieves', 'Minecraft', 'Grand Theft Auto V', 'Red Dead Redemption 2', 'The Witcher 3: Wild Hunt', 'Cuphead', 'Ori and the Blind Forest', 'Halo: The Master Chief Collection', 'Fortnite', 'Rocket League', 'Call of Duty: Black Ops III', 'Titanfall', 'Forza Motorsport 7']),
  GAME('zx-spectrum', 'ZX Spectrum', ['Q23882'], 3, ['Manic Miner', 'Jet Set Willy', 'Elite', 'Skool Daze', 'Knight Lore', 'Sabre Wulf', 'Chuckie Egg', 'Horace Goes Skiing', 'Match Day', 'Ghosts \'n Goblins', 'R-Type', 'Head Over Heels', 'Atic Atac', 'Dizzy', 'Daley Thompson\'s Decathlon', 'Lords of Midnight'], 'the'),
  GAME('commodore-64', 'Commodore 64', ['Q99775'], 3, ['Impossible Mission', 'Boulder Dash', 'Maniac Mansion', 'Paradroid', 'Giana Sisters', 'The Last Ninja', 'Elite', 'Bubble Bobble', 'Pitfall!', 'M.U.L.E.', 'Summer Games', 'Wasteland', 'Uridium', 'International Karate', 'Ultima IV', 'Zork']),
  GAME('ms-dos', 'MS-DOS', ['Q47604'], 5, ['Doom', 'Prince of Persia', 'SimCity', 'Wolfenstein 3D', 'Civilization', 'Commander Keen', 'Duke Nukem 3D', 'The Secret of Monkey Island', 'Lemmings', 'Day of the Tentacle', 'Warcraft: Orcs & Humans', 'X-COM: UFO Defense', 'Transport Tycoon', 'Alone in the Dark', 'Dune II', 'Quake'], 'the'),
  GAME('playstation-5', 'PlayStation 5', ['Q63184502'], 12, ['Demon\'s Souls', 'Horizon Forbidden West', 'God of War Ragnarök', 'Marvel\'s Spider-Man 2', 'Returnal', 'Astro\'s Playroom', 'Ratchet & Clank: Rift Apart', 'Elden Ring', 'Gran Turismo 7', 'Hogwarts Legacy', 'Final Fantasy XVI', 'Baldur\'s Gate 3', 'Resident Evil 4', 'Stellar Blade', 'Black Myth: Wukong']),

  // ================================================================ Games: genres and other kinds
  GENRE('stealth', 'Name a stealth game.', 'any video game in which stealth is central', 'Q858523', 5, ['Metal Gear Solid', 'Splinter Cell', 'Hitman', 'Thief: The Dark Project', 'Dishonored', 'Assassin\'s Creed', 'Styx: Master of Shadows', 'Tenchu', 'Deus Ex', 'Mark of the Ninja', 'Sly Cooper', 'Commandos', 'Metal Gear Solid V: The Phantom Pain', 'Aragami', 'Death to Spies']),
  GENRE('shoot-em-up', 'Name a shoot \'em up.', 'any scrolling shooter or shoot \'em up video game', 'Q1044478', 4, ['Space Invaders', 'Galaga', 'Gradius', 'R-Type', 'Asteroids', 'Defender', 'Xevious', '1942', 'Ikaruga', 'Raiden', 'Life Force','Salamander', 'Cave Story', 'Darius', 'Radiant Silvergun', 'Touhou Project', 'Sinistar', 'Zaxxon']),
  GENRE('beat-em-up', 'Name a beat \'em up.', 'any side-scrolling or arena brawler video game', 'Q401831', 4, ['Streets of Rage', 'Double Dragon', 'Final Fight', 'Teenage Mutant Ninja Turtles', 'Golden Axe', 'Battletoads', 'River City Ransom', 'Bayonetta', 'Devil May Cry', 'God of War', 'Castle Crashers', 'Scott Pilgrim vs. the World: The Game', 'Dynasty Warriors', 'Streets of Rage 2', 'The Simpsons', 'Kung-Fu Master']),
  GENRE('city-builder', 'Name a city-building game.', 'any city-building, management or colony-building video game', 'Q588289', 3, ['SimCity', 'Cities: Skylines', 'Anno 1800', 'Tropico', 'Banished', 'Caesar III', 'Pharaoh', 'SimCity 2000', 'Age of Empires', 'Frostpunk', 'Civilization', 'Rimworld', 'Dwarf Fortress', 'Farmville', 'Zeus: Master of Olympus', 'Settlers']),
  GENRE('real-time-strategy', 'Name a real-time strategy game.', 'any real-time strategy video game', 'Q208189', 5, ['StarCraft', 'Age of Empires', 'Warcraft III: Reign of Chaos', 'Command & Conquer', 'Dune II', 'Total Annihilation', 'Rise of Nations', 'Company of Heroes', 'Empire Earth', 'Supreme Commander', 'Warcraft II: Tides of Darkness', 'Homeworld', 'Stronghold', 'Rome: Total War', 'StarCraft II: Wings of Liberty', 'Age of Mythology']),
  GENRE('visual-novel', 'Name a visual novel.', 'any visual novel or dating-sim video game', 'Q689445', 3, ['Steins;Gate', 'Fate/stay night', 'Clannad', 'Danganronpa', 'Doki Doki Literature Club!', 'Phoenix Wright: Ace Attorney', 'Higurashi When They Cry', 'Katawa Shoujo','Zero Escape: Virtue\'s Last Reward', 'Tsukihime', 'Umineko When They Cry', 'Ever 17', 'Kanon', 'Fate/Grand Order']),
  GENRE('roguelike', 'Name a roguelike game.', 'any roguelike or roguelite video game', 'Q1143132', 3, ['Rogue', 'The Binding of Isaac', 'Hades', 'NetHack', 'Spelunky', 'FTL: Faster Than Light', 'Slay the Spire', 'Dead Cells', 'Dungeon Crawl Stone Soup', 'Darkest Dungeon', 'Risk of Rain', 'Enter the Gungeon', 'ToME', 'Hack', 'Angband', 'Moria']),
  GENRE('tower-defense', 'Name a tower defense game.', 'any tower defense video game', 'Q1137896', 2, ['Plants vs. Zombies', 'Bloons TD', 'Kingdom Rush', 'Defense Grid: The Awakening', 'Orcs Must Die!', 'Fieldrunners', 'Sanctum', 'Dungeon Defenders', 'Plants vs. Zombies 2', 'GemCraft', 'Defense of the Ancients', 'Anomaly: Warzone Earth', 'Bloons Tower Defense', 'Vector TD', 'Plants vs. Zombies: Garden Warfare']),
  GENRE('sandbox', 'Name a sandbox game.', 'any open-ended sandbox or creative video game', 'Q25397095', 2, ['Minecraft', 'Terraria', 'Roblox', 'Garry\'s Mod', 'Grand Theft Auto V', 'Fortnite', 'Kerbal Space Program', 'Space Engineers', 'Starbound', 'Don\'t Starve', 'Little Big Planet', 'Besiege', 'Scrap Mechanic', 'Teardown', 'Stardew Valley', 'Rust']),
  GENRE('hack-and-slash', 'Name a hack and slash game.', 'any hack and slash or character action video game', 'Q1163960', 4, ['Devil May Cry', 'God of War', 'Bayonetta', 'Diablo', 'Dynasty Warriors', 'Ninja Gaiden', 'Darksiders', 'Onimusha', 'Dante\'s Inferno', 'Castlevania: Lords of Shadow', 'Nioh', 'Path of Exile', 'Hades', 'Metal Gear Rising: Revengeance', 'Sengoku Basara', 'Berserk']),
  GENRE('party-game', 'Name a party video game.', 'any party video game meant for groups', 'Q7888616', 3, ['Mario Party', 'Wii Sports', 'Wii Party', 'Just Dance', 'Jackbox Party Pack', 'Super Mario Party', 'Fall Guys', 'Among Us', 'Overcooked!', 'Rock Band', 'SingStar', 'Guitar Hero', 'Buzz!', 'Mario Party 2', 'Kinect Adventures!']),
  mk('Games', {
    id: 'games-chess-opening', prompt: 'Name a chess opening.', what: 'any named chess opening, gambit, defence or system, by its usual name (with or without "Defense", "Opening" or "Gambit")',
    not: 'Famous games, endgames and tactics do not count.',
    source: 'Wikidata chess openings, known in at least 2 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q103632 .', minSignal: 2,
    mustHave: ['Sicilian Defence', 'Queen\'s Gambit', 'Ruy Lopez', 'French Defence', 'Caro–Kann Defence', 'King\'s Indian Defence', 'English Opening', 'Italian Game', 'Scotch Game', 'Nimzo-Indian Defence', 'Slav Defense', 'Pirc Defence', 'Alekhine\'s Defence', 'London System', 'Catalan Opening', 'Dutch Defence', 'Grünfeld Defence', 'Vienna Game', 'King\'s Gambit', 'Scandinavian Defense', 'Evans Gambit', 'Benoni Defense', 'Queen\'s Indian Defense', 'Petrov\'s Defence', 'Four Knights Game', 'Réti Opening', 'Bird\'s Opening'],
    alsoWritten: (n) => [n.replace(/ Defen[cs]e$/i, ''), n.replace(/ Opening$/i, ''), n.replace(/ Game$/i, ''), n.replace(/ Gambit$/i, '')].filter((x) => x !== n && x.length >= 4),
  }),
  mk('Games', {
    id: 'games-tabletop-rpg', prompt: 'Name a tabletop role-playing game.', what: 'any tabletop role-playing game, pen-and-paper RPG or its setting',
    not: 'Video games and board games do not count.',
    source: 'Wikidata tabletop role-playing games, known in at least 3 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q1643932 .', minSignal: 3,
    mustHave: ['Dungeons & Dragons', 'Pathfinder', 'Call of Cthulhu', 'Vampire: The Masquerade', 'Shadowrun', 'Traveller', 'RuneQuest', 'GURPS', 'Cyberpunk 2020', 'Warhammer Fantasy Roleplay', 'Star Wars Roleplaying Game', 'World of Darkness', 'Paranoia', 'Savage Worlds', 'Fate', 'Blades in the Dark', 'Mutants & Masterminds', 'Mouse Guard', 'Mörk Borg', 'Fiasco'],
  }),
  mk('Games', {
    id: 'games-dice-game', prompt: 'Name a dice game.', what: 'any game that is played mainly with dice',
    not: 'Board games without dice and casino games that are not dice games do not count.',
    source: 'Wikidata dice games, known in at least 2 languages.',
    pattern: kindOf('Q1515156'), minSignal: 1,
    mustHave: ['Yahtzee', 'Craps', 'Liar\'s dice', 'Farkle', 'Backgammon', 'Yacht', 'Bunco', 'Ship, Captain, and Crew', 'Perudo', 'Pig', 'Cee-lo', 'Sic bo', 'Ludo', 'Snakes and ladders', 'Shut the Box', 'Poker dice', 'Kismet'],
  }),

  // ================================================================ Movies & TV
  FILMS('1990s', '1990s', 1990, 1999, 25, ['Titanic', 'Jurassic Park', 'Forrest Gump', 'Pulp Fiction', 'The Matrix', 'Toy Story', 'The Lion King', 'Home Alone', 'Goodfellas', 'Schindler\'s List', 'The Silence of the Lambs', 'Fight Club', 'Saving Private Ryan', 'Independence Day', 'Braveheart', 'Men in Black', 'Good Will Hunting', 'Terminator 2: Judgment Day', 'The Shawshank Redemption', 'American Beauty']),
  FILMS('2000s', '2000s', 2000, 2009, 25, ['Gladiator', 'The Lord of the Rings: The Fellowship of the Ring', 'Harry Potter and the Philosopher\'s Stone', 'Shrek', 'The Dark Knight', 'Finding Nemo', 'Avatar', 'Pirates of the Caribbean: The Curse of the Black Pearl', 'Spider-Man', 'The Departed', 'Memento', 'Kill Bill: Volume 1', 'Mean Girls', 'Slumdog Millionaire', 'WALL-E', 'The Bourne Identity', 'Casino Royale', 'The Prestige', 'No Country for Old Men', 'Up']),
  FILMS('2010s', '2010s', 2010, 2019, 25, ['Inception', 'The Avengers', 'Frozen', 'Joker', 'Parasite', 'Black Panther', 'Avengers: Endgame', 'Mad Max: Fury Road', 'Get Out', 'La La Land', 'The Social Network', 'Gravity', 'Interstellar', 'Toy Story 3', 'Django Unchained', 'Star Wars: The Force Awakens', 'Inside Out', 'Coco', 'Moonlight', 'Whiplash']),
  FILMS('1980s', '1980s', 1980, 1989, 20, ['E.T. the Extra-Terrestrial', 'Back to the Future', 'The Empire Strikes Back', 'Raiders of the Lost Ark', 'Ghostbusters', 'The Breakfast Club', 'Top Gun', 'Die Hard', 'The Terminator', 'Blade Runner', 'The Shining', 'Scarface', 'Dirty Dancing', 'The Princess Bride', 'Aliens', 'Rain Man', 'Platoon', 'Ferris Bueller\'s Day Off', 'Beverly Hills Cop', 'Raging Bull']),
  FILMS('1970s', '1970s', 1970, 1979, 15, ['The Godfather', 'Star Wars', 'Jaws', 'Alien', 'Apocalypse Now', 'Taxi Driver', 'A Clockwork Orange', 'Rocky', 'Saturday Night Fever', 'Grease', 'The Exorcist', 'Close Encounters of the Third Kind', 'Monty Python and the Holy Grail', 'One Flew Over the Cuckoo\'s Nest', 'The Godfather Part II', 'Superman', 'Halloween', 'Chinatown', 'Annie Hall', 'The Deer Hunter']),
  FILMS('1960s', '1960s', 1960, 1969, 12, ['Psycho', 'The Sound of Music', '2001: A Space Odyssey', 'Breakfast at Tiffany\'s', 'Lawrence of Arabia', 'The Graduate', 'Butch Cassidy and the Sundance Kid', 'Dr. Strangelove', 'Easy Rider', 'Mary Poppins', 'West Side Story', 'The Good, the Bad and the Ugly', 'Planet of the Apes', 'Bonnie and Clyde', 'Goldfinger', 'Spartacus', 'The Jungle Book', 'Rosemary\'s Baby', 'Night of the Living Dead', 'A Fistful of Dollars']),
  FILMS('1950s', '1950s', 1950, 1959, 12, ['Singin\' in the Rain', 'Rear Window', 'Vertigo', 'Ben-Hur', 'Some Like It Hot', 'Rebel Without a Cause', 'On the Waterfront', 'Seven Samurai', 'Cinderella', '12 Angry Men', 'North by Northwest', 'Sunset Boulevard', 'Roman Holiday', 'The Bridge on the River Kwai', 'Lady and the Tramp', 'Sleeping Beauty', 'The Seven Year Itch', 'The Ten Commandments', 'The Searchers', 'An American in Paris']),
  FILMS('1940s', '1940s', 1940, 1949, 10, ['Casablanca', 'It\'s a Wonderful Life', 'Citizen Kane', 'Fantasia', 'Pinocchio', 'Bambi', 'The Third Man', 'Rebecca', 'Double Indemnity', 'The Maltese Falcon', 'The Philadelphia Story', 'Gaslight', 'The Best Years of Our Lives', 'Bicycle Thieves', 'Miracle on 34th Street', 'The Treasure of the Sierra Madre', 'Dumbo', 'Notorious', 'The Big Sleep', 'Brief Encounter']),
  SERIES('2010s', '2010s', 2010, 2019, 30, ['Game of Thrones', 'Stranger Things', 'The Walking Dead', 'Breaking Bad', 'Sherlock', 'The Crown', 'Fleabag', 'Succession', 'Peaky Blinders', 'Black Mirror', 'House of Cards', 'Chernobyl', 'Narcos', 'Orange Is the New Black', 'The Handmaid\'s Tale', 'Westworld', 'Euphoria', 'Rick and Morty', 'The Good Place', 'Brooklyn Nine-Nine']),
  SERIES('2000s', '2000s', 2000, 2009, 30, ['Lost', 'The Wire', 'Mad Men', 'Dexter', 'House', 'Prison Break', 'Grey\'s Anatomy', 'The Office', 'Desperate Housewives', 'Heroes', 'Arrested Development', 'Gossip Girl', 'How I Met Your Mother', 'Supernatural', '30 Rock', 'The Big Bang Theory', 'Avatar: The Last Airbender', 'Doctor Who', 'Entourage', 'Battlestar Galactica']),
  SERIES('1990s', '1990s', 1990, 1999, 25, ['Friends', 'Seinfeld', 'The Simpsons', 'The X-Files', 'Buffy the Vampire Slayer', 'Frasier', 'ER', 'The Fresh Prince of Bel-Air', 'Dawson\'s Creek', 'South Park', 'Sex and the City', 'The Sopranos', 'Beverly Hills, 90210', 'Pokémon', 'Dragon Ball Z', 'Twin Peaks', 'Law & Order', 'Boy Meets World', 'Sabrina the Teenage Witch', 'Family Guy']),
  SERIES('1980s', '1980s', 1980, 1989, 20, ['Cheers', 'The Golden Girls', 'Miami Vice', 'Knight Rider', 'The A-Team', 'Magnum, P.I.', 'Dallas', 'Family Ties', 'The Cosby Show', 'MacGyver', 'Star Trek: The Next Generation', 'Thundercats', 'He-Man and the Masters of the Universe', 'Transformers', 'Full House', 'Murder, She Wrote', 'Dynasty', 'Hill Street Blues', 'The Smurfs', 'Moonlighting']),
  SERIES('1970s', '1970s', 1970, 1979, 15, ['Happy Days', 'M*A*S*H', 'Charlie\'s Angels', 'The Brady Bunch', 'Saturday Night Live', 'The Muppet Show', 'Monty Python\'s Flying Circus', 'The Waltons', 'All in the Family', 'Starsky & Hutch', 'Welcome Back, Kotter', 'Wonder Woman', 'Fawlty Towers', 'Taxi', 'The Six Million Dollar Man', 'Little House on the Prairie', 'Laverne & Shirley', 'Three\'s Company', 'Kojak', 'Roots']),
  SERIES('1960s', '1960s', 1960, 1969, 10, ['Star Trek', 'The Twilight Zone', 'Bewitched', 'I Dream of Jeannie', 'Batman', 'The Addams Family', 'The Munsters', 'Gilligan\'s Island', 'The Andy Griffith Show', 'Doctor Who', 'The Flintstones', 'Scooby-Doo, Where Are You!', 'Get Smart', 'The Monkees', 'Lost in Space', 'Mission: Impossible', 'The Beverly Hillbillies', 'Thunderbirds', 'The Avengers', 'The Prisoner']),
  FICTIONAL('Movies & TV', 'movies-fictional-detective', 'Name a fictional detective.', 'any detective, investigator or private eye from a book, film, show or game', 'Q3656924', 1, ['Sherlock Holmes', 'Hercule Poirot', 'Miss Marple', 'Columbo', 'Nancy Drew', 'Philip Marlowe', 'Sam Spade', 'Inspector Clouseau', 'Hardy Boys', 'Father Brown', 'Inspector Gadget', 'Jessica Fletcher', 'Kojak', 'Veronica Mars', 'Kinsey Millhone', 'Jane Tennison', 'Inspector Morse', 'Precious Ramotswe', 'Dick Tracy', 'Adrian Monk'], 'Real detectives and police do not count.'),
  FICTIONAL('Movies & TV', 'movies-fictional-robot', 'Name a fictional robot or android.', 'any robot, android or artificial being from a book, film, show or game', 'Q18327510', 5, ['R2-D2', 'C-3PO', 'WALL-E', 'Optimus Prime', 'The Terminator', 'Data', 'HAL 9000', 'Bender', 'Marvin the Paranoid Android', 'Robby the Robot', 'Astro Boy', 'Baymax', 'Johnny 5', 'Gort', 'Megatron', 'T-1000', 'Rosie', 'Ultron', 'Iron Giant', 'BB-8', 'K-2SO', 'Doraemon'], 'Real robots do not count.'),
  FICTIONAL('Movies & TV', 'movies-fictional-dog', 'Name a fictional dog.', 'any dog from a book, film, show, comic or game', 'Q15720625', 5, ['Snoopy', 'Scooby-Doo', 'Lassie', 'Pluto', 'Toto', 'Clifford the Big Red Dog', 'Beethoven', 'Marley', 'Goofy', 'Odie', 'Gromit', 'Old Yeller', 'Hooch', 'Santa\'s Little Helper', 'Brian Griffin', 'Rin Tin Tin', 'Droopy', 'Spike', 'Courage the Cowardly Dog', 'Bluey', 'Slinky Dog', 'Fang', 'Cujo'], 'Real dogs do not count.'),
  FICTIONAL('Movies & TV', 'movies-fictional-cat', 'Name a fictional cat.', 'any cat from a book, film, show, comic or game', 'Q27120684', 5, ['Garfield', 'Tom', 'Felix the Cat', 'Cheshire Cat', 'Puss in Boots', 'Sylvester', 'Simba', 'Salem', 'Heathcliff', 'Hello Kitty', 'Tigger', 'Scratchy', 'Snowball', 'Mr. Bigglesworth', 'Crookshanks', 'Mittens', 'Cat in the Hat', 'Azrael', 'Bagheera', 'Jiji', 'Luna', 'Artemis'], 'Real cats do not count.'),
  FICTIONAL('Movies & TV', 'movies-supervillain', 'Name a supervillain.', 'any supervillain or arch-enemy from a comic, film, show or game', 'Q6498903', 1, ['Joker', 'Lex Luthor', 'Thanos', 'Darth Vader', 'Magneto', 'Green Goblin', 'Loki', 'Doctor Doom', 'Harley Quinn', 'Penguin', 'Riddler', 'Two-Face', 'Catwoman', 'Bane', 'Venom', 'Darkseid', 'Sauron', 'Voldemort', 'Ultron', 'Doctor Octopus', 'Red Skull', 'Mystique'], 'Heroes and real people do not count.'),
]
