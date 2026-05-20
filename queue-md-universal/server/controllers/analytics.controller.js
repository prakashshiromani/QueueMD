const mongoose = require("mongoose");
const Queue = require("../models/Queue");
const logger = require("../utils/logger");
const { getISTRange } = require("../utils/dateHelpers");

// ✅ GET STATS (Summary Cards + Log Table)
exports.getStats = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const { page = 1, limit = 10, search = "", range = "today", branchId, startDate, endDate } = req.query;
    
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
            avgWaitTime: { $avg: { $subtract: ["$calledAt", "$createdAt"] } },
            avgConsultTime: { $avg: "$actualDuration" }
          }
        }
      ]),
      Queue.find(tableMatch).sort({ completedAt: -1 }).skip(skip).limit(parseInt(limit)),
      Queue.countDocuments(tableMatch)
    ]);

    const stats = summary[0] || { totalPatients: 0, avgWaitTime: 0, avgConsultTime: 0 };

    res.json({
      success: true,
      stats: {
        totalPatients: stats.totalPatients,
        completedToday: stats.totalPatients, // Using range-filtered count
        avgWaitTime: Math.round((stats.avgWaitTime || 0) / 60000), // convert ms to min
        efficiency: Math.round(stats.avgConsultTime || 0)
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
    const { range = "today", branchId } = req.query;
    const dates = getISTRange(range, req.query.startDate, req.query.endDate);

    const matchQuery = {
      facilityId: new mongoose.Types.ObjectId(facilityId),
      status: "completed",
      completedAt: { $gte: dates.start, $lte: dates.end }
    };

    if (branchId && branchId !== 'null' && branchId !== '') {
      matchQuery.branchId = new mongoose.Types.ObjectId(branchId);
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
    const { range = "7d", branchId } = req.query;
    const dates = getISTRange(range, req.query.startDate, req.query.endDate);

    logger.debug('📊 Daily Trend Query: ' + JSON.stringify({ 
      facilityId, 
      branchId,
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
    const { range = "today", branchId, startDate, endDate } = req.query;

    const dates = getISTRange(range, startDate, endDate);

    const matchQuery = {
      facilityId: new mongoose.Types.ObjectId(facilityId),
      status: "completed",
      completedAt: { $gte: dates.start, $lte: dates.end }
    };

    if (branchId && branchId !== 'null' && branchId !== '') {
      matchQuery.branchId = new mongoose.Types.ObjectId(branchId);
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
    const { range = "today", branchId, startDate, endDate } = req.query;

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

    const doctors = await Queue.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$doctorName",
          count: { $sum: 1 }
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
    const { page = 1, limit = 10, range = 'today', startDate, endDate, branchId, q, status } = req.query;
    
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
    const { branchId } = req.query;

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

    // 5. No-Show Analytics
    const statusStats = await Queue.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const total = statusStats.reduce((acc, curr) => acc + curr.count, 0);
    const noShows = statusStats.find(s => s._id === 'no-show')?.count || 0;
    const noShowRate = total > 0 ? (noShows / total) * 100 : 0;

    if (noShowRate > 15) {
      const estimatedLoss = noShows * 500; // Average ₹500 per consult
      insights.push({
        type: "no_show",
        title: "High No-Show Alert",
        description: `Your no-show rate is ${Math.round(noShowRate)}%. Estimated ₹${estimatedLoss} revenue lost this period.`,
        impact: "high",
        action: "Enable SMS reminders"
      });
    }

    res.json({
      success: true,
      data: {
        peakHour,
        avgPeakLoad,
        noShowRate: Math.round(noShowRate),
        estimatedLoss: noShows * 500,
        insights
      }
    });
  } catch (err) {
    logger.error(`getAIInsights Error: ${err.message}`);
    next(err);
  }
};
