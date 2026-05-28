// server/utils/tenantIsolation.js
const logger = require("./logger");

/**
 * 🔒 SECURITY: Enforce Tenant Isolation for MongoDB Queries (Item 2)
 * Ensures that facilityId filter is always strictly applied to DB queries.
 *
 * @param {Object} req - The Express Request object (containing req.user injected by auth middleware)
 * @param {Object} baseQuery - The base query object to scope
 * @returns {Object} Scoped query object
 */
exports.tenantQuery = (req, baseQuery = {}) => {
  if (!req.user || !req.user.facilityId) {
    logger.error("🚨 SECURITY BREACH ATTEMPT: Scoped query failed — missing facilityId context.");
    throw new Error("Unauthorized tenant access: Facility association missing.");
  }

  // Deep copy baseQuery to avoid modifying reference
  const scopedQuery = { ...baseQuery };

  // Explicitly inject and overwrite facilityId
  scopedQuery.facilityId = req.user.facilityId;

  return scopedQuery;
};

/**
 * 🔒 SECURITY: Enforce Tenant Isolation for Data Modifications (Item 2)
 * Strips client-supplied facilityId/facilityType from body data and injects
 * values directly from the verified JWT user object.
 *
 * @param {Object} req - The Express Request object
 * @param {Object} bodyData - The request body or input object to sanitize
 * @returns {Object} Sanitized object with correct facility properties
 */
exports.tenantData = (req, bodyData = {}) => {
  if (!req.user || !req.user.facilityId) {
    logger.error("🚨 SECURITY BREACH ATTEMPT: Data isolation failed — missing facilityId context.");
    throw new Error("Unauthorized tenant access: Facility association missing.");
  }

  // Deep copy bodyData
  const sanitizedData = { ...bodyData };

  // 🔒 Strip client-supplied properties to prevent IDOR / spoofing
  delete sanitizedData.facilityId;
  delete sanitizedData.facilityType;

  // 🔒 Force verified tenant parameters
  sanitizedData.facilityId = req.user.facilityId;
  sanitizedData.facilityType = req.user.facilityType;

  return sanitizedData;
};
