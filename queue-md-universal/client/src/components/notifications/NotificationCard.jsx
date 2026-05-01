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
          ? "bg-slate-900/40 border-white/5" // Read state (dull)
          : "bg-slate-800/60 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]" // Unread state (Glowing)
        }
        backdrop-blur-md hover:border-blue-400/50 hover:shadow-[0_0_25px_rgba(59,130,246,0.3)]
      `}
    >
      {/* ✅ Dot Indicator for Unread */}
      {!notification.isRead && (
        <span className="absolute top-5 left-5 w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]" />
      )}

      {/* Icon Container */}
      <div className={`p-4 rounded-xl bg-slate-900/80 border border-white/10`}>
        <Icon className="w-6 h-6 text-blue-400" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0"> 
        <div className="flex justify-between items-start gap-4">
          <h4 className={`text-lg font-semibold truncate ${notification.isRead ? "text-slate-400" : "text-white"}`}>
            {notification.title}
          </h4>
          
          {/* Top Right: Time and Badge */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-sm text-slate-500 whitespace-nowrap">
              {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span 
              className="px-3 py-1 text-xs font-semibold rounded-full border backdrop-blur-md flex items-center gap-1.5 tracking-wide shadow-sm"
              style={badgeStyle}
            >
              <span className="text-base leading-none">{config.icon}</span> {config.label}
            </span>
          </div>
        </div>
        <p className="text-sm text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{notification.message}</p>
      </div>
    </motion.div>
  );
}
