import { io } from "socket.io-client";

// Use environment variable or fallback to relative URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "/"; 

// Create a singleton instance
export const socket = io(SOCKET_URL, {
  autoConnect: false, // Hum manually connect karenge login ke baad
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  transports: ["websocket", "polling"], // ✅ Order matters
  withCredentials: true
});

// ✅ Connection event listeners
socket.on("connect", () => {
  console.log("✅ Socket connected:", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("❌ Socket connection error:", error.message);
});

socket.on("disconnect", (reason) => {
  console.log("⚠️ Socket disconnected:", reason);
});

// Helper functions (for compatibility)
// Helper functions
let currentConnectHandler = null;

export const connectSocket = (facilityId, facilityType) => {
  if (!socket.connected) {
    socket.connect();
    
    // 🔥 Remove previous listener to prevent duplicate triggers, without killing other listeners
    if (currentConnectHandler) {
      socket.off("connect", currentConnectHandler);
    }
    
    currentConnectHandler = () => {
      console.log("🔌 Socket Connected:", socket.id);
      
      // 🔥 Queue Room (Department Isolation)
      socket.emit("join_facility", { facilityId, facilityType });
      
      // 🔥 NEW: Notification Room (Centralized View)
      socket.emit("join_notifications", { facilityId });
      
      console.log(`🏥 Joined Room: ${facilityId}_${facilityType}`);
      console.log(`🔔 Joined Notification Room: ${facilityId}_notifications`);
    };

    socket.on("connect", currentConnectHandler);
  } else if (facilityId && facilityType) {
    // If already connected, join both rooms
    socket.emit("join_facility", { facilityId, facilityType });
    socket.emit("join_notifications", { facilityId });
    console.log(`🏥 Already connected. Joined Queue & Notification Rooms`);
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
