import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AIInsightsCard = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-bg-secondary p-6 rounded-2xl border border-border-muted/50 animate-pulse">
        <div className="h-6 w-32 bg-surface-variant rounded mb-4" />
        <div className="space-y-3">
          <div className="h-20 bg-surface-variant rounded-xl" />
          <div className="h-20 bg-surface-variant rounded-xl" />
        </div>
      </div>
    );
  }

  const insights = data?.insights || [];

  return (
    <div className="bg-bg-secondary p-6 rounded-2xl border border-border-muted/50 shadow-sm overflow-hidden relative group">
      {/* 🚀 Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-500/10 transition-all duration-700" />
      
      <div className="flex items-center justify-between mb-6 relative">
        <div>
          <h3 className="text-[20px] font-black text-text-primary tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-500">psychology</span>
            QueueMD AI Insights
          </h3>
          <p className="text-[12px] text-text-secondary font-bold uppercase tracking-widest mt-1 opacity-60">
            Predictive Intelligence
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">Live Engine</span>
        </div>
      </div>

      <div className="space-y-4 relative">
        <AnimatePresence mode="popLayout">
          {insights.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-8 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-text-secondary opacity-30">query_stats</span>
              </div>
              <p className="text-[13px] text-text-secondary font-medium">
                Not enough data yet for AI predictions. 
                <br/>Process more patients to activate insights.
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
                    : 'bg-green-500/5 border-green-500/10 hover:border-green-500/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  insight.impact === 'high' ? 'bg-red-500/10 text-red-500' : 
                  insight.impact === 'medium' ? 'bg-orange-500/10 text-orange-500' : 'bg-green-500/10 text-green-500'
                }`}>
                  <span className="material-symbols-outlined text-[20px]">
                    {insight.type === 'peak_traffic' ? 'trending_up' : 
                     insight.type === 'no_show' ? 'person_off' : 
                     insight.type === 'efficiency' ? 'speed' : 'lightbulb'}
                  </span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[14px] font-black text-text-primary">{insight.title}</h4>
                    <span className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${
                      insight.impact === 'high' ? 'bg-red-500/20 text-red-500' : 
                      insight.impact === 'medium' ? 'bg-orange-500/20 text-orange-500' : 'bg-green-500/20 text-green-500'
                    }`}>
                      {insight.impact} impact
                    </span>
                  </div>
                  <p className="text-[12px] text-text-secondary mt-1 font-medium leading-relaxed">
                    {insight.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-40">Action:</span>
                    <span className="text-[11px] font-bold text-text-primary bg-bg-primary/50 px-2 py-0.5 rounded border border-border-muted/30">
                      {insight.action}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* 🔮 Scanning Animation Effect */}
      <motion.div 
        animate={{ 
          top: ['0%', '100%', '0%'],
          opacity: [0, 0.5, 0]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent pointer-events-none"
      />
    </div>
  );
};

export default AIInsightsCard;
