/**
 * @file services/branch.service.js
 * @description Branch Ownership Validation Utility Service
 * 
 * Prevents cross-facility branchId injection attacks.
 */

const Facility = require("../models/Facility");

/**
 * Validates that the given branchId is a real, ACTIVE branch
 * that belongs to the given facilityId.
 *
 * Returns true if branchId is null/undefined (global context is always valid).
 * Returns false if branchId is provided but not owned by or is inactive in this facility.
 *
 * @param {string} facilityId - The facility's MongoDB ObjectId
 * @param {string|null} branchId - The branch's MongoDB ObjectId (or null)
 * @returns {Promise<boolean>}
 */
exports.validateBranchOwnership = async (facilityId, branchId) => {
  // null/undefined branchId means "no specific branch" — always valid
  if (!branchId) return true;

  const facility = await Facility.findOne({
    _id: facilityId,
    branches: {
      $elemMatch: {
        _id: branchId,
        isActive: true  // Also reject inactive branches
      }
    }
  }).select("_id");

  return !!facility;
};
