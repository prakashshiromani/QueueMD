require("dotenv").config();
const logger = require("./utils/logger");

process.on("uncaughtException", (err) => {
  logger.error(`🔥 UNCAUGHT EXCEPTION! Shutting down... ${err.name}: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  logger.error(`🔥 UNHANDLED REJECTION! Shutting down... ${err.name}: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

const express = require("express");
const cors = require("cors");
const http = require("http");

const { initSocket } = require("./sockets/index");
const errorHandler = require("./middleware/error.middleware");

// Import Feature Routes
const authRoutes = require("./routes/auth.routes");
const facilityRoutes = require("./routes/facility.routes");
const queueRoutes = require("./routes/queue.routes");
const userRoutes = require("./routes/user.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const patientRoutes = require("./routes/patient.routes");

const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app);

// Configuration
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Request Logger Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`📥 ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Basic Health Routes
app.get("/", (req, res) => {
  res.json({ 
    message: "🚀 QueueMD API is Running",
    version: "3.2",
    status: "OK"
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "QueueMD Server Running", environment: process.env.NODE_ENV });
});

// Mounted Routes
app.use("/api/auth", authRoutes);
app.use("/api/facility", facilityRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/user", userRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/patients", patientRoutes);

// Global Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Server Startup Logic
const startServer = async () => {
  try {
    console.log("🛠️ Starting server...");
    
    // 1. Connect to Database
    console.log("🔌 Connecting to MongoDB...");
    await connectDB();
    console.log("✅ MongoDB Connected");

    // 2. Initialize Socket.IO
    console.log("🔌 Initializing Socket.IO...");
    initSocket(server);
    console.log("✅ Socket.IO Initialized");

    // 3. Start listening
    console.log(`🔌 Starting HTTP listener on port ${PORT}...`);
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📅 Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(`🟢 MongoDB Connected | ⚡ Server running on port ${PORT} | 🟢 Socket Initialized`);
    });

  } catch (error) {
    console.error(`❌ Startup Error: ${error.message}`);
    logger.error(`❌ Startup Error: ${error.message}`);
    process.exit(1); 
  }
};

startServer();
