const jwt = require('jsonwebtoken');

exports.verifyUploadToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: "No upload token provided" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Critical Check: Scope validation
        if (decoded.scope !== 'upload_only') {
            return res.status(403).json({ success: false, message: "Invalid token scope" });
        }

        // Attach verified patient info to request
        req.patient = {
            phone: decoded.patientPhone,
            facilityId: decoded.facilityId,
            visitId: decoded.visitId
        };
        
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: "Upload session expired or invalid" });
    }
};
