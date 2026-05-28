const { connection: redis } = require("../config/redis");
const logger = require("../utils/logger");

/**
 * 🔒 SECURITY: API Idempotency Middleware (Beyond Webhooks)
 * Prevents double-submissions (e.g. patients being registered twice, double pause/resumes)
 * by caching successful responses in Redis for 24 hours based on X-Idempotency-Key.
 */
const idempotency = async (req, res, next) => {
  // Idempotency applies only to state-changing methods (POST, PUT, PATCH, DELETE)
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const key = req.headers["x-idempotency-key"];

  if (!key) {
    return res.status(400).json({
      success: false,
      message: "Idempotency validation failed: X-Idempotency-Key header is missing."
    });
  }

  // Enforce basic UUID structure or valid string format to prevent cache injection / DOS
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!uuidRegex.test(key)) {
    return res.status(400).json({
      success: false,
      message: "Idempotency validation failed: X-Idempotency-Key must be a valid UUIDv4 string."
    });
  }

  const redisKey = `idempotency:${key}`;

  try {
    // Check if key is already cached in Redis
    const cachedResponse = await redis.get(redisKey);

    if (cachedResponse) {
      logger.info(`[IDEMPOTENCY] Cache hit for key: ${key}. Returning stored response.`);
      const { statusCode, headers, body } = JSON.parse(cachedResponse);

      // Re-apply original headers
      Object.keys(headers).forEach((h) => {
        res.setHeader(h, headers[h]);
      });
      // Set indicator that this was served from cache
      res.setHeader("X-Cache-Lookup", "HIT - Idempotent");

      return res.status(statusCode).json(body);
    }

    // Intercept response methods to cache successful responses
    const originalJson = res.json;

    res.json = function (body) {
      // Store in cache only on successful status codes (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const responseData = {
          statusCode: res.statusCode,
          headers: res.getHeaders(),
          body
        };

        // Cache for 24 hours (86400 seconds)
        redis.set(redisKey, JSON.stringify(responseData), "EX", 24 * 60 * 60)
          .catch((err) => logger.error(`[IDEMPOTENCY] Failed to cache response in Redis: ${err.message}`));
      }

      return originalJson.call(this, body);
    };

    next();
  } catch (err) {
    logger.error(`[IDEMPOTENCY] Middleware exception: ${err.message}`);
    // Fallback to normal execution if Redis fails to ensure high availability
    next();
  }
};

module.exports = { idempotency };
