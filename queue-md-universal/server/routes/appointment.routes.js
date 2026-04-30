// server/routes/appointment.routes.js
const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth.middleware"); // Adjust path if needed
const { 
  createAppointment, 
  getAppointments, 
  getTodaySchedule, 
  updateStatus, 
  deleteAppointment 
} = require("../controllers/appointment.controller");

//  All routes protected
router.use(auth);

router.post("/", createAppointment);
router.get("/", getAppointments);
router.get("/today", getTodaySchedule);
router.put("/:id/status", updateStatus);
router.delete("/:id", deleteAppointment);

module.exports = router;
