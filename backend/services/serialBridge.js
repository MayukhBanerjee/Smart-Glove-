// ============================================================
//  Smart Glove — Serial → WebSocket Bridge (v2 — Production)
//
//  Reads JSON lines from Wokwi/ESP32 over a COM port and feeds
//  them into the same processing pipeline as the simulator.
//
//  SUPPORTED PORT FORMATS:
//    Windows : 'COM3', 'COM4', etc.
//    Linux   : '/dev/ttyUSB0', '/dev/ttyACM0'
//    Mac     : '/dev/cu.usbserial-XXXX'
//
//  ENVIRONMENT VARIABLES:
//    SERIAL_PORT=COM3        — port to open (required to enable)
//    SERIAL_BAUD=115200      — baud rate  (default: 115200)
//
//  HOW WOKWI VIRTUAL SERIAL WORKS:
//    Install Wokwi VS Code extension + run simulation.
//    A virtual COM port (e.g. COM5) appears in Device Manager.
//    Use that COM number for SERIAL_PORT.
// ============================================================

const { computeInsights } = require('./processor');

let serialActive = false;
let _retryTimer  = null;
let _port        = null;

const RECONNECT_DELAY_MS = 5000; // 5s retry on disconnect

// ── Rolling buffer for 3-sample smoothing ────────────────────
const rawBuffer  = [];
const BUFFER_SIZE = 3;

/**
 * Attempt to open a serial port and stream sensor data.
 * Automatically retries on disconnect.
 * Falls back to simulator if port unavailable.
 *
 * @param {import('socket.io').Server} io
 * @param {string}  portPath  e.g. 'COM3'
 * @param {number}  baudRate  default 115200
 * @returns {Promise<boolean>}
 */
async function startSerialBridge(io, portPath, baudRate = 115200) {
  // ── 1. Try to load the 'serialport' package ───────────────
  let SerialPort, ReadlineParser;
  try {
    ({ SerialPort }     = require('serialport'));
    ({ ReadlineParser } = require('@serialport/parser-readline'));
  } catch (err) {
    console.warn('[Serial] ⚠️  "serialport" package not installed.');
    console.warn('[Serial]    Run: npm install serialport @serialport/parser-readline');
    console.warn('[Serial]    Falling back to built-in simulator.');
    return false;
  }

  // ── 2. List available ports (diagnostic) ─────────────────
  try {
    const ports = await SerialPort.list();
    if (ports.length === 0) {
      console.warn('[Serial] ⚠️  No serial ports detected on this machine.');
    } else {
      console.log('[Serial] 🔍 Available ports:');
      ports.forEach(p => console.log(`[Serial]    ${p.path}  (${p.manufacturer || 'unknown'})`));
    }
  } catch (_) { /* ignore list errors */ }

  // ── 3. Try to open the requested port ────────────────────
  return _openPort(io, portPath, baudRate, SerialPort, ReadlineParser);
}

function _openPort(io, portPath, baudRate, SerialPort, ReadlineParser) {
  return new Promise((resolve) => {
    console.log(`[Serial] 🔌 Connecting to ${portPath} @ ${baudRate} baud …`);

    let port;
    try {
      port = new SerialPort({ path: portPath, baudRate, autoOpen: false });
    } catch (err) {
      console.error(`[Serial] ❌ Cannot create port ${portPath}: ${err.message}`);
      resolve(false);
      return;
    }

    _port = port;
    const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    // Incomplete-line accumulation buffer (handles chunked serial reads)
    let lineAccum = '';

    port.open((err) => {
      if (err) {
        console.error(`[Serial] ❌ Could not open ${portPath}: ${err.message}`);
        console.warn('[Serial]    → Falling back to simulator. Will retry in 5s.');
        _scheduleRetry(io, portPath, baudRate, SerialPort, ReadlineParser);
        resolve(false);
        return;
      }

      console.log(`[Serial] ✅ Connected — ${portPath} @ ${baudRate} baud`);
      console.log('[Serial]    Simulator has been DISABLED. Reading live data.');
      serialActive = true;
      resolve(true);
    });

    // ── Data handler ─────────────────────────────────────
    parser.on('data', (rawLine) => {
      const line = rawLine.trim();
      if (!line) return;

      // Only process lines that look like our JSON
      if (!line.startsWith('{')) {
        // Echo non-JSON lines for debugging (firmware print statements etc.)
        console.debug(`[Serial][ESP32] ${line}`);
        return;
      }

      let raw;
      try {
        raw = JSON.parse(line);
      } catch (_) {
        console.warn(`[Serial] ⚠️  JSON parse error: ${line.slice(0, 80)}`);
        return;
      }

      // Validate all required fields are numbers
      const FIELDS = ['reps', 'tremor', 'jerk', 'temperature', 'imu'];
      const missing = FIELDS.filter(f => typeof raw[f] !== 'number');
      if (missing.length > 0) {
        console.warn(`[Serial] ⚠️  Missing fields [${missing.join(', ')}]: ${line.slice(0, 80)}`);
        return;
      }

      // Rolling smooth over last BUFFER_SIZE samples
      rawBuffer.push(raw);
      if (rawBuffer.length > BUFFER_SIZE) rawBuffer.shift();
      const smoothed  = _smooth(rawBuffer);

      // Push through the same pipeline as simulator
      const processed = computeInsights(smoothed);
      io.emit('data', processed);

      // Keep serialActive alive
      serialActive = true;
    });

    // ── Disconnect / Error handlers ───────────────────────
    port.on('close', () => {
      console.warn('[Serial] ⚠️  Port closed — reverting to simulator.');
      serialActive = false;
      _scheduleRetry(io, portPath, baudRate, SerialPort, ReadlineParser);
    });

    port.on('error', (err) => {
      console.error(`[Serial] Port error: ${err.message}`);
      serialActive = false;
    });
  });
}

/** Schedule a reconnection attempt without blocking the event loop */
function _scheduleRetry(io, portPath, baudRate, SerialPort, ReadlineParser) {
  if (_retryTimer) return; // already scheduled
  _retryTimer = setTimeout(async () => {
    _retryTimer = null;
    console.log(`[Serial] 🔄 Retrying ${portPath} …`);
    await _openPort(io, portPath, baudRate, SerialPort, ReadlineParser);
  }, RECONNECT_DELAY_MS);
}

/**
 * Average a buffer of raw readings (reps takes latest value).
 * @param {object[]} buf
 * @returns {object}
 */
function _smooth(buf) {
  const n = buf.length;
  return {
    reps:        buf[n - 1].reps,  // cumulative — always latest
    tremor:      buf.reduce((s, d) => s + d.tremor,      0) / n,
    jerk:        buf.reduce((s, d) => s + d.jerk,        0) / n,
    temperature: buf.reduce((s, d) => s + d.temperature, 0) / n,
    imu:         buf.reduce((s, d) => s + d.imu,         0) / n,
  };
}

/** Returns true if serial port is actively providing data */
function isSerialActive() {
  return serialActive;
}

/** List available COM ports — useful for diagnostics */
async function listPorts() {
  try {
    const { SerialPort } = require('serialport');
    return await SerialPort.list();
  } catch (_) {
    return [];
  }
}

module.exports = { startSerialBridge, isSerialActive, listPorts };
