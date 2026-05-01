import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getNotifications, markAllNotificationsRead } from "../services/api";

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      loading: false,
      hasMore: true,
      page: 1,

      // ✅ Load Initial Data from API
      loadNotifications: async () => {
        set({ loading: true });
        try {
          const res = await getNotifications(1, 15); // Pehli 15 fetch karo
          if (res.data.success) {
            set({
              notifications: res.data.data, 
              unreadCount: res.data.data.filter((n) => !n.isRead).length,
              loading: false,
              page: 1,
              hasMore: res.data.pagination ? res.data.pagination.hasMore : false,
            });
          }
        } catch (err) {
          console.error("Failed to load notifications", err);
          set({ loading: false });
        }
      },

      // ✅ Pagination: Load Next Page
      loadNextPage: async () => {
        const { page, notifications, loading, hasMore } = get();
        if (loading || !hasMore) return;

        set({ loading: true });
        try {
          const nextPage = page + 1;
          const res = await getNotifications(nextPage, 15);
          
          if (res.data.success) {
            const newNotifs = res.data.data;
            set({
              notifications: [...notifications, ...newNotifs],
              page: nextPage,
              hasMore: res.data.pagination ? res.data.pagination.hasMore : false,
              loading: false,
            });
          }
        } catch (err) {
          console.error("Failed to load older notifications", err);
          set({ loading: false });
        }
      },

      // ✅ Socket se Real-time Data Add Karna
      addSocketNotification: (newNotif) => {
        set((state) => {
          // Duplicate check
          const exists = state.notifications.some((n) => n._id === newNotif._id);
          if (exists) return state;

          // 🔥 Trigger Custom Premium Toast Event
          const toastEvent = new CustomEvent("notification_toast", {
            detail: { 
              message: `${newNotif.title}: ${newNotif.message.substring(0, 50)}...`, 
              type: "info" 
            }
          });
          window.dispatchEvent(toastEvent);

          return {
            notifications: [newNotif, ...state.notifications],
            unreadCount: state.unreadCount + 1,
          };
        });
      },

      // ✅ Ek notification read karna
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n._id === id ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        })),

      // ✅ Mark All Read (API + Local State Clear)
      markAllAsRead: async () => {
        try {
          await markAllNotificationsRead(); // Update backend
          set({
            notifications: [], // 🔥 Clear from UI instantly
            unreadCount: 0,
            hasMore: false, // Prevents loading older as the screen is cleared
          });
        } catch (err) {
          console.error("Mark all read failed", err);
        }
      },
    }),
    { name: "notification-storage" }
  )
);
