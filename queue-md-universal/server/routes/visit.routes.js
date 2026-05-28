const express = require('express');
const router = express.Router();
const { getPatientHistory, getPrescriptionData } = require('../controllers/visit.controller');
const { auth, authorize } = require('../middleware/auth.middleware');

// 🔒 SECURITY: Restrict sensitive EMR data history to Doctor & Admin (Item 9)
// @route   GET /api/visits/history/:patientPhone
router.get('/history/:patientPhone', auth, authorize("admin", "doctor"), getPatientHistory);

// 🔒 SECURITY: Restrict prescription printing to Doctor & Admin (Item 9)
// @route   GET /api/visits/:id/prescription
router.get('/:id/prescription', auth, authorize("admin", "doctor"), getPrescriptionData);

module.exports = router;
