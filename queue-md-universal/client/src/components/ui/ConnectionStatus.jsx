import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Loader2 } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useSocketStore } from "../../store/socketStore";

export default function ConnectionStatus() {
  const { isAuthenticated } = useAuthStore();
  const { socketStatus } = useSocketStore();

  const showBanner = isAuthenticated && socketStatus !== "connected";

  const getStatusConfig = () => {
    switch (socketStatus) {
      case "connecting":
        return {
          bg: "bg-amber-500/10 dark:bg-amber-500/20",
          text: "text-amber-600 dark:text-amber-400",
          border: "border-amber-500/20 dark:border-amber-500/30",
          icon: <Loader2 className="w-4 h-4 animate-spin text-amber-500" />,
          message: "Reconnecting to server...",
        };
      case "disconnected":
      case "error":
      default:
        return {
          bg: "bg-rose-500/10 dark:bg-rose-500/20",
          text: "text-rose-600 dark:text-rose-400",
          border: "border-rose-500/20 dark:border-rose-500/30",
          icon: <WifiOff className="w-4 h-4 text-rose-500" />,
          message: "Real-time updates offline",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -50, x: "-50%", opacity: 0 }}
          animate={{ y: 0, x: "-50%", opacity: 1 }}
          exit={{ y: -50, x: "-50%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] 
                     px-4 py-2.5 rounded-full border backdrop-blur-md shadow-xl
                     flex items-center gap-2.5 text-xs font-bold tracking-wide uppercase
                     ${config.bg} ${config.text} ${config.border}`}
        >
          {config.icon}
          <span>{config.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
