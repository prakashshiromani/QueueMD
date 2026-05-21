const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  userName: { type: String, required: true },
  role: { type: String, enum: ["admin", "receptionist", "support", "system"], default: "admin" },
  message: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
});

const ticketSchema = new mongoose.Schema({
  facilityId: { type: mongoose.Schema.Types.ObjectId, ref: "Facility", required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subject: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { 
    type: String, 
    enum: ["billing", "triage", "display", "notifications", "technical"], 
    default: "technical" 
  },
  priority: { 
    type: String, 
    enum: ["low", "medium", "high", "urgent"], 
    default: "medium",
    index: true 
  },
  status: { 
    type: String, 
    enum: ["open", "in-progress", "resolved", "closed"], 
    default: "open",
    index: true 
  },
  comments: [commentSchema]
}, { timestamps: true });

// Indexes for fast queries
ticketSchema.index({ facilityId: 1, status: 1, priority: -1 });
ticketSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Ticket", ticketSchema);
