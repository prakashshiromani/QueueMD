import { io } from "socket.io-client";

// Use environment variable or fallback to relative URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "/";

// 🔒 SECURITY: Socket instance is created WITHOUT auth initially (VULN-04)
// Auth token is injected dynamically when connectSocket() is called after login.
// This ensures socket auth is always fresh and tied to the current session.
export const socket = io(SOCKET_URL, {
  autoConnect: false, // We manually connect after login
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  transports: ["websocket", "polling"],
  withCredentials: true
});

// Connection event listeners
socket.on("connect", () => {
  // Intentionally minimal — no sensitive info logged in production
  if (import.meta.env.DEV) {
    console.log("✅ Socket connected:", socket.id);
  }
});

socket.on("connect_error", (error) => {
  if (import.meta.env.DEV) {
    console.error("❌ Socket connection error:", error.message);
  }
});

socket.on("disconnect", (reason) => {
  if (import.meta.env.DEV) {
    console.log("⚠️ Socket disconnected:", reason);
  }
});

// 🔒 SECURITY: Handle server-side auth errors from room joins
socket.on("error", (err) => {
  if (import.meta.env.DEV) {
    console.warn("🔒 Socket error:", err?.message);
  }
});

let currentConnectHandler = null;

/**
 * Connect socket with JWT auth token for secure room joins.
 * @param {string} facilityId
 * @param {string} facilityType
 * @param {string} accessToken - JWT token from localStorage/store (required for auth)
 */
export const connectSocket = (facilityId, facilityType, accessToken) => {
  // 🔒 SECURITY: Inject auth token into socket handshake (VULN-04)
  // This token is verified by the server's JWT middleware before any room join is allowed.
  if (accessToken) {
    socket.auth = { token: accessToken };
  }

  if (!socket.connected) {
    socket.connect();

    // Remove previous handler to prevent duplicate triggers
    if (currentConnectHandler) {
      socket.off("connect", currentConnectHandler);
    }

    currentConnectHandler = () => {
      // 🔥 Queue Room (Department Isolation) — server verifies facilityId ownership
      socket.emit("join_facility", { facilityId, facilityType });

      // 🔥 Notification Room — server verifies facilityId ownership
      socket.emit("join_notifications", { facilityId });
    };

    socket.on("connect", currentConnectHandler);
  } else if (facilityId && facilityType) {
    // If already connected, join rooms
    socket.emit("join_facility", { facilityId, facilityType });
    socket.emit("join_notifications", { facilityId });
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
    socket.auth = {}; // 🔒 SECURITY: Clear auth on disconnect
  }
};
