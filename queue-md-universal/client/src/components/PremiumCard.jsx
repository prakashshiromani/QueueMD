import { motion } from "framer-motion";

export default function PremiumCard({ children, className = "", glow = false }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`
        bg-white/10 backdrop-blur-xl border border-white/20 
        shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-2xl p-6
        ${glow ? "glow-blue" : ""}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
