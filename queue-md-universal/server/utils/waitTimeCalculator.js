const { FACILITY_TYPES } = require("./facilityTypeConfig");

// 🔹 EMA Calculation (Recent data ko zyada importance)
const calculateEMA = (durations, alpha = 0.3) => {
  if (!durations.length) return 0;
  return durations.reduce((acc, curr) => alpha * curr + (1 - alpha) * acc, 0);
};

// 🔹 Config-driven Base Time Fallback
const getBaseConsultTime = (facilityType) => {
  return FACILITY_TYPES[facilityType]?.baseConsultTime || 10; // minutes
};

// 🚀 Main Prediction Engine
exports.calculateWaitPredictions = async (Queue, facilityId, facilityType) => {
  const baseTime = getBaseConsultTime(facilityType);

  // Last 15 completed patients fetch karo (window bada kiya for stability)
  const recent = await Queue.find(
    { facilityId, facilityType, status: "completed" },
    { actualDuration: 1, completedAt: 1 }
  )
    .sort({ completedAt: -1 })
    .limit(15);

  // Valid durations filter karo (>0)
  const validDurations = recent.map(q => q.actualDuration).filter(d => d && d > 0);
  
  // EMA ya fallback
  const avgTime = validDurations.length >= 3 ? calculateEMA(validDurations) : baseTime;

  // Current in-progress patient ka elapsed time nikalo
  const currentPatient = await Queue.findOne(
    { facilityId, facilityType, status: "in-progress" },
    { calledAt: 1 }
  );

  let currentRemaining = 0;
  if (currentPatient?.calledAt) {
    const elapsed = (Date.now() - new Date(currentPatient.calledAt).getTime()) / 60000;
    // Safety bounds: Min 30% of avg, Max 180% of avg (Realistic clamping)
    const minSafe = avgTime * 0.3;
    const maxSafe = avgTime * 1.8;
    const rawRemaining = Math.max(0, avgTime - elapsed);
    currentRemaining = Math.max(minSafe, Math.min(maxSafe, rawRemaining));
  }

  // Waiting queue fetch karo (sirf tokenNumber chahiye)
  const waitingQueue = await Queue.find(
    { facilityId, facilityType, status: "waiting" },
    { tokenNumber: 1 }
  ).sort({ tokenNumber: 1 });

  // Predictions generate karo (1.1x buffer for queue friction)
  const predictions = waitingQueue.map((q, index) => ({
    _id: q._id,
    estimatedWaitTime: Math.round((index * avgTime * 1.1) + currentRemaining)
  }));

  return {
    avgWaitTime: Math.round(avgTime),
    currentRemaining: Math.round(currentRemaining),
    predictions,
    queueLength: waitingQueue.length
  };
};

// 🧹 Auto-cleanup stale tokens from previous days to 'no-show'
exports.cleanupStaleTokens = async (Queue, facilityId) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const result = await Queue.updateMany(
      {
        facilityId,
        status: { $in: ["waiting", "in-progress"] },
        createdAt: { $lt: startOfDay }
      },
      {
        $set: {
          status: "no-show",
          completedAt: new Date()
        }
      }
    );
    return result.modifiedCount;
  } catch (err) {
    console.error(`[CLEANUP ERROR] Failed to clean up stale tokens: ${err.message}`);
    return 0;
  }
};

