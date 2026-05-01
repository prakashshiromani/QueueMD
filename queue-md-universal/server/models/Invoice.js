const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
  // 🔥 Isolation: Har facility ka data alag
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

  // 💰 Invoice Details
  invoiceNumber: {
    type: String,
    required: true,
    unique: true, // INV-2041, etc.
    index: true
  },
  
  // 👤 Patient Info (Queue se link kar sakte ho ya direct store kar sakte ho)
  patientName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },

  // 💵 Payment Details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  status: {
    type: String,
    enum: ["Paid", "Pending", "Overdue"],
    default: "Pending",
    index: true
  },
  
  //  Extra Notes (Optional)
  description: {
    type: String,
    trim: true
  }

}, { timestamps: true });

// 🚀 Compound Index for Fast Filtering (MCA Defense Point)
invoiceSchema.index({ facilityId: 1, status: 1 });
invoiceSchema.index({ facilityId: 1, createdAt: -1 });

module.exports = mongoose.model("Invoice", invoiceSchema);
