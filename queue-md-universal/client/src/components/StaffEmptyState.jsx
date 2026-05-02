import React from 'react';
import { motion } from "framer-motion";
import { Users } from "lucide-react";

export default function StaffEmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="mb-4 p-5 bg-white/5 rounded-full border border-white/10"
      >
        <Users className="w-12 h-12 text-blue-400 opacity-80" />
      </motion.div>
      <h3 className="text-xl font-black text-white mb-2">No personnel found</h3>
      <p className="text-white/40 max-w-sm text-[14px]">
        We couldn't find any staff members matching your criteria. Try adjusting your filters or search query.
      </p>
    </div>
  );
}
