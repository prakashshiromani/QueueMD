const express = require("express");
const router = express.Router();
const { getStats, getCompletedConsultations, getHourlyTraffic, getDailyTrend, getFacilityTypeStats, getTopDoctors, getAIInsights, getPredictedWait } = require("../controllers/analytics.controller");
const { auth, authorize } = require("../middleware/auth.middleware");

// 🔒 SECURITY: Restrict business intelligence dashboard to Doctor & Admin only (Item 9)
router.use(auth, authorize("admin", "doctor"));

router.get("/stats", getStats);
router.get("/completed-consultations", getCompletedConsultations);


// Chart APIs
router.get("/hourly", getHourlyTraffic);
router.get("/daily-trend", getDailyTrend);
router.get("/facility-stats", getFacilityTypeStats);
router.get("/top-doctors", getTopDoctors);
router.get("/ai-insights", getAIInsights);
router.get("/predicted-wait", getPredictedWait);

module.exports = router;
