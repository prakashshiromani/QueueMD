// Export authorize(...roles) function
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
        message: `Role ${req.user.role} not authorized` 
      });
    }

    next();
  };
};
