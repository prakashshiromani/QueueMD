import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatTokenNumber } from '../utils/facilityTypeConfig';

const UploadPrescriptionModal = ({ onClose, facilityId, tokenNumber, phone: initialPhone, facilityType }) => {
  const [step, setStep] = useState(initialPhone ? 'UPLOAD' : 'VERIFY'); // VERIFY | UPLOAD | SUCCESS
  const [phone, setPhone] = useState('');
  const [uploadToken, setUploadToken] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [maskedName, setMaskedName] = useState('');

  // Auto-verify if initialPhone is provided (skips verify screen)
  useEffect(() => {
    if (initialPhone && tokenNumber && facilityId) {
      const autoVerify = async () => {
        setLoading(true);
        try {
          // Prepend +91 if not present
          const formattedPhone = initialPhone.startsWith('+91') 
            ? initialPhone 
            : `+91 ${initialPhone.replace(/\D/g, '').slice(-10)}`;
          
          const res = await axios.post(`/api/public/lobby/${facilityId}/verify`, {
            phone: formattedPhone,
            tokenNumber: Number(tokenNumber)
          });

          if (res.data.success) {
            setUploadToken(res.data.data.uploadToken);
            setMaskedName(res.data.data.patientNameMasked);
            setStep('UPLOAD');
          } else {
            setStep('VERIFY');
          }
        } catch (err) {
          console.error("Auto verification failed", err);
          setStep('VERIFY');
        } finally {
          setLoading(false);
        }
      };
      autoVerify();
    }
  }, [initialPhone, tokenNumber, facilityId]);

  // Format phone number dynamically to 5-space-5 format
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
        setStep('UPLOAD');
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

  const handleUpload = async () => {
    if (!file) return toast.error("Please select a file");
    
    // File validation
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return toast.error("Only JPG, PNG, and PDF files are allowed!");
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.error("File size must be less than 5MB!");
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('prescription', file);

    try {
      await axios.post('/api/patient/upload-prescription', formData, {
        headers: { 
          'Authorization': `Bearer ${uploadToken}`
        }
      });
      setStep('SUCCESS');
      toast.success("Prescription uploaded!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed. Your session might have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full relative shadow-2xl overflow-hidden"
        >
          {/* Neon background glows */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {step === 'VERIFY' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="bg-blue-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                  <ShieldCheck className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-wider">Identity Gate</h3>
                <p className="text-slate-400 text-xs mt-1">Please enter your registered phone number to verify and get secure access.</p>
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
          )}

          {step === 'UPLOAD' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-black text-white uppercase tracking-wider">Upload Record</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Secure upload active for patient: <span className="text-blue-400 font-bold">{maskedName}</span> (Token #{formatTokenNumber(tokenNumber, facilityType)})
                </p>
              </div>

              <div className="border-2 border-dashed border-slate-800 rounded-2xl p-6 text-center bg-slate-950/40 hover:bg-slate-950/80 hover:border-blue-500/50 transition-all">
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                  <div className="bg-blue-500/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 border border-blue-500/20">
                    <Upload className="w-6 h-6 text-blue-400" />
                  </div>
                  <p className="text-slate-300 font-bold text-sm">Select Prescription/Bill</p>
                  <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-wider font-semibold">JPG, PNG, PDF (Max 5MB)</p>
                </label>
                {file && (
                  <div className="mt-4 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-xs font-semibold text-blue-400 flex items-center justify-between">
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <button 
                      onClick={() => setFile(null)} 
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Warning badge */}
              <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl text-amber-400 text-xs flex gap-2.5">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="leading-normal">
                  Yeh file direct aapke health records mein add hogi. Galat ya fake files upload na karein.
                </p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-755 text-white font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpload}
                  disabled={loading || !file}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Uploading...' : 'Save to Timeline'}
                </button>
              </div>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="space-y-6 text-center py-4">
              <div className="bg-emerald-500/15 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-wider">Saved Successfully!</h3>
                <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
                  Your document has been securely attached to your medical history timeline. Your doctor can review it directly.
                </p>
              </div>

              <button 
                onClick={onClose}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-755 text-white font-bold rounded-xl transition-colors"
              >
                Close Portal
              </button>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UploadPrescriptionModal;
