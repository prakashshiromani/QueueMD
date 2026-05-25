const express = require('express');
const rateLimit = require('express-rate-limit');
const { getLiveTrackingStatus, verifyPatientIdentity } = require('../controllers/publicController');

const router = express.Router();

// Strict Rate Limiting (Public Endpoint)
const trackingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 tracking requests per windowMs
    message: { success: false, message: "Too many tracking requests, please try again later." }
});

router.get('/track/:facilityId/:tokenNumber', trackingLimiter, getLiveTrackingStatus);
router.post('/lobby/:facilityId/verify', verifyPatientIdentity);

module.exports = router;
