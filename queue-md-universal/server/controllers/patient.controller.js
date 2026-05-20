const Patient = require("../models/Patient");
const Notification = require("../models/Notification");
const logger = require("../utils/logger");
const { emitNotification } = require("../sockets/notification.socket");

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

    // Search by name or phone
    const patients = await Patient.find({
      facilityId,
      $or: [
        { name: { $regex: safeQ, $options: "i" } },
        { phone: { $regex: safeQ, $options: "i" } }
      ]
    }).limit(10);

    res.json({ success: true, data: patients });
  } catch (err) {
    logger.error(`Search Error: ${err.message}`);
    next(err);
  }
};

exports.addPatientToDirectory = async (req, res, next) => {
  try {
    const { facilityId, facilityType } = req.user;
    logger.debug(`addPatientToDirectory body: ${JSON.stringify(req.body)}`);
    const { name, patientName, phone, email, gender, age, status, customData, doctorName, facilityType: bodyFacilityType } = req.body;
    const finalName = name || patientName;

    if (!finalName || !phone) {
      return res.status(400).json({ success: false, message: "Name and phone are required" });
    }

    const patient = await Patient.create({
      facilityId,
      facilityType: bodyFacilityType || facilityType || "clinic",
      name: finalName,
      phone,
      email,
      gender,
      age,
      doctorName,
      customData: customData || {},
      status: status ? (status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()) : "Active",
      lastVisit: new Date(),
      lastVisitType: (bodyFacilityType || facilityType || "clinic").toUpperCase()
    });

    // 🔥 NEW: Send Notification for Patient Registration
    try {
      const notifType = bodyFacilityType || facilityType || "clinic";
      const newNotif = await Notification.create({
        facilityId,
        facilityType: notifType,
        type: "system",
        title: "New Patient Registered",
        message: `${finalName} has been added to the directory.`,
        isRead: false,
        metadata: { patientId: patient._id, patientName: finalName }
      });
      // 🔥 Real-time push to centralized notification room
      emitNotification(facilityId, newNotif);
    } catch (notifErr) {
      logger.error(`Notification error during registration: ${notifErr.message}`);
    }

    res.status(201).json({ success: true, data: patient });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Patient already exists in directory" });
    }
    next(err);
  }
};

exports.getPatients = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const { page = 1, limit = 10, search = "", facility = "", status = "" } = req.query;

    let query = { facilityId };

    if (search) {
      const safeSearch = escapeRegex(search.toString());
      query.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { phone: { $regex: safeSearch, $options: "i" } }
      ];
    }

    if (facility && facility !== "all") {
      query.facilityType = facility;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const patients = await Patient.find(query)
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
    const { facilityId } = req.user;

    const patient = await Patient.findOne({ _id: id, facilityId });
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
    const { facilityId } = req.user;
    const { name, phone, email } = req.body;

    const patient = await Patient.findOneAndUpdate(
      { _id: id, facilityId },
      { name, phone, email },
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    res.json({ success: true, message: "Patient updated", data: patient });
  } catch (err) {
    next(err);
  }
};

// ✅ DELETE PATIENT
exports.deletePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { facilityId } = req.user;

    const patient = await Patient.findOneAndDelete({ _id: id, facilityId });

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    res.json({ success: true, message: "Patient deleted successfully" });
  } catch (err) {
    next(err);
  }
};
