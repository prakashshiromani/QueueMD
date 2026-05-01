// server/middleware/auth.middleware.js
const jwt = require("jsonwebtoken");

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

    // Debug log (remove in production)
    console.log("🔐 Auth Middleware - User:", {
      id: decoded.id,
      facilityId: decoded.facilityId,
      facilityType: decoded.facilityType
    });

    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Token is not valid" });
  }
};
