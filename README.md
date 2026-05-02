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

## LMU REST API used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/rest/options/UIScreen/Controls` | Read FFB strength and full device config |
| POST | `/rest/options/setControls` | Write FFB strength (requires full Controls JSON) |
| GET | `/rest/options/liveInputs` | Read real-time steering axis position (for center) |

FFB value is stored at:
```
allControls.directInput.Devices[<wheel>]["Force Feedback"]["Steering effects strength"]
```
Scale: 0–10000 (displayed as 0–100%).

## Device detection

The server auto-detects the wheel by looking for a device whose `instance name` contains `VNM Direct Drive`. Falls back to the first device of type `Wheel` with Force Feedback enabled.
