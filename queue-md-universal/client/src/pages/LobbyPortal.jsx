import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { socket } from '../services/socket';
import toast from 'react-hot-toast';
import { Upload, Lock, FileText, LogOut, Calendar, Activity, RefreshCcw, Download } from 'lucide-react';
import UploadPrescriptionModal from '../components/UploadPrescriptionModal';
import ViewPrescriptionsModal from '../components/ViewPrescriptionsModal';
import { createPortal } from 'react-dom';
import { formatTokenNumber } from '../utils/facilityTypeConfig';

const patientApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

const LobbyPortal = () => {
    const { facilityId } = useParams();
    
    // ─── Constants ───
    const SESSION_KEYS = {
        LOBBY_PHONE: "queuemd_lobby_phone_" + facilityId,
        LOBBY_TOKEN: "queuemd_lobby_token_" + facilityId,
        TOKEN: "queuemd_patient_token_" + facilityId,
        NAME: "queuemd_patient_name_" + facilityId,
    };

    const [step, setStep] = useState('VERIFY'); // VERIFY | LIVE
    const [phone, setPhone] = useState('');
    const [token, setToken] = useState('');
    const [liveData, setLiveData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);

    // ─── NEW: Patient Portal State & Helpers ───
    const [uploadToken, setUploadToken] = useState('');
    const [maskedName, setMaskedName] = useState('');
    const [historyData, setHistoryData] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [activeTab, setActiveTab] = useState('timeline'); // timeline | documents
    const [previewDoc, setPreviewDoc] = useState(null);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const fetchPatientHistory = async (tokenVal) => {
        setLoadingHistory(true);
        try {
            const res = await patientApi.get('/patient/history', {
                headers: {
                    'Authorization': `Bearer ${tokenVal}`
                }
            });
            if (res.data.success) {
                setHistoryData(res.data.data.visits || []);
            }
        } catch (err) {
            console.error("Failed to fetch medical history", err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                handleLogout();
                toast.error("Session expired. Please verify again.");
            }
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleLogout = () => {
        setUploadToken('');
        setMaskedName('');
        setHistoryData([]);
        setLiveData(null);
        setStep('VERIFY');
        setPhone('');
        setToken('');
        sessionStorage.removeItem(SESSION_KEYS.LOBBY_PHONE);
        sessionStorage.removeItem(SESSION_KEYS.LOBBY_TOKEN);
        sessionStorage.removeItem(SESSION_KEYS.TOKEN);
        sessionStorage.removeItem(SESSION_KEYS.NAME);
        toast.success("Logged out successfully");
    };

    // Format phone number dynamically to 5-space-5 format (pasting with +91 or 0 will auto-slice last 10 digits)
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

    // 1. Verify & Fetch Initial Data
    const handleVerify = async () => {
        if (!phone || !token) {
            return toast.error("Please enter both Phone and Token Number");
        }
        setLoading(true);
        try {
            const formattedPhone = `+91 ${phone.replace(/\s/g, '')}`;
            const res = await patientApi.post(`/lobby/${facilityId}/status`, { phone: formattedPhone, tokenNumber: Number(token) });
            setLiveData(res.data.data);
            setStep('LIVE');
            
            // Save lobby credentials to sessionStorage
            sessionStorage.setItem(SESSION_KEYS.LOBBY_PHONE, phone);
            sessionStorage.setItem(SESSION_KEYS.LOBBY_TOKEN, token);
            
            toast.success("Verified successfully!");

            // Chained Patient Verification to get clinical history uploadToken
            try {
                const verifyRes = await patientApi.post(`/public/lobby/${facilityId}/verify`, {
                    phone: formattedPhone,
                    tokenNumber: Number(token)
                });
                if (verifyRes.data.success) {
                    const { uploadToken: uT, patientNameMasked: pM } = verifyRes.data.data;
                    setUploadToken(uT);
                    setMaskedName(pM);
                    sessionStorage.setItem(SESSION_KEYS.TOKEN, uT);
                    sessionStorage.setItem(SESSION_KEYS.NAME, pM);
                    await fetchPatientHistory(uT);
                }
            } catch (err) {
                console.error("Patient portal auto-verification failed", err);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid Token or Phone, or no active visit today.");
        } finally {
            setLoading(false);
        }
    };

    // 1b. Manual unlock button handler
    const handleUnlockHistory = async () => {
        setLoadingHistory(true);
        try {
            const formattedPhone = `+91 ${phone.replace(/\s/g, '')}`;
            const verifyRes = await patientApi.post(`/public/lobby/${facilityId}/verify`, {
                phone: formattedPhone,
                tokenNumber: Number(token)
            });
            if (verifyRes.data.success) {
                const { uploadToken: uT, patientNameMasked: pM } = verifyRes.data.data;
                setUploadToken(uT);
                setMaskedName(pM);
                sessionStorage.setItem(SESSION_KEYS.TOKEN, uT);
                sessionStorage.setItem(SESSION_KEYS.NAME, pM);
                await fetchPatientHistory(uT);
                toast.success("Medical records unlocked!");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to unlock medical records.");
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleView = (e, doc) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("🔍 handleView clicked in LobbyPortal. Document data:", doc);
        setPreviewDoc(doc);
    };


    // Auto-restore Session on Mount
    useEffect(() => {
        const storedPhone = sessionStorage.getItem(SESSION_KEYS.LOBBY_PHONE);
        const storedToken = sessionStorage.getItem(SESSION_KEYS.LOBBY_TOKEN);
        if (storedPhone && storedToken) {
            setPhone(storedPhone);
            setToken(storedToken);
            const autoRestore = async () => {
                setLoading(true);
                try {
                    const formattedPhone = `+91 ${storedPhone.replace(/\s/g, '')}`;
                    const res = await patientApi.post(`/lobby/${facilityId}/status`, { phone: formattedPhone, tokenNumber: Number(storedToken) });
                    setLiveData(res.data.data);
                    setStep('LIVE');

                    // Chained Patient Verification to get clinical history uploadToken
                    const storedUploadToken = sessionStorage.getItem(SESSION_KEYS.TOKEN);
                    const storedMaskedName = sessionStorage.getItem(SESSION_KEYS.NAME);
                    if (storedUploadToken && storedMaskedName) {
                        setUploadToken(storedUploadToken);
                        setMaskedName(storedMaskedName);
                        await fetchPatientHistory(storedUploadToken);
                    } else {
                        const verifyRes = await patientApi.post(`/public/lobby/${facilityId}/verify`, {
                            phone: formattedPhone,
                            tokenNumber: Number(storedToken)
                        });
                        if (verifyRes.data.success) {
                            const { uploadToken: uT, patientNameMasked: pM } = verifyRes.data.data;
                            setUploadToken(uT);
                            setMaskedName(pM);
                            sessionStorage.setItem(SESSION_KEYS.TOKEN, uT);
                            sessionStorage.setItem(SESSION_KEYS.NAME, pM);
                            await fetchPatientHistory(uT);
                        }
                    }
                } catch (err) {
                    console.error("Auto restore session failed", err);
                    sessionStorage.removeItem(SESSION_KEYS.LOBBY_PHONE);
                    sessionStorage.removeItem(SESSION_KEYS.LOBBY_TOKEN);
                    sessionStorage.removeItem(SESSION_KEYS.TOKEN);
                    sessionStorage.removeItem(SESSION_KEYS.NAME);
                } finally {
                    setLoading(false);
                }
            };
            autoRestore();
        }
    }, [facilityId]);

    // 2. Real-Time Socket Updates
    useEffect(() => {
        if (step === 'LIVE') {
            socket.emit('join_public_room', { facilityId }); 
            
            const handleUpdate = async () => {
                try {
                    const formattedPhone = `+91 ${phone.replace(/\s/g, '')}`;
                    const res = await patientApi.post(`/lobby/${facilityId}/status`, { phone: formattedPhone, tokenNumber: token });
                    setLiveData(res.data.data);
                } catch (err) {
                    console.error("Auto-refresh failed", err);
                }
            };

            socket.on('public_queue_update', handleUpdate);

            return () => {
                socket.off('public_queue_update', handleUpdate);
            };
        }
    }, [step, facilityId, phone, token]);

    return (
        <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center overflow-y-auto relative py-12 p-4 font-sans selection:bg-blue-500/30">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-white relative overflow-hidden"
            >
                {/* Glass reflections */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>

                {step === 'VERIFY' ? (
                    <div className="space-y-6 text-center relative z-10">
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-widest text-blue-400">QueueMD Lobby</h1>
                            <p className="text-gray-400 text-sm mt-1">Enter details to see your live position</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex rounded-xl overflow-hidden bg-black/20 border border-white/10 focus-within:border-blue-500 transition-colors">
                                <span className="inline-flex items-center px-4 bg-white/5 border-r border-white/10 text-gray-400 font-bold text-sm">
                                    +91
                                </span>
                                <input 
                                    type="tel" 
                                    placeholder="Registered Phone (10 digits)" 
                                    value={phone} 
                                    onChange={e => handlePhoneChange(e.target.value)} 
                                    className="flex-1 p-4 bg-transparent outline-none text-white placeholder-gray-500" 
                                />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Token Number (e.g. 45)" 
                                value={token} 
                                onChange={e => setToken(e.target.value.replace(/[^0-9]/g, ''))} 
                                className="w-full p-4 bg-black/20 border border-white/10 rounded-xl outline-none focus:border-blue-500 transition-colors text-white placeholder-gray-500" 
                            />
                        </div>
                        
                        <button 
                            onClick={handleVerify} 
                            disabled={loading}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Check Live Status'}
                        </button>
                    </div>
                ) : liveData ? (
                    <div className="space-y-8 text-center relative z-10">
                        <div>
                            <p className="text-gray-400 uppercase tracking-widest text-xs font-bold mb-1">Currently Serving</p>
                            <h2 className="text-5xl font-black text-emerald-400 tracking-tighter">
                                {liveData.currentlyServing !== "None" ? `#${formatTokenNumber(liveData.currentlyServing, liveData.facilityType)}` : liveData.currentlyServing}
                            </h2>
                        </div>
                        
                        <div className="border-t border-b border-white/10 py-8 relative">
                            <div className="absolute inset-0 bg-white/[0.02]"></div>
                            <div className="relative">
                                <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Your Token</p>
                                <h1 className="text-7xl font-black text-white my-3 tracking-tighter">#{formatTokenNumber(liveData.myToken, liveData.facilityType)}</h1>
                                
                                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-widest ${
                                    ['in-progress', 'in-room', 'completed'].includes(liveData.myStatus) 
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                }`}>
                                    {liveData.myStatus === 'completed' ? (
                                        <>
                                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                            Completed
                                        </>
                                    ) : ['in-progress', 'in-room'].includes(liveData.myStatus) ? (
                                        <>
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                            Please Enter Cabin
                                        </>
                                    ) : (
                                        <>
                                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                            Waiting
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {liveData.myStatus === 'completed' && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowUploadModal(true)}
                                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 border border-emerald-500/30 font-sans"
                            >
                                <Upload className="w-5 h-5 animate-bounce" />
                                Upload Prescription/Bill
                            </motion.button>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-center">
                                <p className="text-4xl font-black text-blue-400 mb-1">{liveData.peopleAhead}</p>
                                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-tight">People<br/>Ahead</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-center">
                                <p className="text-4xl font-black text-purple-400 mb-1">~{liveData.estimatedWait}</p>
                                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-tight">Est. Wait<br/>(Mins)</p>
                            </div>
                        </div>

                        {/* 🔐 SECURE PATIENT PORTAL SECTION */}
                        <div className="mt-6 pt-6 border-t border-white/10">
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
                                    <p className="text-gray-400 text-xs leading-normal">
                                        Unlock your past prescriptions, medical history, and documents for this facility.
                                    </p>

                                    <button
                                        onClick={handleUnlockHistory}
                                        disabled={loadingHistory}
                                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.25)] flex items-center justify-center gap-2 text-sm"
                                    >
                                        <Lock className="w-4 h-4" />
                                        {loadingHistory ? 'Unlocking...' : 'Unlock Medical History'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6 text-left">
                                    {/* Header with Logout */}
                                    <div className="flex justify-between items-center pb-4 border-b border-white/10">
                                        <div>
                                            <h3 className="text-base font-bold tracking-tight text-white">📋 Medical Records</h3>
                                            <p className="text-[11px] text-gray-400 mt-0.5">
                                                Patient: <span className="text-blue-400 font-bold">{maskedName}</span> • +91 {phone?.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2")}
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                                            title="Logout"
                                        >
                                            <LogOut className="w-4 h-4 text-gray-400 hover:text-red-400" />
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
                                    <div className="flex gap-2 p-1 bg-black/20 rounded-xl border border-white/10">
                                        {["timeline", "documents"].map((tab) => (
                                            <button
                                                key={tab}
                                                onClick={() => setActiveTab(tab)}
                                                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all capitalize ${
                                                    activeTab === tab
                                                        ? "bg-blue-600 text-white shadow-lg"
                                                        : "text-gray-400 hover:text-white"
                                                }`}
                                            >
                                                {tab === "timeline" ? "🕐 Visit History" : "📁 Files Gallery"}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Content Area */}
                                    <div className="min-h-[200px] max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                        {loadingHistory ? (
                                            <div className="space-y-3">
                                                {[1, 2].map((i) => (
                                                    <div key={i} className="animate-pulse bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                                                        <div className="h-4 bg-white/10 rounded w-2/3"></div>
                                                        <div className="h-3 bg-white/10 rounded w-1/2"></div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : activeTab === "timeline" ? (
                                            <div className="space-y-3">
                                                {historyData.length === 0 ? (
                                                    <div className="text-center py-8 bg-white/5 rounded-2xl border border-white/10">
                                                        <Calendar className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                                                        <p className="text-gray-400 text-xs">No past visits found at this facility.</p>
                                                    </div>
                                                ) : (
                                                    historyData.map((visit, index) => (
                                                        <motion.div
                                                            key={visit._id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: index * 0.05 }}
                                                            className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3"
                                                        >
                                                            {/* Visit Header */}
                                                            <div className="flex items-start gap-3">
                                                                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                                                                    <Calendar className="w-4 h-4" />
                                                                </div>
                                                                <div className="overflow-hidden">
                                                                    <p className="text-xs font-bold text-gray-200">{formatDate(visit.visitDate)}</p>
                                                                    <p className="text-[10px] text-gray-400 truncate">
                                                                        {visit.doctor?.name || "Consultation Completed"} {visit.doctor?.specialization ? `(${visit.doctor.specialization})` : ""}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Diagnosis */}
                                                            {visit.diagnosis && (
                                                                <div className="pl-1 text-xs leading-normal">
                                                                    <span className="text-gray-500 font-bold">Diagnosis: </span>
                                                                    <span className="text-gray-300">{visit.diagnosis}</span>
                                                                </div>
                                                            )}

                                                            {/* Prescription Notes */}
                                                            {visit.prescriptionNotes && (
                                                                <div className="pl-1 text-xs leading-normal">
                                                                    <span className="text-gray-500 font-bold">Rx/Notes: </span>
                                                                    <span className="text-gray-300 block bg-black/20 p-2 rounded-lg border border-white/10 mt-1 whitespace-pre-wrap font-mono text-[11px]">{visit.prescriptionNotes}</span>
                                                                </div>
                                                            )}

                                                            {/* Vitals */}
                                                            {visit.vitals && (visit.vitals.bp || visit.vitals.temperature || visit.vitals.weight) && (
                                                                <div className="pl-1 flex flex-wrap gap-1.5 pt-1">
                                                                    {visit.vitals.bp && (
                                                                        <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-semibold rounded-full flex items-center gap-1">
                                                                            <Activity className="w-3.5 h-3.5" /> BP: {visit.vitals.bp}
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
                                                                <div className="pl-1 pt-2 border-t border-white/10 space-y-1.5">
                                                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Attachments</p>
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {visit.documents.map((doc) => (
                                                                            <button
                                                                                key={doc._id}
                                                                                onClick={(e) => handleView(e, doc)}
                                                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-semibold text-gray-300 transition-colors"
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
                                                    <div className="col-span-2 text-center py-8 bg-white/5 rounded-2xl border border-white/10">
                                                        <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                                                        <p className="text-gray-400 text-xs">No files uploaded yet.</p>
                                                    </div>
                                                ) : (
                                                    historyData.flatMap((visit) => 
                                                        (visit.documents || []).map((doc) => (
                                                            <div
                                                                key={doc._id}
                                                                onClick={(e) => handleView(e, doc)}
                                                                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 rounded-xl transition-all flex items-center justify-between overflow-hidden cursor-pointer group"
                                                            >
                                                                <div className="flex items-center gap-2 overflow-hidden mr-2">
                                                                    <FileText className="w-4 h-4 text-blue-400 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
                                                                    <div className="overflow-hidden">
                                                                        <span className="text-[11px] font-bold text-gray-200 truncate block group-hover:text-blue-400 transition-colors">{doc.fileName}</span>
                                                                        <span className="text-[9px] text-gray-500 block uppercase tracking-wide">{doc.uploadedBy === "patient" ? "Patient" : "Doctor"}</span>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => handleDownloadOnly(e, doc.url, doc.fileName)}
                                                                    className="bg-white/5 hover:bg-white/10 p-1.5 rounded-lg text-gray-400 hover:text-white transition-colors flex-shrink-0"
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
                    </div>
                ) : null}
            </motion.div>

            {showUploadModal && (
                <UploadPrescriptionModal
                    facilityId={facilityId}
                    tokenNumber={liveData?.myToken || token}
                    phone={phone}
                    onClose={() => setShowUploadModal(false)}
                    facilityType={liveData?.facilityType}
                />
            )}

            {showViewModal && (
                <ViewPrescriptionsModal
                    facilityId={facilityId}
                    tokenNumber={liveData?.myToken || token}
                    phone={phone}
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
        </div>
    );
};

export default LobbyPortal;
