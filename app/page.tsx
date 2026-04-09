'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { StatusBar } from '@/components/dashboard/status-bar';
import { KPIGrid } from '@/components/dashboard/kpi-grid';
import { DataVisualization } from '@/components/dashboard/data-visualization';
import { AlertPanel } from '@/components/dashboard/alert-panel';
import { CoachPanel } from '@/components/dashboard/coach-panel';
import { RiskAnalysis } from '@/components/dashboard/risk-analysis';
import { generateMockData, MockData } from '@/lib/mock-data';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export default function Home() {
  const [data,        setData]        = useState<MockData | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [connected,   setConnected]   = useState(false);
  const [dataSource,  setDataSource]  = useState<'simulator' | 'hardware-serial' | 'hardware-http' | 'unknown'>('unknown');

  // Stable chart history ref — avoids missing-dep lint issues
  const historyRef = useRef({
    grip:    [] as Array<{ time: number; value: number }>,
    imu:     [] as Array<{ time: number; x: number; y: number; z: number }>,
    fatigue: [] as Array<{ time: number; value: number }>,
    tick:    0,
  });

  // ── Socket connection with auto-reconnect ─────────────────
  useEffect(() => {
    // Seed initial mock data so charts have history on first render
    const seed = generateMockData();
    historyRef.current.grip    = seed.gripForceHistory;
    historyRef.current.imu     = seed.imuMotion;
    historyRef.current.fatigue = seed.fatigueHistory;
    historyRef.current.tick    = seed.gripForceHistory.length;
    setData(seed);

    const socket: Socket = io(BACKEND_URL, {
      reconnection:      true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout:           10000,
    });

    socket.on('connect', () => {
      setConnected(true);
      console.log('[Dashboard] ✅ Connected to backend');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      setData(prev => prev ? { ...prev, connectionStatus: 'DISCONNECTED' } : null);
      console.log('[Dashboard] ❌ Disconnected — reconnecting …');
    });

    // Mode update from server (emitted on connect)
    socket.on('mode', ({ mode }: { mode: string }) => {
      setDataSource(mode as typeof dataSource);
    });

    socket.on('data', (backendData: any) => {
      if (!backendData) return;

      // Update data source badge if backend tagged the emission
      if (backendData._source === 'simulator') {
        setDataSource('simulator');
      } else if (dataSource !== 'hardware-serial' && dataSource !== 'hardware-http') {
        setDataSource('hardware-serial');
      }

      setData(prevData => {
        const h = historyRef.current;
        const t = h.tick++;

        h.grip = [...h.grip, { time: t, value: backendData.grip?.left ?? 50 }].slice(-60);
        h.imu  = [...h.imu,  {
          time: t,
          x:   (backendData.form?.deviation ?? 0) * 5,
          y:   Math.random() * 20,
          z:   50 + (backendData.form?.deviation ?? 0) * 2,
        }].slice(-60);
        h.fatigue = [...h.fatigue, { time: t, value: backendData.fatigue?.score ?? 0 }].slice(-60);

        return {
          injuryRisk:       backendData.injury_risk ?? 'SAFE',
          connectionStatus: 'LIVE',
          gripIntelligence: {
            left:          backendData.grip?.left   ?? 50,
            right:         backendData.grip?.right  ?? 55,
            symmetryScore: backendData.grip?.balance_score ?? 90,
          },
          formQuality: {
            score:     backendData.form?.score     ?? 80,
            deviation: backendData.form?.deviation ?? 0,
          },
          fatigueIndex:   backendData.fatigue?.level ?? 'LOW',
          stabilityScore: backendData.stability       ?? 80,
          repIntelligence: {
            count: backendData.reps?.count ?? 0,
            tempo: backendData.reps?.tempo ?? 'NORMAL',
          },
          bodyTemperature:  backendData.temperature ?? 36.5,
          gripForceHistory: [...h.grip],
          imuMotion:        [...h.imu],
          fatigueHistory:   [...h.fatigue],
          alerts: (backendData.alerts ?? []).map((a: any, i: number) => ({
            id:        `alert-${backendData.timestamp}-${i}`,
            message:   a.message,
            severity:  a.type,
            timestamp: backendData.timestamp - i * 1000,
          })),
          riskMetrics: {
            gripBalance: backendData.grip?.balance_score         ?? 90,
            formQuality: backendData.form?.score                 ?? 80,
            fatigue:     backendData.fatigue?.score              ?? 20,
            stability:   backendData.stability                   ?? 80,
            overall:     Math.round(
              ((backendData.grip?.balance_score ?? 90) +
               (backendData.form?.score         ?? 80) +
               (100 - (backendData.fatigue?.score ?? 20)) +
               (backendData.stability            ?? 80)) / 4
            ),
          },
          recommendations: backendData.recommendations?.length > 0
            ? backendData.recommendations
            : prevData?.recommendations ?? [],
        };
      });
    });

    const timer = setInterval(() => setSessionTime(t => t + 1), 1000);

    return () => {
      socket.disconnect();
      clearInterval(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) return null;

  const minutes = Math.floor(sessionTime / 60);
  const seconds = sessionTime % 60;

  // Data source badge styling
  const sourceBadge = {
    'simulator':      { label: 'SIMULATOR',    color: 'bg-blue-600/20 text-blue-400 border-blue-500/40' },
    'hardware-serial':{ label: 'SERIAL / ESP32', color: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40' },
    'hardware-http':  { label: 'HTTP / ESP32',  color: 'bg-purple-600/20 text-purple-400 border-purple-500/40' },
    'unknown':        { label: 'CONNECTING…',  color: 'bg-gray-600/20 text-gray-400 border-gray-500/40' },
  }[dataSource];

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Smart Weightlifting Glove</h1>
              <p className="text-sm text-muted-foreground mt-1">Real-time Performance Analytics</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Data source badge */}
              <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${sourceBadge.color}`}>
                {sourceBadge.label}
              </div>

              {/* Connection dot */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-xs text-muted-foreground">{connected ? 'Connected' : 'Reconnecting…'}</span>
              </div>

              {/* Session timer */}
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Session Time</p>
                <p className="text-2xl font-mono font-bold text-foreground">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Status Bar ─────────────────────────────────── */}
      <StatusBar data={data} />

      {/* ── Main Content ───────────────────────────────── */}
      <div className="p-6 space-y-6">
        <KPIGrid data={data} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DataVisualization data={data} />
          </div>
          <div className="space-y-6">
            <AlertPanel data={data} />
            <CoachPanel data={data} />
          </div>
        </div>

        <RiskAnalysis data={data} />
      </div>
    </main>
  );
}
