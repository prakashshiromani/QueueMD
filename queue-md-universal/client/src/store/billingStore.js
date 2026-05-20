import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchInvoices as fetchInvoicesApi, createInvoiceApi, updateInvoiceStatus as updateInvoiceStatusApi, fetchBillingStats } from '../services/api';
import api from '../services/api';
import { socket } from '../services/socket';
import toast from 'react-hot-toast';

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
      
      initSocket: () => {
        socket.off('billing_update'); // Prevent multiple listeners
        socket.on('billing_update', (data) => {
          console.log('🔔 Real-time billing update:', data);
          const { type, invoice } = data;
          
          if (type === 'NEW_INVOICE') {
            set((state) => ({
              invoices: [invoice, ...state.invoices]
            }));
            get().fetchStats();
          } else if (type === 'STATUS_UPDATE') {
            set((state) => ({
              invoices: state.invoices.map((inv) =>
                inv._id === invoice._id ? invoice : inv
              )
            }));
            get().fetchStats();
          }
        });
      },

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

      // --- Subscription Actions ---
      subscriptionPlan: "free",
      subscriptionStatus: "active",
      subscriptionEnd: null,

      fetchSubscriptionStatus: async () => {
        try {
          set({ loading: true });
          const { data } = await api.get("/subscription/status");
          set({
            subscriptionPlan: data.plan,
            subscriptionStatus: data.status,
            subscriptionEnd: data.validUntil,
            loading: false
          });
        } catch (err) {
          console.error("Failed to fetch subscription:", err);
          set({ loading: false });
        }
      },

      initiateUpgrade: async (duration = "monthly") => {
        try {
          set({ loading: true });
          // 1. Order create
          const { data: order } = await api.post("/subscription/create-order", { plan: "pro", duration });
          
          // ✅ MOCK MODE DETECTED
          if (order.isMock) {
            set({ loading: false });
            
            // 🧪 Developer Sandbox Prompt
            const confirmed = window.confirm(
              `🧪 QueueMD Developer Sandbox\n\nWould you like to complete this simulated payment?\n\nPlan: ${order.planLabel}\nAmount: ₹${order.amount/100}\n\n✅ No real money will be charged.`
            );
            
            if (!confirmed) return;
            
            set({ loading: true });
            // Simulate payment verification
            const { data: result } = await api.post("/subscription/verify-payment", {
              razorpay_order_id: order.orderId,
              razorpay_payment_id: "mock_payment_" + Date.now(),
              razorpay_signature: "mock_signature"
            });
            
            if (result.success) {
              set({
                subscriptionPlan: "pro",
                subscriptionStatus: "active",
                subscriptionEnd: result.subscription.validUntil,
                loading: false
              });
              toast.success(result.message || "🎉 Upgrade successful! Pro features unlocked!");
              return { success: true, isMock: true };
            }
          }

          // 2. Razorpay Options
          const options = {
            key: order.key,
            amount: order.amount,
            currency: order.currency,
            name: "QueueMD Pro",
            description: `Pro Plan - ${order.planLabel}`,
            order_id: order.orderId,
            handler: async (response) => {
              try {
                const { data: result } = await api.post("/subscription/verify-payment", {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                });
                
                if (result.success) {
                  set({
                    subscriptionPlan: "pro",
                    subscriptionStatus: "active",
                    subscriptionEnd: result.subscription.validUntil,
                    loading: false
                  });
                  toast.success(result.message || "🎉 Upgrade successful!");
                  return { success: true };
                }
              } catch (err) {
                toast.error("Payment verification failed");
                set({ loading: false });
                throw err;
              }
            },
            prefill: {
              name: "QueueMD Admin",
              email: "admin@queuemd.com",
            },
            theme: { color: "#2563EB" },
            modal: {
              ondismiss: () => {
                set({ loading: false });
                toast.dismiss();
              }
            }
          };

          // Load Razorpay script if not already loaded
          if (!window.Razorpay) {
            await new Promise((resolve, reject) => {
              const script = document.createElement("script");
              script.src = "https://checkout.razorpay.com/v1/checkout.js";
              script.onload = resolve;
              script.onerror = reject;
              document.body.appendChild(script);
            });
          }

          const rzp = new window.Razorpay(options);
          rzp.open();
          
        } catch (err) {
          console.error("Upgrade failed:", err);
          set({ loading: false });
          // ✅ Show error toast
          toast.error(err.response?.data?.message || "Upgrade failed. Please try again.");
          throw err;
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
        totalInvoices: 0,
        subscriptionPlan: "free",
        subscriptionStatus: "active",
        subscriptionEnd: null
      })
    }),
    {
      name: 'billing-storage'
    }
  )
);
