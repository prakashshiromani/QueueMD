require('dotenv').config({ path: __dirname + '/../.env' });
const { Worker } = require('bullmq');
const { connection } = require('../config/redis');
const logger = require('../utils/logger');
const { FACILITY_TYPES } = require('../utils/facilityTypeConfig');

// Worker background me chalta rahega
const worker = new Worker('notificationQueue', async (job) => {
  const { facilityId, facilityType, patientName, tokenNumber, phone, customData } = job.data;
  
  let config = FACILITY_TYPES[facilityType] || FACILITY_TYPES.clinic;
  if (facilityId) {
    try {
      const Facility = require('../models/Facility');
      const facility = await Facility.findById(facilityId);
      const customTypes = (facility && facility.customFields && facility.customFields.get("customFacilityTypes")) || {};
      if (customTypes[facilityType]) {
        config = { ...config, ...customTypes[facilityType] };
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
                   .replace('#{sessionType}', customData?.sessionType || '');

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
