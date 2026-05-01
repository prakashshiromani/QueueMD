import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      loading: false,
      page: 1,
      hasMore: true,
      lastFetchedId: null,

      // ✅ New Notification aane par (Socket se)
      addNotification: (newNotif) =>
        set((state) => ({
          notifications: [newNotif, ...state.notifications], // Sabse upar dikhao
          unreadCount: state.unreadCount + 1,
        })),

      // ✅ Ek notification read karna
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n._id === id ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        })),

      // ✅ Sab read karna
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        })),

      // ✅ Naye Data Fetch karna (Load Older Button ke liye)
      setLoading: (loading) => set({ loading }),
      setPage: (page) => set({ page }),
      setHasMore: (val) => set({ hasMore: val }),
      appendNotifications: (newData) =>
        set((state) => ({
          notifications: [...state.notifications, ...newData],
        })),
    }),
    { name: "notification-storage" } // LocalStorage me save rahega
  )
);
