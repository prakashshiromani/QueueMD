// server/routes/appointment.routes.js
const express = require("express");
const router = express.Router();
const { auth, authorize } = require("../middleware/auth.middleware"); // Adjust path if needed
const { 
  createAppointment, 
  getAppointments, 
  getTodaySchedule, 
  updateAppointment,
  syncToDirectory,
  updateStatus, 
  deleteAppointment,
  deletePatient 
} = require("../controllers/appointment.controller");

//  All routes protected
router.use(auth);

router.post("/", createAppointment);
router.post("/sync-to-directory", syncToDirectory);
router.get("/", getAppointments);
router.get("/today", getTodaySchedule);
router.put("/:id", updateAppointment);
router.put("/:id/status", updateStatus);
router.delete("/patients/:patientId", authorize("admin"), deletePatient);
router.delete("/:id", deleteAppointment);

module.exports = router;
