const { Server } = require("socket.io");
let io;

const initSocket = (server) => {
  if (io) return io; // Prevent multiple initializations

  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true
    },
    transports: ["websocket", "polling"], // ✅ Both transports
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on("connection", (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // ✅ Room Join Logic
    socket.on("join_facility", ({ facilityId, facilityType }) => {
      const room = `${facilityId}_${facilityType}`;
      socket.join(room);
      console.log(`🏥 Socket ${socket.id} joined room: ${room}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`❌ Client disconnected: ${socket.id} | Reason: ${reason}`);
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

module.exports = { initSocket, getIO };
