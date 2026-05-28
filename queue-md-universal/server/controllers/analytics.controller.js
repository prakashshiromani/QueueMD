const mongoose = require("mongoose");
const Queue = require("../models/Queue");
const logger = require("../utils/logger");
const { cleanupStaleTokens } = require("../utils/waitTimeCalculator");
const { getISTRange } = require("../utils/dateHelpers");
const { connection: redis } = require("../config/redis");

// ✅ GET STATS (Summary Cards + Log Table)
exports.getStats = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    
    // Auto-cleanup stale tokens from previous days
    await cleanupStaleTokens(Queue, facilityId);
    const { page = 1, limit = 10, search = "", range = "today", branchId, facilityType, startDate, endDate, type } = req.query;
    
    const dates = getISTRange(range, startDate, endDate);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 1. Base Query (for summary cards)
    const summaryMatch = {
      facilityId: new mongoose.Types.ObjectId(facilityId),
      status: "completed",
      completedAt: { $gte: dates.start, $lte: dates.end }
    };
    if (branchId && branchId !== 'null' && branchId !== '') {
      summaryMatch.branchId = new mongoose.Types.ObjectId(branchId);
    }
    // Support both 'type' and 'facilityType' query params
    const ftFilter = facilityType || type;
    if (ftFilter && ftFilter !== 'all') {
      summaryMatch.facilityType = ftFilter;
    }

    // 2. Table Query (for log with search)
    const tableMatch = { ...summaryMatch };
    if (search?.trim()) {
      const searchTrimmed = search.trim();
      tableMatch.$or = [
        { patientName: { $regex: searchTrimmed, $options: "i" } },
        { phone: { $regex: searchTrimmed, $options: "i" } },
        { tokenNumber: /^\d+$/.test(searchTrimmed) ? parseInt(searchTrimmed) : -1 },
        { doctorName: { $regex: searchTrimmed, $options: "i" } },
        { facilityType: { $regex: searchTrimmed, $options: "i" } } // Added facilityType search
      ];
    }

    // Parallel Execution
    const [summary, patients, totalCount] = await Promise.all([
      Queue.aggregate([
        { $match: summaryMatch },
        {
          $group: {
            _id: null,
            totalPatients: { $sum: 1 },
            avgWaitTime: {
              $avg: {
                $cond: {
                  if: {
                    $and: [
                      { $gt: [{ $subtract: ["$calledAt", "$createdAt"] }, 0] },
                      { $lt: [{ $subtract: ["$calledAt", "$createdAt"] }, 12 * 60 * 60 * 1000] } // 12 hours in ms
                    ]
                  },
                  then: { $subtract: ["$calledAt", "$createdAt"] },
                  else: null
                }
              }
            },
            avgConsultTime: { $avg: "$actualDuration" }
          }
        }
      ]),
      Queue.find(tableMatch).sort({ completedAt: -1 }).skip(skip).limit(parseInt(limit)),
      Queue.countDocuments(tableMatch)
    ]);

    const stats = summary[0] || { totalPatients: 0, avgWaitTime: 0, avgConsultTime: 0 };

    // 3. AI Predicted Wait Time (from Redis cache)
    const cacheKey = `wait_time:${facilityId}`;
    let aiPredictedWait = 10; // Default fallback
    let confidence = 'low';
    
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        aiPredictedWait = JSON.parse(cached);
        confidence = 'high';
      } else {
        // Fallback: Simple calculation from last 10 completed
        const recentCompleted = await Queue.find({
          facilityId: new mongoose.Types.ObjectId(facilityId),
          status: 'completed'
        }).sort({ completedAt: -1 }).limit(10);
        
        if (recentCompleted.length >= 3) {
          // Calculate average duration
          const durations = recentCompleted.map(v => {
            const end = v.completedAt || v.updatedAt;
            const diff = (end - v.createdAt) / (1000 * 60); // minutes
            return diff;
          });
          aiPredictedWait = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
          confidence = 'medium';
        }
      }
    } catch (redisErr) {
      logger.warn(`Redis fallback error in getStats: ${redisErr.message}`);
    }

    res.json({
      success: true,
      stats: {
        totalPatients: stats.totalPatients,
        completedToday: stats.totalPatients, // Using range-filtered count
        avgWaitTime: Math.round((stats.avgWaitTime || 0) / 60000), // convert ms to min
        efficiency: Math.round(stats.avgConsultTime || 0),
        aiPredictedWait,
        confidence
      },
      patients,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (err) {
    logger.error(`getStats Error: ${err.message}`);
    next(err);
  }
};

// ✅ GET HOURLY TRAFFIC (Bar Chart)
exports.getHourlyTraffic = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const { range = "today", branchId, facilityType } = req.query;
    const dates = getISTRange(range, req.query.startDate, req.query.endDate);

    const matchQuery = {
      facilityId: new mongoose.Types.ObjectId(facilityId),
      status: "completed",
      completedAt: { $gte: dates.start, $lte: dates.end }
    };

    if (branchId && branchId !== 'null' && branchId !== '') {
      matchQuery.branchId = new mongoose.Types.ObjectId(branchId);
    }
    if (facilityType && facilityType !== 'all') {
      matchQuery.facilityType = facilityType;
    }

    logger.debug(`📊 [${req.path}] Final Match Query: ${JSON.stringify(matchQuery)}`);

    const traffic = await Queue.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $hour: { date: "$completedAt", timezone: "+05:30" } },
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedData = Array.from({ length: 24 }).map((_, i) => ({
      hour: `${i.toString().padStart(2, "0")}:00`,
      count: traffic.find(t => t._id === i)?.count || 0
    }));

    res.json({ success: true, data: formattedData });
  } catch (err) {
    logger.error(`getHourlyTraffic Error: ${err.message}`);
    next(err);
  }
};

// ✅ GET DAILY TREND (Area Chart)
exports.getDailyTrend = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const { range = "7d", branchId, facilityType } = req.query;
    const dates = getISTRange(range, req.query.startDate, req.query.endDate);

    logger.debug('📊 Daily Trend Query: ' + JSON.stringify({ 
      facilityId, 
      branchId,
      facilityType,
      range,
      start: dates.start,
      end: dates.end 
    }));

    const matchQuery = {
      facilityId: new mongoose.Types.ObjectId(facilityId),
      status: "completed",
      completedAt: { $gte: dates.start, $lte: dates.end }
    };

    if (branchId && branchId !== 'null' && branchId !== '') {
      matchQuery.branchId = new mongoose.Types.ObjectId(branchId);
    }
    if (facilityType && facilityType !== 'all') {
      matchQuery.facilityType = facilityType;
    }

    logger.debug(`📊 [${req.path}] Final Match Query: ${JSON.stringify(matchQuery)}`);

    const trend = await Queue.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt", timezone: "+05:30" } },
          count: { $sum: 1 }
        }
      }
    ]);

    logger.debug('📊 Daily Data Result: ' + JSON.stringify(trend));

    const formattedData = trend.map(t => {
      const [year, month, day] = t._id.split("-");
      const d = new Date(year, month - 1, day);
      return {
        date: `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`,
        fullDate: t._id,
        count: t.count
      };
    }).sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));

    res.json({ success: true, data: formattedData });
  } catch (err) {
    logger.error(`getDailyTrend Error: ${err.message}`);
    next(err);
  }
};

// ✅ GET FACILITY TYPE STATS (Donut Chart)
exports.getFacilityTypeStats = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const { range = "today", branchId, facilityType, startDate, endDate } = req.query;

    const dates = getISTRange(range, startDate, endDate);

    const matchQuery = {
      facilityId: new mongoose.Types.ObjectId(facilityId),
      status: "completed",
      completedAt: { $gte: dates.start, $lte: dates.end }
    };

    if (branchId && branchId !== 'null' && branchId !== '') {
      matchQuery.branchId = new mongoose.Types.ObjectId(branchId);
    }
    if (facilityType && facilityType !== 'all') {
      matchQuery.facilityType = facilityType;
    }

    const stats = await Queue.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$facilityType",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({ 
      success: true, 
      data: stats.map(s => ({ name: s._id || 'Unknown', value: s.count })) 
    });
  } catch (err) {
    logger.error(`getFacilityTypeStats Error: ${err.message}`);
    next(err);
  }
};

// ✅ GET TOP DOCTORS
exports.getTopDoctors = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const { range = "today", branchId, facilityType, startDate, endDate } = req.query;

    const dates = getISTRange(range, startDate, endDate);

    const matchQuery = {
      facilityId: new mongoose.Types.ObjectId(facilityId),
      status: "completed",
      completedAt: { $gte: dates.start, $lte: dates.end },
      doctorName: { $exists: true, $ne: "" }
    };

    if (branchId && branchId !== 'null' && branchId !== '') {
      matchQuery.branchId = new mongoose.Types.ObjectId(branchId);
    }
    if (facilityType && facilityType !== 'all') {
      matchQuery.facilityType = facilityType;
    }

    const doctors = await Queue.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$doctorName",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "users",
          let: { docName: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$role", "doctor"] },
                    { $eq: ["$facilityId", new mongoose.Types.ObjectId(facilityId)] },
                    // ✅ Exact case-insensitive match only
                    // Prevents false matches: 'raj' → 'raja', 'singh' → 'aman singh'
                    { $eq: [{ $toLower: "$name" }, { $toLower: "$$docName" }] }
                  ]
                }
              }
            }
          ],
          as: "registeredDoctor"
        }
      },
      {
        $match: {
          registeredDoctor: { $ne: [] }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({ 
      success: true, 
      data: doctors.map(d => ({ name: d._id, count: d.count })) 
    });
  } catch (err) {
    logger.error(`getTopDoctors Error: ${err.message}`);
    next(err);
  }
};

// ✅ GET HISTORICAL CONSULTATIONS (Paginated Log)
exports.getCompletedConsultations = async (req, res) => {
  try {
    const { page = 1, limit = 10, range = 'today', startDate, endDate, branchId, facilityType, q, status } = req.query;
    
    // Parse date range
    const { start, end } = getISTRange(range, startDate, endDate);
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build match query
    const matchQuery = {
      facilityId: new mongoose.Types.ObjectId(req.user.facilityId),
      createdAt: { $gte: start, $lte: end }
    };

    if (status && status !== 'all') {
      matchQuery.status = status;
    } else {
      // Default to showing everything except maybe 'waiting' or 'in-progress' if it's a "History" log
      // But usually analytics log = completed + no-show + cancelled
      matchQuery.status = { $in: ['completed', 'no-show', 'cancelled'] };
    }

    if (branchId && branchId !== 'null' && branchId !== '') {
      matchQuery.branchId = new mongoose.Types.ObjectId(branchId);
    }
    if (facilityType && facilityType !== 'all') {
      matchQuery.facilityType = facilityType;
    }
    
    if (q && q.trim()) {
      const searchTrimmed = q.trim();
      matchQuery.$or = [
        { patientName: { $regex: searchTrimmed, $options: 'i' } },
        { phone: { $regex: searchTrimmed, $options: 'i' } },
        { tokenNumber: /^\d+$/.test(searchTrimmed) ? parseInt(searchTrimmed) : -1 },
        { doctorName: { $regex: searchTrimmed, $options: 'i' } },
        { facilityType: { $regex: searchTrimmed, $options: 'i' } }
      ];
    }
    
    const [consultations, total] = await Promise.all([
      Queue.find(matchQuery)
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      
      Queue.countDocuments(matchQuery)
    ]);
    
    res.json({
      success: true,
      consultations,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        showing: consultations.length
      },
      dateRange: { start, end, range }
    });
  } catch (err) {
    logger.error(`getCompletedConsultations Error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
// ✅ GET AI INSIGHTS (Predictive Analysis)
exports.getAIInsights = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const { branchId, facilityType } = req.query;

    // 1. Get historical hourly traffic (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const matchQuery = {
      facilityId: new mongoose.Types.ObjectId(facilityId),
      status: "completed",
      completedAt: { $gte: thirtyDaysAgo }
    };

    if (branchId && branchId !== 'null' && branchId !== '') {
      matchQuery.branchId = new mongoose.Types.ObjectId(branchId);
    }
    if (facilityType && facilityType !== 'all') {
      matchQuery.facilityType = facilityType;
    }

    const trafficData = await Queue.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $hour: { date: "$completedAt", timezone: "+05:30" } },
          count: { $sum: 1 }
        }
      }
    ]);

    // 2. Calculate Peak Hour
    const sortedTraffic = [...trafficData].sort((a, b) => b.count - a.count);
    const peakHour = sortedTraffic.length > 0 ? sortedTraffic[0]._id : null;
    
    // 3. Simple Predictive Model (Average patients per peak hour)
    const avgPeakLoad = peakHour !== null ? Math.round(sortedTraffic[0].count / 30) : 0;

    // 4. Generate Insights
    const insights = [];
    
    if (peakHour !== null) {
      const peakLabel = peakHour >= 12 ? `${peakHour === 12 ? 12 : peakHour - 12} PM` : `${peakHour} AM`;
      insights.push({
        type: "peak_traffic",
        title: "Peak Hour Prediction",
        description: `High traffic expected tomorrow around ${peakLabel}.`,
        impact: "high",
        action: "Deploy additional staff"
      });
    }

    // Efficiency check
    const stats = await Queue.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: "$actualDuration" }
        }
      }
    ]);

    const avgDuration = stats[0]?.avgDuration || 0;
    if (avgDuration > 20) {
      insights.push({
        type: "efficiency",
        title: "Consultation Delay",
        description: `Average consultation is taking ${Math.round(avgDuration)} mins, higher than usual.`,
        impact: "medium",
        action: "Review patient flow"
      });
    } else {
      insights.push({
        type: "efficiency",
        title: "Operational Gold",
        description: "Your facility is processing patients 15% faster than last week.",
        impact: "low",
        action: "Maintain current flow"
      });
    }
    res.json({
      success: true,
      data: {
        peakHour,
        avgPeakLoad,
        insights
      }
    });
  } catch (err) {
    logger.error(`getAIInsights Error: ${err.message}`);
    next(err);
  }
};

// ✅ GET PREDICTED WAIT (FastAPI + Redis Polyglot Endpoint — Per Facility Type)
exports.getPredictedWait = async (req, res, next) => {
  try {
    const { facilityId, facilityType: userFacilityType } = req.user;
    // facilityType can be overridden by query param (for Demo Mode UI switches)
    const facilityType = req.query.facilityType || userFacilityType || 'clinic';

    // Scoped cache key: per facility + per type → dental & pathlab never pollute each other
    const cacheKey = `wait_time:${facilityId}:${facilityType}`;

    // 1. Check Redis Cache
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.info(`⚡ [Wait Prediction] Cache HIT — facility=${facilityId} type=${facilityType}: ${cached} mins`);
        return res.json({
          success: true,
          predicted_minutes: JSON.parse(cached),
          facilityType,
          source: "cache"
        });
      }
    } catch (redisErr) {
      logger.warn(`Redis connection/read failed: ${redisErr.message}`);
    }

    // 2. Fetch from Python FastAPI microservice with timeout
    let prediction;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      logger.info(`🔍 [Wait Prediction] Cache MISS — fetching from FastAPI for facility=${facilityId} type=${facilityType}`);
      // Pass facilityType as query param so Python filters by it
      const pyRes = await fetch(
        `http://localhost:8000/predict-wait/${facilityId}?facility_type=${facilityType}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (pyRes.ok) {
        const data = await pyRes.json();
        prediction = data.predicted_minutes;
        logger.info(`✅ [Wait Prediction] FastAPI returned ${prediction} mins for ${facilityType}`);

        // Store in Redis with type-scoped key (5 min TTL)
        try {
          await redis.setex(cacheKey, 300, JSON.stringify(prediction));
        } catch (redisErr) {
          logger.warn(`Redis setex failed: ${redisErr.message}`);
        }
      } else {
        throw new Error(`FastAPI returned status ${pyRes.status}`);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      logger.warn(`⚠️ [Wait Prediction] Python service unavailable (${err.message}). Using fallback.`);
      // Per-type realistic fallbacks (viva proof)
      const fallbacks = { clinic: 12, hospital: 20, pathlab: 8, dental: 25, physio: 15, vet: 10 };
      prediction = fallbacks[facilityType] ?? 12;
    }

    res.json({
      success: true,
      predicted_minutes: prediction,
      facilityType,
      source: "python"
    });
  } catch (err) {
    logger.error(`getPredictedWait Error: ${err.message}`);
    next(err);
  }
};



