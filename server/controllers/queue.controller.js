// server/controllers/queue.controller.js
const Queue = require("../models/Queue");
const { getFacilityConfig } = require("../utils/facilityTypeConfig");
const { emitQueueUpdate, emitAnalyticsUpdate } = require("../sockets/queue.socket");
const logger = require("../utils/logger");
const { z } = require("zod");
const { calculateWaitPredictions } = require("../utils/waitTimeCalculator");
const Analytics = require("../models/Analytics");
const Patient = require("../models/Patient");

// ✅ ADD PATIENT - CORRECT ISOLATION
exports.addPatient = async (req, res, next) => {
  try {
    // facilityId = which clinic/hospital account (from JWT - for multi-tenancy)
    // facilityType = which department (dental/clinic/pathlab - from patient's record)
    const { facilityId } = req.user;
    const { patientId, patientName, phone, customData, doctorName } = req.body;

    // ✅ Validation
    if (!patientName || !patientName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Patient name is required"
      });
    }

    // ✅ CORRECT: Read patient's ACTUAL facilityType from their Directory record
    let queueFacilityType = req.user.facilityType; // default fallback
    if (patientId) {
      const patientRecord = await Patient.findOne({ _id: patientId, facilityId });
      if (patientRecord && patientRecord.facilityType) {
        queueFacilityType = patientRecord.facilityType; // Use patient's REAL department
      }
    } else if (req.body.facilityType) {
      // If patientId not provided but facilityType sent, use it (for direct queue adds)
      queueFacilityType = req.body.facilityType;
    }

    console.log(`📋 [ADD] Patient: ${patientName}, Queue FacilityType: ${queueFacilityType}, Facility: ${facilityId}`);

    // 🔥 Check if patient already in ACTIVE queue for their department
    const existingActive = await Queue.findOne({
      facilityId,
      facilityType: queueFacilityType,
      $or: [
        { patientId: patientId || "none" },
        { phone: phone }
      ],
      status: { $in: ["waiting", "in-progress"] }
    });

    if (existingActive) {
      return res.status(400).json({
        success: false,
        message: "Patient already in queue (Token # " + existingActive.tokenNumber + ")",
        data: {
          tokenNumber: existingActive.tokenNumber,
          status: existingActive.status
        }
      });
    }

    // 🔥 Generate next token for this specific department
    const lastToken = await Queue.findOne({ facilityId, facilityType: queueFacilityType })
      .sort({ tokenNumber: -1 });
    
    const nextToken = (lastToken?.tokenNumber || 0) + 1;

    // ✅ Update patient's lastVisit + totalVisits WITHOUT changing their facilityType
    if (patientId) {
      await Patient.findOneAndUpdate(
        { _id: patientId, facilityId },
        { 
          status: "Active",
          lastVisit: new Date(),
          $inc: { totalVisits: 1 }
        }
        // No upsert, no facilityType overwrite!
      );
    }

    // ✅ Create queue entry with patient's ACTUAL department type
    const newQueueEntry = await Queue.create({
      facilityId,
      facilityType: queueFacilityType,  // Patient's real department, NOT JWT default
      patientId: patientId || null,
      patientName,
      phone,
      customData: customData || {},
      doctorName: doctorName || "Unknown",
      tokenNumber: nextToken,
      status: "waiting",
      createdAt: new Date()
    });

    // 🔥 Socket emit to patient's department room
    emitQueueUpdate(facilityId, queueFacilityType, {
      action: "add",
      patient: newQueueEntry
    });

    console.log(`✅ Patient added: ${patientName}, Token: ${nextToken}, Department: ${queueFacilityType}`);

    res.status(201).json({
      success: true,
      message: "Patient added to queue successfully",
      data: newQueueEntry
    });

  } catch (err) {
    console.error("❌ Add patient error:", err);
    next(err);
  }
};

// ✅ GET QUEUE - accepts facilityType query param for multi-department support
exports.getQueue = async (req, res, next) => {
  try {
    const { facilityId, facilityType: jwtFacilityType } = req.user;
    const { status = "waiting", limit = 50, type } = req.query;

    // Use query param 'type' if provided (Dashboard Demo Mode), else JWT default
    const facilityType = type || jwtFacilityType;

    console.log(`📋 [GET QUEUE] FacilityType: ${facilityType}, Status: ${status}`);

    const queue = await Queue.find({
      facilityId,
      facilityType,
      status
    })
    .sort(status === "waiting" ? { tokenNumber: 1 } : { updatedAt: -1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      count: queue.length,
      queue
    });
  } catch (err) {
    next(err);
  }
};

// ✅ GET COMPLETED COUNT (For Dashboard Stats)
exports.getCompletedCount = async (req, res, next) => {
  try {
    const { facilityId, facilityType: jwtFacilityType } = req.user;
    const { type } = req.query;
    const facilityType = type || jwtFacilityType;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const count = await Queue.countDocuments({
      facilityId,
      facilityType,
      status: "completed",
      completedAt: { $gte: startOfDay }
    });

    res.json({
      success: true,
      completedToday: count
    });
  } catch (err) {
    next(err);
  }
};

// ✅ MARK PATIENT AS COMPLETED
exports.markPatientCompleted = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { facilityId, facilityType } = req.user;
    const { consultationNotes, prescription, doctorName } = req.body;
    console.log("📝 [DEBUG] markPatientCompleted body:", req.body);

    // 🔍 First find the patient to get their actual facilityType
    const existingPatient = await Queue.findOne({ _id: patientId, facilityId });
    
    if (!existingPatient) {
      return res.status(404).json({ success: false, message: "Patient not found in your facility." });
    }

    const patientDept = existingPatient.facilityType;

    const updated = await Queue.findOneAndUpdate(
      { 
        _id: patientId, 
        facilityId, 
        status: { $in: ["waiting", "in-progress"] } 
      },
      { 
        status: "completed",
        completedAt: new Date(),
        consultationNotes: consultationNotes || "",
        prescription: prescription || {},
        // ✅ FIX: Pehle request body ka doctorName lo, phir jo add karte waqt set tha, phir N/A
        doctorName: doctorName || existingPatient.doctorName || req.user.name || "N/A",
        actualDuration: 0 
      },
      { new: true }
    );

    if (!updated) {
      return res.status(400).json({ success: false, message: "Patient not found or already completed." });
    }

    // ✅ Use patientDept for analytics and socket updates
    const useType = patientDept;

    // ✅ Safely calculate wait time and consultation duration
    const calledTime = updated.calledAt ? new Date(updated.calledAt).getTime() : Date.now();
    const createdTime = updated.createdAt ? new Date(updated.createdAt).getTime() : calledTime;
    const completedTime = updated.completedAt ? new Date(updated.completedAt).getTime() : Date.now();
    
    const waitTime = Math.max(0, Math.round((calledTime - createdTime) / 60000)) || 0;
    const consultationDuration = Math.max(1, Math.round((completedTime - calledTime) / 60000)) || 1;
    
    updated.waitTime = waitTime;
    updated.actualDuration = consultationDuration;
    await updated.save();

    // ✅ Update Analytics Collection (Daily)
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();

    await Analytics.findOneAndUpdate(
      { facilityId, facilityType: useType, date: today },
      {
        $inc: {
          totalPatients: 1,
          completedPatients: 1,
          [`hourlyTraffic.${currentHour}`]: 1
        },
        $push: {
          completedToday: {
            patientId: updated._id,
            patientName: updated.patientName,
            tokenNumber: updated.tokenNumber,
            completedAt: updated.completedAt,
            waitTime: updated.waitTime,
            facilityType: useType
          }
        }
      },
      { upsert: true }
    );

    // ✅ Re-calculate predictions for future queue
    const stats = await calculateWaitPredictions(Queue, facilityId, useType);

    // 🔔 Emit to both Queue and Analytics pages
    emitQueueUpdate(facilityId, useType, {
      action: "completed",
      patient: updated,
      stats
    });

    emitAnalyticsUpdate(facilityId, useType, {
      action: "completed",
      patient: updated
    });

    res.json({ 
      success: true, 
      message: "Patient completed successfully",
      data: updated,
      stats
    });
  } catch (err) {
    next(err);
  }
};

// ✅ NEXT PATIENT - Supports multi-department
exports.nextPatient = async (req, res, next) => {
  try {
    const { facilityId, facilityType: jwtFacilityType } = req.user;

    // Use body or query param 'type' if provided (from Dashboard), else JWT default
    const facilityType = req.body.facilityType || req.query.type || jwtFacilityType;

    console.log(`🔍 Finding next patient for: facilityId=${facilityId}, type=${facilityType}`);

    // ✅ Find oldest waiting patient for this department
    const nextPatient = await Queue.findOneAndUpdate(
      { 
        facilityId, 
        facilityType,  // ✅ Department-specific
        status: "waiting" 
      },
      { 
        status: "in-progress",
        calledAt: new Date()
      },
      { 
        new: true, 
        runValidators: true,
        sort: { tokenNumber: 1 }
      }
    );

    if (!nextPatient) {
      console.warn(`⚠️ No waiting patients found for department: ${facilityType}`);
      return res.status(404).json({
        success: false,
        message: "No patients waiting in the queue"
      });
    }

    // ✅ Calculate Predictions
    const stats = await calculateWaitPredictions(Queue, facilityId, facilityType);

    // 🔥 Socket emit to department's room
    emitQueueUpdate(facilityId, facilityType, {
      action: "next",
      patient: nextPatient,
      stats
    });

    console.log(`✅ Next patient: ${nextPatient.patientName}, Token: ${nextPatient.tokenNumber}, Dept: ${facilityType}`);

    res.json({
      success: true,
      message: "Patient called successfully",
      data: nextPatient,
      stats
    });

  } catch (err) {
    console.error("❌ Next patient error:", err);
    next(err);
  }
};
