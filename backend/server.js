// ============================================================
//  Smart Glove — Backend Server  (Production-Ready)
//  Express + Socket.IO + Serial Bridge + Simulator Fallback
//
//  DATA SOURCE PRIORITY:
//    1. ESP32 hardware via HTTP POST /sensor-data   (highest)
//    2. ESP32/Wokwi via Serial port                (middle)
//    3. Built-in progressive-fatigue simulator      (fallback)
//
//  ENVIRONMENT VARIABLES:
//    PORT=4000            — HTTP/WS port (default 4000)
//    SERIAL_PORT=COM3     — Enable serial bridge on this port
//    SERIAL_BAUD=115200   — Baud rate (default 115200)
// ============================================================

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');

const { simulateData, startSimulation }         = require('./services/simulator');
const { computeInsights }                        = require('./services/processor');
const { startSerialBridge, isSerialActive, listPorts } = require('./services/serialBridge');

// ── Express + Socket.IO Setup ─────────────────────────────────
const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
});

app.use(cors());
app.use(express.json());

// ── Mode Tracking (HTTP POST hardware) ───────────────────────
let hardwarePostActive = false;
let hardwareTimeout    = null;
const HARDWARE_TIMEOUT_MS = 5000;

function markHardwareActive() {
  hardwarePostActive = true;
  clearTimeout(hardwareTimeout);
  hardwareTimeout = setTimeout(() => {
    hardwarePostActive = false;
    console.log('[Server] ⚠️  Hardware-HTTP silent >5s — reverting to fallback');
  }, HARDWARE_TIMEOUT_MS);
}

// ── Data Source Helper ────────────────────────────────────────
function getActiveMode() {
  if (hardwarePostActive) return 'hardware-http';
  if (isSerialActive())   return 'hardware-serial';
  return 'simulator';
}

// ── Health Check ──────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:    'ok',
    mode:      getActiveMode(),
    uptime:    Math.round(process.uptime()),
    timestamp: Date.now(),
  });
});

// ── GET /ports — List available serial ports ──────────────────
app.get('/ports', async (req, res) => {
  const ports = await listPorts();
  res.json({ ports });
});

// ── POST /sensor-data — Real ESP32 HTTP endpoint ─────────────
// Payload: { reps, tremor, jerk, temperature, imu }
app.post('/sensor-data', (req, res) => {
  const raw = req.body;

  if (!raw || typeof raw !== 'object') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const required = ['reps', 'tremor', 'jerk', 'temperature', 'imu'];
  for (const field of required) {
    if (typeof raw[field] !== 'number') {
      return res.status(400).json({ error: `Missing or invalid field: ${field}` });
    }
  }

  markHardwareActive();
  const processed = computeInsights(raw);
  io.emit('data', processed);

  res.status(200).json({ success: true, mode: 'hardware-http' });
});

// ── WebSocket Connection Log ──────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[WS] ✅ Dashboard connected  – ${socket.id}`);

  // Send current mode immediately on connect
  socket.emit('mode', { mode: getActiveMode() });

  socket.on('disconnect', () => {
    console.log(`[WS] ❌ Dashboard disconnected – ${socket.id}`);
  });
});

// ── Simulator Loop — DISABLED ──────────────────────────────────────
// Uncomment below to re-enable the simulator fallback:
// setInterval(() => {
//   if (!hardwarePostActive && !isSerialActive()) {
//     const raw       = simulateData();
//     const processed = computeInsights(raw);
//     processed._source = 'simulator';
//     io.emit('data', processed);
//   }
// }, 1000);

// ── Serial Bridge Startup ────────────────────────────────────
// Activated via SERIAL_PORT env variable.
// Wokwi users: start simulation → copy the COM port shown in Wokwi terminal,
//   then run:  SERIAL_PORT=COM5 node server.js
async function initSerialBridge() {
  const portPath = process.env.SERIAL_PORT || null;
  const baudRate = parseInt(process.env.SERIAL_BAUD || '115200', 10);

  if (!portPath) {
    console.log('[Serial] ℹ️  SERIAL_PORT not set — serial bridge disabled.');
    console.log('[Serial]    To enable: set SERIAL_PORT=COM3 (or your port)');
    console.log('[Serial]    Running in SIMULATOR mode.\n');
    return;
  }

  console.log(`[Serial] 🔌 Launching serial bridge on ${portPath} @ ${baudRate} baud …`);
  const ok = await startSerialBridge(io, portPath, baudRate);

  if (ok) {
    console.log('[Serial] ✅ Serial bridge ACTIVE — simulator suppressed.');
  } else {
    console.warn('[Serial] ⚠️  Serial bridge failed — SIMULATOR is the fallback.');
  }
}

// ── Boot Sequence ─────────────────────────────────────────────
// startSimulation(); // ── Simulator DISABLED — using Wokwi HTTP data only

const PORT = process.env.PORT || 4000;
server.listen(PORT, async () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   🏋️  Smart Weightlifting Glove — Backend v2     ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  HTTP  → http://localhost:${PORT}                   ║`);
  console.log(`║  WS    → ws://localhost:${PORT}                     ║`);
  console.log('║  Phases: SAFE(0-30s) → WARN(30-60s) → DANGER     ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
  console.log('  POST /sensor-data  ← ESP32 HTTP endpoint');
  console.log('  GET  /health       ← Status check');
  console.log('  GET  /ports        ← List available COM ports');
  console.log('');
  console.log(`  Data source: ${process.env.SERIAL_PORT ? `Serial (${process.env.SERIAL_PORT})` : 'Simulator (no SERIAL_PORT set)'}`);
  console.log('');

  // Init serial bridge AFTER server is listening
  await initSerialBridge();
});
