const ClinicalVisit = require('../models/ClinicalVisit');
const Facility = require('../models/Facility');
const User = require('../models/User');
const { tenantQuery } = require('../utils/tenantIsolation');
const { logAudit } = require('../utils/auditLogger');
const logger = require('../utils/logger');

// @desc    Get Patient History (EMR Lite)
// @route   GET /api/visits/history/:patientPhone
// @access  Private (Doctor/Admin/Receptionist)
exports.getPatientHistory = async (req, res) => {
  try {
    const { patientPhone } = req.params;
    
    // 🔒 SECURITY: Enforce multi-tenant isolation query wrapper (Item 2)
    const query = tenantQuery(req, { 
      patientPhone, 
      facilityType: req.user.facilityType 
    });

    const visits = await ClinicalVisit.find(query)
    .sort({ createdAt: -1 }) // Latest visit first
    .populate('doctorId', 'name specialization')
    .lean();

    // 🔒 SECURITY: Generate signed URLs for private medical documents (Item 4)
    const { getSignedUrl } = require('../utils/cloudinaryHelper');
    visits.forEach(visit => {
      if (visit.documents && Array.isArray(visit.documents)) {
        visit.documents.forEach(doc => {
          doc.url = getSignedUrl(doc.url, doc.type);
        });
      }
    });

    // 🔒 SECURITY: EMR compliance access auditing (Item 3)
    await logAudit(req, {
      action: "EMR_VIEW_HISTORY",
      facilityId: req.user.facilityId,
      severity: "info",
      status: "success",
      details: { patientPhone, recordCount: visits.length }
    });

    res.status(200).json({ 
      success: true, 
      count: visits.length, 
      data: visits 
    });
  } catch (error) {
    logger.error(`[EMR] Error fetching history: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server Error fetching history' });
  }
};

// @desc    Get Full Prescription Data for Print
// @route   GET /api/visits/:id/prescription
// @access  Private (Doctor/Staff)
exports.getPrescriptionData = async (req, res) => {
  try {
    // 🔒 SECURITY: Scope query with isolation wrapper (Item 2)
    const query = tenantQuery(req, { _id: req.params.id });

    const visit = await ClinicalVisit.findOne(query)
    .populate('doctorId', 'name specialization signatureUrl')
    .lean();

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    // Fetch Facility Details (Logo, Address, Phone)
    // 🔒 SECURITY: Apply tenantQuery wrapper for Facility fetch
    const facilityQuery = tenantQuery(req, { _id: req.user.facilityId });
    const facility = await Facility.findOne(facilityQuery).select('name address phone logoUrl').lean();

    // 🔒 SECURITY: Generate signed URLs for private medical documents (Item 4)
    if (visit.documents && Array.isArray(visit.documents)) {
      const { getSignedUrl } = require('../utils/cloudinaryHelper');
      visit.documents.forEach(doc => {
        doc.url = getSignedUrl(doc.url, doc.type);
      });
    }

    // 🔒 SECURITY: EMR compliance access auditing (Item 3)
    await logAudit(req, {
      action: "EMR_VIEW_PRESCRIPTION",
      facilityId: req.user.facilityId,
      severity: "info",
      status: "success",
      details: { visitId: req.params.id }
    });

    res.status(200).json({
      success: true,
      data: {
        visit,
        facility,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    logger.error(`[EMR] Error fetching prescription: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error fetching prescription data' });
  }
};
