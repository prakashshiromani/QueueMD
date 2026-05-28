// src/components/notifications/NotificationCard.jsx
import { motion } from "framer-motion";
import { Bell, Check, Calendar, FlaskConical, CreditCard, Settings } from "lucide-react";
import { useNotificationStore } from "../../store/notificationStore";
import { FACILITY_TYPES } from "../../utils/facilityTypeConfig"; // ✅ Config Sync

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

  // ✅ Dynamic Config Lookup for Department Badge
  const config = FACILITY_TYPES[notification.facilityType] || FACILITY_TYPES.clinic;

  // ✅ Format old-style "Token #308" → "Token #TKN-308" for backward compat
  const formatNotificationMessage = (message) => {
    if (!message) return message;
    const prefix = config.tokenPrefix || "TKN";
    // Match: "Token #<digits>" but NOT already-prefixed "Token #TKN-308"
    return message.replace(/Token #(\d+)(?!-)/g, (_, num) => {
      return `Token #${prefix}-${String(num).padStart(3, '0')}`;
    });
  };

  // ✅ Safe Badge Styling (Tailwind dynamic classes avoid karne ke liye inline style)
  const badgeStyle = {
    backgroundColor: `${config.theme.primary}20`, // 20% opacity
    borderColor: `${config.theme.primary}40`,
    color: config.theme.primary,
  };

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
        relative flex items-start gap-5 p-6 rounded-2xl cursor-pointer transition-all duration-300 border
        ${notification.isRead 
          ? "bg-white border-slate-200 dark:bg-slate-900/40 dark:border-white/5 shadow-sm" // Read state
          : "bg-blue-50 border-blue-200 shadow-md dark:bg-slate-800/60 dark:border-blue-500/30 dark:shadow-[0_0_15px_rgba(59,130,246,0.15)]" // Unread state
        }
        backdrop-blur-md hover:border-blue-300 hover:shadow-lg dark:hover:border-blue-400/50 dark:hover:shadow-[0_0_25px_rgba(59,130,246,0.3)]
      `}
    >
      {/* ✅ Dot Indicator for Unread */}
      {!notification.isRead && (
        <span className="absolute top-5 left-5 w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]" />
      )}

      {/* Icon Container */}
      <div className={`p-4 rounded-xl border ${notification.isRead ? 'bg-slate-50 border-slate-200' : 'bg-white border-blue-100'} dark:bg-slate-900/80 dark:border-white/10`}>
        <Icon className={`w-6 h-6 ${notification.isRead ? 'text-slate-400 dark:text-blue-400/50' : 'text-blue-600 dark:text-blue-400'}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0"> 
        <div className="flex justify-between items-start gap-4">
          <h4 className={`text-lg font-semibold truncate ${notification.isRead ? "text-slate-500 dark:text-slate-400" : "text-slate-900 dark:text-white"}`}>
            {notification.title}
          </h4>
          
          {/* Top Right: Time and Badge */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className={`text-sm whitespace-nowrap ${notification.isRead ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'}`}>
              {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span 
              className="px-3 py-1 text-xs font-semibold rounded-full border flex items-center gap-1.5 tracking-wide shadow-sm whitespace-nowrap dark:backdrop-blur-md"
              style={badgeStyle}
            >
              <span className="text-base leading-none">{config.icon}</span> {config.label}
            </span>
          </div>
        </div>
        <p className={`text-sm mt-1.5 line-clamp-2 leading-relaxed ${notification.isRead ? 'text-slate-500 dark:text-slate-500' : 'text-slate-600 dark:text-slate-400'}`}>{formatNotificationMessage(notification.message)}</p>
      </div>
    </motion.div>
  );
}
