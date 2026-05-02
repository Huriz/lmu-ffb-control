# LMU Setup HUB

Share Le Mans Ultimate car setups between drivers instantly over the internet — no file transfers, no Discord uploads.

## How it works

Each driver runs this server on their own PC (the one with LMU open). Both connect to the same Upstash Redis instance in the cloud.

```
Driver A (sends)                    Upstash Redis               Driver B (receives)
─────────────────                   ─────────────               ────────────────────
Opens UI on phone
Types a name → SEND ───────────────► SET key ◄──────────────── Types same name → RECEIVE
                                                                 Setup applied to LMU ✓
```

1. Driver A opens the UI, types a session name, taps **SEND**
2. Server reads the active setup from LMU's local API → uploads to Redis
3. Driver A shares the session name with Driver B (Discord, chat, etc.)
4. Driver B opens the UI on their PC, types the same name, taps **RECEIVE**
5. Setup is applied to their LMU automatically

## Requirements

- [Node.js](https://nodejs.org) 18+
- Le Mans Ultimate running on the same PC (must be in the garage for the API to work)
- A free [Upstash](https://upstash.com) Redis database
- **WiFi or LAN connection** — the phone/tablet used as the UI must be on the same local network as the PC running the server

## Setup

**1. Clone the repo**
```bash
git clone https://github.com/Huriz/lmu-setup-hub.git
cd lmu-setup-hub
```

**2. Open `webserver/backend/server.cfg` and fill in your Upstash Redis URL**

```
PORT=3001
REDIS_URL=rediss://default:YOUR_TOKEN@YOUR_HOST.upstash.io:6379
LMU_URL=http://localhost:6397
TTL_SECONDS=3600
```

| Parameter | Description |
|-----------|-------------|
| `PORT` | Port the web server listens on. Open `http://your-ip:<PORT>` in a browser or on your phone. |
| `REDIS_URL` | Upstash Redis connection URL — contains your password, keep the file private. Get it at upstash.com → your database → **Connect** → **ioredis**. |
| `LMU_URL` | Address of LMU's local API. Don't change this unless LMU moves to a different port. |
| `TTL_SECONDS` | How long setups will stay alive in seconds. `3600` = 1 hour. |

**3. Run**

Double-click `webserver/start-lmu-setup-hub.bat` — it installs dependencies, shows your addresses, and opens the browser.

Or manually:
```bash
cd webserver/backend
npm install
node index.js
```

## Usage

| Action | Who | Steps |
|--------|-----|-------|
| Share your setup | Driver sending | Open UI → type a name → tap **SEND** |
| Load a setup | Driver receiving | Open UI → type same name → tap **RECEIVE** |

- Session names: max 10 characters, letters and numbers only
- Sessions expire after 1 hour
- LMU must be open **in the garage** — the API is not active in menus

## Accessing from another device (phone, tablet)

When you run `start-lmu-setup-hub.bat`, it prints the addresses you can use:

```
  LMU Setup HUB
  ================================
  Local:   http://localhost:3001
  Network: http://192.168.1.X:3001   ← open this on your phone
  Host:    http://YOUR-PC-NAME:3001  ← alternative if DNS resolves
  ================================
```

## Tech stack

- **Node.js + Express** — HTTP server and LMU API proxy
- **ioredis** — Redis client (Upstash compatible)
- **Upstash Redis** — serverless Redis for session storage
- **LMU REST API** — local garage API (port 6397)

## Future implementation

- Setup page accessible from the UI to change `server.cfg` parameters (Redis URL, port, TTL) on the fly, without editing the file manually

## License

MIT License — Copyright (c) 2025 Huriz
