// server/models/Appointment.js
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  // 🔗 Link to Facility (Isolation ke liye)
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
  
  // 👤 Patient Details
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true
  },
  patientName: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  
  // 📅 Appointment Time & Date
  appointmentDate: {
    type: Date,
    required: true,
    index: true
  },
  startTime: { type: String, required: true }, // Format: "09:00 AM"
  endTime: { type: String, required: true },   // Format: "09:30 AM"
  duration: { type: Number, default: 30 }, // Minutes
  
  //  Token & Status Management
  tokenNumber: { type: String, required: true, index: true }, // "APPT-001"
  status: {
    type: String,
    enum: ["scheduled", "confirmed", "checked-in", "in-progress", "completed", "cancelled", "no-show"],
    default: "scheduled",
    index: true
  },
  
  // 🏥 Type-Specific Fields (Configurable)
  appointmentType: { type: String, required: true }, // e.g., "general", "dental-cleaning"
  doctorName: { type: String, trim: true },
  roomNumber: { type: String, trim: true },
  
  //  Queue Integration (Optional conversion)
  queueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Queue"
  },
  isConvertedToQueue: { type: Boolean, default: false },
  
  // 📝 Notes & Metadata
  notes: { type: String },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  // 🕒 Timestamps
  checkedInAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String
  
}, { timestamps: true });

// 🚀 Compound Indexes for Performance
appointmentSchema.index({ facilityId: 1, facilityType: 1, appointmentDate: 1 });
appointmentSchema.index({ facilityId: 1, facilityType: 1, status: 1, appointmentDate: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
