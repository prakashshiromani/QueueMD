const Queue = require('../models/Queue');
const Patient = require('../models/Patient');
const mongoose = require('mongoose');
const { z } = require('zod');
const logger = require('../utils/logger');
const { emitQueueUpdate } = require('../sockets/queue.socket');

// Validation schema for lab orders
const labOrderSchema = z.object({
  patientName: z.string().min(2),
  phone: z.string().optional(),
  doctorName: z.string().optional(),
  customData: z.object({
    sampleId: z.string().min(1, "Sample ID required"),
    testType: z.string().min(1, "Test Type required"),
    reportStatus: z.enum(["pending", "processing", "ready", "delivered"]).optional()
  })
});

// ✅ GET ALL LAB REPORTS (with pagination & filters)
exports.getLabReports = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const { 
      status, 
      page = 1, 
      limit = 10, 
      search,
      date 
    } = req.query;

    // Build query
    const query = {
      facilityId,
      facilityType: 'pathlab' // Lab reports only for pathlab
    };

    // Filter by status if provided
    if (status && status !== 'all') {
      query.status = status;
    }

    // Search by patient name, sample ID, test type, doctor, date, or status
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchLower = search.toLowerCase();

      // Status mapping for user friendly terms (e.g. pending -> waiting, ready -> completed)
      const statusMatches = [];
      if ('pending'.includes(searchLower) || 'waiting'.includes(searchLower)) statusMatches.push('waiting');
      if ('processing'.includes(searchLower) || 'in-progress'.includes(searchLower) || 'progress'.includes(searchLower)) statusMatches.push('in-progress');
      if ('ready'.includes(searchLower) || 'completed'.includes(searchLower) || 'complete'.includes(searchLower)) statusMatches.push('completed');
      if ('delivered'.includes(searchLower) || 'deliver'.includes(searchLower)) statusMatches.push('delivered');
      if ('cancelled'.includes(searchLower) || 'cancel'.includes(searchLower)) statusMatches.push('cancelled');

      const orConditions = [
        { patientName: { $regex: safeSearch, $options: 'i' } },
        { 'customData.sampleId': { $regex: safeSearch, $options: 'i' } },
        { 'customData.testType': { $regex: safeSearch, $options: 'i' } },
        { doctorName: { $regex: safeSearch, $options: 'i' } },
        {
          $expr: {
            $regexMatch: {
              input: {
                $dateToString: {
                  format: "%Y-%m-%d %H:%M %d %b %Y %d %B %Y %b %d %B %d",
                  date: "$createdAt"
                }
              },
              regex: safeSearch,
              options: "i"
            }
          }
        }
      ];

      if (statusMatches.length > 0) {
        orConditions.push({ status: { $in: statusMatches } });
      }

      query.$or = orConditions;
    }

    // Filter by date (today, this week, etc.)
    if (date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (date === 'today') {
        query.createdAt = { $gte: today };
      } else if (date === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        query.createdAt = { $gte: weekAgo };
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reports = await Queue.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Queue.countDocuments(query);

    res.json({
      success: true,
      count: reports.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      reports
    });

  } catch (err) {
    next(err);
  }
};

// ✅ GET LAB STATS (for summary cards)
exports.getLabStats = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const { date = 'today' } = req.query;

    // Build date filter
    let dateFilter = {};
    if (date === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: today } };
    }

    // Aggregate stats
    const stats = await Queue.aggregate([
      {
        $match: {
          facilityId: new mongoose.Types.ObjectId(facilityId),
          facilityType: 'pathlab',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format stats
    const formattedStats = {
      pending: 0,
      processing: 0,
      ready: 0,
      delivered: 0,
      total: 0
    };

    stats.forEach(stat => {
      if (stat._id === 'waiting') formattedStats.pending = stat.count;
      if (stat._id === 'in-progress') formattedStats.processing = stat.count;
      if (stat._id === 'completed') formattedStats.ready = stat.count;
      if (stat._id === 'delivered') formattedStats.delivered = stat.count;
      formattedStats.total += stat.count;
    });

    res.json({
      success: true,
      stats: formattedStats
    });

  } catch (err) {
    next(err);
  }
};

// ✅ UPDATE LAB STATUS
exports.updateLabStatus = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const { id } = req.params;
    const { status } = req.body;

    // Validate status transition
    const validTransitions = {
      waiting: ['in-progress', 'cancelled'],
      'in-progress': ['completed', 'cancelled'],
      completed: ['delivered']
    };

    const report = await Queue.findOne({
      _id: id,
      facilityId,
      facilityType: 'pathlab'
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Lab report not found'
      });
    }

    const currentStatus = report.status;
    const allowedNextStatus = validTransitions[currentStatus] || [];

    if (!allowedNextStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${currentStatus} to ${status}`
      });
    }

    // Update status
    report.status = status;
    if (status === 'completed') {
      report.completedAt = new Date();
    }
    await report.save();

    // Emit socket event
    emitQueueUpdate(facilityId, 'pathlab', {
      action: 'status_update',
      report
    });

    logger.info(`Lab report ${report.customData?.get('sampleId')} status updated to ${status}`);

    res.json({
      success: true,
      data: report,
      message: 'Status updated successfully'
    });

  } catch (err) {
    next(err);
  }
};

// ✅ CREATE NEW LAB ORDER
exports.createLabOrder = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const { patientName, phone, customData, doctorName } = req.body;

    // Validate input
    const validation = labOrderSchema.safeParse({
      patientName,
      phone,
      doctorName,
      customData
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: validation.error.errors
      });
    }

    // Generate next token number
    const lastToken = await Queue.findOne({
      facilityId,
      facilityType: 'pathlab'
    }).sort({ tokenNumber: -1 });

    const nextToken = (lastToken?.tokenNumber || 0) + 1;

    // Create lab order
    const labOrder = await Queue.create({
      facilityId,
      facilityType: 'pathlab',
      patientName,
      phone,
      customData,
      doctorName,
      tokenNumber: nextToken,
      status: 'completed',
      completedAt: new Date(),
      isLabOrder: true
    });

    // Emit socket event
    emitQueueUpdate(facilityId, 'pathlab', {
      action: 'add',
      report: labOrder
    });

    logger.info(`New lab order created: ${customData.sampleId}`);

    res.status(201).json({
      success: true,
      labOrder,
      message: 'Lab order created successfully'
    });

  } catch (err) {
    next(err);
  }
};

// ✅ UPDATE LAB ORDER DETAILS (EDIT)
exports.updateLabOrder = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const { id } = req.params;
    const { patientName, phone, customData, doctorName } = req.body;

    // Validate input
    const validation = labOrderSchema.safeParse({
      patientName,
      phone,
      doctorName,
      customData
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: validation.error.errors
      });
    }

    const report = await Queue.findOne({
      _id: id,
      facilityId,
      facilityType: 'pathlab'
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Lab report not found'
      });
    }

    report.patientName = patientName;
    report.phone = phone;
    report.doctorName = doctorName;
    report.customData = customData;

    await report.save();

    // Emit socket event
    emitQueueUpdate(facilityId, 'pathlab', {
      action: 'status_update',
      report
    });

    res.json({
      success: true,
      data: report,
      message: 'Lab order updated successfully'
    });
  } catch (err) {
    next(err);
  }
};

// ✅ DELETE LAB ORDER
exports.deleteLabOrder = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const { id } = req.params;

    const report = await Queue.findOneAndDelete({
      _id: id,
      facilityId,
      facilityType: 'pathlab'
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Lab report not found'
      });
    }

    // Emit socket event
    emitQueueUpdate(facilityId, 'pathlab', {
      action: 'status_update',
      report: null
    });

    res.json({
      success: true,
      message: 'Lab order deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// ✅ UPDATE LAB ORDER DETAILS (Edit)
exports.updateLabOrder = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const { id } = req.params;
    const { patientName, phone, customData, doctorName } = req.body;

    // Validate input
    const validation = labOrderSchema.safeParse({
      patientName,
      phone,
      doctorName,
      customData
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: validation.error.errors
      });
    }

    const report = await Queue.findOne({
      _id: id,
      facilityId,
      facilityType: 'pathlab'
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Lab report not found'
      });
    }

    // Update fields
    report.patientName = patientName;
    report.phone = phone;
    report.doctorName = doctorName;
    
    if (customData) {
      Object.keys(customData).forEach(key => {
        report.customData.set(key, customData[key]);
      });
    }

    await report.save();

    // Emit socket event for real-time list update
    emitQueueUpdate(facilityId, 'pathlab', {
      action: 'update',
      report
    });

    logger.info(`Lab order ${report.customData?.get('sampleId')} updated successfully`);

    res.json({
      success: true,
      data: report,
      message: 'Lab order updated successfully'
    });

  } catch (err) {
    next(err);
  }
};

// ✅ DELETE LAB ORDER
exports.deleteLabOrder = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const { id } = req.params;

    const report = await Queue.findOneAndDelete({
      _id: id,
      facilityId,
      facilityType: 'pathlab'
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Lab report not found'
      });
    }

    // Emit socket event for real-time list update
    emitQueueUpdate(facilityId, 'pathlab', {
      action: 'delete',
      reportId: id
    });

    logger.info(`Lab order ${report.customData?.get('sampleId')} deleted by staff`);

    res.json({
      success: true,
      message: 'Lab order deleted successfully'
    });

  } catch (err) {
    next(err);
  }
};

