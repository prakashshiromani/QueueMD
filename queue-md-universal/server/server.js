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
const appointmentRoutes = require("./routes/appointment.routes");
const labRoutes = require("./routes/lab.routes");
const notificationRoutes = require("./routes/notification.routes");
const billingRoutes = require("./routes/billing.routes");
const subscriptionRoutes = require("./routes/subscription.routes");
const ticketRoutes = require("./routes/ticket.routes");
const uploadRoutes = require("./routes/upload.routes");
const visitRoutes = require("./routes/visit.routes");
const auditLogRoutes = require("./routes/auditLog.routes");

const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app);

// 🔒 SECURITY: trust proxy for correct IP resolution behind reverse proxies (VULN-05)
// This ensures req.ip returns the real client IP, not the proxy IP
// Only trust 1 hop (your direct proxy). Do NOT set to 'true' (trusts all).
app.set('trust proxy', 1);

// Security Headers with enhanced CSP (L-08, Item 2)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", "https://api.razorpay.com", "wss:", "ws:", process.env.CLIENT_URL || ""].filter(Boolean),
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Keep false for Cloudinary image loading
}));

// 🔒 SECURITY: Environment-aware CORS with strict allowed origins array (VULN-11, Item 1)
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(",")
  : (process.env.NODE_ENV === 'production' 
     ? ['https://queuemd-client.com', 'https://admin.queuemd.com'] 
     : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174']);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const isProduction = process.env.NODE_ENV === 'production';
    const isClientUrl = process.env.CLIENT_URL && origin === process.env.CLIENT_URL;

    if (isProduction) {
      // Production: ONLY allow configured allowed origins
      if (allowedOrigins.includes(origin) || isClientUrl) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy blocked this request"), false);
    } else {
      // Development: allow localhost origins + allowed origins
      const isLocalhost = origin.startsWith("http://localhost:") || origin === "http://localhost" || origin.startsWith("http://127.0.0.1:");
      if (isLocalhost || allowedOrigins.includes(origin) || isClientUrl) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy blocked this request"), false);
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true
}));

// 🔒 SECURITY: Global NoSQL Injection Prevention middleware (Item 3)
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize({ replaceWith: '_' }));

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser());

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
app.use("/api/appointments", appointmentRoutes);
app.use("/api/lab", labRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/audit-logs", auditLogRoutes);

// Public Routes
const publicRoutes = require("./routes/publicRoutes");
app.use("/api/public", publicRoutes);

// Lobby Routes
const lobbyRoutes = require("./routes/lobby.routes");
app.use("/api/lobby", lobbyRoutes);

// Patient secure upload routes
const patientUploadRoutes = require("./routes/patientUpload.routes");
app.use("/api/patient", patientUploadRoutes);


// 📄 Swagger API Documentation
require('./config/swagger')(app);

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

    // Calibrate system time offset
    const { syncTimeOffset } = require("./utils/timeSync");
    await syncTimeOffset();

    // Start Subscription Expiry Cron Job
    const { startSubscriptionExpiryCron } = require("./jobs/subscriptionExpiryCron");
    startSubscriptionExpiryCron();

    // Start Directory Sync Cron Job
    const { startDirectorySyncCron } = require("./jobs/directorySync.job");
    startDirectorySyncCron();

    // Start Data Retention Cron Job (Item 6)
    const { startDataRetentionCron } = require("./jobs/dataRetention.job");
    startDataRetentionCron();

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

// Only start server in non-test environments
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

// Export app for testing
module.exports = app;
