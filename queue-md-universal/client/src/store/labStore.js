import { create } from 'zustand';
import { labApi } from '../services/labApi';

export const useLabStore = create((set, get) => ({
  reports: [],
  stats: { pending: 0, processing: 0, ready: 0, delivered: 0, total: 0 },
  loading: false,
  error: null,
  pagination: { page: 1, limit: 10, total: 0 },
  filters: { status: 'all', date: 'today', search: '' },

  // Fetch Reports
  fetchReports: async () => {
    set({ loading: true, error: null });
    try {
      const { pagination, filters } = get();
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      const res = await labApi.getReports(params);
      set({ reports: res.reports, pagination: { ...pagination, total: res.total } });
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  // Fetch Stats
  fetchStats: async () => {
    try {
      const { filters } = get();
      const res = await labApi.getStats({ date: filters.date });
      set({ stats: res.stats });
    } catch (err) {
      console.error("Stats fetch failed", err);
    }
  },

  // Real-time Update Handler (Called from Socket)
  updateReportRealtime: (updatedReport) => {
    set((state) => {
      const existingIndex = state.reports.findIndex(r => r._id === updatedReport._id);
      const newReports = [...state.reports];
      
      if (existingIndex >= 0) {
        newReports[existingIndex] = updatedReport;
      } else {
        newReports.unshift(updatedReport);
      }
      return { reports: newReports };
    });
    get().fetchStats(); // Refresh stats as status changed
  },

  // Update Filter
  setFilters: (newFilters) => {
    set({ filters: { ...get().filters, ...newFilters } });
    // Note: We don't call fetchReports immediately here to allow debouncing if needed, 
    // but the original code had it in the callback. We'll follow that.
    get().fetchReports();
  }
}));
