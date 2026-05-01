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

    // 🔒 Check Slot Conflict (Better Error Message)
    const conflict = await Appointment.findOne({
      facilityId,
      facilityType,
      appointmentDate: new Date(appointmentDate),
      startTime,
      status: { $nin: ["cancelled", "no-show"] }
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `Time slot ${startTime} is already booked for ${appointmentDate}. Please choose a different time.`,
        conflict: {
          patientName: conflict.patientName,
          tokenNumber: conflict.tokenNumber
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
      // ✅ FIXED: Include facilityType in Patient.create
      patient = await Patient.create({ 
        facilityId, 
        facilityType, // 🔥 THIS WAS MISSING!
        name: patientName, 
        phone, 
        email,
        gender: req.body.gender || undefined,
        age: req.body.age || undefined
      });
      
      console.log("✅ New patient created:", patient._id);
    } else {
      // Update existing patient
      patient.name = patientName; 
      patient.email = email || patient.email;
      // Ensure facilityType is set if it was somehow missing
      if (!patient.facilityType) patient.facilityType = facilityType;
      await patient.save();
      
      console.log("🔄 Existing patient updated:", patient._id);
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
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await Appointment.find({
      facilityId, facilityType,
      appointmentDate: { $gte: today, $lt: tomorrow },
      status: { $nin: ["cancelled", "completed"] }
    }).sort({ startTime: 1 });

    // Stats Calculation
    const stats = {
      total: appointments.length,
      checkedIn: appointments.filter(a => a.status === "checked-in").length,
      remaining: appointments.filter(a => a.status !== "checked-in").length
    };

    res.json({ success: true,  appointments, stats });
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

// ✅ 5. Delete Appointment
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
