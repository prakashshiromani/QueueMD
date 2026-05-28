const express = require("express");
const router = express.Router();
const { searchPatients, addPatientToDirectory, getPatients, togglePatientStatus, updatePatient, deletePatient, exportPatientData } = require("../controllers/patient.controller");
const { auth } = require("../middleware/auth.middleware");
const { createTenantLimiter } = require("../utils/rateLimitHelper");
const { validate } = require("../middleware/validate");
const { addPatientSchema, updatePatientSchema } = require("../schemas/patient.schema");

// 🔒 SECURITY: Tenant-aware rate limiting on directory writes (Item 7)
const patientWriteLimiter = createTenantLimiter({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: { success: false, message: "Too many patient directory changes. Please try again after 15 minutes." }
});

router.use(auth);

router.get("/", getPatients);
router.get("/search", searchPatients);
router.post("/add", validate(addPatientSchema), patientWriteLimiter, addPatientToDirectory);
router.post("/:id/toggle-status", patientWriteLimiter, togglePatientStatus);
router.put("/:id", validate(updatePatientSchema), patientWriteLimiter, updatePatient);
router.delete("/:id", patientWriteLimiter, deletePatient);
router.get("/:id/export", exportPatientData);

module.exports = router;
