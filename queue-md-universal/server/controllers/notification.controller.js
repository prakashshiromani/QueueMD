// server/controllers/notification.controller.js
const Notification = require("../models/Notification");
const logger = require("../utils/logger");
const { notificationQuerySchema } = require("../schemas/notification.schema");

// ✅ GET NOTIFICATIONS (CENTRALIZED VIEW)
exports.getNotifications = async (req, res, next) => {
  try {
    const { facilityId } = req.user; // 🟢 Sirf facilityId lenge, facilityType nahi
    
    const validation = notificationQuerySchema.safeParse(req.query);
    
    if (!validation.success) {
      return res.status(400).json({ success: false, errors: validation.error.format() });
    }

    const { page, limit } = validation.data;
    const skip = (page - 1) * limit;

    // 🔥 CHANGE HERE: FacilityType ko hata diya hai taaki sabhi departments ka data aaye
    // Sirf facilityId match honi chahiye (Isolation maintain rehta hai)
    const [notifications, total] = await Promise.all([
      Notification.find({ facilityId }) 
        .sort({ createdAt: -1 }) // Latest first
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ facilityId })
    ]);

    // Maintaining the exact previous response structure for frontend compatibility
    res.json({
      success: true,
      data: notifications,
      pagination: { 
        page, 
        limit, 
        total, 
        hasMore: skip + notifications.length < total 
      }
    });
  } catch (err) { 
    logger.error(`Notification Fetch Error: ${err.message}`);
    next(err); 
  }
};

// ✅ MARK SINGLE AS READ (CENTRALIZED)
exports.markAsRead = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const { id } = req.params;

    // 🔥 CHANGE HERE: Sirf facilityId check karega
    const updated = await Notification.findOneAndUpdate(
      { _id: id, facilityId }, 
      { isRead: true },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Notification not found or access denied" });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

// ✅ MARK ALL AS READ (CENTRALIZED)
exports.markAllAsRead = async (req, res, next) => {
  try {
    const { facilityId } = req.user;

    // 🔥 CHANGE HERE: Sabhi notifications ko mark karega jo is facility ke hain
    await Notification.updateMany(
      { facilityId, isRead: false }, 
      { isRead: true }
    );

    logger.info(`🔔 All notifications marked read for facility: ${facilityId}`);
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) { next(err); }
};
