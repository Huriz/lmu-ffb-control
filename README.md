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
    └── Node.js proxy  (port 3002, this machine)
            └── LMU REST API  (port 6397, localhost)
```

The proxy is needed to avoid CORS — LMU's REST API does not allow cross-origin requests.

## Requirements

- **Node.js** v18+
- **Le Mans Ultimate** running with the REST API enabled (default: `localhost:6397`)
- Both devices on the same network

## Running

Double-click `webserver/start-lmu-ffb-control.bat` — it installs dependencies, starts the server, and opens the browser automatically.

Or manually:

```bash
cd webserver/backend
npm install
node index.js
```

Then open `http://<your-pc-ip>:3002` on your phone.

