const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  facilityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Facility",
    required: true,
    index: true
  },
  facilityType: {
    type: String,
    enum: ["clinic", "hospital", "pathlab", "dental", "physio", "other"],
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true // Optional: agar future me user-specific notifications chahiye
  },
  type: {
    type: String,
    enum: ["appointment", "lab_report", "payment", "system", "queue_update"],
    required: true
  },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false, index: true },
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} }, // tokenNumber, sampleId, etc.
}, { timestamps: true });

// 🔥 COMPOUND INDEX: <200ms Query Guarantee (MCA Defense Point)
notificationSchema.index({ facilityId: 1, facilityType: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
