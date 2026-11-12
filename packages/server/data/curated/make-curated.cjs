// Builds the hand-curated expansion files for the two questions that have no class in Wikidata.
// Run:  node packages/server/data/curated/make-curated.cjs <output folder>
// Then: npm run cli -- answers import-expansion <folder>   (add --dry-run first; a folder imports every .json file in it)
// Every line is  "Name|tier|alias;alias"  (tier 0 Common ... 5 Mythic: how few casual players would say it). Written by hand, so a person should review them.
const fs = require('fs')
const path = require('path')

const JUNK_DRAWER = `
Batteries|0|battery;aa batteries;aaa batteries
Scissors|0|a pair of scissors
Pens|0|pen;ballpoint pen
Pencils|0|pencil
Tape|0|scotch tape;sticky tape;cellotape
Duct tape|1|duck tape
Rubber bands|0|rubber band
Paper clips|0|paperclips;paper clip;paperclip
Keys|0|key;spare key;spare keys
Matches|0|match;matchbook
Lighter|0|lighters
Flashlight|0|torch;flashlights
Screwdriver|0|screwdrivers
Takeout menus|0|take out menus;takeaway menus;menus;menu
Sticky notes|0|post-it notes;post its;post it notes;postit notes
String|1|twine;kitchen string
Twist ties|1|twist tie
Loose change|1|coins;change;pennies;quarters
Tape measure|1|measuring tape
Super glue|1|superglue;krazy glue
Glue|1|glue stick;school glue
Bottle opener|1|bottle openers
Can opener|1|tin opener;can openers
Corkscrew|1|wine opener;bottle screw
Chip clips|1|bag clips;chip clip;bag clip;clothespins for bags
Birthday candles|1|candles;birthday candle;cake candles
Thumbtacks|1|push pins;pushpins;drawing pins;thumb tacks;tacks
Safety pins|2|safety pin
Pliers|1|plier
Hammer|2|small hammer
Utility knife|2|box cutter;box cutters;stanley knife;craft knife
Ruler|1|rulers
Calculator|2|pocket calculator
Notepad|1|note pad;notebook;memo pad;pad of paper
Chopsticks|1|chopstick
Straws|2|drinking straws;straw
Toothpicks|2|toothpick;cocktail sticks
Skewers|2|skewer;bamboo skewers
Plastic cutlery|2|plastic forks;plastic spoons;plastic utensils;disposable cutlery
Ketchup packets|2|condiment packets;sauce packets;soy sauce packets;hot sauce packets;mustard packets;ketchup packet
Napkins|1|napkin;paper napkins
Zip ties|2|cable ties;zip tie;cable tie;zipties
Phone charger|1|charger;charging cable;usb cable;charger cable
Earbuds|2|earphones;headphones
Light bulbs|2|lightbulbs;light bulb;lightbulb;spare bulbs
Fuses|3|fuse
Candles|2|candle
Magnets|2|fridge magnets;refrigerator magnets;magnet
Hair ties|2|hair elastics;scrunchies;hair tie;hair band
Bobby pins|3|hair pins;bobby pin;hairpins;hairpin
Sewing kit|3|needle and thread;sewing needle;sewing needles
Buttons|3|spare buttons;button
Tweezers|3|tweezer
Nail clippers|3|nail clipper;nail trimmer
Band-Aids|2|bandaids;band aids;bandages;plasters;bandage;plaster
Dice|3|die;game dice
Playing cards|2|deck of cards;cards;card deck
Stickers|3|sticker
Stamps|3|postage stamps;stamp
Envelopes|2|envelope
Address labels|4|return address labels;labels
Marker|1|markers;sharpie;permanent marker
Highlighter|2|highlighters
Eraser|2|erasers;rubber
Stapler|2|staplers
Staples|2|staple
Coupons|2|coupon;discount coupons
Receipts|3|receipt
Rubber gloves|3|latex gloves;disposable gloves;gloves
Plastic bags|2|grocery bags;shopping bags;plastic bag;bags
Warranty cards|4|warranty;instruction manuals;manuals;user manuals
Spare screws|3|screws;nails;nuts and bolts;bolts;spare nails
Allen keys|3|allen wrench;hex keys;allen key;hex key
Wrench|3|spanner;adjustable wrench
Level|4|spirit level
Clothespins|3|clothes pins;clothes pegs;clothespin
Twine|3|
Rubber stoppers|4|bottle stoppers;wine stoppers;corks;cork
Cookie cutters|3|cookie cutter
Cake decorations|4|sprinkles;cake toppers
Pizza cutter|4|pizza wheel
Garlic press|4|
Measuring spoons|2|measuring spoon
Funnel|4|
Whistle|4|
Compass|4|
Magnifying glass|4|magnifier
Thermometer|3|meat thermometer;kitchen thermometer
Kitchen timer|3|timer;egg timer
Lip balm|3|chapstick;lip gloss
Gum|3|chewing gum;mints;breath mints
Aspirin|4|painkillers;pain relievers;tylenol;ibuprofen;medicine
Hand sanitizer|4|sanitizer
Cough drops|4|
Dental floss|4|floss
Q-tips|4|cotton swabs;cotton buds
Sunglasses|5|
Remote control|3|remote;tv remote
Cord|3|extension cord;power cord;cables;cable
Adapter|3|plug adapter;travel adapter;adaptor
Padlock|4|lock;combination lock;padlocks
Name tags|5|name tag;name badge
Tickets|5|ticket stubs;ticket
Photos|5|photographs;photo;pictures
Game pieces|4|board game pieces;monopoly money;spare game pieces
Crayons|4|crayon
Matchbox cars|5|toy cars;small toys;toys
Old phone|5|old cell phone;old mobile phone
Tongs|3|tong;kitchen tongs;cooking tongs
Whisk|3|wire whisk;egg whisk
Spatula|3|rubber spatula;turner
Wooden spoon|3|wooden spoons;cooking spoon
Ladle|4|soup ladle
Vegetable peeler|3|peeler;potato peeler
Grater|4|cheese grater
Ice cream scoop|4|ice cream scooper;scooper
Potato masher|5|masher
Measuring cups|3|measuring cup
Cheese slicer|5|
Kitchen shears|4|kitchen scissors
Melon baller|5|
Citrus juicer|5|lemon squeezer;lemon juicer
Oven mitt|4|oven mitts;pot holder;pot holders
Rolling pin|4|
Tea strainer|5|strainer;sieve
Baking brush|5|pastry brush
`

const WALL_OUTLET = `
Phone charger|0|charger;cell phone charger;iphone charger;usb charger;mobile charger
Laptop charger|0|computer charger;laptop power adapter;laptop adapter
Lamp|0|table lamp;desk lamp;floor lamp;lamps
Television|0|tv;television set;tv set
Toaster|0|toasters
Microwave|0|microwave oven
Refrigerator|0|fridge;fridge freezer
Fan|0|electric fan;box fan;table fan;desk fan;pedestal fan;tower fan
Hair dryer|0|blow dryer;hairdryer;blow-dryer
Coffee maker|0|coffee machine;coffeemaker;coffee pot;drip coffee maker
Electric kettle|1|kettle
Blender|1|
Vacuum cleaner|1|vacuum;hoover
Clothes iron|1|iron;steam iron
Alarm clock|1|clock;digital clock
Clock radio|2|
Radio|1|
Computer|0|desktop computer;pc;desktop pc
Monitor|1|computer monitor
Printer|1|
Router|1|wifi router;wi-fi router
Modem|2|cable modem
Game console|1|playstation;xbox;nintendo switch;video game console;gaming console
Streaming device|3|roku;fire stick;chromecast;apple tv
Sound bar|2|soundbar
Speaker|1|speakers;bluetooth speaker;smart speaker
Night light|1|nightlight
Air freshener|2|plug-in air freshener;plug in air freshener;glade plugin
Humidifier|2|
Dehumidifier|3|
Air purifier|2|air cleaner
Space heater|1|heater;electric heater
Air conditioner|1|ac;window air conditioner;air con;aircon
Slow cooker|2|crock pot;crockpot
Rice cooker|2|
Air fryer|1|
Toaster oven|2|
Stand mixer|2|kitchenaid;mixer;electric mixer;hand mixer
Food processor|2|
Waffle maker|2|waffle iron
Hot plate|3|
Washing machine|1|washer;clothes washer
Dryer|1|clothes dryer;tumble dryer
Freezer|1|chest freezer
Mini fridge|2|mini refrigerator
Power strip|1|surge protector;extension cord;power bar;extension lead;multi plug
Christmas lights|2|string lights;fairy lights;holiday lights;christmas tree lights;led lights
Electric blanket|2|heated blanket
Heating pad|2|
Electric razor|2|shaver;electric shaver;razor
Electric toothbrush|2|toothbrush charger
Hair straightener|1|flat iron;straightener;straighteners;hair straighteners
Curling iron|1|curling wand;hair curler;curling tongs
Drill|2|power drill;corded drill
Sander|4|electric sander
Soldering iron|4|
Glue gun|3|hot glue gun
Label maker|3|
Shredder|3|paper shredder
Laminator|4|
Scanner|3|
Baby monitor|3|
Smoke detector|3|smoke alarm
Carbon monoxide detector|4|co detector;co alarm
Aquarium pump|4|fish tank filter;aquarium filter;fish tank pump;aquarium heater
Water dispenser|3|water cooler
Bread maker|3|bread machine
Ice maker|3|
Popcorn machine|3|popcorn maker
Juicer|3|
Coffee grinder|3|
Espresso machine|3|espresso maker;nespresso machine
Milk frother|4|
Electric griddle|4|
Pressure cooker|3|instant pot;electric pressure cooker
Sous vide|5|immersion circulator
Lava lamp|3|
Salt lamp|4|himalayan salt lamp
Neon sign|4|
Projector|3|
Record player|3|turntable;vinyl player
Stereo|2|hi-fi;hifi;stereo system;music system
Amplifier|3|amp;guitar amp;guitar amplifier
Pet water fountain|5|cat fountain
Electric piano|4|keyboard;digital piano
Security camera|4|wired camera
Wi-Fi extender|3|range extender;wifi booster
Cordless phone base|4|landline phone;telephone
Fax machine|4|fax
Typewriter|5|electric typewriter
Sewing machine|3|
Tea kettle|2|
Electric fireplace|4|
Heat lamp|4|
Hair clippers|3|trimmer;beard trimmer;clippers
Nail dryer|5|uv nail lamp
Footbath|5|foot spa
Massager|4|massage chair;back massager
Treadmill|3|
Electric scooter charger|4|e-scooter charger;scooter charger
E-bike charger|4|ebike charger
Tablet charger|1|ipad charger
Camera charger|4|battery charger
Battery charger|3|
Power adapter|2|ac adapter
Garage door opener|4|
`

const SMASH = `
Mario|0|
Luigi|0|
Peach|0|princess peach
Bowser|0|king koopa
Yoshi|0|
Donkey Kong|0|dk
Diddy Kong|1|
Link|0|
Zelda|0|princess zelda
Sheik|2|
Ganondorf|1|ganon
Toon Link|1|
Young Link|2|
Samus|0|samus aran
Zero Suit Samus|1|zss
Dark Samus|3|
Kirby|0|
Meta Knight|1|
King Dedede|1|dedede
Fox|0|fox mccloud
Falco|1|falco lombardi
Wolf|2|wolf o'donnell
Pikachu|0|
Jigglypuff|0|
Pichu|2|
Mewtwo|1|
Pokemon Trainer|1|pokémon trainer
Squirtle|2|
Ivysaur|2|
Charizard|1|
Lucario|1|
Greninja|1|
Incineroar|2|
Ness|1|
Lucas|2|
Captain Falcon|1|
Marth|1|
Roy|2|
Ike|1|
Lucina|2|
Chrom|3|
Robin|2|
Corrin|2|
Byleth|2|
Pit|1|
Dark Pit|2|
Palutena|2|
Olimar|2|pikmin
Ice Climbers|2|popo and nana
Mr. Game & Watch|2|game and watch;mr game and watch
R.O.B.|2|rob;robot
Snake|1|solid snake
Sonic|0|sonic the hedgehog
Pac-Man|1|pacman
Mega Man|1|megaman
Ryu|1|
Ken|2|
Cloud|1|cloud strife
Bayonetta|2|
Little Mac|2|
Wii Fit Trainer|2|
Villager|1|
Isabelle|2|
Inkling|2|inkling girl;inkling boy;inkling squid
Duck Hunt|2|duck hunt duo;the duck hunt duo
Shulk|2|
Daisy|1|princess daisy
Rosalina|1|rosalina & luma;rosalina and luma
Bowser Jr.|2|bowser junior
King K. Rool|2|k rool;king k rool
Ridley|2|
Simon|2|simon belmont
Richter|3|richter belmont
Piranha Plant|2|
Joker|1|
Hero|2|dragon quest hero
Banjo & Kazooie|2|banjo and kazooie;banjo-kazooie
Terry Bogard|2|terry
Min Min|3|minmin
Steve|1|minecraft steve
Alex|2|minecraft alex
Sephiroth|2|
Pyra|2|pyra/mythra;mythra
Kazuya|2|kazuya mishima
Sora|2|
Mii Brawler|3|mii fighter
Mii Swordfighter|3|
Mii Gunner|3|
Dr. Mario|1|doctor mario;dr mario
`

function build(question, lines, note) {
  const seen = new Set()
  const newAnswers = []
  for (const line of lines.trim().split('\n')) {
    const [name, tier, aliases = ''] = line.split('|')
    if (!name || seen.has(name.toLowerCase())) continue
    seen.add(name.toLowerCase())
    newAnswers.push({ name: name.trim(), tier: Number(tier), aliases: aliases.split(';').map((a) => a.trim()).filter(Boolean), signal: 0, qid: 'curated' })
  }
  return { question, source: 'curated', recipe: note, generatedAt: new Date().toISOString(), newAnswers, newAliases: [] }
}

const out = process.argv[2] || '.'
fs.mkdirSync(out, { recursive: true })
const files = [
  ['miscellaneous-item-commonly-found', JUNK_DRAWER, 'hand-written list of things found in a kitchen junk drawer'],
  ['miscellaneous-item-commonly-found-2', WALL_OUTLET, 'hand-written list of things plugged into a household wall outlet'],
  ['games-playable-character-from', SMASH, 'hand-written roster of playable Super Smash Bros. fighters (only the ones missing from the bank are added)'],
]
for (const [q, lines, note] of files) {
  const f = build(q, lines, note)
  fs.writeFileSync(path.join(out, q + '.curated.json'), JSON.stringify(f, null, 1))
  console.log(q, f.newAnswers.length, 'answers')
}
