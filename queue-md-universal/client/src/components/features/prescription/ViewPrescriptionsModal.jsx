import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, FileText, Download } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';

const sendLog = (msg, data) => {
  axios.post('/api/public/debug-log', { msg, data }).catch(() => {});
};

const ViewPrescriptionsModal = ({ onClose, facilityId, tokenNumber, phone: initialPhone, onView }) => {
  const [step, setStep] = useState(initialPhone ? 'VIEW' : 'VERIFY'); 
  const [phone, setPhone] = useState('');
  const [uploadToken, setUploadToken] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [maskedName, setMaskedName] = useState('');

  useEffect(() => {
    sendLog("👀 [ViewPrescriptionsModal] Mount / Dependency change effect triggered", { initialPhone, tokenNumber, facilityId });
    
    if (initialPhone && tokenNumber && facilityId) {
      const autoVerify = async () => {
        sendLog("👀 [ViewPrescriptionsModal] starting autoVerify");
        setLoading(true);
        try {
          const formattedPhone = initialPhone.startsWith('+91') 
            ? initialPhone 
            : `+91 ${initialPhone.replace(/\D/g, '').slice(-10)}`;
          
          sendLog("👀 [ViewPrescriptionsModal] calling /verify API with phone: " + formattedPhone + " tokenNumber: " + tokenNumber);
          const res = await axios.post(`/api/public/lobby/${facilityId}/verify`, {
            phone: formattedPhone,
            tokenNumber: Number(tokenNumber)
          });

          sendLog("👀 [ViewPrescriptionsModal] verify API response: ", res.data);
          if (res.data.success) {
            setUploadToken(res.data.data.uploadToken);
            setMaskedName(res.data.data.patientNameMasked);
            await fetchDocuments(res.data.data.uploadToken);
          } else {
            setStep('VERIFY');
          }
        } catch (err) {
          sendLog("👀 [ViewPrescriptionsModal] Auto verification failed", err.response?.data || err.message);
          setStep('VERIFY');
        } finally {
          setLoading(false);
        }
      };
      autoVerify();
    }

    return () => {
      sendLog("👀 [ViewPrescriptionsModal] Cleanup/Unmount of verification effect");
    };
  }, [initialPhone, tokenNumber, facilityId]);

  useEffect(() => {
    sendLog("👀 [ViewPrescriptionsModal] Initial Component Mount");
    return () => {
      sendLog("👀 [ViewPrescriptionsModal] Component Unmounted");
    };
  }, []);

  const handlePhoneChange = (val) => {
    let numbers = val.replace(/\D/g, "");
    if (numbers.length > 10) {
        numbers = numbers.slice(-10);
    }
    let formatted = numbers;
    if (numbers.length > 5) {
        formatted = `${numbers.slice(0, 5)} ${numbers.slice(5)}`;
    }
    setPhone(formatted);
  };

  const handleVerify = async () => {
    if (!phone) {
      return toast.error("Please enter your registered phone number");
    }
    setLoading(true);
    try {
      const formattedPhone = `+91 ${phone}`;
      const res = await axios.post(`/api/public/lobby/${facilityId}/verify`, {
        phone: formattedPhone,
        tokenNumber: Number(tokenNumber)
      });

      if (res.data.success) {
        setUploadToken(res.data.data.uploadToken);
        setMaskedName(res.data.data.patientNameMasked);
        await fetchDocuments(res.data.data.uploadToken);
        toast.success("Identity verified successfully!");
      } else {
        toast.error("Identity not verified. Check details.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed. Check phone or token.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (token) => {
    setLoading(true);
    try {
      const res = await axios.get('/api/patient/documents', {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.data.success) {
        setDocuments(res.data.data || []);
        setStep('VIEW');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch documents.");
      setStep('VERIFY');
    } finally {
      setLoading(false);
    }
  };

  const [previewDoc, setPreviewDoc] = useState(null);

  const handleView = (e, doc) => {
    e.preventDefault();
    e.stopPropagation();
    sendLog("🔍 handleView clicked in ViewPrescriptionsModal. Document data:", doc);
    if (onView) {
      onView(doc);
    } else {
      setPreviewDoc(doc);
    }
  };

  const handleDownloadOnly = async (e, url, fileName) => {
    e.preventDefault();
    e.stopPropagation();
    
    toast.promise(
      (async () => {
        const response = await axios.get(url, { responseType: 'blob' });
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      })(),
      {
        loading: 'Downloading file...',
        success: 'File downloaded successfully!',
        error: 'Download failed. Please try again.'
      }
    );
  };

  sendLog("👀 [ViewPrescriptionsModal] Render states:", { step, loading, uploadToken: !!uploadToken, previewDoc: !!previewDoc });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full relative shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {loading && !uploadToken ? (
            <div className="flex flex-col items-center justify-center py-12 flex-1">
              <div className="w-8 h-8 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin mb-4"></div>
              <p className="text-slate-400 text-sm">Verifying your identity...</p>
            </div>
          ) : step === 'VERIFY' ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="bg-blue-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                  <ShieldCheck className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-wider">Identity Gate</h3>
                <p className="text-slate-400 text-xs mt-1">Please enter your registered phone number to verify and view your documents.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Registered Phone</label>
                  <div className="flex rounded-xl overflow-hidden bg-slate-950 border border-slate-850 focus-within:border-blue-500 transition-colors">
                    <span className="inline-flex items-center px-4 bg-slate-900 border-r border-slate-850 text-slate-400 font-bold text-sm">
                      +91
                    </span>
                    <input 
                      type="tel" 
                      placeholder="10-digit number" 
                      value={phone} 
                      onChange={e => handlePhoneChange(e.target.value)} 
                      className="flex-1 p-4 bg-transparent outline-none text-white placeholder-slate-600 font-semibold" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-755 text-white font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleVerify}
                  disabled={loading}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify Identity'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="text-center mb-6 flex-shrink-0">
                <h3 className="text-xl font-black text-white uppercase tracking-wider">Your Documents</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Showing uploaded files for: <span className="text-blue-400 font-bold">{maskedName}</span>
                </p>
              </div>

              <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 space-y-3">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border-t-2 border-blue-500 animate-spin"></div>
                    </div>
                ) : documents.length === 0 ? (
                    <div className="text-center py-8 bg-slate-950/40 rounded-2xl border border-slate-800/50">
                        <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">No documents uploaded yet.</p>
                    </div>
                ) : (
                    documents.map((doc, i) => (
                        <div 
                            key={i} 
                            onClick={(e) => handleView(e, doc)}
                            className="flex items-center justify-between bg-slate-950/60 p-4 rounded-2xl border border-slate-800/50 hover:border-blue-500/30 transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-400 flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-blue-400 transition-colors">{doc.fileName || 'Prescription'}</p>
                                    <p className="text-[10px] text-slate-500 uppercase">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <button 
                                onClick={(e) => handleDownloadOnly(e, doc.url, doc.fileName)}
                                className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-xl text-slate-300 transition-colors flex-shrink-0"
                                title="Download"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
              </div>

              <div className="mt-6 flex-shrink-0">
                <button 
                  onClick={onClose}
                  className="w-full py-3.5 bg-slate-800 hover:bg-slate-755 text-white font-bold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

        </motion.div>

        {/* Inline Preview Overlay */}
        {previewDoc && createPortal(
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full max-w-2xl h-[70vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b border-slate-800/50 bg-slate-950/50 flex-shrink-0">
                <span className="text-sm font-bold text-white truncate max-w-[70%]">{previewDoc.fileName || 'Preview'}</span>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => handleDownloadOnly(e, previewDoc.url, previewDoc.fileName)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                    title="Download File"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setPreviewDoc(null)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                    title="Close Preview"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {/* Content */}
              <div className="flex-1 bg-slate-950 flex items-center justify-center overflow-auto p-4">
                {previewDoc.type?.includes('pdf') || previewDoc.url?.toLowerCase().endsWith('.pdf') ? (
                  <iframe src={previewDoc.url} className="w-full h-full border-0 rounded-2xl bg-white" />
                ) : (
                  <img src={previewDoc.url} alt="Preview" className="max-w-full max-h-full object-contain rounded-2xl" />
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </AnimatePresence>
  );
};

export default ViewPrescriptionsModal;
