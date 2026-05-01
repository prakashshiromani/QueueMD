import { io } from "socket.io-client";

// Use a relative URL to leverage the Vite proxy (defined in vite.config.js)
const SOCKET_URL = "/"; 

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
export const connectSocket = (facilityId, facilityType) => {
  if (!socket.connected) {
    socket.connect();
    
    // 🔥 Remove previous listeners to prevent duplicate triggers
    socket.off("connect");
    
    socket.on("connect", () => {
      console.log("🔌 Socket Connected:", socket.id);
      
      // 🔥 CRITICAL: Join Facility-Specific Room
      const room = `${facilityId}_${facilityType}`;
      socket.emit("join_facility", { facilityId, facilityType });
      console.log(`🏥 Joined Room: ${room}`);
    });
  } else if (facilityId && facilityType) {
    // If already connected, just join the room
    const room = `${facilityId}_${facilityType}`;
    socket.emit("join_facility", { facilityId, facilityType });
    console.log(`🏥 Already connected. Joined Room: ${room}`);
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
