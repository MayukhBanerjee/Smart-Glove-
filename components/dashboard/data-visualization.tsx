'use client';

import { MockData } from '@/lib/mock-data';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { motion } from 'framer-motion';

interface DataVisualizationProps {
  data: MockData;
}

export function DataVisualization({ data }: DataVisualizationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="space-y-4"
    >
      {/* Grip Force Chart */}
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-lg border border-border/40 p-5 hover:border-border/60 transition-all hover:shadow-lg backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-foreground mb-4">Grip Force Over Time</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.gripForceHistory}>
            <defs>
              <linearGradient id="gripGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
              cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* IMU Motion Chart */}
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-lg border border-border/40 p-5 hover:border-border/60 transition-all hover:shadow-lg backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-foreground mb-4">IMU Motion (Multi-Axis)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data.imuMotion}>
            <defs>
              <linearGradient id="imuGradient1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="imuGradient2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="imuGradient3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
              cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="x"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={false}
              name="X-Axis"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="y"
              stroke="#a855f7"
              strokeWidth={2}
              dot={false}
              name="Y-Axis"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="z"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              name="Z-Axis"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Fatigue Trend Chart */}
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-lg border border-border/40 p-5 hover:border-border/60 transition-all hover:shadow-lg backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-foreground mb-4">Fatigue Trend (GSR)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.fatigueHistory}>
            <defs>
              <linearGradient id="fatigueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
              cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#ef4444"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
