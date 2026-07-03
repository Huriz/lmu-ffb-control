# LMU FFB Control

Mobile web interface to adjust Force Feedback strength in **Le Mans Ultimate** in real time while driving.

## What it does

- **4-zone touch pad** — tap to change FFB by +1%, +5%, −1%, −5%
- **Center button** — re-calibrates the steering wheel center (sets axis neutral point via LMU REST API)
- **Live FFB badge** — always shows current FFB % in the header
- **Flash feedback** — on each change the new value flashes in red (harder) or blue (softer) over the center button

## Architecture

```
Phone/Tablet browser
    └── Node.js proxy  (port 3000, this machine)
            └── LMU REST API  (port 6397, localhost)
```

The proxy is needed to avoid CORS — LMU's REST API does not allow cross-origin requests.

## Requirements

- **Node.js** v18+
- **Le Mans Ultimate** running with the REST API enabled (default: `localhost:6397`)
- Both devices on the same network

## Running

**First run — right-click `webserver/start-lmu-ffb-control.bat` → Run as Administrator**

The first time only, Administrator is required to:
- Install Node.js automatically via `winget` (if not already installed)
- Add a Windows Firewall inbound rule so phones and tablets on your local network can reach the server

After that first run, you can double-click the launcher normally — no Administrator needed.

Double-click `webserver/start-lmu-ffb-control.bat` — it checks/installs Node.js, installs dependencies, configures the Windows Firewall rule, starts the server, and opens the browser automatically.

Or manually:

```bash
cd webserver/backend
npm install
node index.js
```

When the launcher starts, it prints the addresses you can use:

```
  LMU FFB Control
  ================================
  Local:   http://localhost:3000
  Network: http://192.168.1.X:3000   ← open this on your phone
  Host:    http://YOUR-PC-NAME:3000  ← alternative if DNS resolves
  ================================
```

Port is configured in `webserver/backend/server.cfg` (default `PORT=3000`).

