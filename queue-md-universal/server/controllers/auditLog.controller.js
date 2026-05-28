const AuditLog = require("../models/AuditLog");
const { logAudit } = require("../utils/auditLogger");

/**
 * Retrieves paginated, filterable, and searchable security audit logs for the authenticated facility.
 */
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const { 
      page = 1, 
      limit = 20, 
      action, 
      severity, 
      search, 
      startDate, 
      endDate 
    } = req.query;

    // Strict multi-tenant isolation
    const query = { facilityId };

    if (action && action !== "all") {
      query.action = action;
    }

    if (severity && severity !== "all") {
      query.severity = severity;
    }

    if (search && search.trim() !== "") {
      query.$or = [
        { userEmail: { $regex: search.trim(), $options: "i" } },
        { userName: { $regex: search.trim(), $options: "i" } },
        { ipAddress: { $regex: search.trim(), $options: "i" } }
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Extend to end of the day (23:59:59.999)
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const skipIndex = (parseInt(page) - 1) * parseInt(limit);

    const totalLogs = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skipIndex)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total: totalLogs,
        page: parseInt(page),
        pages: Math.ceil(totalLogs / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves aggregate stats of security events (e.g., today's logins, failures, total critical items)
 */
exports.getAuditStats = async (req, res, next) => {
  try {
    const { facilityId } = req.user;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [todayLogins, todayFailed, criticalCount] = await Promise.all([
      AuditLog.countDocuments({
        facilityId,
        action: "LOGIN_SUCCESS",
        createdAt: { $gte: startOfToday }
      }),
      AuditLog.countDocuments({
        facilityId,
        action: "LOGIN_FAILED",
        createdAt: { $gte: startOfToday }
      }),
      AuditLog.countDocuments({
        facilityId,
        severity: "critical"
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        todayLogins,
        todayFailed,
        criticalCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clears all security audit logs for the authenticated facility.
 * Immediately creates a new log entry to audit the clear operation itself.
 */
exports.clearAuditLogs = async (req, res, next) => {
  try {
    const { facilityId } = req.user;

    // Delete all audit logs for this facility
    await AuditLog.deleteMany({ facilityId });

    // After deleting, create a new log entry to document that the logs were cleared
    await logAudit(req, {
      action: "AUDIT_LOGS_CLEARED",
      severity: "critical",
      status: "success",
      details: {
        message: "All security audit logs were cleared by the administrator."
      }
    });

    res.status(200).json({
      success: true,
      message: "Security audit logs cleared successfully"
    });
  } catch (error) {
    next(error);
  }
};
