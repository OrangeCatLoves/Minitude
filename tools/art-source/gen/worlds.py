# Data for all 36 worlds. World k unlocks at 20k points and is 1.7 x 10^-k metres tall.
SUP = str.maketrans('0123456789-', '⁰¹²³⁴⁵⁶⁷⁸⁹⁻')
def sup(n): return str(n).translate(SUP)

SIZES = ['1.7 m','17 cm','1.7 cm','1.7 mm','170 µm','17 µm','1.7 µm','170 nm','17 nm','1.7 nm','170 pm','17 pm','1.7 pm',
         '170 fm','17 fm','1.7 fm','170 am','17 am','1.7 am','170 zm','17 zm','1.7 zm','170 ym','17 ym','1.7 ym',
         '170 rm','17 rm','1.7 rm','170 qm','17 qm','1.7 qm']
BARS  = ['2 m','20 cm','2 cm','2 mm','200 µm','20 µm','2 µm','200 nm','20 nm','2 nm','200 pm','20 pm','2 pm',
         '200 fm','20 fm','2 fm','200 am','20 am','2 am','200 zm','20 zm','2 zm','200 ym','20 ym','2 ym',
         '200 rm','20 rm','2 rm','200 qm','20 qm','2 qm']
for k in range(31, 36):
    SIZES.append('1.7 × 10' + sup(-k) + ' m')
    BARS.append('2 × 10' + sup(-k) + ' m')

LONG = {'m':'metres','cm':'centimetres','mm':'millimetres','µm':'micrometres','nm':'nanometres','pm':'picometres',
        'fm':'femtometres','am':'attometres','zm':'zeptometres','ym':'yoctometres','rm':'rontometres','qm':'quectometres'}
def longform(s):
    num, unit = s.rsplit(' ', 1)
    if '×' in s: return s.replace(' m', ' metres')
    return num + ' ' + LONG[unit]

# (name, one-line description, blob id of the 320x180 scene)
W = [
 ('THE ROOM','Start here. A quiet evening room, and you at normal size.','0c82823c5a68cd61c26f19dde42a2b40'),
 ('THE BOOKSHELF','Book spines stand like tall walls, with gold lettering on every one.','8bf00c01dc952c946f46a90cc78919e5'),
 ('THE DESKTOP','A mug is a tower. A pencil is a fallen log.','17bc24ebab424fd27cbec0d51d02a5c4'),
 ('SAND BEACH','Every grain is a faceted boulder, under a setting sun.','7d8b917bf21494ee4f05a86df97aeb9a'),
 ('THREAD FOREST','Fabric fibres rise like cables. Specks of dust drift by like moons.','ca638be565e7c96100ac036fcf4e7c4b'),
 ('DROPLET WORLD','One drop of water, as big as a hill, with tiny life swimming inside.','c009876292127fcd11bc7b2dcd8c6a49'),
 ('BACTERIA GARDEN','Rod-shaped cells lie like logs, and whip-like tails wave through the water.','9afb9f9812ee86bbf97b113f7d1ba232'),
 ('GERM REEF','Bacteria loom like islands. Viruses drift past like landers.','9a12c65d5ada957377dd1a3c3b7628c2'),
 ('PROTEIN FACTORY','Ribosomes bob along a chain of beads, building proteins.','d1d9eb620feafebe368fc1b279142c4c'),
 ('DNA FOREST','Spiral towers with coloured rungs fill the horizon.','74e31f4d8c399cd0889cf447405def2c'),
 ('CRYSTAL LATTICE','As small as an atom. You stand on one, in a glowing grid.','8161ad8e6d66bcef1832bf2f91b03cec'),
 ('ELECTRON CLOUDS','Glowing lobes of probability float over a flat platform.','0d1526f29169035bc8a85bfb1e3ad767'),
 ('X-RAY SEA','Waves shorter than you are tall roll past in stacked layers.','5bd5ec8c3d8294f0e1bad06666f33ccb'),
 ('THE GREAT EMPTY','Faint orbits sweep around a speck of a nucleus, far away.','de2582c62aca038e1528b4d01841fd6c'),
 ('NUCLEUS CITY','A tight cluster of particles packs together like a city block.','0078d1a5f3ddf789521369f193109a3a'),
 ('INSIDE THE PROTON','Three quarks, tied together by glowing strings.','0c4164e7285e34277d520cff5af71559'),
 ('QUARK SEA','Triads of quarks drift in a sea of colour.','1d750e3cddba08fb2b1a8b40b0261c90'),
 ('GLUON RIVERS','Ribbons of colour flow between everything.','95d4871b92cb0b83e434a1039adf5a7b'),
 ('RIPPLE SEA','Space itself ripples, bending a grid of light.','4f494a030060745885e7fb9358f047f3'),
 ('LASER HALL','A red beam fires down a hall of mirrors.','ca7a9619cc353afa312cb919fa0e9791'),
 ('SPARK FIELD','Pairs of sparks flash into being and vanish.','65400435ef6118f512519a14f4a09d95'),
 ('THE UNKNOWN','Impossible geometry. No instrument has looked this small.','646a296fe5208a470b0ba014d57c783b'),
 ('SILENT DARK','Almost nothing. One faint beacon, far away, ringed by cold.','710591763809e7b2da06f51b35374cd2'),
 ('THE HUM','Amber arcs of sound ripple out from a glowing source.','acc573c64ae3ca7794a5be6c2b91bb62'),
 ('STRING GARDEN','Stems tremble like plucked strings, with loops drifting between.','4c0e4ec395af797de430670978254977'),
 ('CRYSTAL VOID','Giant crystals hang in the dark above an ice floor.','07cae10ead74879385dcbd8149db267b'),
 ('MIRROR MAZE','A corridor of mirrors, with your own reflection underfoot.','5021100944c32abff364f9af367360c5'),
 ('FOAM SHORE','A shore of glowing bubbles under a pink sun.','2aadeb91f2018c0138320b1569b38ba6'),
 ('LOOP FOREST','Chains of golden rings climb like trees.','65c98b13867928b6ae6e877953c9be3a'),
 ('BUBBLE TIDE','Bubbles float above a rainbow sphere that is the ground.','30a0febc7f9bd43db8840a3eab02cfd9'),
 ('KNOT CITY','Towers of braided cable, and one glowing knot.','acf47a3bbce62379102dead8b9f72ed9'),
 ('RIBBON SKY','Silk ribbons wave across a pink sky.','1902554b70270339553ada192bd4418a'),
 ('GLASS TIDE','Glass shards rise out of a sea of waves.','e2bf49c095d598a51c60983a422b2046'),
 ('DREAM STATIC','The picture falls apart into noise and glitches.','ef8e3fbd72bb9bcc777313fde5f051ce'),
 ('THE LAST DOOR','One glowing door at the end of a golden floor.','1f4c8ed2cd2b2dbb56f100a24c80887a'),
 ('PLANCK FOAM','About the Planck length, where physicists expect current theories to stop working. Only a perfect run gets here.','a49a18f310eada9967392834439c5aeb'),
]

# Sourced facts: k -> (headline, body, source). Every other world is marked invented.
F = {
 0: ('THE TALLEST PERSON EVER','Robert Wadlow, the tallest person ever recorded, stood 2.72 m (8 ft 11 in). That is about 1 m taller than you are here.','GUINNESS WORLD RECORDS'),
 1: ('THE SMALLEST DOG, IN 2013','Miracle Milly, a Chihuahua, was measured at 9.65 cm (3.8 in) tall in 2013, and Guinness named her the smallest dog by height. You are 17 cm here, nearly twice her height.','WIKIPEDIA: MILLY (DOG), CITING GUINNESS WORLD RECORDS'),
 2: ('A DIME\'S WIDTH','A US dime is 17.91 mm across. At 17 mm tall, you are about as tall as a dime is wide.','US MINT COIN SPECIFICATIONS'),
 3: ('WHAT COUNTS AS SAND','Geologists call a grain sand when it is between 0.0625 mm and 2 mm wide. At 1.7 mm, you are the size of a big grain of sand.','WIKIPEDIA: SAND'),
 4: ('AN EGG IS 0.1 MM WIDE','A human egg cell is about 0.1 mm (100 µm) across. At 170 µm, you are less than two egg cells tall.','MOLECULAR BIOLOGY OF THE CELL (NCBI BOOKSHELF)'),
 5: ('A MILLION TO A RAINDROP','A cloud droplet is about 20 µm wide and a raindrop about 2 mm. It takes around a million cloud droplets to make one raindrop.','LIBRETEXTS (BRUNE, ATMOSPHERIC SCIENCE) · WIKIPEDIA'),
 6: ('A GUT BACTERIUM\'S SIZE','E. coli cells are rod-shaped, about 2.0 µm long and 0.25 to 1.0 µm wide. At 1.7 µm, you are nearly as long as one.','WIKIPEDIA: ESCHERICHIA COLI'),
 7: ('TOO SMALL FOR LIGHT','In 1873 Ernst Abbe set a limit: a light microscope could never see detail finer than 0.2 µm (200 nm). You are 170 nm. The 2014 Chemistry Nobel went to methods that beat it.','NOBEL PRIZE IN CHEMISTRY 2014, PRESS RELEASE'),
 8: ('A RIBOSOME IS ABOUT 20 NM','Bacterial ribosomes, the machines that build proteins, are around 20 nm across. At 17 nm, you are almost one ribosome wide.','WIKIPEDIA: RIBOSOME'),
 9: ('DNA IS ABOUT 2 NM WIDE','A DNA double helix has a radius of about 1 nm, so it is about 2 nm wide. At 1.7 nm, you are nearly as wide as one helix.','WIKIPEDIA: DNA'),
 10: ('SPELLING WITH ATOMS','In 1989, IBM scientists Don Eigler and Erhard Schweizer used a scanning tunnelling microscope to move 35 xenon atoms into the letters IBM. A typical atom is about 100 pm across.','IBM · WIKIPEDIA: IBM (ATOMS), ATOM'),
 11: ('THE BOHR RADIUS','The most likely distance between a hydrogen atom\'s electron and its nucleus is called the Bohr radius: 52.9 pm. At 17 pm, you are about a third of that.','WIKIPEDIA: BOHR RADIUS (CODATA)'),
 12: ('X-RAYS ARE SHORT WAVES','X-ray wavelengths run roughly from 10 nm down to 10 pm. At 1.7 pm, you are shorter than the shortest wave in that range.','WIKIPEDIA: X-RAY'),
 13: ('THE NUCLEUS IS A SPECK','A nucleus is about 27,000 to 60,000 times narrower than the whole atom (uranium to hydrogen). That is why the nucleus here is only a speck.','WIKIPEDIA: ATOMIC NUCLEUS'),
 14: ('HYDROGEN TO URANIUM','A nucleus is about 1.7 fm wide for hydrogen and about 11.7 fm for uranium. At 17 fm, you are wider than either.','WIKIPEDIA: ATOMIC NUCLEUS'),
 15: ('MOSTLY NOT QUARK MASS','The three quarks inside a proton make up only about 1% of its mass. The rest is the energy of the quarks and gluons moving and held together.','PHYSICS (APS) 11, 118 (2018)'),
 18: ('SPACE STRETCHED BY ~2 OF YOU','In 2015 LIGO caught a gravitational wave with a peak strain of 1.0 × 10⁻²¹. Strain × arm length (4,000 m) gives about 4 × 10⁻¹⁸ m of arm-length difference, a little over two of you.','LIGO, PHYS. REV. LETT. 116, 061102 (ARXIV 1602.03837) · HYPERPHYSICS (ARM LENGTH)'),
 19: ('247 ZEPTOSECONDS','In 2020 a team at Goethe University timed a photon crossing a hydrogen molecule: about 247 zeptoseconds. Zepto means 10⁻²¹, the same prefix as your size here.','PHYS.ORG · GOETHE UNIVERSITY, SCIENCE (2020)'),
 21: ('A POINT WITH NO INSIDE','As far as any experiment can tell, an electron is a point: no size and no parts inside. Experiments only give an upper limit on how big it could be.','WIKIPEDIA: ELECTRON'),
 27: ('FOUR NEW METRIC PREFIXES','On 18 November 2022 the metric system gained ronna (10²⁷), quetta (10³⁰), ronto (10⁻²⁷) and quecto (10⁻³⁰). Ronto is the prefix of your size here.','BIPM · 27TH CGPM, 2022'),
 30: ('THE LAST NAMED SIZE','Quecto (10⁻³⁰), added in 2022, is the smallest prefix the metric system defines. From the next world on, sizes have no prefix and are written as powers of ten.','BIPM · 27TH CGPM, 2022'),
 35: ('THE END OF THE SCALE?','The Planck length is 1.616255 × 10⁻³⁵ m. A proton is about 10²⁰ Planck lengths across. Nobody knows if anything shorter even makes sense.','CODATA 2022, VIA WIKIPEDIA: PLANCK UNITS'),
}
# Notes on the unit name shown on invented cards.
UNIT = {16:'Atto means 10⁻¹⁸.',17:'Atto means 10⁻¹⁸.',20:'Zepto means 10⁻²¹.',
        22:'Yocto means 10⁻²⁴.',23:'Yocto means 10⁻²⁴.',24:'Yocto means 10⁻²⁴.',25:'Ronto means 10⁻²⁷.',26:'Ronto means 10⁻²⁷.',
        28:'Quecto means 10⁻³⁰.',29:'Quecto means 10⁻³⁰.',31:'No metric prefix goes this small.',32:'No metric prefix goes this small.',
        33:'No metric prefix goes this small.',34:'No metric prefix goes this small.'}
# Where an all-one-tier run of 7 prompts ends: 7 x 10, 20, 40, 60, 80, 100 points.
RUN = {3:'7 × COMMON = 70 PTS ENDS HERE',7:'7 × UNCOMMON = 140 PTS ENDS HERE',14:'7 × RARE = 280 PTS ENDS HERE',
       21:'7 × EXOTIC = 420 PTS ENDS HERE',28:'7 × LEGENDARY = 560 PTS ENDS HERE',35:'7 × MYTHIC = 700 PTS ENDS HERE'}

def world(k):
    name, desc, blob = W[k]
    size, bar = SIZES[k], BARS[k]
    f = F.get(k)
    d = {
        'k': k, 'n': str(k + 1), 'src': '/_blob/' + blob,
        'pts': ('%d PTS' % (20 * k)), 'name': name, 'size': size, 'desc': desc, 'bar': bar,
        'aria': 'Scale bar. The line is %s long. You are %s tall.' % (longform(bar), longform(size)),
        'tag': RUN.get(k, ''),
        'headline': f[0] if f else '', 'body': f[1] if f else '', 'source': f[2] if f else '',
        'inv': '' if f else 'INVENTED WORLD',
        'invBody': '' if f else ('No microscope can show a scale this small, so nothing here is a real picture. ' + UNIT.get(k, '')).strip(),
    }
    return d
