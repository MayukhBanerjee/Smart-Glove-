'use client';

import { MockData } from '@/lib/mock-data';
import { motion } from 'framer-motion';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { AlertCircle, Shield } from 'lucide-react';

interface RiskAnalysisProps {
  data: MockData;
}

export function RiskAnalysis({ data }: RiskAnalysisProps) {
  const radarData = [
    {
      metric: 'Grip Balance',
      value: data.riskMetrics.gripBalance,
    },
    {
      metric: 'Form Quality',
      value: data.riskMetrics.formQuality,
    },
    {
      metric: 'Stability',
      value: data.riskMetrics.stability,
    },
    {
      metric: 'Low Fatigue',
      value: 100 - data.riskMetrics.fatigue,
    },
  ];

  const getRiskColor = () => {
    const overall = data.riskMetrics.overall;
    if (overall >= 80) return { bg: 'from-emerald-50 to-emerald-100/50', text: 'text-emerald-900', badge: 'bg-emerald-100 text-emerald-700', icon: 'text-emerald-600' };
    if (overall >= 60) return { bg: 'from-amber-50 to-amber-100/50', text: 'text-amber-900', badge: 'bg-amber-100 text-amber-700', icon: 'text-amber-600' };
    return { bg: 'from-red-50 to-red-100/50', text: 'text-red-900', badge: 'bg-red-100 text-red-700', icon: 'text-red-600' };
  };

  const riskColor = getRiskColor();

  const getRiskLevel = () => {
    const overall = data.riskMetrics.overall;
    if (overall >= 80) return 'LOW RISK';
    if (overall >= 60) return 'MODERATE RISK';
    return 'HIGH RISK';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className={`bg-gradient-to-br ${riskColor.bg} rounded-lg border-2 border-border/50 p-6 hover:border-border/70 transition-all hover:shadow-lg backdrop-blur-sm`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-white/40 rounded-lg">
          <Shield className={`w-5 h-5 ${riskColor.icon}`} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Injury Risk Assessment</h2>
          <p className="text-xs text-muted-foreground">Comprehensive risk analysis combining all metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Chart - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <defs>
                <linearGradient id="radarGradient" x1="0" y1="0" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <PolarGrid stroke="#cbd5e1" />
              <PolarAngleAxis dataKey="metric" stroke="#64748b" style={{ fontSize: '12px' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#94a3b8" />
              <Radar
                name="Risk Score"
                dataKey="value"
                stroke="url(#radarGradient)"
                fill="url(#radarGradient)"
                fillOpacity={0.35}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Summary - Takes 1 column */}
        <div className="flex flex-col justify-center space-y-4">
          {/* Overall Risk Score */}
          <motion.div
            className="bg-white/50 rounded-lg p-4 border border-border/30"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 100 }}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Overall Score</p>
            <motion.p
              className={`text-4xl font-black ${riskColor.text} mb-2`}
              key={data.riskMetrics.overall}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {data.riskMetrics.overall}%
            </motion.p>
            <motion.div
              className={`${riskColor.badge} rounded-full py-1 px-2 text-xs font-bold uppercase text-center`}
              key={getRiskLevel()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {getRiskLevel()}
            </motion.div>
          </motion.div>

          {/* Individual Metrics */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">Grip Balance</span>
              <motion.span
                className="font-bold text-foreground"
                key={data.riskMetrics.gripBalance}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {data.riskMetrics.gripBalance}%
              </motion.span>
            </div>
            <div className="h-1.5 bg-white/40 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${data.riskMetrics.gripBalance}%` }}
                transition={{ duration: 0.6 }}
              ></motion.div>
            </div>

            <div className="flex items-center justify-between mb-2 mt-3">
              <span className="text-xs font-semibold text-foreground">Form Quality</span>
              <motion.span
                className="font-bold text-foreground"
                key={data.riskMetrics.formQuality}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {data.riskMetrics.formQuality}%
              </motion.span>
            </div>
            <div className="h-1.5 bg-white/40 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${data.riskMetrics.formQuality}%` }}
                transition={{ duration: 0.6 }}
              ></motion.div>
            </div>

            <div className="flex items-center justify-between mb-2 mt-3">
              <span className="text-xs font-semibold text-foreground">Stability</span>
              <motion.span
                className="font-bold text-foreground"
                key={data.riskMetrics.stability}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {data.riskMetrics.stability}%
              </motion.span>
            </div>
            <div className="h-1.5 bg-white/40 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${data.riskMetrics.stability}%` }}
                transition={{ duration: 0.6 }}
              ></motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
