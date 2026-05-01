# LMU Setup HUB

## What it is

Node.js + Express server running on the same PC as Le Mans Ultimate. Serves a mobile-friendly web UI on the LAN. Lets drivers share car setups via Upstash Redis with ephemeral sessions.

## How to run

Double-click `start.bat` — installs deps, shows the LAN IP, opens the browser, starts the server.

Or manually:
```bash
npm install
node index.js
```

Server runs on port 8080. Access from phone: `http://<PC-IP>:8080`

## How it works

1. Driver A opens the UI on their phone, types a session name (e.g. `hodei`), taps **SEND**
2. Server reads setup from local LMU → uploads to Redis as key `hodei` (TTL 48h)
3. Driver A tells Driver B the session name over Discord
4. Driver B opens the UI on their PC, types `hodei`, taps **RECEIVE**
5. Server fetches from Redis → applies to their local LMU

**Each driver runs their own instance of this server on their own PC.**
Both point to the same Upstash Redis.

## Architecture

```
[Driver A PC - LMU running]          [Upstash Redis]
  Node:8080
  ├── GET  /                → index-ui.html
  ├── POST /api/push
  │     └── GET  localhost:6397/rest/garage/UIScreen/CarSetupOverview
  │         └── SET hodei EX 172800 ──────────────────────► Redis
  └── POST /api/pull
        └── GET  hodei ◄─────────────────────────────────── Redis
            └── GET  localhost:6397/rest/garage/UIScreen/CarSetupOverview (current state)
                └── diff → POST localhost:6397/rest/garage/{KEY} per changed value (Promise.all)
```

## LMU API endpoints used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/rest/garage/UIScreen/CarSetupOverview` | Read full setup — returns `carSetup.garageValues` |
| POST | `/rest/garage/{KEY}` | Set one parameter. Body: `{"value": N}` |
| GET | `/rest/garage/summary` | Car and circuit metadata |

- API only works while LMU is open **in the garage**, not in the main menu.
- Parameters: `VM_BRAKE_BALANCE`, `WM_COMPOUND-W_FL`, etc. — full list in garageValues.
- Individual POSTs sent in parallel via `Promise.all`.
- PULL diffs current LMU state vs stored and only sends changed values.

## What does NOT work in LMU API

- Creating/saving named setup files via REST — endpoint does not exist.
- `POST /rest/garage/refreshSetups` — has no visible effect, removed from flow.
- Sending full setup JSON in one call — must iterate individual parameter keys.

## Environment variables (.env — gitignored)

```env
PORT=8080
REDIS_URL=rediss://default:TOKEN@HOST.upstash.io:6379
LMU_URL=http://localhost:6397
TTL_SECONDS=172800
```

Copy `.env.example` to `.env` and fill in Upstash credentials.
The `rediss://` (double s) is correct — Upstash requires TLS.

## Session keys

- User types just the name: `hodei` (max 10 chars, alphanumeric only)
- Stored in Redis as-is: `hodei` (no date prefix)
- TTL: 48h

## Project files

```
index.js          Express server — push/pull/health endpoints
index-ui.html     Mobile UI (dark theme, Orbitron font, red SEND + blue RECEIVE)
start.bat         One-click launcher — installs deps, shows IP, opens browser
package.json      type: module | deps: express ioredis node-fetch dotenv
.env              Upstash credentials (gitignored)
.env.example      Template
.gitignore        Excludes node_modules/, .env, .claude/
```

## ioredis import (ESM gotcha)

ioredis is CommonJS — use default import:
```js
import Redis from 'ioredis'
const redis = new Redis(process.env.REDIS_URL)
```
`import { createClient } from 'ioredis'` will crash.

## Redis debug

```bash
redis-cli -u $REDIS_URL KEYS "*"
redis-cli -u $REDIS_URL TTL "hodei"
redis-cli -u $REDIS_URL GET "hodei"
redis-cli -u $REDIS_URL DEL "hodei"
```
