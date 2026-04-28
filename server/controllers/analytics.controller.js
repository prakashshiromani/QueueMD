const mongoose = require("mongoose");
const Queue = require("../models/Queue");
const logger = require("../utils/logger");

// ✅ GET ANALYTICS STATS - MERGED: Search + Date Range + Pagination
exports.getStats = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const { 
      page = 1, 
      limit = 10, 
      search = "", 
      dateRange = "today" 
    } = req.query;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // ✅ DATE RANGE FILTER LOGIC (Preserved)
    let dateFilter = {};
    if (dateRange === "today") {
      dateFilter = { completedAt: { $gte: startOfDay } };
    } else if (dateRange === "yesterday") {
      const endOfDay = new Date(startOfDay);
      startOfDay.setDate(startOfDay.getDate() - 1);
      dateFilter = { completedAt: { $gte: startOfDay, $lt: endOfDay } };
    } else if (dateRange === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { completedAt: { $gte: weekAgo } };
    } else if (dateRange === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { completedAt: { $gte: monthAgo } };
    }
    // 'all' = no date filter

    // ✅ SEARCH FILTER LOGIC (New)
    let searchFilter = {};
    if (search) {
      searchFilter = {
        $or: [
          { patientName: { $regex: search, $options: "i" } },  // Name search
          { phone: { $regex: search, $options: "i" } },         // Phone search
          { tokenNumber: parseInt(search) || 0 }                // Token number search
        ]
      };
    }

    // ✅ COMBINED QUERY: facilityId + status + dateFilter + searchFilter
    const completedQuery = {
      facilityId,
      status: "completed",
      ...dateFilter,
      ...searchFilter
    };

    // Total visits today (for stats card)
    const totalToday = await Queue.countDocuments({
      facilityId,
      createdAt: { $gte: startOfDay }
    });

    // Completed count (with all filters)
    const completedTodayCount = await Queue.countDocuments(completedQuery);

    // Avg Wait Time calculation (all completed, regardless of search)
    const completedRecords = await Queue.find({
      facilityId,
      status: "completed",
      completedAt: { $gte: startOfDay } // Keep this for avg calculation
    }).select('actualDuration createdAt calledAt completedAt');

    let avgWaitTime = 0;
    if (completedRecords.length > 0) {
      const totalDuration = completedRecords.reduce((sum, rec) => sum + (rec.actualDuration || 0), 0);
      avgWaitTime = Math.round(totalDuration / completedRecords.length);
    }

    // Efficiency
    const efficiency = totalToday > 0
      ? Math.round((completedTodayCount / totalToday) * 100)
      : 0;

    // ✅ PAGINATED RESULTS (with search + date filters)
    const completedPatients = await Queue.find(completedQuery)
      .sort({ completedAt: -1 }) // Latest first
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = completedTodayCount;
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        totalPatients: totalToday,
        completed: completedTodayCount,
        avgWaitTime,
        efficiency,
        patients: completedPatients.map(patient => ({
          _id: patient._id,
          tokenNumber: patient.tokenNumber,
          patientName: patient.patientName,
          phone: patient.phone,
          facilityType: patient.facilityType,
          doctorName: patient.doctorName || "N/A",
          completedAt: patient.completedAt,
          actualDuration: patient.actualDuration || 0,
          status: "VERIFIED"
        })),
        pagination: {
          total,
          page: parseInt(page),
          pages: totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (err) {
    logger.error(`Analytics Stats Error: ${err.message}`);
    next(err);
  }
};

// Backward compatibility wrapper
exports.getCompletedToday = async (req, res, next) => {
  return exports.getStats(req, res, next);
};
