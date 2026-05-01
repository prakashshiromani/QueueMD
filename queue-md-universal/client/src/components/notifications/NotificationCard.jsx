// src/components/notifications/NotificationCard.jsx
import { motion } from "framer-motion";
import { Bell, Check, Calendar, FlaskConical, CreditCard, Settings } from "lucide-react";
import { useNotificationStore } from "../../store/notificationStore";

// 🎨 Icons Map
const IconMap = {
  appointment: Calendar,
  lab_report: FlaskConical,
  payment: CreditCard,
  system: Settings,
  default: Bell,
};

export default function NotificationCard({ notification }) {
  const { markAsRead } = useNotificationStore();
  const Icon = IconMap[notification.type] || IconMap.default;

  // Click karne par Read karna + Glow effect hatana
  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100 }}
      whileHover={{ scale: 1.02 }} // ✅ Hover Effect: Zoom
      onClick={handleClick}
      className={`
        relative flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 border
        ${notification.isRead 
          ? "bg-slate-900/40 border-white/5" // Read state (dull)
          : "bg-slate-800/60 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]" // Unread state (Glowing)
        }
        backdrop-blur-md hover:border-blue-400/50 hover:shadow-[0_0_25px_rgba(59,130,246,0.3)]
      `}
    >
      {/* ✅ Dot Indicator for Unread */}
      {!notification.isRead && (
        <span className="absolute top-4 left-4 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]" />
      )}

      {/* Icon Container */}
      <div className={`p-3 rounded-lg bg-slate-900/80 border border-white/10`}>
        <Icon className="w-5 h-5 text-blue-400" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h4 className={`text-sm font-semibold truncate ${notification.isRead ? "text-slate-400" : "text-white"}`}>
            {notification.title}
          </h4>
          <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
            {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{notification.message}</p>
      </div>
    </motion.div>
  );
}
