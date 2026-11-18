/**
 * Batch 15: science, music and screen people by occupation (the 250 questions the owner asked for on 18 Nov 2026).
 * Build with: npx tsx src/expand/newq.ts --batch batch15 --out C:/Users/weibi/minitude/list-build/batch15
 */
import type { NewQuestion } from './newq'
import { P } from './batch14'

export const BATCH: NewQuestion[] = [
  // ================================================================ Science & Technology
  P('Science & Technology', 'sociologist', 'a sociologist', 'any sociologist, of any era', 'Q2306091', /sociolog/i, 10,
    ['Max Weber', 'Émile Durkheim', 'Karl Marx', 'Auguste Comte', 'Herbert Spencer', 'Pierre Bourdieu', 'Erving Goffman', 'Anthony Giddens', 'Jürgen Habermas', 'Talcott Parsons', 'C. Wright Mills', 'Zygmunt Bauman', 'Georg Simmel', 'Harriet Martineau', 'W. E. B. Du Bois']),
  P('Science & Technology', 'meteorologist', 'a meteorologist or weather presenter', 'any meteorologist, climatologist or television weather presenter, of any era', 'Q2310145', /meteorolog|weather|climat/i, 6,
    ['Edward Lorenz', 'Vilhelm Bjerknes', 'Carl-Gustaf Rossby', 'Tetsuya Fujita', 'Joanne Simpson', 'Al Roker', 'Jim Cantore', 'Michael Fish', 'Lewis Fry Richardson', 'Jule Charney', 'Alfred Wegener', 'Wladimir Köppen', 'Evelyn Cheesman'].filter((n) => n !== 'Evelyn Cheesman')),
  P('Science & Technology', 'zoologist', 'a zoologist', 'any zoologist, naturalist or wildlife biologist, of any era', 'Q350979', /zoolog|naturalist|biolog|etholog|primatolog/i, 10,
    ['Charles Darwin', 'Jane Goodall', 'Konrad Lorenz', 'Carl Linnaeus', 'Alfred Russel Wallace', 'Dian Fossey', 'Jacques Cousteau', 'Ernst Mayr', 'E. O. Wilson', 'Richard Dawkins', 'Georges Cuvier', 'Gerald Durrell', 'Desmond Morris', 'David Attenborough', 'Steve Irwin', 'Thomas Henry Huxley', 'Jack Hanna']),
  P('Science & Technology', 'botanist', 'a botanist', 'any botanist or plant scientist, of any era', 'Q2374149', /botan|plant|horticult|naturalist/i, 8,
    ['Carl Linnaeus', 'Joseph Banks', 'Joseph Dalton Hooker', 'Gregor Mendel', 'Asa Gray', 'Luther Burbank', 'George Washington Carver', 'Alexander von Humboldt', 'Barbara McClintock', 'Robert Brown', 'Nikolai Vavilov', 'Augustin Pyramus de Candolle', 'Carl Ludwig Willdenow', 'William Hooker']),
  P('Science & Technology', 'entomologist', 'an entomologist', 'any entomologist (a scientist who studies insects), of any era', 'Q3055126', /entomolog|insect|lepidopter|zoolog/i, 6,
    ['Vladimir Nabokov', 'E. O. Wilson', 'Jean-Henri Fabre', 'Karl von Frisch', 'Maria Sibylla Merian', 'Alfred Kinsey', 'Charles Valentine Riley', 'Henry Walter Bates', 'William Kirby', 'Thomas Say', 'Edward Newman', 'Miriam Rothschild', 'Walter Rothschild']),
  P('Science & Technology', 'ornithologist', 'an ornithologist', 'any ornithologist or bird illustrator-scientist, of any era', 'Q1225716', /ornitholog|bird|naturalist/i, 6,
    ['John James Audubon', 'Roger Tory Peterson', 'David Sibley', 'Ernst Mayr', 'Alexander Wilson', 'Salim Ali', 'Robert Ridgway', 'John Gould', 'Konrad Lorenz', 'Edward Lear', 'George Edwards', 'Mark Catesby', 'Jared Diamond', 'Joseph Grinnell']),
  P('Science & Technology', 'paleontologist', 'a paleontologist', 'any paleontologist, of any era', 'Q1662561', /paleontolog|palaeontolog|geolog|fossil/i, 8,
    ['Mary Anning', 'Richard Owen', 'Stephen Jay Gould', 'Othniel Charles Marsh', 'Edward Drinker Cope', 'Jack Horner', 'Robert T. Bakker', 'Paul Sereno', 'Gideon Mantell', 'Georges Cuvier', 'Roy Chapman Andrews', 'Louis Agassiz', 'Barnum Brown', 'William Buckland', 'Mary Leakey']),
  P('Science & Technology', 'neuroscientist', 'a neuroscientist', 'any neuroscientist or neurologist, of any era', 'Q6337803', /neuro|brain/i, 8,
    ['Santiago Ramón y Cajal', 'Oliver Sacks', 'Eric Kandel', 'V. S. Ramachandran', 'Antonio Damasio', 'Karl Deisseroth', 'David Eagleman', 'Michael Gazzaniga', 'Wilder Penfield', 'Sam Harris', 'Joseph LeDoux', 'Christof Koch', 'Camillo Golgi', 'Paul Broca', 'Carl Wernicke']),
  P('Science & Technology', 'geneticist', 'a geneticist', 'any geneticist or molecular biologist, of any era', 'Q3126128', /genetic|molecular|biolog/i, 8,
    ['Gregor Mendel', 'Thomas Hunt Morgan', 'Barbara McClintock', 'James Watson', 'Craig Venter', 'Jennifer Doudna', 'Francis Collins', 'Theodosius Dobzhansky', 'Ronald Fisher', 'Sewall Wright', 'J. B. S. Haldane', 'Svante Pääbo', 'Emmanuelle Charpentier', 'Francis Crick', 'Rosalind Franklin', 'Sydney Brenner']),
  P('Science & Technology', 'statistician', 'a statistician', 'any statistician or probability theorist, of any era', 'Q2732142', /statistic|probab|mathematic|data/i, 8,
    ['Ronald Fisher', 'Karl Pearson', 'Florence Nightingale', 'Nate Silver', 'William Sealy Gosset', 'Pierre-Simon Laplace', 'Francis Galton', 'Jerzy Neyman', 'Thomas Bayes', 'John Tukey', 'Andrey Kolmogorov', 'W. Edwards Deming', 'Hans Rosling', 'C. R. Rao', 'Egon Pearson', 'Abraham de Moivre']),
  P('Science & Technology', 'astrophysicist', 'an astrophysicist', 'any astrophysicist or cosmologist, of any era', 'Q752129', /astrophys|cosmolog|astronom|physicist/i, 8,
    ['Neil deGrasse Tyson', 'Carl Sagan', 'Stephen Hawking', 'Subrahmanyan Chandrasekhar', 'Kip Thorne', 'Brian Cox', 'Jocelyn Bell Burnell', 'Brian May', 'Michio Kaku', 'Martin Rees', 'Katie Mack', 'Sara Seager', 'Fritz Zwicky', 'Arthur Eddington', 'Edwin Hubble', 'Vera Rubin']),
  P('Science & Technology', 'psychiatrist', 'a psychiatrist', 'any psychiatrist or psychoanalyst, of any era', 'Q211346', /psychiatr|psychoanal|psycholog/i, 8,
    ['Sigmund Freud', 'Carl Jung', 'Alfred Adler', 'R. D. Laing', 'Viktor Frankl', 'Elisabeth Kübler-Ross', 'Emil Kraepelin', 'Karl Jaspers', 'Jacques Lacan', 'Aaron Beck', 'Anna Freud', 'Eric Berne', 'Philippe Pinel', 'Hans Asperger', 'Erik Erikson', 'Phil McGraw']),
  P('Science & Technology', 'surgeon', 'a surgeon', 'any surgeon, of any era', 'Q774306', /surgeon|surgery|physician/i, 10,
    ['Christiaan Barnard', 'Ben Carson', 'Joseph Lister', 'Harvey Cushing', 'Michael DeBakey', 'Denton Cooley', 'Ambroise Paré', 'Atul Gawande', 'Charles Drew', 'Sushruta', 'Thomas Starzl', 'Sanjay Gupta', 'Mehmet Oz', 'John Hunter', 'Theodor Billroth', 'Alfred Blalock']),
  P('Science & Technology', 'civil-engineer', 'a civil engineer', 'any civil engineer or structural engineer, of any era', 'Q13582652', /engineer|architect|builder/i, 8,
    ['Isambard Kingdom Brunel', 'Thomas Telford', 'Gustave Eiffel', 'John A. Roebling', 'Joseph Strauss', 'Washington Roebling', 'Ove Arup', 'Fazlur Khan', 'Joseph Bazalgette', 'John Smeaton', 'Robert Stephenson', 'Santiago Calatrava', 'James Eads', 'Ferdinand de Lesseps', 'Marc Isambard Brunel']),
  P('Science & Technology', 'cosmonaut', 'a cosmonaut', 'any cosmonaut (a Soviet or Russian space traveller), of any era', 'Q12634815 wd:Q11631', /cosmonaut/i, 3,
    ['Yuri Gagarin', 'Valentina Tereshkova', 'Alexei Leonov', 'Gherman Titov', 'Sergei Krikalev', 'Valeri Polyakov', 'Svetlana Savitskaya', 'Gennady Padalka', 'Vladimir Komarov', 'Yuri Malenchenko', 'Oleg Kononenko', 'Pavel Belyayev', 'Anatoly Solovyev', 'Andrian Nikolayev']),
  P('Science & Technology', 'geographer', 'a geographer', 'any geographer, of any era', 'Q901402', /geograph|cartograph|explorer/i, 8,
    ['Alexander von Humboldt', 'Ptolemy', 'Strabo', 'Eratosthenes', 'Carl Ritter', 'Halford Mackinder', 'Gerardus Mercator', 'Paul Vidal de La Blache', 'Ellen Churchill Semple', 'Élisée Reclus', 'Friedrich Ratzel', 'David Harvey', 'William Morris Davis', 'Yi-Fu Tuan']),

  // ================================================================ Music
  P('Music', 'organist', 'an organist', 'any organist (a church, concert or pop/jazz organ player), of any era', 'Q765778', /organ/i, 8,
    ['Johann Sebastian Bach', 'Dieterich Buxtehude', 'Olivier Messiaen', 'Charles-Marie Widor', 'Louis Vierne', 'Marcel Dupré', 'César Franck', 'Jimmy Smith', 'Booker T. Jones', 'Cameron Carpenter', 'Albert Schweitzer', 'Anton Bruckner', 'Felix Mendelssohn', 'Franz Liszt', 'Jehan Alain', 'Ton Koopman']),
  P('Music', 'cellist', 'a cellist', 'any cellist, of any era', 'Q13219637', /cell/i, 5,
    ['Yo-Yo Ma', 'Pablo Casals', 'Mstislav Rostropovich', 'Jacqueline du Pré', 'Steven Isserlis', 'Julian Lloyd Webber', 'Sol Gabetta', 'Lynn Harrell', 'János Starker', 'Pierre Fournier', 'Gregor Piatigorsky', 'Mischa Maisky', 'Truls Mørk', 'Alisa Weilerstein', 'Sheku Kanneh-Mason', 'Emanuel Feuermann', 'Zoë Keating', 'Heinrich Schiff']),
  P('Music', 'flautist', 'a flautist', 'any flautist (flute player), of any era', 'Q12902372', /flut/i, 4,
    ['James Galway', 'Jean-Pierre Rampal', 'Ian Anderson', 'Emmanuel Pahud', 'Marcel Moyse', 'Paul Horn', 'Herbie Mann', 'Wolfgang Schulz', 'Lizzo', 'Severino Gazzelloni', 'Julius Baker', 'Michala Petri', 'Samuel Coles', 'Frederick the Great'].filter((n) => n !== 'Samuel Coles')),
  P('Music', 'trumpeter', 'a trumpeter', 'any trumpet player, of any era', 'Q12377274', /trumpet|jazz|cornet/i, 8,
    ['Louis Armstrong', 'Miles Davis', 'Dizzy Gillespie', 'Wynton Marsalis', 'Chet Baker', 'Herb Alpert', 'Maynard Ferguson', 'Clifford Brown', 'Freddie Hubbard', 'Lee Morgan', 'Roy Eldridge', 'Harry James', 'Chris Botti', 'Arturo Sandoval', 'Hugh Masekela', 'Al Hirt', 'Bix Beiderbecke', 'Doc Severinsen']),
  P('Music', 'saxophonist', 'a saxophonist', 'any saxophone player, of any era', 'Q12800682', /sax/i, 8,
    ['John Coltrane', 'Charlie Parker', 'Sonny Rollins', 'Stan Getz', 'Kenny G', 'Coleman Hawkins', 'Lester Young', 'Cannonball Adderley', 'Ornette Coleman', 'Dexter Gordon', 'Wayne Shorter', 'David Sanborn', 'Clarence Clemons', 'Michael Brecker', 'Branford Marsalis', 'Gerry Mulligan', 'Paul Desmond', 'Candy Dulfer']),
  P('Music', 'clarinetist', 'a clarinetist', 'any clarinet player, of any era', 'Q118865', /clarinet/i, 4,
    ['Benny Goodman', 'Artie Shaw', 'Woody Herman', 'Acker Bilk', 'Sabine Meyer', 'Eric Dolphy', 'Buddy DeFranco', 'Pete Fountain', 'Martin Fröst', 'Jimmy Dorsey', 'Woody Allen', 'Sidney Bechet', 'Johnny Dodds', 'Anton Stadler', 'Richard Mühlfeld']),
  P('Music', 'bandleader', 'a bandleader', 'any bandleader or big-band leader, of any era', 'Q806349', /band|leader|orchestra|conduct/i, 6,
    ['Duke Ellington', 'Count Basie', 'Glenn Miller', 'Benny Goodman', 'Tommy Dorsey', 'Guy Lombardo', 'Lawrence Welk', 'Cab Calloway', 'Artie Shaw', 'Harry James', 'Paul Whiteman', 'Stan Kenton', 'Sun Ra', 'Xavier Cugat', 'Woody Herman', 'Lionel Hampton', 'Fletcher Henderson', 'Chick Webb']),
  P('Music', 'blues-musician', 'a blues musician', 'any blues singer, guitarist or harmonica player, of any era', 'Q42303786', /blues/i, 6,
    ['B.B. King', 'Muddy Waters', 'Robert Johnson', 'John Lee Hooker', 'Howlin\' Wolf', 'Buddy Guy', 'Albert King', 'Stevie Ray Vaughan', 'T-Bone Walker', 'Lead Belly', 'Bessie Smith', 'Willie Dixon', 'Big Bill Broonzy', 'Blind Lemon Jefferson', 'Elmore James', 'Taj Mahal', 'Joe Bonamassa', 'Son House']),

  // ================================================================ Movies & TV
  P('Movies & TV', 'film-producer', 'a film producer', 'any film producer, of any era', 'Q3282637', /producer/i, 15,
    ['Kevin Feige', 'Jerry Bruckheimer', 'Harvey Weinstein', 'Kathleen Kennedy', 'Steven Spielberg', 'George Lucas', 'Samuel Goldwyn', 'David O. Selznick', 'Irwin Winkler', 'Dino De Laurentiis', 'Louis B. Mayer', 'Walt Disney', 'Joel Silver', 'Brian Grazer', 'Jason Blum', 'Scott Rudin', 'Darryl F. Zanuck', 'Cubby Broccoli']),
  P('Movies & TV', 'cinematographer', 'a cinematographer', 'any cinematographer or director of photography, of any era', 'Q222344', /cinematograph|photograph|camera|director of photography/i, 8,
    ['Roger Deakins', 'Emmanuel Lubezki', 'Gordon Willis', 'Vittorio Storaro', 'Janusz Kamiński', 'Robert Richardson', 'Hoyte van Hoytema', 'Conrad Hall', 'Vilmos Zsigmond', 'Jack Cardiff', 'Christopher Doyle', 'Sven Nykvist', 'Greig Fraser', 'Rodrigo Prieto', 'Wally Pfister', 'Bruno Delbonnel', 'Freddie Young', 'Linus Sandgren']),
  P('Movies & TV', 'animator', 'an animator', 'any animator, animation director or cartoonist who makes animated films or series, of any era', 'Q266569', /animat|cartoon/i, 8,
    ['Hayao Miyazaki', 'Chuck Jones', 'Tex Avery', 'Friz Freleng', 'Nick Park', 'Ub Iwerks', 'Richard Williams', 'Don Bluth', 'Genndy Tartakovsky', 'Matt Groening', 'Max Fleischer', 'William Hanna', 'Joseph Barbera', 'Brad Bird', 'John Lasseter', 'Isao Takahata', 'Satoshi Kon', 'Bob Clampett', 'Winsor McCay', 'Mike Judge']),
  P('Movies & TV', 'child-actor', 'a child actor', 'any child actor or former child actor, of any era', 'Q970153', /child|actor|actress/i, 10,
    ['Shirley Temple', 'Macaulay Culkin', 'Drew Barrymore', 'Haley Joel Osment', 'Jackie Coogan', 'Elijah Wood', 'Daniel Radcliffe', 'Dakota Fanning', 'Millie Bobby Brown', 'Natalie Portman', 'Jodie Foster', 'Mickey Rooney', 'Frankie Muniz', 'Mara Wilson', 'Hayley Mills', 'Ron Howard', 'Gary Coleman', 'Anna Paquin', 'Tatum O\'Neal', 'Brooke Shields']),
  P('Movies & TV', 'puppeteer', 'a puppeteer', 'any puppeteer or puppet performer, of any era', 'Q2629392', /puppet/i, 3,
    ['Jim Henson', 'Frank Oz', 'Caroll Spinney', 'Shari Lewis', 'Edgar Bergen', 'Paul Winchell', 'Burr Tillstrom', 'Bil Baird', 'Dave Goelz', 'Steve Whitmire', 'Kevin Clash', 'Richard Hunt', 'Jerry Nelson', 'Sid Krofft', 'Marty Krofft', 'Basil Twist']),
  P('Movies & TV', 'film-critic', 'a film critic', 'any film critic or movie reviewer, of any era', 'Q4220892', /critic|review/i, 6,
    ['Roger Ebert', 'Gene Siskel', 'Pauline Kael', 'Leonard Maltin', 'Richard Roeper', 'Mark Kermode', 'Peter Travers', 'Anthony Lane', 'Andrew Sarris', 'A. O. Scott', 'Peter Bradshaw', 'Manohla Dargis', 'Bosley Crowther', 'François Truffaut', 'Jonathan Rosenbaum', 'Kim Newman']),
]
