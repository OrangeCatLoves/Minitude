# Multiplayer (rooms of 2 to 4)

Built on 6 November 2026. Rooms and matches live **in the server's memory**: nothing about them is stored, and they count nowhere else (no Daily, no streak, no standings).

## What it does (your decisions, `docs/DECISIONS.md` rows 60 to 64)

- A player picks MULTIPLAYER on the title screen, types a nickname (kept in the browser), then creates a room (private or public) or joins one: with a 5-letter code, or from the list of public rooms.
- The host starts the match once 2 to 4 players are in the room. Nobody can join after the start.
- Everybody gets the **same seven questions, one at a time, at the same moment**. A round ends when every player has a valid answer or has run out of the 30 seconds.
- Each player sees their own screen exactly like a solo run (their own shrinking, reveals and dives) plus a panel on the left with the other players: name, running total, and as soon as someone answers correctly their **rarity and points** ("RARE +40"). The answer **text** appears only when the round is over.
- After the seventh round: the personal report plus a ranking (equal totals share a rank). BACK TO ROOM goes to the room, where the host can press PLAY AGAIN; HOME leaves.
- A player who leaves or loses their connection for more than 20 seconds scores 0 for the rest of the match; the others carry on.

## How a round runs

1. The host's START MATCH: the room becomes "playing"; the first question begins 3 seconds later.
2. The server sends `roundStart` (the prompt goes out only now) to everybody. Each browser shows it as soon as it has finished the last reveal.
3. A player answers with an ordinary request. The same checker as solo judges it (stored rulings first, then the model). The time the checker takes is given back, as in solo. A valid answer is announced to the others at once (tier and points only).
4. The round is over when every player has a result. The server sends `roundEnd` with everybody's answers and the running totals.
5. Each browser plays its own reveal and dive, then tells the server it is **ready**. The next question starts when every connected player is ready, or after at most 40 seconds. So a round lasts as long as its slowest reveal: a Mythic answer with a new world card keeps the others waiting (they can tap a world card to skip it).
6. After round 7 the server sends `matchEnd` with the standings.

The clock is the solo clock (`server/src/clock.ts`): 30 s from 0.55 s after the question appears, 3 s of grace for the network, 12 tries per question, a miss when the time runs out.

## Where it lives

| Piece | File |
| --- | --- |
| Shared shapes (rooms, events, name and code rules) | `packages/core/src/versus.ts` |
| The rooms, rounds, clock, disconnects, rematch (no network code) | `packages/server/src/versus.ts` (`VersusHub`) |
| The HTTP routes and the live event stream | `packages/server/src/versusRoutes.ts` |
| The name check (basic bad-word filter) | `packages/server/src/names.ts` |
| Browser: the connection and what it knows | `packages/web/src/versus.ts` (`VersusClient`), `api.ts` |
| Browser: lobby screens, the players panel, the standings | `packages/web/src/lobbyui.ts` |
| Browser: the match inside the game | `packages/web/src/game.ts` (search for `Versus`) |

The server starts the hub's clock in `index.ts` (`versus.tick()` twice a second): deadlines, slow reveals, vanished players, empty rooms.

### The API (all under `/api/versus`, the player's id in the `x-guest` header)

| Request | What it does |
| --- | --- |
| `GET rooms` | the public rooms that are waiting, have space and someone connected |
| `POST create` `{name, visibility}` / `POST join` `{code, name}` | make or join a room |
| `POST :code/start`, `rematch`, `visibility`, `leave` | host actions and leaving |
| `POST :code/answer` `{round, text, confirm?}` | an answer (same reply as solo) |
| `POST :code/miss`, `ready` `{round}` | "my time ran out", "my reveal is over" |
| `GET :code/events` | the live stream (Server-Sent Events): `sync` (everything), `room`, `roundStart`, `answered`, `roundEnd`, `matchEnd`, `closed` |

The browser reads the stream with `fetch`, not `EventSource`, because the player's id travels in a header. If the connection drops it opens again and the server sends `sync` again, so a short break loses nothing. A keep-alive goes out every 15 seconds so proxies do not close a quiet connection.

## Limits and what to know

- **A deploy or restart ends every open room** (they are in memory). Players land on the menu with "You are no longer in that room."
- Most 100 rooms at once; 300 multiplayer requests a minute per network address; an empty room is deleted after 2 minutes.
- **The answer checker's own budget still applies** (default 10 checks a minute, 200 a day: `LLM_MAX_PER_MINUTE`, `LLM_MAX_PER_DAY`). Answers already in the database cost nothing, but a room of four trying new answers can use the minute's allowance. Raise the limits only to match what your Gemini plan allows.
- The name filter is basic and English only (`names.ts`, two word lists). There is no report button, no chat, no spectators, and no way to remember a room after a page reload (a reload leaves the room; the 20-second rule then removes the player).
- Public rooms are visible to anyone who opens the game. Google's terms for the Gemini API restrict use on sites that may be reached by under-18s: read them before promoting public rooms.
- Not tested on real phones: the on-screen keyboard (typing the name, the code and the answers) and landscape layout with the keyboard up.

## Testing

- `packages/server/test/versus.test.ts` (25 tests, fake clock and fake checker): names, creating and joining (full, started, taken name, blocked name), public list, host rules, the first question, what others see (rarity yes, text no until the round ends), wrong answers and typo questions, the wait for slow reveals and its limit, time-outs, the checker's time given back, leaving and vanishing, ranking with ties, rematch, limits, and the HTTP routes with a real event stream.
- `tools/browser-test/versus.cjs`: three real browsers play a whole match through the real screens (name, create a public room, join by code and from the list, a blocked name, answers right and wrong, a time-out, a player leaving, results, rematch). Their game clocks are stepped (`?manual=1`), so reveals take no real time.
- `tools/browser-test/versus-live.cjs`: two browsers on the real clock for the first two questions (proves the live loop and the wait for reveals).

Both browser scripts need a server in **mock mode on a copy of the database** (never the live one) serving the built game, and a bank file exported from that copy:

```bash
npm run build -w @minitude/web
npm run cli -- db backup packages/server/data      # a safe copy; move it to packages/server/data/mp-test.db
cd packages/server
PORT=8791 DATABASE_FILE=data/mp-test.db LLM_PROVIDER=mock node --import tsx src/index.ts       # one terminal
DATABASE_FILE=data/mp-test.db npx tsx src/cli.ts questions export data/mp-test-bank.json --all  # another
cd ../../tools/browser-test && npm install
MINITUDE_URL=http://127.0.0.1:8791 MINITUDE_CHANNEL=chrome node versus.cjs
```

(`MINITUDE_CHANNEL=chrome` uses the Chrome already installed instead of a Playwright download. Delete the copy and the bank file afterwards.)
