const { getIO } = require("./index");

const emitQueueUpdate = (facilityId, facilityType, data) => {
  try {
    const io = getIO(); 
    // 🔥 Nuclear Option: Trim IDs to avoid invisible spaces
    const room = `${String(facilityId).trim()}_${String(facilityType).trim()}`;
    
    console.log(`📡 [BACKEND] Attempting to emit to room: ${room}, Action: ${data.action}`); 
    console.log('📦 Payload:', JSON.stringify(data.patient, null, 2));

    io.to(room).emit("queue_update", {
      ...data,
      facilityId: String(facilityId).trim(),
      facilityType: String(facilityType).trim()
    });

    console.log(`✅ [BACKEND] Emitted successfully to ${room}`);
  } catch (err) {
    console.error(`❌ [BACKEND] Socket Error: ${err.message}`);
  }
};

const emitAnalyticsUpdate = (facilityId, facilityType, data) => {
  try {
    const io = getIO();
    const room = `${String(facilityId).trim()}_${String(facilityType).trim()}`;
    
    console.log(`📊 [ANALYTICS] Emitting to room: ${room}`);

    io.to(room).emit("analytics_update", {
      ...data,
      facilityId: String(facilityId).trim(),
      facilityType: String(facilityType).trim()
    });
  } catch (err) {
    console.error(`❌ [ANALYTICS] Socket Error: ${err.message}`);
  }
};

module.exports = { emitQueueUpdate, emitAnalyticsUpdate };
