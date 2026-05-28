const Patient = require("../models/Patient");
const Notification = require("../models/Notification");
const Queue = require("../models/Queue");
const Counter = require("../models/Counter");
const { emitQueueUpdate } = require("../sockets/queue.socket");
const logger = require("../utils/logger");
const { emitNotification } = require("../sockets/notification.socket");
const { getPhoneRegex } = require("../utils/phoneHelper");
const { getISTRange } = require("../utils/dateHelpers");
const { getNextTokenPrefix } = require("../utils/facilityTypeConfig");
const { tenantQuery, tenantData } = require("../utils/tenantIsolation");

async function getNextSequence(id) {
  const counter = await Counter.findByIdAndUpdate(
    id,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

// 🔒 Regex Escape Utility
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.searchPatients = async (req, res, next) => {
  try {
    const { q } = req.query;
    const { facilityId } = req.user;

    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const safeQ = escapeRegex(q.toString());
    const phoneRegex = getPhoneRegex(q.toString(), false);

    // 🔒 SECURITY: Scope with multi-tenant isolation query wrapper (Item 2)
    const query = tenantQuery(req, {
      isDeleted: { $ne: true }, // 🔒 SECURITY: Exclude soft-deleted records
      $or: [
        { name: { $regex: safeQ, $options: "i" } },
        { phone: phoneRegex ? { $regex: phoneRegex } : { $regex: safeQ, $options: "i" } }
      ]
    });

    // 🔒 SECURITY: Enforce strict query field projection to prevent PII/audit leaks (Item 3)
    const patients = await Patient.find(query, 'name phone email gender age status doctorName lastVisit totalVisits isDirectoryVisible').limit(10);

    res.json({ success: true, data: patients });
  } catch (err) {
    logger.error(`Search Error: ${err.message}`);
    next(err);
  }
};

exports.addPatientToDirectory = async (req, res, next) => {
  try {
    // 🔒 SECURITY: Enforce multi-tenant isolation input sanitisation (Item 2)
    const sanitized = tenantData(req, req.body);
    logger.debug(`addPatientToDirectory sanitized body: ${JSON.stringify(sanitized)}`);
    
    const { name, patientName, phone, email, gender, age, status, customData, doctorName, facilityType: bodyFacilityType, consentGiven } = sanitized;
    const { facilityId } = req.user;
    const finalName = name || patientName;

    if (!finalName || !phone) {
      return res.status(400).json({ success: false, message: "Name and phone are required" });
    }

    const assignedFacilityType = bodyFacilityType || req.user.facilityType || "clinic";
    const phoneRegex = getPhoneRegex(phone, true);

    // 1. Check if patient already exists in the same facility
    let patient = await Patient.findOne({ 
      phone: phoneRegex || phone, 
      facilityId 
    });
    let alreadyExists = false;

    if (patient) {
      alreadyExists = true;

      // Check if they are already in the active queue for this facility
      const existingActive = await Queue.findOne({
        facilityId,
        $or: [
          { patientId: patient._id },
          { phone: phoneRegex || phone }
        ],
        status: { $in: ["waiting", "in-progress"] }
      });

      if (existingActive) {
        return res.status(400).json({ 
          success: false, 
          message: `Patient is already in the active queue (Token #${getNextTokenPrefix(assignedFacilityType)}-${String(existingActive.tokenNumber).padStart(3, '0')})`
        });
      }

      // Update patient's information
      patient.name = finalName;
      if (email) patient.email = email;
      if (gender) patient.gender = gender;
      if (age) patient.age = age;
      if (doctorName) patient.doctorName = doctorName;
      if (customData) patient.customData = { ...patient.customData, ...customData };
      patient.status = "Active";
      patient.lastVisit = new Date();
      patient.lastVisitType = assignedFacilityType.toUpperCase();
      patient.facilityType = assignedFacilityType; // Use the most recently registered department
      
      // 🔒 SECURITY: GDPR/DPDP consent logging (Item 6)
      if (consentGiven !== undefined) {
        patient.consentGiven = consentGiven === true;
        patient.consentTimestamp = consentGiven === true ? new Date() : undefined;
      }
      
      await patient.save();

    } else {
      // Create new patient
      patient = await Patient.create({
        facilityId,
        facilityType: assignedFacilityType,
        name: finalName,
        phone,
        email,
        gender,
        age,
        doctorName,
        customData: customData || {},
        status: status ? (status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()) : "Active",
        lastVisit: new Date(),
        lastVisitType: assignedFacilityType.toUpperCase(),
        // 🔒 SECURITY: GDPR/DPDP consent logging (Item 6)
        consentGiven: consentGiven === true,
        consentTimestamp: consentGiven === true ? new Date() : undefined
      });
    }

    // 2. Automatically Add to Queue
    // Generate next token for this specific department atomically with daily resets
    const counterId = `token:${facilityId}:${assignedFacilityType}`;
    const { start: todayStart } = getISTRange("today");
    const todayEntry = await Queue.findOne({
      facilityId,
      facilityType: assignedFacilityType,
      createdAt: { $gte: todayStart }
    });

    if (!todayEntry) {
      // No patients today yet: reset sequence to 0
      await Counter.findOneAndUpdate(
        { _id: counterId },
        { seq: 0 },
        { upsert: true, new: true }
      );
    } else {
      // Ensure counter document exists
      let counter = await Counter.findById(counterId);
      if (!counter) {
        const lastToken = await Queue.findOne({ facilityId, facilityType: assignedFacilityType })
          .sort({ tokenNumber: -1 });

        let startNum = 0;
        if (lastToken) {
          startNum = lastToken.tokenNumber;
        }
        try {
          await Counter.create({ _id: counterId, seq: startNum });
        } catch (err) {}
      }
    }
    const nextToken = await getNextSequence(counterId);

    // Create Queue entry
    const newQueueEntry = await Queue.create({
      facilityId,
      facilityType: assignedFacilityType,
      patientId: patient._id,
      patientName: finalName,
      phone,
      customData: patient.customData || {},
      doctorName: doctorName || "Unknown",
      tokenNumber: nextToken,
      status: "waiting",
      createdAt: new Date()
    });

    // Socket emit to queue
    emitQueueUpdate(facilityId, assignedFacilityType, {
      action: "add",
      patient: newQueueEntry
    });

    // 3. Send Notification
    try {
      const notifMessage = alreadyExists 
        ? `${finalName} (Existing Patient) added to queue with Token #${getNextTokenPrefix(assignedFacilityType)}-${String(nextToken).padStart(3, '0')}.`
        : `${finalName} has been added to the directory and queue with Token #${getNextTokenPrefix(assignedFacilityType)}-${String(nextToken).padStart(3, '0')}.`;

      const newNotif = await Notification.create({
        facilityId,
        facilityType: assignedFacilityType,
        type: alreadyExists ? "queue_update" : "system",
        title: alreadyExists ? "Patient Re-visited" : "New Patient Registered",
        message: notifMessage,
        isRead: false,
        metadata: { patientId: patient._id, patientName: finalName, tokenNumber: nextToken }
      });
      // Real-time push
      emitNotification(facilityId, newNotif);
    } catch (notifErr) {
      logger.error(`Notification error during registration: ${notifErr.message}`);
    }

    // 🔒 SECURITY: EMR compliance access auditing for registration (Item 3)
    const { logAudit } = require("../utils/auditLogger");
    await logAudit(req, {
      action: alreadyExists ? "PATIENT_REVISIT" : "PATIENT_REGISTER",
      facilityId,
      userId: req.user.id,
      severity: "info",
      status: "success",
      details: { patientId: patient._id, patientName: finalName, phone }
    });

    res.status(201).json({ 
      success: true, 
      alreadyExists,
      message: alreadyExists ? `Existing patient found! Added to queue with Token #${getNextTokenPrefix(assignedFacilityType)}-${String(nextToken).padStart(3, '0')}` : "Patient added successfully",
      data: patient,
      queueInfo: { tokenNumber: nextToken }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Patient already exists in directory" });
    }
    next(err);
  }
};

exports.getPatients = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = "", facility = "", status = "", gender = "", doctor = "" } = req.query;

    // 🔒 SECURITY: Enforce multi-tenant isolation query wrapper (Item 2)
    let query = tenantQuery(req, { isDeleted: { $ne: true } });

    if (search) {
      const safeSearch = escapeRegex(search.toString());
      const phoneRegex = getPhoneRegex(search.toString(), false);
      query.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { phone: phoneRegex ? { $regex: phoneRegex } : { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
        { status: { $regex: safeSearch, $options: "i" } },
        { gender: { $regex: safeSearch, $options: "i" } },
        { doctorName: { $regex: safeSearch, $options: "i" } }
      ];
    }

    if (facility && facility !== "all") {
      query.facilityType = facility;
    }

    if (status && status !== "all") {
      const capStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
      query.status = capStatus;
    }

    if (gender && gender !== "all") {
      const capGender = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
      query.gender = capGender;
    }

    if (doctor && doctor !== "all") {
      query.doctorName = doctor;
    }

    // 📅 SMART FILTER: Only show patients whose directory visibility is enabled
    // Future-dated appointment patients are hidden until their appointment day arrives
    query.isDirectoryVisible = { $ne: false }; // Shows patients where field is true OR not set (backward compat)

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 🔒 SECURITY: Enforce strict query field projection to prevent PII/audit leaks (Item 3)
    const patients = await Patient.find(query, 'name phone email gender age status doctorName lastVisit totalVisits isDirectoryVisible')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Patient.countDocuments(query);

    res.json({ 
      success: true, 
      patients, 
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    next(err);
  }
};

exports.togglePatientStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 🔒 SECURITY: Enforce multi-tenant isolation query wrapper (Item 2)
    const query = tenantQuery(req, { _id: id, isDeleted: { $ne: true } });
    const patient = await Patient.findOne(query);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    // Toggle: Active <-> Inactive
    const currentStatus = patient.status?.toLowerCase() || "active";
    patient.status = currentStatus === "active" ? "Inactive" : "Active";
    
    await patient.save();

    res.json({ 
      success: true, 
      message: `Patient marked as ${patient.status}`,
      data: patient 
    });
  } catch (err) {
    next(err);
  }
};

// ✅ UPDATE PATIENT
exports.updatePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, email } = req.body;

    // 🔒 SECURITY: Enforce multi-tenant isolation query wrapper (Item 2)
    const query = tenantQuery(req, { _id: id, isDeleted: { $ne: true } });
    const patient = await Patient.findOneAndUpdate(
      query,
      { name, phone, email },
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    // 🔒 SECURITY: EMR compliance access auditing for update (Item 3)
    await logAudit(req, {
      action: "PATIENT_UPDATE",
      facilityId: req.user.facilityId,
      userId: req.user.id,
      severity: "info",
      status: "success",
      details: { patientId: patient._id, patientName: patient.name }
    });

    res.json({ success: true, message: "Patient updated", data: patient });
  } catch (err) {
    next(err);
  }
};

// ✅ DELETE PATIENT (Soft Delete & Recursive Anonymization — HIPAA/GDPR Right to Erasure)
// 🔒 SECURITY: Medical records MUST NOT be hard deleted.
// isDeleted=true hides the patient, and we scrub/anonymize all PII from linked visits and queues.
exports.deletePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { logAudit } = require("../utils/auditLogger");

    // 🔒 SECURITY: Enforce multi-tenant isolation query wrapper
    const query = tenantQuery(req, { _id: id, isDeleted: { $ne: true } });
    const patient = await Patient.findOne(query);

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    const originalPhone = patient.phone;
    const originalName = patient.name;
    const anonymizedPhone = `ANONYMIZED_${id.substring(id.length - 4)}`;

    // 1. Soft-delete and anonymize patient profile
    patient.isDeleted = true;
    patient.deletedAt = new Date();
    patient.deletedBy = req.user.id;
    patient.status = "Archived";
    patient.name = "ANONYMIZED_PATIENT";
    patient.phone = anonymizedPhone;
    patient.email = "anonymized@queuemd.com";
    patient.customData = {};
    await patient.save();

    // 2. Anonymize Linked ClinicalVisits
    const ClinicalVisit = require("../models/ClinicalVisit");
    await ClinicalVisit.updateMany(
      { patientPhone: originalPhone, facilityId: req.user.facilityId },
      {
        patientName: "ANONYMIZED_PATIENT",
        patientPhone: anonymizedPhone
      }
    );

    // 3. Anonymize Linked Queue records
    await Queue.updateMany(
      { patientId: id, facilityId: req.user.facilityId },
      {
        patientName: "ANONYMIZED_PATIENT",
        phone: anonymizedPhone,
        customData: {}
      }
    );

    // 🔒 SECURITY: EMR compliance access auditing for GDPR delete
    await logAudit(req, {
      action: "PATIENT_DELETE_ERASURE",
      facilityId: req.user.facilityId,
      userId: req.user.id,
      severity: "warning",
      status: "success",
      details: { patientId: patient._id, originalName, originalPhone }
    });

    res.json({ success: true, message: "Patient records successfully anonymized and soft-deleted (GDPR Right to Erasure completed)." });
  } catch (err) {
    next(err);
  }
};

// ✅ EXPORT PATIENT DATA (GDPR/HIPAA Data Portability)
exports.exportPatientData = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { logAudit } = require("../utils/auditLogger");

    // 🔒 SECURITY: Enforce multi-tenant isolation query wrapper
    const query = tenantQuery(req, { _id: id, isDeleted: { $ne: true } });
    const patient = await Patient.findOne(query);

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    // Retrieve all linked clinical visits
    const ClinicalVisit = require("../models/ClinicalVisit");
    const clinicalVisits = await ClinicalVisit.find({
      patientPhone: patient.phone,
      facilityId: req.user.facilityId
    }).sort({ createdAt: -1 });

    // Retrieve all linked queue history records
    const queueHistory = await Queue.find({
      patientId: patient._id,
      facilityId: req.user.facilityId
    }).sort({ createdAt: -1 });

    // Build the full export package
    const exportData = {
      exportedAt: new Date(),
      facilityId: req.user.facilityId,
      patientProfile: {
        id: patient._id,
        name: patient.name,
        phone: patient.phone,
        email: patient.email,
        gender: patient.gender,
        age: patient.age,
        status: patient.status,
        consentGiven: patient.consentGiven,
        consentTimestamp: patient.consentTimestamp,
        createdAt: patient.createdAt
      },
      clinicalVisits: clinicalVisits.map(visit => ({
        visitId: visit._id,
        date: visit.createdAt,
        diagnosis: visit.diagnosis, // Will automatically decrypt due to mongoose field encryption plugin
        prescriptionNotes: visit.prescriptionNotes,
        vitals: visit.vitals,
        status: visit.status,
        documents: visit.documents.map(doc => ({
          url: doc.url,
          type: doc.type,
          uploadedBy: doc.uploadedBy,
          uploadedAt: doc.uploadedAt,
          fileName: doc.fileName
        }))
      })),
      queueHistory: queueHistory.map(q => ({
        queueId: q._id,
        date: q.createdAt,
        tokenNumber: q.tokenNumber,
        status: q.status,
        waitTime: q.waitTime,
        actualDuration: q.actualDuration,
        doctorName: q.doctorName,
        consultationNotes: q.consultationNotes
      }))
    };

    // 🔒 SECURITY: HIPAA Audit log entry for PHI data export
    await logAudit(req, {
      action: "PATIENT_DATA_EXPORT",
      facilityId: req.user.facilityId,
      userId: req.user.id,
      severity: "warning",
      status: "success",
      details: { patientId: patient._id, patientName: patient.name }
    });

    res.setHeader("Content-Disposition", `attachment; filename="patient_export_${id}.json"`);
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({
      success: true,
      data: exportData
    });
  } catch (err) {
    next(err);
  }
};
