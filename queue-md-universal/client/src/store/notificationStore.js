import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getNotifications, markAllNotificationsRead } from "../services/api";
import { socket } from "../services/socket";
import toast from "react-hot-toast";

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
              notifications: res.data.data.notifications || res.data.data, // adapt in case backend sends direct array
              unreadCount: (res.data.data.notifications || res.data.data).filter((n) => !n.isRead).length,
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

      // ✅ Socket se Real-time Data Add Karna
      addSocketNotification: (newNotif) => {
        set((state) => {
          // Duplicate check
          const exists = state.notifications.some((n) => n._id === newNotif._id);
          if (exists) return state;

          // Trigger toast
          toast.success(`New Alert: ${newNotif.title || 'Notification received'}`);

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

      // ✅ Mark All Read (API + Local State)
      markAllAsRead: async () => {
        try {
          await markAllNotificationsRead();
          set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
            unreadCount: 0,
          }));
        } catch (err) {
          console.error("Mark all read failed", err);
        }
      },
    }),
    { name: "notification-storage" }
  )
);
