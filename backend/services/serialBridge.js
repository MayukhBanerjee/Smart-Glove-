// ============================================================
//  Smart Glove — Serial → WebSocket Bridge
//
//  Reads JSON lines from Wokwi (via COM port / virtual serial)
//  and emits processed data over Socket.IO.
//
//  HOW TO USE:
//    1. Find your port: list them with `npx @serialport/list`
//    2. Pass the io instance and port string to startSerialBridge()
//    3. Data is processed through the SAME pipeline as the simulator
//
//  WOKWI VIRTUAL SERIAL:
//    Install Wokwi CLI + VS Code extension.
//    The virtual COM port appears as shown in Wokwi terminal.
// ============================================================

const { ReadlineParser } = require('@serialport/parser-readline');
const { computeInsights  } = require('./processor');

let serialActive = false;

/**
 * Attempt to open a serial port and stream data.
 * Fails gracefully if port not found (falls back to simulator).
 *
 * @param {import('socket.io').Server} io
 * @param {string} portPath  e.g. 'COM3' on Windows, '/dev/ttyUSB0' on Linux
 * @param {number} baudRate  default 115200
 */
async function startSerialBridge(io, portPath, baudRate = 115200) {
  let SerialPort;
  try {
    // Dynamic import so the backend doesn't crash if serialport isn't installed
    const sp = require('@serialport/stream');
    const { autoDetect } = require('@serialport/bindings-cpp');
    SerialPort = sp.SerialPortStream;
    SerialPort.Binding = autoDetect();
  } catch (err) {
    console.warn('[Serial] ⚠️  serialport package not installed — serial bridge disabled.');
    console.warn('[Serial]    Run: npm install @serialport/stream @serialport/bindings-cpp @serialport/parser-readline');
    return false;
  }

  try {
    const port   = new SerialPort({ path: portPath, baudRate, autoOpen: false });
    const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    port.open((err) => {
      if (err) {
        console.error(`[Serial] ❌ Could not open ${portPath}: ${err.message}`);
        console.warn('[Serial]    Falling back to built-in simulator.');
        return;
      }
      console.log(`[Serial] ✅ Connected to ${portPath} @ ${baudRate} baud`);
      serialActive = true;
    });

    // Rolling buffer for data smoothing
    const buffer = [];
    const BUFFER_SIZE = 3;

    parser.on('data', (line) => {
      line = line.trim();
      if (!line.startsWith('{')) return; // skip non-JSON lines (debug prints, etc.)

      try {
        const raw = JSON.parse(line);

        // Validate required fields
        if (
          typeof raw.reps        !== 'number' ||
          typeof raw.tremor      !== 'number' ||
          typeof raw.jerk        !== 'number' ||
          typeof raw.temperature !== 'number' ||
          typeof raw.imu         !== 'number'
        ) {
          console.warn('[Serial] ⚠️  Malformed JSON (missing fields):', line);
          return;
        }

        // Data smoothing: average over rolling buffer
        buffer.push(raw);
        if (buffer.length > BUFFER_SIZE) buffer.shift();

        const smoothed = smoothData(buffer);
        const processed = computeInsights(smoothed);

        io.emit('data', processed);
        serialActive = true;

      } catch (parseErr) {
        console.warn('[Serial] ⚠️  JSON parse error:', line);
      }
    });

    port.on('close', () => {
      console.warn('[Serial] Port closed — falling back to simulator.');
      serialActive = false;
    });

    port.on('error', (err) => {
      console.error('[Serial] Port error:', err.message);
      serialActive = false;
    });

    return true;

  } catch (err) {
    console.error('[Serial] Fatal error:', err.message);
    return false;
  }
}

/**
 * Average multiple sensor readings for smoother output.
 * @param {Array<object>} buf
 * @returns {object}
 */
function smoothData(buf) {
  const n = buf.length;
  return {
    reps:        buf[buf.length - 1].reps,  // reps is cumulative, take latest
    tremor:      buf.reduce((s, d) => s + d.tremor,      0) / n,
    jerk:        buf.reduce((s, d) => s + d.jerk,        0) / n,
    temperature: buf.reduce((s, d) => s + d.temperature, 0) / n,
    imu:         buf.reduce((s, d) => s + d.imu,         0) / n,
  };
}

function isSerialActive() {
  return serialActive;
}

module.exports = { startSerialBridge, isSerialActive };
