# LMU Setup HUB

Share Le Mans Ultimate car setups between drivers instantly over the internet — no file transfers, no Discord uploads.

## How it works

Each driver runs this server on their own PC (the one with LMU open). Both connect to the same Upstash Redis instance in the cloud.

```
Driver A (sends)                    Upstash Redis               Driver B (receives)
─────────────────                   ─────────────               ────────────────────
Opens UI on phone
Types "hodei" → SEND ──────────────► SET hodei ◄────────────── Types "hodei" → RECEIVE
                                                                 Setup applied to LMU ✓
```

1. Driver A opens `http://localhost:8080`, types a session name, taps **SEND**
2. Server reads the active setup from LMU's local REST API → uploads to Redis
3. Driver A shares the session name with Driver B (Discord, chat, etc.)
4. Driver B opens `http://localhost:8080` on their PC, types the same name, taps **RECEIVE**
5. Setup is applied to their LMU automatically

## Requirements

- [Node.js](https://nodejs.org) 18+
- Le Mans Ultimate running on the same PC (must be in the garage for the API to work)
- A free [Upstash](https://upstash.com) Redis database

## Setup

**1. Clone the repo**
```bash
git clone https://github.com/Huriz/lmu-setup-hub.git
cd lmu-setup-hub
```

**2. Create your `.env`**
```bash
cp .env.example .env
```

Edit `.env` and fill in your Upstash Redis URL:
```env
PORT=8080
REDIS_URL=rediss://default:YOUR_TOKEN@YOUR_HOST.upstash.io:6379
LMU_URL=http://localhost:6397
TTL_SECONDS=172800
```

> Get your `REDIS_URL` from the Upstash console → your database → **Connect** → **ioredis**

**3. Run**

Double-click `start.bat` — it installs dependencies, shows your LAN IP, and opens the browser.

Or manually:
```bash
npm install
node index.js
```

## Usage

| Action | Who | Steps |
|--------|-----|-------|
| Share your setup | Driver sending | Open UI → type a name → tap **SEND** |
| Load a setup | Driver receiving | Open UI → type same name → tap **RECEIVE** |

- Session names: max 10 characters, letters and numbers only
- Sessions expire after 48 hours
- LMU must be open **in the garage** — the API is not active in menus

## Accessing from phone (LAN)

When you run `start.bat`, it prints your local IP:

```
  LMU Setup HUB
  ================================
  Local:   http://localhost:8080
  Network: http://192.168.1.X:8080   ← open this on your phone
  ================================
```

## Tech stack

- **Node.js + Express** — HTTP server and LMU API proxy
- **ioredis** — Redis client (Upstash compatible)
- **Upstash Redis** — serverless Redis for session storage
- **LMU REST API** — local garage API on `localhost:6397`

## LMU API notes

The server talks to LMU's local REST API (`localhost:6397`) server-to-server, so no CORS issues.

On PULL, it reads the current LMU state first, diffs it against the stored setup, and only sends parameters that actually changed — using `Promise.all` for parallel requests.

Things that don't work via the LMU API (tried):
- Creating/saving named setup files
- `POST /rest/garage/refreshSetups` — no visible effect
- Sending the full setup JSON in one shot — must iterate individual keys

## License

MIT
