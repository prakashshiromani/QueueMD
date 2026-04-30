// server/sockets/appointment.socket.js
const { getIO } = require("./index"); // Adjust path
const logger = require("../utils/logger");

const emitAppointmentUpdate = (facilityId, facilityType, data) => {
  try {
    const io = getIO();
    const room = `${facilityId}_${facilityType}`;
    io.to(room).emit("appointment_update", {
      facilityId, facilityType,
      ...data
    });
  } catch (err) {
    logger.error(`Socket emit error: ${err.message}`);
  }
};

module.exports = { emitAppointmentUpdate };
