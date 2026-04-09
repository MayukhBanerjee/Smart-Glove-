import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface FatigueCardProps {
  data: 'LOW' | 'MEDIUM' | 'HIGH';
}

export function FatigueCard({ data }: FatigueCardProps) {
  const getColors = () => {
    switch (data) {
      case 'LOW':
        return {
          bg: 'from-emerald-50 to-emerald-100/50',
          border: 'border-emerald-200',
          text: 'text-emerald-900',
          label: 'text-emerald-700',
          glow: 'shadow-lg shadow-emerald-300/50',
          accent: 'bg-emerald-500',
        };
      case 'MEDIUM':
        return {
          bg: 'from-amber-50 to-amber-100/50',
          border: 'border-amber-200',
          text: 'text-amber-900',
          label: 'text-amber-700',
          glow: 'shadow-lg shadow-amber-300/50',
          accent: 'bg-amber-500',
        };
      case 'HIGH':
        return {
          bg: 'from-red-50 to-red-100/50',
          border: 'border-red-200',
          text: 'text-red-900',
          label: 'text-red-700',
          glow: 'shadow-lg shadow-red-400/70 animate-pulse',
          accent: 'bg-red-500',
        };
    }
  };

  const colors = getColors();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={`group relative bg-gradient-to-br ${colors.bg} rounded-lg border-2 ${colors.border} p-5 hover:shadow-xl transition-all backdrop-blur-sm overflow-hidden ${colors.glow}`}
    >
      {/* Animated background pulse for HIGH */}
      {data === 'HIGH' && (
        <motion.div
          className="absolute inset-0 bg-red-400/10 rounded-lg"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        ></motion.div>
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <h3 className={`text-xs font-bold uppercase tracking-widest ${colors.label}`}>Fatigue Index</h3>
          <motion.div
            animate={{
              scale: data === 'HIGH' ? [1, 1.1, 1] : 1,
            }}
            transition={{ duration: 1, repeat: data === 'HIGH' ? Infinity : 0 }}
          >
            <Zap className={`w-5 h-5 ${colors.label}`} />
          </motion.div>
        </div>

        {/* Main status display */}
        <motion.div
          className="mb-4"
          key={data}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, type: 'spring' }}
        >
          <p className={`text-4xl font-black ${colors.text} mb-1`}>{data}</p>
          <p className={`text-xs font-medium ${colors.label}`}>Current Level</p>
        </motion.div>

        {/* Status bar */}
        <div className="h-2 bg-white/40 rounded-full overflow-hidden mb-3">
          <motion.div
            className={`h-full ${colors.accent}`}
            initial={{ width: 0 }}
            animate={{
              width: data === 'LOW' ? '33%' : data === 'MEDIUM' ? '66%' : '100%',
            }}
            transition={{ duration: 0.6, type: 'spring' }}
          ></motion.div>
        </div>

        <p className={`text-xs font-medium ${colors.label} opacity-75`}>
          {data === 'LOW' && 'Recovery phase - optimal for performance'}
          {data === 'MEDIUM' && 'Moderate fatigue - maintain pacing'}
          {data === 'HIGH' && '⚠️ High fatigue - consider rest period'}
        </p>
      </div>
    </motion.div>
  );
}
