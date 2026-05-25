import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaPrint, FaTimes, FaQrcode } from 'react-icons/fa';
import api from '../services/api'; // Axios instance

const PrescriptionPrintView = ({ visitId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/visits/${visitId}/prescription`);
        setData(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [visitId]);

  const handlePrint = () => {
    window.print(); // Triggers the browser print dialog
  };

  if (loading) return <div className="text-white p-10 flex justify-center w-full"><span className="material-symbols-outlined animate-spin mr-2">refresh</span> Loading Prescription...</div>;
  if (!data) return <div className="text-white p-10">Error loading prescription</div>;

  const { visit, facility } = data;

  return (
    // Overlay Background (Hidden during print via CSS logic or no-print class)
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto no-print-parent">
      
      {/* Action Buttons (Hidden during print) */}
      <div className="absolute top-5 right-5 flex gap-3 no-print z-50">
        <button onClick={handlePrint} className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-lg transition">
          <FaPrint /> Print / Save PDF
        </button>
        <button onClick={onClose} className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition">
          <FaTimes />
        </button>
      </div>

      {/* 📄 THE A4 PAPER (This is the only thing visible in print) */}
      <motion.div 
        id="print-section"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0B1120] text-gray-200 w-full max-w-[210mm] min-h-[297mm] p-8 rounded-lg shadow-2xl border border-white/10 
                   print:bg-white print:text-black print:border-none print:shadow-none print:w-full print:max-w-none print:rounded-none"
      >
        
        {/* HEADER: Clinic Info */}
        <header className="flex justify-between items-start border-b-2 border-blue-500 print:border-black pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-blue-500 print:text-black uppercase">
              {facility?.name || 'Clinic'}
            </h1>
            <p className="text-sm text-gray-400 print:text-gray-600 mt-1">{facility?.address}</p>
            <p className="text-sm text-gray-400 print:text-gray-600">Ph: {facility?.phone}</p>
          </div>
          <div className="text-right">
            <img src={facility?.logoUrl || '/logo.png'} alt="Logo" className="w-16 h-16 object-contain mb-2 print:grayscale ml-auto" />
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Health & Wellness</p>
          </div>
        </header>

        {/* PATIENT INFO GRID */}
        <div className="grid grid-cols-2 gap-4 mb-8 text-sm font-inter">
          <div className="bg-white/5 print:bg-gray-100 p-3 rounded border border-white/10 print:border-gray-300">
            <p><span className="font-bold text-gray-500 uppercase text-xs">Patient:</span> {visit?.patientName}</p>
            <p><span className="font-bold text-gray-500 uppercase text-xs">Phone:</span> {visit?.patientPhone}</p>
          </div>
          <div className="bg-white/5 print:bg-gray-100 p-3 rounded border border-white/10 print:border-gray-300 text-right">
            <p><span className="font-bold text-gray-500 uppercase text-xs">Date:</span> {new Date(visit?.createdAt).toLocaleDateString()}</p>
            <p><span className="font-bold text-gray-500 uppercase text-xs">Doctor:</span> Dr. {visit?.doctorId?.name}</p>
          </div>
        </div>

        {/* CLINICAL BODY */}
        <div className="space-y-6">
          {/* Vitals */}
          <div className="flex gap-4 text-sm font-semibold border-b border-gray-700 print:border-gray-300 pb-2">
             <span className="text-blue-400 print:text-black">BP: {visit?.vitals?.bp || 'N/A'}</span>
             <span className="text-blue-400 print:text-black">Weight: {visit?.vitals?.weight || 'N/A'} kg</span>
             <span className="text-blue-400 print:text-black">Temp: {visit?.vitals?.temperature || 'N/A'} °F</span>
          </div>

          {/* Diagnosis & Rx */}
          <div className="grid grid-cols-3 gap-6 min-h-[300px]">
            <div className="col-span-1 border-r border-gray-700 print:border-gray-300 pr-4">
              <h3 className="font-black text-lg mb-2 text-red-400 print:text-black uppercase tracking-wider">Diagnosis</h3>
              <p className="text-gray-300 print:text-black leading-relaxed">{visit?.diagnosis || 'Nil'}</p>
            </div>
            <div className="col-span-2">
              <h3 className="font-black text-lg mb-2 text-green-500 print:text-black uppercase tracking-wider">Rx (Prescription)</h3>
              <div className="text-gray-300 print:text-black whitespace-pre-line leading-relaxed font-mono text-sm">
                {visit?.prescriptionNotes || 'No medication prescribed.'}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER: Sign & QR */}
        <footer className="absolute bottom-8 left-8 right-8 flex justify-between items-end mt-12 pt-4 border-t border-gray-700 print:border-black">
          <div className="flex flex-col items-center">
             {/* QR Code for Feedback/Payment */}
             <div className="bg-white p-2 rounded mb-1">
               <FaQrcode className="text-black text-3xl" />
             </div>
             <span className="text-[10px] uppercase tracking-widest text-gray-500">Scan for Feedback</span>
          </div>
          
          <div className="text-center">
            {visit?.doctorId?.signatureUrl ? (
              <img src={visit.doctorId.signatureUrl} alt="Signature" className="h-10 object-contain mb-1" />
            ) : (
              <div className="h-10 border-b border-black w-48 mb-1"></div>
            )}
            <p className="font-bold text-sm">Dr. {visit?.doctorId?.name}</p>
            <p className="text-xs text-gray-500">{visit?.doctorId?.specialization}</p>
          </div>
        </footer>

      </motion.div>
    </div>
  );
};

export default PrescriptionPrintView;
