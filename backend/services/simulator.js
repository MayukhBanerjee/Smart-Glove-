// ============================================================
//  Smart Glove — Progressive Fatigue Simulator
//  3-Phase Demo: SAFE (0-30s) → WARNING (30-60s) → DANGER (60-90s)
// ============================================================

let sessionTick = 0;        // increments every call to simulateData()
let repCount    = 0;
let lastRepTick = 0;

/** Reset session for a fresh demo run */
function startSimulation() {
  sessionTick = 0;
  repCount    = 0;
  lastRepTick = 0;
  console.log('[Simulator] 🏋️  New session started — SAFE → WARNING → DANGER');
}

/** Returns raw sensor data object matching the hardware serial format */
function simulateData() {
  sessionTick++;

  // ── Fatigue Factor: 0.0 → 1.0 over 90 ticks (seconds) ──
  let fatigue = sessionTick / 90;
  if (fatigue > 1.0) fatigue = 1.0;

  // ── Grip (left drops faster, right holds longer) ──
  const tremorNoise = (Math.random() - 0.5) * fatigue * 5;
  const tremorVal   = parseFloat((fatigue * 9.5 + Math.abs(tremorNoise)).toFixed(2));

  // ── IMU: composite form score (10 = perfect, grows with fatigue) ──
  const sineWave = Math.sin(sessionTick * 0.3);
  const imuScore = parseFloat(
    (10 + fatigue * 20 + Math.abs(sineWave) * 5 + Math.random() * 2).toFixed(1)
  );

  // ── Jerk (motion instability 0–100) ──
  const jerk = Math.min(100, Math.round(fatigue * 65 + Math.random() * 20));

  // ── Temperature (36.5°C → 39°C over session) ──
  const temperature = parseFloat(
    (36.5 + fatigue * 2.5 + (Math.random() * 0.2 - 0.1)).toFixed(1)
  );

  // ── Rep counting: auto-increment, slowing down as fatigue rises ──
  const repPeriod = Math.round(4 + fatigue * 4);  // 4s → 8s between reps
  if (sessionTick - lastRepTick >= repPeriod) {
    repCount++;
    lastRepTick = sessionTick;
  }

  return {
    reps:        repCount,
    tremor:      tremorVal,
    jerk:        jerk,
    temperature: temperature,
    imu:         imuScore,
  };
}

module.exports = { simulateData, startSimulation };
