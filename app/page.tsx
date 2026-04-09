'use client';

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { StatusBar } from '@/components/dashboard/status-bar';
import { KPIGrid } from '@/components/dashboard/kpi-grid';
import { DataVisualization } from '@/components/dashboard/data-visualization';
import { AlertPanel } from '@/components/dashboard/alert-panel';
import { CoachPanel } from '@/components/dashboard/coach-panel';
import { RiskAnalysis } from '@/components/dashboard/risk-analysis';
import { generateMockData, MockData } from '@/lib/mock-data';

export default function Home() {
  const [data, setData] = useState<MockData | null>(null);
  const [sessionTime, setSessionTime] = useState(0);

  useEffect(() => {
    // Initialize with mock data to setup initial chart histories
    setData(generateMockData());

    // Connect to Backend WebSocket
    const socket = io('http://localhost:4000');
    
    socket.on('data', (backendData: any) => {
      setData(prevData => {
        if (!prevData || !backendData) return prevData;

        // Maintain histories (last 60 elements)
        const timeNow = prevData.gripForceHistory.length > 0 
          ? prevData.gripForceHistory[prevData.gripForceHistory.length - 1].time + 1 
          : 0;

        const newGripHistory = [...prevData.gripForceHistory, {
          time: timeNow,
          value: backendData.grip?.left || 50
        }].slice(-60);

        const newImuMotion = [...prevData.imuMotion, {
          time: timeNow,
          x: (backendData.form?.deviation || 0) * 5,
          y: Math.random() * 20,
          z: 50 + (backendData.form?.deviation || 0) * 2
        }].slice(-60);

        const newFatigueHistory = [...prevData.fatigueHistory, {
          time: timeNow,
          value: backendData.fatigue?.score || 0
        }].slice(-60);

        return {
          injuryRisk: backendData.injury_risk,
          connectionStatus: 'LIVE',
          gripIntelligence: {
            left: backendData.grip.left,
            right: backendData.grip.right,
            symmetryScore: backendData.grip.balance_score
          },
          formQuality: {
            score: backendData.form.score,
            deviation: backendData.form.deviation
          },
          fatigueIndex: backendData.fatigue.level,
          stabilityScore: backendData.stability,
          repIntelligence: {
            count: backendData.reps.count,
            tempo: backendData.reps.tempo
          },
          bodyTemperature: backendData.temperature,
          gripForceHistory: newGripHistory,
          imuMotion: newImuMotion,
          fatigueHistory: newFatigueHistory,
          alerts: backendData.alerts.map((a: any, i: number) => ({
            id: `alert-${backendData.timestamp}-${i}`,
            message: a.message,
            severity: a.type,
            timestamp: backendData.timestamp - (i * 1000)
          })),
          riskMetrics: {
            gripBalance: backendData.grip.balance_score,
            formQuality: backendData.form.score,
            fatigue: backendData.fatigue.score,
            stability: backendData.stability,
            overall: Math.round((backendData.grip.balance_score + backendData.form.score + (100 - backendData.fatigue.score) + backendData.stability) / 4)
          },
          recommendations: backendData.recommendations.length > 0 
            ? backendData.recommendations 
            : prevData.recommendations
        };
      });
    });

    socket.on('disconnect', () => {
      setData(prev => prev ? { ...prev, connectionStatus: 'DISCONNECTED' } : null);
    });

    // Update session timer
    const timer = setInterval(() => {
      setSessionTime(t => t + 1);
    }, 1000);

    return () => {
      socket.disconnect();
      clearInterval(timer);
    };
  }, []);

  if (!data) return null;

  const minutes = Math.floor(sessionTime / 60);
  const seconds = sessionTime % 60;

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Smart Weightlifting Glove</h1>
              <p className="text-sm text-muted-foreground mt-1">Real-time Performance Analytics</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Session Time</p>
              <p className="text-2xl font-mono font-bold text-foreground">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar data={data} />

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* KPI Grid */}
        <KPIGrid data={data} />

        {/* Main Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Charts - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <DataVisualization data={data} />
          </div>

          {/* Right Column - Alerts & Coach */}
          <div className="space-y-6">
            <AlertPanel data={data} />
            <CoachPanel data={data} />
          </div>
        </div>

        {/* Risk Analysis - Full Width */}
        <RiskAnalysis data={data} />
      </div>
    </main>
  );
}
