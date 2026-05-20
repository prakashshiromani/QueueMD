const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  facilityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Facility",
    required: true,
    index: true
  },
  razorpayOrderId: {
    type: String,
    required: true,
    index: true
  },
  razorpayPaymentId: {
    type: String,
    sparse: true,
    index: true
  },
  razorpaySignature: {
    type: String,
  },
  plan: {
    type: String,
    enum: ["pro"],
    required: true
  },
  duration: {
    type: String,
    enum: ["monthly", "yearly"],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: "INR"
  },
  status: {
    type: String,
    enum: ["created", "paid", "failed"],
    default: "created"
  },
  validFrom: {
    type: Date
  },
  validUntil: {
    type: Date
  }
}, { timestamps: true });

// Compound Index for fast lookup by facility and status
subscriptionSchema.index({ facilityId: 1, status: 1 });

module.exports = mongoose.model("Subscription", subscriptionSchema);
