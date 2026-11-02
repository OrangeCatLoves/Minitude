"""Final text for worlds 17-36 (real things). world -> dict(name, desc, kind, label2, head, body, src, art)"""
R = {}
def add(n, name, desc, kind, label2, head, body, src, art='new'):
    R[n] = dict(n=n, name=name, desc=desc, kind=kind, label2=label2, head=head, body=body, src=src, art=art)

add(17, 'FIRST QUARKS', 'Fast electrons bounce off tiny hard points inside a proton.', 'MEASURED', 'SLAC 1968',
    'ELECTRONS AS TINY RULERS',
    'A 17 GeV electron has a wavelength of 7.3 × 10⁻¹⁷ m (h × c ÷ energy). SLAC fired electrons in this range at protons and saw them bounce off tiny hard parts, later called quarks. You are 2.3 times that wavelength.',
    'WIKIPEDIA: DEEP INELASTIC SCATTERING')
add(18, 'SHORT REACH', 'The weak force reaches only about 1/700th of a proton.', 'MEASURED', 'W BOSON MASS',
    'A FORCE THAT BARELY REACHES',
    'The weak force is carried by the W boson, mass 80.37 GeV. A force reaches about ħ ÷ (m × c) = 2.5 × 10⁻¹⁸ m, roughly 1/700 of a proton. You are about 7 times that reach. Textbook figures vary from 10⁻¹⁸ to 10⁻¹⁶ m.',
    'PDG (W MASS) · WIKIPEDIA: WEAK INTERACTION')
add(19, 'RIPPLE SEA', 'A passing gravitational wave stretched LIGO\'s arms by about two of you.', 'MEASURED', 'LIGO 2015',
    'SPACE STRETCHED BY ~2 OF YOU',
    'In 2015 LIGO caught a gravitational wave with a peak strain of 1.0 × 10⁻²¹. Strain × arm length (4,000 m) gives about 4 × 10⁻¹⁸ m of arm-length difference, a little over two of you.',
    'LIGO, PHYS. REV. LETT. 116, 061102 (2016)', art='old18')
add(20, 'COLLISION HALL', 'The LHC reaches this small. Quarks still show no parts inside.', 'MEASURED', 'LHC 13.6 TEV',
    'THE SMALLEST THING WE CAN PROBE',
    'The LHC collides protons at a total of 13.6 TeV. The matching wavelength is h × c ÷ energy = 9.1 × 10⁻²⁰ m, about half of you. Nothing has been found inside quarks or electrons down to about 10⁻¹⁹ m.',
    'CERN · WIKIPEDIA: QUARK')
add(21, 'GAMMA SKY', 'Twelve sources in our galaxy send light with wavelengths near your size.', 'MEASURED', 'LHAASO 2021',
    '100 TEV LIGHT FROM SPACE',
    'A 100 TeV photon has a wavelength of 1.2 × 10⁻²⁰ m, about three-quarters of you. In 2021 the LHAASO observatory in China reported a dozen sources in our galaxy sending photons above 100 TeV.',
    'LHAASO, NATURE, 2021')
add(22, 'RECORD LIGHT', 'A 2021 photon carried 1.4 quadrillion electronvolts. Its wavelength is half of you.', 'MEASURED', 'LHAASO 2021',
    'THE MOST ENERGETIC LIGHT, 2021',
    'LHAASO detected photons up to 1.4 PeV (1.4 × 10¹⁵ eV). Its wavelength is 8.9 × 10⁻²² m (h × c ÷ energy), about half of you.',
    'LHAASO, NATURE, 2021')
add(23, 'ONE ELECTRON', 'An electron has no measurable size. It cannot be bigger than this circle.', 'LIMIT', 'PENNING TRAP',
    'A POINT WITH NO INSIDE',
    'As far as any experiment can tell, an electron is a point: no size and no parts inside. Experiments only give an upper limit. Its radius is under about 10⁻²² m, the dashed circle, a little over half of you.',
    'WIKIPEDIA: ELECTRON')
add(24, 'DEEP SEA EYES', 'An undersea detector caught a neutrino of about 220 PeV in 2023.', 'MEASURED', 'KM3NET 2023',
    'THE MOST ENERGETIC NEUTRINO',
    'On 13 February 2023 KM3NeT, off the coast of Sicily at 3,500 m deep, caught a neutrino of an estimated 220 PeV. Its wavelength is 5.6 × 10⁻²⁴ m (h × c ÷ energy), a third of you. The energy has a wide error range.',
    'KM3NET, NATURE, 2025 · WIKIPEDIA: KM3NET')
add(25, 'TANK FIELD', 'Cosmic rays strike a field of 1,600 water tanks across 3,000 km².', 'MEASURED', 'AUGER',
    'A DETECTOR THE SIZE OF A COUNTY',
    'The Pierre Auger Observatory in Argentina has 1,600 water tanks over 3,000 km². It records air showers from cosmic rays above 1 EeV (10¹⁸ eV). Such a particle has a wavelength of 1.2 × 10⁻²⁴ m, about three-quarters of you.',
    'WIKIPEDIA: PIERRE AUGER OBSERVATORY')
add(26, 'BEYOND THE GALAXY', 'Auger found the highest-energy cosmic rays come from beyond our galaxy.', 'MEASURED', 'AUGER 2017',
    'COSMIC RAYS FROM OUTSIDE',
    'In 2017 Auger reported that cosmic rays above 8 EeV (8 × 10¹⁸ eV) arrive unevenly from the sky, which points to sources outside the Milky Way. At 8 EeV the wavelength is 1.6 × 10⁻²⁵ m, almost your size.',
    'AUGER, SCIENCE, 2017')
add(27, 'THE SKY LIMIT', 'Few cosmic rays pass 5 × 10¹⁹ eV. Big Bang microwaves slow them.', 'MEASURED', 'GZK LIMIT',
    'AN ENERGY CEILING IN SPACE',
    'Cosmic rays lose energy hitting the microwave glow left by the Big Bang. This should cap them near 5 × 10¹⁹ eV (the GZK limit), and experiments do see the flux drop there. Whether GZK is the cause is still debated. That energy has a wavelength of 2.5 × 10⁻²⁶ m, about 1.5 of you.',
    'WIKIPEDIA: GZK LIMIT')
add(28, 'OH-MY-GOD', 'A 1991 particle carried the energy of a 100 km/h baseball.', 'MEASURED', 'FLY\'S EYE 1991',
    'ONE PARTICLE, A BASEBALL\'S ENERGY',
    'The Oh-My-God particle (1991) had about 3.2 × 10²⁰ eV, around 51 joules, the energy of a 140 g baseball at about 28 m/s (100 km/h). Its wavelength is 3.9 × 10⁻²⁷ m (h × c ÷ energy), over two of you.',
    'WIKIPEDIA: OH-MY-GOD PARTICLE')
add(29, 'ROUND NEUTRON', 'A neutron is lopsided by no more than about your own height.', 'LIMIT', 'PSI 2020',
    'HOW ROUND IS A NEUTRON?',
    'A neutron could have its positive and negative charge slightly apart (an electric dipole moment). In 2020 the nEDM experiment at PSI, Switzerland, found less than 1.8 × 10⁻²⁶ e·cm. Divide by the charge e: 1.8 × 10⁻²⁸ m, about one of you.',
    'WIKIPEDIA: NEUTRON ELECTRIC DIPOLE MOMENT')
add(30, 'THALLIUM BEAM', 'The electron\'s charge is lopsided by less than your height.', 'LIMIT', 'BERKELEY 2002',
    'A ROUND ELECTRON, 2002',
    'In 2002 a Berkeley team sent a beam of thallium atoms between charged plates. A lopsided electron would shift the atoms\' energy, and they saw no shift. Limit: under 1.6 × 10⁻²⁷ e·cm, or 1.6 × 10⁻²⁹ m, about one of you.',
    'REGAN ET AL., PHYS. REV. LETT., 2002')
add(31, 'COLD MOLECULES', 'A cold molecule beam shows an electron lopsided by under half of you.', 'LIMIT', 'ACME 2014',
    'A ROUNDER ELECTRON, 2014',
    'ACME sent pulses of very cold thorium monoxide (ThO) molecules through lasers. The molecule\'s huge internal electric field would twist a lopsided electron\'s spin. Result: under 8.7 × 10⁻²⁹ e·cm, or 8.7 × 10⁻³¹ m, about half of you.',
    'ACME, SCIENCE, 2014')
add(32, 'INSIDE A MOLECULE', 'ACME\'s second try is eight times sharper. Still no lopsidedness.', 'LIMIT', 'ACME 2018',
    'EIGHT TIMES ROUNDER, 2018',
    'In 2018 ACME repeated the test with better control. Result: under 1.1 × 10⁻²⁹ e·cm, or 1.1 × 10⁻³¹ m, about two-thirds of you. That is eight times tighter than in 2014.',
    'ACME, NATURE, 2018 · PHYSICS WORLD')
add(33, 'ION RING', 'Trapped molecule ions tighten the limit to 2.4 times your size.', 'LIMIT', 'JILA 2023',
    'TRAPPED IONS, 2023',
    'In 2023 JILA (Colorado) trapped hafnium fluoride (HfF⁺) ions and measured the electron\'s spin for a long time. Result: under 4.1 × 10⁻³⁰ e·cm (90% confidence), or 4.1 × 10⁻³² m, about 2.4 of you.',
    'JILA · ROUSSY ET AL., SCIENCE, 2023')
add(34, 'LIGHT\'S RACE', 'Different colours of light race from a far-off flare and arrive together.', 'LIMIT', 'H.E.S.S. 2008',
    'IS SPACE GRAINY?',
    'In 2006 H.E.S.S. in Namibia watched a flare from a galaxy over a billion light-years away. Light of different energies arrived within minutes. If space were grainy, higher-energy light would lag. No lag means any grain is shorter than 2.7 × 10⁻³⁴ m (for a lag growing in step with energy), 0.16 of you.',
    'H.E.S.S., PHYS. REV. LETT. 101, 170402 (2008)')
add(35, 'DEAD HEAT', 'A 31 GeV photon crossed 7 billion light-years and arrived within a second.', 'LIMIT', 'FERMI 2009',
    'A TIGHTER LIMIT ON GRAININESS',
    'In 2009 NASA\'s Fermi telescope caught the burst GRB 090510 and a 31 GeV photon from it, 0.83 s after the burst began. Same test, tighter result: any grain is shorter than 1.4 × 10⁻³⁵ m (for a lag growing in step with energy), a twelfth of you.',
    'FERMI LAT AND GBM, NATURE, 2009')
add(36, 'PLANCK FOAM', 'About the Planck length, where physicists expect today\'s theories to stop working.', 'THEORY', 'PLANCK LENGTH',
    'THE END OF THE SCALE?',
    'The Planck length is 1.616255 × 10⁻³⁵ m. A proton is about 10²⁰ Planck lengths across. Nobody knows if anything shorter even makes sense.',
    'CODATA 2022, VIA WIKIPEDIA: PLANCK UNITS', art='old35')
