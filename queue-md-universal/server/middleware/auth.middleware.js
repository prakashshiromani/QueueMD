// server/middleware/auth.middleware.js
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

exports.auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ success: false, message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request object
    req.user = {
      id: decoded.id,
      facilityId: decoded.facilityId,
      facilityType: decoded.facilityType,
      role: decoded.role
    };

    // Debug log using winston
    logger.debug("🔐 Auth Middleware - User: " + JSON.stringify({
      id: decoded.id,
      facilityId: decoded.facilityId,
      facilityType: decoded.facilityType
    }));

    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Token is not valid" });
  }
};

// Grant access to specific roles and check facility types
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Check if req.user exists (set by auth middleware)
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    // Support allowedFacilityTypes logic for future scalability
    const allowedFacilityTypes = roles[0]?.allowedFacilityTypes;
    if (allowedFacilityTypes && !allowedFacilityTypes.includes(req.user.facilityType)) {
      return res.status(403).json({ 
        success: false, 
        message: `Role not authorized for facility-type: ${req.user.facilityType}` 
      });
    }

    // Role verification
    // Map handles both literal strings or nested object properties like [{ role: "admin", allowedFacilityTypes: [] }]
    const roleList = roles.map(r => r.role || r);
    
    if (!roleList.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Role ${req.user.role} is not authorized to access this route` 
      });
    }

    next();
  };
};

const Facility = require("../models/Facility");

// PRO SUBSCRIPTION CHECK
exports.requirePro = async (req, res, next) => {
  try {
    const facility = await Facility.findById(req.user.facilityId).select("subscriptionPlan subscriptionStatus");
    
    if (!facility || facility.subscriptionPlan !== "pro" || facility.subscriptionStatus !== "active") {
      return res.status(403).json({ 
        success: false, 
        message: "Pro subscription required for this feature",
        upgradeRequired: true,
        upgradeUrl: "/settings?tab=subscription"
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};
