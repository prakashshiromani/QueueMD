const express = require('express');
const rateLimit = require('express-rate-limit');
const { getLiveTrackingStatus, verifyPatientIdentity } = require('../controllers/publicController');

const router = express.Router();

// Strict Rate Limiting (Public Endpoint)
const trackingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // limit each IP to 500 tracking requests per windowMs (relaxed for shared lobby networks)
    message: { success: false, message: "Too many tracking requests, please try again later." }
});

router.get('/track/:facilityId/:tokenNumber', trackingLimiter, getLiveTrackingStatus);
router.post('/lobby/:facilityId/verify', verifyPatientIdentity);
router.post('/debug-log', (req, res) => {
    console.log("📱 [CLIENT LOG]:", JSON.stringify(req.body, null, 2));
    res.json({ success: true });
});

module.exports = router;
