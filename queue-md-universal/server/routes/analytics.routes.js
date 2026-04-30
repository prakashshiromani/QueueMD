const express = require("express");
const router = express.Router();
const { getStats, getCompletedConsultations, getHourlyTraffic, getDailyTrend, getFacilityTypeStats, getTopDoctors, getAIInsights } = require("../controllers/analytics.controller");
const { auth } = require("../middleware/auth.middleware");

// Protect all analytics routes
router.use(auth);

router.get("/stats", getStats);
router.get("/completed-consultations", getCompletedConsultations);

// Chart APIs
router.get("/hourly", getHourlyTraffic);
router.get("/daily-trend", getDailyTrend);
router.get("/facility-stats", getFacilityTypeStats);
router.get("/top-doctors", getTopDoctors);
router.get("/ai-insights", getAIInsights);

module.exports = router;
