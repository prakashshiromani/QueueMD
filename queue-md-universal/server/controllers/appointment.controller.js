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
    
    // Debug log (remove after testing)
    console.log("🔍 Creating appointment for:", {
      facilityId,
      facilityType,
      userId: req.user.id
    });

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

    // 👤 Upsert Patient (FIXED ✅)
    let patient = await Patient.findOne({ 
      phone, 
      facilityId,
      facilityType // ✅ Added for strict isolation
    });
    
    if (!patient) {
      // ✅ NEW PATIENT - Create in Directory
      patient = await Patient.create({ 
        facilityId, 
        facilityType,
        name: patientName, 
        phone, 
        email,
        gender: req.body.gender || undefined,
        age: req.body.age || undefined,
        lastVisit: new Date(appointmentDate) // ✅ Track last visit
      });
      
      console.log("✅ New patient created in directory:", patient._id);
    } else {
      // ✅ EXISTING PATIENT - Update details
      patient.name = patientName; 
      patient.email = email || patient.email;
      patient.lastVisit = new Date(appointmentDate); // ✅ Update last visit
      // Ensure facilityType is set if it was somehow missing
      if (!patient.facilityType) patient.facilityType = facilityType;
      await patient.save();
      
      console.log("🔄 Existing patient updated in directory:", patient._id);
    }

    // ✅ Create Appointment
    const newAppointment = await Appointment.create({
      facilityId,
      facilityType, // ✅ Already there
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
      createdBy: req.user.id
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
    console.error("❌ Create Appointment Error:", err);
    
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
    console.error("❌ Update Appointment Error:", err);
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

// ✅ 7. Manual Sync (Emergency CRM Fix)
exports.syncToDirectory = async (req, res, next) => {
  try {
    const { facilityId, facilityType } = req.user;
    
    // Get all appointments without patientId or with missing directory links
    const appointments = await Appointment.find({
      facilityId,
      facilityType,
      $or: [{ patientId: null }, { patientId: { $exists: false } }]
    });

    let synced = 0;

    for (const apt of appointments) {
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
          lastVisit: apt.appointmentDate
        });
      }

      // Link appointment to patient
      apt.patientId = patient._id;
      await apt.save();
      
      synced++;
    }

    res.json({
      success: true,
      message: `Successfully synced ${synced} appointments to patient directory`,
      synced
    });

  } catch (err) {
    console.error("❌ Sync Error:", err);
    next(err);
  }
};
// ✅ DELETE PATIENT & ALL ASSOCIATED RECORDS
exports.deletePatient = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { facilityId, facilityType } = req.user;

    console.log("=== DELETE PATIENT DEBUG ===");
    console.log("req.params.patientId:", patientId);
    console.log("req.user.facilityId:", facilityId);
    console.log("req.user.facilityType:", facilityType);

    // 1. Find and Delete Patient
    const patient = await Patient.findOneAndDelete({
      _id: patientId,
      facilityId,
      facilityType
    });

    if (!patient) {
      console.log("❌ Patient not found with these criteria in Facility:", facilityId);
      // Optional: Log if patient exists without filter to confirm isolation
      const rawPatient = await Patient.findById(patientId);
      if (rawPatient) {
        console.log("⚠️ Patient exists but belongs to a different facility:", rawPatient.facilityId);
      } else {
        console.log("🚫 Patient ID does not exist in Database at all.");
      }
      return res.status(404).json({ success: false, message: "Patient not found" });
    }
    console.log("✅ Patient found and deleted:", patient.patientName);

    // 2. Delete ALL Appointments associated with this Patient (Isolated by Facility)
    await Appointment.deleteMany({ 
      patientId: patientId,
      facilityId,
      facilityType
    });

    // 3. Delete from Queue if they are waiting
    await Queue.deleteMany({ phone: patient.phone, facilityId, facilityType });

    // 4. Emit Socket Event (Optional: to refresh lists)
    emitAppointmentUpdate(facilityId, facilityType, {
      action: "patient_deleted",
      patientId
    });

    res.json({ 
      success: true, 
      message: "Patient and all related records deleted successfully" 
    });

  } catch (err) {
    next(err);
  }
};
