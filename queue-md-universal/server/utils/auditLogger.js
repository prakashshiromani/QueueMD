const AuditLog = require("../models/AuditLog");
const logger = require("./logger");

/**
 * Creates a security audit log entry.
 * 
 * @param {Object} req - The Express Request object (to extract IP and User-Agent)
 * @param {Object} data - Log parameters
 * @param {string} data.action - Action name (e.g., 'LOGIN_SUCCESS', 'LOGIN_FAILED')
 * @param {string} [data.facilityId] - Target facility ID
 * @param {string} [data.userId] - User ID who performed the action
 * @param {string} [data.userEmail] - Email of the user
 * @param {string} [data.userName] - Name of the user
 * @param {string} [data.userRole] - Role of the user
 * @param {Object} [data.details] - Any extra JSON data
 * @param {string} [data.severity] - 'info', 'warning', 'critical'
 * @param {string} [data.status] - 'success', 'failed'
 */
exports.logAudit = async (req, data = {}) => {
  try {
    const {
      action,
      details = {},
      severity = "info",
      status = "success"
    } = data;

    let ipAddress = "";
    let userAgent = "";

    if (req) {
      // Extract IP address (handles reverse proxies, local node sockets, standard headers)
      ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip || "";
      if (ipAddress.includes(",")) {
        // Grab first IP in list if multiple
        ipAddress = ipAddress.split(",")[0].trim();
      }
      // Normalize IPv6 loopback mapping
      if (ipAddress.startsWith("::ffff:")) {
        ipAddress = ipAddress.substring(7);
      } else if (ipAddress === "::1") {
        ipAddress = "127.0.0.1";
      }
      userAgent = req.headers["user-agent"] || "";
    }

    let facilityId = data.facilityId || req?.user?.facilityId || null;
    let userId = data.userId || req?.user?.id || null;
    let userEmail = data.userEmail || req?.user?.email || req?.body?.email || "";
    let userName = data.userName || req?.user?.name || "";
    let userRole = data.userRole || req?.user?.role || "";

    const User = require("../models/User");

    // Enrich logs based on email if details are missing (e.g., during login attempts)
    if (userEmail && (!facilityId || !userId || !userName || !userRole)) {
      const user = await User.findOne({ email: userEmail.toLowerCase() }).select("facilityId name role");
      if (user) {
        if (!facilityId) facilityId = user.facilityId;
        if (!userId) userId = user._id;
        if (!userName) userName = user.name;
        if (!userRole) userRole = user.role;
      }
    }

    // Enrich logs based on userId if details are missing
    if (userId && (!facilityId || !userEmail || !userName || !userRole)) {
      const user = await User.findById(userId).select("facilityId name email role");
      if (user) {
        if (!facilityId) facilityId = user.facilityId;
        if (!userEmail) userEmail = user.email;
        if (!userName) userName = user.name;
        if (!userRole) userRole = user.role;
      }
    }

    if (!facilityId) {
      // If we still don't have facilityId, we cannot log it in multi-tenant isolation logs.
      // But we can log to server log as warning.
      logger.warn(`[AUDIT LOG BYPASS] Action: ${action} for email: ${userEmail || 'Unknown'} has no facility association. Skipped DB save.`);
      return null;
    }

    const logEntry = await AuditLog.create({
      facilityId,
      action,
      userId: userId || null,
      userEmail: userEmail || "unknown",
      userName: userName || "Unknown User",
      userRole: userRole || "guest",
      ipAddress,
      userAgent,
      details,
      severity,
      status
    });

    logger.info(`[AUDIT RECORDED] [${severity.toUpperCase()}] ${action} | User: ${userEmail || 'unknown'} | IP: ${ipAddress} | Status: ${status}`);
    return logEntry;
  } catch (error) {
    logger.error(`[AUDIT LOGGER ERROR] Failed to record audit log: ${error.message}`, { error });
    return null;
  }
};
