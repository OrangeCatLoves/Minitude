import sys
sys.path.insert(0, '/tmp/claude-0/-home-claude/3fd5d84e-d272-5730-bf2c-7b023869af54/scratchpad/real')
import final
P = '/home/claude/MINITUDE_PROJECT_CONTEXT.md'
s = open(P, encoding='utf-8').read()

# 1. the video does not show a skip
old = "The card cannot be skipped in the video. Invented worlds add"
assert old in s
s = s.replace(old, "The video does not show a skip; the skip rule in the next bullet was requested afterwards. Invented worlds add")

# 2. skip rule
skip = ("- **World cards can be skipped (requested 28 October 2026; NOT yet shown in the video, which is still the spec until it is re-cut).** "
"The player wants a tap to dismiss the card and go straight to guessing. Proposed defaults, to confirm: a tap or click anywhere, or Space or Enter, ends the card at once. "
"The band and text fade out in about 0.25 s and the next question slides up immediately, and the question timer starts then, as before, never during a card. "
"A small \"TAP TO SKIP\" hint sits at the lower right of the band on every card (Silkscreen 11 px, grey-blue, shown from the start; the draft frames show it). "
"Taps are ignored for the first 0.4 s, while the band opens, so a late tap from the dive or landing cannot skip a card the player has not seen. "
"The dive itself cannot be skipped. A card nobody taps still runs the standard 7.0 s. After the very last landing of a run, a tap on the card goes to the field note, and the field note keeps its 8.0 s hold unless tapped again, then the report slides in (proposed). "
"Skip plays only the closing swish. Reduced-motion mode skips with a plain fade. Keyboard and screen-reader users get the same Space or Enter skip, and the hint reads \"Press Space to skip\" on devices with a keyboard.\n")
anchor = "- **Font warnings (found 27 October 2026"
assert anchor in s
s = s.replace(anchor, skip + anchor, 1)

# 3. real-worlds proposal block
rows = [
 (17, '170 am', '7.3 × 10⁻¹⁷ m', '0.43'), (18, '17 am', '2.5 × 10⁻¹⁸ m', '0.14'), (19, '1.7 am', '4.0 × 10⁻¹⁸ m', '2.4'),
 (20, '170 zm', '9.1 × 10⁻²⁰ m', '0.54'), (21, '17 zm', '1.2 × 10⁻²⁰ m', '0.73'), (22, '1.7 zm', '8.9 × 10⁻²² m', '0.52'),
 (23, '170 ym', '1 × 10⁻²² m', '0.59'), (24, '17 ym', '5.6 × 10⁻²⁴ m', '0.33'), (25, '1.7 ym', '1.2 × 10⁻²⁴ m', '0.73'),
 (26, '170 rm', '1.6 × 10⁻²⁵ m', '0.91'), (27, '17 rm', '2.5 × 10⁻²⁶ m', '1.5'), (28, '1.7 rm', '3.9 × 10⁻²⁷ m', '2.3'),
 (29, '170 qm', '1.8 × 10⁻²⁸ m', '1.06'), (30, '17 qm', '1.6 × 10⁻²⁹ m', '0.94'), (31, '1.7 qm', '8.7 × 10⁻³¹ m', '0.51'),
 (32, '1.7 × 10⁻³¹ m', '1.1 × 10⁻³¹ m', '0.65'), (33, '1.7 × 10⁻³² m', '4.1 × 10⁻³² m', '2.4'), (34, '1.7 × 10⁻³³ m', '2.7 × 10⁻³⁴ m', '0.16'),
 (35, '1.7 × 10⁻³⁴ m', '1.4 × 10⁻³⁵ m', '0.08'), (36, '1.7 × 10⁻³⁵ m', '1.6 × 10⁻³⁵ m', '0.95'),
]
old_names = {17:'Quark Sea',18:'Gluon Rivers',19:'Ripple Sea',20:'Laser Hall',21:'Spark Field',22:'The Unknown',23:'Silent Dark',24:'The Hum',25:'String Garden',26:'Crystal Void',27:'Mirror Maze',28:'Foam Shore',29:'Loop Forest',30:'Bubble Tide',31:'Knot City',32:'Ribbon Sky',33:'Glass Tide',34:'Dream Static',35:'The Last Door',36:'Planck Foam'}
tab = ["| World | Your size | Old name | New name | Real size | Real size ÷ your size | Label |", "| --- | --- | --- | --- | --- | --- | --- |"]
for n, S, X, q in rows:
    r = final.R[n]
    tab.append('| %d | %s | %s | %s | %s | %s | %s · %s |' % (n, S, old_names[n], r['name'].title().replace("'S", "'s"), X, q, r['kind'], r['label2']))
tab = '\n'.join(tab)

notes = []
for n in sorted(final.R):
    r = final.R[n]
    notes.append("  - **World %d, %s** (%s · %s). Card line: \"%s\" Field note \"%s\": %s Source: %s." % (n, r['name'], r['kind'], r['label2'], r['desc'], r['head'], r['body'], r['src'].title() if False else r['src']))
notes = '\n'.join(notes)

block = """### Proposed: replace every invented world with something real (28 October 2026, pending the player's approval)

The player said 14 invented worlds in the lower half felt like too many and asked whether each could be replaced by something real at that size. Answer: yes for all of them, with one honest limit. Nothing smaller than about 10⁻¹⁸ m has ever been seen. So below world 18 the real things are not scenes. They are (a) probes, the wavelength of a real particle beam or cosmic ray, (b) limits, a measurement that says "nothing bigger than this was found", and (c) one theory scale, the Planck length. The pictures are drawings of the instrument or the event, not photos of anything at that size. Draft frames for all 20 worlds (17 to 36) were rendered with the real title cards and sent to the player on 28 October 2026. Nothing here is in the walkthrough video yet, so the video is still the spec until the player approves.

- **Rule for choosing.** The real size X must fall within about 0.08 to 3 times your size at the start of the world, so the card can say "about half of you" or "about two of you". Ratios in the table use the size at the start of the world (the same convention as the existing field notes).
- **Labels, shown on the card in place of "INVENTED WORLD · ART ONLY".** MEASURED (green): a real beam, particle or event with this wavelength or size was produced or seen. LIMIT (cyan): a real experiment found nothing bigger than this. THEORY (amber): a calculated scale nobody has reached. Only world 36 is THEORY. The card's bottom line reads, for example, "REAL · MEASURED · SLAC 1968".
- **How each number is obtained.** Wavelength of a particle = h × c ÷ energy, with h × c = 1.239841984 × 10⁻⁶ eV·m (so 17 GeV gives 7.3 × 10⁻¹⁷ m, 13.6 TeV gives 9.1 × 10⁻²⁰ m, 3.2 × 10²⁰ eV gives 3.9 × 10⁻²⁷ m). Reach of a force carried by a particle of mass m = ħ ÷ (m × c) = ħc ÷ (m c²), with ħc = 1.973269804 × 10⁻¹⁶ GeV·m (W boson, 80.37 GeV, gives 2.5 × 10⁻¹⁸ m). An electric dipole moment limit d in e·cm becomes metres by dividing by the charge e and converting cm to m: 1.8 × 10⁻²⁶ e·cm = 1.8 × 10⁻²⁸ m. The size limits from Fermi and H.E.S.S. come from the energy scale: length = ħc ÷ energy (H.E.S.S. 7.2 × 10¹⁷ GeV gives 2.7 × 10⁻³⁴ m) and the Planck length ÷ 1.2 (Fermi, 1.4 × 10⁻³⁵ m). The arithmetic was run in code, not by hand.
- **The table.** "Your size" is the world's starting size.

""" + tab + """

- **Card text and field notes (final draft wording).** Descriptions are one line, at most 14 words and at most 925 px at 22 px, measured.
""" + notes + """
- **Honest caveats to keep in the build.** (1) The LHC's 13.6 TeV is the total collision energy. The matching wavelength is a rule of thumb for how finely it can look, not one beam particle's wavelength. (2) Whether the GZK limit causes the drop in the highest-energy cosmic rays is still debated (the page says so). (3) KM3NeT's neutrino energy of about 220 PeV has a wide error range. (4) The Fermi and H.E.S.S. limits only apply to a model where the lag grows in step with energy. A different model gives a different limit. (5) The electric dipole limits turn into a length by assuming the limit is one electron charge displaced. That is the usual way to picture it, not a measured distance. (6) Weak-force range: sources vary between 10⁻¹⁸ and 10⁻¹⁶ m; the card uses the calculation and says so. (7) The Auger 2017 result is described as an uneven sky pattern pointing to sources outside the galaxy; the page confirms an anisotropy above 8 × 10¹⁸ eV and an extragalactic origin.
- **What was checked.** Fetched and read this session: GRB 090510 abstract (31 GeV, limit 1.2 Planck energy, redshift 0.903), JILA page (HfF⁺ ions in an ion trap), Physics World (ACME uses ThO, result under 1.1 × 10⁻²⁹ e·cm), Wikipedia on the Oh-My-God particle (140 g baseball at about 28 m/s, 100 km/h), GZK limit (5 × 10¹⁹ eV, HiRes drop, Auger confirmed the drop, cause debated), KM3NeT (13 February 2023, 220 PeV, 3,500 m deep off Sicily), Pierre Auger (3,000 km², 1,600 tanks, anisotropy above 8 × 10¹⁸ eV), LHAASO (a dozen sources, photons up to 1.4 PeV), neutron EDM (under 1.8 × 10⁻²⁶ e·cm, PSI 2020), deep inelastic scattering (SLAC 1968, internal structure of protons). Earlier in the session: JILA 4.1 × 10⁻³⁰ e·cm on arXiv 2212.11841, H.E.S.S. 7.2 × 10¹⁷ GeV on arXiv 0810.3475, the ACME and thallium values, and the electron radius limit. Not re-opened: the SLAC beam energy range (the card only says electrons "in this range"), journal page numbers (left out on purpose). All art is a draft and has not been seen on a phone.
- **Facts that would be displaced.** The 247-zeptosecond fact (world 20), the ronto prefix (world 28), the quecto prefix and "the last named size" (world 31) lose their world. Proposal: keep them in the field guide as extra facts at the same size, since the world 31 to 32 jump to powers of ten still needs explaining. The player has not decided this.
- **What changes in the build if approved.** 18 new scenes (worlds 17, 18, 20 to 35 except none, i.e. every world from 17 to 35 except 19) replace the old invented art; worlds 19 and 36 keep their art. All 14 old invented worlds disappear, so the "INVENDED"-style flag and the unit notes are no longer needed for worlds 17 to 35, and the "Worlds without a fact are invented" bullet above would become "every world has a sourced real item". The scenes keep the rule that the key subject stays out of the HUD strip: the build darkens the strip under the HUD (rows 14 to 34 of the 320 × 180 scene) to 55%, fading out by row 42.

"""
anchor2 = "### Scale bars and fun facts (third design pass"
assert anchor2 in s
s = s.replace(anchor2, block + anchor2, 1)
open(P, 'w', encoding='utf-8').write(s)
print('written', len(s))
