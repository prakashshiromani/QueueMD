import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useNotificationStore } from "../store/notificationStore";
import { useAuthStore } from "../store/authStore";
import { connectSocket, socket } from "../services/socket";
import NotificationCard from "../components/notifications/NotificationCard";
import Layout from "../components/Layout";
import AnimatePage from "../components/AnimatePage";

// ✅ Skeleton Loader Component
const Skeleton = () => (
  <div className="h-20 bg-slate-800/30 rounded-xl animate-pulse mb-4 border border-white/5" />
);

// ✅ Empty State Component
const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center justify-center py-12 text-center"
  >
    <motion.div
      animate={{ rotate: [0, 10, -10, 0] }}
      transition={{ repeat: Infinity, duration: 3 }}
      className="p-6 bg-slate-800/50 rounded-full mb-4"
    >
      <Bell className="w-10 h-10 text-slate-500" />
    </motion.div>
    <h3 className="text-lg font-medium text-slate-300">No new notifications</h3>
    <p className="text-sm text-slate-500 mt-1">You're all caught up! Relax.</p>
  </motion.div>
);

export default function Notifications() {
  const { 
    notifications, 
    loading, 
    hasMore, 
    loadNotifications, 
    markAllAsRead, 
    addSocketNotification,
    unreadCount 
  } = useNotificationStore();
  
  const { user } = useAuthStore(); // Current logged in user
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    // 1. Data Load
    loadNotifications();

    // 2. Socket Connect (Agar user login hai)
    if (user && user.facilityId && user.facilityType) {
      connectSocket(user.facilityId, user.facilityType);

      // 🔥 Listener Setup
      socket.on("notification:new", (data) => {
        addSocketNotification(data);
      });
    }

    // Cleanup
    return () => {
      socket.off("notification:new");
    };
  }, [user, loadNotifications, addSocketNotification]); 

  const handleMarkAll = () => {
    markAllAsRead();
  };

  return (
    <Layout>
      <AnimatePage className="w-full max-w-2xl mx-auto py-6 relative">
        {/* 🔥 Background Glow Effect */}
        <div className="absolute top-0 left-0 w-full h-96 bg-blue-600/10 blur-[120px] pointer-events-none" />

        {/* Header */}
        <div className="relative flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
              Notifications
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Stay updated with your facility activity.
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm font-medium transition-all border border-blue-500/30"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="space-y-4">
          {notifications.length === 0 && !loading ? (
            <EmptyState />
          ) : (
            <>
              <AnimatePresence mode="popLayout">
                {notifications.map((notif) => (
                  <NotificationCard key={notif._id} notification={notif} />
                ))}
              </AnimatePresence>

              {/* Loading Skeletons */}
              {loading && (
                <div className="space-y-4 mt-4">
                  <Skeleton />
                  <Skeleton />
                  <Skeleton />
                </div>
              )}
            </>
          )}
        </div>

        {/* Load Older Button */}
        {hasMore && notifications.length > 0 && (
          <div className="mt-8 text-center">
            <button
              disabled={loadingMore}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-all border border-white/10 disabled:opacity-50 text-white"
              onClick={() => {
                setLoadingMore(true);
                setTimeout(() => setLoadingMore(false), 1000); // API Logic yahan aayega (Step 3)
              }}
            >
              {loadingMore ? <Loader2 className="w-4 h-4 animate-spin mx-auto text-blue-400" /> : "Load Older Notifications"}
            </button>
          </div>
        )}
      </AnimatePage>
    </Layout>
  );
}
