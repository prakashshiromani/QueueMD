// server/sockets/notification.socket.js
const { getIO } = require("./index");
const logger = require("../utils/logger");

/**
 * ✅ Centralized Notification Emitter
 * Queue isolation (${facilityId}_${facilityType}) is left untouched for privacy.
 * This helper broadcasts notifications to a facility-wide room for oversight.
 */
const emitNotification = (facilityId, notificationData) => {
  try {
    const io = getIO();
    if (!io) {
      logger.warn("Socket.io not initialized, skipping notification emit.");
      return;
    }
    
    // 🔥 NEW ROOM PATTERN: Facility-wide but namespaced for safety
    const room = `${facilityId}_notifications`;
    
    // Emit the notification data along with its DB-generated ID and timestamps
    io.to(room).emit("notification:new", notificationData);
    
    logger.debug(`🔔 Notification broadcasted to room: ${room}`);
  } catch (err) {
    // Socket failure should NOT break the main API response or database transaction
    logger.error(`Notification socket emit failed: ${err.message}`);
  }
};

module.exports = { emitNotification };
