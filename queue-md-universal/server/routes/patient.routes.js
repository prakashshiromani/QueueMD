const express = require("express");
const router = express.Router();
const { searchPatients, addPatientToDirectory, getPatients, togglePatientStatus, updatePatient, deletePatient } = require("../controllers/patient.controller");
const { auth } = require("../middleware/auth.middleware");

router.use(auth);

router.get("/", getPatients);
router.get("/search", searchPatients);
router.post("/add", addPatientToDirectory);
router.post("/:id/toggle-status", togglePatientStatus);
router.put("/:id", updatePatient);
router.delete("/:id", deletePatient);

module.exports = router;
