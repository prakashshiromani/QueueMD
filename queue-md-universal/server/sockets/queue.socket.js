const { getIO, getRoomHash } = require("./index");

const emitQueueUpdate = (facilityId, facilityType, data) => {
  try {
    const io = getIO(); 
    // 🔒 SECURITY: Hash internal room name to prevent predictable room enumeration sniffing (Item 6)
    const room = getRoomHash(facilityId, facilityType);
    
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
    // 🔒 SECURITY: Hash internal room name (Item 6)
    const room = getRoomHash(facilityId, facilityType);
    
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

const emitPublicQueueUpdate = (facilityId) => {
  try {
    const io = getIO();
    // 🔒 SECURITY: Hash public room name (Item 6)
    const room = getRoomHash(facilityId, 'public');
    
    console.log(`🌍 [PUBLIC] Emitting queue update to room: ${room}`);

    // We don't send data here, just a trigger for the clients to refetch the masked data securely.
    io.to(room).emit("public_queue_update", {
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error(`❌ [PUBLIC] Socket Error: ${err.message}`);
  }
};

module.exports = { emitQueueUpdate, emitAnalyticsUpdate, emitPublicQueueUpdate };
