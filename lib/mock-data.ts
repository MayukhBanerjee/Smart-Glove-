export interface MockData {
  // Status
  injuryRisk: 'SAFE' | 'WARNING' | 'DANGER';
  connectionStatus: 'LIVE' | 'DISCONNECTED';

  // KPIs
  gripIntelligence: {
    left: number;
    right: number;
    symmetryScore: number;
  };
  formQuality: {
    score: number;
    deviation: number;
  };
  fatigueIndex: 'LOW' | 'MEDIUM' | 'HIGH';
  stabilityScore: number;
  repIntelligence: {
    count: number;
    tempo: 'FAST' | 'NORMAL' | 'SLOW';
  };
  bodyTemperature: number;

  // Charts
  gripForceHistory: Array<{ time: number; value: number }>;
  imuMotion: Array<{ time: number; x: number; y: number; z: number }>;
  fatigueHistory: Array<{ time: number; value: number }>;

  // Alerts
  alerts: Array<{
    id: string;
    message: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    timestamp: number;
  }>;

  // Risk Analysis
  riskMetrics: {
    gripBalance: number;
    formQuality: number;
    fatigue: number;
    stability: number;
    overall: number;
  };

  // Coach Recommendations
  recommendations: string[];
}

export function generateMockData(): MockData {
  const now = Date.now();
  const fatigueRandom = Math.random();
  let fatigueLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  let injuryRisk: 'SAFE' | 'WARNING' | 'DANGER';

  if (fatigueRandom < 0.6) {
    fatigueLevel = 'LOW';
    injuryRisk = 'SAFE';
  } else if (fatigueRandom < 0.85) {
    fatigueLevel = 'MEDIUM';
    injuryRisk = 'WARNING';
  } else {
    fatigueLevel = 'HIGH';
    injuryRisk = 'DANGER';
  }

  const tempoRandom = Math.random();
  let tempo: 'FAST' | 'NORMAL' | 'SLOW';
  if (tempoRandom < 0.4) {
    tempo = 'FAST';
  } else if (tempoRandom < 0.7) {
    tempo = 'NORMAL';
  } else {
    tempo = 'SLOW';
  }

  // Generate time series data
  const generateTimeSeries = (count: number = 60) => {
    const data: Array<{ time: number; value: number }> = [];
    for (let i = 0; i < count; i++) {
      data.push({
        time: i,
        value: 30 + Math.sin(i * 0.1) * 15 + Math.random() * 10,
      });
    }
    return data;
  };

  const generateIMUData = (count: number = 60) => {
    const data: Array<{ time: number; x: number; y: number; z: number }> = [];
    for (let i = 0; i < count; i++) {
      data.push({
        time: i,
        x: Math.sin(i * 0.1) * 30 + Math.random() * 10,
        y: Math.cos(i * 0.1) * 30 + Math.random() * 10,
        z: 50 + Math.sin(i * 0.15) * 20 + Math.random() * 10,
      });
    }
    return data;
  };

  const alertMessages = [
    'Grip imbalance detected',
    'High fatigue level',
    'Unstable motion detected',
    'Form deviation increasing',
    'Left grip pressure dropping',
    'Temperature rising',
    'Rep cadence unstable',
  ];

  const recommendations = [
    'Adjust left-hand grip pressure',
    'Slow down reps for better form',
    'Take rest: fatigue level increasing',
    'Focus on wrist stability',
    'Increase hydration',
    'Reduce range of motion temporarily',
    'Check glove calibration',
  ];

  // Generate random alerts
  const alerts: MockData['alerts'] = [];
  const alertCount = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < alertCount; i++) {
    const severity = Math.random() < 0.5 ? 'INFO' : Math.random() < 0.7 ? 'WARNING' : 'CRITICAL';
    alerts.push({
      id: `alert-${i}-${now}`,
      message: alertMessages[Math.floor(Math.random() * alertMessages.length)],
      severity,
      timestamp: now - i * 5000,
    });
  }

  const leftGrip = 45 + Math.random() * 20;
  const rightGrip = 50 + Math.random() * 25;
  const symmetry = Math.round((Math.min(leftGrip, rightGrip) / Math.max(leftGrip, rightGrip)) * 100);

  const formScore = 70 + Math.random() * 25;
  const formDeviation = Math.random() * 15;

  const stabilityScore = 75 + Math.random() * 20;
  const repCount = Math.floor(Math.random() * 20) + 5;
  const temperature = 36.5 + Math.random() * 2;

  const gripBalance = Math.round(symmetry);
  const formQuality = Math.round(formScore);
  const fatigue = Math.round(((fatigueLevel === 'LOW' ? 0.3 : fatigueLevel === 'MEDIUM' ? 0.6 : 0.9) * 100));
  const stability = Math.round(stabilityScore);
  const overall = Math.round((gripBalance + formQuality + (100 - fatigue) + stability) / 4);

  return {
    injuryRisk,
    connectionStatus: 'LIVE',
    gripIntelligence: {
      left: Math.round(leftGrip),
      right: Math.round(rightGrip),
      symmetryScore: symmetry,
    },
    formQuality: {
      score: Math.round(formScore),
      deviation: Math.round(formDeviation * 10) / 10,
    },
    fatigueIndex: fatigueLevel,
    stabilityScore: Math.round(stabilityScore),
    repIntelligence: {
      count: repCount,
      tempo,
    },
    bodyTemperature: Math.round(temperature * 10) / 10,
    gripForceHistory: generateTimeSeries(),
    imuMotion: generateIMUData(),
    fatigueHistory: generateTimeSeries(),
    alerts,
    riskMetrics: {
      gripBalance,
      formQuality,
      fatigue,
      stability,
      overall,
    },
    recommendations: recommendations.slice(0, Math.floor(Math.random() * 3) + 2),
  };
}
