'use client';

import { MockData } from '@/lib/mock-data';
import { Lightbulb, TrendingUp, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CoachPanelProps {
  data: MockData;
}

export function CoachPanel({ data }: CoachPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.45 }}
      className="bg-gradient-to-br from-white to-slate-50 rounded-lg border border-border/40 p-5 hover:border-border/60 transition-all hover:shadow-lg backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
          <Brain className="w-4 h-4 text-purple-600" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">AI Coach</h3>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {data.recommendations.length > 0 ? (
            data.recommendations.map((recommendation, index) => (
              <motion.div
                key={`${recommendation}-${index}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200/30 hover:border-purple-200/50 transition-colors group"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4 text-purple-600 group-hover:text-purple-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-2">{recommendation}</p>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-4"
            >
              <p className="text-sm text-muted-foreground font-medium">All systems optimal</p>
              <p className="text-xs text-muted-foreground">Keep up the great work!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick stats footer */}
      <div className="mt-4 pt-3 border-t border-border/30">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Performance Level</span>
          <motion.div
            className="flex items-center gap-1"
            animate={{ opacity: [0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${i < 4 ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  initial={{ scale: 1 }}
                  animate={{ scale: i < 4 ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </div>
            <span className="font-semibold text-foreground ml-2">Excellent</span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
