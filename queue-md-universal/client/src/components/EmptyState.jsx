import { motion } from "framer-motion";

export default function EmptyState({ icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="text-center py-12 px-4"
    >
      <motion.div
        initial={{ y: -10 }}
        animate={{ y: 0 }}
        transition={{ repeat: Infinity, repeatType: "reverse", duration: 2 }}
        className="inline-flex items-center justify-center w-20 h-20 
                   rounded-full bg-surface-variant mb-4"
      >
        <span className="material-symbols-outlined text-[48px] text-text-secondary opacity-50">
          {icon || "inbox"}
        </span>
      </motion.div>
      
      <h3 className="text-[18px] font-black text-text-primary mb-2">
        {title || "No Data Available"}
      </h3>
      
      <p className="text-[14px] text-text-secondary mb-6 max-w-sm mx-auto">
        {description || "There's nothing to show here yet."}
      </p>
      
      {action && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className="px-6 h-[44px] rounded-xl bg-blue-600 hover:bg-blue-500 
                     text-white font-bold text-[14px] shadow-lg shadow-blue-600/20"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
