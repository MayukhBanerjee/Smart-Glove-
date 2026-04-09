import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface RepCardProps {
  data: {
    count: number;
    tempo: 'FAST' | 'NORMAL' | 'SLOW';
  };
}

export function RepCard({ data }: RepCardProps) {
  const getTempoColor = () => {
    switch (data.tempo) {
      case 'FAST':
        return { bg: 'bg-orange-100', text: 'text-orange-900', label: 'text-orange-700' };
      case 'NORMAL':
        return { bg: 'bg-blue-100', text: 'text-blue-900', label: 'text-blue-700' };
      case 'SLOW':
        return { bg: 'bg-teal-100', text: 'text-teal-900', label: 'text-teal-700' };
    }
  };

  const tempoColor = getTempoColor();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="group relative bg-gradient-to-br from-white to-slate-50 rounded-lg border border-border/40 p-4 hover:border-border/60 transition-all hover:shadow-lg backdrop-blur-sm overflow-hidden"
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="relative z-10">
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rep Intelligence</h3>
        </div>

        {/* Rep count - Large and prominent */}
        <motion.div
          className="mb-4 text-center"
          key={data.count}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, type: 'spring' }}
        >
          <p className="text-4xl font-black text-foreground mb-1">{data.count}</p>
          <p className="text-xs text-muted-foreground font-medium">Reps Completed</p>
        </motion.div>

        {/* Tempo badge */}
        <motion.div
          className={`${tempoColor.bg} rounded-full py-2 px-3 text-center mb-3 border border-opacity-30`}
          key={data.tempo}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className={`text-xs font-bold uppercase tracking-widest ${tempoColor.label}`}>{data.tempo}</p>
          <p className={`text-xs ${tempoColor.label} opacity-75`}>Tempo</p>
        </motion.div>

        {/* Animation pulse indicator */}
        <div className="flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 bg-foreground/40 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            ></motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
