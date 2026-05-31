const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
let io;

const initSocket = (server) => {
  if (io) return io; // Prevent multiple initializations

  io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? process.env.CLIENT_URL // 🔒 SECURITY: Production mein only CLIENT_URL allow (VULN-11)
        : [process.env.CLIENT_URL || "http://localhost:5173", "http://localhost:5173", "http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // 🔒 SECURITY: JWT Authentication Middleware for all socket connections (VULN-04, L-07)
  // Every socket connection MUST carry a valid JWT token in handshake.auth.token
  io.use((socket, next) => {
    // Public tracking room connections do not need auth (they use public endpoints)
    // But all facility/notification rooms require a valid token
    const token = socket.handshake.auth?.token;

    if (!token) {
      // Allow connection but mark as unauthenticated (for public tracking only)
      socket.isAuthenticated = false;
      socket.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.isAuthenticated = true;
      socket.user = {
        id: decoded.id,
        facilityId: String(decoded.facilityId),
        facilityType: decoded.facilityType,
        role: decoded.role
      };
      next();
    } catch (err) {
      // Invalid token — allow as unauthenticated (for public room only)
      socket.isAuthenticated = false;
      socket.user = null;
      next();
    }
  });

  io.on("connection", (socket) => {
    // 🔒 SECURITY: Room Join with Facility Ownership Verification (VULN-04)
    // Legacy join_facility event kept for backward compatibility
    socket.on("join_facility", ({ facilityId, facilityType }) => {
      if (!socket.isAuthenticated || !socket.user) {
        return socket.emit("error", { message: "Authentication required to join facility room" });
      }
      // Verify user actually belongs to this facility (prevent cross-tenant spying)
      if (String(socket.user.facilityId) !== String(facilityId)) {
        return socket.emit("error", { message: "Unauthorized: You cannot join another facility's room" });
      }
      // 🔒 SECURITY: Hash internal room name to prevent predictable room enumeration (Item 6)
      const room = getRoomHash(facilityId, facilityType);
      socket.join(room);
    });

    // 🔒 SECURITY (LP-01 Fix): Branch-scoped room join event.
    // Clients join the global facility room AND an optional branch-specific room.
    // Server emits full PII only to the branch room; global room gets sanitized data only.
    socket.on("join_facility_branch", ({ facilityId, facilityType, branchId }) => {
      if (!socket.isAuthenticated || !socket.user) {
        return socket.emit("error", { message: "Authentication required to join facility room" });
      }
      if (String(socket.user.facilityId) !== String(facilityId)) {
        return socket.emit("error", { message: "Unauthorized: You cannot join another facility's room" });
      }

      // Join the global facility room (receives sanitized, PII-free updates)
      const globalRoom = getRoomHash(facilityId, facilityType);
      socket.join(globalRoom);

      // Also join the branch-specific room if a branch is selected (receives full patient data)
      if (branchId && branchId !== 'null' && branchId !== '') {
        const branchRoom = getRoomHash(facilityId, facilityType, branchId);
        socket.join(branchRoom);
      }
    });

    // 🔒 SECURITY: Notification Room with Auth Check (VULN-04)
    socket.on("join_notifications", ({ facilityId }) => {
      if (!socket.isAuthenticated || !socket.user) {
        return socket.emit("error", { message: "Authentication required to receive notifications" });
      }
      if (String(socket.user.facilityId) !== String(facilityId)) {
        return socket.emit("error", { message: "Unauthorized: You cannot join another facility's notification room" });
      }
      // 🔒 SECURITY: Hash internal room name (Item 6)
      const room = getRoomHash(facilityId, 'notifications');
      socket.join(room);
    });

    // 🌍 Public Tracking Room — No auth required (patients use this without login)
    socket.on("join_public_room", ({ facilityId }) => {
      // Basic input validation
      if (!facilityId || typeof facilityId !== 'string' || facilityId.length > 50) {
        return socket.emit("error", { message: "Invalid facility ID" });
      }
      // 🔒 SECURITY: Hash public room name (Item 6)
      const room = getRoomHash(facilityId, 'public');
      socket.join(room);
    });

    socket.on("disconnect", (reason) => {
      // No console.log in production — use logger
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket not initialized! Call initSocket(server) first in server.js");
  }
  return io;
};

// 🔒 SECURITY: Cryptographically secure room hashing — prevents predictable room enumeration (Item 6)
// LP-01 Fix: Now supports optional branchId for branch-scoped rooms.
const getRoomHash = (facilityId, suffix = "", branchId = null) => {
  const crypto = require("crypto");
  const secret = process.env.JWT_SECRET || "fallback_salt_value_123";
  const hashInput = branchId
    ? `${String(facilityId).trim()}_${String(suffix).trim()}_${String(branchId).trim()}`
    : `${String(facilityId).trim()}_${String(suffix).trim()}`;
  return crypto.createHmac("sha256", secret).update(hashInput).digest("hex");
};

module.exports = { initSocket, getIO, getRoomHash };
