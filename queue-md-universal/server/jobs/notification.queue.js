const { Queue } = require('bullmq');
const { connection } = require('../config/redis');

// BullMQ queue initialize
const notificationQueue = new Queue('notificationQueue', { connection });

module.exports = notificationQueue;
