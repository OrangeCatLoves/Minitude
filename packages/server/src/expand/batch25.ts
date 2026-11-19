/**
 * Batch 25: History & Mythology and Science & Technology, for the last 228 questions towards 1,000 that the owner asked for on 18 Nov 2026
 * (docs/GROWTH_TO_1000.md). A spread: offices, battles of several wars, philosophers and generals of several countries, scientists by nationality.
 * Build with: npx tsx src/expand/newq.ts --batch batch25 --out C:/Users/weibi/minitude/list-build/batch25
 */
import type { NewQuestion } from './newq'
import { mk } from './batch8'
import { P } from './batch14'
import { describedAs } from './nationality'
import { HUMAN, heldPosition, kindOf, occupation, personForms } from './recipes'

const an = (w: string): string => (/^[aeiou]/i.test(w) ? 'an' : 'a')

/** people by occupation AND country of citizenship (Wikidata P27), for example "a German physicist" */
export const NAT = (cat: string, slug: string, adj: string, noun: string, country: string, occ: string, desc: RegExp, min: number, names: string[], extra: Partial<NewQuestion> = {}): NewQuestion =>
  P(cat, slug, `${an(adj)} ${adj} ${noun}`, `any ${noun} who was a citizen of ${adj === 'British' ? 'the United Kingdom' : adj === 'American' ? 'the United States' : adj} (or its predecessor states), of any era`, occ, describedAs(adj, desc), min, names,
    { pattern: `${occupation(occ)} ${HUMAN} VALUES ?nat { ${country.split(' ').map((c) => 'wd:' + c).join(' ')} } ?item wdt:P27 ?nat .`, ...extra })

/** people who held an office */
export const HOLDER = (cat: string, id: string, prompt: string, what: string, pos: string, minSignal: number, mustHave: string[]): NewQuestion =>
  mk(cat, {
    id, prompt, what, not: 'People who held other offices do not count.',
    source: `People in Wikidata who held the position, known in at least ${minSignal} languages, plus the best-known added by hand.`,
    pattern: heldPosition(pos) + HUMAN, minSignal, mustHave, alsoWritten: personForms,
  })

/** battles that were part of a war (a chain of "part of") */
const BATTLE = (id: string, war: string, q: string, minSignal: number, mustHave: string[]): NewQuestion =>
  mk('History & Mythology', {
    id: `history-battle-${id}`, prompt: `Name a battle of ${war}.`, what: `any battle, siege or major engagement of ${war}`,
    not: 'Battles of other wars do not count.',
    source: `Wikidata battles that are part of ${war}, known in at least ${minSignal} languages.`,
    pattern: `?item wdt:P31/wdt:P279* wd:Q178561 . { ?item wdt:P361 wd:${q} } UNION { ?item wdt:P361/wdt:P361 wd:${q} } UNION { ?item wdt:P361/wdt:P361/wdt:P361 wd:${q} } .`, minSignal, mustHave,
    alsoWritten: (n) => [n.replace(/^(First |Second |Third )?(Battle|Siege) of (the )?/i, '')].filter((x) => x !== n && x.length >= 4),
  })

export const BATCH: NewQuestion[] = [
  // ================================================================ History & Mythology
  HOLDER('History & Mythology', 'history-roman-consul', 'Name a Roman consul.', 'any person who served as a consul of the Roman Republic or Empire', 'Q40779', 3,
    ['Julius Caesar', 'Cicero', 'Pompey', 'Mark Antony', 'Marcus Licinius Crassus', 'Scipio Africanus', 'Sulla', 'Gaius Marius', 'Augustus', 'Cato the Elder', 'Hadrian', 'Trajan', 'Tiberius', 'Nero', 'Marcus Aurelius', 'Lucius Junius Brutus']),
  HOLDER('History & Mythology', 'history-us-speaker-of-the-house', 'Name a Speaker of the United States House of Representatives.', 'any person who has been Speaker of the United States House of Representatives', 'Q912994', 3,
    ['Nancy Pelosi', 'Newt Gingrich', 'John Boehner', 'Paul Ryan', 'Kevin McCarthy', 'Mike Johnson', 'Sam Rayburn', 'Tip O\'Neill', 'Henry Clay', 'Dennis Hastert', 'Tom Foley', 'Jim Wright', 'Carl Albert', 'John W. McCormack', 'Joseph Gurney Cannon', 'James K. Polk']),
  HOLDER('History & Mythology', 'history-japanese-prime-minister', 'Name a prime minister of Japan.', 'any person who has been prime minister of Japan', 'Q274948', 3,
    ['Shinzo Abe', 'Junichiro Koizumi', 'Hideki Tojo', 'Shigeru Yoshida', 'Fumio Kishida', 'Yukio Hatoyama', 'Itō Hirobumi', 'Naoto Kan', 'Yasuhiro Nakasone', 'Kakuei Tanaka', 'Tarō Asō', 'Yoshihide Suga', 'Eisaku Satō', 'Ikeda Hayato', 'Fumimaro Konoe']),
  BATTLE('world-war-i', 'World War I', 'Q361', 6, ['Battle of the Somme', 'Battle of Verdun', 'Battle of Passchendaele', 'Battle of Gallipoli', 'First Battle of the Marne', 'Battle of Jutland', 'Battle of Tannenberg', 'Battle of Cambrai', 'Battle of Ypres', 'Battle of Caporetto', 'Second Battle of the Marne', 'Battle of Vimy Ridge', 'Battle of Amiens']),
  BATTLE('napoleonic-wars', 'the Napoleonic Wars', 'Q78994', 5, ['Battle of Waterloo', 'Battle of Austerlitz', 'Battle of Trafalgar', 'Battle of Borodino', 'Battle of Leipzig', 'Battle of Jena', 'Battle of Wagram', 'Battle of the Nile', 'Battle of Marengo', 'Battle of Friedland', 'Battle of Salamanca', 'Battle of Copenhagen']),
  BATTLE('american-revolution', 'the American Revolutionary War', 'Q40949', 3, ['Battle of Saratoga', 'Battle of Yorktown', 'Battle of Bunker Hill', 'Battles of Lexington and Concord', 'Battle of Trenton', 'Battle of Long Island', 'Battle of Brandywine', 'Battle of Cowpens', 'Siege of Boston', 'Battle of Princeton', 'Battle of Germantown', 'Battle of Monmouth']),
  BATTLE('hundred-years-war', 'the Hundred Years\' War', 'Q12551', 3, ['Battle of Agincourt', 'Battle of Crécy', 'Battle of Poitiers', 'Siege of Orléans', 'Battle of Sluys', 'Battle of Castillon', 'Battle of Patay', 'Siege of Calais', 'Battle of Formigny', 'Battle of Verneuil', 'Battle of Cravant']),
  BATTLE('crusades', 'the Crusades', 'Q12546', 3, ['Siege of Jerusalem', 'Battle of Hattin', 'Siege of Acre', 'Battle of Arsuf', 'Siege of Antioch', 'Battle of Ascalon', 'Battle of Ager Sanguinis', 'Siege of Damietta', 'Battle of Montgisard', 'Fall of Acre', 'Siege of Edessa']),
  BATTLE('vietnam-war', 'the Vietnam War', 'Q8740', 3, ['Battle of Dien Bien Phu', 'Tet Offensive', 'Battle of Khe Sanh', 'Battle of Hue', 'Battle of Ia Drang', 'Battle of Hamburger Hill', 'Siege of Khe Sanh', 'Operation Rolling Thunder', 'Fall of Saigon', 'Easter Offensive', 'Operation Linebacker', 'Battle of Long Tan']),
  BATTLE('korean-war', 'the Korean War', 'Q8663', 3, ['Battle of Inchon', 'Battle of Chosin Reservoir', 'Battle of Pusan Perimeter', 'Battle of Osan', 'Battle of Heartbreak Ridge', 'Battle of Triangle Hill', 'Battle of the Imjin River', 'Battle of Bloody Ridge', 'Battle of Pork Chop Hill', 'Battle of Kapyong', 'Battle of Unsan']),
  BATTLE('punic-wars', 'the Punic Wars', 'Q124988', 3, ['Battle of Cannae', 'Battle of Zama', 'Battle of Trebia', 'Battle of Lake Trasimene', 'Siege of Carthage', 'Battle of Ecnomus', 'Battle of Metaurus', 'Battle of the Aegates Islands', 'Siege of Syracuse', 'Battle of Ticinus', 'Battle of Baecula']),
  mk('History & Mythology', {
    id: 'history-roman-province', prompt: 'Name a province of the Roman Empire.', what: 'any province or territory of the Roman Republic or Empire, by its Latin or English name',
    not: 'Modern provinces and cities do not count.',
    source: 'Wikidata Roman provinces, known in at least 3 languages.',
    pattern: kindOf('Q182547'), minSignal: 3,
    mustHave: ['Gaul', 'Britannia', 'Hispania', 'Aegyptus', 'Syria', 'Dacia', 'Germania', 'Judaea', 'Macedonia', 'Asia', 'Africa', 'Achaea', 'Cappadocia', 'Pannonia', 'Dalmatia', 'Mauretania', 'Cyprus', 'Cilicia', 'Moesia', 'Raetia', 'Noricum', 'Lusitania'],
    alsoWritten: (n) => [n.replace(/^(Roman )?(province of )?/i, '').replace(/ \(Roman province\)$/i, '')].filter((x) => x !== n && x.length >= 3),
  }),
  P('History & Mythology', 'conquistador', 'a conquistador', 'any Spanish or Portuguese conquistador or early colonial conqueror, of any era', 'Q126236', /conquistador|conqueror|explorer|soldier|colonial/i, 5,
    ['Hernán Cortés', 'Francisco Pizarro', 'Pedro de Alvarado', 'Hernando de Soto', 'Juan Ponce de León', 'Francisco de Orellana', 'Diego de Almagro', 'Pánfilo de Narváez', 'Vasco Núñez de Balboa', 'Francisco Vázquez de Coronado', 'Pedro de Valdivia', 'Gonzalo Pizarro']),
  P('History & Mythology', 'abolitionist', 'an abolitionist', 'any person who campaigned to end slavery, of any era', 'Q12526417', /abolition/i, 6,
    ['Frederick Douglass', 'Harriet Tubman', 'William Wilberforce', 'John Brown', 'Sojourner Truth', 'William Lloyd Garrison', 'Harriet Beecher Stowe', 'Olaudah Equiano', 'Thomas Clarkson', 'Abraham Lincoln', 'Elizabeth Heyrick', 'Lucretia Mott']),
  P('History & Mythology', 'suffragette', 'a suffragette or suffragist', 'any campaigner for votes for women, of any era', 'Q322170', /suffrag/i, 5,
    ['Emmeline Pankhurst', 'Emily Davison', 'Susan B. Anthony', 'Elizabeth Cady Stanton', 'Millicent Fawcett', 'Christabel Pankhurst', 'Sylvia Pankhurst', 'Alice Paul', 'Lucy Burns', 'Constance Markievicz', 'Sophia Duleep Singh', 'Lucretia Mott']),
  NAT('History & Mythology', 'german-philosopher', 'German', 'philosopher', 'Q183', 'Q4964182', /philosoph/i, 8, ['Immanuel Kant', 'Georg Wilhelm Friedrich Hegel', 'Friedrich Nietzsche', 'Karl Marx', 'Arthur Schopenhauer', 'Martin Heidegger', 'Jürgen Habermas', 'Edmund Husserl', 'Gottfried Wilhelm Leibniz', 'Hannah Arendt', 'Theodor Adorno', 'Ludwig Feuerbach', 'Friedrich Schelling', 'Johann Gottlieb Fichte'], { extras: [{ name: 'Immanuel Kant', signal: 100, aliases: ['Kant'] }] }),
  NAT('History & Mythology', 'french-philosopher', 'French', 'philosopher', 'Q142', 'Q4964182', /philosoph/i, 8, ['René Descartes', 'Voltaire', 'Jean-Jacques Rousseau', 'Jean-Paul Sartre', 'Simone de Beauvoir', 'Michel Foucault', 'Albert Camus', 'Blaise Pascal', 'Denis Diderot', 'Montesquieu', 'Auguste Comte', 'Jacques Derrida', 'Henri Bergson', 'Michel de Montaigne']),
  NAT('History & Mythology', 'british-philosopher', 'British', 'philosopher', 'Q145', 'Q4964182', /philosoph/i, 8, ['John Locke', 'David Hume', 'Thomas Hobbes', 'Bertrand Russell', 'John Stuart Mill', 'Jeremy Bentham', 'Francis Bacon', 'George Berkeley', 'Adam Smith', 'Thomas More', 'Ludwig Wittgenstein', 'Isaiah Berlin', 'Mary Wollstonecraft', 'G. E. Moore']),
  NAT('History & Mythology', 'american-general', 'American', 'general', 'Q30', 'Q189290', /general/i, 10, ['George Washington', 'Ulysses S. Grant', 'Robert E. Lee', 'Dwight D. Eisenhower', 'Douglas MacArthur', 'George S. Patton', 'Colin Powell', 'William Tecumseh Sherman', 'Omar Bradley', 'Stonewall Jackson', 'John J. Pershing', 'George Custer', 'Norman Schwarzkopf', 'David Petraeus']),
  NAT('History & Mythology', 'french-general', 'French', 'general', 'Q142', 'Q189290', /general|marshal/i, 8, ['Napoleon', 'Charles de Gaulle', 'Philippe Pétain', 'Ferdinand Foch', 'Joseph Joffre', 'Lafayette', 'Michel Ney', 'Joachim Murat', 'Louis-Nicolas Davout', 'Georges Boulanger', 'Jean Lannes', 'Philippe Leclerc de Hauteclocque'], { extras: [{ name: 'Napoleon', signal: 130, aliases: ['Napoleon Bonaparte', 'Napoleon I', 'Napoléon Bonaparte'] }] }),
  NAT('History & Mythology', 'german-general', 'German', 'general', 'Q183', 'Q189290', /general|field marshal/i, 8, ['Erwin Rommel', 'Helmuth von Moltke', 'Paul von Hindenburg', 'Erich Ludendorff', 'Heinz Guderian', 'Erich von Manstein', 'Gerhard von Scharnhorst', 'Carl von Clausewitz', 'Gebhard Leberecht von Blücher', 'Wilhelm Keitel', 'Claus von Stauffenberg', 'Albert Kesselring']),
  NAT('History & Mythology', 'british-general', 'British', 'general', 'Q145', 'Q189290', /general|field marshal/i, 8, ['Duke of Wellington', 'Bernard Montgomery', 'Horatio Kitchener', 'Douglas Haig', 'John Churchill', 'Harold Alexander', 'William Slim', 'Charles Cornwallis', 'Charles George Gordon', 'Garnet Wolseley', 'Edmund Allenby', 'Orde Wingate']),

  // ================================================================ Science & Technology
  NAT('Science & Technology', 'german-physicist', 'German', 'physicist', 'Q183', 'Q169470', /physicist/i, 8, ['Albert Einstein', 'Max Planck', 'Werner Heisenberg', 'Max Born', 'Wilhelm Röntgen', 'Heinrich Hertz', 'Erwin Schrödinger', 'Gustav Kirchhoff', 'Hermann von Helmholtz', 'Ernst Mach', 'Otto Stern', 'Hans Bethe', 'Arnold Sommerfeld', 'Wolfgang Pauli']),
  NAT('Science & Technology', 'british-physicist', 'British', 'physicist', 'Q145', 'Q169470', /physicist/i, 8, ['Isaac Newton', 'Stephen Hawking', 'Michael Faraday', 'James Clerk Maxwell', 'Paul Dirac', 'Ernest Rutherford', 'J. J. Thomson', 'Lord Kelvin', 'Peter Higgs', 'Brian Cox', 'James Chadwick', 'Roger Penrose', 'Robert Hooke', 'Patrick Blackett']),
  NAT('Science & Technology', 'italian-physicist', 'Italian', 'physicist', 'Q38', 'Q169470', /physicist/i, 5, ['Galileo Galilei', 'Enrico Fermi', 'Alessandro Volta', 'Guglielmo Marconi', 'Evangelista Torricelli', 'Amedeo Avogadro', 'Carlo Rubbia', 'Ettore Majorana', 'Bruno Pontecorvo', 'Giuseppe Occhialini', 'Emilio Segrè', 'Giovanni Battista Venturi']),
  NAT('Science & Technology', 'french-mathematician', 'French', 'mathematician', 'Q142', 'Q170790', /mathematic/i, 8, ['Blaise Pascal', 'Pierre de Fermat', 'René Descartes', 'Pierre-Simon Laplace', 'Joseph-Louis Lagrange', 'Henri Poincaré', 'Évariste Galois', 'Augustin-Louis Cauchy', 'Joseph Fourier', 'Benoit Mandelbrot', 'Sophie Germain', 'Jean le Rond d\'Alembert', 'Adrien-Marie Legendre', 'Gaspard Monge']),
  NAT('Science & Technology', 'german-mathematician', 'German', 'mathematician', 'Q183', 'Q170790', /mathematic/i, 8, ['Carl Friedrich Gauss', 'Bernhard Riemann', 'David Hilbert', 'Gottfried Wilhelm Leibniz', 'Emmy Noether', 'Leonhard Euler', 'Georg Cantor', 'Felix Klein', 'Karl Weierstrass', 'Richard Dedekind', 'Carl Gustav Jacobi', 'Hermann Weyl', 'Johannes Kepler', 'Max Noether']),
  NAT('Science & Technology', 'russian-mathematician', 'Russian', 'mathematician', 'Q159', 'Q170790', /mathematic/i, 6, ['Grigori Perelman', 'Andrey Kolmogorov', 'Nikolai Lobachevsky', 'Sofya Kovalevskaya', 'Pafnuty Chebyshev', 'Andrey Markov', 'Israel Gelfand', 'Vladimir Arnold', 'Dmitri Mendeleev', 'Alexander Friedmann', 'Lev Pontryagin', 'Pavel Alexandrov']),
  NAT('Science & Technology', 'french-chemist', 'French', 'chemist', 'Q142', 'Q593644', /chemist/i, 8, ['Antoine Lavoisier', 'Marie Curie', 'Louis Pasteur', 'Henri Becquerel', 'Joseph Louis Gay-Lussac', 'Claude Louis Berthollet', 'Marcellin Berthelot', 'Pierre Curie', 'Victor Grignard', 'Paul Sabatier', 'Henri Moissan', 'Paul Langevin', 'Yves Chauvin']),
  NAT('Science & Technology', 'german-chemist', 'German', 'chemist', 'Q183', 'Q593644', /chemist/i, 8, ['Justus von Liebig', 'Friedrich Wöhler', 'Robert Bunsen', 'Fritz Haber', 'Otto Hahn', 'Hermann Staudinger', 'August Kekulé', 'Emil Fischer', 'Carl Bosch', 'Walther Nernst', 'Wilhelm Ostwald', 'Hans Fischer', 'Adolf von Baeyer', 'Friedrich August Kekulé']),
  NAT('Science & Technology', 'american-inventor', 'American', 'inventor', 'Q30', 'Q205375', /inventor/i, 10, ['Thomas Edison', 'Benjamin Franklin', 'Alexander Graham Bell', 'Wright brothers', 'Samuel Morse', 'Eli Whitney', 'George Washington Carver', 'Nikola Tesla', 'Elon Musk', 'Steve Jobs', 'Henry Ford', 'Cyrus McCormick', 'Robert Fulton', 'Elisha Otis']),
  NAT('Science & Technology', 'british-inventor', 'British', 'inventor', 'Q145', 'Q205375', /inventor/i, 8, ['James Watt', 'Tim Berners-Lee', 'Alexander Fleming', 'Isambard Kingdom Brunel', 'Richard Arkwright', 'George Stephenson', 'John Logie Baird', 'Frank Whittle', 'James Dyson', 'Charles Babbage', 'Thomas Newcomen', 'Henry Bessemer', 'Clive Sinclair', 'Trevor Baylis']),
  NAT('Science & Technology', 'indian-scientist', 'Indian', 'scientist', 'Q668', 'Q901', /scientist|physicist|chemist|biolog|mathematic|astronom/i, 8, ['C. V. Raman', 'A. P. J. Abdul Kalam', 'Srinivasa Ramanujan', 'Homi J. Bhabha', 'Jagadish Chandra Bose', 'Vikram Sarabhai', 'Subrahmanyan Chandrasekhar', 'Satyendra Nath Bose', 'Meghnad Saha', 'Har Gobind Khorana', 'Venkatraman Ramakrishnan', 'Raja Ramanna']),
  NAT('Science & Technology', 'chinese-scientist', 'Chinese', 'scientist', 'Q148', 'Q901', /scientist|physicist|chemist|biolog|mathematic|astronom|engineer/i, 8, ['Qian Xuesen', 'Tu Youyou', 'Yang Chen-Ning', 'Tsung-Dao Lee', 'Chien-Shiung Wu', 'Yuan Longping', 'Zhang Heng', 'Shen Kuo', 'Zu Chongzhi', 'Terence Tao', 'Charles Kao', 'Samuel Chao Chung Ting']),
  mk('Science & Technology', {
    id: 'science-antibiotic', prompt: 'Name an antibiotic.', what: 'any antibiotic, antibacterial drug or class of antibiotics, by its generic name or its class',
    not: 'Antivirals, antifungals and vaccines do not count.',
    source: 'Wikidata antibiotics, known in at least 4 languages.',
    pattern: kindOf('Q12187'), minSignal: 4,
    mustHave: ['Penicillin', 'Amoxicillin', 'Azithromycin', 'Ciprofloxacin', 'Tetracycline', 'Streptomycin', 'Vancomycin', 'Doxycycline', 'Erythromycin', 'Cephalexin', 'Gentamicin', 'Clindamycin', 'Metronidazole', 'Chloramphenicol', 'Methicillin', 'Ampicillin', 'Rifampicin', 'Levofloxacin', 'Neomycin', 'Linezolid'],
  }),
  mk('Science & Technology', {
    id: 'science-linux-distribution', prompt: 'Name a Linux distribution.', what: 'any Linux distribution, past or present, by its name',
    not: 'Other operating systems do not count.',
    source: 'Wikidata Linux distributions, known in at least 4 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q131669 .', minSignal: 4,
    mustHave: ['Ubuntu', 'Debian', 'Fedora', 'Arch Linux', 'Red Hat Enterprise Linux', 'Linux Mint', 'openSUSE', 'CentOS', 'Gentoo', 'Slackware', 'Kali Linux', 'Manjaro', 'Elementary OS', 'Raspberry Pi OS', 'Tails', 'Alpine Linux', 'Pop!_OS', 'Zorin OS', 'Mageia', 'Puppy Linux'],
  }),
  mk('Science & Technology', {
    id: 'science-software-company', prompt: 'Name a software company.', what: 'any company that mainly develops and sells software, past or present',
    not: 'Hardware makers and game studios do not count unless they are mainly software companies.',
    source: 'Wikidata software companies, known in at least 8 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q1058914 .', minSignal: 8,
    mustHave: ['Microsoft', 'Oracle Corporation', 'SAP', 'Adobe Inc.', 'Salesforce', 'Autodesk', 'Intuit', 'VMware', 'Symantec', 'Red Hat', 'Atlassian', 'Palantir Technologies', 'Dassault Systèmes', 'Citrix Systems', 'Borland', 'Novell', 'Sage Group', 'Kaspersky Lab', 'ServiceNow', 'Workday'],
  }),
]
