import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AIInsightsCard = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-5 w-36 bg-surface-variant rounded" />
        <div className="h-20 bg-surface-variant rounded-xl" />
        <div className="h-20 bg-surface-variant rounded-xl" />
      </div>
    );
  }

  const insights = data?.insights || [];

  return (
    <div className="relative overflow-hidden">
      {/* Live badge row */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-black text-text-secondary uppercase tracking-widest opacity-60">Predictive Intelligence</p>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Live Engine</span>
        </div>
      </div>

      <div className="space-y-3 relative">
        <AnimatePresence mode="popLayout">
          {insights.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-8 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-surface-variant/50 flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-text-secondary opacity-30">query_stats</span>
              </div>
              <p className="text-[13px] text-text-secondary font-medium leading-relaxed">
                Not enough data yet for AI predictions.
                <br />Process more patients to activate insights.
              </p>
            </motion.div>
          ) : (
            insights.map((insight, idx) => (
              <motion.div
                key={insight.type + idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-4 rounded-xl border flex gap-4 items-start transition-all duration-300 hover:scale-[1.01] ${
                  insight.impact === 'high'
                    ? 'bg-red-500/5 border-red-500/10 hover:border-red-500/30'
                    : insight.impact === 'medium'
                    ? 'bg-orange-500/5 border-orange-500/10 hover:border-orange-500/30'
                    : 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  insight.impact === 'high' ? 'bg-red-500/15 text-red-400' :
                  insight.impact === 'medium' ? 'bg-orange-500/15 text-orange-400' : 'bg-emerald-500/15 text-emerald-400'
                }`}>
                  <span className="material-symbols-outlined text-[18px]">
                    {insight.type === 'peak_traffic' ? 'trending_up' :
                     insight.type === 'no_show' ? 'person_off' :
                     insight.type === 'efficiency' ? 'speed' : 'lightbulb'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-[13px] font-black text-text-primary leading-tight">{insight.title}</h4>
                    <span className={`text-[9px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded shrink-0 ${
                      insight.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                      insight.impact === 'medium' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {insight.impact} impact
                    </span>
                  </div>
                  <p className="text-[11.5px] text-text-secondary mt-1 font-medium leading-relaxed">{insight.description}</p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest opacity-40">Action:</span>
                    <span className="text-[11px] font-bold text-text-primary bg-surface-variant/40 px-2 py-0.5 rounded border border-border-muted/30">
                      {insight.action}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Scanning beam animation */}
      <motion.div
        animate={{ top: ['0%', '100%', '0%'], opacity: [0, 0.4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent pointer-events-none"
      />
    </div>
  );
};

export default AIInsightsCard;
