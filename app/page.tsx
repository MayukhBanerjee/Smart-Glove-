'use client';

import { useState, useEffect } from 'react';
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
    // Initialize with mock data
    setData(generateMockData());

    // Simulate live updates
    const interval = setInterval(() => {
      setData(generateMockData());
    }, 1000);

    // Update session timer
    const timer = setInterval(() => {
      setSessionTime(t => t + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
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
