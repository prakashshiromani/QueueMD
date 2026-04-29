const express = require("express");
const router = express.Router();
const { addPatient, getQueue, nextPatient, getCompletedCount, markPatientCompleted } = require("../controllers/queue.controller");
const { auth } = require("../middleware/auth.middleware");

// All routes protected
router.post("/add", auth, addPatient);
router.get("/", auth, getQueue);
router.post("/next", auth, nextPatient);
router.get("/stats/completed", auth, getCompletedCount);
router.patch("/:patientId/complete", auth, markPatientCompleted);

module.exports = router;
