# The bank sheet

One searchable page with every question and every answer: the live game (what players are served), the draft questions waiting to be vetted, and the rejected ones. The owner reads it to see what is in the game and what is coming.

**Link (private, owner only):** https://claude.ai/artifact/89hoELZMxh65CK6HuUBLY1

What it shows: for each question the wording, **its SINGULARITY gem (name and one line; the gem answer is marked "◆ gem" in the answer list and in search results)**, the rules, where the answers came from (drafts), the answers by rarity (Common to Mythic) with other accepted spellings in grey; a search box that looks through every answer and spelling in every question; filters for Live / Draft / Rejected and category. It is a published page, not a file in the repo: the data is baked into it when it is generated.

## Keep it current (a standing rule)

Regenerate and republish it whenever the questions or answers change: a new batch drafted, a draft approved or rejected, answers added or removed (`answers add`, an expansion import), a tier fixed. It is read-only: editing the page changes nothing in the game.

```powershell
# 1. snapshot the LIVE database from Fly + build the page (list every batch of drafts that is not live yet)
.\tools\bank-sheet\refresh.ps1    # with nothing waiting to be vetted; otherwise add -Drafts "C:\Users\weibi\minitude\list-build\<batch>\bank.json=Batch N"
# 2. publish C:\Users\weibi\minitude\list-build\sheet\bank-sheet.html with the Artifact tool, same file path (keeps the link)
```

- Step 1 asks Fly for a consistent copy with the project's own `db backup` (into `/data/sheet-snapshot`, its own folder), downloads it, and deletes it from Fly again. Nothing else on the machine is touched, and the daily backups are not affected. It needs `flyctl` logged in.
- A draft that is already in the database (imported) is shown from the database; the draft file for it can stay in the list, it is skipped.
- To build from any other database file (for example the local `packages/server/data/minitude.db`, which is OLD: it lacks the Wikidata answers imported on Fly): `npx tsx src/cli/banksheet.ts --db <file> --drafts "<bank.json>=Label" --out <page.html> --asof "12 Nov 2026"` from `packages/server`. The database is only read.
- A question's "where the answers come from" sentence is shown for drafts made by the builder (`expand/newq.ts` writes it into `bank.json` as `sources`); live questions have none.
- **The page packs its data** (since 17 Nov 2026): the question data is compressed (gzip, then base64) inside the page and unpacked by the browser (`DecompressionStream`), because a published page may be at most 16 MB and the plain page had reached 14.3 MB with 250 live questions and 50 drafts. With 250 live and 100 draft questions the packed page is 7.2 MB. `--no-pack` writes the plain page. After building it, open it once in Chrome: `MINITUDE_CHANNEL=chrome node tools/browser-test/banksheet.cjs` (checks the counts, a search and the browser console).
- If `refresh.ps1` says "the live copy was not made" (the `flyctl ssh console` call stalled), run its steps by hand: the `db backup /data/sheet-snapshot` command on Fly, `flyctl ssh sftp get <that file> <local live-snapshot.db>`, `rm -r /data/sheet-snapshot` on Fly, then `banksheet.ts` as above. Delete the copy on Fly in any case.

## Where the code is

- `packages/server/src/cli/banksheet.ts`: reads the database (read-only) with `exportBank`, merges the draft files, writes the page.
- `packages/server/src/cli/banksheet.template.html`: the page (its data goes in at `/*DATA*/null`). Written for the Artifact tool: it has no doctype/head of its own.
- `tools/bank-sheet/refresh.ps1`: the snapshot + build steps above.
- `packages/server/test/banksheet.test.ts`.

Not in the sheet: the "does not count" lists, the hidden Daily sets, how often an answer was given, review flags. Ask if you want them.

Known display limits: other spellings of LIVE answers are shown in lower case (that is how the game stores them; matching ignores case anyway), draft answers keep their capitals. Live answers have no "where it came from" sentence.
