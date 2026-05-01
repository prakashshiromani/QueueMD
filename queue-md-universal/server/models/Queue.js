const mongoose = require("mongoose");
const { Mixed } = mongoose.Schema.Types;

const queueSchema = new mongoose.Schema({
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
  patientName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  tokenNumber: {
    type: Number,
    required: true,
    index: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    index: true
  },
  customData: {
    type: Map,
    of: Mixed
  },
  status: {
    type: String,
    enum: ["waiting", "in-progress", "completed", "no-show", "cancelled", "delivered"],
    default: "waiting",
    index: true
  },
  // ✅ NEW: Consultation Tracking Fields
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
  calledAt: { type: Date },        // Jab patient ko call kiya gaya
  completedAt: { type: Date },     // Jab consultation khatam hua
  waitTime: { type: Number },      // Time spent waiting (calledAt - createdAt)
  actualDuration: { type: Number }, // Consultation duration in minutes (completedAt - calledAt)
  doctorName: { type: String },    // ✅ Name of the doctor who attended
  consultationNotes: { type: String },
  prescription: { type: Mixed },
  estimatedWaitTime: { type: Number, default: 0 } // In minutes (stored for quick fetch)
}, { timestamps: true });

// 🔥 COMPOUND INDEXES (Critical for Performance)
queueSchema.index({ facilityId: 1, facilityType: 1, tokenNumber: 1 });
queueSchema.index({ facilityId: 1, facilityType: 1, status: 1 });
// ✅ NEW: Index for faster duration queries
queueSchema.index({ facilityId: 1, facilityType: 1, status: 1, completedAt: -1 });
// ✅ NEW: Analytics Indexes
queueSchema.index({ facilityId: 1, facilityType: 1, createdAt: 1 });
queueSchema.index({ facilityId: 1, doctorName: 1, status: 1, completedAt: -1 });

module.exports = mongoose.model("Queue", queueSchema);
