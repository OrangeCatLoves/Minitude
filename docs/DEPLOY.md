# Putting Minitude online (Fly.io)

**Status: deployed on 5 November 2026** as `minitude-lwb` (<https://minitude-lwb.fly.dev>), region Singapore. The `Dockerfile` and `fly.toml` built and ran on the first try (a 78 MB image, built on Fly's servers, no Docker needed on your computer). Everything under "First deploy" and "Put the real questions on it" was run for real. Still untested: restoring from a backup, and a Daily played by real visitors. Notes marked **Learned on the first deploy** come from that run. If a deploy fails, paste the error into Claude Code.

Prices below were checked on 29 October 2026 and again on 5 November 2026. Re-check them at <https://docs.fly.io/about/pricing> before you rely on them.

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
| Answer-checker model | `LLM_MODEL = "gemini-3.5-flash-lite"` (the model the live trial found fast; the code default `gemini-3.8-flash` allows only 20 requests a day on the free tier). Your local `.env` is not on Fly, so every non-secret setting you rely on locally must be in `fly.toml` | `fly.toml` `[env]` |
| Gemini key | a Fly **secret**, never in a file | `fly secrets set` |

## First deploy

You need a Fly account with a payment method on it. **Learned on the first deploy:** a brand-new account is on a free trial that **stops every machine after 5 minutes** (the log says "Trial machine stopping") until you add a card in the dashboard. A deploy and a quick test fit inside the trial; a site that stays up does not. Adding a card lifted the limit at once. Fly places a hold of under US$10 when you add a card and cancels it; some banks decline it (check the bank app for the reason, and make sure online and overseas payments are allowed). Fly's billing page says prepaid cards cannot be saved as the payment method but can buy credits (minimum $25); whether credits alone lift the trial limit was not tested. Run everything from the repo folder (the one with `fly.toml`).

1. **Install the tool and log in.** Mac: `brew install flyctl`. Linux: `curl -L https://fly.io/install.sh | sh`. Windows (PowerShell): `iwr https://fly.io/install.ps1 -useb | iex`. Then `fly auth login`. If your setup blocks that one-liner (some security tools do), download the Windows zip from <https://github.com/superfly/flyctl/releases>, check its SHA-256 against the `..._checksums.txt` file of the same release, and unpack `flyctl.exe` into `%USERPROFILE%\.fly\bin`. If the login cannot open a browser, finish it with `fly auth login --code <the code the page shows after you approve>`.
2. **Make the app.** Names are shared by everyone on Fly, so pick your own: `fly apps create minitude-yourname`. Then change the `app = "minitude"` line in `fly.toml` to the same name.
3. **Make the disk** (same region as `primary_region`): `fly volumes create minitude_data --region sin --size 1`. Fly warns that one volume has no copy on another machine; that is expected here.
4. **Give it the Gemini key** (optional; without it the game runs in mock mode). Do not type the key into the command line, it would stay in your shell history:
   ```bash
   read -rs KEY; fly secrets set GEMINI_API_KEY="$KEY"; unset KEY
   ```
   Paste the key, press Enter (nothing shows while you paste). That form works in Mac, Linux and Git Bash. On plain Windows PowerShell, run `fly secrets set GEMINI_API_KEY=your-key` once and clear the history afterwards. **Learned on the first deploy:** do not use `fly secrets import` on Windows PowerShell with flyctl 0.5.4: it sends an invisible byte-order mark and Fly refuses the name (`"\ufeffGEMINI_API_KEY" is not a valid secret name`). `fly secrets set` works. Every non-secret setting your local `.env` has (such as `LLM_MODEL`) must also be in `fly.toml`, because Fly never sees that file.
5. **Deploy:** `fly deploy --ha=false`. The first build took about a minute on Fly's builder. If Fly warns that the "build context" is large, add the big folder to `.dockerignore` (`sound-lab` is listed for that reason).
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

Then upload and import (**run for real on 5 November 2026, it worked**: 22 questions, 1,272 answers):

```bash
fly ssh sftp put packages/server/approved.json /data/approved.json
fly ssh console -C "sh -c 'cd /app/packages/server && DATABASE_FILE=/data/minitude.db node --import tsx src/cli.ts questions import /data/approved.json --approve'"
```

Then retire the placeholders, clear the Daily sets, and plan them again:

```bash
for id in food-cheese places-landlocked music-percussion misc-hat animals-shark movies-pixar sports-racket games-board science-element history-greek-deity transport-car-maker; do
  fly ssh console -C "sh -c 'cd /app/packages/server && DATABASE_FILE=/data/minitude.db node --import tsx src/cli.ts questions reject $id --reason placeholder'"
done
# then, for each date that daily plan already shows (see the trap below):
fly ssh console -C "sh -c 'cd /app/packages/server && DATABASE_FILE=/data/minitude.db node --import tsx src/cli.ts daily clear 2026-11-05'"
fly ssh console -C "sh -c 'cd /app/packages/server && DATABASE_FILE=/data/minitude.db node --import tsx src/cli.ts daily plan --days 7'"
```

`daily plan` chooses and saves the sets for today and the next days so you can look at them with `daily show`. A set cannot be changed once somebody has played that day.

**Learned on the first deploy (a trap):** the server saves today's and tomorrow's Daily sets when it starts, from whatever is approved at that moment. On a fresh volume that is the 11 placeholders, so after you retire them those two days still hold rejected questions. Fix: `daily clear <date>` for **every** day that `daily plan` shows (not just the first two: planning the later days first made the first days repeat six of the same seven questions), then `daily plan --days 7` again. Check that neighbouring days share no questions. This only works while nobody has played those days.

**Learned on the first deploy (Windows PowerShell 5.1):** double quotes inside the `-C` command get mangled and Fly's tool reports "accepts at most 1 arg(s)". Put the command in a single-quoted here-string (`$cmd = @'` ... `'@.Trim()`), use `sh -c '...'` inside it, avoid double quotes (for `grep` use `-e a -e b`), and pass it as `fly ssh console --app <name> -C $cmd`.

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
| Machine, shared-cpu-1x 256 MB, always on | $2.19 a month in the cheapest US regions. The page gives no 256 MB price for Singapore; its 1 GB machine costs $8.50 in Singapore against $6.70 in the US (27% more), which would make the 256 MB one about $2.78 (an assumption) | about $2.8 a month |
| Volume | $0.15 per GB a month, also while the machine is stopped | 1 GB = $0.15 |
| Snapshots | $0.08 per GB a month after the first 10 GB (counted by data stored) | $0: the database is tiny |
| Data out of Singapore | $0.04 per GB (Asia Pacific), no free allowance | each new visitor downloads about 2.2 MB (return visits come mostly from the browser cache): **1,000 new visitors is about 9 cents**, 1,000 new visitors a day is about $2.60 a month, 10,000 a day about $26 |
| IPv4 / IPv6 | shared IPv4 and IPv6 are free; a dedicated IPv4 is $2 a month | you have a shared IPv4 only: do not allocate a dedicated one |
| Stopped machine | only its disk image (about $0.15 per GB a month), not CPU or memory | |

So about **$3 a month while it is small**, mostly the always-on machine. **Fly has no monthly spending limit and no billing alerts** (their cost page: "We don't support billing alerts (yet), so budget accordingly"). Look at "current month to date bill" under Billing in the dashboard (<https://fly.io/dashboard/personal/billing>) every few days at first. Prepaid credits are not a reliable cap: Fly's docs do not say what happens when they run out. A bank card with its own monthly limit is a real cap, but what Fly does when a charge is refused is not documented. If a surge ever worries you, stop the machine (dashboard, or `fly machine stop <id>`): a stopped machine costs only the disk. Fly says it will discuss refunds for resources created by mistake or bills caused by an attack: billing@fly.io.

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
| `LLM_PROVIDER`, `LLM_MODEL`, `LLM_FALLBACK_MODEL`, `LLM_MAX_PER_MINUTE`, `LLM_MAX_PER_DAY` | see `docs/SERVER.md` | the answer checker |
| `GEMINI_API_KEY` | none | **secret**: `fly secrets set` only |

## Leaving Fly later

Nothing here is Fly-only. The `Dockerfile` runs on any host that runs Docker; the whole database is one file. To move: take the newest `minitude-*.db` from `/data/backups`, put it on the new host's disk, run the container with `DATABASE_FILE` pointing at it, set the same secrets, point your domain at the new host. Set `CLIENT_IP_HEADER` to whatever header the new host's front door uses for the visitor's address (or leave it empty if the server sees visitors directly). If you ever need more than one server, that is the moment to move from SQLite to Postgres (a new `Repo`; see `docs/SERVER.md`).
