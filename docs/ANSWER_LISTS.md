# Answer lists: how they are built and grown (since 12 Nov 2026, no model in the live game)

The live game accepts an answer only if it is on the question's list (see `docs/SERVER.md`, "How an answer is judged"). So the lists have to be as complete as we can make them. They are grown offline, and nothing reaches the live site without running a command.

## What the player experiences
- Exact answer, an alias, or the same answer written another way (hyphen/space, British spelling, Roman numeral, "Mt" for "Mount"): accepted at once.
- A slip (swapped letters, a missing or wrong letter; a wrong first letter counts double): "Did you mean X?" The player says yes or no.
- Anything else: "We don't have that one. Check the spelling or try another." The text is kept with the attempt.

## The loop that makes the lists better
1. `npm run cli -- answers unknown` shows what players typed that was not found, most often first. If it is valid: `answers add <question-id> "<name>" <0-5> --alias "..."`, or `answers alias <question-id> <answer> "<other way to write it>"`.
2. `npm run cli -- answers lint` lists pairs of different answers that are one slip apart. A pair is a warning: a typo near both would be ambiguous, and an alias one letter off an unrelated phrase is how odd corrections happen (krillion's FAQ admits this happens to them).
3. `npm run cli -- answers list <question-id> --source wikidata` (or `--source curated`) shows what the builders added, to vet.

## Growing the lists in bulk (offline, uses the internet only for Wikidata)
- `npx tsx packages/server/src/expand/build.ts --out <folder>` asks Wikidata (public-domain data) for everything in the class each question is about (venomous snake species, apple cultivars, pharaohs, volcanoes, airlines ...) and writes ONE review file per question: new answers with a tier, and other names for answers we already have. It only READS the database. `--only <question-id>` does one question; `--cached` redoes the merging from what was fetched (kept in `<folder>/raw`) without asking Wikidata again.
- **How a tier is chosen** for a new answer: how many Wikipedia languages know the thing (Wikidata "sitelinks"; for World Cup teams, the number of tournaments), compared with the answers that question already has. The question's own tier counts are laid over its answers in order of how well known they are, and a new answer takes the tier of the place it would stand in (less known than all of them: the rarest tier). The file records the rank correlation between "how well known" and the existing tiers (`rankCorrelation`): about -0.8 for airlines, pharaohs and constellations (good), about -0.4 for programming languages and apples, -0.1 for rivers and warship types (weak: check those tiers).
- `data/curated/make-curated.cjs` writes hand-written lists for questions Wikidata cannot cover (kitchen junk drawer, wall-outlet items) and a Smash fighter roster. `data/group-terms.json` holds the group names that count as Common ("viper", "bear" ...).
- `npm run cli -- answers import-expansion <file or folder> [--dry-run]` adds a review file (a folder: every .json in it). `answers import-groups` adds the group names. Both only ADD, never change or remove, and skip anything a person ruled out. Added answers get `source = wikidata` or `curated`.
- To undo an import: `DELETE FROM answers WHERE source IN ('wikidata','curated')` removes the answers and their aliases go with them (foreign keys cascade).

## What the first run found (12 Nov 2026, on a copy of the local database)
- 17,568 new answers and about 21,000 new aliases over 21 questions; 108 + 106 hand-written items for the junk drawer and the wall outlet.
- On 22 real, valid answers the old lists did not have: 2 accepted before, 20 after. Three of those 20 are things I also wrote into the hand-written lists, so they are not independent evidence; the Wikidata part alone found 17 of the 19 others (missed: Fregola, Kaijudo).
- On 74 fakes, traps, past rulings and injection texts: 1 accepted by mistake ("Swissair", a Wikidata alias that belongs to the airline that replaced it). The other 73 were rejected, and answers a person ruled out are never re-added.
- An unknown answer costs about 45 ms on the biggest list (rivers, 22,734 written forms).
- Known weak spots: rivers (10,247 new, mostly small streams, and 62,000 close pairs), apples (2,016, most known in one language only), programming languages (many dialects and implementations at one tier), warship types, instruments, genres and civilizations (Wikidata's classes are broader than the question's rules). Look at these first. To import fewer: raise a recipe's `minSignal` in `expand/build.ts` (rivers known in at least 2 languages: 6,745 of 10,247).
- The Smash recipe adds NO new answers (Wikidata mixes in bosses and assist trophies); the roster is hand-written. The Hitchcock recipe only adds films known in 20+ languages.

## Putting the lists on the live site (done on 12 Nov 2026; these steps worked)
Deploy the new code first, then import the lists straight away: the code alone is stricter than the old model-based site, because an answer that is not on the list is rejected. Use `C:Usersweibi.flyinlyctl.exe` and see the quoting gotchas in the notes (no double quotes inside the `-C` command; `free` and `ps` do not exist in the image, read `/proc`).
1. Back up: `... ssh console --app minitude-lwb -C $cmd` with `$cmd` = `sh -c 'cd /app/packages/server && DATABASE_FILE=/data/minitude.db node --import tsx src/cli.ts db backup /data/backups'` (a single-quoted PowerShell here-string).
2. Deploy: `flyctl deploy --ha=false --app minitude-lwb` from the repo root.
3. Pack the review files (the folder's `*.json`, about 370 KB zipped): `tar czf expansion.tgz *.json`, upload with `flyctl ssh sftp put expansion.tgz /data/expansion.tgz --app minitude-lwb`, unpack on the machine: `sh -c 'mkdir -p /data/expansion && tar xzf /data/expansion.tgz -C /data/expansion'`.
4. Look first: `... cli.ts answers import-expansion /data/expansion --dry-run`; then without `--dry-run`; then `... cli.ts answers import-groups`. Running them again adds nothing.
5. Check: `db stats`, the site's `/api/health`, and play a solo run through the real API (an unknown text must give "We don't have that one...", an imported answer must count).
- Memory: the import is a second node process (peak about 90 MB) next to the server (about 100 MB at its busiest) on the 256 MB machine, which has about 210 MB usable. It fitted; if it ever does not, `flyctl scale memory 512` for the import and back after (a small cost).
- Result of the first import: 1,964 answers became 19,429 and 1,439 spellings became 22,135. After it the server used 76 MB (peak 99 MB) and a lookup of unknown text took 30 to 60 ms (300 ms on the rivers list).
- A mistake the live check caught: the naval recipe also imported the root class "warship", which is the question's own subject word. It was removed on the live site with `answers remove transport-class-of-naval warship` and the recipe now skips it. After any import, look for a question's own subject word among the new answers.
