const express = require('express');
const router = express.Router();
const { 
  getLabReports, 
  getLabStats, 
  updateLabStatus,
  createLabOrder 
} = require('../controllers/lab.controller');
const { auth } = require('../middleware/auth.middleware');

// All routes protected
router.use(auth);

// GET all lab reports with filters
router.get('/reports', getLabReports);

// GET stats for dashboard cards
router.get('/stats', getLabStats);

// UPDATE status (pending → processing → ready → delivered)
router.put('/:id/status', updateLabStatus);

// CREATE new lab order
router.post('/create', createLabOrder);

module.exports = router;
