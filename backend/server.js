// ============================================================
//  Smart Glove — Backend Server
//  Express + Socket.IO + Progressive Simulation + Serial Bridge
//  Hardware-ready: ESP8266 → POST /sensor-data OR Serial port
// ============================================================

const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors    = require('cors');

const { simulateData, startSimulation } = require('./services/simulator');
const { computeInsights               } = require('./services/processor');
const { startSerialBridge, isSerialActive } = require('./services/serialBridge');

// ── Express + Socket.IO Setup ────────────────────────────────
const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

// ── Mode Tracking ────────────────────────────────────────────
// Priority: hardware POST > serial > simulator
let hardwarePostActive = false;
let hardwareTimeout    = null;

const HARDWARE_TIMEOUT_MS = 5000; // 5s without data → fall back to simulator

function markHardwareActive() {
  hardwarePostActive = true;
  clearTimeout(hardwareTimeout);
  hardwareTimeout = setTimeout(() => {
    hardwarePostActive = false;
    console.log('[Server] ⚠️  Hardware silent >5s — resuming simulator');
  }, HARDWARE_TIMEOUT_MS);
}

// ── Health Check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:         'ok',
    mode:           hardwarePostActive ? 'hardware-http' : isSerialActive() ? 'hardware-serial' : 'simulator',
    uptime:         Math.round(process.uptime()),
    timestamp:      Date.now(),
  });
});

// ── POST /sensor-data — Real ESP8266 hardware endpoint ───────
// Send: { reps, tremor, jerk, temperature, imu }
app.post('/sensor-data', (req, res) => {
  const raw = req.body;

  if (!raw || typeof raw !== 'object') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  // Validate
  const required = ['reps', 'tremor', 'jerk', 'temperature', 'imu'];
  for (const field of required) {
    if (typeof raw[field] !== 'number') {
      return res.status(400).json({ error: `Missing or invalid field: ${field}` });
    }
  }

  markHardwareActive();

  const processed = computeInsights(raw);
  io.emit('data', processed);

  res.status(200).json({ success: true });
});

// ── WebSocket Connection Log ──────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[WS] ✅ Dashboard connected: ${socket.id}`);
  socket.on('disconnect', () =>
    console.log(`[WS] ❌ Dashboard disconnected: ${socket.id}`)
  );
});

// ── Simulator Loop — 1Hz tick ────────────────────────────────
// Runs ONLY when no hardware is feeding data
setInterval(() => {
  if (!hardwarePostActive && !isSerialActive()) {
    const raw       = simulateData();
    const processed = computeInsights(raw);
    io.emit('data', processed);
  }
}, 1000);

// ── Optional: Serial Bridge (Wokwi virtual port) ─────────────
// Uncomment and set your port to enable:
//   Windows: 'COM3'   Linux/Mac: '/dev/ttyUSB0' or '/dev/tty.usbserial-XXX'
//
// const SERIAL_PORT = process.env.SERIAL_PORT || null;
// if (SERIAL_PORT) {
//   startSerialBridge(io, SERIAL_PORT).then(ok => {
//     if (!ok) console.log('[Server] Serial bridge failed — using simulator');
//   });
// }

// ── Start ────────────────────────────────────────────────────
startSimulation();

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   🏋️  Smart Weightlifting Glove — Backend    ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  HTTP  → http://localhost:${PORT}               ║`);
  console.log(`║  WS    → ws://localhost:${PORT}                 ║`);
  console.log(`║  Mode  → Progressive Simulation               ║`);
  console.log('║  Phases: SAFE(0-30s) → WARN(30-60s) → DANGER ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log('  POST /sensor-data   ← ESP8266 hardware endpoint');
  console.log('  GET  /health        ← Status check');
  console.log('');
});
