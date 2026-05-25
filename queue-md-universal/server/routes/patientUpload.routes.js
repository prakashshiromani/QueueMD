const express = require('express');
const { uploadPrescription, getUploadedDocuments, getPatientClinicalHistory } = require('../controllers/patientUpload.controller');
const { verifyUploadToken } = require('../middleware/verifyUploadToken');
const upload = require('../middleware/multer');

const router = express.Router();

router.post('/upload-prescription', verifyUploadToken, upload.single('prescription'), uploadPrescription);
router.get('/documents', verifyUploadToken, getUploadedDocuments);
router.get('/history', verifyUploadToken, getPatientClinicalHistory);

module.exports = router;
