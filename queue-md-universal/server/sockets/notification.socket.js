// server/sockets/notification.socket.js
const { getIO, getRoomHash } = require("./index");
const logger = require("../utils/logger");

/**
 * Centralized Notification Emitter
 * Broadcasts notifications to a facility-wide hashed room for oversight.
 */
const emitNotification = (facilityId, notificationData) => {
  try {
    const io = getIO();
    if (!io) {
      logger.warn("Socket.io not initialized, skipping notification emit.");
      return;
    }
    
    // 🔒 SECURITY: Hash internal room name to prevent predictable room enumeration sniffing (Item 6)
    const room = getRoomHash(facilityId, 'notifications');
    
    // Emit the notification data along with its DB-generated ID and timestamps
    io.to(room).emit("notification:new", notificationData);
    
    logger.debug(`🔔 Notification broadcasted to room: ${room}`);
  } catch (err) {
    // Socket failure should NOT break the main API response or database transaction
    logger.error(`Notification socket emit failed: ${err.message}`);
  }
};

module.exports = { emitNotification };
