const mongoose = require("mongoose");
const { Mixed } = mongoose.Schema.Types;

const facilitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  facilityType: {
    type: String,
    enum: ["clinic", "hospital", "pathlab", "dental", "physio", "other"],
    required: true,
    index: true,
    default: "clinic"
  },
  address: String,
  contact: String,
  logo: String,
  workingHours: { type: String, default: "09:00 - 20:00" },
  branches: [{
    name: { type: String, required: true, trim: true },
    address: { type: String },
    isActive: { type: Boolean, default: true }
  }],
  customFields: {
    type: Map,
    of: Mixed
  },
  subscriptionPlan: {
    type: String,
    enum: ["free", "pro"],
    default: "free"
  },
  subscriptionStatus: {
    type: String,
    enum: ["active", "expired", "cancelled"],
    default: "active"
  },
  subscriptionEnd: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Indexes
facilitySchema.index({ facilityType: 1, name: 1 });
facilitySchema.index({ facilityType: 1, subscriptionPlan: 1 });

module.exports = mongoose.model("Facility", facilitySchema);
