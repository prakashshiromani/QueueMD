const express = require("express");
const router = express.Router();
const { getStats, getCompletedToday } = require("../controllers/analytics.controller");
const { auth } = require("../middleware/auth.middleware");

// Protect all analytics routes
router.use(auth);

router.get("/stats", getStats);
router.get("/completed-today", getCompletedToday);

module.exports = router;
