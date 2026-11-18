/**
 * Batch 22: top-up for the 250 questions the owner asked for on 18 Nov 2026: people by occupation and by prize, more car brands and a few others, and
 * rebuilds of the four weak ones of Batch 16 (gangsters, outlaws, US senators) with a lower language floor or a position instead of an occupation.
 * Build with: npx tsx src/expand/newq.ts --batch batch22 --out C:/Users/weibi/minitude/list-build/batch22
 */
import type { NewQuestion } from './newq'
import { mk } from './batch8'
import { CAR } from './batch17'
import { P } from './batch14'
import { HUMAN, heldPosition, personForms, strip } from './recipes'

/** people (or works) that won a prize: Wikidata's "award received" */
const WON = (cat: string, id: string, prompt: string, what: string, award: string, minSignal: number, mustHave: string[], human = true): NewQuestion =>
  mk(cat, {
    id, prompt, what, not: 'People and films that only were nominated do not count.',
    source: `Wikidata items that received the award, known in at least ${minSignal} languages.`,
    pattern: `?item wdt:P166 wd:${award} .${human ? HUMAN : ''}`, minSignal, mustHave, ...(human ? { alsoWritten: personForms } : {}),
  })

const MOTO = (id: string, brand: string, maker: string, mustHave: string[]): NewQuestion =>
  mk('Transport & Vehicles', {
    id: `transport-${id}-motorcycle`, prompt: `Name a ${brand} motorcycle model.`, what: `any ${brand} motorcycle model, past or present, written with or without the brand name`,
    not: 'Cars, engines and models of other brands do not count.',
    source: `Wikidata motorcycle models whose manufacturer is ${brand}, known in at least 2 languages.`,
    pattern: `?item wdt:P176 wd:${maker} . ?item wdt:P31/wdt:P279* wd:Q34493 .`, minSignal: 2, mustHave,
    alsoWritten: strip(new RegExp('^' + brand.replace(/[-.]/g, '\\$&') + ' ')),
  })

export const BATCH: NewQuestion[] = [
  // ================================================================ people by occupation (the weak four of Batch 16 and more)
  P('History & Mythology', 'gangster', 'a gangster or crime boss', 'any gangster, mobster or crime boss, of any era', 'Q46961', /gangster|mobster|mafia|crime|criminal|bootlegger/i, 3,
    ['Al Capone', 'Lucky Luciano', 'John Gotti', 'Pablo Escobar', 'Meyer Lansky', 'Bugsy Siegel', 'Dutch Schultz', 'Whitey Bulger', 'Frank Costello', 'Carlo Gambino', 'Vito Genovese', 'Salvatore Riina', 'Sam Giancana', 'Mickey Cohen', 'Ronnie Kray', 'Reggie Kray', 'Joe Colombo', 'Bonnie Parker', 'Machine Gun Kelly', 'Arnold Rothstein']),
  mk('History & Mythology', {
    id: 'history-us-senator', prompt: 'Name a United States senator.', what: 'any person who has served in the United States Senate, of any era',
    not: 'Members of the House only and state senators do not count.',
    source: 'People in Wikidata who held the position of United States senator, known in at least 8 languages, plus the best-known added by hand.',
    pattern: heldPosition('Q4416090') + HUMAN, minSignal: 8, alsoWritten: personForms,
    mustHave: ['Barack Obama', 'Hillary Clinton', 'Joe Biden', 'John McCain', 'Bernie Sanders', 'Ted Kennedy', 'Elizabeth Warren', 'Mitch McConnell', 'Ted Cruz', 'Marco Rubio', 'Kamala Harris', 'JD Vance', 'John F. Kennedy', 'Robert F. Kennedy', 'Lyndon B. Johnson', 'Richard Nixon', 'Daniel Webster', 'Henry Clay', 'Strom Thurmond', 'Mitt Romney', 'Jefferson Davis', 'Joseph McCarthy', 'Al Gore', 'Barry Goldwater'],
  }),
  P('Movies & TV', 'film-editor', 'a film editor', 'any film editor, of any era', 'Q7042855', /editor/i, 5,
    ['Thelma Schoonmaker', 'Walter Murch', 'Michael Kahn', 'Dede Allen', 'Anne V. Coates', 'Sally Menke', 'Margaret Booth', 'Lee Smith', 'Pietro Scalia', 'Paul Hirsch', 'Ralph Rosenblum', 'Verna Fields', 'Joe Walker', 'Jim Clark', 'Tom Cross', 'Hank Corwin']),
  P('Movies & TV', 'costume-designer', 'a costume designer', 'any costume designer for film, theatre or television, of any era', 'Q1323191', /costume/i, 4,
    ['Edith Head', 'Colleen Atwood', 'Sandy Powell', 'Jenny Beavan', 'Milena Canonero', 'Orry-Kelly', 'Adrian', 'Theoni V. Aldredge', 'Ruth E. Carter', 'Anthony Powell', 'Deborah Nadoolman Landis', 'Jacqueline Durran', 'Eiko Ishioka', 'Bob Mackie', 'Irene Sharaff', 'Walter Plunkett']),
  P('Music', 'lyricist', 'a lyricist', 'any lyricist or songwriter of words, of any era', 'Q822146', /lyric/i, 8,
    ['Bernie Taupin', 'Tim Rice', 'Oscar Hammerstein II', 'Lorenz Hart', 'Ira Gershwin', 'Stephen Sondheim', 'Alan Jay Lerner', 'Johnny Mercer', 'Howard Ashman', 'Lin-Manuel Miranda', 'Cole Porter', 'Dorothy Fields', 'Yip Harburg', 'Hal David', 'Gerry Goffin', 'Robert Hunter', 'Pete Brown', 'Sammy Cahn', 'Jim Steinman', 'Linda Creed']),
  P('Music', 'singer-songwriter', 'a singer-songwriter', 'any singer-songwriter (a musician who writes and sings their own songs), of any era', 'Q488205', /singer-songwriter|singer and songwriter|songwriter/i, 15,
    ['Bob Dylan', 'Joni Mitchell', 'Leonard Cohen', 'Taylor Swift', 'Paul Simon', 'Neil Young', 'Carole King', 'James Taylor', 'Elton John', 'Bruce Springsteen', 'Ed Sheeran', 'Adele', 'Billy Joel', 'Tom Waits', 'Joan Baez', 'Cat Stevens', 'Tracy Chapman', 'Johnny Cash', 'Lana Del Rey', 'Bob Marley', 'Van Morrison', 'Nick Drake', 'Jeff Buckley', 'Simon and Garfunkel'].filter((n) => n !== 'Simon and Garfunkel')),
  P('Movies & TV', 'stage-actor', 'a stage actor', 'any actor who has worked mainly or often in the theatre, of any era', 'Q2259451', /stage|theatre|theater/i, 20,
    ['Laurence Olivier', 'Judi Dench', 'Ian McKellen', 'Patrick Stewart', 'Edwin Booth', 'Sarah Bernhardt', 'Maggie Smith', 'John Gielgud', 'Ralph Richardson', 'Helen Mirren', 'Kenneth Branagh', 'Derek Jacobi', 'David Garrick', 'Ellen Terry', 'Henry Irving', 'Richard Burbage', 'Eleonora Duse', 'Cate Blanchett', 'Mark Rylance', 'Audra McDonald']),
  P('Science & Technology', 'marine-biologist', 'a marine biologist', 'any marine biologist or ocean scientist, of any era', 'Q3640160', /marine|ocean|biolog/i, 5,
    ['Sylvia Earle', 'Jacques Cousteau', 'Rachel Carson', 'Robert Ballard', 'Eugenie Clark', 'Ed Ricketts', 'Jane Lubchenco', 'Daniel Pauly', 'William Beebe', 'Ruth Gates', 'Hope Jahren', 'Stephen Hillenburg', 'Edith Widder', 'Kristine Stump', 'David Gruber', 'Nancy Knowlton'].filter((n) => !['Kristine Stump', 'Hope Jahren'].includes(n))),
  P('Science & Technology', 'microbiologist', 'a microbiologist', 'any microbiologist, of any era', 'Q3779582', /microbiolog|bacteriolog|virolog/i, 6,
    ['Louis Pasteur', 'Robert Koch', 'Alexander Fleming', 'Antonie van Leeuwenhoek', 'Joseph Lister', 'Paul Ehrlich', 'Selman Waksman', 'Hans Christian Gram', 'Jonas Salk', 'Albert Sabin', 'Martinus Beijerinck', 'Carl Woese', 'Barbara McClintock', 'Lynn Margulis', 'Sergei Winogradsky', 'Emil von Behring', 'Waldemar Haffkine', 'Kitasato Shibasaburō']),
  P('Science & Technology', 'biochemist', 'a biochemist', 'any biochemist, of any era', 'Q2919046', /biochem/i, 8,
    ['Frederick Sanger', 'Linus Pauling', 'Hans Krebs', 'Fritz Lipmann', 'Rosalind Franklin', 'Dorothy Hodgkin', 'Max Perutz', 'Eduard Buchner', 'Gertrude Elion', 'Isaac Asimov', 'Albert Szent-Györgyi', 'Severo Ochoa', 'Carl Cori', 'Gerty Cori', 'Kary Mullis', 'Jennifer Doudna', 'Katalin Karikó', 'Emil Fischer']),
  P('Science & Technology', 'polar-explorer', 'a polar explorer', 'any explorer of the Arctic or Antarctic, of any era', 'Q13382749', /polar|arctic|antarctic|explorer/i, 6,
    ['Roald Amundsen', 'Robert Falcon Scott', 'Ernest Shackleton', 'Fridtjof Nansen', 'Robert Peary', 'Frederick Cook', 'Richard E. Byrd', 'Douglas Mawson', 'Vivian Fuchs', 'Edmund Hillary', 'Knud Rasmussen', 'Matthew Henson', 'Wally Herbert', 'Ranulph Fiennes', 'Lawrence Oates', 'Edward Wilson', 'Tom Crean', 'Salomon August Andrée']),

  // ================================================================ prizes
  WON('History & Mythology', 'history-nobel-peace-prize', 'Name a Nobel Peace Prize winner.', 'any person or organisation that has won the Nobel Peace Prize', 'Q35637', 5,
    ['Barack Obama', 'Martin Luther King Jr.', 'Nelson Mandela', 'Mother Teresa', 'Malala Yousafzai', 'Mikhail Gorbachev', 'Henry Kissinger', 'Jimmy Carter', 'Al Gore', 'Desmond Tutu', '14th Dalai Lama', 'Elie Wiesel', 'Aung San Suu Kyi', 'Yasser Arafat', 'Theodore Roosevelt', 'Woodrow Wilson', 'Albert Schweitzer', 'Kofi Annan', 'Wangari Maathai', 'Lech Wałęsa', 'International Committee of the Red Cross', 'Médecins Sans Frontières'], false),
  WON('Miscellaneous', 'misc-nobel-literature', 'Name a winner of the Nobel Prize in Literature.', 'any writer who has won the Nobel Prize in Literature', 'Q37922', 5,
    ['Ernest Hemingway', 'Gabriel García Márquez', 'Toni Morrison', 'Bob Dylan', 'Rabindranath Tagore', 'Winston Churchill', 'Albert Camus', 'Samuel Beckett', 'Pablo Neruda', 'Aleksandr Solzhenitsyn', 'John Steinbeck', 'William Faulkner', 'Kazuo Ishiguro', 'Doris Lessing', 'Orhan Pamuk', 'Rudyard Kipling', 'Thomas Mann', 'Jean-Paul Sartre', 'T. S. Eliot', 'Annie Ernaux', 'Han Kang', 'Mo Yan']),
  WON('Science & Technology', 'science-nobel-physics', 'Name a winner of the Nobel Prize in Physics.', 'any physicist who has won the Nobel Prize in Physics', 'Q38104', 5,
    ['Albert Einstein', 'Marie Curie', 'Max Planck', 'Niels Bohr', 'Richard Feynman', 'Werner Heisenberg', 'Erwin Schrödinger', 'Enrico Fermi', 'Paul Dirac', 'Wilhelm Röntgen', 'Peter Higgs', 'Pierre Curie', 'Max Born', 'J. J. Thomson', 'Hideki Yukawa', 'Roger Penrose', 'Andre Geim', 'Geoffrey Hinton', 'Subrahmanyan Chandrasekhar', 'C. V. Raman', 'Guglielmo Marconi']),
  WON('Science & Technology', 'science-nobel-chemistry', 'Name a winner of the Nobel Prize in Chemistry.', 'any chemist who has won the Nobel Prize in Chemistry', 'Q44585', 5,
    ['Marie Curie', 'Linus Pauling', 'Frederick Sanger', 'Dorothy Hodgkin', 'Ernest Rutherford', 'Fritz Haber', 'Jennifer Doudna', 'Emmanuelle Charpentier', 'Harold Kroto', 'Ahmed Zewail', 'Otto Hahn', 'Glenn T. Seaborg', 'Svante Arrhenius', 'Walther Nernst', 'Robert Curl', 'Richard Smalley', 'Roald Hoffmann', 'John B. Goodenough', 'Demis Hassabis', 'Carolyn Bertozzi']),
  WON('Science & Technology', 'science-nobel-medicine', 'Name a winner of the Nobel Prize in Physiology or Medicine.', 'any scientist who has won the Nobel Prize in Physiology or Medicine', 'Q80061', 5,
    ['Alexander Fleming', 'Ivan Pavlov', 'Robert Koch', 'Francis Crick', 'James Watson', 'Frederick Banting', 'Katalin Karikó', 'Drew Weissman', 'Svante Pääbo', 'Barbara McClintock', 'Ronald Ross', 'Karl Landsteiner', 'Paul Ehrlich', 'Santiago Ramón y Cajal', 'Camillo Golgi', 'Howard Florey', 'Ernst Boris Chain', 'Tu Youyou', 'James P. Allison', 'Tasuku Honjo', 'Shinya Yamanaka', 'Elizabeth Blackburn']),
  WON('Movies & TV', 'movies-best-actress-winner', 'Name a winner of the Academy Award for Best Actress.', 'any actress who has won the Academy Award for Best Actress', 'Q103618', 5,
    ['Meryl Streep', 'Katharine Hepburn', 'Frances McDormand', 'Jodie Foster', 'Julia Roberts', 'Sandra Bullock', 'Natalie Portman', 'Cate Blanchett', 'Emma Stone', 'Olivia Colman', 'Audrey Hepburn', 'Ingrid Bergman', 'Bette Davis', 'Elizabeth Taylor', 'Grace Kelly', 'Halle Berry', 'Nicole Kidman', 'Reese Witherspoon', 'Kate Winslet', 'Charlize Theron', 'Jessica Chastain', 'Brie Larson', 'Renée Zellweger', 'Michelle Yeoh', 'Emma Thompson']),
  WON('Movies & TV', 'movies-best-director-winner', 'Name a winner of the Academy Award for Best Director.', 'any film director who has won the Academy Award for Best Director', 'Q103360', 5,
    ['Steven Spielberg', 'Martin Scorsese', 'Francis Ford Coppola', 'Clint Eastwood', 'Kathryn Bigelow', 'Ang Lee', 'James Cameron', 'Christopher Nolan', 'Oliver Stone', 'Peter Jackson', 'Alfonso Cuarón', 'Bong Joon-ho', 'Chloé Zhao', 'Damien Chazelle', 'Guillermo del Toro', 'Frank Capra', 'John Ford', 'Billy Wilder', 'Miloš Forman', 'Woody Allen', 'Sam Mendes', 'Danny Boyle', 'Robert Zemeckis', 'Mel Gibson', 'Kevin Costner', 'Ron Howard', 'Roman Polanski', 'David Lean']),
  WON('Movies & TV', 'movies-best-picture-winner', 'Name a film that won the Academy Award for Best Picture.', 'any film that won the Academy Award for Best Picture (Outstanding Picture or Best Picture)', 'Q102427 . ?item wdt:P31/wdt:P279* wd:Q11424', 8,
    ['Titanic', 'Forrest Gump', 'Gladiator', 'The Godfather', 'Casablanca', 'Schindler\'s List', 'The Lord of the Rings: The Return of the King', 'Parasite', 'Oppenheimer', 'Everything Everywhere All at Once', 'Gone with the Wind', 'Rocky', 'Braveheart', 'Slumdog Millionaire', 'The Silence of the Lambs', 'Chicago', 'Argo', '12 Years a Slave', 'Moonlight', 'CODA', 'Nomadland', 'Green Book', 'The Shape of Water', 'Spotlight', 'Birdman or (The Unexpected Virtue of Ignorance)', 'The King\'s Speech', 'The Hurt Locker', 'No Country for Old Men', 'The Departed', 'Million Dollar Baby', 'Ben-Hur', 'The Sound of Music', 'Annie Hall', 'Amadeus', 'Dances with Wolves', 'Rain Man', 'Unforgiven', 'American Beauty', 'A Beautiful Mind'], false),
  WON('Movies & TV', 'movies-palme-dor-winner', 'Name a film that won the Palme d\'Or at Cannes.', 'any film that won the Palme d\'Or (the Grand Prix before 1955) at the Cannes Film Festival', 'Q179808 . ?item wdt:P31/wdt:P279* wd:Q11424', 5,
    ['Pulp Fiction', 'Parasite', 'Apocalypse Now', 'Taxi Driver', 'The Piano', 'Anatomy of a Fall', 'Triangle of Sadness', 'Titane', 'The Tree of Life', 'Amour', 'Blue Is the Warmest Colour', 'Fahrenheit 9/11', 'The Pianist', 'Dancer in the Dark', 'Secrets & Lies', 'Barton Fink', 'Wild at Heart', 'Sex, Lies, and Videotape', 'Paris, Texas', 'The Third Man', 'M*A*S*H', 'La Dolce Vita', 'Anora'], false),
  WON('Sports', 'sports-ballon-dor-winner', 'Name a winner of the Ballon d\'Or.', 'any footballer who has won the Ballon d\'Or (the best player in Europe or the world of the year)', 'Q166177', 1,
    ['Lionel Messi', 'Cristiano Ronaldo', 'Johan Cruyff', 'Michel Platini', 'Marco van Basten', 'Zinedine Zidane', 'Ronaldo', 'Ronaldinho', 'Kaká', 'Luka Modrić', 'Karim Benzema', 'Rodri', 'Ousmane Dembélé', 'Franz Beckenbauer', 'George Best', 'Bobby Charlton', 'Kevin Keegan', 'Ruud Gullit', 'Roberto Baggio', 'Michael Owen', 'Luís Figo', 'Andriy Shevchenko', 'Fabio Cannavaro', 'Lev Yashin', 'Alfredo Di Stéfano', 'Eusébio', 'Gerd Müller', 'Paolo Rossi', 'Lothar Matthäus', 'Stanley Matthews']),

  // ================================================================ more brands and aircraft
  CAR('peugeot', 'Peugeot', ['Q6742'], ['Peugeot 205', 'Peugeot 206', 'Peugeot 207', 'Peugeot 208', 'Peugeot 306', 'Peugeot 307', 'Peugeot 308', 'Peugeot 405', 'Peugeot 406', 'Peugeot 504', 'Peugeot 508', 'Peugeot 2008', 'Peugeot 3008', 'Peugeot 5008', 'Peugeot 106', 'Peugeot 107'], 2),
  CAR('renault', 'Renault', ['Q6686', 'Q98584518'], ['Renault Clio', 'Renault 5', 'Renault Megane', 'Renault Twingo', 'Renault Laguna', 'Renault Scenic', 'Renault Espace', 'Renault 4', 'Renault Captur', 'Renault Kadjar', 'Renault Zoe', 'Renault Kangoo', 'Renault Fluence', 'Renault 12', 'Renault Dauphine', 'Renault Alpine A110'], 2, { extras: [{ name: 'Renault Captur', signal: 30 }] }),
  CAR('mazda', 'Mazda', ['Q35996'], ['Mazda MX-5', 'Mazda RX-7', 'Mazda 3', 'Mazda 6', 'Mazda CX-5', 'Mazda RX-8', 'Mazda 2', 'Mazda CX-3', 'Mazda 323', 'Mazda 626', 'Mazda Familia', 'Mazda Cosmo', 'Mazda CX-30', 'Mazda MX-30', 'Mazda Miata', 'Mazda Bongo'], 2),
  CAR('mitsubishi', 'Mitsubishi', ['Q36033'], ['Mitsubishi Lancer', 'Mitsubishi Pajero', 'Mitsubishi Outlander', 'Mitsubishi Eclipse', 'Mitsubishi Colt', 'Mitsubishi Galant', 'Mitsubishi L200', 'Mitsubishi 3000GT', 'Mitsubishi ASX', 'Mitsubishi Mirage', 'Mitsubishi i-MiEV', 'Mitsubishi Starion', 'Mitsubishi Shogun', 'Mitsubishi Montero', 'Mitsubishi Delica', 'Mitsubishi Evo'], 2),
  CAR('subaru', 'Subaru', ['Q172741'], ['Subaru Impreza', 'Subaru Forester', 'Subaru Outback', 'Subaru Legacy', 'Subaru WRX', 'Subaru BRZ', 'Subaru XV', 'Subaru Crosstrek', 'Subaru Baja', 'Subaru 360', 'Subaru Justy', 'Subaru Ascent', 'Subaru Tribeca', 'Subaru SVX', 'Subaru Levorg', 'Subaru Sambar'], 1),
  CAR('volvo', 'Volvo', ['Q215293'], ['Volvo XC90', 'Volvo V70', 'Volvo 240', 'Volvo XC60', 'Volvo S60', 'Volvo 850', 'Volvo P1800', 'Volvo S40', 'Volvo V40', 'Volvo XC40', 'Volvo 740', 'Volvo 940', 'Volvo C30', 'Volvo S80', 'Volvo Amazon', 'Volvo PV444'], 2),
  mk('Transport & Vehicles', {
    id: 'transport-russian-soviet-aircraft', prompt: 'Name a Russian or Soviet aircraft.', what: 'any aircraft designed in Russia or the Soviet Union (a fighter, bomber, airliner, transport or helicopter), by its usual name',
    not: 'Aircraft of other countries do not count.',
    source: 'Wikidata aircraft made by Tupolev, Sukhoi, Ilyushin, Antonov, Mikoyan and other Russian and Soviet designers, known in at least 3 languages.',
    pattern: 'VALUES ?mk { wd:Q194009 wd:Q193007 wd:Q221419 wd:Q212268 } ?item wdt:P176 ?mk . ?item wdt:P31/wdt:P279* wd:Q11436 .', minSignal: 3,
    mustHave: ['Mikoyan-Gurevich MiG-29', 'Sukhoi Su-27', 'Sukhoi Su-57', 'Tupolev Tu-95', 'Tupolev Tu-160', 'Tupolev Tu-144', 'Ilyushin Il-76', 'Ilyushin Il-2', 'Antonov An-225 Mriya', 'Antonov An-124 Ruslan', 'Mikoyan-Gurevich MiG-15', 'Mikoyan-Gurevich MiG-21', 'Mikoyan MiG-31', 'Tupolev Tu-154', 'Sukhoi Su-35', 'Tupolev Tu-134', 'Ilyushin Il-62', 'Antonov An-2', 'Antonov An-26', 'Mil Mi-24', 'Kamov Ka-52', 'Mil Mi-8'],
    alsoWritten: (n) => [n.replace(/^(Tupolev|Sukhoi|Ilyushin|Antonov|Mikoyan-Gurevich|Mikoyan|Mil|Kamov) /, '')].filter((x) => x !== n && x.length >= 3),
  }),
]
