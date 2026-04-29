import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../store/authStore";
import { useFacilityStore } from "../store/facilityStore";
import api from "../services/api";
import { FACILITY_TYPES } from "../utils/facilityTypeConfig";
import Layout from "../components/Layout";

export default function Analytics() {
  const { user } = useAuthStore();
  const { facilityId } = useFacilityStore();

  const [stats, setStats] = useState({
    totalPatients: 0,
    completed: 0,
    avgWaitTime: 0,
    efficiency: 0,
    hourlyData: [],
  });

  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Date Range State
  const [dateRange, setDateRange] = useState("today");

  // Debounce Search (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when search or dateRange changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch, dateRange]);

  const loadData = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search: debouncedSearch,
        dateRange,
      };
      const response = await api.get(`/analytics/stats`, { params });
      setStats(response.data.data);
      setPatients(response.data.data.patients || []);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error("Analytics load error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (facilityId) {
      loadData(1);
    }
  }, [facilityId]);

  useEffect(() => {
    if (facilityId) {
      loadData(1);
    }
  }, [debouncedSearch, dateRange]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      loadData(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setDateRange("today");
    setPagination({ page: 1, pages: 1, total: 0, hasNext: false, hasPrev: false });
  };

  const getFacilityBadge = (type) => {
    const config = FACILITY_TYPES[type] || FACILITY_TYPES.clinic;
    return (
      <span
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
        style={{
          backgroundColor: `${config.theme.primary}15`,
          color: config.theme.primary,
          border: `1px solid ${config.theme.primary}30`,
        }}
      >
        {config.icon} {type}
      </span>
    );
  };

  const dateRangeLabel = {
    today: "Today",
    yesterday: "Yesterday",
    week: "This Week",
    month: "This Month",
    all: "All Time",
  };

  return (
    <Layout>
      <div className="p-6">
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
            onClick={() => loadData(pagination.page)}
            className="px-4 py-2 rounded-xl bg-bg-secondary border border-border-muted/50 text-text-primary font-bold text-[14px] hover:bg-surface-variant transition flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Refresh Data
          </button>
        </div>

        {/* Date Filter Pills — ABOVE Stats Cards (original layout) */}
        <div className="flex gap-2 flex-wrap mb-6">
          {[
            { key: "today", label: "Today", icon: "📅" },
            { key: "yesterday", label: "Yesterday", icon: "⏮" },
            { key: "week", label: "This Week", icon: "📆" },
            { key: "month", label: "This Month", icon: "📊" },
            { key: "all", label: "All Time", icon: "🌟" },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setDateRange(key)}
              className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${dateRange === key
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-bg-secondary border border-border-muted/50 text-text-secondary hover:text-text-primary"
                }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Visits */}
          <div className="bg-bg-secondary p-5 rounded-xl border border-border-muted/50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[12px] font-bold text-text-secondary uppercase tracking-wider">
                Total Visits
              </div>
              <span className="text-[10px] font-black text-green-400 uppercase tracking-wider">
                {dateRangeLabel[dateRange]}
              </span>
            </div>
            <div className="text-[32px] font-black text-text-primary">{stats.totalPatients}</div>
          </div>

          {/* Consultations */}
          <div className="bg-bg-secondary p-5 rounded-xl border border-border-muted/50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[12px] font-bold text-text-secondary uppercase tracking-wider">
                Consultations
              </div>
              <span className="text-[10px] font-black text-green-400 uppercase tracking-wider">
                Done
              </span>
            </div>
            <div className="text-[32px] font-black text-text-primary">{stats.completed}</div>
          </div>

          {/* Avg Wait Time */}
          <div className="bg-bg-secondary p-5 rounded-xl border border-border-muted/50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[12px] font-bold text-text-secondary uppercase tracking-wider">
                Avg Wait Time
              </div>
              <span className="text-[10px] font-black text-orange-400 uppercase tracking-wider">
                Minutes
              </span>
            </div>
            <div className="text-[32px] font-black text-text-primary">{stats.avgWaitTime}</div>
          </div>

          {/* Efficiency */}
          <div className="bg-bg-secondary p-5 rounded-xl border border-border-muted/50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[12px] font-bold text-text-secondary uppercase tracking-wider">
                Efficiency
              </div>
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">
                Rating
              </span>
            </div>
            <div className="text-[32px] font-black text-text-primary">{stats.efficiency}%</div>
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
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-text-secondary">
                      Loading...
                    </td>
                  </tr>
                ) : patients.length === 0 ? (
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

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-border-muted/50 flex items-center justify-between">
              <div className="text-[14px] text-text-secondary">
                Showing{" "}
                <span className="font-bold">{(pagination.page - 1) * 10 + 1}</span> to{" "}
                <span className="font-bold">
                  {Math.min(pagination.page * 10, pagination.total)}
                </span>{" "}
                of <span className="font-bold">{pagination.total}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-4 py-2 rounded-lg bg-bg-secondary border border-border-muted/50 text-text-primary font-bold text-[14px] disabled:opacity-50 hover:bg-surface-variant transition"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    className={`px-4 py-2 rounded-lg font-bold text-[14px] transition ${pagination.page === i + 1
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-bg-secondary border border-border-muted/50 text-text-primary hover:bg-surface-variant"
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
                {pagination.pages > 5 && (
                  <span className="px-2 text-text-secondary">...</span>
                )}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="px-4 py-2 rounded-lg bg-bg-secondary border border-border-muted/50 text-text-primary font-bold text-[14px] disabled:opacity-50 hover:bg-surface-variant transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
