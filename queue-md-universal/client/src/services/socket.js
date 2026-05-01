import { io } from "socket.io-client";

// Ensure this matches your backend URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

// Create a singleton instance
export const socket = io(SOCKET_URL, {
  autoConnect: true,
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
export const connectSocket = () => { if (!socket.connected) socket.connect(); };
export const disconnectSocket = () => { if (socket.connected) socket.disconnect(); };
export const joinFacilityRoom = (facilityId, facilityType) => {
  if (socket.connected) {
    socket.emit("join_facility", { facilityId, facilityType });
  }
};
