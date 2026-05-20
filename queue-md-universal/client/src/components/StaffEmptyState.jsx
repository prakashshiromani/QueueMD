import React from 'react';
import { motion } from "framer-motion";

export default function StaffEmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="mb-4 p-5 bg-bg-primary rounded-full border border-border-muted/50 shadow-sm"
      >
        <span className="material-symbols-outlined text-4xl text-text-secondary/40">groups</span>
      </motion.div>
      <h3 className="text-text-primary font-black uppercase tracking-widest">No personnel found</h3>
      <p className="text-text-secondary text-xs mt-1 uppercase tracking-widest font-medium max-w-sm">
        We couldn't find any staff members matching your criteria. Try adjusting your filters or search query.
      </p>
    </div>
  );
}
