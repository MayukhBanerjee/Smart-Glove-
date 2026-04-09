import { motion } from 'framer-motion';

interface StabilityCardProps {
  score: number;
}

export function StabilityCard({ score }: StabilityCardProps) {
  // Generate waveform data
  const waveData = Array.from({ length: 20 }, (_, i) => {
    const value = Math.sin((i / 20) * Math.PI * 4 + Math.random() * 0.5) * 0.4 + 0.5;
    return Math.min(1, Math.max(0, value));
  });

  const height = 40;
  const width = 200;
  const points = waveData
    .map((value, index) => {
      const x = (index / (waveData.length - 1)) * width;
      const y = height - value * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="group relative bg-gradient-to-br from-white to-slate-50 rounded-lg border border-border/40 p-4 hover:border-border/60 transition-all hover:shadow-lg backdrop-blur-sm overflow-hidden"
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="relative z-10">
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stability Score</h3>
        </div>

        {/* Waveform visualization */}
        <div className="mb-4 flex justify-center">
          <svg width={width} height={height} className="opacity-70">
            <polyline
              points={points}
              fill="none"
              stroke="url(#waveGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#0891b2" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Score display */}
        <motion.div
          className="text-center mb-3"
          key={score}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-3xl font-bold text-foreground">{score}</p>
          <p className="text-xs text-muted-foreground">Smoothness</p>
        </motion.div>

        {/* Status indicator */}
        <div className="pt-2 border-t border-border/30 flex items-center justify-center gap-2">
          <div className={`w-2 h-2 rounded-full ${score > 80 ? 'bg-emerald-500' : score > 60 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
          <span className="text-xs font-medium text-muted-foreground">
            {score > 80 ? 'Stable' : score > 60 ? 'Moderate' : 'Unstable'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
