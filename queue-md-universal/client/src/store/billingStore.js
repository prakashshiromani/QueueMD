import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchInvoices as fetchInvoicesApi, createInvoiceApi, updateInvoiceStatus as updateInvoiceStatusApi, fetchBillingStats } from '../services/api';

export const useBillingStore = create(
  persist(
    (set, get) => ({
      // State
      invoices: [],
      stats: {
        totalRevenue: 0,
        pendingPayments: 0,
        paidToday: 0,
        pendingCount: 0,
        paidTodayCount: 0
      },
      loading: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      totalInvoices: 0,
      
      // Actions
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),
      
      fetchInvoices: async (page = 1, filters = {}) => {
        set({ loading: true, error: null });
        try {
          const data = await fetchInvoicesApi(page, filters);
          set({
            invoices: data.data || [],
            currentPage: data.currentPage || page,
            totalPages: data.totalPages || 1,
            totalInvoices: data.total || 0,
            loading: false
          });
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },
      
      fetchStats: async () => {
        try {
          const data = await fetchBillingStats();
          set({ stats: data });
        } catch (error) {
          console.error('Failed to fetch stats:', error);
        }
      },
      
      createInvoice: async (invoiceData) => {
        set({ loading: true, error: null });
        try {
          const newInvoice = await createInvoiceApi(invoiceData);
          set((state) => ({
            invoices: [newInvoice, ...state.invoices],
            loading: false
          }));
          // Refresh stats
          get().fetchStats();
          return newInvoice;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },
      
      updateStatus: async (invoiceId, status) => {
        try {
          const updatedInvoice = await updateInvoiceStatusApi(invoiceId, status);
          set((state) => ({
            invoices: state.invoices.map((inv) =>
              inv._id === invoiceId ? updatedInvoice : inv
            )
          }));
          get().fetchStats();
          return updatedInvoice;
        } catch (error) {
          console.error('Failed to update status:', error);
          throw error;
        }
      },
      
      reset: () => set({
        invoices: [],
        stats: {
          totalRevenue: 0,
          pendingPayments: 0,
          paidToday: 0,
          pendingCount: 0,
          paidTodayCount: 0
        },
        loading: false,
        error: null,
        currentPage: 1,
        totalPages: 1,
        totalInvoices: 0
      })
    }),
    {
      name: 'billing-storage'
    }
  )
);
