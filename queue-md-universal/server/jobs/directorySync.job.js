const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const logger = require('../utils/logger');

const syncDirectory = async () => {
  try {
    logger.info('⏰ Running Directory Sync Job...');
    
    // Get end of today
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Find appointments where pendingDirectorySync = true AND appointmentDate <= today
    const appointments = await Appointment.find({
      pendingDirectorySync: true,
      appointmentDate: { $lte: todayEnd }
    });

    if (appointments.length === 0) {
      logger.info('✅ Directory Sync: No pending appointments to sync today.');
      return;
    }

    logger.info(`🔍 Directory Sync: Found ${appointments.length} appointments pending directory sync.`);

    let syncedCount = 0;
    for (const appt of appointments) {
      // Find patient and make visible
      const patient = await Patient.findById(appt.patientId);
      if (patient) {
        patient.isDirectoryVisible = true;
        await patient.save();
        syncedCount++;
      }

      // Mark appointment as synced
      appt.pendingDirectorySync = false;
      await appt.save();
    }

    logger.info(`✨ Directory Sync completed. Synced ${syncedCount} patients to directory.`);
  } catch (error) {
    logger.error(`❌ Directory Sync Job Error: ${error.message}`, { stack: error.stack });
  }
};

const startDirectorySyncCron = () => {
  // Run every day at 12:01 AM (1 0 * * *)
  cron.schedule('1 0 * * *', syncDirectory);
  logger.info('📅 Directory Sync Cron Scheduled to run daily at 12:01 AM');
  
  // Run once on startup to sync any past due appointments if server restarted
  syncDirectory();
};

module.exports = {
  syncDirectory,
  startDirectorySyncCron
};
