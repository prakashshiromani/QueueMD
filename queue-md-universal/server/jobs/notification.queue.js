const { Queue } = require('bullmq');
const { connection } = require('../config/redis');
const logger = require('../utils/logger');

// BullMQ queue initialize
const notificationQueue = new Queue('notificationQueue', { connection });

notificationQueue.on('error', (err) => {
  logger.error(`❌ BullMQ Queue Error: ${err.message}`);
});

module.exports = notificationQueue;
