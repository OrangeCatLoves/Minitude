# Putting Minitude online (Fly.io)

**Status: written but never run.** The build environment has no Docker and no Fly account, so the `Dockerfile` and `fly.toml` were not built or deployed. Their steps were copied by hand (install, build, drop dev tools, start with the same command) and the result was started and checked: it boots, serves the game, sets the cache headers, compresses, limits daily runs per network, writes a backup and shuts down cleanly on SIGTERM. The first real `fly deploy` is the real test. If it fails, paste the error into Claude Code.

Prices below were checked on 29 October 2026. Re-check them at <https://fly.io/docs/about/pricing/> before you rely on them.

## What runs

One container, one process: the Node server serves the built game and the API, and keeps the database in one SQLite file on a Fly **volume** (a disk that survives restarts and deploys). Because the database is one file on one disk, **there must be exactly one machine** (`--ha=false`). Two machines would be two different databases.

| Thing | Setting | Where |
| --- | --- | --- |
| Region | `sin` (Singapore) | `fly.toml` |
| Machine | shared-cpu-1x, 256 MB (the server used about 110 MB when measured) | `fly.toml` |
| Disk | volume `minitude_data`, 1 GB, mounted at `/data` | `fly.toml`, `fly volumes create` |
| Database | `/data/minitude.db` | `DATABASE_FILE` |
| Daily copies | `/data/backups/minitude-YYYY-MM-DD.db`, newest 7 kept | `BACKUP_DIR`, `BACKUP_KEEP` |
| Visitor address | read from the `Fly-Client-IP` header | `CLIENT_IP_HEADER` |
| Gemini key | a Fly **secret**, never in a file | `fly secrets set` |

## First deploy

You need a Fly account with a card on it. Run everything from the repo folder (the one with `fly.toml`).

1. **Install the tool and log in.** Mac: `brew install flyctl`. Linux: `curl -L https://fly.io/install.sh | sh`. Windows (PowerShell): `iwr https://fly.io/install.ps1 -useb | iex`. Then `fly auth login`.
2. **Make the app.** Names are shared by everyone on Fly, so pick your own: `fly apps create minitude-yourname`. Then change the `app = "minitude"` line in `fly.toml` to the same name.
3. **Make the disk** (same region as `primary_region`): `fly volumes create minitude_data --region sin --size 1`. Fly warns that one volume has no copy on another machine; that is expected here.
4. **Give it the Gemini key** (optional; without it the game runs in mock mode). Do not type the key into the command line, it would stay in your shell history:
   ```bash
   read -rs KEY; fly secrets set GEMINI_API_KEY="$KEY"; unset KEY
   ```
   Paste the key, press Enter (nothing shows while you paste). That form works in Mac, Linux and Git Bash. On plain Windows PowerShell, run `fly secrets set GEMINI_API_KEY=your-key` once and clear the history afterwards.
5. **Deploy:** `fly deploy --ha=false`. The first build takes a few minutes.
6. **Check it:** `fly status`, then open `https://<your-app>.fly.dev/api/health` (should show `"ok":true`) and `https://<your-app>.fly.dev`.

Every later deploy is the same command, `fly deploy --ha=false`. With one machine and one disk, a deploy stops the old machine before the new one starts, so the site is down for a short moment each time.

## Put the real questions on it

A new volume starts with the **11 placeholder questions**. Do not share the link until they are replaced. The Daily needs **at least 7 approved questions**.

Do the question work on your own computer (your key stays there), then move the approved ones across:

```bash
# on your computer, repo folder
npm run cli -- questions generate
npm run cli -- questions list --status draft      # read, then approve the good ones
npm run cli -- questions export approved.json     # file ends up in packages/server/
```

Then upload and import (this part is **untested**):

```bash
fly ssh sftp shell
#   put packages/server/approved.json /data/approved.json
#   exit
fly ssh console -C "sh -c 'cd /app/packages/server && DATABASE_FILE=/data/minitude.db node --import tsx src/cli.ts questions import /data/approved.json --approve'"
```

Then retire the placeholders (one command each) and look at the first Daily sets:

```bash
for id in food-cheese places-landlocked music-percussion misc-hat animals-shark movies-pixar sports-racket games-board science-element history-greek-deity transport-car-maker; do
  fly ssh console -C "sh -c 'cd /app/packages/server && DATABASE_FILE=/data/minitude.db node --import tsx src/cli.ts questions reject $id --reason placeholder'"
done
fly ssh console -C "sh -c 'cd /app/packages/server && DATABASE_FILE=/data/minitude.db node --import tsx src/cli.ts daily plan --days 7'"
```

`daily plan` chooses and saves the sets for today and the next days so you can look at them with `daily show`. A set cannot be changed once somebody has played that day.

The command-line tool and the running server can use the database at the same time (SQLite WAL mode with a 5 s wait), so the server does not need to be stopped.

## Your own address

```bash
fly certs add play.example.com
fly certs show play.example.com      # tells you which DNS records to add
```

Add the records at your domain registrar. Keep the records **DNS-only** (no proxy) at first.

**Cloudflare in front?** It would cache the 2.2 MB game files and cut Fly's outbound data bill, but then Fly sees Cloudflare's address instead of the visitor's, and the "10 daily runs per network" limit would count everyone behind one Cloudflare address together. If you do it, set `CLIENT_IP_HEADER = "cf-connecting-ip"` in `fly.toml`. The catch: anyone who calls `<app>.fly.dev` directly can then fake that header. Do not do this until traffic makes the data bill matter.

## Backups

- **Daily file copy:** the server writes `/data/backups/minitude-YYYY-MM-DD.db` once a day and keeps the newest 7. They are on the same disk, so they protect against a bad change or a deleted question, **not** against losing the disk.
- **Fly volume snapshots:** Fly takes these by itself (`fly volumes list`, `fly volumes snapshots list <volume-id>`); the first 10 GB of snapshots are free. This is the protection against losing the disk.
- **Copy one to your computer now and then:** `fly ssh sftp shell`, then `get /data/backups/minitude-2026-10-29.db`.

**Restoring a daily copy** (untested, and it avoids touching the live file on purpose): copy the chosen backup next to the database, point the server at it, deploy.

```bash
fly ssh console -C "cp /data/backups/minitude-2026-10-29.db /data/restored.db"
# in fly.toml change   DATABASE_FILE = "/data/restored.db"
fly deploy --ha=false
```

The old file stays where it was. Restoring from a volume snapshot is a Fly procedure (`fly volumes create --snapshot-id`); follow their current guide, and do not do it without asking Claude Code or Fly support first.

## What it costs

Fly charges for what runs; there is no monthly platform fee.

| Item | Price | For Minitude |
| --- | --- | --- |
| Machine, shared-cpu-1x 256 MB, always on | $2.19 a month in US regions; Singapore costs more (about a quarter more at the 1 GB size; the 256 MB Singapore price is not on the page) | about $3 a month |
| Volume | $0.15 per GB a month | 1 GB = $0.15 |
| Snapshots | first 10 GB free | $0 |
| Data out of Singapore | $0.04 per GB | each new visitor downloads about 2.2 MB (return visits come mostly from the browser cache): **1,000 new visitors is about 9 cents**, 10,000 new visitors a day is about $26 a month |
| IPv4 | a shared address is free, a dedicated one costs extra | you do not need a dedicated one |

So about **$3 to $4 a month while it is small**, mostly the always-on machine. Check the bill in the Fly dashboard after the first week.

If the server ever runs out of memory (Fly logs say "out of memory"): `fly scale memory 512`.

I have **not load tested** it. The first limits you would hit are the single CPU and the Gemini calls (10 a minute, 200 a day by default; `LLM_MAX_PER_MINUTE`, `LLM_MAX_PER_DAY`).

## Changing the settings

Non-secret settings live in `[env]` in `fly.toml`; change them and run `fly deploy --ha=false`.

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | 8787 | must match `internal_port` |
| `DATABASE_FILE` | `packages/server/data/minitude.db` (local), `/data/minitude.db` (Fly) | the SQLite file |
| `BACKUP_DIR` / `BACKUP_KEEP` | off / 7 | daily copies |
| `CLIENT_IP_HEADER` | none (uses the connection address) | `fly-client-ip` on Fly |
| `DAILY_PER_IP` | 10 | Daily runs per network per day; 0 turns the limit off |
| `LLM_PROVIDER`, `LLM_MODEL`, `LLM_MAX_PER_MINUTE`, `LLM_MAX_PER_DAY` | see `docs/SERVER.md` | the answer checker |
| `GEMINI_API_KEY` | none | **secret**: `fly secrets set` only |

## Leaving Fly later

Nothing here is Fly-only. The `Dockerfile` runs on any host that runs Docker; the whole database is one file. To move: take the newest `minitude-*.db` from `/data/backups`, put it on the new host's disk, run the container with `DATABASE_FILE` pointing at it, set the same secrets, point your domain at the new host. Set `CLIENT_IP_HEADER` to whatever header the new host's front door uses for the visitor's address (or leave it empty if the server sees visitors directly). If you ever need more than one server, that is the moment to move from SQLite to Postgres (a new `Repo`; see `docs/SERVER.md`).
