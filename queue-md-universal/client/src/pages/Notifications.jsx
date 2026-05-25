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
  <div className="h-24 bg-slate-200 dark:bg-slate-800/30 rounded-2xl animate-pulse mb-4 border border-slate-300 dark:border-white/5" />
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
      className="p-6 bg-slate-100 dark:bg-slate-800/50 rounded-full mb-4"
    >
      <Bell className="w-10 h-10 text-slate-400 dark:text-slate-500" />
    </motion.div>
    <h3 className="text-lg font-medium text-slate-800 dark:text-slate-300">No new notifications</h3>
    <p className="text-sm text-slate-500 mt-1">You're all caught up! Relax.</p>
  </motion.div>
);

export default function Notifications() {
  const { 
    notifications, 
    loading, 
    hasMore, 
    loadNotifications, 
    loadNextPage,
    markAllAsRead, 
    addSocketNotification,
    unreadCount 
  } = useNotificationStore();
  
  const { user } = useAuthStore(); 

  useEffect(() => {
    // 1. Initial Data Load
    loadNotifications();

    // 2. Socket Connect & Listener Setup
    if (user?.facilityId && user?.facilityType) {
      connectSocket(user.facilityId, user.facilityType);

      // 🔥 Real-time Listener (Centralized Facility Room)
      const handleNewNotification = (data) => {
        addSocketNotification(data);
      };
      
      socket.on("notification:new", handleNewNotification);

      return () => {
        socket.off("notification:new", handleNewNotification);
      };
    }
  }, [user, loadNotifications, addSocketNotification]); 

  const handleMarkAll = () => {
    markAllAsRead();
  };

  return (
    <Layout>
      <AnimatePage className="w-full max-w-4xl mx-auto py-8 relative">
        {/* 🔥 Background Glow Effect */}
        <div className="absolute top-0 left-0 w-full h-96 bg-blue-600/10 blur-[120px] pointer-events-none" />

        {/* Header */}
        <div className="relative flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent tracking-tight">
              Notifications
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base mt-1.5">
              Centralized alerts across all your facility departments.
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 dark:text-blue-400 rounded-xl text-sm font-semibold transition-all border border-blue-200 dark:border-blue-500/30 shadow-sm dark:shadow-lg"
            >
              <CheckCheck className="w-5 h-5" />
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="space-y-5">
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
                <div className="space-y-5 mt-5">
                  <Skeleton />
                  <Skeleton />
                  <Skeleton />
                </div>
              )}
            </>
          )}
        </div>

        {/* 🔥 Load Older Button (Phase 4 Functional) */}
        {hasMore && notifications.length > 0 && (
          <div className="mt-12 text-center">
            <button
              disabled={loading}
              className="group relative px-10 py-4 bg-white hover:bg-slate-50 text-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-700/60 dark:text-white rounded-2xl text-base font-semibold transition-all border border-slate-200 dark:border-white/10 disabled:opacity-50 overflow-hidden shadow-sm dark:shadow-2xl"
              onClick={() => loadNextPage()}
            >
              {/* Hover Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-600/20 dark:to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <span className="relative flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                    <span>Loading alerts...</span>
                  </>
                ) : (
                  "Load Older Notifications"
                )}
              </span>
            </button>
          </div>
        )}
      </AnimatePage>
    </Layout>
  );
}
