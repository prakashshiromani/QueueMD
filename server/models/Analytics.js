const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema({
  facilityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Facility",
    required: true,
    index: true
  },
  facilityType: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true
  },
  totalPatients: { type: Number, default: 0 },
  completedPatients: { type: Number, default: 0 },
  avgWaitTime: { type: Number, default: 0 },
  efficiency: { type: Number, default: 0 },
  hourlyTraffic: {
    type: Map,
    of: Number,
    default: {}
  },
  completedToday: [{
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Queue" },
    patientName: String,
    tokenNumber: Number,
    completedAt: { type: Date },
    waitTime: Number,
    facilityType: String
  }]
}, { timestamps: true });

// Ensure one analytics doc per facility/type/date
analyticsSchema.index({ facilityId: 1, facilityType: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Analytics", analyticsSchema);
