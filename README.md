# 🏋️ Smart Weightlifting Glove

> **IoT Hackathon Project** — Real-time biomechanics monitoring with ESP32, Wokwi, Node.js, and Next.js

**Author:** Mayukh Banerjee — 23BIT0061

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [System Architecture](#-system-architecture)
3. [Tech Stack](#-tech-stack)
4. [Project Structure](#-project-structure)
5. [Prerequisites](#-prerequisites)
6. [Complete Run Guide](#-complete-run-guide)
   - [Step 1 — Build ESP32 Firmware](#step-1--build-esp32-firmware-platformio)
   - [Step 2 — Start the Backend](#step-2--start-the-backend)
   - [Step 3 — Start the Frontend](#step-3--start-the-frontend-dashboard)
   - [Step 4 — Start Wokwi Simulation](#step-4--start-the-wokwi-simulation)
   - [Step 5 — Verify Live Data](#step-5--verify-the-pipeline)
7. [Data Pipeline](#-data-pipeline)
8. [Sensor Input Format](#-sensor-input-format)
9. [Processed Output Format](#-processed-output-format)
10. [Decision Engine Rules](#-decision-engine-rules)
11. [API Reference](#-api-reference)
12. [Demo Phases](#-demo-phases)
13. [Configuration](#-configuration)
14. [Troubleshooting](#-troubleshooting)

---

## 🔬 Project Overview

The **Smart Weightlifting Glove** is a full-stack IoT system that monitors a weightlifter's performance in real time. An ESP32 microcontroller (simulated in Wokwi) reads data from an MPU6050 accelerometer and a DHT22 temperature sensor, then transmits the data over WiFi as HTTP POST requests to a Node.js backend. The backend processes the raw sensor data through a biomechanics pipeline and streams live insights to a Next.js dashboard via WebSocket (Socket.IO).

### What It Measures
| Metric | How |
|---|---|
| **Grip Force** (left/right) | Derived from tremor + motion instability |
| **Form Quality** | IMU deviation from baseline (score 0–100) |
| **Fatigue Index** | Tremor severity + skin temperature elevation |
| **Stability Score** | Jerk magnitude + tremor compound |
| **Rep Count & Tempo** | Auto-detected from accelerometer cycles |
| **Body Temperature** | DHT22 sensor reading |
| **Injury Risk** | 9-rule decision engine (SAFE / WARNING / DANGER) |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  HARDWARE LAYER — Wokwi ESP32 Simulation                            │
│                                                                     │
│   MPU6050 ──► Accelerometer (X/Y/Z)  → Jerk, IMU score             │
│   DHT22   ──► Temperature            → Body temperature             │
│   LED     ──► WARNING/DANGER indicator                              │
│   Buzzer  ──► DANGER alert tone                                     │
│   OLED    ──► Local display (Reps, Temp, Status)                    │
│                                                                     │
│   I2C Pins: SDA = GPIO4, SCL = GPIO5                                │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          │  WiFi: "Wokwi-GUEST" (simulated)
                          │  HTTP POST → /sensor-data  (every 1 second)
                          │  JSON: { reps, tremor, jerk, temperature, imu }
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  BACKEND LAYER — Node.js + Express (port 4000)                      │
│                                                                     │
│   POST /sensor-data                                                 │
│         │                                                           │
│         ▼                                                           │
│   processor.js  ──► computeInsights()                              │
│         │           Grip / Form / Fatigue / Stability / Reps        │
│         ▼                                                           │
│   decisionEngine.js ──► evaluateSafety()                           │
│         │                9 rules → alerts + risk level              │
│         ▼                                                           │
│   Socket.IO ──► io.emit('data', processedData)                      │
│                                                                     │
│   Also available:                                                   │
│   GET  /health   ← server status + active mode                     │
│   GET  /ports    ← list available COM ports                        │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          │  WebSocket (Socket.IO)
                          │  ws://localhost:4000
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  FRONTEND LAYER — Next.js Dashboard (port 3000)                     │
│                                                                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│   │ Status   │  │ KPI Grid │  │  Charts  │  │  Alert Panel     │  │
│   │   Bar    │  │ 6 cards  │  │  3 live  │  │  + Coach Panel   │  │
│   └──────────┘  └──────────┘  └──────────┘  └──────────────────┘  │
│                                                                     │
│   ┌───────────────────────────────────────────────────────────┐    │
│   │              Risk Analysis (full width)                   │    │
│   └───────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Microcontroller | ESP32 DevKit v1 | Sensor reading + WiFi HTTP |
| Simulation | Wokwi + VS Code extension | Virtual hardware environment |
| Firmware Build | PlatformIO | Compile + package `.bin` firmware |
| Sensor (Motion) | MPU6050 (I2C) | Accelerometer → jerk, IMU score |
| Sensor (Temp) | DHT22 | Skin temperature |
| Display | SSD1306 OLED (128×64) | Local real-time display |
| Backend | Node.js + Express | HTTP server + processing engine |
| WebSocket | Socket.IO | Live push to dashboard |
| Frontend | Next.js 16 + TypeScript | Real-time dashboard |
| Charts | Recharts | Live data visualization |
| Styling | Tailwind CSS v4 | UI design system |

---

## 📁 Project Structure

```
Hackathon/
│
├── smart-glove-wokwi/          ← ESP32 Firmware (PlatformIO)
│   ├── src/
│   │   └── main.cpp            ← Firmware: sensors + WiFi + HTTP POST
│   ├── diagram.json            ← Wokwi circuit wiring
│   ├── platformio.ini          ← PlatformIO build config
│   ├── wokwi.toml              ← Wokwi firmware paths
│   └── libraries.txt           ← Library list reference
│
├── backend/                    ← Node.js Backend
│   ├── server.js               ← Main server: Express + Socket.IO
│   ├── package.json            ← Backend dependencies
│   └── services/
│       ├── processor.js        ← Raw → insights computation engine
│       ├── decisionEngine.js   ← 9-rule alert + risk level engine
│       ├── serialBridge.js     ← Serial COM port bridge (optional)
│       └── simulator.js        ← Built-in demo simulator (disabled)
│
├── app/                        ← Next.js App Router
│   ├── page.tsx                ← Main dashboard page (Socket.IO client)
│   ├── layout.tsx              ← Root layout + metadata
│   └── globals.css             ← Global styles
│
├── components/
│   └── dashboard/              ← Dashboard UI components
│       ├── status-bar.tsx      ← Injury risk + connection indicator
│       ├── kpi-grid.tsx        ← 6 KPI metric cards
│       ├── data-visualization.tsx  ← Live charts (Recharts)
│       ├── alert-panel.tsx     ← Active alerts list
│       ├── coach-panel.tsx     ← AI coach recommendations
│       └── risk-analysis.tsx   ← Risk breakdown + score bars
│
├── lib/
│   ├── mock-data.ts            ← MockData type definition + seed data
│   └── utils.ts                ← Shared utilities
│
├── package.json                ← Frontend dependencies
└── README.md                   ← This file
```

---

## ✅ Prerequisites

Before running the project, ensure you have:

| Tool | Version | Check |
|---|---|---|
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| VS Code | Latest | — |
| Wokwi VS Code Extension | Latest | Install from VS Code marketplace |
| PlatformIO VS Code Extension | Latest | Install from VS Code marketplace |

> **Windows users:** You may need to run PowerShell as Administrator for the first `npm install`.

---

## 🚀 Complete Run Guide

> Run each step **in order**. Keep each terminal open.

---

### Step 1 — Build ESP32 Firmware (PlatformIO)

Open a terminal inside VS Code and navigate to the firmware folder:

```powershell
cd "smart-glove-wokwi"
```

Build using PlatformIO (run the full path since `pio` may not be on your PATH):

```powershell
& "$env:USERPROFILE\.platformio\penv\Scripts\pio.exe" run
```

**Expected output:**
```
Building in release mode
Compiling .pio/build/esp32dev/src/main.cpp.o
...
RAM:   [=         ]  14.5% (used 47352 bytes from 327680 bytes)
Flash: [=======   ]  71.1% (used 931549 bytes from 1310720 bytes)
========================= [SUCCESS] Took 17.53 seconds =========================
```

This generates:
- `.pio/build/esp32dev/firmware.bin`
- `.pio/build/esp32dev/firmware.elf`

These are automatically picked up by `wokwi.toml`.

> ⚠️ **Only rebuild when you change `main.cpp`.** The compiled binary is already present from the last build.

---

### Step 2 — Start the Backend

> **Open a new terminal.** Keep this running for the entire session.

```powershell
cd "backend"
node server.js
```

**Expected output:**
```
╔══════════════════════════════════════════════════╗
║   🏋️  Smart Weightlifting Glove — Backend v2     ║
╠══════════════════════════════════════════════════╣
║  HTTP  → http://localhost:4000                   ║
║  WS    → ws://localhost:4000                     ║
╚══════════════════════════════════════════════════╝

  POST /sensor-data  ← ESP32 HTTP endpoint
  GET  /health       ← Status check
  GET  /ports        ← List available COM ports
```

The backend is now listening for HTTP POST from Wokwi and WebSocket connections from the dashboard.

---

### Step 3 — Start the Frontend Dashboard

> **Open a new terminal.** Keep this running for the entire session.

```powershell
cd "Hackathon"    ← root of the project
npm run dev
```

**Expected output:**
```
▲ Next.js 16.2.0 (Turbopack)
- Local:    http://localhost:3000
✓ Ready in 582ms
```

Open your browser at: **[http://localhost:3000](http://localhost:3000)**

The dashboard will load and show **"CONNECTING…"** badge until Wokwi starts.

> ℹ️ The frontend connects via Socket.IO to `http://localhost:4000` automatically.

---

### Step 4 — Start the Wokwi Simulation

> **This is the only step done inside VS Code GUI.**

1. In VS Code, open the `smart-glove-wokwi` folder (File → Open Folder)
2. The `wokwi.toml` file is already configured to use the built firmware
3. Press **`F1`** → type **`Wokwi: Start Simulator`** → press **Enter**

   **OR** click the **Wokwi play button** in the VS Code status bar at the bottom.

**Expected Wokwi Serial Monitor output:**
```
[Boot] Smart Glove v3 — WiFi+HTTP mode
[WiFi] Connecting to Wokwi-GUEST....
[WiFi] ✅ Connected! IP: 10.x.x.x

---- SENSOR DATA ----
Reps: 0
Temp: 36.6
Jerk: 18
Tremor: 0.1
IMU: 10.5
WiFi: OK
-------
{"reps":0,"tremor":0.10,"jerk":18,"temperature":36.6,"imu":10.5}
[HTTP] ✅ POST OK → dashboard updated
```

**Expected Backend terminal output (after Wokwi starts):**
```
[WS] ✅ Dashboard connected – xxxxxxxxxx
```

**Expected Dashboard behavior:**
- Badge switches from `CONNECTING…` → **`HTTP / ESP32`**
- KPI cards populate with live values
- Charts begin drawing real-time data
- Injury Risk shows **SAFE** (green)

---

### Step 5 — Verify the Pipeline

Run this in any terminal to confirm the POST endpoint is accepting data:

```powershell
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:4000/sensor-data" `
  -ContentType "application/json" `
  -Body '{"reps":5,"tremor":3.2,"jerk":25,"temperature":37.1,"imu":13.5}'
```

**Expected response:**
```json
{
  "success": true,
  "mode": "hardware-http"
}
```

Check overall system health:
```powershell
Invoke-RestMethod -Uri http://localhost:4000/health
```

**Expected response:**
```json
{
  "status": "ok",
  "mode": "hardware-http",
  "uptime": 45,
  "timestamp": 1775772187516
}
```

---

## 📡 Data Pipeline

```
ESP32 (main.cpp)
  │
  │  Raw JSON every 1 second:
  │  { reps, tremor, jerk, temperature, imu }
  │
  ▼
POST /sensor-data  (server.js)
  │
  ▼
computeInsights()  (processor.js)
  │  Computes:
  │  • Left/Right grip force
  │  • Grip balance score
  │  • Form quality score (0–100)
  │  • Fatigue index (LOW/MEDIUM/HIGH)
  │  • Stability score (0–100)
  │  • Rep tempo (FAST/NORMAL/SLOW)
  │
  ▼
evaluateSafety()  (decisionEngine.js)
  │  9 rules → injury_risk + alerts + recommendations
  │  Final risk: SAFE / WARNING / DANGER
  │
  ▼
io.emit('data', processedData)  (Socket.IO)
  │
  ▼
Next.js Dashboard
  Live updates every 1 second
```

---

## 📥 Sensor Input Format

The ESP32 sends this JSON via HTTP POST to `/sensor-data` every second:

```json
{
  "reps": 5,
  "tremor": 2.3,
  "jerk": 25,
  "temperature": 37.2,
  "imu": 13.5
}
```

| Field | Type | Range | Description |
|---|---|---|---|
| `reps` | integer | 0–∞ | Cumulative rep count |
| `tremor` | float | 0.0–10.0 | Hand tremor severity |
| `jerk` | integer | 0–100 | Motion instability (normalized delta acceleration) |
| `temperature` | float | 36.0–40.0 | Skin/ambient temperature in °C |
| `imu` | float | 10.0–35.0 | Composite form quality (10 = perfect) |

---

## 📤 Processed Output Format

The backend emits this enriched object via Socket.IO `data` event:

```json
{
  "grip": {
    "left": 55,
    "right": 70,
    "balance_score": 78
  },
  "form": {
    "score": 82,
    "deviation": 3.2
  },
  "fatigue": {
    "level": "MEDIUM",
    "score": 47
  },
  "stability": 73,
  "reps": {
    "count": 12,
    "tempo": "NORMAL"
  },
  "temperature": 37.4,
  "injury_risk": "WARNING",
  "alerts": [
    { "type": "WARNING", "message": "Fatigue building — rest recommended." },
    { "type": "INFO",    "message": "💪 10 reps completed — great work!" }
  ],
  "recommendations": [
    "Pace yourself — fatigue is building. Hydrate and breathe.",
    "Form is slipping. Slow your rep tempo for better control."
  ],
  "timestamp": 1775763295386
}
```

---

## 🧠 Decision Engine Rules

The decision engine evaluates 9 rules in priority order:

| # | Trigger Condition | Alert Type | Risk Upgrade | Action |
|---|---|---|---|---|
| 1 | `fatigue.score ≥ 80` | WARNING | → WARNING | Rest 60 seconds |
| 2 | `fatigue.score ≥ 45` | — | none | Pace + hydrate |
| 3 | `form.score < 50` | WARNING | → WARNING | Reduce weight 20% |
| 4 | `form.score < 70` | — | none | Slow rep tempo |
| 5 | `grip.balance < 60%` | WARNING | → WARNING | Reposition left hand |
| 6 | `grip.balance < 75%` | INFO | none | Adjust left pressure |
| 7 | `jerk > 75` | WARNING | → WARNING | Strict mechanics |
| 8 | `stability < 40` | WARNING | none | Wrist support |
| 9 | `temperature > 38.5°C` | WARNING | → WARNING | Stop + hydrate |
| **CRITICAL** | `tremor > 7.5 AND fatigue > 70` | **CRITICAL** | **→ DANGER** | **🛑 DROP WEIGHT** |

---

## ⚡ API Reference

### `GET /health`
Returns current server status and active data mode.

```json
{
  "status": "ok",
  "mode": "hardware-http",
  "uptime": 120,
  "timestamp": 1775763295386
}
```

Possible `mode` values:
- `"simulator"` — No hardware connected, simulator running
- `"hardware-http"` — ESP32 sending data via HTTP POST
- `"hardware-serial"` — ESP32 connected via COM port

---

### `GET /ports`
Lists all available COM ports on the host machine.

```json
{
  "ports": [
    { "path": "COM5", "manufacturer": "wokwi" },
    { "path": "COM3", "manufacturer": "Silicon Labs" }
  ]
}
```

---

### `POST /sensor-data`
Accepts raw sensor data from ESP32 (or manual test).

**Request body:**
```json
{ "reps": 5, "tremor": 2.3, "jerk": 25, "temperature": 37.2, "imu": 13.5 }
```

**Response:**
```json
{ "success": true, "mode": "hardware-http" }
```

**Error response (missing field):**
```json
{ "error": "Missing or invalid field: tremor" }
```

---

### `WebSocket — event: 'data'`
The dashboard connects to `ws://localhost:4000` via Socket.IO.

```js
const socket = io('http://localhost:4000');
socket.on('data', (processedData) => {
  // update dashboard
});
```

---

## 🎭 Demo Phases

The ESP32 firmware simulates a progressive workout session with **3 phases over ~3 minutes**:

| Phase | Ticks (1 tick = 1s) | Injury Risk | What's Happening |
|---|---|---|---|
| **SAFE** | 0 – 60 | 🟢 SAFE | Low tremor, good form, stable temperature |
| **WARNING** | 60 – 120 | 🟡 WARNING | Fatigue building, form degrading, grip imbalance |
| **DANGER** | 120 – 180 | 🔴 DANGER | Severe tremor + high fatigue → CRITICAL alert |

On the physical OLED display and LEDs:
- **SAFE**: LED off, buzzer off
- **WARNING**: LED solid ON
- **DANGER**: LED flashing, buzzer ON

To **restart the demo**, stop and restart the Wokwi simulation.

---

## ⚙️ Configuration

### Backend — Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | HTTP + WebSocket port |
| `SERIAL_PORT` | _(none)_ | Enable serial bridge (e.g. `COM5`) |
| `SERIAL_BAUD` | `115200` | Serial baud rate |

**To enable serial bridge (alternative to WiFi HTTP):**
```powershell
$env:SERIAL_PORT="COM5"; node server.js
```

### Firmware — `main.cpp` Configuration

```cpp
const char* WIFI_SSID    = "Wokwi-GUEST";  // Wokwi simulated WiFi
const char* WIFI_PASSWORD = "";             // No password

const char* BACKEND_HOST = "10.238.162.149"; // ← Your PC's WiFi IP
const int   BACKEND_PORT = 4000;
```

> ⚠️ **If your PC's IP changes**, update `BACKEND_HOST` in `main.cpp` and rebuild:
> ```powershell
> & "$env:USERPROFILE\.platformio\penv\Scripts\pio.exe" run
> ```
>
> Find your current WiFi IP:
> ```powershell
> Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -like "*Wi-Fi*" }
> ```

### Frontend — Environment Variables

Create a `.env.local` file in the project root to override the backend URL:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

---

## 🔧 Troubleshooting

### ❌ Dashboard shows "CONNECTING…" forever

**Cause:** Backend is not running.

**Fix:**
```powershell
cd backend
node server.js
```
Then refresh the browser.

---

### ❌ Wokwi Serial Monitor shows `[WiFi] ⚠️ Could not connect`

**Cause:** Wokwi WiFi simulation requires the `Wokwi-GUEST` SSID — no other SSID works in simulation.

**Fix:** Ensure `main.cpp` has:
```cpp
const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";
```

---

### ❌ Wokwi shows `[HTTP] ❌ Error: connection refused`

**Cause:** Wrong `BACKEND_HOST` IP, or backend is not running.

**Fix:**
1. Confirm backend is running: `Invoke-RestMethod http://localhost:4000/health`
2. Find your correct WiFi IP:
   ```powershell
   Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -like "*Wi-Fi*" }
   ```
3. Update `BACKEND_HOST` in `main.cpp` and rebuild with PlatformIO

---

### ❌ `pio` command not found

**Fix:** Use the full path:
```powershell
& "$env:USERPROFILE\.platformio\penv\Scripts\pio.exe" run
```

---

### ❌ Backend crashes on startup / `serialport` error

**Fix:** Reinstall optional dependencies:
```powershell
cd backend
npm install
```

---

### ❌ Port 4000 or 3000 already in use

```powershell
# Find and kill the process using port 4000:
netstat -ano | findstr :4000
taskkill /PID <the-PID-number> /F
```

---

## 📊 Hardware Circuit (Wokwi)

| Component | GPIO Pin | Protocol |
|---|---|---|
| MPU6050 (SDA) | GPIO 4 | I2C |
| MPU6050 (SCL) | GPIO 5 | I2C |
| SSD1306 OLED (SDA) | GPIO 4 | I2C |
| SSD1306 OLED (SCL) | GPIO 5 | I2C |
| DHT22 (Data) | GPIO 2 | OneWire |
| LED (Anode) | GPIO 12 | Digital |
| Buzzer | GPIO 14 | Digital |

---

## 📜 License

MIT — Mayukh Banerjee, 23BIT0061
