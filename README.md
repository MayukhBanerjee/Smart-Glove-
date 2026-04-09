# 🏋️ Smart Weightlifting Glove — Complete IoT System

> **Hackathon-Ready** | Real-time IoT Pipeline | Wokwi + Node.js + Next.js Dashboard

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Wokwi Simulation                    OR   Real ESP8266           │
│  ESP8266 + DHT22 + MPU6050 + LED/Buzzer + Button                │
│         │                                     │                  │
│    Serial JSON (115200)                POST /sensor-data         │
└─────────────────┬───────────────────────────┬────────────────────┘
                  │                           │
                  ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Node.js Backend (port 4000)                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │  Simulator   │  │  Serial      │  │  POST /sensor-data  │   │
│  │  (3-phase)   │  │  Bridge      │  │  (hardware-ready)   │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬──────────┘   │
│         └─────────────────┴──────────────────────┘             │
│                            │                                    │
│              ┌─────────────▼─────────────┐                     │
│              │     Processor Engine      │                     │
│              │  Grip / Form / Fatigue /  │                     │
│              │  Stability / Reps         │                     │
│              └─────────────┬─────────────┘                     │
│              ┌─────────────▼─────────────┐                     │
│              │     Decision Engine       │                     │
│              │  9 Rules → Alerts / Risk  │                     │
│              └─────────────┬─────────────┘                     │
│                            │                                    │
│              ┌─────────────▼─────────────┐                     │
│              │  Socket.IO emit('data')   │                     │
└──────────────┼───────────────────────────┼─────────────────────┘
               │                           │
               ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Next.js Dashboard (port 3000)                                  │
│  StatusBar │ KPI Grid │ Charts │ AlertPanel │ Risk Analysis      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (2 Terminals)

### Terminal 1 — Backend
```powershell
cd "Hackathon\backend"
node server.js
```

### Terminal 2 — Frontend Dashboard
```powershell
cd "Hackathon"
npm run dev
```

Then open: **http://localhost:3000**

---

## 📊 Demo Mode

The backend automatically runs a **3-phase progressive session**:

| Time | Phase | What Happens |
|------|-------|-------------|
| 0–30s | ✅ **SAFE** | Low tremor, good form, stable reps |
| 30–60s | ⚠️ **WARNING** | Fatigue alerts, form degradation |
| 60–90s | 🚨 **DANGER** | Critical tremor + fatigue alerts |

After 90s, the session cycles back. Reload the backend to restart.

---

## 🔌 Hardware Integration (Tomorrow)

### Option A: ESP8266 via HTTP POST
No code changes needed. Just have the ESP8266 send:
```http
POST http://<your-laptop-ip>:4000/sensor-data
Content-Type: application/json

{
  "reps": 5,
  "tremor": 2.3,
  "jerk": 25,
  "temperature": 37.2,
  "imu": 13.5
}
```

### Option B: Wokwi Serial Bridge
1. Install [Wokwi CLI](https://docs.wokwi.com/wokwi-ci/cli-changelog)
2. Open the Wokwi extension in VS Code
3. Find your virtual COM port
4. Uncomment these lines in `backend/server.js`:
```js
const SERIAL_PORT = process.env.SERIAL_PORT || null;
if (SERIAL_PORT) {
  startSerialBridge(io, SERIAL_PORT).then(...);
}
```
5. Run: `SERIAL_PORT=COM3 node server.js`

---

## 📁 File Structure

```
Hackathon/
├── smart-glove-wokwi/
│   ├── diagram.json       ← Wokwi circuit (ESP8266 + sensors)
│   ├── sketch.ino         ← Arduino firmware (progressive simulation)
│   └── wokwi.toml         ← Wokwi CLI config
│
├── backend/
│   ├── server.js          ← Express + Socket.IO main server
│   └── services/
│       ├── simulator.js   ← 3-phase fatigue demo (SAFE→WARNING→DANGER)
│       ├── processor.js   ← Sensor data → insights pipeline
│       ├── decisionEngine.js ← 9-rule alert/risk logic
│       └── serialBridge.js   ← Serial → WebSocket bridge
│
├── app/
│   └── page.tsx           ← Dashboard (WebSocket integrated)
├── components/dashboard/  ← KPI, Charts, Alerts, Risk components
└── lib/
    └── mock-data.ts       ← Type definitions + initial mock data
```

---

## 📡 WebSocket Data Format

The backend emits this object every second via Socket.IO `data` event:

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
    { "type": "WARNING", "message": "Fatigue building..." }
  ],
  "recommendations": [
    "Pace yourself — fatigue is building."
  ],
  "timestamp": 1775763295386
}
```

---

## 🏗️ Processing Pipeline

### Serial Input Format (ESP8266 → Backend)
```json
{ "reps": 5, "tremor": 2.3, "jerk": 25, "temperature": 37.2, "imu": 13.5 }
```

### derived Metrics
| Raw Input | Derived Insight | Formula |
|-----------|----------------|---------|
| `tremor` + `jerk` | Grip (left/right) | Linear model with noise |
| `imu` | Form Score | `100 - (imu-10)*2 - tremor` |
| `tremor` + `temperature` | Fatigue Score | `tremor*9 + (temp-36.5)*6` |
| `jerk` + `tremor` | Stability Score | `100 - jerk*0.6 - tremor*3` |

---

## ⚡ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server status + current mode |
| POST | `/sensor-data` | Real ESP8266 data ingestion |
| WS | `socket.io` | Live data stream to dashboard |

---

## 🔧 Wokwi Setup

1. Open the [Wokwi website](https://wokwi.com/projects/new/esp8266)
2. Replace `diagram.json` and `sketch.ino` with files from `smart-glove-wokwi/`
3. Add library: **DHT sensor library** (by Adafruit)
4. Click ▶ Run
5. Watch Serial Monitor output: real-time JSON every 300ms

---

## 🎯 Decision Engine Rules

| Rule | Trigger | Alert Type | Action |
|------|---------|------------|--------|
| 1 | Fatigue Score ≥ 80 | WARNING | Rest recommendation |
| 2 | Form Score < 50 | WARNING | Reduce weight |
| 3 | Grip Balance < 60% | WARNING | Reposition hand |
| 4 | Grip Balance < 75% | INFO | Adjust pressure |
| 5 | Jerk > 75 | WARNING | Slow down |
| 6 | Stability < 40 | WARNING | Wrist support |
| 7 | Temperature > 38.5°C | WARNING | Hydrate & cool |
| 8 | Tremor > 7.5 **AND** Fatigue > 70 | **CRITICAL** | **DROP WEIGHT** |
| 9 | Rep milestone (every 10) | INFO | Positive feedback |
