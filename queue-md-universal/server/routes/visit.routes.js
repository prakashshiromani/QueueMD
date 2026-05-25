const express = require('express');
const router = express.Router();
const { getPatientHistory, getPrescriptionData } = require('../controllers/visit.controller');
const { auth } = require('../middleware/auth.middleware');

// @route   GET /api/visits/history/:patientPhone
router.get('/history/:patientPhone', auth, getPatientHistory);

// @route   GET /api/visits/:id/prescription
router.get('/:id/prescription', auth, getPrescriptionData);

module.exports = router;
