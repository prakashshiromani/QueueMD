const IORedis = require('ioredis');

// BullMQ ke liye connection config (maxRetriesPerRequest: null zaroori hai)
const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => Math.min(times * 100, 3000) // Retry with backoff
});

module.exports = { connection };
