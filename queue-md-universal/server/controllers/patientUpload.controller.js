const ClinicalVisit = require('../models/ClinicalVisit');
const cloudinary = require('../config/cloudinary');
const { getCorrectedTimestamp } = require('../utils/timeSync');
const logger = require('../utils/logger');

exports.uploadPrescription = async (req, res) => {
    try {
        const sharp = require('sharp');
        // req.patient comes from verifyUploadToken middleware
        const { phone, facilityId, visitId } = req.patient;

        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({ success: false, message: "Only JPG, PNG, PDF allowed" });
        }

        // 🔒 SECURITY: Verify magic bytes signatures (L-05) to prevent MIME spoofing (disguised malware/exes)
        const uploadMiddleware = require('../middleware/multer');
        const isValidFile = uploadMiddleware.validateMagicBytes(req.file.buffer, req.file.mimetype);
        if (!isValidFile) {
            logger.warn(`🚨 SECURITY: Patient upload rejected — magic bytes mismatch for ${req.file.mimetype}`);
            return res.status(400).json({ success: false, message: "Invalid file content. File type mismatch detected." });
        }

        // 🔒 SECURITY: Strip EXIF metadata from uploaded images using Sharp (Item 4)
        let processedBuffer = req.file.buffer;
        if (req.file.mimetype.startsWith('image/')) {
            try {
                processedBuffer = await sharp(req.file.buffer)
                    .rotate() // Strips EXIF tags while keeping orientation
                    .toBuffer();
            } catch (sharpError) {
                console.error("[SHARP] Sanitization failed:", sharpError);
                return res.status(400).json({ success: false, message: "Failed to sanitize uploaded file" });
            }
        }

        // Upload to Cloudinary
        const b64 = processedBuffer.toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        const cloudinaryFolder = `QueueMD/patient-uploads/${facilityId}/${phone}`;

        const result = await cloudinary.uploader.upload(dataURI, {
            folder: cloudinaryFolder,
            resource_type: 'auto',
            type: 'private', // 🔒 SECURITY: Store as private asset (Item 4)
            timestamp: getCorrectedTimestamp()
        });

        // Save to EMR Timeline (ClinicalVisit)
        const updatedVisit = await ClinicalVisit.findOneAndUpdate(
            { 
                patientPhone: phone,
                facilityId: facilityId,
                _id: visitId
            },
            {
                $push: {
                    documents: {
                        url: result.secure_url,
                        type: req.file.mimetype,
                        uploadedBy: 'patient',
                        uploadedAt: new Date(),
                        fileName: req.file.originalname
                    }
                }
            },
            { new: true }
        );

        if (!updatedVisit) {
             return res.status(404).json({ success: false, message: "Visit record not found to attach file" });
        }

        res.status(200).json({ 
            success: true, 
            message: "Saved to your health record!" 
        });
    } catch (error) {
        console.error("Upload Prescription Error:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Upload failed",
            // 🔒 SECURITY: Do not leak server stack trace to clients in production
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    }
};

exports.getUploadedDocuments = async (req, res) => {
    try {
        const { phone, facilityId, visitId } = req.patient;
        const { getSignedUrl } = require('../utils/cloudinaryHelper');
        
        const visit = await ClinicalVisit.findOne({
            patientPhone: phone,
            facilityId: facilityId,
            _id: visitId
        });

        if (!visit) {
            return res.status(404).json({ success: false, message: "No visit found" });
        }

        const patientDocs = visit.documents
            .filter(doc => doc.uploadedBy === 'patient')
            .map(doc => {
                const docObj = doc.toObject ? doc.toObject() : { ...doc };
                // 🔒 SECURITY: Return signed URL for private asset (Item 4)
                docObj.url = getSignedUrl(doc.url, doc.type);
                return docObj;
            });

        res.status(200).json({
            success: true,
            data: patientDocs
        });
    } catch (error) {
        console.error("Get Documents Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch documents" });
    }
};

exports.getPatientClinicalHistory = async (req, res) => {
    try {
        // req.patient comes from verifyUploadToken middleware
        const { phone, facilityId } = req.patient;
        const { getSignedUrl } = require('../utils/cloudinaryHelper');

        // Fetch all clinical visits for this patient in this facility
        // Strict isolation: facilityId + patientPhone
        const clinicalVisits = await ClinicalVisit.find({
            patientPhone: phone,
            facilityId
        })
        .populate("doctorId", "name specialization") // Doctor details
        .sort({ createdAt: -1 }) // Latest visits first
        .lean();

        // Prepare response with formatted data
        const historyData = clinicalVisits.map((visit) => ({
            _id: visit._id,
            visitDate: visit.createdAt,
            doctor: visit.doctorId,
            diagnosis: visit.diagnosis || null,
            prescriptionNotes: visit.prescriptionNotes || null,
            vitals: visit.vitals || {},
            documents: (visit.documents || []).map((doc) => ({
                _id: doc._id,
                fileName: doc.fileName || "Document",
                type: doc.type,
                uploadedBy: doc.uploadedBy,
                uploadedAt: doc.uploadedAt,
                // 🔒 SECURITY: Return signed URL for private asset (Item 4)
                url: getSignedUrl(doc.url, doc.type),
            })),
        }));

        res.status(200).json({
            success: true,
            message: "Clinical history fetched successfully",
            data: {
                patientPhone: phone,
                totalVisits: historyData.length,
                visits: historyData,
            }
        });
    } catch (error) {
        console.error("❌ [getPatientClinicalHistory] Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch medical history" });
    }
};

