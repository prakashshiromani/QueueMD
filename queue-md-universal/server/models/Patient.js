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
  isDirectoryVisible: { type: Boolean, default: true, index: true },
  // 🔒 SECURITY: Soft delete — medical records should never be hard deleted (L-04)
  // Compliance: HIPAA/DPDP requires audit trail for patient data
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  
  // 🔒 SECURITY: GDPR/DPDP explicit patient data processing consent tracking (Item 6)
  consentGiven: { type: Boolean, default: false },
  consentTimestamp: { type: Date }
}, { timestamps: true });

// Compound index for unique patients per facility
patientSchema.index({ facilityId: 1, name: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model("Patient", patientSchema);
