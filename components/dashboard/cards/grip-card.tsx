import { motion } from 'framer-motion';

interface GripCardProps {
  data: {
    left: number;
    right: number;
    symmetryScore: number;
  };
}

export function GripCard({ data }: GripCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group relative bg-gradient-to-br from-white to-slate-50 rounded-lg border border-border/40 p-4 hover:border-border/60 transition-all hover:shadow-lg backdrop-blur-sm overflow-hidden"
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="relative z-10">
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Grip Intelligence</h3>
        </div>

        {/* Dual bar visualization */}
        <div className="space-y-2 mb-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs font-medium text-foreground">Left</span>
              <span className="text-sm font-bold text-foreground">{data.left}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${data.left}%` }}
                transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
              ></motion.div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs font-medium text-foreground">Right</span>
              <span className="text-sm font-bold text-foreground">{data.right}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${data.right}%` }}
                transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
              ></motion.div>
            </div>
          </div>
        </div>

        {/* Symmetry Score */}
        <div className="pt-2 border-t border-border/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Symmetry</span>
            <motion.span
              className="text-lg font-bold text-foreground"
              key={data.symmetryScore}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {data.symmetryScore}%
            </motion.span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
