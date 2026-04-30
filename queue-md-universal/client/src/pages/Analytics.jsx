import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthStore } from "../store/authStore";
import { useFacilityStore } from "../store/facilityStore";
import api from "../services/api";
import { FACILITY_TYPES } from "../utils/facilityTypeConfig";
import Layout from "../components/Layout";
import { socket } from "../services/socket";

// ✅ New Chart Components
import HourlyBarChart from "../components/charts/HourlyBarChart";
import DailyTrendChart from "../components/charts/DailyTrendChart";
import FacilityDonutChart from "../components/charts/FacilityDonutChart";
import TopDoctorsCard from "../components/charts/TopDoctorsCard";
import ChartSkeleton from "../components/charts/ChartSkeleton";
import AnimatePage from "../components/AnimatePage";
import AIInsightsCard from "../components/charts/AIInsightsCard";
import { SkeletonTable } from "../components/Skeletons";

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

  // ✅ New Chart States
  const [hourlyData, setHourlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [facilityData, setFacilityData] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(false);
  const [chartsLoading, setChartsLoading] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Date Range State
  const [dateRange, setDateRange] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Debounce Search (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch, dateRange, selectedBranch, customStart, customEnd]);

  // ✅ Load Branches for Selector
  const loadBranches = useCallback(async () => {
    if (!facilityId) return;
    try {
      const response = await api.get(`/facility/${facilityId}/branches`);
      setBranches(response.data.data || []);
    } catch (err) {
      console.error("Failed to load branches:", err);
    }
  }, [facilityId]);

  // ✅ Load Consultation Log (Dedicated Endpoint)
  const loadConsultations = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        q: debouncedSearch,
        range: dateRange,
        branchId: selectedBranch,
        startDate: customStart,
        endDate: customEnd
      };
      
      const response = await api.get("/analytics/completed-consultations", { params });
      setPatients(response.data.consultations || []);
      setPagination(response.data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (error) {
      console.error("Load consultations error:", error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, dateRange, selectedBranch, customStart, customEnd]);

  // ✅ Load Stats Summary Cards
  const loadSummary = useCallback(async () => {
    try {
      const params = {
        range: dateRange,
        branchId: selectedBranch,
        startDate: customStart,
        endDate: customEnd
      };
      const response = await api.get("/analytics/stats", { params });
      setStats(response.data?.stats || { totalPatients: 0, completedToday: 0, avgWaitTime: 0, efficiency: 0 });
    } catch (error) {
      console.error("Load summary error:", error);
    }
  }, [dateRange, selectedBranch, customStart, customEnd]);

  // ✅ Load Chart Data
  const loadCharts = useCallback(async () => {
    if (!facilityId) return;
    try {
      setChartsLoading(true);
      
      // ✅ Clear previous chart data to prevent stale visuals
      setHourlyData([]);
      setDailyData([]);
      setFacilityData([]);
      setTopDoctors([]);

      const params = { 
        branchId: selectedBranch, 
        range: dateRange,
        startDate: customStart,
        endDate: customEnd
      };

      console.log('📊 Fetching Charts with params:', params);

      const [hourly, daily, facilityStats, doctors, insights] = await Promise.all([
        api.get("/analytics/hourly", { params }),
        api.get("/analytics/daily-trend", { params }),
        api.get("/analytics/facility-stats", { params }),
        api.get("/analytics/top-doctors", { params }),
        api.get("/analytics/ai-insights", { params })
      ]);

      // ✅ Extraction + Robust Transformation
      const rawHourly = hourly.data?.data || hourly.data || [];
      const hData = Array.isArray(rawHourly) ? rawHourly.map(item => ({
        hour: item.hour || item._id,
        value: item.count !== undefined ? item.count : (item.value || 0) // Standardize to 'value'
      })) : [];

      const rawDaily = daily.data?.data || daily.data || [];
      const dData = Array.isArray(rawDaily) ? rawDaily.map(item => ({
        date: item.date || item._id,
        value: item.count !== undefined ? item.count : (item.value || 0) // Standardize to 'value'
      })) : [];

      const rawFacility = facilityStats.data?.data || facilityStats.data || [];
      const fData = Array.isArray(rawFacility) ? rawFacility.map(item => ({
        name: item.name || item._id,
        value: item.value || item.count || 0 // Standardize to 'value'
      })) : [];

      const rawDoctors = doctors.data?.data || doctors.data || [];
      const docData = Array.isArray(rawDoctors) ? rawDoctors.map(item => ({
        name: item.name || item.doctorName || item._id,
        value: item.count || 0 // Standardize to 'value'
      })) : [];

      console.log('✅ Final Transformed State:', {
        hourly: hData.length,
        daily: dData.length,
        facility: fData.length,
        doctors: docData.length
      });

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
  }, [facilityId, selectedBranch, dateRange, customStart, customEnd]);

  // ✅ Trigger load on filter change
  useEffect(() => {
    if (facilityId) {
      console.log('📅 Filter changed, reloading all data...', { dateRange, selectedBranch });
      loadSummary();
      loadConsultations(1);
      loadCharts();
    }
  }, [facilityId, loadSummary, loadConsultations, loadCharts]);

  // ✅ Initial Load (Branches only)
  useEffect(() => {
    if (facilityId) {
      loadBranches();
    }
  }, [facilityId]);

  // ✅ Socket Auto-Refresh
  useEffect(() => {
    if (!facilityId) return;
    
    socket.on("queue_update", (data) => {
      // Security Check: Only refresh if same facility and type
      if (data.facilityId === facilityId && data.facilityType === user?.facilityType) {
        loadSummary();
        loadConsultations(pagination.page);
        loadCharts();
      }
    });

    return () => socket.off("queue_update");
  }, [facilityId, user?.facilityType, pagination.page]);

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
    setSelectedBranch(null);
    setCustomStart("");
    setCustomEnd("");
    setPagination({ page: 1, pages: 1, total: 0, hasNext: false, hasPrev: false });
  };

  const getFacilityBadge = (type) => {
    const config = FACILITY_TYPES[type] || FACILITY_TYPES.clinic;
    return (
      <span
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider"
        style={{
          backgroundColor: `${config.theme.primary}15`,
          color: config.theme.primary,
          border: `1px solid ${config.theme.primary}30`,
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

  return (
    <Layout>
      <AnimatePage className="p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[28px] md:text-[32px] font-black text-text-primary tracking-tight leading-none">
              Analytics Dashboard
            </h1>
            <p className="text-[14px] text-text-secondary mt-2">
              Real-time operational performance for all facilities
            </p>
          </div>
          <button
            onClick={() => { loadSummary(); loadConsultations(pagination.page); }}
            className="px-4 py-2 rounded-xl bg-bg-secondary border border-border-muted/50 text-text-primary font-bold text-[14px] hover:bg-surface-variant transition flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Refresh Data
          </button>
        </div>

        {/* Filter Bar (Date + Branch) */}
        <div className="bg-bg-secondary p-4 rounded-xl border border-border-muted/50 mb-6 flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Date Filter Pills */}
          <div className="flex gap-2 flex-wrap overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
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
                className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${dateRange === key
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-surface-variant text-text-secondary hover:text-text-primary border border-transparent hover:border-border-muted"
                  }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs (only if range is custom) */}
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
              <input 
                type="date" 
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-surface-variant border border-border-muted/50 rounded-lg px-3 py-1.5 text-xs font-bold text-text-primary outline-none focus:border-blue-500"
              />
              <span className="text-text-secondary font-black">→</span>
              <input 
                type="date" 
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-surface-variant border border-border-muted/50 rounded-lg px-3 py-1.5 text-xs font-bold text-text-primary outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Branch Selector */}
          <div className="relative w-full lg:w-64">
            <select
              value={selectedBranch || ""}
              onChange={(e) => setSelectedBranch(e.target.value || null)}
              className="w-full h-[44px] appearance-none bg-surface-variant border border-border-muted/50 rounded-xl px-4 pr-10 text-[14px] text-text-primary font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-500 transition-all shadow-inner"
            >
              <option value="">🌐 All Branches</option>
              {branches.map(b => (
                <option key={b._id} value={b._id} disabled={!b.isActive} className="bg-bg-secondary">
                  {b.name} {!b.isActive ? '(Inactive)' : ''}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
              expand_more
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Visits */}
          <div className="bg-bg-secondary p-5 rounded-xl border-l-4 border-l-blue-500 border-y border-r border-border-muted/50 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[12px] font-black text-text-secondary uppercase tracking-widest pl-1">
                Total Visits
              </div>
              <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px] text-blue-500">group</span>
              </span>
            </div>
            <div className="text-[32px] font-black text-text-primary tracking-tight">{stats?.totalPatients || 0}</div>
            <div className="text-[10px] font-bold text-text-secondary mt-1 flex items-center gap-1 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[12px]">calendar_today</span>
              {dateRangeLabel[dateRange]}
            </div>
          </div>

          {/* Consultations */}
          <div className="bg-bg-secondary p-5 rounded-xl border-l-4 border-l-green-500 border-y border-r border-border-muted/50 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[12px] font-black text-text-secondary uppercase tracking-widest pl-1">
                Completed
              </div>
              <span className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px] text-green-500">check_circle</span>
              </span>
            </div>
            <div className="text-[32px] font-black text-text-primary tracking-tight">{stats?.completedToday || 0}</div>
            <div className="text-[10px] font-bold text-text-secondary mt-1 uppercase tracking-wider">
              {(((stats?.completedToday || 0) / (stats?.totalPatients || 1)) * 100).toFixed(1)}% Conversion
            </div>
          </div>

          {/* Avg Wait Time */}
          <div className="bg-bg-secondary p-5 rounded-xl border-l-4 border-l-orange-500 border-y border-r border-border-muted/50 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[12px] font-black text-text-secondary uppercase tracking-widest pl-1">
                Avg Wait Time
              </div>
              <span className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px] text-orange-500">avg_pace</span>
              </span>
            </div>
            <div className="text-[32px] font-black text-text-primary tracking-tight">{stats?.avgWaitTime || 0}m</div>
            <div className="text-[10px] font-bold text-text-secondary mt-1 uppercase tracking-wider">
              Peak: 11:00 AM
            </div>
          </div>

          {/* Efficiency */}
          <div className="bg-bg-secondary p-5 rounded-xl border-l-4 border-l-purple-500 border-y border-r border-border-muted/50 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[12px] font-black text-text-secondary uppercase tracking-widest pl-1">
                Efficiency
              </div>
              <span className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px] text-purple-500">bolt</span>
              </span>
            </div>
            <div className="text-[32px] font-black text-text-primary tracking-tight">{stats?.efficiency || 0}%</div>
            <div className="text-[10px] font-bold text-text-secondary mt-1 uppercase tracking-wider">
              Operational Rating
            </div>
          </div>
        </div>

        {/* ✅ Advanced Charts Grid */}
        <div className="space-y-6 mb-8">
          {/* Row 1: Hourly Traffic */}
          <div className="grid grid-cols-1 gap-6">
            <HourlyBarChart data={hourlyData} loading={chartsLoading} />
          </div>

          {/* Row 2: Trend + Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <DailyTrendChart data={dailyData} loading={chartsLoading} />
            </div>
            <div className="lg:col-span-4">
              <FacilityDonutChart data={facilityData} loading={chartsLoading} />
            </div>
          </div>

          {/* Row 3: Top Doctors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopDoctorsCard data={topDoctors} loading={chartsLoading} />
            <AIInsightsCard data={aiInsights} loading={chartsLoading} />
          </div>
        </div>

        {/* Search Bar Row */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-xl">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Patient Name, Phone, Token, Doctor, Facility, or Date (DD/MM)..."
              className="w-full bg-bg-secondary border border-border-muted/50 rounded-xl py-3 pl-12 pr-4 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
            onClick={handleResetFilters}
            className="px-5 py-3 rounded-xl bg-bg-secondary border border-border-muted/50 text-text-secondary font-bold hover:text-text-primary transition whitespace-nowrap"
          >
            Reset Filters
          </button>
        </div>

        {/* Consultation Log Table */}
        {loading && patients.length === 0 ? (
          <SkeletonTable />
        ) : (
          <div className="bg-bg-secondary rounded-2xl border border-border-muted/50 overflow-hidden">
            <div className="p-5 border-b border-border-muted/50 flex items-center justify-between">
              <h2 className="text-lg font-black text-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-green-500">check_circle</span>
                Consultation Log
                <span className="flex items-center gap-1 text-[13px] font-bold text-text-secondary">
                  —
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                  {dateRangeLabel[dateRange]}
                </span>
              </h2>
              <span className="text-sm font-bold text-text-secondary bg-surface-variant px-3 py-1 rounded-full">
                {pagination.total} TOTAL ENTRIES
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-variant">
                  <tr>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-text-secondary uppercase tracking-[0.1em]">TOKEN</th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-text-secondary uppercase tracking-[0.1em]">PATIENT</th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-text-secondary uppercase tracking-[0.1em]">DOCTOR</th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-text-secondary uppercase tracking-[0.1em]">FACILITY</th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-text-secondary uppercase tracking-[0.1em]">COMPLETED AT</th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-text-secondary uppercase tracking-[0.1em]">WAIT TIME</th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-text-secondary uppercase tracking-[0.1em]">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-muted/30">
                  {patients.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-text-secondary">
                        No data found
                      </td>
                    </tr>
                  ) : (
                    patients.map((patient) => (
                      <tr
                        key={patient._id}
                        className="group hover:bg-surface-variant/50 transition-all"
                      >
                        {/* Token */}
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm font-bold">
                            #{String(patient.tokenNumber).padStart(3, "0")}
                          </span>
                        </td>

                        {/* Patient */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 font-black text-sm">
                              {patient.patientName?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-[14px] font-bold text-text-primary">
                                {patient.patientName}
                              </div>
                              <div className="text-[11px] text-text-secondary">
                                {patient.phone || "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Doctor */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px] text-text-secondary">
                              stethoscope
                            </span>
                            <span className="text-[14px] text-text-primary font-medium">
                              {patient.doctorName || patient.assignedDoctor || "—"}
                            </span>
                          </div>
                        </td>

                        {/* Facility Badge */}
                        <td className="px-6 py-4">
                          {getFacilityBadge(patient.facilityType)}
                        </td>

                        {/* Completed At */}
                        <td className="px-6 py-4">
                          <div className="text-[14px] font-bold text-text-primary">
                            {new Date(patient.completedAt).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </div>
                          <div className="text-[11px] text-text-secondary">
                            {new Date(patient.completedAt).toLocaleDateString("en-GB")}
                          </div>
                        </td>

                        {/* Wait Time */}
                        <td className="px-6 py-4">
                          <span
                            className={`text-[14px] font-bold ${patient.actualDuration <= 10
                                ? "text-green-400"
                                : patient.actualDuration <= 20
                                  ? "text-yellow-400"
                                  : "text-orange-400"
                              }`}
                          >
                            {patient.actualDuration} MIN
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-widest uppercase border text-green-400 bg-green-400/10 border-green-400/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {patient.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ✅ Premium Registry Style Pagination */}
            {pagination.total > 0 && (
              <div className="px-6 py-5 border-t border-border-muted/30 flex flex-col sm:flex-row items-center justify-between gap-4 bg-bg-secondary/30">
                <div className="text-[11px] font-black text-text-secondary uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="opacity-50">Registry Index:</span>
                  <span className="text-text-primary bg-surface-variant px-2 py-0.5 rounded">
                    {(pagination.page - 1) * 10 + 1} — {Math.min(pagination.page * 10, pagination.total)}
                  </span>
                  <span className="opacity-50">/</span>
                  <span className="text-text-primary">{pagination.total}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="h-8 px-4 rounded-xl border border-border-muted/50 text-[10px] font-black uppercase tracking-widest text-text-primary hover:bg-surface-variant disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    Prev
                  </button>

                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                      const pageNum = i + 1;
                      const isActive = pagination.page === pageNum;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 rounded-xl text-[11px] font-black transition-all border ${
                            isActive 
                              ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20" 
                              : "bg-bg-secondary border-border-muted/50 text-text-primary hover:border-text-secondary"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {pagination.pages > 5 && (
                      <span className="px-1 text-text-secondary opacity-50 font-black">...</span>
                    )}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="h-8 px-4 rounded-xl border border-border-muted/50 text-[10px] font-black uppercase tracking-widest text-text-primary hover:bg-surface-variant disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </AnimatePage>
    </Layout>
  );
}
