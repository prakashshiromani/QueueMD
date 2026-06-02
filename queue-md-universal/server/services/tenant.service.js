/**
 * @file services/tenant.service.js
 * @description Multi-Tenant Isolation Service Layer
 * 
 * Enforces strict tenant (facility) isolation for all database operations.
 * Critical security layer — prevents cross-tenant data access (IDOR attacks).
 * 
 * All controllers should use these helpers instead of manually injecting facilityId.
 */

const logger = require("../utils/logger");

/**
 * Scope a MongoDB query to the authenticated user's facility only.
 * Prevents cross-tenant data leakage.
 * 
 * @param {Object} req - Express request (must have req.user.facilityId from auth middleware)
 * @param {Object} baseQuery - Base query to scope
 * @returns {Object} Scoped query with enforced facilityId
 * @throws {Error} If facilityId is missing from the user context
 */
exports.scopeQuery = (req, baseQuery = {}) => {
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
 * Sanitize and scope write data to the authenticated user's facility.
 * Strips any client-supplied facilityId to prevent spoofing.
 * 
 * @param {Object} req - Express request (must have req.user.facilityId)
 * @param {Object} bodyData - Request body or data to sanitize
 * @returns {Object} Sanitized data with enforced facilityId
 * @throws {Error} If facilityId is missing from the user context
 */
exports.scopeData = (req, bodyData = {}) => {
  if (!req.user || !req.user.facilityId) {
    logger.error("🚨 SECURITY BREACH ATTEMPT: Data isolation failed — missing facilityId context.");
    throw new Error("Unauthorized tenant access: Facility association missing.");
  }

  // Deep copy bodyData
  const sanitizedData = { ...bodyData };

  // 🔒 Strip client-supplied facilityId to prevent IDOR / spoofing
  delete sanitizedData.facilityId;
  sanitizedData.facilityId = req.user.facilityId;

  // Keep client-supplied facilityType if provided, otherwise fallback to user's facilityType
  if (!sanitizedData.facilityType) {
    sanitizedData.facilityType = req.user.facilityType;
  }

  return sanitizedData;
};

// Aliases for backward compatibility
exports.tenantQuery = exports.scopeQuery;
exports.tenantData = exports.scopeData;

