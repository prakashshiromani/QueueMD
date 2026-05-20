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

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};
