// server/jobs/dataRetention.job.js
const cron = require("node-cron");
const Queue = require("../models/Queue");
const ClinicalVisit = require("../models/ClinicalVisit");
const Invoice = require("../models/Invoice");
const logger = require("../utils/logger");

/**
 * 🔒 SECURITY: Enforce Data Retention & Privacy Policies (Item 6)
 * Schedules a background job to run every Sunday at midnight (0 0 * * 0).
 * - Stale active queue logs (older than 90 days) are completely deleted.
 * - Sensitive patient clinical visits and invoices (older than 1 year) are anonymized.
 */
const startDataRetentionCron = () => {
  cron.schedule("0 0 * * 0", async () => {
    logger.info("🧹 [RETENTION JOB] Starting scheduled database cleanup and data retention job...");
    try {
      // 1. Delete active queue logs older than 90 days
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const queueDeleteResult = await Queue.deleteMany({
        createdAt: { $lt: ninetyDaysAgo }
      });
      logger.info(`🧹 [RETENTION JOB] Successfully deleted ${queueDeleteResult.deletedCount} queue logs older than 90 days.`);

      // 2. Anonymize sensitive medical information older than 1 year (compliant with DPDP/HIPAA data minimization)
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      
      // Anonymize ClinicalVisits
      const emrAnonymizeResult = await ClinicalVisit.updateMany(
        { createdAt: { $lt: oneYearAgo } },
        {
          $set: {
            patientPhone: "[ANONYMIZED]",
            patientName: "[ANONYMIZED]",
            diagnosis: "[ANONYMIZED]",
            prescriptionNotes: "[ANONYMIZED]"
          }
        }
      );
      logger.info(`🧹 [RETENTION JOB] Successfully anonymized ${emrAnonymizeResult.modifiedCount} clinical visits older than 1 year.`);

      // Anonymize Invoices
      const invoiceAnonymizeResult = await Invoice.updateMany(
        { createdAt: { $lt: oneYearAgo } },
        {
          $set: {
            patientPhone: "[ANONYMIZED]",
            patientName: "[ANONYMIZED]",
            items: []
          }
        }
      );
      logger.info(`🧹 [RETENTION JOB] Successfully anonymized ${invoiceAnonymizeResult.modifiedCount} invoices older than 1 year.`);
      
    } catch (err) {
      logger.error(`❌ [RETENTION JOB] Background retention schedule execution failed: ${err.message}`);
    }
  });
  
  logger.info("👷 Background cron service registered: Data Retention Schedule (Every Sunday at Midnight)");
};

module.exports = { startDataRetentionCron };
