# Growing from 500 to 1,000 questions (planning note, 18 Nov 2026)

The owner asked on 18 Nov 2026 to go from 500 to 1,000 questions and for suggestions on the other numbers that follow. This is a plan, not a decision: nothing in it has been done except where it says so.

## Where we are (18 Nov 2026)

500 approved questions, 425,799 answers, 598,207 other spellings, 500 gems. The database is 130 MB. The Fly volume is 1 GB (974 MB usable), the machine 512 MB. The server process uses about 135 MB.

Questions per category now and the adds that would make all 11 categories equal at 1,000 (91 each):

| Category | Now | Add |
| --- | --- | --- |
| Movies & TV | 53 | 38 |
| Food | 50 | 41 |
| Music | 48 | 43 |
| Miscellaneous | 48 | 43 |
| Science & Technology | 46 | 45 |
| Places | 46 | 45 |
| History & Mythology | 45 | 46 |
| Games | 45 | 46 |
| Animals & Nature | 45 | 46 |
| Sports | 44 | 47 |
| Transport & Vehicles | 30 | 61 |

Transport is the thin one: few Wikidata classes give a good question there. A twelfth category would also spread the load (the Daily picks one question per category, 7 a day).

## The numbers that follow from 1,000

| Number | Today (500) | At 1,000 | What to do |
| --- | --- | --- | --- |
| Gems | 500 | 1,000 (one per question, the rule stands) | nothing in the code: the cabinet holds up to 2,000 (`CABINET_MAX`) |
| Answers | 425,799 | about 850,000 | the same recipe; trim very long tails with a higher language floor (lesson 40 in `docs/ANSWER_LISTS.md`) |
| Database | 130 MB | about 260 MB | see the disk line |
| **Disk** | 974 MB usable; the database plus 3 daily copies plus up to 2 hand-made copies is 6 copies | 6 x 260 MB = 1.56 GB | **does not fit: extend the volume before about 570 questions** (6 x 150 MB = 900 MB). `fly volumes extend` to 3 GB costs about $0.30 a month more ($0.15 per GB). Fly's own volume snapshots stay free up to 10 GB |
| Memory | 512 MB machine, process 135 MB | probably 170 to 200 MB | keep 512 MB; go to 1 GB only if the process passes about 350 MB |
| Bank sheet (the owner's review page) | 8.1 MB | about 16 MB, over the 16 MB limit of a published page | split it in two pages (by category), or leave the other spellings out of it, before the 900th question |
| Daily rotation | a question comes back after about 71 days (500 / 7) | about 143 days | no change; it is the planner's "least recently used first" rule |
| Run, timer, scoring | 7 questions, 30 s, at most 840 points | the same | no change (Planck Foam at 555, a gem 120 points) |
| Achievement "half the cabinet" / "complete cabinet" | 250 / 500 gems | 500 / 1,000 gems | the last step is "every gem there is" so it follows the bank |

## Pace and the honest limit

The 150 questions of Batches 8 to 13 took two days of wall time (Wikidata was slow and failed often) and about 230 candidate topics (65% kept). To add 500 more at that yield, about 770 candidate topics are needed, and the easy Wikidata classes are mostly used up: later topics will be narrower. Suggested order: **reach 750 first** (two more batches of about 125, with the Transport and Sports categories and a possible twelfth category first), look at how the questions play, then decide on the last 250. Other sources if Wikidata runs dry: more franchises (characters of one series), more people by occupation, songs of artists with 80 or more songs, and hand-written lists reviewed by the owner (for kids' topics and Singapore topics Wikidata is thin).

## Open questions for the owner

1. A twelfth category (for example Art and Literature, or Language and Words), or keep 11? 2. Is 750 first, then 1,000, fine? 3. OK to extend the volume to 3 GB now (about $0.30 a month more)? 4. Split the bank sheet in two pages?
