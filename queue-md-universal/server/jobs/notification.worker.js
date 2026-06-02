require('dotenv').config({ path: __dirname + '/../.env' });
const { Worker } = require('bullmq');
const { connection } = require('../config/redis');
const logger = require('../utils/logger');
const { FACILITY_TYPES } = require('../utils/facilityTypeConfig');

// 🔒 SECURITY: Initialize MongoDB connection for background worker process (Item 8)
const connectDB = require('../config/db');
connectDB();

// Worker background me chalta rahega
const worker = new Worker('notificationQueue', async (job) => {
  if (job.name === 'sla-reminder') {
    const { ticketId, facilityId } = job.data;
    logger.info(`[WORKER] Processing SLA Reminder for Ticket: ${ticketId}`);

    const Ticket = require('../models/Ticket');
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      logger.warn(`[WORKER] SLA Job skipped: Ticket ${ticketId} not found`);
      return { status: 'skipped', message: 'Ticket not found' };
    }

    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      logger.info(`[WORKER] SLA Reminder skipped: Ticket ${ticketId} already ${ticket.status}`);
      return { status: 'skipped', message: `Ticket already ${ticket.status}` };
    }

    logger.info(`🚨 SLA Warning: Ticket ${ticketId} (${ticket.subject}) is approaching deadline!`);

    try {
      const Facility = require('../models/Facility');
      const facility = await Facility.findById(facilityId);
      const facilityType = facility ? facility.facilityType : 'clinic';

      const NotificationModel = require('../models/Notification');
      await NotificationModel.create({
        facilityId,
        facilityType,
        type: 'system',
        title: '🚨 Support SLA Reminder',
        message: `Ticket #${ticketId.toString().slice(-6)}: "${ticket.subject}" ki SLA deadline approaching hai!`,
        metadata: {
          ticketId: ticket._id,
          priority: ticket.priority,
          slaDeadline: ticket.slaDeadline
        }
      });
      logger.info(`[WORKER] In-app notification created for SLA warning on ticket ${ticketId}`);
    } catch (err) {
      logger.error(`[WORKER] Failed to create SLA warning notification: ${err.message}`);
    }

    return { status: 'alerted', message: `SLA warning issued for ticket ${ticketId}` };
  }

  const { queueEntryId } = job.data;

  // 🔒 SECURITY: Fetch clinical information directly from Mongoose to keep Redis payloads sanitised (Item 8)
  const Queue = require('../models/Queue');
  const queueEntry = await Queue.findById(queueEntryId);
  
  if (!queueEntry) {
    logger.warn(`[WORKER] Job skipped: Queue entry ${queueEntryId} not found`);
    return { status: 'skipped', message: 'Queue entry not found' };
  }

  const { facilityId, facilityType, patientName, tokenNumber, phone, customData, branchId } = queueEntry;

  let config = FACILITY_TYPES[facilityType] || FACILITY_TYPES.clinic;
  let branchName = "";
  let branchAddress = "";

  if (facilityId) {
    try {
      const Facility = require('../models/Facility');
      const facility = await Facility.findById(facilityId);
      
      const customTypes = (facility && facility.customFields && facility.customFields.get("customFacilityTypes")) || {};
      if (customTypes[facilityType]) {
        config = { ...config, ...customTypes[facilityType] };
      }

      // Load branch details if branchId exists
      if (branchId && facility && facility.branches) {
        const branch = facility.branches.id(branchId);
        if (branch) {
          branchName = branch.name || "";
          branchAddress = branch.address || "";
        }
      }
    } catch (e) {
      logger.error(`Error loading custom notification config: ${e.message}`);
    }
  }
  let message = config.notificationTemplate;

  // 🔧 Dynamic Placeholders Replace
  message = message.replace('#{token}', tokenNumber || 'N/A')
    .replace('#{patientName}', patientName || 'Patient')
    .replace('#{sampleId}', customData?.sampleId || '')
    .replace('#{procedure}', customData?.procedure || '')
    .replace('#{sessionType}', customData?.sessionType || '')
    .replace('#{branchName}', branchName || '')
    .replace('#{branchAddress}', branchAddress || '');

  // 🚀 Yahan actual SMS/WhatsApp API aayega (Twilio/MSG91/Meta)
  // Abhi ke liye MCA demo me hum sirf log karenge (Production ready structure hai)
  logger.info(`🔔 [${facilityType.toUpperCase()}] ${message} | Phone: ${phone || 'N/A'} | JobID: ${job.id}`);

  // Simulate API delay
  await new Promise(res => setTimeout(res, 300));

  return { status: 'queued_for_sms', message };
}, {
  connection,
  concurrency: 5, // Ek saath 5 notifications process karega
  removeOnComplete: { count: 1000 }, // Memory leak prevent
  removeOnFail: { count: 500 }
});

// ✅ Startup Log Messages
logger.info('👷 Worker started for queue: notificationQueue');
logger.info(`🔗 Connected to Redis: ${process.env.REDIS_HOST || 'Remote Upstash'}`);
logger.info('📦 Concurrency: 5 jobs parallel');
logger.info('✅ Worker ready to process notifications...');

worker.on('completed', (job, result) => {
  logger.debug(`✅ Job ${job.id} completed: ${result.status}`);
});

worker.on('failed', (job, err) => {
  logger.error(`❌ Job ${job?.id} failed: ${err.message}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('🛑 Worker shutting down...');
  await worker.close();
  process.exit(0);
});

module.exports = worker;
