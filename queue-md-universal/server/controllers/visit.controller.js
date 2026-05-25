const ClinicalVisit = require('../models/ClinicalVisit');
const Facility = require('../models/Facility');
const User = require('../models/User');

// @desc    Get Patient History (EMR Lite)
// @route   GET /api/visits/history/:patientPhone
// @access  Private (Doctor/Admin/Receptionist)
exports.getPatientHistory = async (req, res) => {
  try {
    const { patientPhone } = req.params;
    
    // Strict Data Partitioning (saas.md Rule)
    const { facilityId, facilityType } = req.user; 

    const visits = await ClinicalVisit.find({ 
      patientPhone, 
      facilityId, 
      facilityType 
    })
    .sort({ createdAt: -1 }) // Latest visit first
    .populate('doctorId', 'name specialization')
    .lean();

    res.status(200).json({ 
      success: true, 
      count: visits.length, 
      data: visits 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error fetching history' });
  }
};

// @desc    Get Full Prescription Data for Print
// @route   GET /api/visits/:id/prescription
// @access  Private (Doctor/Staff)
exports.getPrescriptionData = async (req, res) => {
  try {
    const visit = await ClinicalVisit.findOne({
      _id: req.params.id,
      facilityId: req.user.facilityId // 🔒 Strict Isolation
    })
    .populate('doctorId', 'name specialization signatureUrl')
    .lean();

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    // Fetch Facility Details (Logo, Address, Phone)
    const facility = await Facility.findById(req.user.facilityId).select('name address phone logoUrl').lean();

    res.status(200).json({
      success: true,
      data: {
        visit,
        facility,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching prescription data' });
  }
};
