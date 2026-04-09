import { motion } from 'framer-motion';
import { Thermometer } from 'lucide-react';

interface TemperatureCardProps {
  temperature: number;
}

export function TemperatureCard({ temperature }: TemperatureCardProps) {
  // Heat indicator based on temperature
  const getHeatColor = () => {
    if (temperature < 36.8) {
      return { bg: 'from-blue-100 to-cyan-100', text: 'text-cyan-900', accent: 'text-cyan-600' };
    } else if (temperature < 37.5) {
      return { bg: 'from-green-100 to-emerald-100', text: 'text-green-900', accent: 'text-green-600' };
    } else if (temperature < 38.2) {
      return { bg: 'from-yellow-100 to-amber-100', text: 'text-amber-900', accent: 'text-amber-600' };
    } else {
      return { bg: 'from-orange-100 to-red-100', text: 'text-red-900', accent: 'text-red-600' };
    }
  };

  const heatColor = getHeatColor();
  const percentage = Math.min(100, ((temperature - 35) / 3) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className={`group relative bg-gradient-to-br ${heatColor.bg} rounded-lg border-2 border-border/50 p-4 hover:border-border/70 transition-all hover:shadow-lg backdrop-blur-sm overflow-hidden`}
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <h3 className={`text-xs font-semibold text-muted-foreground uppercase tracking-wide`}>Body Temp</h3>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Thermometer className={`w-5 h-5 ${heatColor.accent}`} />
          </motion.div>
        </div>

        {/* Temperature display */}
        <motion.div
          className="mb-3"
          key={temperature}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className={`text-4xl font-black ${heatColor.text}`}>{temperature}°</p>
          <p className={`text-xs font-medium ${heatColor.accent}`}>Celsius</p>
        </motion.div>

        {/* Heat gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-blue-400 via-green-400 to-red-400 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-black/30 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.6 }}
          ></motion.div>
        </div>
      </div>
    </motion.div>
  );
}
