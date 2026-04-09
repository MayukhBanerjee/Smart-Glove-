'use client';

import { MockData } from '@/lib/mock-data';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AlertPanelProps {
  data: MockData;
}

export function AlertPanel({ data }: AlertPanelProps) {
  const getAlertStyle = (severity: string) => {
    switch (severity) {
      case 'INFO':
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: <Info className="w-4 h-4 text-blue-600" />,
          badge: 'bg-blue-100 text-blue-700',
          text: 'text-blue-900',
        };
      case 'WARNING':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          icon: <AlertTriangle className="w-4 h-4 text-yellow-600" />,
          badge: 'bg-yellow-100 text-yellow-700',
          text: 'text-yellow-900',
        };
      case 'CRITICAL':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: <AlertCircle className="w-4 h-4 text-red-600" />,
          badge: 'bg-red-100 text-red-700',
          text: 'text-red-900',
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-200',
          icon: <Info className="w-4 h-4 text-slate-600" />,
          badge: 'bg-slate-100 text-slate-700',
          text: 'text-slate-900',
        };
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-gradient-to-br from-white to-slate-50 rounded-lg border border-border/40 p-5 hover:border-border/60 transition-all hover:shadow-lg backdrop-blur-sm"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        Active Alerts
      </h3>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {data.alerts.length > 0 ? (
            data.alerts.map((alert, index) => {
              const style = getAlertStyle(alert.severity);
              return (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`border-l-2 p-3 rounded-md ${style.bg} group hover:shadow-md transition-shadow`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <p className={`text-xs font-semibold uppercase tracking-wide ${style.badge.split(' ')[1]}`}>
                          {alert.severity}
                        </p>
                      </div>
                      <p className={`text-sm font-medium ${style.text} break-words`}>{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatTime(alert.timestamp)}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6 text-muted-foreground"
            >
              <div className="text-3xl mb-2">✓</div>
              <p className="text-sm font-medium">No active alerts</p>
              <p className="text-xs">All systems operating normally</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
