# Minitude

Answer rare. Shrink far.

A pixel-art browser trivia game. You are 1.7 metres tall. Each of the seven questions in a run asks for any valid answer to a prompt ("Name a kind of cheese."). The less familiar a valid answer is, the more points it earns and the further you shrink: through a bookshelf, a drop of water, a strand of DNA, an atom, a proton, and on towards the Planck length, where today's physics stops.

This repository is **Phases 1 to 3**: the playable solo game, a SQLite database, an AI answer checker, an AI question generator, and the **Daily Challenge** (the same seven questions for everyone each UTC day, one attempt, no sign-up) with the files to put it online on Fly.io. The AI parts were tested only against a scripted fake model: **the real Gemini calls have never been run**, and **the Fly.io deploy has never been run** (see [`docs/STATUS.md`](docs/STATUS.md) for exactly what is and is not finished).

## Run it

Needs Node 20 or newer.

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. The game runs on port 5173 and its API on 8787 (Vite proxies `/api`).
Press PLAY DAILY (or Enter) for today's shared run, or SOLO RUN (or S) for an ordinary one. Type an answer, press Enter.

The first start creates the database (`packages/server/data/minitude.db`) and fills it with the 11 placeholder seed questions. With no API key the game runs in **mock mode**: only answers already in the database count, anything else comes back as "The demo checker doesn't know this answer. Try another." With a Gemini key (below) unknown answers are judged by the model, and its decision is stored so the same answer always scores the same.

### Production build

```bash
npm run build      # typechecks everything and builds packages/web/dist
npm start          # one process serves the game and the API on http://localhost:8787
```

### Other scripts

| Command | What it does |
| --- | --- |
| `npm test` | Unit tests for the scoring core and the API (Vitest). |
| `npm run typecheck` | TypeScript check of all three packages. |
| `npm run trial -w @minitude/server` | The live trial: about 30 answers through the real model with your key. Run this first. |
| `npm run cli -- help` | Review and manage questions and answers, run the question generator, back up the database. |

## How the game works

- **Seven prompts per run**, 30 seconds each. Running out of time scores 0 and does not shrink you.
- **Six rarity tiers:** Common 10, Uncommon 20, Rare 40, Exotic 60, Legendary 80, Mythic 100 points.
- **Size** = 1.7 m ÷ 10^(points ÷ 20). Worlds 1 to 20 are 20 points each. Between 400 and 439 points is the dark **Unexplored** stretch (no experiment has looked this small). **Planck Foam** (world 21) starts at 440 points; the finale plays the moment you cross it. Points past 440 still count.
- Two landings in a row inside Unexplored show "Something is getting closer."; three or more, "It is very close."
- After the finale you stay in Planck Foam and a line appears for each further answer.
- The report ends the run with your final size, your points, one row per answer, and a spoiler-free share text.
- **Daily Challenge:** everyone gets the same seven questions on the same UTC day (it changes at 00:00 UTC, 08:00 in Singapore). One attempt, no account: your browser keeps a random id. **Closing or reloading the page ends your run** (the rest scores 0). The report shows how you rank among that day's players and your streak. Solo runs never touch the standings.

The full rules and every decision behind them are in [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md).

## Layout

```
packages/
  core/     Pure TypeScript shared by browser and server: tiers, scoring, depth/size maths, world list,
            run records, edging hints, report and share text. No DOM, no Node. Fully unit tested.
  server/   Hono API + SQLite: starts a run, keeps the question clock, judges answers, serves the built game.
            db/ (schema, queries), judge/ (the answer checker), llm/ (Gemini, budget), generate/ (question writer), cli/.
  web/      The game. Vite + TypeScript. WebGL2 for the world zoom, Canvas 2D for everything else, WebAudio for sound.
Dockerfile, fly.toml                One container, one process, one volume: how it goes online (docs/DEPLOY.md).
tools/
  questions/ + build_questions.py   Source of the seed question bank (placeholder, unverified content).
  export_assets.py                  How the pictures were exported from the original Python art pipeline.
  art-source/                       The Python art and engine the game was ported from (reference only).
  browser-test/                     Playwright scripts that play the game headlessly and save screenshots.
docs/                               Status, decisions, engine notes, audio notes, testing, project context.
```

Start with [`CLAUDE.md`](CLAUDE.md) if you are continuing this with Claude Code.

## Answer checker, question generator and the database

Full description: [`docs/SERVER.md`](docs/SERVER.md). In short:

```bash
cd packages/server
cp .env.example .env                       # then put your key in .env (never commit it; .env is git-ignored)
cd ../..
npm run trial -w @minitude/server -- --generate    # FIRST: ~30 answers through the real model + one generated question
npm run cli -- questions generate                  # the model writes question DRAFTS (nothing is played yet)
npm run cli -- questions list --status draft
npm run cli -- questions show <id>                 # read the answers and the audit's notes
npm run cli -- questions approve <id>              # now it can be played
npm run cli -- answers review                      # answers the model added during play that a person should check
npm run cli -- db backup                           # a safe copy of the database file
```

Get a key at <https://aistudio.google.com/apikey>. The server keeps to a call budget (`LLM_MAX_PER_MINUTE`, `LLM_MAX_PER_DAY`, default 10 and 200): calls over it are refused, not sent.

**The Gemini code has never made a real call** (the sandbox it was written in cannot reach Google). Run the trial and read all of its output before you trust the checker or the generator.

## Putting it online

[`docs/DEPLOY.md`](docs/DEPLOY.md): Fly.io, one small machine in Singapore and a 1 GB disk for the database, about $3 to $4 a month while small (prices checked 29 October 2026). The `Dockerfile` and `fly.toml` were **never built or deployed** in the environment this was written in, so expect the first deploy to need a fix. The Daily needs at least 7 approved questions; the 11 placeholders are not for the public.

## Fonts and licences

Pixelify Sans and Silkscreen (SIL Open Font Licence 1.1) are included in `packages/web/public/fonts`. `PixelifyFix` is Pixelify Sans with one glyph patched so "5" is distinct. See [`docs/LICENSES.md`](docs/LICENSES.md). All pictures and sounds were made for this project.

The code has no licence file yet: add the one you want before publishing.
