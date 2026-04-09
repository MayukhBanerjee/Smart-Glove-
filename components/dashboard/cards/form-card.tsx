import { motion } from 'framer-motion';

interface FormCardProps {
  data: {
    score: number;
    deviation: number;
  };
}

export function FormCard({ data }: FormCardProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const percentage = data.score / 100;
  const offset = circumference - percentage * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 }}
      className="group relative bg-gradient-to-br from-white to-slate-50 rounded-lg border border-border/40 p-4 hover:border-border/60 transition-all hover:shadow-lg backdrop-blur-sm overflow-hidden"
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="relative z-10">
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Form Quality</h3>
        </div>

        {/* Circular progress */}
        <div className="flex flex-col items-center mb-4">
          <svg width="120" height="120" className="mb-2">
            {/* Background circle */}
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
            {/* Progress circle */}
            <motion.circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.8, type: 'spring', stiffness: 80 }}
              transform="rotate(-90 60 60)"
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#d946ef" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Score display */}
        <motion.div
          className="text-center mb-3"
          key={data.score}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-3xl font-bold text-foreground">{data.score}</p>
          <p className="text-xs text-muted-foreground">Form Score</p>
        </motion.div>

        {/* Deviation */}
        <div className="pt-2 border-t border-border/30 text-center">
          <p className="text-xs text-muted-foreground">Deviation</p>
          <p className="text-sm font-semibold text-foreground">{data.deviation}%</p>
        </div>
      </div>
    </motion.div>
  );
}
