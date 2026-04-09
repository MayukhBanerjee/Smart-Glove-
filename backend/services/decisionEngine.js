// ============================================================
//  Smart Glove — Decision Engine
//  Rule-based intelligence: translates insights → alerts + risk
// ============================================================

/**
 * Evaluates safety from computed insights.
 * Mutates and returns the insights object.
 *
 * Risk levels (escalation priority):
 *   SAFE    → Normal operation
 *   WARNING → Caution needed
 *   DANGER  → Stop immediately
 */
function evaluateSafety(insights) {
  const { fatigue, grip, form, stability, temperature, reps, _tremor, _jerk } = insights;

  let riskLevel = 'SAFE';
  const alerts          = [];
  const recommendations = [];

  // ── RULE 1: High Fatigue ─────────────────────────────────
  if (fatigue.score >= 80) {
    alerts.push({ type: 'WARNING', message: 'High fatigue detected — muscle failure risk elevated.' });
    recommendations.push('Take at least 60 seconds of rest before your next set.');
    if (riskLevel === 'SAFE') riskLevel = 'WARNING';
  } else if (fatigue.score >= 45) {
    recommendations.push('Pace yourself — fatigue is building. Hydrate and breathe.');
  }

  // ── RULE 2: Form Degradation ─────────────────────────────
  if (form.score < 50) {
    alerts.push({ type: 'WARNING', message: `Form heavily degraded (score: ${form.score}/100).` });
    recommendations.push('Reduce weight by 20% and focus on controlled movement.');
    if (riskLevel === 'SAFE') riskLevel = 'WARNING';
  } else if (form.score < 70) {
    recommendations.push('Form is slipping. Slow your rep tempo for better control.');
  }

  // ── RULE 3: Grip Imbalance ───────────────────────────────
  if (grip.balance_score < 60) {
    alerts.push({ type: 'WARNING', message: `Severe grip imbalance (${grip.balance_score}% symmetry).` });
    recommendations.push('Re-position your left hand — pressure is significantly lower.');
    if (riskLevel === 'SAFE') riskLevel = 'WARNING';
  } else if (grip.balance_score < 75) {
    alerts.push({ type: 'INFO', message: `Grip imbalance detected (${grip.balance_score}% symmetry).` });
    recommendations.push('Adjust left-hand pressure to match right-hand grip.');
  }

  // ── RULE 4: High Jerk / Motion Instability ───────────────
  if (_jerk > 75) {
    alerts.push({ type: 'WARNING', message: 'High motion instability — uncontrolled bar path.' });
    recommendations.push('Slow down; focus on strict, controlled lifting mechanics.');
    if (riskLevel === 'SAFE') riskLevel = 'WARNING';
  }

  // ── RULE 5: Low Stability ────────────────────────────────
  if (stability < 40) {
    alerts.push({ type: 'WARNING', message: `Low stability score (${stability}/100).` });
    recommendations.push('Stabilise your wrist — consider wrist wraps or reducing load.');
  }

  // ── RULE 6: Elevated Temperature ─────────────────────────
  if (temperature > 38.5) {
    alerts.push({ type: 'WARNING', message: `Body temperature elevated (${temperature}°C).` });
    recommendations.push('Stop training, hydrate immediately and cool down.');
    if (riskLevel === 'SAFE') riskLevel = 'WARNING';
  }

  // ── RULE 7: CRITICAL — Combined Tremor + Fatigue (DANGER) ─
  if (_tremor > 7.5 && fatigue.score > 70) {
    alerts.push({
      type:    'CRITICAL',
      message: '⚠️ DANGER: Severe tremor with high fatigue — immediate injury risk!',
    });
    recommendations.unshift('🛑 DROP WEIGHT NOW. Stop the set immediately.');
    riskLevel = 'DANGER';
  }

  // ── RULE 8: Rep Milestone (Coach Positive Feedback) ──────
  if (reps.count > 0 && reps.count % 10 === 0 && reps.count !== insights._lastMilestone) {
    alerts.push({ type: 'INFO', message: `💪 ${reps.count} reps completed — great work!` });
    insights._lastMilestone = reps.count;
  }

  // ── RULE 9: Slow Tempo + High Fatigue = depletion warning ─
  if (reps.tempo === 'SLOW' && fatigue.score > 60) {
    recommendations.push('Tempo is very slow — your muscles may be near exhaustion.');
  }

  // Clean internal fields
  delete insights._tremor;
  delete insights._jerk;
  delete insights._lastMilestone;

  insights.injury_risk     = riskLevel;
  insights.alerts          = alerts;
  insights.recommendations = [...new Set(recommendations)]; // deduplicate

  return insights;
}

module.exports = { evaluateSafety };
