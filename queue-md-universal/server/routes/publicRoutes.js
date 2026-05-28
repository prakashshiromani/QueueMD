const express = require('express');
const rateLimit = require('express-rate-limit');
const { getLiveTrackingStatus, verifyPatientIdentity } = require('../controllers/publicController');

const router = express.Router();

// 🔒 SECURITY: Reduced tracking rate limit from 500 to 60 per 15min (VULN-10)
// 500 was too permissive — allowed easy sequential token enumeration attacks
const trackingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 60, // 60 requests per IP per 15min (4 per minute) — sufficient for real patients
    message: { success: false, message: "Too many tracking requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict rate limit for identity verification (brute force protection)
const verifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: "Too many verification attempts, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

router.get('/track/:facilityId/:tokenNumber', trackingLimiter, getLiveTrackingStatus);
router.post('/lobby/:facilityId/verify', verifyLimiter, verifyPatientIdentity);

// 🔒 SECURITY: Removed unauthenticated /debug-log endpoint (VULN-03)
// This endpoint allowed log injection, DoS attacks, and server info leakage.
// In development, use server-side logging (Winston) instead.
if (process.env.NODE_ENV === 'development') {
    const devDebugLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });
    router.post('/debug-log', devDebugLimiter, (req, res) => {
        // Sanitize: only log a subset of safe fields, never raw body dump
        const { level = 'info', message = '', component = 'client' } = req.body;
        const safeMessage = String(message).slice(0, 500); // Cap length to prevent log flooding
        const safeComponent = String(component).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);
        const { createLogger } = require('../utils/logger');
        const logger = require('../utils/logger');
        logger.debug(`[CLIENT:${safeComponent}] ${safeMessage}`);
        res.json({ success: true });
    });
}

module.exports = router;
