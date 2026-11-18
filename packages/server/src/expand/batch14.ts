/**
 * Batch 14: sports people by occupation (the recipe that works best, docs/ANSWER_LISTS.md), for the 250 questions the owner asked for on 18 Nov 2026.
 * The owner's target is 1,000 questions in all (docs/GROWTH_TO_1000.md): Sports and Transport are the thinnest categories.
 * Build with: npx tsx src/expand/newq.ts --batch batch14 --out C:/Users/weibi/minitude/list-build/batch14
 */
import type { NewQuestion } from './newq'
import { PERSON } from './batch9'

/** a person by occupation; `occ` may name several occupations: 'Q1 wd:Q2' */
export const P = (cat: string, slug: string, a: string, what: string, occ: string, desc: RegExp, min: number, names: string[], extra: Partial<NewQuestion> = {}): NewQuestion =>
  PERSON(cat, `${cat === 'Sports' ? 'sports' : cat === 'Science & Technology' ? 'science' : cat === 'Movies & TV' ? 'movies' : cat === 'Music' ? 'music' : cat === 'History & Mythology' ? 'history' : 'misc'}-${slug}`,
    `Name ${a}.`, what, occ, desc, min, names, extra)

export const BATCH: NewQuestion[] = [
  P('Sports', 'sprinter', 'a sprinter', 'any sprinter (a 100 m, 200 m or 400 m runner), of any era', 'Q4009406', /sprint|runner|athlet|track/i, 10,
    ['Usain Bolt', 'Carl Lewis', 'Jesse Owens', 'Florence Griffith Joyner', 'Michael Johnson', 'Justin Gatlin', 'Asafa Powell', 'Yohan Blake', 'Maurice Greene', 'Marion Jones', 'Shelly-Ann Fraser-Pryce', 'Allyson Felix', 'Tyson Gay', 'Noah Lyles', 'Christian Coleman', 'Wilma Rudolph', 'Linford Christie', 'Ben Johnson']),
  P('Sports', 'distance-runner', 'a long-distance or marathon runner', 'any long-distance, middle-distance or marathon runner, of any era', 'Q4439155 wd:Q13382460 wd:Q13381753', /runner|athlet|marathon|distance/i, 10,
    ['Eliud Kipchoge', 'Mo Farah', 'Haile Gebrselassie', 'Kenenisa Bekele', 'Paavo Nurmi', 'Emil Zátopek', 'Steve Prefontaine', 'Abebe Bikila', 'Paula Radcliffe', 'Sifan Hassan', 'Roger Bannister', 'Sebastian Coe', 'Steve Ovett', 'Joshua Cheptegei', 'Tirunesh Dibaba', 'Faith Kipyegon', 'Hicham El Guerrouj', 'Lasse Virén']),
  P('Sports', 'hurdler', 'a hurdler', 'any hurdler (110 m, 100 m or 400 m hurdles), of any era', 'Q13724897', /hurdl|athlet|runner/i, 6,
    ['Edwin Moses', 'Colin Jackson', 'Liu Xiang', 'Sydney McLaughlin-Levrone', 'Allen Johnson', 'Renaldo Nehemiah', 'Roger Kingdom', 'Kevin Young', 'Dawn Harper', 'Sally Pearson', 'Aries Merritt', 'Gail Devers', 'Lolo Jones', 'Dayron Robles']),
  P('Sports', 'high-jumper', 'a high jumper', 'any high jumper, of any era', 'Q13382122', /high jump|jumper|athlet/i, 6,
    ['Javier Sotomayor', 'Dick Fosbury', 'Stefka Kostadinova', 'Blanka Vlašić', 'Mutaz Essa Barshim', 'Gianmarco Tamberi', 'Valeriy Brumel', 'Patrik Sjöberg', 'Dwight Stones', 'Iolanda Balaș']),
  P('Sports', 'long-jumper', 'a long jumper', 'any long jumper or triple jumper, of any era', 'Q13381428 wd:Q13848274', /jump|athlet/i, 6,
    ['Bob Beamon', 'Carl Lewis', 'Mike Powell', 'Jesse Owens', 'Jonathan Edwards', 'Galina Chistyakova', 'Heike Drechsler', 'Ivan Pedroso', 'Dwight Phillips', 'Lutz Dombrowski', 'Jackie Joyner-Kersee', 'Fabrice Lapierre']),
  P('Sports', 'shot-putter', 'a shot putter', 'any shot putter, of any era', 'Q18534714', /shot|putter|athlet|thrower/i, 6,
    ['Ryan Crouser', 'Randy Barnes', 'Parry O\'Brien', 'Adam Nelson', 'Tom Walsh', 'Valerie Adams', 'Tomasz Majewski', 'Joe Kovacs', 'Natalya Lisovskaya', 'Brian Oldfield', 'Udo Beyer']),
  P('Sports', 'discus-thrower', 'a discus thrower', 'any discus thrower, of any era', 'Q13381689', /discus|thrower|athlet/i, 6,
    ['Al Oerter', 'Jürgen Schult', 'Virgilijus Alekna', 'Robert Harting', 'Daniel Ståhl', 'Sandra Perković', 'Mac Wilkins', 'Lars Riedel', 'Ludvík Daněk', 'Mykolas Alekna', 'Kristjan Čeh']),
  P('Sports', 'javelin-thrower', 'a javelin thrower', 'any javelin thrower, of any era', 'Q18510502', /javelin|thrower|athlet/i, 6,
    ['Neeraj Chopra', 'Jan Železný', 'Tero Pitkämäki', 'Johannes Vetter', 'Barbora Špotáková', 'Thomas Röhler', 'Keshorn Walcott', 'Andreas Thorkildsen', 'Steve Backley', 'Arshad Nadeem', 'Julius Yego', 'Kelsey-Lee Barber']),
  P('Sports', 'pole-vaulter', 'a pole vaulter', 'any pole vaulter, of any era', 'Q13464497', /pole|vault|athlet/i, 6,
    ['Armand Duplantis', 'Sergey Bubka', 'Yelena Isinbayeva', 'Renaud Lavillenie', 'Brian Sternberg', 'Steve Hooker', 'Katie Moon', 'Sam Kendricks', 'Thiago Braz', 'Maksim Tarasov', 'Jean Galfione', 'Okkert Brits', 'Bob Richards']),
  P('Sports', 'decathlete', 'a decathlete or heptathlete', 'any decathlete or heptathlete (a multi-event track and field athlete), of any era', 'Q21141381', /decathl|heptathl|multi|athlet/i, 5,
    ['Daley Thompson', 'Ashton Eaton', 'Jackie Joyner-Kersee', 'Bruce Jenner', 'Roman Šebrle', 'Dan O\'Brien', 'Kevin Mayer', 'Jim Thorpe', 'Bob Mathias', 'Nafissatou Thiam', 'Jessica Ennis-Hill', 'Carolina Klüft', 'Rafer Johnson', 'Damian Warner', 'Mary Peters']),
  P('Sports', 'speed-skater', 'a speed skater', 'any speed skater (long track or short track), of any era', 'Q10866633', /skater|speed/i, 6,
    ['Eric Heiden', 'Bonnie Blair', 'Dan Jansen', 'Sven Kramer', 'Claudia Pechstein', 'Apolo Ohno', 'Shani Davis', 'Ireen Wüst', 'Lidiya Skoblikova', 'Yevgeny Grishin', 'Gianni Romme', 'Johann Olav Koss', 'Jorien ter Mors', 'Nils van der Poel']),
  P('Sports', 'biathlete', 'a biathlete', 'any biathlete, of any era', 'Q16029547', /biathl/i, 5,
    ['Ole Einar Bjørndalen', 'Martin Fourcade', 'Johannes Thingnes Bø', 'Magdalena Neuner', 'Darya Domracheva', 'Kaisa Mäkäräinen', 'Laura Dahlmeier', 'Tora Berger', 'Emil Hegle Svendsen', 'Raphaël Poirée', 'Sven Fischer', 'Anastasiya Kuzmina', 'Uschi Disl']),
  P('Sports', 'cross-country-skier', 'a cross-country skier', 'any cross-country skier, of any era', 'Q13382608', /cross-country|nordic|ski marathon/i, 8,
    ['Bjørn Dæhlie', 'Marit Bjørgen', 'Petter Northug', 'Thérèse Johaug', 'Gunde Svan', 'Johannes Høsflot Klæbo', 'Charlotte Kalla', 'Aleksandr Bolshunov', 'Vegard Ulvang', 'Raisa Smetanina', 'Yulia Chepalova']),
  P('Sports', 'ski-jumper', 'a ski jumper', 'any ski jumper, of any era', 'Q13382603', /ski jump/i, 5,
    ['Matti Nykänen', 'Adam Małysz', 'Kamil Stoch', 'Simon Ammann', 'Jens Weißflog', 'Gregor Schlierenzauer', 'Thomas Morgenstern', 'Janne Ahonen', 'Eddie Edwards', 'Sven Hannawald', 'Ryōyū Kobayashi', 'Noriaki Kasai', 'Stefan Kraft', 'Andreas Goldberger', 'Dawid Kubacki']),
  P('Sports', 'handball-player', 'a handball player', 'any handball player, of any era', 'Q12840545', /handball/i, 5,
    ['Nikola Karabatić', 'Mikkel Hansen', 'Ivano Balić', 'Domagoj Duvnjak', 'Talant Dujshebaev', 'Daniel Narcisse', 'Luc Abalo', 'Thierry Omeyer', 'Sander Sagosen', 'Magnus Wislander', 'Bertrand Gille', 'Nora Mørk', 'Cristina Neagu', 'Anita Görbicz']),
  P('Sports', 'water-polo-player', 'a water polo player', 'any water polo player, of any era', 'Q17524364', /water polo/i, 3,
    ['Maggie Steffens', 'Tony Azevedo', 'Dejan Savić', 'Manuel Estiarte', 'Aleksandar Šapić', 'Tamás Kásás', 'Felipe Perrone', 'Gergely Kiss', 'Maica García', 'Tibor Benedek', 'Ashleigh Johnson', 'Andrija Prlainović']),
  P('Sports', 'field-hockey-player', 'a field hockey player', 'any field hockey player, of any era', 'Q10843263', /field hockey/i, 4,
    ['Dhyan Chand', 'Sohail Abbas', 'Teun de Nooijer', 'Jamie Dwyer', 'Luciana Aymar', 'Pirmin Blaak', 'P. R. Sreejesh', 'Moritz Fürste', 'Harmanpreet Singh', 'Rani Rampal', 'Barry Middleton', 'Kate Richardson-Walsh', 'Dhanraj Pillay']),
  P('Sports', 'canoeist', 'a canoeist or kayaker', 'any canoeist, canoe sprinter, slalom paddler or kayaker, of any era', 'Q13382566', /canoe|kayak|paddl/i, 4,
    ['Birgit Fischer', 'Ian Ferguson', 'Greg Barton', 'Ken Wallace', 'Lisa Carrington', 'Murray Stewart', 'Marcus Walz', 'Marcus Groß', 'Mathieu Goubel', 'Eirik Verås Larsen', 'Ivan Patzaichin', 'Sebastian Brendel']),
  P('Sports', 'equestrian', 'an equestrian rider', 'any equestrian rider (a show jumper, dressage rider or eventing rider), of any era', 'Q2730732', /rider|equest|jump|dressage|event/i, 6,
    ['Charlotte Dujardin', 'Isabell Werth', 'Michael Jung', 'Nick Skelton', 'Ben Maher', 'Piero D\'Inzeo', 'Ludger Beerbaum', 'Hans Günter Winkler', 'Zara Phillips', 'Mark Todd', 'Reiner Klimke', 'Anky van Grunsven', 'Meredith Michaels-Beerbaum', 'Edwina Tops-Alexander', 'Princess Anne']),
  P('Sports', 'archer', 'an archer', 'any competitive archer, of any era', 'Q13382355', /archer/i, 4,
    ['Kim Soo-nyung', 'Brady Ellison', 'Kim Woo-jin', 'Darrell Pace', 'Jay Barrs', 'Justin Huish', 'Lee Sung-jin', 'Gu Bon-chan', 'Zhang Juanjuan', 'Oh Jin-hyek', 'Park Sung-hyun', 'Deepika Kumari', 'Reo Wilde']),
  P('Sports', 'sport-shooter', 'a sport shooter', 'any competitive sport shooter (rifle, pistol or shotgun), of any era', 'Q17486376', /shoot/i, 5,
    ['Kim Rhode', 'Gagan Narang', 'Abhinav Bindra', 'Matthew Emmons', 'Jin Jong-oh', 'Vincent Hancock', 'Niccolò Campriani', 'Pang Wei', 'Katerina Emmons', 'Manu Bhaker', 'Rajyavardhan Singh Rathore', 'Luciano Giovannetti']),
  P('Sports', 'kickboxer', 'a kickboxer', 'any kickboxer or Muay Thai fighter, of any era', 'Q11296761', /kickbox|muay thai|thai box/i, 6,
    ['Buakaw Banchamek', 'Ramon Dekkers', 'Peter Aerts', 'Ernesto Hoost', 'Semmy Schilt', 'Badr Hari', 'Rico Verhoeven', 'Giorgio Petrosyan', 'Remy Bonjasky', 'Mirko Cro Cop', 'Andy Hug', 'Alistair Overeem', 'Gökhan Saki', 'Sitthichai Sitsongpeenong']),
  P('Sports', 'karateka', 'a karateka', 'any karateka (karate practitioner or competitor), of any era', 'Q9017214', /karate/i, 4,
    ['Gichin Funakoshi', 'Masutatsu Oyama', 'Chuck Norris', 'Lyoto Machida', 'Bill Wallace', 'Joe Lewis', 'Rika Usami', 'Gōgen Yamaguchi', 'Hirokazu Kanazawa', 'Kenwa Mabuni', 'Chōjun Miyagi', 'Anko Itosu']),
  P('Sports', 'rugby-league-player', 'a rugby league player', 'any rugby league player, of any era', 'Q14373094', /rugby league/i, 3,
    ['Wally Lewis', 'Andrew Johns', 'Darren Lockyer', 'Johnathan Thurston', 'Cameron Smith', 'Billy Slater', 'Sam Burgess', 'Brad Fittler', 'Greg Inglis', 'Mal Meninga', 'Allan Langer', 'Shaun Johnson', 'Sonny Bill Williams']),
  P('Sports', 'racing-driver', 'a racing driver', 'any racing driver (a driver in Formula One, IndyCar, NASCAR, sports cars, touring cars or rallying), of any era', 'Q378622', /driver|racer|racing|rally/i, 15,
    ['Michael Schumacher', 'Ayrton Senna', 'Lewis Hamilton', 'Sebastian Vettel', 'Fernando Alonso', 'Max Verstappen', 'Alain Prost', 'Niki Lauda', 'Juan Manuel Fangio', 'Jim Clark', 'Jackie Stewart', 'Mario Andretti', 'Dale Earnhardt', 'Richard Petty', 'Jeff Gordon', 'Kimi Räikkönen', 'Sébastien Loeb', 'A. J. Foyt', 'Tazio Nuvolari', 'Stirling Moss']),
  P('Sports', 'rally-driver', 'a rally driver', 'any rally driver or rally co-driver, of any era', 'Q10842936', /rally|driver/i, 5,
    ['Sébastien Loeb', 'Sébastien Ogier', 'Colin McRae', 'Carlos Sainz', 'Tommi Mäkinen', 'Marcus Grönholm', 'Petter Solberg', 'Walter Röhrl', 'Juha Kankkunen', 'Ari Vatanen', 'Kalle Rovanperä', 'Ott Tänak', 'Thierry Neuville', 'Hannu Mikkola', 'Miki Biasion']),
  P('Sports', 'american-football-coach', 'an American football coach', 'any American football head coach or coordinator, at any level, of any era', 'Q42331263', /coach/i, 8,
    ['Bill Belichick', 'Vince Lombardi', 'Don Shula', 'Tom Landry', 'Bill Walsh', 'Joe Gibbs', 'Andy Reid', 'Mike Tomlin', 'Pete Carroll', 'Bear Bryant', 'Nick Saban', 'George Halas', 'Paul Brown', 'Sean Payton', 'Chuck Noll', 'Bill Parcells', 'John Madden', 'Bud Grant']),
  P('Sports', 'basketball-coach', 'a basketball coach', 'any basketball head coach, at any level, of any era', 'Q5137571', /coach/i, 8,
    ['Phil Jackson', 'Gregg Popovich', 'Pat Riley', 'Red Auerbach', 'Mike Krzyzewski', 'John Wooden', 'Steve Kerr', 'Erik Spoelstra', 'Larry Brown', 'Chuck Daly', 'Doc Rivers', 'Jerry Sloan', 'Don Nelson', 'Bob Knight', 'Lenny Wilkens', 'Rick Pitino', 'Dean Smith', 'Jim Boeheim']),
  P('Sports', 'baseball-manager', 'a baseball manager', 'any baseball manager, of any era', 'Q1186921', /manager|coach/i, 5,
    ['Joe Torre', 'Tony La Russa', 'Connie Mack', 'Casey Stengel', 'Sparky Anderson', 'Joe McCarthy', 'John McGraw', 'Bobby Cox', 'Earl Weaver', 'Walter Alston', 'Tommy Lasorda', 'Dusty Baker', 'Terry Francona', 'Leo Durocher', 'Billy Martin', 'Bruce Bochy', 'Yogi Berra', 'Joe Maddon']),
]
