# Found while picking the gems: some very common answers score as Mythic

This is **not about gems**. It is an existing problem in the answer lists, found on 14 Nov 2026 while I read them. Nothing was changed.

## What I verified

I built a throw-away in-memory database from the same bank files that were imported live (`list-build/batch*/bank.json`), ran the **real answer checker** on it (`PipelineJudge`, tool `tools/judge-probe.mts`), and typed what a player would type:

| Question | Typed | Result | Should be |
|---|---|---|---|
| a football club | `Real Madrid` | **Mythic (100)**, as the separate entry "Real Madrid" | Common (the full "Real Madrid Club de Fútbol" is Common) |
| a currency | `dollar`, `pound`, `franc` | **Mythic** (entries "Dollar", "Pound", "Franc") | Common ("United States dollar" and "pound sterling" are Common) |
| a Star Wars character | `Darth Sidious` | **Mythic** | about Uncommon (`Palpatine` is Uncommon) |
| a technology company | `Hewlett-Packard`, `HP` | **Mythic** | Uncommon ("HP Inc." is Uncommon) |

Cause: Wikidata has a second, little-known item with the same short name, so the list holds two answers for one obvious thing, and the short, obvious form lands on the rare one.

## What I only inferred

A rough scan (`tools/shadow-scan.cjs`, output `gems/shadow-answers.json`) looks for a Legendary or Mythic entry whose name is the first words of a Common or Uncommon entry in the same question. It found 72 entries in 37 questions. **Many are false positives** (a film really is called "Home", a series really is called "Stranger"). Likely real ones, not yet run through the checker: `Mercedes` (car brand), `Constantine`, `Marcus` and `Wu` (emperors), `Snow White` (animated film), `Eid` (holiday), `Tekken`, `Street Fighter`, `The Witcher`, `Team Fortress`, `Pokémon Red`, `Cassini`, `Viking`, `Henry V`, `Benedict`. The scan covered Batches 1 to 4 (178 questions); the original 22 questions were not scanned.

## What it costs a player

Typing the obvious answer scores 100 instead of 10 to 20: it inflates scores and makes the rarity feel random. It also matters for gems: a gem pick must not collide with one of these.

## Suggested fix (needs your yes, it is production data)

Review the list (I can shortlist the real cases), then for each real case set the short entry to the same rarity as the full-name entry with `answers set-tier <question> "<name>" <tier>` (the corrections command that logs the change). Rehearse on a copy first, refresh the bank sheet afterwards. This is the audit you said you might ask for; it fits well before the gems go in.

## Second finding (15 Nov 2026): the lower tiers hold answers of the wrong kind

Checking about 200 candidate gems against their Wikipedia articles, I had to throw out **more than twenty Mythic answers that are not answers to their question at all**. They are real entries in the live lists, so a player can type them and score points. Examples (question: entry):

- Name a dessert: Triscuit, Wheat Thins (crackers). Name a cocktail: Cola & Pola (a soft drink brand).
- Name an ocean, sea, bay or gulf: Baltasound (a village), Kapellskär (a port).
- Name a religion: Our Lady of La Vang, Rosa Mystica (titles of Mary).
- Name a Japanese dish: Sticks'n'Sushi, Yukimura (restaurants).
- Name a professional footballer: Gian Piero Ventura (a football manager).
- Name a president: Didier Migaud, Guido Carli, Ramón Jáuregui (not heads of state).
- Name a unit of measurement: Miniassegno, Meißner Groschen (coins), byte per second (bit rate).
- Name an application: SWViewer (a Wikipedia project page), Olympic Channel (a TV service).
- Name a horror film: Cult Killer (called a crime thriller by its own article).

The full list with reasons is in `gems/exclude.txt`. This is exactly what the audit you mentioned would clean up; the sheet you read shows only the best-known answers, so these sit unseen in the lower tiers. I did not touch the lists.

## A limit I hit (not a bug): the lists have a floor of obscurity

For big categories (cities, singers, movies, countries, Nobel laureates) the answer lists were built from the well-known part of the class, so the least-known answer they contain is still known in 20 to 50 Wikipedia languages. A truly obscure gem there would first need the list to be extended with more obscure real answers.
