/**
 * Batch 18: Animals & Nature and Food, for the 250 questions the owner asked for on 18 Nov 2026 (docs/GROWTH_TO_1000.md).
 * Build with: npx tsx src/expand/newq.ts --batch batch18 --out C:/Users/weibi/minitude/list-build/batch18
 */
import type { NewQuestion } from './newq'
import { namedBelow, TAXON } from './batch6'
import { dishesOf, mk } from './batch8'
import { kindOf, nameIs } from './recipes'

const an = (w: string): string => (/^[aeiou]/i.test(w) ? 'an' : 'a')

/** a group of living things named by their English common names (Batch 6, lessons 26 to 29 and 36) */
const GROUP = (id: string, prompt: string, what: string, roots: string[], min: number, subject: RegExp, mustHave: string[], not = 'Animals or plants of other groups do not count.', extra: Partial<NewQuestion> = {}): NewQuestion =>
  mk('Animals & Nature', {
    id: `animals-${id}`, prompt, what, not,
    source: `Wikidata taxa below the group, with an English common name, known in at least ${min} languages.`,
    fetch: namedBelow(roots, min), commonNames: true, minSignal: min, skip: TAXON(subject), mustHave, ...extra,
  })

/** dishes of a national cuisine (Batch 5, lesson 20: only if the item is a dish) */
const DISH = (id: string, adj: string, label: string, cuisines: string[], countries: string[], mustHave: string[], direct = false): NewQuestion =>
  mk('Food', {
    id: `food-${id}-dish`, prompt: `Name ${an(adj)} ${adj} dish.`, what: `any dish, snack, bread or dessert of ${label} cuisine, or eaten as a national dish there`,
    not: 'Ingredients alone, drinks that are not part of a dish, and restaurants do not count.',
    source: 'Wikidata dishes that belong to the cuisine or come from the country, known in at least 2 languages.',
    pattern: dishesOf(cuisines, countries, direct), minSignal: 1, mustHave,
    skip: nameIs(/cuisine$|^(food|dish|rice|noodle|soup|meat|fish|bread|sauce|vegetable)$/i),
  })

export const BATCH: NewQuestion[] = [
  // ================================================================ Animals & Nature
  GROUP('hummingbird', 'Name a hummingbird.', 'any hummingbird by its common name', ['Q43624'], 3, /^hummingbirds?$/i,
    ['Ruby-throated hummingbird', 'Anna\'s hummingbird', 'Bee hummingbird', 'Rufous hummingbird', 'Black-chinned hummingbird', 'Calliope hummingbird', 'Broad-tailed hummingbird', 'Costa\'s hummingbird', 'Giant hummingbird', 'Sword-billed hummingbird', 'Allen\'s hummingbird', 'Violet-crowned hummingbird', 'Green violetear', 'Rufous-tailed hummingbird']),
  GROUP('pigeon-dove', 'Name a pigeon or dove.', 'any pigeon or dove by its common name, including extinct ones such as the dodo', ['Q10856'], 3, /^(pigeons?|doves?)$/i,
    ['Rock dove', 'Mourning dove', 'Passenger pigeon', 'Dodo', 'Common wood pigeon', 'Eurasian collared dove', 'European turtle dove', 'Victoria crowned pigeon', 'Nicobar pigeon', 'Stock dove', 'Spotted dove', 'Laughing dove', 'White-winged dove', 'Inca dove', 'Rodrigues solitaire']),
  GROUP('gull', 'Name a gull.', 'any gull by its common name', ['Q27589'], 3, /^gulls?$/i,
    ['Herring gull', 'Black-headed gull', 'Common gull', 'Great black-backed gull', 'Lesser black-backed gull', 'Laughing gull', 'Ring-billed gull', 'Glaucous gull', 'California gull', 'Black-legged kittiwake', 'Franklin\'s gull', 'Mew gull', 'Iceland gull', 'Ivory gull', 'Western gull', 'Sabine\'s gull', 'Little gull', 'Mediterranean gull', 'Bonaparte\'s gull']),
  GROUP('heron-egret', 'Name a heron, egret or bittern.', 'any heron, egret or bittern by its common name', ['Q18789'], 3, /^(herons?|egrets?|bitterns?)$/i,
    ['Great blue heron', 'Grey heron', 'Great egret', 'Little egret', 'Cattle egret', 'Green heron', 'Black-crowned night heron', 'Snowy egret', 'Purple heron', 'Goliath heron', 'Eurasian bittern', 'Little blue heron', 'Tricolored heron', 'Reddish egret', 'Squacco heron', 'Boat-billed heron', 'Yellow-crowned night heron', 'Western reef heron']),
  GROUP('corvid', 'Name a crow, raven, jay or magpie.', 'any crow, raven, rook, jackdaw, jay, magpie, chough or nutcracker by its common name', ['Q25565'], 3, /^(crows?|ravens?|jays?|magpies?|corvids?)$/i,
    ['Common raven', 'American crow', 'Carrion crow', 'Eurasian magpie', 'Blue jay', 'Eurasian jay', 'Rook', 'Western jackdaw', 'Hooded crow', 'Steller\'s jay', 'Clark\'s nutcracker', 'Black-billed magpie', 'Florida scrub jay', 'Pinyon jay', 'Fish crow', 'Large-billed crow', 'Azure-winged magpie', 'House crow']),
  GROUP('finch', 'Name a finch.', 'any true finch, goldfinch, canary, siskin, crossbill, redpoll or grosbeak by its common name', ['Q160835'], 3, /^(finch(es)?|goldfinch(es)?|canar(y|ies))$/i,
    ['House finch', 'American goldfinch', 'European goldfinch', 'Common chaffinch', 'Common crossbill', 'Eurasian bullfinch', 'Purple finch', 'Evening grosbeak', 'Pine siskin', 'Common redpoll', 'Hawfinch', 'European greenfinch', 'Brambling', 'Eurasian siskin', 'Common linnet', 'Atlantic canary', 'Red crossbill', 'Cassin\'s finch', 'Lesser goldfinch']),
  GROUP('seal', 'Name a seal, sea lion or walrus.', 'any seal, fur seal, sea lion or walrus by its common name', ['Q30263'], 1, /^(seals?|sea lions?|walrus(es)?|pinnipeds?)$/i,
    ['Harbor seal', 'Grey seal', 'Harp seal', 'Northern elephant seal', 'Leopard seal', 'Weddell seal', 'Crabeater seal', 'Hooded seal', 'Ringed seal', 'Walrus', 'California sea lion', 'Steller sea lion', 'Northern fur seal', 'Hawaiian monk seal', 'Bearded seal', 'Ross seal', 'Southern elephant seal', 'Galápagos sea lion', 'Australian sea lion']),
  GROUP('conifer', 'Name a conifer.', 'any conifer by its common name (pine, spruce, fir, cedar, cypress, redwood, yew, juniper, larch or similar)', ['Q132825'], 6, /^(conifers?|pines?|spruces?|firs?|cedars?|cypress(es)?)$/i,
    ['Scots pine', 'Douglas fir', 'Giant sequoia', 'Coast redwood', 'Norway spruce', 'Eastern white pine', 'Ponderosa pine', 'Lodgepole pine', 'Western redcedar', 'Cedar of Lebanon', 'English yew', 'Monkey puzzle', 'Bald cypress', 'Common juniper', 'Blue spruce', 'Balsam fir', 'Great Basin bristlecone pine', 'Stone pine', 'European larch', 'Wollemi pine', 'Sitka spruce'],
    'Broadleaf trees and cycads do not count.', { extras: [{ name: 'Lodgepole pine', signal: 15 }] }),
  GROUP('legume', 'Name a bean, pea or other legume.', 'any legume (a bean, pea, lentil, peanut, clover or other plant of the pea family) by its common name', ['Q44448'], 6, /^(legumes?|beans?|peas?)$/i,
    ['Pea', 'Soybean', 'Peanut', 'Lentil', 'Chickpea', 'Common bean', 'Broad bean', 'Alfalfa', 'White clover', 'Lupin', 'Fenugreek', 'Mung bean', 'Cowpea', 'Runner bean', 'Pigeon pea', 'Tamarind', 'Carob', 'Liquorice', 'Lima bean', 'Sweet pea', 'Red clover', 'Black locust'],
    'Plants outside the pea family do not count.'),
  mk('Animals & Nature', {
    id: 'animals-famous-individual-animal', prompt: 'Name a famous individual animal.', what: 'any real, named animal that became famous (a space dog, a cloned sheep, a talking parrot, a racehorse, a war hero, a zoo celebrity)',
    not: 'Fictional animals and species do not count.',
    source: 'Wikidata individual animals, known in at least 8 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q26401003 .', minSignal: 8,
    mustHave: ['Laika', 'Dolly', 'Hachikō', 'Greyfriars Bobby', 'Cecil', 'Koko', 'Harambe', 'Knut', 'Lonesome George', 'Balto', 'Togo', 'Seabiscuit', 'Secretariat', 'Phar Lap', 'Man o\' War', 'Ham', 'Washoe', 'Alex', 'Nim Chimpsky', 'Cher Ami', 'Sergeant Stubby', 'Paul the Octopus', 'Punxsutawney Phil', 'Albert II', 'Belka', 'Strelka'],
  }),
  GROUP('turtle', 'Name a turtle or tortoise.', 'any turtle, tortoise or terrapin by its common name', ['Q223044'], 3, /^(turtles?|tortoises?|terrapins?)$/i,
    ['Green sea turtle', 'Leatherback sea turtle', 'Loggerhead sea turtle', 'Hawksbill sea turtle', 'Common snapping turtle', 'Eastern box turtle', 'Red-eared slider', 'Painted turtle', 'Galápagos tortoise', 'Aldabra giant tortoise', 'Gopher tortoise', 'Desert tortoise', 'African spurred tortoise', 'Leopard tortoise', 'Alligator snapping turtle', 'Olive ridley sea turtle', 'Kemp\'s ridley sea turtle', 'Flatback sea turtle', 'Hermann\'s tortoise', 'Russian tortoise', 'Radiated tortoise', 'Pancake tortoise', 'Diamondback terrapin']),
  GROUP('salamander', 'Name a salamander or newt.', 'any salamander, newt, axolotl, hellbender, mudpuppy or siren by its common name', ['Q53663'], 3, /^(salamanders?|newts?)$/i,
    ['Axolotl', 'Fire salamander', 'Tiger salamander', 'Hellbender', 'Chinese giant salamander', 'Eastern newt', 'Smooth newt', 'Great crested newt', 'Olm', 'Common mudpuppy', 'Spotted salamander', 'Red-backed salamander', 'Marbled salamander', 'Japanese giant salamander', 'Rough-skinned newt', 'California newt', 'Alpine newt', 'Greater siren']),
  GROUP('ant', 'Name an ant.', 'any ant by its common name', ['Q7386'], 3, /^ants?$/i,
    ['Red imported fire ant', 'Carpenter ant', 'Bullet ant', 'Leafcutter ant', 'Army ant', 'Argentine ant', 'Weaver ant', 'Pharaoh ant', 'Harvester ant', 'Black garden ant', 'Driver ant', 'Bulldog ant', 'Honeypot ant', 'Crazy ant', 'Velvet ant', 'Pavement ant', 'Odorous house ant', 'Wood ant', 'Jack jumper ant', 'Trap-jaw ant', 'Meat ant', 'Green tree ant', 'Yellow crazy ant'], 'Termites and other insects do not count.'),
  GROUP('wasp-hornet', 'Name a wasp or hornet.', 'any wasp, hornet or yellowjacket of the vespid family by its common name', ['Q7037230'], 1, /^(wasps?|hornets?|yellowjackets?)$/i,
    ['Yellowjacket', 'European hornet', 'Asian giant hornet', 'Paper wasp', 'Bald-faced hornet', 'Common wasp', 'German wasp', 'Potter wasp', 'Asian hornet', 'Oriental hornet', 'Hornet', 'Polistes dominula', 'Dolichovespula', 'Mason wasp']),
  GROUP('bee', 'Name a bee.', 'any bee, bumblebee or honey bee by its common name', ['Q756082'], 3, /^(bees?|bumblebees?)$/i,
    ['Western honey bee', 'Buff-tailed bumblebee', 'Carpenter bee', 'Africanized bee', 'Eastern honey bee', 'Giant honey bee', 'Cuckoo bee', 'Squash bee', 'Red-tailed bumblebee', 'Early bumblebee', 'Common carder bee', 'Rusty patched bumblebee', 'Western bumblebee', 'Blue-banded bee', 'Orchid bee', 'Stingless bee', 'White-tailed bumblebee', 'Garden bumblebee']),
  GROUP('eel', 'Name an eel.', 'any true eel, moray or conger by its common name', ['Q128685'], 3, /^(eels?|morays?)$/i,
    ['European eel', 'American eel', 'Moray eel', 'Conger', 'Japanese eel', 'Gulper eel', 'Garden eel', 'Snipe eel', 'Green moray', 'Giant moray', 'Ribbon eel', 'Zebra moray', 'Spotted moray', 'Slender giant moray', 'Pike conger', 'Honeycomb moray']),
  GROUP('salmon-trout', 'Name a salmon, trout or char.', 'any salmon, trout, char, whitefish or grayling by its common name', ['Q184238'], 3, /^(salmon|trouts?|chars?|whitefish|graylings?)$/i,
    ['Atlantic salmon', 'Chinook salmon', 'Coho salmon', 'Sockeye salmon', 'Pink salmon', 'Chum salmon', 'Rainbow trout', 'Brown trout', 'Brook trout', 'Lake trout', 'Cutthroat trout', 'Arctic char', 'Steelhead', 'Dolly Varden trout', 'Huchen', 'Golden trout', 'Bull trout', 'Taimen', 'Arctic grayling', 'Cherry salmon', 'Kokanee salmon'], undefined, { extras: [{ name: 'Lake trout', signal: 20 }] }),
  GROUP('tuna-mackerel', 'Name a tuna or mackerel.', 'any tuna, mackerel, bonito or wahoo by its common name', ['Q215185'], 1, /^(tunas?|mackerels?|bonitos?)$/i,
    ['Atlantic bluefin tuna', 'Yellowfin tuna', 'Skipjack tuna', 'Albacore', 'Bigeye tuna', 'Atlantic mackerel', 'King mackerel', 'Spanish mackerel', 'Atlantic bonito', 'Wahoo', 'Pacific bluefin tuna', 'Southern bluefin tuna', 'Blackfin tuna', 'Little tunny', 'Chub mackerel', 'Indian mackerel', 'Cero', 'Frigate mackerel', 'Longtail tuna'], undefined, { extras: [{ name: 'Spanish mackerel', signal: 15 }, { name: 'Blackfin tuna', signal: 10 }] }),

  // ================================================================ Food
  DISH('portuguese', 'Portuguese', 'Portuguese', ['Q180817'], ['Q45'], ['Pastel de nata', 'Bacalhau à Brás', 'Francesinha', 'Caldo verde', 'Feijoada', 'Arroz de pato', 'Cozido à portuguesa', 'Bifana', 'Açorda', 'Alheira', 'Chouriço', 'Ovos moles', 'Arroz doce', 'Tripas à moda do Porto', 'Sardines']),
  DISH('moroccan', 'Moroccan', 'Moroccan', ['Q1150262'], ['Q1028'], ['Tagine', 'Couscous', 'Harira', 'Pastilla', 'Zaalouk', 'Rfissa', 'Tanjia', 'Mechoui', 'Msemen', 'Baghrir', 'Chebakia', 'Kefta', 'Bissara', 'Mrouzia', 'Seffa', 'Harcha', 'Sellou'], true),
  DISH('peruvian', 'Peruvian', 'Peruvian', ['Q749847'], ['Q419'], ['Ceviche', 'Lomo saltado', 'Ají de gallina', 'Anticuchos', 'Causa', 'Papa a la huancaína', 'Pachamanca', 'Tiradito', 'Rocoto relleno', 'Cuy', 'Picarones', 'Suspiro a la limeña', 'Tacu tacu', 'Arroz chaufa', 'Cau cau', 'Juane']),
  DISH('argentine', 'Argentine', 'Argentine', ['Q579500'], ['Q414'], ['Asado', 'Empanada', 'Milanesa', 'Dulce de leche', 'Chimichurri', 'Locro', 'Choripán', 'Provoleta', 'Alfajor', 'Matambre', 'Humita', 'Fugazza', 'Faina', 'Medialuna', 'Carbonada']),
  DISH('swedish', 'Swedish', 'Swedish', ['Q35623'], ['Q34'], ['Swedish meatballs', 'Gravlax', 'Surströmming', 'Smörgåsbord', 'Pytt i panna', 'Raggmunk', 'Jansson\'s temptation', 'Princess cake', 'Cinnamon bun', 'Semla', 'Kroppkaka', 'Ärtsoppa', 'Knäckebröd', 'Prinsesstårta']),
  DISH('dutch', 'Dutch', 'Dutch', ['Q1988266'], ['Q55'], ['Stroopwafel', 'Bitterballen', 'Erwtensoep', 'Stamppot', 'Poffertjes', 'Hutspot', 'Kroket', 'Oliebol', 'Appeltaart', 'Hagelslag', 'Rijsttafel', 'Frikandel', 'Kibbeling', 'Boerenkool', 'Speculaas', 'Pannenkoek']),
  DISH('hungarian', 'Hungarian', 'Hungarian', ['Q264327'], ['Q28'], ['Goulash', 'Lángos', 'Chicken paprikash', 'Dobos torte', 'Halászlé', 'Töltött káposzta', 'Kürtőskalács', 'Pörkölt', 'Lecsó', 'Túró Rudi', 'Rakott krumpli', 'Gundel pancake', 'Rétes', 'Hortobágyi palacsinta']),
  DISH('pakistani', 'Pakistani', 'Pakistani', ['Q1089120'], ['Q843'], ['Biryani', 'Nihari', 'Haleem', 'Karahi', 'Seekh kebab', 'Paratha', 'Chapli kebab', 'Samosa', 'Halwa puri', 'Paya', 'Chana masala', 'Lassi', 'Sajji', 'Pulao', 'Gulab jamun']),
  DISH('ethiopian', 'Ethiopian', 'Ethiopian', ['Q257508'], ['Q115'], ['Injera', 'Doro wat', 'Kitfo', 'Tibs', 'Shiro', 'Gomen', 'Misir wat', 'Dulet', 'Ful medames', 'Genfo', 'Atkilt', 'Firfir', 'Tire siga', 'Dabo kolo', 'Chechebsa']),
  DISH('cuban', 'Cuban', 'Cuban', ['Q1328358'], ['Q241'], ['Ropa vieja', 'Picadillo', 'Cuban sandwich', 'Moros y Cristianos', 'Lechón asado', 'Vaca frita', 'Tostones', 'Yuca con mojo', 'Flan', 'Arroz con pollo', 'Croquetas', 'Congrí', 'Fricasé de pollo', 'Pastelitos de guayaba'], true),
  DISH('irish', 'Irish', 'Irish', ['Q1068545'], ['Q27'], ['Irish stew', 'Colcannon', 'Soda bread', 'Boxty', 'Champ', 'Coddle', 'Barmbrack', 'Black pudding', 'Bacon and cabbage', 'Corned beef and cabbage', 'Irish breakfast', 'Cottage pie', 'Potato farl', 'Drisheen'], true),
  DISH('korean', 'Korean', 'Korean', ['Q647500'], ['Q884', 'Q18097'], ['Kimchi', 'Bibimbap', 'Bulgogi', 'Tteokbokki', 'Japchae', 'Samgyeopsal', 'Kimbap', 'Sundubu-jjigae', 'Galbi', 'Naengmyeon', 'Jajangmyeon', 'Banchan', 'Dakgalbi', 'Samgyetang', 'Haemul pajeon', 'Budae-jjigae', 'Kimchi jjigae', 'Hotteok', 'Bingsu']),
  DISH('hong-kong', 'Hong Kong', 'Hong Kong', ['Q1036629'], ['Q8646'], ['Egg tart', 'Pineapple bun', 'Wonton noodles', 'Hong Kong-style milk tea', 'Yuenyeung', 'Char siu', 'Siu mei', 'Congee', 'Hong Kong-style French toast', 'Cheung fun', 'Egg waffle', 'Fish ball', 'Cart noodle', 'Dim sum', 'Mango pudding']),
  DISH('taiwanese', 'Taiwanese', 'Taiwanese', ['Q707908'], ['Q865'], ['Beef noodle soup', 'Bubble tea', 'Oyster omelette', 'Stinky tofu', 'Gua bao', 'Lu rou fan', 'Pineapple cake', 'Scallion pancake', 'Taiwanese fried chicken', 'Mochi', 'Shaved ice', 'Danzai noodles', 'Tea egg', 'Taiwanese sausage']),
  DISH('iranian', 'Iranian', 'Iranian', ['Q1342397'], ['Q794'], ['Chelow kabab', 'Ghormeh sabzi', 'Fesenjān', 'Tahdig', 'Ash reshteh', 'Kuku sabzi', 'Zereshk polo', 'Ghaimeh', 'Dizi', 'Joojeh kabab', 'Faloodeh', 'Baghali polo', 'Sholeh zard', 'Gaz', 'Tahchin']),
  mk('Food', {
    id: 'food-beer-style', prompt: 'Name a style of beer.', what: 'any style, family or type of beer (a lager, an ale, a stout, a porter, a pilsner, a wheat beer, a sour or a regional style)',
    not: 'Brands and breweries do not count.',
    source: 'Wikidata beer styles, known in at least 2 languages.',
    pattern: '?item wdt:P31/wdt:P279* wd:Q1998962 .', minSignal: 2,
    mustHave: ['Lager', 'Pale ale', 'India pale ale', 'Stout', 'Porter', 'Pilsner', 'Wheat beer', 'Hefeweizen', 'Amber ale', 'Brown ale', 'Saison', 'Lambic', 'Bock', 'Dubbel', 'Tripel', 'Kölsch', 'Gose', 'Sour beer', 'Barley wine', 'Imperial stout', 'Dunkel', 'Märzen', 'Witbier', 'Berliner Weisse', 'Scotch ale', 'Cream ale', 'Rauchbier', 'Oatmeal stout', 'Milk stout'],
  }),
  mk('Food', {
    id: 'food-pie', prompt: 'Name a pie.', what: 'any sweet or savoury pie (a fruit pie, a meat pie, a pot pie, a cream pie), by its usual name',
    not: 'Pizzas, quiches and pastries that are not called pies do not count.',
    source: 'Wikidata pies and their kinds, known in at least 2 languages.',
    pattern: kindOf('Q13360264'), minSignal: 2,
    mustHave: ['Apple pie', 'Pumpkin pie', 'Cherry pie', 'Shepherd\'s pie', 'Pecan pie', 'Key lime pie', 'Pot pie', 'Lemon meringue pie', 'Mince pie', 'Banoffee pie', 'Cottage pie', 'Steak and kidney pie', 'Chicken pot pie', 'Blueberry pie', 'Rhubarb pie', 'Meat pie', 'Mississippi mud pie', 'Pork pie', 'Sweet potato pie', 'Cream pie', 'Fish pie', 'Stargazy pie'],
  }),
  mk('Food', {
    id: 'food-root-vegetable', prompt: 'Name a root vegetable.', what: 'any root vegetable, tuber or corm that is eaten (a potato, a carrot, a beet, a turnip, a radish, a yam, a cassava)',
    not: 'Leaves, fruits and bulbs such as onions do not count.',
    source: 'Wikidata root vegetables and their kinds, known in at least 3 languages.',
    pattern: kindOf('Q20136'), minSignal: 1,
    mustHave: ['Potato', 'Carrot', 'Beetroot', 'Turnip', 'Radish', 'Parsnip', 'Sweet potato', 'Yam', 'Cassava', 'Celeriac', 'Rutabaga', 'Horseradish', 'Jicama', 'Daikon', 'Taro', 'Burdock', 'Salsify', 'Ginger', 'Jerusalem artichoke', 'Turmeric', 'Ginseng'],
  }),
  mk('Food', {
    id: 'food-nut', prompt: 'Name a nut.', what: 'any edible nut or nut-like seed as eaten (an almond, a walnut, a pecan, a pistachio, a cashew, a hazelnut)',
    not: 'Peanuts are included; coconuts and nutmeg count only if they are called nuts.',
    source: 'Wikidata edible nuts, known in at least 3 languages.',
    pattern: kindOf('Q3320037'), minSignal: 1,
    mustHave: ['Almond', 'Walnut', 'Pecan', 'Pistachio', 'Cashew', 'Hazelnut', 'Macadamia', 'Brazil nut', 'Peanut', 'Chestnut', 'Pine nut', 'Coconut', 'Pili nut', 'Tiger nut', 'Kola nut', 'Betel nut', 'Acorn', 'Hickory nut'],
  }),
  mk('Food', {
    id: 'food-berry', prompt: 'Name a berry.', what: 'any berry (a strawberry, a blueberry, a raspberry, a blackberry, a cranberry, a gooseberry, a currant or a similar small soft fruit), cultivated or wild',
    not: 'Large fruits, nuts and tomatoes do not count.',
    source: 'Wikidata berries and small edible fruits, known in at least 3 languages.',
    pattern: '{ ?item wdt:P31/wdt:P279* wd:Q16128920 } UNION { ?item wdt:P31/wdt:P279* wd:Q13184 } .', minSignal: 1,
    mustHave: ['Strawberry', 'Blueberry', 'Raspberry', 'Blackberry', 'Cranberry', 'Gooseberry', 'Elderberry', 'Mulberry', 'Goji', 'Açaí', 'Boysenberry', 'Blackcurrant', 'Redcurrant', 'Lingonberry', 'Cloudberry', 'Huckleberry', 'Loganberry', 'Juniper berry', 'Bilberry', 'Tayberry', 'Salmonberry'],
  }),
]
