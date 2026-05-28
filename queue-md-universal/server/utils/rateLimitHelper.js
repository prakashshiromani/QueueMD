// server/utils/rateLimitHelper.js
const rateLimit = require("express-rate-limit");
const logger = require("./logger");

/**
 * 🔒 SECURITY: Tenant-Aware Rate Limiting (Item 7)
 * Limits API abuse on a per-tenant (facility) basis. If a user is not logged in,
 * it falls back to rate-limiting by IP address.
 *
 * @param {Object} options - Custom express-rate-limit configuration options
 * @returns {Function} Express middleware rate limiter
 */
exports.createTenantLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // Default 15 minutes
    max: options.max || 100, // Default 100 requests per tenant/IP per windowMs
    keyGenerator: (req) => {
      // 🔒 Scopes limits strictly to the facilityId of the authenticated user
      if (req.user && req.user.facilityId) {
        return `tenant:${req.user.facilityId}`;
      }
      // Fallback to IP for unauthenticated routes
      return req.ip || req.socket.remoteAddress || "unknown_ip";
    },
    message: options.message || { 
      success: false, 
      message: "Too many requests from your clinic. Please try again after 15 minutes." 
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      logger.warn(`🚨 SECURITY: Rate limit exceeded for key: ${options.keyGenerator(req)} on route ${req.originalUrl}`);
      res.status(429).json(options.message);
    },
    ...options
  });
};
