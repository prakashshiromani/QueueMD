import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthStore } from "../store/authStore";
import { useFacilityStore } from "../store/facilityStore";
import api from "../services/api";
import { FACILITY_TYPES, formatTokenNumber } from "../utils/facilityTypeConfig";
import Layout from "../components/Layout";
import { socket } from "../services/socket";

// Chart Components
import HourlyBarChart from "../components/charts/HourlyBarChart";
import DailyTrendChart from "../components/charts/DailyTrendChart";
import FacilityDonutChart from "../components/charts/FacilityDonutChart";
import TopDoctorsCard from "../components/charts/TopDoctorsCard";
import ChartSkeleton from "../components/charts/ChartSkeleton";
import AnimatePage from "../components/AnimatePage";
import AIInsightsCard from "../components/charts/AIInsightsCard";
import { SkeletonTable } from "../components/Skeletons";
import { motion, AnimatePresence } from "framer-motion";
import PatientHistoryDrawer from "../components/PatientHistoryDrawer";

export default function Analytics() {
  const { user } = useAuthStore();
  const { facilityId, selectedBranch, setSelectedBranch } = useFacilityStore();

  const [stats, setStats] = useState({
    totalPatients: 0,
    completed: 0,
    avgWaitTime: 0,
    efficiency: 0,
  });

  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [hourlyData, setHourlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [facilityData, setFacilityData] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [facilityTypeFilter, setFacilityTypeFilter] = useState('all');

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState("today");
  const [tempCustomStart, setTempCustomStart] = useState("");
  const [tempCustomEnd, setTempCustomEnd] = useState("");
  const [tempFacilityTypeFilter, setTempFacilityTypeFilter] = useState('all');
  const [tempStatusFilter, setTempStatusFilter] = useState("all");

  const [loading, setLoading] = useState(false);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [viewHistoryPatient, setViewHistoryPatient] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [dateRange, setDateRange] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  useEffect(() => {
    if (isFilterModalOpen) {
      setTempDateRange(dateRange);
      setTempCustomStart(customStart);
      setTempCustomEnd(customEnd);
      setTempFacilityTypeFilter(facilityTypeFilter);
      setTempStatusFilter(statusFilter);
    }
  }, [isFilterModalOpen, dateRange, customStart, customEnd, facilityTypeFilter, statusFilter]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (dateRange !== "today") count++;
    if (facilityTypeFilter !== "all") count++;
    if (statusFilter !== "all") count++;
    if (customStart || customEnd) count++;
    return count;
  }, [dateRange, facilityTypeFilter, statusFilter, customStart, customEnd]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch, dateRange, facilityTypeFilter, customStart, customEnd]);

  const loadConsultations = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        q: debouncedSearch,
        range: dateRange,
        facilityType: facilityTypeFilter !== 'all' ? facilityTypeFilter : undefined,
        startDate: customStart,
        endDate: customEnd,
        status: statusFilter
      };
      const response = await api.get("/analytics/completed-consultations", { params });
      setPatients(response.data.consultations || []);
      setPagination(response.data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (error) {
      console.error("Load consultations error:", error);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, dateRange, facilityTypeFilter, customStart, customEnd, statusFilter]);

  const loadSummary = useCallback(async () => {
    try {
      const params = {
        range: dateRange,
        facilityType: facilityTypeFilter !== 'all' ? facilityTypeFilter : undefined,
        startDate: customStart,
        endDate: customEnd
      };
      const response = await api.get("/analytics/stats", { params });
      setStats(response.data?.stats || { totalPatients: 0, completedToday: 0, avgWaitTime: 0, efficiency: 0 });
    } catch (error) {
      console.error("Load summary error:", error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, facilityTypeFilter, customStart, customEnd]);

  const loadCharts = useCallback(async () => {
    if (!facilityId) return;
    try {
      setChartsLoading(true);
      setHourlyData([]);
      setDailyData([]);
      setFacilityData([]);
      setTopDoctors([]);

      const params = { 
        facilityType: facilityTypeFilter !== 'all' ? facilityTypeFilter : undefined,
        range: dateRange,
        startDate: customStart,
        endDate: customEnd
      };

      const [hourly, daily, facilityStats, doctors, insights] = await Promise.all([
        api.get("/analytics/hourly", { params }),
        api.get("/analytics/daily-trend", { params }),
        api.get("/analytics/facility-stats", { params }),
        api.get("/analytics/top-doctors", { params }),
        api.get("/analytics/ai-insights", { params })
      ]);

      const rawHourly = hourly.data?.data || hourly.data || [];
      const hData = Array.isArray(rawHourly) ? rawHourly.map(item => ({ hour: item.hour || item._id, value: item.count !== undefined ? item.count : (item.value || 0) })) : [];
      const rawDaily = daily.data?.data || daily.data || [];
      const dData = Array.isArray(rawDaily) ? rawDaily.map(item => ({ date: item.date || item._id, value: item.count !== undefined ? item.count : (item.value || 0) })) : [];
      const rawFacility = facilityStats.data?.data || facilityStats.data || [];
      const fData = Array.isArray(rawFacility) ? rawFacility.map(item => ({ name: item.name || item._id, value: item.value || item.count || 0 })) : [];
      const rawDoctors = doctors.data?.data || doctors.data || [];
      const docData = Array.isArray(rawDoctors) ? rawDoctors.map(item => ({ name: item.name || item.doctorName || item._id, value: item.count || 0 })) : [];

      setHourlyData(hData);
      setDailyData(dData);
      setFacilityData(fData);
      setTopDoctors(docData);
      setAiInsights(insights.data?.data || null);
    } catch (err) {
      console.error("Failed to load charts:", err);
    } finally {
      setChartsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId, facilityTypeFilter, dateRange, customStart, customEnd]);

  useEffect(() => {
    if (facilityId) {
      loadSummary();
      loadConsultations(1);
      loadCharts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId, dateRange, facilityTypeFilter, statusFilter, customStart, customEnd, debouncedSearch]);

  useEffect(() => {
    if (!facilityId) return;
    
    const handleQueueUpdate = (data) => {
      if (data.facilityId === facilityId && data.facilityType === user?.facilityType) {
        loadSummary();
        loadConsultations(pagination.page);
        loadCharts();
      }
    };
    
    socket.on("queue_update", handleQueueUpdate);
    return () => socket.off("queue_update", handleQueueUpdate);
  }, [facilityId, user?.facilityType, pagination.page, loadSummary, loadConsultations, loadCharts]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      loadConsultations(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setDateRange("today");
    setFacilityTypeFilter("all");
    setCustomStart("");
    setCustomEnd("");
    setStatusFilter("all");
    setPagination({ page: 1, pages: 1, total: 0, hasNext: false, hasPrev: false });
    setTempDateRange("today");
    setTempCustomStart("");
    setTempCustomEnd("");
    setTempFacilityTypeFilter("all");
    setTempStatusFilter("all");
  };

  const handleApplyFilters = () => {
    setDateRange(tempDateRange);
    setCustomStart(tempCustomStart);
    setCustomEnd(tempCustomEnd);
    setFacilityTypeFilter(tempFacilityTypeFilter);
    setStatusFilter(tempStatusFilter);
    setIsFilterModalOpen(false);
  };

  const handleResetAllFilters = () => {
    setTempDateRange("today");
    setTempCustomStart("");
    setTempCustomEnd("");
    setTempFacilityTypeFilter("all");
    setTempStatusFilter("all");
  };

  const getFacilityBadge = (type) => {
    const config = FACILITY_TYPES[type] || FACILITY_TYPES.clinic;
    return (
      <span
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider whitespace-nowrap"
        style={{
          backgroundColor: `${config.theme.primary}18`,
          color: config.theme.primary,
          border: `1px solid ${config.theme.primary}35`,
        }}
      >
        {config.icon} {config.label}
      </span>
    );
  };

  const dateRangeLabel = {
    today: "Today",
    yesterday: "Yesterday",
    week: "This Week",
    month: "This Month",
    "6m": "6 Months",
    "1y": "1 Year",
    all: "All Time",
    custom: "Custom Range"
  };

  const statCards = [
    {
      label: "Total Visits",
      value: stats?.totalPatients || 0,
      suffix: "",
      sub: dateRangeLabel[dateRange],
      icon: "group",
      color: "blue",
      gradient: "from-blue-500/20 via-blue-600/5 to-transparent",
      glow: "rgba(37,99,235,0.35)",
      iconBg: "bg-blue-500/15 text-blue-400",
      border: "border-blue-500/25",
      subIcon: "calendar_today",
    },
    {
      label: "Completed",
      value: stats?.completedToday || 0,
      suffix: "",
      sub: `${(((stats?.completedToday || 0) / (stats?.totalPatients || 1)) * 100).toFixed(1)}% Conversion`,
      icon: "check_circle",
      color: "emerald",
      gradient: "from-emerald-500/20 via-emerald-600/5 to-transparent",
      glow: "rgba(16,185,129,0.35)",
      iconBg: "bg-emerald-500/15 text-emerald-400",
      border: "border-emerald-500/25",
      subIcon: "trending_up",
    },
    {
      label: "Avg Wait Time",
      value: stats?.avgWaitTime || 0,
      suffix: "m",
      sub: "Peak: 11:00 AM",
      icon: "avg_pace",
      color: "orange",
      gradient: "from-orange-500/20 via-orange-600/5 to-transparent",
      glow: "rgba(249,115,22,0.35)",
      iconBg: "bg-orange-500/15 text-orange-400",
      border: "border-orange-500/25",
      subIcon: "schedule",
    },
    {
      label: "Efficiency",
      value: stats?.efficiency || 0,
      suffix: "%",
      sub: "Operational Rating",
      icon: "bolt",
      color: "purple",
      gradient: "from-purple-500/20 via-purple-600/5 to-transparent",
      glow: "rgba(139,92,246,0.35)",
      iconBg: "bg-purple-500/15 text-purple-400",
      border: "border-purple-500/25",
      subIcon: "speed",
    },
  ];

  return (
    <Layout>
      <AnimatePage className="p-5 md:p-6 space-y-6">

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[rgba(var(--theme-primary-rgb),0.12)] border border-[rgba(var(--theme-primary-rgb),0.2)] flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-[22px] text-[var(--theme-primary)]">analytics</span>
              </div>
              <div>
                <h1 className="text-[26px] md:text-[30px] font-black text-text-primary tracking-tight leading-none">
                  Analytics{" "}
                  <span
                    className="bg-clip-text text-transparent"
                    style={{ backgroundImage: "linear-gradient(90deg, var(--theme-primary), var(--theme-secondary, var(--theme-primary)))" }}
                  >
                    Dashboard
                  </span>
                </h1>
                <p className="text-[12.5px] text-text-secondary mt-0.5 font-medium">
                  Real-time operational performance · Live Engine
                  <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                </p>
              </div>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { loadSummary(); loadConsultations(pagination.page); loadCharts(); }}
            className="self-start md:self-auto px-5 py-2.5 rounded-xl border border-border-muted/50 dark:border-white/8 text-text-primary font-bold text-[13px] hover:bg-surface-variant/60 transition-all flex items-center gap-2 backdrop-blur-md bg-bg-secondary/70 shadow-sm"
          >
            <span className="material-symbols-outlined text-[17px] text-[var(--theme-primary)]">refresh</span>
            Refresh Data
          </motion.button>
        </div>

        {/* ── FILTER BAR ─────────────────────────────────────────── */}
        <div className="bg-bg-secondary/70 backdrop-blur-md border border-border-muted/50 dark:border-white/8 rounded-2xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-sm">
          {/* Date Pills */}
          <div className="flex gap-2 flex-wrap overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
            {[
              { key: "today", label: "Today", icon: "📅" },
              { key: "yesterday", label: "Yesterday", icon: "⏮" },
              { key: "week", label: "7D", icon: "📆" },
              { key: "month", label: "30D", icon: "📊" },
              { key: "6m", label: "6 Months", icon: "📅" },
              { key: "1y", label: "1 Year", icon: "📅" },
              { key: "custom", label: "Custom", icon: "🛠" },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setDateRange(key)}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-[12px] whitespace-nowrap transition-all duration-200 border ${
                  dateRange === key
                    ? "text-white shadow-lg border-transparent"
                    : "bg-surface-variant/50 text-text-secondary hover:text-text-primary border-transparent hover:border-border-muted/50 hover:bg-surface-variant"
                }`}
                style={
                  dateRange === key
                    ? { backgroundColor: "var(--theme-primary)", boxShadow: "0 4px 14px rgba(var(--theme-primary-rgb),0.3)" }
                    : {}
                }
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs */}
          {dateRange === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-bg-primary border border-border-muted/50 dark:border-white/8 rounded-xl px-3 py-1.5 text-xs font-bold text-text-primary outline-none focus:border-[var(--theme-primary)] transition-all"
              />
              <span className="text-text-secondary font-black text-sm">→</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-bg-primary border border-border-muted/50 dark:border-white/8 rounded-xl px-3 py-1.5 text-xs font-bold text-text-primary outline-none focus:border-[var(--theme-primary)] transition-all"
              />
            </div>
          )}

          {/* Facility Selector */}
          <div className="relative w-full lg:w-56 shrink-0">
            <select
              value={facilityTypeFilter}
              onChange={(e) => setFacilityTypeFilter(e.target.value)}
              className="w-full h-[40px] appearance-none bg-bg-primary border border-border-muted/50 dark:border-white/8 rounded-xl px-4 pr-10 text-[13px] text-text-primary font-bold focus:outline-none focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[rgba(var(--theme-primary-rgb),0.15)] transition-all"
            >
              <option value="all">🌐 All Facility Types</option>
              {Object.entries(FACILITY_TYPES).map(([key, config]) => (
                <option key={key} value={key} className="bg-bg-secondary">
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-[18px]">
              expand_more
            </span>
          </div>
        </div>

        {/* ── STAT CARDS ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 20 }}
              className={`relative overflow-hidden rounded-2xl border bg-bg-secondary/80 backdrop-blur-md p-5 group hover:translate-y-[-2px] transition-all duration-300 ${card.border}`}
              style={{ boxShadow: `0 0 0 0 ${card.glow}` }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 30px ${card.glow}`; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 0 0 0 ${card.glow}`; }}
            >
              {/* Background gradient blob */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.15em]">{card.label}</p>
                  <span className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-300`}>
                    <span className="material-symbols-outlined text-[19px]">{card.icon}</span>
                  </span>
                </div>
                <div className="text-[34px] font-black text-text-primary tracking-tight leading-none">
                  {card.value}{card.suffix}
                </div>
                <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[11px]">{card.subIcon}</span>
                  {card.sub}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── CHARTS ─────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Hourly Traffic */}
          <div className="rounded-2xl border border-border-muted/40 dark:border-white/8 bg-bg-secondary/80 backdrop-blur-md p-5 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(var(--theme-primary-rgb),0.4)] to-transparent" />
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[18px] text-[var(--theme-primary)]">bar_chart</span>
              <h3 className="text-[12px] font-black text-text-primary uppercase tracking-widest">Hourly Traffic</h3>
            </div>
            <HourlyBarChart data={hourlyData} loading={chartsLoading} />
          </div>

          {/* Trend + Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 rounded-2xl border border-border-muted/40 dark:border-white/8 bg-bg-secondary/80 backdrop-blur-md p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(var(--theme-primary-rgb),0.3)] to-transparent" />
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[18px] text-[var(--theme-primary)]">show_chart</span>
                <h3 className="text-[12px] font-black text-text-primary uppercase tracking-widest">Patient Flow Trend</h3>
              </div>
              <DailyTrendChart data={dailyData} loading={chartsLoading} />
            </div>
            <div className="lg:col-span-4 rounded-2xl border border-border-muted/40 dark:border-white/8 bg-bg-secondary/80 backdrop-blur-md p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(var(--theme-primary-rgb),0.3)] to-transparent" />
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[18px] text-[var(--theme-primary)]">donut_large</span>
                <h3 className="text-[12px] font-black text-text-primary uppercase tracking-widest">Facility Distribution</h3>
              </div>
              <FacilityDonutChart data={facilityData} loading={chartsLoading} />
            </div>
          </div>

          {/* Top Doctors + AI Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-border-muted/40 dark:border-white/8 bg-bg-secondary dark:bg-[#1e293b]/80 backdrop-blur-md p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[18px] text-amber-400">emoji_events</span>
                <h3 className="text-[12px] font-black text-text-primary uppercase tracking-widest">Top Doctors</h3>
              </div>
              <TopDoctorsCard data={topDoctors} loading={chartsLoading} />
            </div>
            <div className="rounded-2xl border border-border-muted/40 dark:border-white/8 bg-bg-secondary dark:bg-[#1e293b]/80 backdrop-blur-md p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[18px] text-[var(--theme-primary)]">psychology</span>
                <h3 className="text-[12px] font-black text-text-primary uppercase tracking-widest">QueueMD AI Insights</h3>
              </div>
              <AIInsightsCard data={aiInsights} loading={chartsLoading} />
            </div>
          </div>
        </div>

        {/* ── SEARCH + TABLE ─────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Search row */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary/50 text-xl pointer-events-none">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Patient Name, Phone, Token, Doctor, Facility, or Date (DD/MM)..."
                className="w-full bg-bg-secondary dark:bg-[#1e293b]/70 backdrop-blur-md border border-border-muted/50 dark:border-white/8 rounded-xl py-3 pl-12 pr-4 text-[13.5px] text-text-primary placeholder:text-text-secondary/40 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--theme-primary-rgb),0.2)] focus:border-[var(--theme-primary)] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              className="px-4 py-3 rounded-xl bg-bg-secondary dark:bg-[#1e293b]/70 backdrop-blur-md border border-border-muted/50 dark:border-white/8 text-text-secondary font-bold hover:text-text-primary transition-all flex items-center gap-2 hover:bg-surface-variant/60"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              Filters
              {activeFiltersCount > 0 && (
                <span
                  className="px-2 py-0.5 rounded-full text-white text-[10px] font-black"
                  style={{ backgroundColor: "var(--theme-primary)" }}
                >
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <button
              onClick={handleResetFilters}
              className="px-5 py-3 rounded-xl bg-bg-secondary dark:bg-[#1e293b]/70 backdrop-blur-md border border-border-muted/50 dark:border-white/8 text-text-secondary font-bold hover:text-text-primary transition-all whitespace-nowrap hover:bg-surface-variant/60"
            >
              Reset Filters
            </button>
          </div>

          {/* Consultation Table */}
          {loading && patients.length === 0 ? (
            <SkeletonTable />
          ) : (
            <div className="rounded-2xl border border-border-muted/40 dark:border-white/8 overflow-hidden bg-bg-secondary dark:bg-[#1e293b]/80 backdrop-blur-md shadow-sm relative">
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(var(--theme-primary-rgb),0.5)] to-transparent" />

              {/* Table header row */}
              <div className="px-5 py-4 border-b border-border-muted/40 dark:border-white/8 flex items-center justify-between bg-surface-variant/20">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
                  <h2 className="text-[13px] font-black text-text-primary flex items-center gap-2">
                    Consultation Log
                    <span className="flex items-center gap-1 text-[11px] font-bold text-text-secondary">
                      —
                      <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                      {dateRangeLabel[dateRange]}
                    </span>
                  </h2>
                </div>
                <span className="text-[10px] font-black text-text-secondary bg-surface-variant/60 border border-border-muted/40 dark:border-white/8 px-3 py-1 rounded-full tracking-widest uppercase">
                  {pagination.total} Total Entries
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-variant/30">
                      {["Token", "Patient", "Doctor", "Facility", "Completed At", "Wait Time", "Status"].map(col => (
                        <th key={col} className="px-5 py-3.5 text-left text-[10px] font-black text-text-secondary uppercase tracking-[0.12em] whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-muted/25 dark:divide-white/5">
                    {patients.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-14 text-center">
                          <span className="material-symbols-outlined text-4xl text-text-secondary/20 block mb-2">receipt_long</span>
                          <p className="text-text-secondary font-bold text-sm">No consultation records found</p>
                          <p className="text-text-secondary/50 text-xs mt-1">Try adjusting your filters or date range</p>
                        </td>
                      </tr>
                    ) : (
                      patients.map((patient, idx) => {
                        const patientConfig = FACILITY_TYPES[patient.facilityType] || FACILITY_TYPES.clinic;
                        return (
                          <motion.tr
                            key={patient._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="group hover:bg-[rgba(var(--theme-primary-rgb),0.04)] transition-colors duration-200"
                          >
                            {/* Token */}
                            <td className="px-5 py-4">
                              <span
                                className="inline-flex items-center px-2.5 py-1 rounded-lg text-[12px] font-black"
                                style={{
                                  backgroundColor: `${patientConfig.theme.primary}18`,
                                  color: patientConfig.theme.primary,
                                  border: `1px solid ${patientConfig.theme.primary}30`,
                                }}
                              >
                                #{formatTokenNumber(patient.tokenNumber, patient.facilityType)}
                              </span>
                            </td>

                            {/* Patient */}
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
                                    style={{ backgroundColor: "rgba(var(--theme-primary-rgb),0.7)" }}
                                  >
                                    {patient.patientName?.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="text-[13.5px] font-bold text-text-primary leading-tight">{patient.patientName}</div>
                                    <div className="text-[11px] text-text-secondary/60 whitespace-nowrap">{patient.phone || "N/A"}</div>
                                  </div>
                                </div>
                                {patient.phone && (
                                  <motion.button
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setViewHistoryPatient({ name: patient.patientName, phone: patient.phone })}
                                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-[rgba(var(--theme-primary-rgb),0.15)] hover:border-[rgba(var(--theme-primary-rgb),0.4)] text-gray-400 hover:text-[var(--theme-primary)] transition-all"
                                    title="View EMR History"
                                  >
                                    <span className="material-symbols-outlined text-[17px]">history</span>
                                  </motion.button>
                                )}
                              </div>
                            </td>

                            {/* Doctor */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[14px] text-text-secondary/50">stethoscope</span>
                                <span className="text-[13px] text-text-primary font-medium">{patient.doctorName || patient.assignedDoctor || "—"}</span>
                              </div>
                            </td>

                            {/* Facility */}
                            <td className="px-5 py-4">{getFacilityBadge(patient.facilityType)}</td>

                            {/* Time */}
                            <td className="px-5 py-4">
                              <div className="text-[13px] font-bold text-text-primary">
                                {new Date(patient.completedAt || patient.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                              </div>
                              <div className="text-[10px] text-text-secondary/55">
                                {new Date(patient.completedAt || patient.createdAt).toLocaleDateString("en-GB")}
                              </div>
                            </td>

                            {/* Wait Time */}
                            <td className="px-5 py-4">
                              <span className={`text-[13px] font-black ${
                                patient.actualDuration <= 10 ? "text-emerald-400" :
                                patient.actualDuration <= 20 ? "text-yellow-400" : "text-orange-400"
                              }`}>
                                {patient.actualDuration} MIN
                              </span>
                            </td>

                            {/* Status */}
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                                patient.status === "completed" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" :
                                patient.status === "no-show" ? "text-red-400 bg-red-400/10 border-red-400/20" :
                                "text-orange-400 bg-orange-400/10 border-orange-400/20"
                              }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                {patient.status}
                              </span>
                            </td>
                          </motion.tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.total > 0 && (
                <div className="px-5 py-4 border-t border-border-muted/30 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-variant/10">
                  <div className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="opacity-50">Registry Index:</span>
                    <span className="text-text-primary bg-surface-variant/60 px-2 py-0.5 rounded border border-border-muted/30">
                      {(pagination.page - 1) * 10 + 1} — {Math.min(pagination.page * 10, pagination.total)}
                    </span>
                    <span className="opacity-40">/</span>
                    <span className="text-text-primary">{pagination.total}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="h-8 px-4 rounded-xl border border-border-muted/50 dark:border-white/8 text-[10px] font-black uppercase tracking-widest text-text-primary hover:bg-surface-variant disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                      Prev
                    </button>

                    {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                      const pageNum = i + 1;
                      const isActive = pagination.page === pageNum;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 rounded-xl text-[11px] font-black transition-all border ${
                            isActive
                              ? "text-white border-transparent shadow-lg"
                              : "bg-bg-secondary border-border-muted/50 dark:border-white/8 text-text-primary hover:border-text-secondary"
                          }`}
                          style={isActive ? {
                            backgroundColor: "var(--theme-primary)",
                            boxShadow: "0 4px 12px rgba(var(--theme-primary-rgb),0.3)"
                          } : {}}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {pagination.pages > 5 && <span className="px-1 text-text-secondary/40 font-black">...</span>}

                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                      className="h-8 px-4 rounded-xl border border-border-muted/50 dark:border-white/8 text-[10px] font-black uppercase tracking-widest text-text-primary hover:bg-surface-variant disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── PATIENT HISTORY DRAWER ─────────────────────────────── */}
        <PatientHistoryDrawer
          isOpen={!!viewHistoryPatient}
          onClose={() => setViewHistoryPatient(null)}
          patient={viewHistoryPatient}
        />

        {/* ── FILTER MODAL ───────────────────────────────────────── */}
        <AnimatePresence>
          {isFilterModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
              <div className="absolute inset-0" onClick={() => setIsFilterModalOpen(false)} />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                className="bg-bg-secondary border border-border-muted/50 dark:border-white/12 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl flex flex-col relative z-10"
              >
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(var(--theme-primary-rgb),0.6)] to-transparent" />

                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-border-muted/30 dark:border-white/5 bg-surface-variant/20">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[rgba(var(--theme-primary-rgb),0.1)] border border-[rgba(var(--theme-primary-rgb),0.15)] flex items-center justify-center text-[var(--theme-primary)]">
                      <span className="material-symbols-outlined text-[20px]">tune</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-[13px] font-black text-text-primary uppercase tracking-wider">Advanced Filters</h2>
                      {activeFiltersCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-white text-[10px] font-black" style={{ backgroundColor: "var(--theme-primary)" }}>
                          {activeFiltersCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsFilterModalOpen(false)}
                    className="w-8 h-8 rounded-full hover:bg-surface-variant dark:hover:bg-white/10 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block">Date Range</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { key: "today", label: "Today" },
                        { key: "yesterday", label: "Yesterday" },
                        { key: "week", label: "7 Days" },
                        { key: "month", label: "30 Days" },
                        { key: "6m", label: "6 Months" },
                        { key: "1y", label: "1 Year" },
                        { key: "all", label: "All Time" },
                        { key: "custom", label: "Custom" },
                      ].map(({ key, label }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setTempDateRange(key)}
                          className={`py-2 rounded-xl font-bold text-xs transition-all border ${
                            tempDateRange === key
                              ? "text-white border-transparent"
                              : "bg-bg-primary border-border-muted/50 dark:border-white/5 text-text-secondary hover:text-text-primary"
                          }`}
                          style={tempDateRange === key ? { backgroundColor: "var(--theme-primary)" } : {}}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {tempDateRange === "custom" && (
                      <div className="grid grid-cols-2 gap-4 mt-3 p-4 bg-bg-primary/50 border border-border-muted/50 dark:border-white/5 rounded-xl">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-text-secondary uppercase tracking-wider block">Start Date</label>
                          <input type="date" value={tempCustomStart} onChange={e => setTempCustomStart(e.target.value)} className="w-full bg-bg-primary border border-border-muted dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-text-primary outline-none focus:border-[var(--theme-primary)]" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-text-secondary uppercase tracking-wider block">End Date</label>
                          <input type="date" value={tempCustomEnd} onChange={e => setTempCustomEnd(e.target.value)} className="w-full bg-bg-primary border border-border-muted dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-text-primary outline-none focus:border-[var(--theme-primary)]" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block">Consultation Status</label>
                    <div className="flex flex-wrap gap-2.5">
                      {[
                        { key: "all", label: "All Status", dot: "bg-blue-500" },
                        { key: "completed", label: "Completed", dot: "bg-emerald-500" },
                        { key: "no-show", label: "No-Show", dot: "bg-red-500" },
                        { key: "cancelled", label: "Cancelled", dot: "bg-orange-500" },
                      ].map(({ key, label, dot }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setTempStatusFilter(key)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-xs font-semibold ${
                            tempStatusFilter === key
                              ? "text-white border-transparent"
                              : "bg-bg-primary border-border-muted/50 dark:border-white/5 text-text-secondary hover:text-text-primary"
                          }`}
                          style={tempStatusFilter === key ? { backgroundColor: "var(--theme-primary)" } : {}}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block">Facility Type</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: "all", label: "All Types", icon: "🌐", color: "#3b82f6" },
                        ...Object.entries(FACILITY_TYPES).map(([key, config]) => ({
                          key, label: config.label, icon: config.icon, color: config.theme?.primary || "#3b82f6"
                        }))
                      ].map(({ key, label, icon, color }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setTempFacilityTypeFilter(key)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all text-xs font-bold ${
                            tempFacilityTypeFilter === key
                              ? "text-white shadow-md border-transparent"
                              : "bg-bg-primary border-border-muted/50 dark:border-white/5 text-text-secondary hover:text-text-primary"
                          }`}
                          style={tempFacilityTypeFilter === key ? { backgroundColor: color, borderColor: color } : {}}
                        >
                          <span className="text-sm">{icon}</span>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border-muted/30 dark:border-white/5 flex items-center justify-between bg-surface-variant/20">
                  <button
                    type="button"
                    onClick={handleResetAllFilters}
                    className="px-5 py-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-variant dark:hover:bg-white/5 transition-all font-bold text-xs uppercase tracking-wider"
                  >
                    Reset All
                  </button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleApplyFilters}
                    className="px-6 py-2.5 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md"
                    style={{ backgroundColor: "var(--theme-primary)", boxShadow: "0 4px 14px rgba(var(--theme-primary-rgb),0.25)" }}
                  >
                    Apply Filters
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </AnimatePage>
    </Layout>
  );
}
