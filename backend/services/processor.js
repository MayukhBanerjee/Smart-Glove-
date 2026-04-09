// ============================================================
//  Smart Glove — Sensor Data Processor
//  INPUT:  Raw serial/HTTP data { reps, tremor, jerk, temperature, imu }
//  OUTPUT: Enriched insights object consumed by the Decision Engine
// ============================================================

const { evaluateSafety } = require('./decisionEngine');

let lastRepCount    = 0;
let lastRepTime     = Date.now();
let lastRepDuration = 0;

/**
 * Transforms raw sensor values into meaningful fitness insights.
 *
 * Raw format (from ESP8266 serial OR POST /sensor-data):
 *   { reps, tremor, jerk, temperature, imu }
 *
 * Where:
 *   reps        – cumulative rep count (integer)
 *   tremor      – hand tremor severity 0–10
 *   jerk        – motion instability 0–100 (normalized from accelerometer delta)
 *   temperature – body/skin temperature in °C
 *   imu         – composite form quality score (10=perfect, higher=worse)
 */
function computeInsights(raw) {
  const { reps, tremor, jerk, temperature, imu } = raw;
  const timestamp = Date.now();

  // ── 1. GRIP INTELLIGENCE ──────────────────────────────────
  // Simulate grip left/right from tremor + jerk.
  // In real hardware with FSR sensors, these would come directly from raw data.
  const leftGrip  = Math.max(5,  Math.round(70 - tremor * 5 - jerk * 0.2 + (Math.random() * 4)));
  const rightGrip = Math.max(15, Math.round(80 - tremor * 3 - jerk * 0.1 + (Math.random() * 4)));
  const maxGrip   = Math.max(leftGrip, rightGrip);
  const minGrip   = Math.min(leftGrip, rightGrip);
  const gripBalance = maxGrip > 0 ? Math.round((minGrip / maxGrip) * 100) : 100;

  // ── 2. FORM QUALITY ───────────────────────────────────────
  // imu ≈ 10 is perfect form; each unit above 10 degrades form by 2 points
  const formScore     = Math.max(0, Math.min(100, Math.round(100 - (imu - 10) * 2 - tremor)));
  const formDeviation = parseFloat(Math.abs(imu - 10).toFixed(1));

  // ── 3. FATIGUE INDEX ──────────────────────────────────────
  // Driven by tremor (primary) + temperature elevation (secondary)
  const tempElevation  = Math.max(0, temperature - 36.5);  // °above baseline
  const fatigueScore   = Math.min(100, Math.round(tremor * 9 + tempElevation * 6));
  const fatigueLevel   = fatigueScore >= 80 ? 'HIGH' : fatigueScore >= 45 ? 'MEDIUM' : 'LOW';

  // ── 4. STABILITY SCORE ────────────────────────────────────
  // jerk is already 0–100; combine with tremor for compound instability
  const stability = Math.max(0, Math.min(100, Math.round(100 - jerk * 0.6 - tremor * 3)));

  // ── 5. REP INTELLIGENCE ───────────────────────────────────
  if (reps > lastRepCount) {
    const now         = Date.now();
    lastRepDuration   = now - lastRepTime;
    lastRepTime       = now;
    lastRepCount      = reps;
  }

  let tempo = 'NORMAL';
  if (lastRepDuration > 0) {
    if (lastRepDuration > 6000)      tempo = 'SLOW';
    else if (lastRepDuration < 3000) tempo = 'FAST';
  }

  // ── Build Insights Object ────────────────────────────────
  const insights = {
    grip: {
      left:          leftGrip,
      right:         rightGrip,
      balance_score: gripBalance,
    },
    form: {
      score:     formScore,
      deviation: formDeviation,
    },
    fatigue: {
      level: fatigueLevel,
      score: fatigueScore,
    },
    stability,
    reps: {
      count: reps,
      tempo,
    },
    temperature: parseFloat(temperature.toFixed(1)),
    injury_risk:     'SAFE',   // overwritten by decision engine
    alerts:          [],
    recommendations: [],
    timestamp,
    // Internal values for decision engine (removed before emitting)
    _tremor: tremor,
    _jerk:   jerk,
  };

  return evaluateSafety(insights);
}

module.exports = { computeInsights };
