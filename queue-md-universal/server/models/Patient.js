const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  facilityId: { type: mongoose.Schema.Types.ObjectId, ref: "Facility", required: true, index: true },
  facilityType: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true, index: true },
  phone: { type: String, required: true, trim: true, index: true },
  email: { type: String, trim: true, lowercase: true },
  gender: { type: String, enum: ["Male", "Female", "Other"] },
  age: { type: Number },
  medicalHistory: [{
    condition: String,
    diagnosedAt: Date,
    notes: String
  }],
  lastVisit: { type: Date },
  lastVisitType: { type: String }, // e.g. "CONSULTATION", "LAB TEST"
  doctorName: { type: String },
  totalVisits: { type: Number, default: 0 },
  status: { type: String, enum: ["Active", "Inactive", "Archived"], default: "Active" },
  customData: { type: mongoose.Schema.Types.Mixed, default: {} },
  // 📅 Smart Directory Sync: false = future appointment, not visible yet in directory
  isDirectoryVisible: { type: Boolean, default: true, index: true }
}, { timestamps: true });

// Compound index for unique patients per facility
patientSchema.index({ facilityId: 1, name: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model("Patient", patientSchema);
