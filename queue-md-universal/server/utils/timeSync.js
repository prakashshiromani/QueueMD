const logger = require('./logger');

let timeOffset = 0; // in milliseconds

/**
 * Fetch a reliable remote server (Google) and calculate time offset
 */
async function syncTimeOffset() {
  try {
    const start = Date.now();
    // Using global fetch (available in Node.js 18+)
    const res = await fetch('https://www.google.com', { method: 'HEAD' });
    const serverDateStr = res.headers.get('date');
    if (serverDateStr) {
      const serverTime = new Date(serverDateStr).getTime();
      const end = Date.now();
      const latency = (end - start) / 2;
      const actualTime = serverTime + latency;
      timeOffset = actualTime - end;
      logger.info(`[TimeSync] System time offset calibrated: ${timeOffset}ms.`);
    }
  } catch (err) {
    logger.warn(`[TimeSync] Failed to calibrate system time: ${err.message}. Using 0ms offset.`);
  }
}

/**
 * Get the current timestamp (in seconds) adjusted for system time skew
 */
function getCorrectedTimestamp() {
  return Math.round((Date.now() + timeOffset) / 1000);
}

module.exports = {
  syncTimeOffset,
  getCorrectedTimestamp
};
