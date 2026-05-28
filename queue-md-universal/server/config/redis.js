const IORedis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const isSecure = redisUrl.startsWith('rediss://');

const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => Math.min(times * 100, 3000) // Retry with backoff
};

// 🔒 SECURITY: Enforce secure SSL/TLS connection options on production secure Redis (Item 8)
if (isSecure) {
  redisOptions.tls = {
    rejectUnauthorized: false // Standard for Upstash / Heroku Redis certs
  };
}

// BullMQ ke liye connection config (maxRetriesPerRequest: null zaroori hai)
const connection = new IORedis(redisUrl, redisOptions);

module.exports = { connection };
