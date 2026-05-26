import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, Activity, CheckCircle, RefreshCcw, Upload, Lock, FileText, LogOut, Calendar, Phone, Download } from 'lucide-react';
import { socket } from '../services/socket';
import UploadPrescriptionModal from '../components/UploadPrescriptionModal';
import ViewPrescriptionsModal from '../components/ViewPrescriptionsModal';
import axios from 'axios';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';


export default function PublicTracking() {
  const { facilityId, tokenNumber } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // ─── NEW: Patient Portal State & Constants ───
  const SESSION_KEYS = {
    TOKEN: "queuemd_patient_token_" + facilityId + "_" + tokenNumber,
    NAME: "queuemd_patient_name_" + facilityId + "_" + tokenNumber,
    PHONE: "queuemd_patient_phone_" + facilityId + "_" + tokenNumber,
  };

  const [uploadToken, setUploadToken] = useState(null);
  const [maskedName, setMaskedName] = useState(null);
  const [verifiedPhone, setVerifiedPhone] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [activeTab, setActiveTab] = useState("timeline"); // 'timeline' | 'documents'
  const [phoneInput, setPhoneInput] = useState("");
  const [previewDoc, setPreviewDoc] = useState(null);

  // ─── Helper: Format Phone Number ───
  const formatPhone = (val) => {
    let numbers = val.replace(/\D/g, "");
    if (numbers.length > 10) {
      numbers = numbers.slice(-10);
    }
    let formatted = numbers;
    if (numbers.length > 5) {
      formatted = `${numbers.slice(0, 5)} ${numbers.slice(5)}`;
    }
    return formatted;
  };

  // ─── Helper: Format Date ───
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  // ─── NEW: Load History from Backend ───
  const fetchPatientHistory = useCallback(async (token) => {
    setLoadingHistory(true);
    setVerificationError("");
    
    try {
      const response = await axios.get(
        `/api/patient/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      if (response.data.success) {
        setHistoryData(response.data.data.visits || []);
      }
    } catch (error) {
      console.error("❌ History fetch error:", error);
      
      // 🔐 Token expired/invalid -> clear session
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout();
        setVerificationError("Session expired. Please verify again.");
      } else {
        setVerificationError("Failed to load history. Please try again.");
      }
    } finally {
      setLoadingHistory(false);
    }
  }, [facilityId, tokenNumber]);

  // ─── NEW: Verify Phone Number ───
  const handleVerifyPhone = async (e) => {
    e.preventDefault();
    setVerificationError("");
    
    const cleanedPhone = phoneInput.replace(/\D/g, "");
    if (cleanedPhone.length !== 10) {
      setVerificationError("Please enter a valid 10-digit phone number");
      return;
    }

    try {
      const formattedPhone = `+91 ${phoneInput}`;
      const response = await axios.post(
        `/api/public/lobby/${facilityId}/verify`,
        {
          phone: formattedPhone,
          tokenNumber: Number(tokenNumber)
        }
      );

      if (response.data.success) {
        const { uploadToken, patientNameMasked } = response.data.data;

        // ✅ Save to state + sessionStorage
        setUploadToken(uploadToken);
        setMaskedName(patientNameMasked);
        setVerifiedPhone(cleanedPhone);
        
        sessionStorage.setItem(SESSION_KEYS.TOKEN, uploadToken);
        sessionStorage.setItem(SESSION_KEYS.NAME, patientNameMasked);
        sessionStorage.setItem(SESSION_KEYS.PHONE, cleanedPhone);

        // ✅ Fetch history immediately
        await fetchPatientHistory(uploadToken);
      }
    } catch (error) {
      console.error("❌ Verification error:", error);
      setVerificationError(
        error.response?.data?.message || "Verification failed. Please check your phone number."
      );
    }
  };

  // ─── NEW: Logout / Clear Session ───
  const handleLogout = () => {
    setUploadToken(null);
    setMaskedName(null);
    setVerifiedPhone(null);
    setHistoryData([]);
    setPhoneInput("");
    
    Object.values(SESSION_KEYS).forEach((key) => sessionStorage.removeItem(key));
  };

  const handleView = (e, doc) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("🔍 handleView clicked in PublicTracking. Document data:", doc);
    setPreviewDoc(doc);
  };

  // ─── NEW: Auto-restore Session on Mount ───
  useEffect(() => {
    const storedToken = sessionStorage.getItem(SESSION_KEYS.TOKEN);
    const storedName = sessionStorage.getItem(SESSION_KEYS.NAME);
    const storedPhone = sessionStorage.getItem(SESSION_KEYS.PHONE);

    if (storedToken && storedPhone) {
      setUploadToken(storedToken);
      setMaskedName(storedName);
      setVerifiedPhone(storedPhone);
      fetchPatientHistory(storedToken);
    }
  }, [facilityId, tokenNumber, fetchPatientHistory]);

  const fetchTrackingStatus = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`http://localhost:5000/api/public/track/${facilityId}/${tokenNumber}`);
      const json = await res.json();
      
      if (json.success) {
        setData(json.data);
        setError('');
      } else {
        setError(json.message);
      }
    } catch (err) {
      setError("Failed to connect. Please try again.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrackingStatus();

    // Setup Socket Connection for Public Tracking
    if (!socket.connected) {
      socket.connect();
    }

    // Join the public room specifically for this facility
    socket.emit("join_public_room", { facilityId });

    const handleUpdate = () => {
      console.log("Public Queue Update Received, Refetching Data...");
      fetchTrackingStatus();
    };

    socket.on("public_queue_update", handleUpdate);

    return () => {
      socket.off("public_queue_update", handleUpdate);
      // Optional: leave public room, but simple disconnect is fine since it's an unauth page
      if (socket.connected) {
         socket.disconnect();
      }
    };
  }, [facilityId, tokenNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-800 border-t-2 border-blue-500 animate-spin"></div>
          <div className="h-4 bg-slate-800 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full text-center shadow-xl"
        >
          <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{error}</h2>
          <p className="text-slate-400 mb-6">Your token might have already been called or completed.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCcw className="w-5 h-5" /> Refresh
          </button>
        </motion.div>
      </div>
    );
  }

  const isCompleted = data.status === 'completed';
  const isNext = !isCompleted && data.peopleAhead === 0;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col p-4 md:p-8 font-sans items-center justify-center overflow-y-auto relative py-12">
      
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6 shadow-2xl relative z-10"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800/50">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Live Tracking</h1>
            <p className="text-sm text-slate-400">Department: <span className="text-slate-300 capitalize">{data.facilityType}</span></p>
          </div>
          {isRefreshing ? (
             <RefreshCcw className="w-5 h-5 text-slate-500 animate-spin" />
          ) : (
             <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
               <span className="text-xs font-medium text-green-400">Live</span>
             </div>
          )}
        </div>

        {/* Main Token Display */}
        <div className="flex flex-col items-center justify-center mb-8">
          <p className="text-slate-400 text-sm uppercase tracking-widest font-medium mb-3">Your Token</p>
          <motion.div 
            key={data.myTokenNumber}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-32 h-32 rounded-full flex items-center justify-center border-4 shadow-[0_0_40px_rgba(0,0,0,0.3)]
              ${isCompleted ? 'border-emerald-500 bg-emerald-500/10 shadow-emerald-500/20' : isNext ? 'border-green-500 bg-green-500/10 shadow-green-500/20' : 'border-blue-500 bg-blue-500/10 shadow-blue-500/20'}`}
          >
            <span className={`text-5xl font-black tracking-tighter ${isCompleted ? 'text-emerald-400' : isNext ? 'text-green-400' : 'text-blue-400'}`}>
              #{data.myTokenNumber}
            </span>
          </motion.div>
        </div>

        {/* Status Message */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={data.status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl mb-8 flex items-center gap-3 border ${
              isCompleted 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : isNext 
                  ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-sm">Consultation Completed!</p>
                  <p className="text-xs opacity-80 mt-0.5">Aapki visit complete ho gayi hai.</p>
                </div>
              </>
            ) : isNext ? (
              <>
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-sm">Please proceed to the doctor!</p>
                  <p className="text-xs opacity-80 mt-0.5">Your turn has arrived or you are next.</p>
                </div>
              </>
            ) : (
              <>
                <Activity className="w-6 h-6 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-sm">Please wait in the seating area.</p>
                  <p className="text-xs opacity-80 mt-0.5">We will notify you when it's your turn.</p>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Upload Prescription Button */}
        {isCompleted && (
          <div className="flex flex-col gap-3 mb-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowUploadModal(true)}
              className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 border border-emerald-500/30"
            >
              <Upload className="w-5 h-5 animate-bounce" />
              Upload Prescription/Bill
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowViewModal(true)}
              className="w-full py-4 px-6 bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 border border-slate-700"
            >
              <FileText className="w-5 h-5" />
              View Uploaded Documents
            </motion.button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-400">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium">People Ahead</span>
            </div>
            <p className="text-2xl font-bold text-white">{data.peopleAhead}</p>
          </div>
          
          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium">Wait Time</span>
            </div>
            <p className="text-2xl font-bold text-white">{data.estimatedWaitTime} <span className="text-sm font-normal text-slate-500">mins</span></p>
          </div>
        </div>

        {/* Current Serving Info */}
        <div className="mt-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 flex justify-between items-center">
          <span className="text-sm text-slate-400 font-medium">Currently Serving</span>
          <span className="text-lg font-bold text-slate-200">#{data.currentServingToken}</span>
        </div>

        {/* 🔐 SECURE PATIENT PORTAL SECTION */}
        <div className="mt-6 pt-6 border-t border-slate-800/50">
          {!uploadToken ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                  <Lock className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              
              <h3 className="text-lg font-bold tracking-tight text-white">
                🔒 Patient Medical Portal
              </h3>
              <p className="text-slate-400 text-xs leading-normal">
                Satyapit karein (Verify) apne registered mobile number ko, apne purane prescriptions, history aur records dekhne ke liye.
              </p>

              <form onSubmit={handleVerifyPhone} className="space-y-4">
                <div className="flex rounded-xl overflow-hidden bg-slate-950 border border-slate-850 focus-within:border-blue-500 transition-colors">
                  <span className="inline-flex items-center px-4 bg-slate-900 border-r border-slate-850 text-slate-400 font-bold text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(formatPhone(e.target.value))}
                    placeholder="Registered phone number"
                    className="flex-1 p-3.5 bg-transparent outline-none text-white placeholder-slate-650 font-semibold text-sm"
                  />
                </div>

                {verificationError && (
                  <p className="text-red-400 text-xs text-left font-semibold">{verificationError}</p>
                )}

                <button
                  type="submit"
                  disabled={phoneInput.replace(/\D/g, "").length !== 10}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.25)] flex items-center justify-center gap-2 text-sm"
                >
                  <Lock className="w-4 h-4" />
                  Verify & Unlock History
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header with Logout */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-800/50">
                <div>
                  <h3 className="text-base font-bold tracking-tight text-white">📋 Your Medical Records</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Verified: <span className="text-blue-400 font-bold">{maskedName}</span> • +91 {verifiedPhone?.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2")}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 text-slate-400 hover:text-red-450" />
                </button>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </button>
                <button
                  onClick={() => setShowViewModal(true)}
                  className="py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <FileText className="w-4 h-4" />
                  View Uploads
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800/50">
                {["timeline", "documents"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all capitalize ${
                      activeTab === tab
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab === "timeline" ? "🕐 Visit History" : "📁 Files Gallery"}
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="min-h-[200px] max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {loadingHistory ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="animate-pulse bg-slate-950/40 border border-slate-800/50 rounded-2xl p-4 space-y-2">
                        <div className="h-4 bg-slate-800 rounded w-2/3"></div>
                        <div className="h-3 bg-slate-800 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : activeTab === "timeline" ? (
                  <div className="space-y-3">
                    {historyData.length === 0 ? (
                      <div className="text-center py-8 bg-slate-950/20 rounded-2xl border border-slate-800/30">
                        <Calendar className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                        <p className="text-slate-500 text-xs">No past visits found at this facility.</p>
                      </div>
                    ) : (
                      historyData.map((visit, index) => (
                        <motion.div
                          key={visit._id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-slate-950/40 border border-slate-800/50 rounded-2xl p-4 space-y-3"
                        >
                          {/* Visit Header */}
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-slate-200">{formatDate(visit.visitDate)}</p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {visit.doctor?.name || "Consultation Completed"} {visit.doctor?.specialization ? `(${visit.doctor.specialization})` : ""}
                              </p>
                            </div>
                          </div>

                          {/* Diagnosis */}
                          {visit.diagnosis && (
                            <div className="pl-1 text-xs leading-normal">
                              <span className="text-slate-500 font-bold">Diagnosis: </span>
                              <span className="text-slate-300">{visit.diagnosis}</span>
                            </div>
                          )}

                          {/* Prescription Notes */}
                          {visit.prescriptionNotes && (
                            <div className="pl-1 text-xs leading-normal">
                              <span className="text-slate-500 font-bold">Rx/Notes: </span>
                              <span className="text-slate-300 block bg-slate-950/60 p-2 rounded-lg border border-slate-800/30 mt-1 whitespace-pre-wrap font-mono text-[11px]">{visit.prescriptionNotes}</span>
                            </div>
                          )}

                          {/* Vitals */}
                          {visit.vitals && (visit.vitals.bp || visit.vitals.temperature || visit.vitals.weight) && (
                            <div className="pl-1 flex flex-wrap gap-1.5 pt-1">
                              {visit.vitals.bp && (
                                <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-semibold rounded-full flex items-center gap-1">
                                  <Activity className="w-3 h-3" /> BP: {visit.vitals.bp}
                                </span>
                              )}
                              {visit.vitals.temperature && (
                                <span className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-semibold rounded-full flex items-center gap-1">
                                  Temp: {visit.vitals.temperature}°F
                                </span>
                              )}
                              {visit.vitals.weight && (
                                <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-semibold rounded-full flex items-center gap-1">
                                  Weight: {visit.vitals.weight}kg
                                </span>
                              )}
                            </div>
                          )}

                          {/* Attachments */}
                          {visit.documents?.length > 0 && (
                            <div className="pl-1 pt-2 border-t border-slate-800/50 space-y-1.5">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attachments</p>
                              <div className="flex flex-wrap gap-1.5">
                                {visit.documents.map((doc) => (
                                  <button
                                    key={doc._id}
                                    onClick={(e) => handleView(e, doc)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-850 rounded-lg text-[10px] font-semibold text-slate-300 transition-colors"
                                    title="View Attachment"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                                    <span className="truncate max-w-[120px]">{doc.fileName}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {historyData.flatMap((v) => v.documents || []).length === 0 ? (
                      <div className="col-span-2 text-center py-8 bg-slate-950/20 rounded-2xl border border-slate-800/30">
                        <FileText className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                        <p className="text-slate-500 text-xs">No files uploaded yet.</p>
                      </div>
                    ) : (
                      historyData.flatMap((visit) => 
                        (visit.documents || []).map((doc) => (
                          <div
                            key={doc._id}
                            onClick={(e) => handleView(e, doc)}
                            className="p-3 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/50 hover:border-blue-500/30 rounded-xl transition-all flex items-center justify-between overflow-hidden cursor-pointer group"
                          >
                            <div className="flex items-center gap-2 overflow-hidden mr-2">
                              <FileText className="w-4 h-4 text-blue-400 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
                              <div className="overflow-hidden">
                                <span className="text-[11px] font-bold text-slate-200 truncate block group-hover:text-blue-400 transition-colors">{doc.fileName}</span>
                                <span className="text-[9px] text-gray-500 block uppercase tracking-wide">{doc.uploadedBy === "patient" ? "Patient" : "Doctor"}</span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleDownloadOnly(e, doc.url, doc.fileName)}
                              className="bg-slate-950/50 hover:bg-slate-900 p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors flex-shrink-0"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </motion.div>

      {showUploadModal && (
        <UploadPrescriptionModal
          facilityId={facilityId}
          tokenNumber={tokenNumber}
          phone={verifiedPhone}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      {showViewModal && (
        <ViewPrescriptionsModal
          facilityId={facilityId}
          tokenNumber={tokenNumber}
          phone={verifiedPhone}
          onClose={() => setShowViewModal(false)}
          onView={(doc) => {
            setShowViewModal(false);
            setPreviewDoc(doc);
          }}
        />
      )}

      {/* Inline Preview Overlay */}
      {previewDoc && createPortal(
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[9999] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
          <div className="relative w-full max-w-2xl h-[80vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-800/50 bg-slate-950/50 flex-shrink-0">
              <div className="flex items-center gap-3 overflow-hidden">
                <button
                  onClick={() => {
                    setPreviewDoc(null);
                    setShowViewModal(true);
                  }}
                  className="p-2 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-xl transition-colors flex-shrink-0"
                  title="Back to Documents"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-bold text-white truncate">{previewDoc.fileName || 'Preview'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => handleDownloadOnly(e, previewDoc.url, previewDoc.fileName)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                  title="Download File"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 bg-slate-800 hover:bg-red-600/80 text-white rounded-xl transition-colors"
                  title="Close Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* Content */}
            <div className="flex-1 bg-slate-950 flex items-center justify-center overflow-auto p-4">
              {previewDoc.type?.includes('pdf') || previewDoc.url?.toLowerCase().endsWith('.pdf') ? (
                <iframe src={previewDoc.url} className="w-full h-full border-0 rounded-2xl bg-white" title="Document Preview" />
              ) : (
                <img src={previewDoc.url} alt="Preview" className="max-w-full max-h-full object-contain rounded-2xl" />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <p className="text-slate-500 text-xs mt-8 font-medium tracking-wide">POWERED BY QUEUEMD</p>
    </div>
  );
}
