// client/src/utils/useToast.jsx
import React, { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCircle, AlertTriangle, X } from "lucide-react";

// 🎨 Premium Toast Component with Glassmorphism
const ToastItem = ({ id, message, type, removeToast }) => {
  const Icon = type === "success" ? CheckCircle : type === "error" ? AlertTriangle : Bell;
  const color = type === "success" ? "text-emerald-400" : type === "error" ? "text-red-400" : "text-blue-400";
  const glowColor = type === "success" ? "rgba(16, 185, 129, 0.2)" : type === "error" ? "rgba(239, 68, 68, 0.2)" : "rgba(59, 130, 246, 0.2)";

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      className="relative flex items-center gap-4 px-5 py-4 rounded-2xl border backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-sm w-full overflow-hidden cursor-pointer group"
      style={{
        background: "rgba(15, 23, 42, 0.8)", // Dark slate with high opacity for readability
        borderColor: "rgba(255, 255, 255, 0.1)",
        boxShadow: `0 0 20px ${glowColor}`,
      }}
      onClick={() => removeToast(id)}
    >
      {/* 🔮 Background Animated Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-50" />
      
      {/* Glass Shine Effect */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      {/* Icon */}
      <div className={`relative p-2.5 rounded-xl bg-slate-900/80 border border-white/5 ${color} shadow-inner`}>
        <Icon className="w-6 h-6" />
      </div>
      
      {/* Content */}
      <div className="relative flex-1 min-w-0 pr-4">
        <p className="text-sm text-white font-semibold leading-tight mb-0.5">Notification Alert</p>
        <p className="text-xs text-slate-400 font-medium truncate">{message}</p>
      </div>

      {/* Close Button (Visible on hover) */}
      <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
        <X className="w-4 h-4 text-slate-500 hover:text-white" />
      </div>

      {/* Progress Bar Timer */}
      <motion.div 
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 4, ease: "linear" }}
        className="absolute bottom-0 left-0 h-[2px] bg-blue-500/50"
      />
    </motion.div>
  );
};

// ✅ Custom Hook Logic
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ToastContainer = () => (
    <div className="pointer-events-none fixed bottom-8 right-8 z-[9999] flex flex-col items-end gap-3 w-full max-w-sm">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} {...toast} removeToast={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );

  return { addToast, ToastContainer };
};
