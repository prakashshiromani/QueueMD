const Patient = require("../models/Patient");
const Notification = require("../models/Notification");
const Queue = require("../models/Queue");
const Counter = require("../models/Counter");
const { emitQueueUpdate } = require("../sockets/queue.socket");
const logger = require("../utils/logger");
const { emitNotification } = require("../sockets/notification.socket");
const { getPhoneRegex } = require("../utils/phoneHelper");

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

    // Search by name or phone
    const patients = await Patient.find({
      facilityId,
      $or: [
        { name: { $regex: safeQ, $options: "i" } },
        { phone: phoneRegex ? { $regex: phoneRegex } : { $regex: safeQ, $options: "i" } }
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

    const assignedFacilityType = bodyFacilityType || facilityType || "clinic";
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
          message: `Patient is already in the active queue (Token # ${existingActive.tokenNumber})`
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
        lastVisitType: assignedFacilityType.toUpperCase()
      });
    }

    // 2. Automatically Add to Queue
    // Generate next token for this specific department atomically
    const counterId = `token:${facilityId}:${assignedFacilityType}`;
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
        ? `${finalName} (Existing Patient) added to queue with Token #${nextToken}.`
        : `${finalName} has been added to the directory and queue with Token #${nextToken}.`;

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

    res.status(201).json({ 
      success: true, 
      alreadyExists,
      message: alreadyExists ? `Existing patient found! Added to queue with Token #${nextToken}` : "Patient added successfully",
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
    const { facilityId } = req.user;
    const { page = 1, limit = 10, search = "", facility = "", status = "" } = req.query;

    let query = { facilityId };

    if (search) {
      const safeSearch = escapeRegex(search.toString());
      const phoneRegex = getPhoneRegex(search.toString(), false);
      query.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { phone: phoneRegex ? { $regex: phoneRegex } : { $regex: safeSearch, $options: "i" } }
      ];
    }

    if (facility && facility !== "all") {
      query.facilityType = facility;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    // 📅 SMART FILTER: Only show patients whose directory visibility is enabled
    // Future-dated appointment patients are hidden until their appointment day arrives
    query.isDirectoryVisible = { $ne: false }; // Shows patients where field is true OR not set (backward compat)

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
