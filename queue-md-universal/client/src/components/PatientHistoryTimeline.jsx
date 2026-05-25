import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStethoscope, FaNotesMedical, FaHeartbeat } from 'react-icons/fa';
import PrescriptionPrintView from './PrescriptionPrintView';

const PatientHistoryTimeline = ({ visits, onAddQuickNote }) => {
  const [printVisitId, setPrintVisitId] = useState(null);

  // Framer Motion variants for staggered fade-in
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  if (!visits || visits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center font-inter animate-in fade-in duration-300">
        <span className="material-symbols-outlined text-5xl text-gray-500 mb-3 opacity-60">folder_open</span>
        <h3 className="text-sm font-bold text-white mb-1">No Past Records</h3>
        <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed">No past clinical records or prescriptions found for this patient.</p>
      </div>
    );
  }

  return (
    <>
      <motion.div 
        className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {visits.map((visit, index) => (
          <motion.div 
            key={visit._id} 
            variants={itemVariants}
            className="relative pl-8 border-l-2 border-blue-500/30"
          >
            {/* Timeline Dot */}
            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-[#0B1120]"></div>
            
            {/* Glassmorphism Card (design.md rule) */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-lg hover:bg-white/10 transition-all">
              
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-black">
                    {new Date(visit.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-sm text-blue-400 font-semibold">
                    Dr. {visit.doctorId?.name || 'Unknown'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setPrintVisitId(visit._id)}
                    className="text-xs px-3 py-1 bg-green-600/20 text-green-400 rounded-full hover:bg-green-600/40 transition flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">print</span> View Rx
                  </button>
                  <button 
                    onClick={() => onAddQuickNote(visit._id)}
                    className="text-xs px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full hover:bg-blue-600/40 transition flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">note_add</span> Note
                  </button>
                </div>
              </div>

              {/* Clinical Data */}
              <div className="space-y-2 text-sm text-gray-300 font-inter mt-3">
                {visit.diagnosis && (
                  <div className="flex items-start gap-2">
                    <FaStethoscope className="text-blue-400 mt-1 flex-shrink-0" />
                    <p><span className="font-bold text-white">Diagnosis:</span> {visit.diagnosis}</p>
                  </div>
                )}
                {visit.prescriptionNotes && (
                  <div className="flex items-start gap-2">
                    <FaNotesMedical className="text-green-400 mt-1 flex-shrink-0" />
                    <p><span className="font-bold text-white">Rx:</span> {visit.prescriptionNotes}</p>
                  </div>
                )}
                {visit.vitals?.bp && (
                  <div className="flex items-start gap-2">
                    <FaHeartbeat className="text-red-400 mt-1 flex-shrink-0" />
                    <p><span className="font-bold text-white">Vitals:</span> BP: {visit.vitals.bp} | Wt: {visit.vitals.weight}kg</p>
                  </div>
                )}
                {visit.documents?.map((doc, idx) => (
                  <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`border-l-4 pl-4 py-3 mt-3 rounded-r-lg ${
                          doc.uploadedBy === 'patient' 
                              ? 'border-yellow-500 bg-yellow-500/10'  // Patient uploaded = Yellow
                              : 'border-blue-500 bg-blue-500/10'      // Doctor uploaded = Blue
                      }`}
                  >
                      <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-wider ${
                              doc.uploadedBy === 'patient' 
                                  ? 'bg-yellow-500/20 text-yellow-400' 
                                  : 'bg-blue-500/20 text-blue-400'
                          }`}>
                              {doc.uploadedBy === 'patient' ? '📤 Patient Uploaded' : '🩺 Doctor Added'}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                              {new Date(doc.uploadedAt).toLocaleDateString()}
                          </span>
                      </div>
                      
                      <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 font-medium underline text-sm transition-colors inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">visibility</span> View {doc.type?.includes('pdf') ? 'PDF Document' : 'Image'}
                      </a>
                      
                      {doc.uploadedBy === 'patient' && (
                          <p className="text-[11px] text-yellow-400/80 mt-2 italic flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">warning</span> Verify this document before clinical decision
                          </p>
                      )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <AnimatePresence>
        {printVisitId && (
          <PrescriptionPrintView 
            visitId={printVisitId} 
            onClose={() => setPrintVisitId(null)} 
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default PatientHistoryTimeline;
