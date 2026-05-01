const Notification = require("../models/Notification");
const logger = require("../utils/logger");
const { z } = require("zod");

// Query Validation
const notificationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(5).max(50).default(20)
});

// ✅ GET NOTIFICATIONS (Paginated + Facility Isolated)
exports.getNotifications = async (req, res, next) => {
  try {
    const { facilityId, facilityType } = req.user; // JWT se extract
    const validation = notificationQuerySchema.safeParse(req.query);
    
    if (!validation.success) {
      return res.status(400).json({ success: false, errors: validation.error.format() });
    }

    const { page, limit } = validation.data;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({ facilityId, facilityType })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ facilityId, facilityType })
    ]);

    res.json({
      success: true,
      data: notifications,
      pagination: { page, limit, total, hasMore: skip + notifications.length < total }
    });
  } catch (err) { next(err); }
};

// ✅ MARK SINGLE AS READ
exports.markAsRead = async (req, res, next) => {
  try {
    const { facilityId, facilityType } = req.user;
    const { id } = req.params;

    const updated = await Notification.findOneAndUpdate(
      { _id: id, facilityId, facilityType }, // Isolation check
      { isRead: true },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Notification not found" });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

// ✅ MARK ALL AS READ
exports.markAllAsRead = async (req, res, next) => {
  try {
    const { facilityId, facilityType } = req.user;

    await Notification.updateMany(
      { facilityId, facilityType, isRead: false },
      { isRead: true }
    );

    logger.info(`🔔 All notifications marked read for facility: ${facilityId}`);
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) { next(err); }
};
