const Queue = require('../models/Queue');

exports.getLiveTrackingStatus = async (req, res) => {
    try {
        const { facilityId, tokenNumber } = req.params;

        // 1. Find the patient's active or completed record
        const patient = await Queue.findOne({
            facilityId,
            tokenNumber: Number(tokenNumber),
            status: { $in: ['waiting', 'in-progress', 'completed'] }
        }).lean();

        if (!patient) {
            return res.status(404).json({ success: false, message: "Token not found." });
        }

        // If completed, verify it was completed today to avoid showing old ones (Bypassed in development for easier testing)
        if (patient.status === 'completed' && process.env.NODE_ENV !== 'development') {
            const completedDate = new Date(patient.completedAt || patient.updatedAt).toDateString();
            const today = new Date().toDateString();
            if (completedDate !== today) {
                return res.status(404).json({ success: false, message: "Token not found or completed on a previous day." });
            }
        }

        // 2. Calculate "People Ahead" (those waiting before this patient)
        const peopleAhead = await Queue.countDocuments({
            facilityId,
            facilityType: patient.facilityType,
            status: 'waiting',
            createdAt: { $lt: patient.createdAt }
        });

        // 3. Get Current Serving Token for this department
        const currentServing = await Queue.findOne({
            facilityId,
            facilityType: patient.facilityType,
            status: 'in-progress'
        })
            .sort({ updatedAt: -1 })
            .select('tokenNumber')
            .lean();

        // 4. Calculate accurate estimated wait time using prediction engine
        const { calculateWaitPredictions } = require('../utils/waitTimeCalculator');
        const stats = await calculateWaitPredictions(Queue, facilityId, patient.facilityType);
        const prediction = stats.predictions.find(p => p._id.toString() === patient._id.toString());
        let estimatedWaitTime = prediction ? prediction.estimatedWaitTime : 0;

        // Enforce a realistic minimum wait time of 5 mins if patient is waiting
        if (patient.status === 'waiting' && estimatedWaitTime <= 0) {
            estimatedWaitTime = 5;
        }

        // 5. Send Masked Safe Data
        res.status(200).json({
            success: true,
            data: {
                myTokenNumber: patient.tokenNumber,
                peopleAhead: ['in-progress', 'completed'].includes(patient.status) ? 0 : peopleAhead,
                estimatedWaitTime: ['in-progress', 'completed'].includes(patient.status) ? 0 : estimatedWaitTime,
                currentServingToken: currentServing ? currentServing.tokenNumber : "None",
                facilityType: patient.facilityType,
                status: patient.status
            }
        });
    } catch (error) {
        console.error("Public Tracking Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

const jwt = require('jsonwebtoken');
const { getPhoneRegex } = require('../utils/phoneHelper');

exports.verifyPatientIdentity = async (req, res) => {
    try {
        const { facilityId } = req.params;
        const { phone, tokenNumber } = req.body;

        const phoneRegex = getPhoneRegex(phone, true);

        // 1. Find patient in this facility (must be completed visit in this flow, or any relevant status)
        // Here we use the tokenNumber to identify the visit in the queue.
        // We might also check the ClinicalVisit directly, but let's stick to Queue since token is available there.
        const visit = await Queue.findOne({
            facilityId,
            phone: phoneRegex || phone,
            tokenNumber: Number(tokenNumber),
            // status: 'completed' // Removed strict completed check to allow uploading even right after visit
        }).lean();

        if (!visit) {
            return res.status(401).json({
                success: false,
                message: "Identity not verified. Check phone/token."
            });
        }

        // Try to get corresponding ClinicalVisit
        const clinicalVisit = await require('../models/ClinicalVisit').findOne({
            patientPhone: visit.phone,
            facilityId: facilityId
        }).sort({ createdAt: -1 }).lean();

        // If no ClinicalVisit, we fallback to just Queue ID, but ideally we want to attach to ClinicalVisit
        const visitId = clinicalVisit ? clinicalVisit._id : visit._id;

        // 2. Create Scoped Session Token (UPLOAD permission only)
        const uploadToken = jwt.sign(
            {
                patientPhone: visit.phone,
                facilityId: facilityId,
                visitId: visitId, // This should ideally map to the document where files are stored
                scope: 'upload_only', // Critical!
                tokenId: visit.tokenNumber
            },
            process.env.JWT_SECRET,
            { expiresIn: '15m' } // 15 mins validity
        );

        // 3. Send masked name for privacy
        const nameToMask = visit.patientName || "Patient";
        res.status(200).json({
            success: true,
            data: {
                uploadToken: uploadToken,
                patientNameMasked: nameToMask.charAt(0) + '***',
                visitDate: visit.createdAt
            }
        });
    } catch (error) {
        console.error("Verify Identity Error:", error);
        res.status(500).json({ success: false, message: "Verification failed" });
    }
};
