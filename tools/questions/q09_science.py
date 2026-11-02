# Chemical elements 1-118. Tiers are rough familiarity guesses. Symbols of two or more letters are accepted as aliases except those that are ordinary words.
ELEMENTS = [
 ('Hydrogen','H'),('Helium','He'),('Lithium','Li'),('Beryllium','Be'),('Boron','B'),('Carbon','C'),('Nitrogen','N'),('Oxygen','O'),('Fluorine','F'),('Neon','Ne'),
 ('Sodium','Na'),('Magnesium','Mg'),('Aluminium','Al'),('Silicon','Si'),('Phosphorus','P'),('Sulfur','S'),('Chlorine','Cl'),('Argon','Ar'),('Potassium','K'),('Calcium','Ca'),
 ('Scandium','Sc'),('Titanium','Ti'),('Vanadium','V'),('Chromium','Cr'),('Manganese','Mn'),('Iron','Fe'),('Cobalt','Co'),('Nickel','Ni'),('Copper','Cu'),('Zinc','Zn'),
 ('Gallium','Ga'),('Germanium','Ge'),('Arsenic','As'),('Selenium','Se'),('Bromine','Br'),('Krypton','Kr'),('Rubidium','Rb'),('Strontium','Sr'),('Yttrium','Y'),('Zirconium','Zr'),
 ('Niobium','Nb'),('Molybdenum','Mo'),('Technetium','Tc'),('Ruthenium','Ru'),('Rhodium','Rh'),('Palladium','Pd'),('Silver','Ag'),('Cadmium','Cd'),('Indium','In'),('Tin','Sn'),
 ('Antimony','Sb'),('Tellurium','Te'),('Iodine','I'),('Xenon','Xe'),('Caesium','Cs'),('Barium','Ba'),('Lanthanum','La'),('Cerium','Ce'),('Praseodymium','Pr'),('Neodymium','Nd'),
 ('Promethium','Pm'),('Samarium','Sm'),('Europium','Eu'),('Gadolinium','Gd'),('Terbium','Tb'),('Dysprosium','Dy'),('Holmium','Ho'),('Erbium','Er'),('Thulium','Tm'),('Ytterbium','Yb'),
 ('Lutetium','Lu'),('Hafnium','Hf'),('Tantalum','Ta'),('Tungsten','W'),('Rhenium','Re'),('Osmium','Os'),('Iridium','Ir'),('Platinum','Pt'),('Gold','Au'),('Mercury','Hg'),
 ('Thallium','Tl'),('Lead','Pb'),('Bismuth','Bi'),('Polonium','Po'),('Astatine','At'),('Radon','Rn'),('Francium','Fr'),('Radium','Ra'),('Actinium','Ac'),('Thorium','Th'),
 ('Protactinium','Pa'),('Uranium','U'),('Neptunium','Np'),('Plutonium','Pu'),('Americium','Am'),('Curium','Cm'),('Berkelium','Bk'),('Californium','Cf'),('Einsteinium','Es'),('Fermium','Fm'),
 ('Mendelevium','Md'),('Nobelium','No'),('Lawrencium','Lr'),('Rutherfordium','Rf'),('Dubnium','Db'),('Seaborgium','Sg'),('Bohrium','Bh'),('Hassium','Hs'),('Meitnerium','Mt'),('Darmstadtium','Ds'),
 ('Roentgenium','Rg'),('Copernicium','Cn'),('Nihonium','Nh'),('Flerovium','Fl'),('Moscovium','Mc'),('Livermorium','Lv'),('Tennessine','Ts'),('Oganesson','Og'),
]
assert len(ELEMENTS) == 118
ALIAS = {'Aluminium': ['aluminum'], 'Sulfur': ['sulphur'], 'Caesium': ['cesium'], 'Tungsten': ['wolfram'], 'Iron': [], 'Mercury': ['quicksilver']}
WORDS = {'He', 'Be', 'In', 'As', 'No', 'At', 'Ho', 'Am', 'Re', 'Os', 'Pa', 'Ti', 'Ra', 'Ta', 'Tin', 'Mo', 'Na', 'Co', 'Ni', 'Ar', 'Er', 'Lu', 'Pt', 'Ca', 'Sc', 'Cs', 'Hf', 'Mt', 'Ds'}
KEEP = {'Fe', 'Cu', 'Au', 'Ag', 'Pb', 'Hg', 'Sn', 'Zn', 'Mg', 'Cl', 'Br', 'Pu', 'Li', 'Si', 'Ne', 'Kr', 'Xe', 'Rn', 'Ca', 'Na', 'Co', 'Ni', 'Cr', 'Mn', 'Ti', 'Pt', 'Ar'}
T0 = {'Hydrogen', 'Helium', 'Oxygen', 'Carbon', 'Nitrogen', 'Gold', 'Silver', 'Iron'}
T1 = {'Sodium', 'Calcium', 'Copper', 'Lead', 'Mercury', 'Zinc', 'Chlorine', 'Neon', 'Uranium', 'Aluminium', 'Silicon', 'Tin', 'Potassium', 'Sulfur', 'Platinum', 'Lithium', 'Magnesium', 'Titanium', 'Nickel', 'Phosphorus', 'Iodine', 'Argon', 'Plutonium', 'Radium', 'Fluorine', 'Cobalt', 'Chromium', 'Boron', 'Radon'}
T2 = {'Tungsten', 'Arsenic', 'Bromine', 'Krypton', 'Xenon', 'Barium', 'Cadmium', 'Manganese', 'Vanadium', 'Zirconium', 'Palladium', 'Iridium', 'Osmium', 'Bismuth', 'Selenium', 'Thorium', 'Beryllium', 'Strontium', 'Gallium', 'Germanium', 'Antimony', 'Polonium', 'Cesium', 'Caesium', 'Uranium', 'Rhodium', 'Cerium', 'Neodymium', 'Francium', 'Einsteinium', 'Americium', 'Curium', 'Californium', 'Tellurium', 'Molybdenum', 'Scandium'}
def klass(z):
    if z in (3, 11, 19, 37, 55, 87): return 'an alkali metal'
    if z in (4, 12, 20, 38, 56, 88): return 'an alkaline earth metal'
    if z in (2, 10, 18, 36, 54, 86, 118): return 'a noble gas'
    if z in (9, 17, 35, 53, 85, 117): return 'a halogen'
    if z in (5, 14, 32, 33, 51, 52): return 'a metalloid'
    if 57 <= z <= 71: return 'a lanthanide'
    if 89 <= z <= 103: return 'an actinide'
    if z in (1, 6, 7, 8, 15, 16, 34): return 'a nonmetal'
    if z in (13, 31, 49, 50, 81, 82, 83, 84, 113, 114, 115, 116): return 'a post-transition metal'
    return 'a transition metal'
def tier(z, n):
    if n in T0: return 0
    if n in T1: return 1
    if n in T2: return 2
    if z <= 36: return 3
    if z <= 86: return 3 if 37 <= z <= 54 else 4
    if z <= 103: return 4
    return 5
answers = []
for z, (n, s) in enumerate(ELEMENTS, 1):
    al = list(ALIAS.get(n, []))
    if len(s) == 2 and (s not in WORDS or s in KEEP): al.append(s.lower())
    answers.append((n, tier(z, n), 'Atomic number %d, %s.' % (z, klass(z)), al))
QUESTIONS = [
    dict(id='science-element', category='Science & Technology', prompt='Name a chemical element.',
         rules='One of the 118 elements with an official IUPAC name. Symbols of two or more letters count. Compounds, minerals, alloys and isotopes do not.',
         answers=answers,
         rejects=[dict(names=['water', 'salt', 'steel', 'brass', 'bronze', 'diamond', 'graphite', 'ozone', 'quartz', 'unobtainium', 'kryptonite', 'vibranium', 'adamantium', 'plasma'], message='That is not a chemical element.')]),
]
