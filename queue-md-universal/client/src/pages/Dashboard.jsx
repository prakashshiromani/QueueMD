import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../components/Layout";
import { useAuthStore } from "../store/authStore";
import { useFacilityStore } from "../store/facilityStore";
import { FACILITY_TYPES, formatTokenNumber } from "../utils/facilityTypeConfig";
import api, { fetchAnalyticsStatsApi, fetchQueueApi, nextPatientApi, markPatientCompletedApi, fetchCompletedCountApi, pausePatientApi, resumePatientApi } from "../services/api";
import { socket } from "../services/socket";
import toast from "react-hot-toast";
import AnimatePage from "../components/AnimatePage";
import { SkeletonQueue, SkeletonCard } from "../components/Skeletons";
import OnboardingWizard from "../components/OnboardingWizard";
import WaitTimeBadge from "../components/WaitTimeBadge";

export default function Dashboard() {
  const { user } = useAuthStore();
  const { facilityId, facilityType, setFacilityType, isDemoMode, toggleDemoMode } = useFacilityStore();
  

  const [queue, setQueue] = useState([]);
  const [pausedQueue, setPausedQueue] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [stats, setStats] = useState({ waiting: 0, avgWait: 0, completed: 0 });
  const [loading, setLoading] = useState(false);
  const [liveIndicator, setLiveIndicator] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  
  const queueRef = useRef([]);

  // ✅ Load initial data (memoized to fix useEffect exhaustive-deps warning)
  const loadData = useCallback(async () => {
    if (!facilityId) return;
    setLoading(true);
    try {
      // Pass current facilityType (from Demo Mode) to backend
      const [queueData, pausedData, statsData, completedCount, facilityRes] = await Promise.all([
        fetchQueueApi('waiting', facilityType),
        fetchQueueApi('paused', facilityType),
        fetchAnalyticsStatsApi(facilityType),
        fetchCompletedCountApi(facilityType),
        api.get('/facility/me')
      ]);
      
      setQueue(queueData || []);
      setPausedQueue(pausedData || []);
      queueRef.current = queueData || [];
      
      setStats({
        waiting: queueData?.length || 0,
        avgWait: statsData?.efficiency || statsData?.avgWaitTime || 7,
        aiPredictedWait: statsData?.aiPredictedWait || 10,
        confidence: statsData?.confidence || 'medium',
        completed: completedCount || 0
      });

      if (facilityRes.data && facilityRes.data.data && !facilityRes.data.data.onboardingCompleted) {
        setShowWizard(true);
      }

      // Find in-progress patient for this department
      const inProgress = await fetchQueueApi('in-progress', facilityType);
      setCurrentPatient(inProgress?.[0] || null);

    } catch (err) {
      toast.error("Failed to sync dashboard");
    } finally {
      setLoading(false);
    }
  }, [facilityId, facilityType]);

  // ✅ Socket Real-Time Sync
  useEffect(() => {
    if (!facilityId) return;
    loadData();

    socket.emit("join_facility", { facilityId, facilityType });
    setLiveIndicator(socket.connected);

    const handleQueueUpdate = (data) => {
      // Safety Check: ID & Type must match
      if (data.facilityId !== facilityId || data.facilityType !== facilityType) return;
      
      setLiveIndicator(true);

      // Sync stats (avgWait, aiPredictedWait, confidence) globally for all actions
      if (data.stats) {
        setStats(prev => ({ 
          ...prev, 
          avgWait: data.stats.avgWaitTime !== undefined ? data.stats.avgWaitTime : prev.avgWait,
          aiPredictedWait: data.stats.aiPredictedWait !== undefined ? data.stats.aiPredictedWait : prev.aiPredictedWait,
          confidence: data.stats.confidence || prev.confidence
        }));
      }

      if (data.action === "add") {
        setQueue(prev => {
          if (prev.some(p => p._id === data.patient._id)) return prev;
          let newQueue = [...prev, data.patient];
          if (data.stats && data.stats.predictions) {
            newQueue = newQueue.map(q => {
              const match = data.stats.predictions.find(p => p._id === q._id);
              return match ? { ...q, estimatedWaitTime: match.estimatedWaitTime } : q;
            });
          }
          return newQueue;
        });
      } else if (data.action === "paused") {
        setQueue(prev => {
          let newQueue = prev.filter(p => p._id !== data.patient._id);
          if (data.stats && data.stats.predictions) {
            newQueue = newQueue.map(q => {
              const match = data.stats.predictions.find(p => p._id === q._id);
              return match ? { ...q, estimatedWaitTime: match.estimatedWaitTime } : q;
            });
          }
          return newQueue;
        });
        setPausedQueue(prev => {
          if (prev.some(p => p._id === data.patient._id)) return prev;
          return [...prev, data.patient];
        });
      } else if (data.action === "resumed") {
        setPausedQueue(prev => prev.filter(p => p._id !== data.patient._id));
        setQueue(prev => {
          if (prev.some(p => p._id === data.patient._id)) return prev;
          let newQueue = [...prev, data.patient].sort((a,b) => a.tokenNumber - b.tokenNumber);
          if (data.stats && data.stats.predictions) {
            newQueue = newQueue.map(q => {
              const match = data.stats.predictions.find(p => p._id === q._id);
              return match ? { ...q, estimatedWaitTime: match.estimatedWaitTime } : q;
            });
          }
          return newQueue;
        });
      } else if (data.action === "next") {
        setCurrentPatient(data.patient);
        setQueue(prev => {
          let newQueue = prev.filter(p => p._id !== data.patient._id);
          // Apply new predictions from the backend
          if (data.stats && data.stats.predictions) {
            newQueue = newQueue.map(q => {
              const match = data.stats.predictions.find(p => p._id === q._id);
              return match ? { ...q, estimatedWaitTime: match.estimatedWaitTime } : q;
            });
          }
          return newQueue;
        });
      } else if (data.action === "completed") {
        setCurrentPatient(null);
        setQueue(prev => {
          let newQueue = prev.filter(p => p._id !== data.patient._id);
          if (data.stats && data.stats.predictions) {
            newQueue = newQueue.map(q => {
              const match = data.stats.predictions.find(p => p._id === q._id);
              return match ? { ...q, estimatedWaitTime: match.estimatedWaitTime } : q;
            });
          }
          return newQueue;
        });
        setStats(prev => ({ 
          ...prev, 
          completed: (prev.completed || 0) + 1
        }));
      }
    };

    const handleDisconnect = () => setLiveIndicator(false);
    const handleConnect = () => {
      setLiveIndicator(true);
      socket.emit("join_facility", { facilityId, facilityType });
    };

    socket.on("queue_update", handleQueueUpdate);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("queue_update", handleQueueUpdate);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect", handleConnect);
    };
  }, [facilityId, facilityType, loadData]);

  // ✅ Actions
  const handleCallNext = async () => {
    if (!queue.length) {
        return toast.error("Queue is empty!");
    }
    setLoading(true);
    try {
      // Pass current facilityType so backend calls next in the RIGHT department
      const res = await nextPatientApi(facilityType);
      toast.success(`Calling ${res.data.patientName}`);
    } catch (err) {
      console.error("Next patient error:", err);
      toast.error(err.response?.data?.message || "Error calling patient");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!currentPatient) return;
    setLoading(true);
    try {
      await markPatientCompletedApi(currentPatient._id);
      toast.success("Consultation Completed!");
    } catch (err) {
      console.error("Complete error:", err);
      toast.error(err.response?.data?.message || "Failed to complete session");
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (patientId) => {
    try {
      await pausePatientApi(patientId);
      toast.success("Patient put on hold");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to pause patient");
    }
  };

  const handleResume = async (patientId) => {
    try {
      await resumePatientApi(patientId);
      toast.success("Patient resumed to queue");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resume patient");
    }
  };

  const handleFacilityChange = (type) => {
    setFacilityType(type);
    setQueue([]);
    setCurrentPatient(null);
    toast(`Switched to ${type.toUpperCase()} mode`, { icon: '🏢' });
  };

  const [elapsed, setElapsed] = useState(0);

  // ✅ Live Timer for Serving Patient
  useEffect(() => {
    if (!currentPatient) {
      setElapsed(0);
      return;
    }

    const calculate = () => {
      const startTime = new Date(currentPatient.calledAt || Date.now()).getTime();
      const now = Date.now();
      const diffMins = Math.floor((now - startTime) / 60000);
      
      // Guard against stale active timers from previous calendar days or anomaly (>12h)
      const startDay = new Date(startTime).toDateString();
      const today = new Date(now).toDateString();
      if (startDay !== today || diffMins > 720) {
        setElapsed(-1);
      } else {
        setElapsed(diffMins);
      }
    };

    calculate();
    const timer = setInterval(calculate, 10000); // Update every 10s for accuracy without heavy load
    return () => clearInterval(timer);
  }, [currentPatient]);

  const config = FACILITY_TYPES[facilityType] || FACILITY_TYPES.clinic;
  const getInitials = (name) => name?.charAt(0).toUpperCase() || "P";
  const formatWaitTime = (mins) => {
    if (mins === -1) return "-- min";
    return `${mins || 0} min`;
  };

  return (
    <Layout>
      {showWizard && <OnboardingWizard onComplete={() => setShowWizard(false)} />}
      <AnimatePage className="p-6 space-y-6 max-w-5xl mx-auto pb-32">
        
        {/* 🔥 DEMO MODE TOGGLE & FACILITY SELECTOR */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-bg-secondary/50 backdrop-blur-md p-4 rounded-2xl border border-border-muted/50 dark:border-white/5 shadow-sm">
          {/* Left section: UI Preview Title & Facility List */}
          <div className="flex items-center gap-4 flex-1 min-w-0 w-full lg:w-auto">
            <span className="text-[11px] font-black text-text-secondary uppercase tracking-widest whitespace-nowrap">UI Preview:</span>
            {/* The scrollable list with right padding to prevent crowding */}
            <div className="flex flex-nowrap overflow-x-auto scrollbar-hide gap-2 pb-1 w-full pr-6">
              {Object.entries(FACILITY_TYPES).map(([type, config]) => (
                <button
                  key={type}
                  onClick={() => setFacilityType(type)}
                  disabled={!isDemoMode}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all duration-200 border shrink-0 ${
                    facilityType === type && isDemoMode
                      ? "text-white shadow-lg border-transparent scale-[1.03]"
                      : isDemoMode
                      ? "bg-bg-primary/50 dark:bg-white/5 border-border-muted/30 dark:border-white/5 text-text-secondary hover:text-text-primary hover:bg-bg-primary/80 dark:hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-bg-primary/20 dark:bg-white/2 border-border-muted/10 dark:border-white/2 text-text-secondary/30 cursor-not-allowed"
                  }`}
                  style={facilityType === type && isDemoMode ? {
                    backgroundColor: config.theme.primary,
                    boxShadow: `0 4px 16px ${config.theme.primary}45`
                  } : {}}
                >
                  <span className="text-xs shrink-0">{config.icon}</span>
                  {config.label}
                </button>
              ))}
              {/* Trailing spacer to guarantee that the last button is never clipped or touching the divider line */}
              <div className="w-4 shrink-0" />
            </div>
          </div>

          {/* Desktop divider to separate preview items from mode toggler */}
          <div className="hidden lg:block w-px h-8 bg-border-muted/30 dark:bg-white/10 shrink-0" />

          {/* Toggle Switch */}
          <div className="flex items-center gap-4 shrink-0 bg-bg-primary/50 p-2.5 px-4 rounded-xl border border-border-muted/30 dark:border-white/5 w-full lg:w-auto justify-between lg:justify-start">
            <div className="text-right">
              <div className={`text-[10px] font-black tracking-widest uppercase ${isDemoMode ? "text-orange-400" : "text-text-secondary"}`}>
                {isDemoMode ? "🧪 Demo Mode" : "🔒 Secure Mode"}
              </div>
              <div className="text-[9px] font-medium text-text-secondary/50 uppercase">Isolation active</div>
            </div>
            <button
              onClick={toggleDemoMode}
              className={`w-12 h-6 rounded-full transition-all relative ${isDemoMode ? "bg-orange-500" : "bg-border-muted/50"}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${isDemoMode ? "left-7" : "left-1"}`} />
            </button>
          </div>
        </div>

        {/* Warning Banner (Only in Demo Mode) */}
        {isDemoMode && (
          <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20 text-orange-400 text-[12px] font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="material-symbols-outlined text-[20px] animate-pulse">warning</span>
            <div className="uppercase tracking-wider">
              Simulation Mode Active: UI forms & themes change instantly. Backend hamesha tumhare logged-in facility isolation follow karega.
            </div>
          </div>
        )}
        
        {/* 🏥 Facility Mode Badge (Read-Only) */}
        <div className="flex items-center gap-3 bg-bg-secondary p-3 rounded-2xl border border-border-muted/50 dark:border-white/5 w-fit">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center border"
            style={{ 
              backgroundColor: `${config.theme.primary}10`, 
              color: config.theme.primary, 
              borderColor: `${config.theme.primary}30` 
            }}
          >
            <span className="material-symbols-outlined text-xl">{config.icon}</span>
          </div>
          <div className="pr-2">
            <div className="font-black text-text-primary uppercase tracking-widest text-sm">{config.label} Dashboard</div>
            <div className="text-text-secondary text-[10px] font-black uppercase tracking-[0.2em]">Active Mode</div>
          </div>
        </div>

        {/* 📊 Premium Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading && stats.waiting === 0 && stats.completed === 0 ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
          {/* Waiting Patients */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="relative overflow-hidden bg-bg-secondary rounded-2xl border border-border-muted/50 dark:border-white/5 p-5 hover:border-blue-500/30 transition-all group shadow-sm"
          >
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" style={{ backgroundColor: config.theme.primary }} />
            <div className="relative flex items-center justify-between">
              <div>
                <div className="text-[11px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1">Waiting Patients</div>
                <div className="text-[32px] font-black text-text-primary">{queue.length}</div>
                <div className="text-[10px] mt-2 font-black inline-flex px-2.5 py-1 rounded-full uppercase tracking-widest" style={{ color: config.theme.primary, backgroundColor: `${config.theme.primary}15` }}>
                  Active Queue
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${config.theme.primary}15` }}>
                <span className="material-symbols-outlined text-2xl" style={{ color: config.theme.primary }}>groups</span>
              </div>
            </div>
          </motion.div>

          {/* Avg Wait Time */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="relative overflow-hidden bg-bg-secondary rounded-2xl border border-border-muted/50 dark:border-white/5 p-5 hover:border-orange-500/30 transition-all group shadow-sm"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
            <div className="relative flex items-center justify-between">
              <div>
                <div className="text-[11px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1">Avg Wait Time</div>
                <div className="text-[32px] font-black text-text-primary">{stats.avgWait} <span className="text-lg font-bold">min</span></div>
                <div className="flex flex-col items-start gap-1">
                  <div className="text-[10px] mt-2 font-black text-orange-500 bg-orange-500/10 inline-flex px-2.5 py-1 rounded-full uppercase tracking-widest">
                    Live Prediction
                  </div>
                  <WaitTimeBadge facilityType={facilityType} />
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-orange-500">schedule</span>
              </div>
            </div>
          </motion.div>

          {/* Completed Today */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="relative overflow-hidden bg-bg-secondary rounded-2xl border border-border-muted/50 dark:border-white/5 p-5 hover:border-green-500/30 transition-all group shadow-sm"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
            <div className="relative flex items-center justify-between">
              <div>
                <div className="text-[11px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1">Completed Today</div>
                <div className="text-[32px] font-black text-text-primary">{stats.completed}</div>
                <div className="text-[10px] mt-2 font-black text-green-500 bg-green-500/10 inline-flex px-2.5 py-1 rounded-full uppercase tracking-widest">
                  Verified Goals
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-green-500">task_alt</span>
              </div>
            </div>
          </motion.div>
          </>
          )}
        </div>

        {/* 🔄 Main Queue Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Currently Serving */}
          <div className="lg:col-span-1 bg-bg-secondary rounded-2xl border border-border-muted/50 dark:border-white/5 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border-muted/50 dark:border-white/5 flex items-center justify-between bg-surface-variant/30">
              <h2 className="text-[14px] font-black text-text-primary uppercase tracking-[0.15em] flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-500">person_pin</span>
                Currently Serving
              </h2>
              {liveIndicator && (
                <span className="flex items-center gap-1.5 text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-1 rounded-full uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Live Sync
                </span>
              )}
            </div>
            
            <div className="p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
              {currentPatient ? (
                <>
                  <div 
                    className="w-20 h-20 rounded-2xl flex items-center justify-center font-black text-3xl mb-4 ring-4 transition-all"
                    style={{ 
                        backgroundColor: `${config.theme.primary}15`,
                        color: config.theme.primary,
                        ringColor: `${config.theme.primary}20`
                    }}
                  >
                    {getInitials(currentPatient.patientName)}
                  </div>
                  <div className="text-[32px] font-black text-text-primary mb-1 tracking-tight">Token #{formatTokenNumber(currentPatient.tokenNumber, currentPatient.facilityType || facilityType)}</div>
                  <div className="text-[18px] font-bold text-text-secondary mb-6">{currentPatient.patientName}</div>
                  
                  <div className="w-full bg-bg-primary rounded-2xl p-5 mb-8 border border-border-muted/50 dark:border-white/5 shadow-inner">
                    <div className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-2">Duration In Progress</div>
                    <div className="text-[28px] font-black text-orange-500 tabular-nums">
                      {formatWaitTime(elapsed)}
                    </div>
                  </div>

                  <div className="flex gap-3 w-full">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleComplete}
                      disabled={loading}
                      className="w-full h-[54px] rounded-xl text-white font-black text-[14px] uppercase tracking-widest shadow-lg active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{ 
                        backgroundColor: config.theme.primary,
                        boxShadow: `0 4px 14px ${config.theme.primary}40`
                      }}
                    >
                      <span className="material-symbols-outlined text-xl">verified</span>
                      Complete
                    </motion.button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-bg-primary border-2 border-dashed border-border-muted/50 flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-3xl text-text-secondary/30">clinical_notes</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-text-primary font-black uppercase tracking-widest">Doctor is Available</p>
                    <p className="text-text-secondary/60 text-xs font-medium uppercase tracking-widest max-w-[200px] mx-auto">Click "Call Next" to bring in a patient</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Waiting Queue */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-bg-secondary rounded-2xl border border-border-muted/50 dark:border-white/5 overflow-hidden flex flex-col shadow-sm">
            <div className="p-5 border-b border-border-muted/50 dark:border-white/5 flex items-center justify-between bg-surface-variant/30">
              <h2 className="text-[14px] font-black text-text-primary uppercase tracking-[0.15em] flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ color: config.theme.primary }}>queue</span>
                Waiting Queue
              </h2>
              <span className="text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-widest" style={{ backgroundColor: `${config.theme.primary}15`, color: config.theme.primary }}>
                {queue.length} Patients Waiting
              </span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[450px] p-4 space-y-3 custom-scrollbar">
              {loading && queue.length === 0 ? (
                <SkeletonQueue />
              ) : (
                <>
                {pausedQueue.length > 0 && (
                  <div className="bg-bg-secondary rounded-2xl border border-amber-500/20 shadow-sm overflow-hidden mb-4">
                    <div className="p-4 border-b border-amber-500/10 flex justify-between items-center bg-amber-500/5">
                      <h3 className="font-bold text-amber-500 flex items-center gap-2 text-sm uppercase tracking-widest">
                        <span className="material-symbols-outlined">pause_circle</span>
                        On Hold
                      </h3>
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 rounded-full text-xs font-black">{pausedQueue.length}</span>
                    </div>
                    <div className="px-4 pb-4 space-y-2 mt-4">
                      {pausedQueue.map(p => (
                        <div key={p._id} className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition-all shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-fit px-2 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-xs font-black text-amber-500">
                              #{formatTokenNumber(p.tokenNumber, p.facilityType || facilityType)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-text-primary">{p.patientName}</div>
                              <div className="text-[10px] text-text-secondary">On hold since {new Date(p.pausedAt || Date.now()).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleResume(p._id)}
                            className="px-3 py-1.5 bg-green-500/10 text-green-500 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-green-500/20 transition-all flex items-center gap-1 border border-green-500/20"
                          >
                            <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                            Resume
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {queue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center opacity-40">
                    <span className="material-symbols-outlined text-5xl mb-3">inventory_2</span>
                    <p className="text-text-primary font-black uppercase tracking-widest">Queue is Empty</p>
                    <p className="text-text-secondary text-xs mt-1 uppercase tracking-widest font-medium">No pending consultations</p>
                  </div>
                ) : (
                  queue.map((patient, idx) => (
                    <div key={patient._id} 
                         className="group flex items-center justify-between p-4 rounded-xl border border-border-muted/30 dark:border-white/5 bg-bg-primary transition-all border-l-4 border-l-transparent shadow-sm"
                         style={{ '--hover-color': config.theme.primary }}
                         onMouseEnter={(e) => {
                           e.currentTarget.style.borderColor = `${config.theme.primary}50`;
                           e.currentTarget.style.borderLeftColor = config.theme.primary;
                         }}
                         onMouseLeave={(e) => {
                           e.currentTarget.style.borderColor = '';
                           e.currentTarget.style.borderLeftColor = '';
                         }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-fit px-3.5 h-12 rounded-xl flex items-center justify-center font-black text-sm border group-hover:scale-105 transition-transform"
                             style={{ 
                               backgroundColor: `${config.theme.primary}10`, 
                               color: config.theme.primary, 
                               borderColor: `${config.theme.primary}25` 
                             }}>
                          #{formatTokenNumber(patient.tokenNumber, patient.facilityType || facilityType)}
                        </div>
                        <div>
                          <div className="text-[14px] font-black text-text-primary">{patient.patientName}</div>
                          <div className="text-[11px] text-text-secondary font-medium flex items-center gap-2 uppercase tracking-wider">
                            <span className="whitespace-nowrap">{patient.phone || "N/A"}</span>
                            <span className="w-1 h-1 rounded-full bg-text-secondary/40"></span>
                            <span style={{ color: config.theme.primary }}>Est. {(patient.estimatedWaitTime !== undefined && patient.estimatedWaitTime !== null && patient.estimatedWaitTime > 0) ? patient.estimatedWaitTime : Math.max(5, (idx + 1) * stats.avgWait)} min</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handlePause(patient._id)}
                          className="text-amber-400 hover:text-amber-300 p-1 transition-colors hover:bg-amber-500/10 rounded"
                          title="Put on Hold"
                        >
                          <span className="material-symbols-outlined text-[18px]">pause</span>
                        </button>
                        <span className="px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase bg-surface-variant/50 text-text-secondary border border-border-muted/30 dark:border-white/5">
                          WAITING
                        </span>
                      </div>
                    </div>
                  ))
                )}
                </>
              )}
            </div>

            {/* Call Next Floating Action */}
            <div className="p-5 border-t border-border-muted/50 dark:border-white/5 bg-surface-variant/20">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCallNext}
                disabled={queue.length === 0 || loading}
                className="w-full h-[56px] rounded-xl text-white font-black text-[15px] uppercase tracking-[0.1em] shadow-xl active:scale-[0.98] transition flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ 
                    backgroundColor: config.theme.primary,
                    boxShadow: `0 4px 14px ${config.theme.primary}40`
                }}
              >
                <span className="material-symbols-outlined text-xl animate-pulse">campaign</span>
                {facilityType === 'dental' ? '🦷 Call Next Dental Patient' :
                 facilityType === 'pathlab' ? '🔬 Call Next Sample' :
                 facilityType === 'physio' ? '🧘 Call Next Session' : 
                 `🏥 Call Next: ${queue[0]?.patientName || "Queue Empty"}`}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

        {/* 🏷 Facility Status Footer */}
        <div className="flex items-center justify-between p-5 bg-bg-secondary rounded-2xl border border-border-muted/50 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-4">
            <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center border"
                style={{ backgroundColor: `${config.theme.primary}10`, color: config.theme.primary, borderColor: `${config.theme.primary}30` }}
            >
              <span className="material-symbols-outlined text-xl">{config.icon}</span>
            </div>
            <div>
              <div className="font-black text-text-primary tracking-tight">Main Chamber — 01</div>
              <div className="text-text-secondary text-[10px] font-black uppercase tracking-[0.2em]">{config.label} Active</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase border ${liveIndicator ? 'bg-green-500/5 text-green-500 border-green-500/20' : 'bg-red-500/5 text-red-500 border-red-500/20'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${liveIndicator ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                {liveIndicator ? "Real-time Online" : "Connection Lost"}
             </div>
          </div>
        </div>
      </AnimatePage>

    </Layout>
  );
}
