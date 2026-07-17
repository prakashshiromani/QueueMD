import { io } from "socket.io-client";
import { useSocketStore } from "../store/socketStore";
import { useAuthStore } from "../store/authStore";

// Use environment variable or fallback to relative URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "/";

// 🔒 SECURITY: Socket instance is created WITHOUT auth initially (VULN-04)
// Auth token is injected dynamically when connectSocket() is called after login.
// This ensures socket auth is always fresh and tied to the current session.
export const socket = io(SOCKET_URL, {
  autoConnect: false, // We manually connect after login
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000, // Exponential backoff cap (A1)
  reconnectionAttempts: Infinity, // Unlimited reconnection attempts (A1)
  transports: ["websocket", "polling"],
  withCredentials: true
});

// Connection event listeners
socket.on("connect", () => {
  useSocketStore.getState().setSocketStatus("connected");
  if (import.meta.env.DEV) {
    console.log("✅ Socket connected:", socket.id);
  }

  // A1: Room Registry pattern - Re-emit all desired rooms on reconnection
  const rooms = useSocketStore.getState().desiredRooms;
  Object.values(rooms).forEach(({ event, payload }) => {
    if (import.meta.env.DEV) {
      console.log(`[SOCKET] Re-joining room event: ${event}`, payload);
    }
    socket.emit(event, payload);
  });
});

socket.on("connect_error", (error) => {
  useSocketStore.getState().setSocketStatus("error");
  if (import.meta.env.DEV) {
    console.error("❌ Socket connection error:", error.message);
  }
});

socket.on("disconnect", (reason) => {
  useSocketStore.getState().setSocketStatus("disconnected");
  if (import.meta.env.DEV) {
    console.log("⚠️ Socket disconnected:", reason);
  }
});

// A2: stale token on reconnect_attempt
socket.on("reconnect_attempt", () => {
  const token = localStorage.getItem("token") || useAuthStore.getState().token;
  if (token) {
    socket.auth = { token };
  }
});

// 🔒 SECURITY: Handle server-side auth errors from room joins
socket.on("error", async (err) => {
  useSocketStore.getState().setSocketStatus("error");
  if (import.meta.env.DEV) {
    console.warn("🔒 Socket error:", err?.message);
  }

  // A2: Re-auth / token refresh on AUTH_REQUIRED error event
  if (err?.code === 'AUTH_REQUIRED') {
    try {
      const { refreshAccessToken } = await import("./api");
      const newToken = await refreshAccessToken();
      if (newToken) {
        socket.auth = { token: newToken };
        // Disconnect and reconnect with new credentials
        socket.disconnect().connect();
      }
    } catch (refreshErr) {
      console.error("[SOCKET] Failed to refresh token for socket re-auth:", refreshErr);
    }
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
    useSocketStore.getState().setSocketStatus("connecting");
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
