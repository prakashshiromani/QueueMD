const express = require("express");
const router = express.Router();
const { addPatient, getQueue, nextPatient, getCompletedCount, markPatientCompleted, pausePatient, resumePatient } = require("../controllers/queue.controller");
const { auth } = require("../middleware/auth.middleware");

// All routes protected
router.post("/add", auth, addPatient);
router.get("/", auth, getQueue);
router.post("/next", auth, nextPatient);
router.get("/stats/completed", auth, getCompletedCount);
router.patch("/:patientId/complete", auth, markPatientCompleted);
router.patch("/:patientId/pause", auth, pausePatient);
router.patch("/:patientId/resume", auth, resumePatient);

module.exports = router;
