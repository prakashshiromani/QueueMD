// server/controllers/appointment.controller.js
const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const Queue = require("../models/Queue");
const { emitAppointmentUpdate } = require("../sockets/appointment.socket");
const logger = require("../utils/logger");

// ✅ 1. Create Appointment (New Booking)
exports.createAppointment = async (req, res, next) => {
  try {
    // 🔥 Extract from token (ALWAYS trust token over body)
    const { facilityId, facilityType } = req.user;
    
    logger.debug(`Creating appointment for: ${JSON.stringify({
      facilityId,
      facilityType,
      userId: req.user.id
    })}`);

    const { 
      patientName, 
      phone, 
      email, 
      appointmentDate, 
      startTime, 
      endTime, 
      appointmentType, 
      doctorName, 
      notes 
    } = req.body;

    // ✅ VALIDATION: Ensure facilityType exists
    if (!facilityType) {
      return res.status(400).json({
        success: false,
        message: "facilityType is missing from user token. Please login again."
      });
    }

    // ✅ Validate required fields
    if (!patientName || !appointmentDate || !startTime) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: patientName, appointmentDate, startTime"
      });
    }

    // 🔒 Check Slot Conflict (Overlap detection)
    const conflict = await Appointment.findOne({
      facilityId,
      facilityType,
      appointmentDate: new Date(appointmentDate),
      startTime: { $lt: endTime },  // existing start < new end
      endTime: { $gt: startTime },  // existing end > new start
      status: { $nin: ["cancelled", "no-show"] }
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `Time slot overlaps with existing appointment (${conflict.startTime} - ${conflict.endTime}) on ${appointmentDate}. Please choose a different time.`,
        conflict: {
          patientName: conflict.patientName,
          tokenNumber: conflict.tokenNumber,
          startTime: conflict.startTime,
          endTime: conflict.endTime
        }
      });
    }

    // 🔢 Generate Token
    const lastAppt = await Appointment.findOne({ 
      facilityId, 
      facilityType 
    }).sort({ createdAt: -1 }).select("tokenNumber");
    
    let nextSeq = 1;
    if (lastAppt?.tokenNumber) {
      const parts = lastAppt.tokenNumber.split("-");
      nextSeq = parseInt(parts[1]) + 1;
    }
    const tokenNumber = `APPT-${String(nextSeq).padStart(3, '0')}`;

    // 📅 SMART DATE CHECK: Aaj ki appointment hai ya future ki?
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const apptDate = new Date(appointmentDate);
    apptDate.setHours(0, 0, 0, 0);
    const isToday = apptDate.getTime() === todayStart.getTime();

    logger.debug(`Appointment date check: apptDate=${apptDate.toISOString()}, isToday=${isToday}`);

    // 👤 Upsert Patient with smart directory visibility
    let patient = await Patient.findOne({ 
      phone, 
      facilityId,
      facilityType
    });
    
    if (!patient) {
      // ✅ NEW PATIENT
      // Aaj ki appointment → immediately visible, future → hidden until that day
      patient = await Patient.create({ 
        facilityId, 
        facilityType,
        name: patientName, 
        phone, 
        email,
        gender: req.body.gender || undefined,
        age: req.body.age || undefined,
        lastVisit: new Date(appointmentDate),
        isDirectoryVisible: isToday  // ✅ KEY LOGIC: aaj = true, future = false
      });
      
      logger.info(`New patient created: ${patient._id} | isDirectoryVisible: ${isToday}`);
    } else {
      // ✅ EXISTING PATIENT - Update details
      patient.name = patientName; 
      patient.email = email || patient.email;
      patient.lastVisit = new Date(appointmentDate);
      if (!patient.facilityType) patient.facilityType = facilityType;
      // If patient was hidden (future appt) and now books for today → make visible
      if (isToday && !patient.isDirectoryVisible) {
        patient.isDirectoryVisible = true;
      }
      await patient.save();
      
      logger.info(`Existing patient updated: ${patient._id} | isDirectoryVisible: ${patient.isDirectoryVisible}`);
    }

    // ✅ Create Appointment with pendingDirectorySync flag
    const newAppointment = await Appointment.create({
      facilityId,
      facilityType,
      patientId: patient._id,
      patientName,
      phone,
      email,
      appointmentDate,
      startTime,
      endTime,
      appointmentType,
      doctorName,
      notes,
      tokenNumber,
      createdBy: req.user.id,
      pendingDirectorySync: !isToday  // ✅ Future appointments need sync on that day
    });

    // 🔥 Real-time Socket Emit
    const { emitAppointmentUpdate } = require("../sockets/appointment.socket");
    emitAppointmentUpdate(facilityId, facilityType, {
      action: "create",
      appointment: newAppointment
    });

    logger.info(`Appointment created: ${tokenNumber} for ${patientName}`);

    res.status(201).json({ 
      success: true,  
      appointment: newAppointment,
      message: "Appointment created successfully"
    });

  } catch (err) {
    logger.error(`Create Appointment Error: ${err.message}`, { stack: err.stack });
    
    // ✅ Better error messages
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: Object.values(err.errors).map(e => e.message)
      });
    }
    
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate entry. This appointment already exists."
      });
    }
    
    next(err);
  }
};

// ✅ 2. Get Appointments (Calendar / List View)
exports.getAppointments = async (req, res, next) => {
  try {
    const { facilityId, facilityType } = req.user;
    const { startDate, endDate } = req.query;

    const query = { facilityId, facilityType };
    if (startDate && endDate) {
      query.appointmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const appointments = await Appointment.find(query)
      .sort({ appointmentDate: 1, startTime: 1 })
      .limit(100); // Optimization

    res.json({ success: true, count: appointments.length,  appointments });
  } catch (err) {
    next(err);
  }
};

// ✅ 3. Get Today's Schedule (Sidebar Widget)
exports.getTodaySchedule = async (req, res, next) => {
  try {
    const { facilityId, facilityType } = req.user;
    
    // 🔥 Robust Date Range (Start of Day to End of Day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // ✅ Fetch ALL appointments for today (no status filter)
    const appointments = await Appointment.find({
      facilityId,
      facilityType,
      appointmentDate: { $gte: today, $lt: tomorrow }
    }).sort({ startTime: 1, createdAt: -1 });

    // 🔥 Accurate Stats Calculation
    const stats = {
      total: appointments.length,
      completed: appointments.filter(a => a.status === "completed").length,
      cancelled: appointments.filter(a => a.status === "cancelled").length,
      remaining: appointments.filter(a => a.status !== "completed" && a.status !== "cancelled").length,
      checkedIn: appointments.filter(a => a.status === "checked-in").length
    };

    res.json({ 
      success: true, 
      appointments, 
      stats 
    });
  } catch (err) {
    next(err);
  }
};

// ✅ 4. Update Status (Check-in, Complete, etc.)
exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const { facilityId, facilityType } = req.user;

    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, facilityId, facilityType },
      { 
        status, 
        ...(status === "checked-in" && { checkedInAt: new Date() }),
        ...(status === "completed" && { completedAt: new Date() }),
        notes 
      },
      { new: true }
    );

    if (!appointment) return res.status(404).json({ success: false, message: "Not found" });

    // 🔄 Auto-Convert to Queue on Check-in
    if (status === "checked-in" && !appointment.isConvertedToQueue) {
      // Create Queue Entry
      const queueEntry = await Queue.create({
        facilityId, facilityType,
        patientName: appointment.patientName,
        phone: appointment.phone,
        tokenNumber: appointment.tokenNumber,
        status: "waiting",
        appointmentId: appointment._id,
        isConvertedToQueue: true
      });
      
      appointment.queueId = queueEntry._id;
      appointment.isConvertedToQueue = true;
      await appointment.save();
    }

    // 📡 Emit Update
    emitAppointmentUpdate(facilityId, facilityType, { action: "update", appointment });
    
    res.json({ success: true,  appointment });
  } catch (err) {
    next(err);
  }
};

// ✅ 5. Update Appointment (Edit Entry)
exports.updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { facilityId, facilityType } = req.user;
    const { 
      patientName, phone, email, appointmentDate, 
      startTime, endTime, appointmentType, doctorName, notes 
    } = req.body;

    // 🔍 Step 1: Fetch existing appointment (for patientId + old phone)
    const existingAppointment = await Appointment.findOne({ 
      _id: id, 
      facilityId, 
      facilityType 
    });

    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    // 🔒 Step 2: Conflict check (exclude current appointment + overlap detection)
    const conflict = await Appointment.findOne({
      facilityId,
      facilityType,
      appointmentDate: new Date(appointmentDate),
      startTime: { $lt: endTime },  // existing start < new end
      endTime: { $gt: startTime },  // existing end > new start
      _id: { $ne: id }, // ✅ Exclude current
      status: { $nin: ["cancelled", "no-show"] }
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `Time slot overlaps with existing appointment (${conflict.startTime} - ${conflict.endTime}) on ${appointmentDate}. Please choose a different time.`,
        conflict: {
          patientName: conflict.patientName,
          tokenNumber: conflict.tokenNumber,
          startTime: conflict.startTime,
          endTime: conflict.endTime
        }
      });
    }

    // ✅ Step 3: Update Appointment document
    const updatedAppointment = await Appointment.findOneAndUpdate(
      { _id: id, facilityId, facilityType },
      {
        patientName,
        phone,
        email,
        appointmentDate,
        startTime,
        endTime,
        appointmentType,
        doctorName,
        notes
      },
      { new: true, runValidators: true }
    );

    // 🔥 Step 4: PATIENT DIRECTORY SYNC (THE FIX)
    if (existingAppointment.patientId) {
      // ✅ Case A: Patient already linked - update all relevant fields
      await Patient.findByIdAndUpdate(
        existingAppointment.patientId,
        {
          name: patientName,
          email: email || undefined,
          lastVisit: new Date(appointmentDate),
          facilityType: appointmentType,              // 🔥 Badge update ke liye
          lastVisitType: appointmentType.toUpperCase(), // 🔥 Text update ke liye
          ...(doctorName && { doctorName })
        },
        { runValidators: true }
      );
      
    } else {
      // ✅ Case B: No patientId - find or create patient
      let patient = await Patient.findOne({ 
        phone, 
        facilityId, 
        facilityType 
      });

      if (!patient) {
        patient = await Patient.create({
          facilityId,
          facilityType: appointmentType,              // 🔥 New patient me bhi
          name: patientName,
          phone,
          email,
          lastVisit: new Date(appointmentDate),
          lastVisitType: appointmentType.toUpperCase(), // 🔥
          ...(doctorName && { doctorName })
        });
      } else {
        patient.name = patientName;
        patient.email = email || patient.email;
        patient.lastVisit = new Date(appointmentDate);
        patient.facilityType = appointmentType;              // 🔥
        patient.lastVisitType = appointmentType.toUpperCase(); // 🔥
        if (doctorName) patient.doctorName = doctorName;
        await patient.save();
      }

      // Link appointment to patient
      updatedAppointment.patientId = patient._id;
      await updatedAppointment.save();
    }

    // 🔥 Step 5: Handle Phone Change Edge Case
    if (existingAppointment.phone !== phone && existingAppointment.phone) {
      // Phone changed - unlink from old patient if no other appointments
      const otherAppointments = await Appointment.countDocuments({
        patientId: existingAppointment.patientId,
        _id: { $ne: id }
      });

      if (otherAppointments === 0) {
        // Optional: Mark old patient as inactive or keep as-is
        // For now, we keep it (safer)
      }
    }

    // 📡 Step 6: Real-time Socket Emit
    emitAppointmentUpdate(facilityId, facilityType, {
      action: "update",
      appointment: updatedAppointment
    });

    logger.info(`Appointment updated: ${id} by ${req.user.id}`);

    res.json({
      success: true,
      appointment: updatedAppointment,
      message: "Appointment updated successfully"
    });

  } catch (err) {
    logger.error(`Update Appointment Error: ${err.message}`, { stack: err.stack });
    next(err);
  }
};

// ✅ 6. Delete Appointment
exports.deleteAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { facilityId, facilityType } = req.user;

    const deleted = await Appointment.findOneAndDelete({ _id: id, facilityId, facilityType });
    if (!deleted) return res.status(404).json({ success: false, message: "Not found" });

    emitAppointmentUpdate(facilityId, facilityType, { action: "delete", appointmentId: id });
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    next(err);
  }
};

// ✅ 7. Manual Sync (Emergency CRM Fix) — with Smart Date Logic
exports.syncToDirectory = async (req, res, next) => {
  try {
    const { facilityId, facilityType } = req.user;
    
    // Get all appointments without patientId or with missing directory links
    const appointments = await Appointment.find({
      facilityId,
      facilityType,
      $or: [{ patientId: null }, { patientId: { $exists: false } }]
    });

    // 📅 Date check
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let synced = 0;

    for (const apt of appointments) {
      const apptDate = new Date(apt.appointmentDate);
      apptDate.setHours(0, 0, 0, 0);
      const isToday = apptDate.getTime() === todayStart.getTime();
      const isPast = apptDate.getTime() < todayStart.getTime();
      // Visible if appointment is today or in the past
      const shouldBeVisible = isToday || isPast;

      // Find or create patient
      let patient = await Patient.findOne({ 
        phone: apt.phone, 
        facilityId,
        facilityType
      });

      if (!patient) {
        patient = await Patient.create({
          facilityId,
          facilityType,
          name: apt.patientName,
          phone: apt.phone,
          email: apt.email,
          lastVisit: apt.appointmentDate,
          isDirectoryVisible: shouldBeVisible  // ✅ Smart visibility
        });
      } else if (shouldBeVisible && !patient.isDirectoryVisible) {
        // Make visible if appt is today/past but patient was hidden
        patient.isDirectoryVisible = true;
        await patient.save();
      }

      // Link appointment to patient
      apt.patientId = patient._id;
      apt.pendingDirectorySync = !shouldBeVisible;
      await apt.save();
      
      synced++;
    }

    res.json({
      success: true,
      message: `Successfully synced ${synced} appointments to patient directory`,
      synced
    });

  } catch (err) {
    logger.error(`Sync Error: ${err.message}`, { stack: err.stack });
    next(err);
  }
};
// ✅ DELETE PATIENT & ALL ASSOCIATED RECORDS (Soft Delete & Anonymization — HIPAA/GDPR Right to Erasure)
exports.deletePatient = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { facilityId, facilityType } = req.user;

    // 🔒 SECURITY: Strict RBAC check to ensure only Admins can execute medical data erasure
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required to delete patient records" });
    }

    logger.debug(`DELETE PATIENT AUDIT: patientId=${patientId}, facilityId=${facilityId}, facilityType=${facilityType}`);

    // 1. Find the active patient record
    const patient = await Patient.findOne({
      _id: patientId,
      facilityId,
      isDeleted: { $ne: true }
    });

    if (!patient) {
      logger.warn(`[SECURITY] Patient deletion attempted for non-existing or already deleted record: ${patientId}`);
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    const originalPhone = patient.phone;
    const originalName = patient.name;
    const anonymizedPhone = `ANONYMIZED_${patientId.substring(patientId.length - 4)}`;

    // 2. Soft-delete and scrub PII from patient profile
    patient.isDeleted = true;
    patient.deletedAt = new Date();
    patient.deletedBy = req.user.id;
    patient.status = "Archived";
    patient.name = "ANONYMIZED_PATIENT";
    patient.phone = anonymizedPhone;
    patient.email = "anonymized@queuemd.com";
    patient.customData = {};
    await patient.save();

    logger.info(`Patient ${patientId} soft-deleted and anonymized safely.`);

    // 3. Anonymize all Appointments instead of hard-deleting (preserves medical trail metadata)
    await Appointment.updateMany(
      { patientId, facilityId },
      { 
        patientName: "ANONYMIZED_PATIENT", 
        phone: anonymizedPhone,
        notes: "ANONYMIZED DUE TO ERASURE REQUEST",
        email: "anonymized@queuemd.com"
      }
    );

    // 4. Anonymize associated Queue records
    await Queue.updateMany(
      { phone: originalPhone, facilityId },
      {
        patientName: "ANONYMIZED_PATIENT",
        phone: anonymizedPhone,
        customData: {}
      }
    );

    // 5. Anonymize associated ClinicalVisits
    const ClinicalVisit = require("../models/ClinicalVisit");
    await ClinicalVisit.updateMany(
      { patientPhone: originalPhone, facilityId },
      {
        patientName: "ANONYMIZED_PATIENT",
        patientPhone: anonymizedPhone
      }
    );

    // 6. Write secure audit log
    const { logAudit } = require("../utils/auditLogger");
    await logAudit(req, {
      action: "PATIENT_DELETE_ERASURE_APPT",
      facilityId,
      userId: req.user.id,
      severity: "critical",
      status: "success",
      details: { patientId, originalName, originalPhone }
    });

    // 7. Emit Socket Event to refresh frontend lists
    emitAppointmentUpdate(facilityId, facilityType, {
      action: "patient_deleted",
      patientId
    });

    res.json({ 
      success: true, 
      message: "Patient and all related records successfully anonymized (GDPR Right to Erasure completed)." 
    });

  } catch (err) {
    next(err);
  }
};
