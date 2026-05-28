const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  facilityId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Facility", 
    required: true, 
    index: true 
  },
  action: { 
    type: String, 
    required: true, 
    index: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: false 
  },
  userEmail: { 
    type: String, 
    required: false, 
    lowercase: true,
    trim: true
  },
  userName: { 
    type: String, 
    required: false 
  },
  userRole: { 
    type: String, 
    required: false 
  },
  ipAddress: { 
    type: String, 
    required: false 
  },
  userAgent: { 
    type: String, 
    required: false 
  },
  details: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  },
  severity: { 
    type: String, 
    enum: ["info", "warning", "critical"], 
    default: "info",
    index: true
  },
  status: { 
    type: String, 
    enum: ["success", "failed"], 
    default: "success" 
  }
}, { 
  timestamps: true 
});

// Indexes for fast querying of security logs within a tenant
auditLogSchema.index({ facilityId: 1, createdAt: -1 });
auditLogSchema.index({ facilityId: 1, action: 1, createdAt: -1 });
auditLogSchema.index({ facilityId: 1, severity: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
