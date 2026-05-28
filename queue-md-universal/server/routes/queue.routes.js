const express = require("express");
const router = express.Router();
const { addPatient, getQueue, nextPatient, getCompletedCount, markPatientCompleted, pausePatient, resumePatient, resetDailyQueue } = require("../controllers/queue.controller");
const { auth, authorize } = require("../middleware/auth.middleware");
const { createTenantLimiter } = require("../utils/rateLimitHelper");
const { idempotency } = require("../middleware/idempotency.middleware");
const { validate } = require("../middleware/validate");
const { addPatientQueueSchema, completeQueueSchema } = require("../schemas/queue.schema");

// 🔒 SECURITY: Tenant-aware rate limiting on queue writes (Item 7)
const queueLimiter = createTenantLimiter({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: { success: false, message: "Too many queue modifications. Please try again after 15 minutes." }
});

// All routes protected
router.post("/add", auth, validate(addPatientQueueSchema), idempotency, queueLimiter, addPatient);
router.get("/", auth, getQueue);
router.post("/next", auth, queueLimiter, nextPatient);
router.get("/stats/completed", auth, getCompletedCount);

// 🔒 SECURITY: Enforce EMR RBAC so receptionists cannot accidentally complete consultations (Item 9)
router.patch("/:patientId/complete", auth, authorize("admin", "doctor"), validate(completeQueueSchema), idempotency, queueLimiter, markPatientCompleted);
router.patch("/:patientId/pause", auth, idempotency, queueLimiter, pausePatient);
router.patch("/:patientId/resume", auth, idempotency, queueLimiter, resumePatient);

// Admin Only Danger Zone Routes
router.post("/reset-daily", auth, authorize("admin"), resetDailyQueue);

module.exports = router;
