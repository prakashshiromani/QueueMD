const { getIO, getRoomHash } = require("./index");

// 🔒 SECURITY (LP-01 Fix): Branch-aware queue update emitter.
// Emits to BOTH the global facility room (sanitized, PII-free) AND the
// patient's specific branch room (full PII data).
// This eliminates the client-side filtering loophole where raw PII was
// broadcast to all browsers in the facility regardless of branch.
const emitQueueUpdate = (facilityId, facilityType, data) => {
  try {
    const io = getIO();
    const patient = data.patient;
    const branchId = patient?.branchId ? String(patient.branchId) : null;

    // 1. Emit SANITIZED data to the global facility room
    //    (used for "All Branches" view — no PII exposed)
    const globalRoom = getRoomHash(facilityId, facilityType);
    io.to(globalRoom).emit("queue_update", {
      action: data.action,
      stats: data.stats,
      facilityId: String(facilityId).trim(),
      facilityType: String(facilityType).trim(),
      // Only non-PII fields go to the global room
      patient: patient ? {
        _id: patient._id,
        branchId: patient.branchId,
        tokenNumber: patient.tokenNumber,
        status: patient.status,
        facilityType: patient.facilityType,
        completedAt: patient.completedAt
      } : undefined
    });

    // 2. Emit FULL patient data (with PII) ONLY to the specific branch room
    //    This is safe because only staff who selected that branch are in this room
    if (branchId) {
      const branchRoom = getRoomHash(facilityId, facilityType, branchId);
      io.to(branchRoom).emit("queue_update", {
        ...data,
        facilityId: String(facilityId).trim(),
        facilityType: String(facilityType).trim()
      });
    }
  } catch (err) {
    console.error(`❌ [BACKEND] Socket Error: ${err.message}`);
  }
};

const emitAnalyticsUpdate = (facilityId, facilityType, data) => {
  try {
    const io = getIO();
    // 🔒 SECURITY: Hash internal room name (Item 6)
    const room = getRoomHash(facilityId, facilityType);

    io.to(room).emit("analytics_update", {
      ...data,
      facilityId: String(facilityId).trim(),
      facilityType: String(facilityType).trim()
    });
  } catch (err) {
    console.error(`❌ [ANALYTICS] Socket Error: ${err.message}`);
  }
};

const emitPublicQueueUpdate = (facilityId) => {
  try {
    const io = getIO();
    // 🔒 SECURITY: Hash public room name (Item 6)
    const room = getRoomHash(facilityId, 'public');

    // We don't send data here, just a trigger for the clients to refetch the masked data securely.
    io.to(room).emit("public_queue_update", {
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error(`❌ [PUBLIC] Socket Error: ${err.message}`);
  }
};

module.exports = { emitQueueUpdate, emitAnalyticsUpdate, emitPublicQueueUpdate };
