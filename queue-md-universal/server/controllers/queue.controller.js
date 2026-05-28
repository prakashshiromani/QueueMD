// server/controllers/queue.controller.js
const Queue = require("../models/Queue");
const Notification = require("../models/Notification");
const { getFacilityConfig, getNextTokenPrefix } = require("../utils/facilityTypeConfig");
const { emitQueueUpdate, emitAnalyticsUpdate, emitPublicQueueUpdate } = require("../sockets/queue.socket");
const logger = require("../utils/logger");
const { emitNotification } = require("../sockets/notification.socket");
const { z } = require("zod");
const { calculateWaitPredictions, cleanupStaleTokens } = require("../utils/waitTimeCalculator");
const Analytics = require("../models/Analytics");
const Patient = require("../models/Patient");
const notificationQueue = require('../jobs/notification.queue');
const Counter = require("../models/Counter");
const ClinicalVisit = require("../models/ClinicalVisit");
const { getPhoneRegex } = require("../utils/phoneHelper");
const { logAudit } = require("../utils/auditLogger");
const { getISTRange } = require("../utils/dateHelpers");

async function getNextSequence(id) {
  const counter = await Counter.findByIdAndUpdate(
    id,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}


// ✅ ADD PATIENT - CORRECT ISOLATION
exports.addPatient = async (req, res, next) => {
  try {
    // facilityId = which clinic/hospital account (from JWT - for multi-tenancy)
    // facilityType = which department (dental/clinic/pathlab - from patient's record)
    const { facilityId } = req.user;

    // Auto-cleanup stale tokens from previous days
    await cleanupStaleTokens(Queue, facilityId);
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

    logger.info(`[ADD] Patient: ${patientName}, Queue FacilityType: ${queueFacilityType}, Facility: ${facilityId}`);

    // 🔥 Check if patient already in ACTIVE queue for their department
    const phoneRegex = getPhoneRegex(phone, true);
    const existingActive = await Queue.findOne({
      facilityId,
      facilityType: queueFacilityType,
      $or: [
        { patientId: patientId || "none" },
        { phone: phoneRegex || phone }
      ],
      status: { $in: ["waiting", "in-progress"] }
    });

    if (existingActive) {
      return res.status(400).json({
        success: false,
        message: `Patient already in queue (Token #${getNextTokenPrefix(queueFacilityType)}-${String(existingActive.tokenNumber).padStart(3, '0')})`,
        data: {
          tokenNumber: existingActive.tokenNumber,
          status: existingActive.status
        }
      });
    }

    // 🔥 Generate next token for this specific department atomically with daily resets
    const { start: todayStart } = getISTRange("today");
    const todayEntry = await Queue.findOne({
      facilityId,
      facilityType: queueFacilityType,
      createdAt: { $gte: todayStart }
    });

    if (!todayEntry) {
      // No patients today yet: reset sequence to 0
      await Counter.findOneAndUpdate(
        { _id: `token:${facilityId}:${queueFacilityType}` },
        { seq: 0 },
        { upsert: true, new: true }
      );
    } else {
      // Ensure counter document exists
      let counter = await Counter.findById(`token:${facilityId}:${queueFacilityType}`);
      if (!counter) {
        const lastToken = await Queue.findOne({ facilityId, facilityType: queueFacilityType })
          .sort({ tokenNumber: -1 });

        let startNum = 0;
        if (lastToken) {
          startNum = lastToken.tokenNumber;
        }
        try {
          await Counter.create({ _id: `token:${facilityId}:${queueFacilityType}`, seq: startNum });
        } catch (err) {
          // Ignore duplicate key error
        }
      }
    }
    const nextToken = await getNextSequence(`token:${facilityId}:${queueFacilityType}`);

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

    // ✅ Calculate predictions for the updated queue
    const stats = await calculateWaitPredictions(Queue, facilityId, queueFacilityType);

    // 🔥 Socket emit to patient's department room
    emitQueueUpdate(facilityId, queueFacilityType, {
      action: "add",
      patient: newQueueEntry,
      stats
    });

    // 🌍 Emit to public tracking room
    emitPublicQueueUpdate(facilityId);

    // 🔥 NEW: Notification Create karo
    const newNotif = await Notification.create({
      facilityId,
      facilityType: queueFacilityType,
      type: "appointment", // Ya "queue_update"
      title: "New Appointment",
      message: `${patientName} (Token #${getNextTokenPrefix(queueFacilityType)}-${String(nextToken).padStart(3, '0')}) has been added to the queue.`,
      isRead: false,
      metadata: { tokenNumber: nextToken, patientName }
    });

    // 🔥 Real-time push to centralized notification room
    emitNotification(facilityId, newNotif);

    logger.info(`Patient added: ${patientName}, Token: ${nextToken}, Department: ${queueFacilityType}`);

    res.status(201).json({
      success: true,
      message: "Patient added to queue successfully",
      data: newQueueEntry
    });

  } catch (err) {
    logger.error(`Add patient error: ${err.message}`, { stack: err.stack });
    next(err);
  }
};

// ✅ GET QUEUE - accepts facilityType query param for multi-department support
exports.getQueue = async (req, res, next) => {
  try {
    const { facilityId, facilityType: jwtFacilityType } = req.user;

    // Auto-cleanup stale tokens from previous days
    await cleanupStaleTokens(Queue, facilityId);
    const { status = "waiting", limit = 50, type } = req.query;

    // Use query param 'type' if provided (Dashboard Demo Mode), else JWT default
    const facilityType = type || jwtFacilityType;

    logger.info(`[GET QUEUE] FacilityType: ${facilityType}, Status: ${status}`);

    if (status === "waiting") {
      await calculateWaitPredictions(Queue, facilityId, facilityType);
    }

    const queue = await Queue.find({
      facilityId,
      facilityType,
      status,
      isLabOrder: { $ne: true }
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

    // Auto-cleanup stale tokens from previous days
    await cleanupStaleTokens(Queue, facilityId);
    const { type } = req.query;
    const facilityType = type || jwtFacilityType;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const count = await Queue.countDocuments({
      facilityId,
      facilityType,
      status: "completed",
      completedAt: { $gte: startOfDay },
      isLabOrder: { $ne: true }
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
    logger.debug(`markPatientCompleted body: ${JSON.stringify(req.body)}`);

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

    // ✅ Create ClinicalVisit in EMR Lite history (Prescription & Invoice Print View)
    try {
      await ClinicalVisit.create({
        patientPhone: updated.phone || "0000000000",
        patientName: updated.patientName,
        facilityId,
        facilityType: useType,
        doctorId: req.user.id,
        diagnosis: consultationNotes || "Routine Consultation Checkup",
        prescriptionNotes: typeof prescription === 'string' ? prescription : (prescription?.notes || "Rx:\n1. Tab Paracetamol 650mg - 1-0-1 - after food x 3 days\n2. Tab Cetirizine 10mg - 0-0-1 - at bedtime x 5 days"),
        vitals: {
          bp: updated.customData?.vitals?.bp || "120/80",
          weight: updated.customData?.vitals?.weight || 70,
          temperature: updated.customData?.vitals?.temperature || 98.6
        }
      });
      logger.info(`[ClinicalVisit] Created visit for patient: ${updated.patientName}`);
    } catch (visitErr) {
      logger.error(`[ClinicalVisit] Failed to create clinical visit: ${visitErr.message}`);
    }

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

    // 🌍 Emit to public tracking room
    emitPublicQueueUpdate(facilityId);

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

    // Auto-cleanup stale tokens from previous days
    await cleanupStaleTokens(Queue, facilityId);

    // Use body or query param 'type' if provided (from Dashboard), else JWT default
    const facilityType = req.body.facilityType || req.query.type || jwtFacilityType;

    logger.info(`Finding next patient for: facilityId=${facilityId}, type=${facilityType}`);

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

    // 🔔 Phase 4: Push next 2 waiting patients to notification queue
    try {
      const upcoming = await Queue.find(
        { facilityId, facilityType, status: "waiting" },
        { patientName: 1, phone: 1, tokenNumber: 1, customData: 1 }
      ).sort({ tokenNumber: 1 }).limit(2);

      for (const patient of upcoming) {
        await notificationQueue.add('notify_patient', {
          facilityId,
          facilityType,
          patientName: patient.patientName,
          tokenNumber: patient.tokenNumber,
          phone: patient.phone,
          customData: patient.customData || {}
        }, {
          priority: 1,
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 }
        });
      }
    } catch (err) {
      logger.error(`Failed to add patients to notification queue: ${err.message}`);
    }

    // ✅ Calculate Predictions

    const stats = await calculateWaitPredictions(Queue, facilityId, facilityType);

    // 🔥 Socket emit to department's room
    emitQueueUpdate(facilityId, facilityType, {
      action: "next",
      patient: nextPatient,
      stats
    });

    // 🌍 Emit to public tracking room
    emitPublicQueueUpdate(facilityId);

    // 🔥 NEW: Notification Create karo
    const newNotif = await Notification.create({
      facilityId,
      facilityType,
      type: "appointment",
      title: "Token Called",
      message: `Token #${getNextTokenPrefix(facilityType)}-${String(nextPatient.tokenNumber).padStart(3, '0')} (${nextPatient.patientName}) is now being attended.`,
      isRead: false,
      metadata: { tokenNumber: nextPatient.tokenNumber, patientName: nextPatient.patientName }
    });

    // 🔥 Real-time push to centralized notification room
    emitNotification(facilityId, newNotif);

    logger.info(`Next patient: ${nextPatient.patientName}, Token: ${nextPatient.tokenNumber}, Dept: ${facilityType}`);

    res.json({
      success: true,
      message: "Patient called successfully",
      data: nextPatient,
      stats
    });

  } catch (err) {
    logger.error(`Next patient error: ${err.message}`, { stack: err.stack });
    next(err);
  }
};
// ✅ PAUSE PATIENT
exports.pausePatient = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { facilityId } = req.user;

    const patient = await Queue.findOneAndUpdate(
      { _id: patientId, facilityId, status: 'waiting' },
      { status: 'paused', pausedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!patient) return res.status(404).json({ success: false, message: "Patient not found or not in waiting status" });

    // Recalculate predictions
    const stats = await calculateWaitPredictions(Queue, facilityId, patient.facilityType);

    // Emit queue update
    emitQueueUpdate(facilityId, patient.facilityType, {
      action: 'paused',
      patient,
      stats
    });

    emitPublicQueueUpdate(facilityId);

    res.json({ success: true, data: patient, stats });
  } catch (err) {
    next(err);
  }
};

// ✅ RESUME PATIENT
exports.resumePatient = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { facilityId } = req.user;

    const patient = await Queue.findOneAndUpdate(
      { _id: patientId, facilityId, status: 'paused' },
      { status: 'waiting', pausedAt: null },
      { new: true, runValidators: true }
    );

    if (!patient) return res.status(404).json({ success: false, message: "Patient not found or not paused" });

    // Recalculate predictions
    const stats = await calculateWaitPredictions(Queue, facilityId, patient.facilityType);

    // Emit queue update
    emitQueueUpdate(facilityId, patient.facilityType, {
      action: 'resumed',
      patient,
      stats
    });

    emitPublicQueueUpdate(facilityId);

    res.json({ success: true, data: patient, stats });
  } catch (err) {
    next(err);
  }
};

// ✅ RESET DAILY QUEUE & COUNTER (Admin Only)
exports.resetDailyQueue = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const { getISTRange } = require("../utils/dateHelpers");
    const { start } = getISTRange("today");

    // 1. Delete Queue entries created today for this facility
    const queueDeleteResult = await Queue.deleteMany({ 
      facilityId,
      createdAt: { $gte: start }
    });

    // Also clear today's daily aggregated Analytics document
    const todayStr = new Date().toISOString().split('T')[0];
    await Analytics.deleteMany({ facilityId, date: todayStr });

    // 2. Delete all Counter documents starting with token:facilityId:
    const counterDeleteResult = await Counter.deleteMany({
      _id: { $regex: new RegExp("^token:" + facilityId + ":") }
    });

    // 3. Log this action to system security audit logs
    await logAudit(req, {
      action: "QUEUE_RESET",
      facilityId,
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      userRole: req.user.role,
      severity: "critical",
      status: "success",
      details: {
        reason: "Manual today's queue and token counter reset",
        deletedQueueItemsCount: queueDeleteResult.deletedCount,
        deletedCountersCount: counterDeleteResult.deletedCount
      }
    });

    // 4. Emit socket events to update all clients (Lobby, Dashboard, etc.)
    emitPublicQueueUpdate(facilityId);

    // Also emit department updates for common active types so they refetch immediately
    const activeTypes = ["clinic", "hospital", "pathlab", "dental", "physio", "other"];
    for (const type of activeTypes) {
      emitQueueUpdate(facilityId, type, {
        action: "reset",
        stats: { avgWaitTime: 0, predictions: [], queueLength: 0 }
      });
    }

    logger.info(`[Queue Reset] Today's queue history and counters deleted for facility: ${facilityId}`);

    res.json({
      success: true,
      message: "Today's queue logs cleared and daily token counter reset to 1 successfully."
    });
  } catch (err) {
    logger.error(`[Queue Reset Error] ${err.message}`);
    next(err);
  }
};

