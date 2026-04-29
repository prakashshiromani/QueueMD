const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
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
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    select: false // Password hidden by default
  },
  role: {
    type: String,
    enum: ["admin", "receptionist", "doctor", "lab_tech", "patient", "nurse", "dentist", "physiotherapist"],
    default: "receptionist"
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Indexes
userSchema.index({ facilityId: 1, facilityType: 1, role: 1 });

module.exports = mongoose.model("User", userSchema);
