import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPatientHistoryApi } from '../services/api';
import PatientHistoryTimeline from './PatientHistoryTimeline';
import toast from 'react-hot-toast';

export default function PatientHistoryDrawer({ isOpen, onClose, patient }) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && patient?.phone) {
      fetchHistory();
    }
  }, [isOpen, patient]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await getPatientHistoryApi(patient.phone);
      setVisits(response.data || []);
    } catch (error) {
      toast.error('Failed to load patient history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && patient && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Slide-over Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-[400px] bg-[#0B1120]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-black text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-400">history</span>
                  Patient History
                </h2>
                <p className="text-[12px] text-gray-400 mt-1 font-medium">
                  Clinical records for <span className="font-bold text-white">{patient.name}</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/10 text-gray-400 transition"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {loading ? (
                <SkeletonTimeline />
              ) : (
                <PatientHistoryTimeline
                  visits={visits}
                  onAddQuickNote={() => toast('Quick Note feature coming soon!', { icon: '📝' })}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ✅ Premium Skeleton Timeline Loader for smooth perceived wait times
function SkeletonTimeline() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="relative pl-8 border-l-2 border-white/5">
          {/* Timeline Dot */}
          <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white/10 ring-4 ring-[#0B1120]"></div>
          {/* Card Skeleton */}
          <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-2 w-1/2">
                <div className="h-2.5 bg-white/10 rounded-full w-24"></div>
                <div className="h-3.5 bg-white/10 rounded-full w-32"></div>
              </div>
              <div className="h-6 bg-white/10 rounded-full w-16"></div>
            </div>
            <div className="space-y-2 mt-4">
              <div className="h-3 bg-white/10 rounded-full w-full"></div>
              <div className="h-3 bg-white/10 rounded-full w-5/6"></div>
              <div className="h-3 bg-white/10 rounded-full w-2/3"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
