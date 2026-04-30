import { motion } from "framer-motion";

export default function LoadingOverlay({ text = "Loading..." }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 
                 flex items-center justify-center"
    >
      <div className="bg-bg-secondary p-6 rounded-2xl border border-border-muted/50 
                      shadow-2xl flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent 
                        rounded-full animate-spin"></div>
        <p className="text-[14px] font-bold text-text-primary">{text}</p>
      </div>
    </motion.div>
  );
}
