const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"]
  },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { 
    type: String, 
    enum: ["admin", "doctor", "receptionist", "nurse", "lab_tech", "patient"], 
    default: "receptionist" 
  },
  isActive: { type: Boolean, default: true },
  
  // 🆕 New Staff Scheduling & Profile Fields
  profileImage: { type: String, default: "" }, // URL for avatar
  specialization: { type: String, default: "" }, // e.g., "Cardiology", "Dental"
  phone: { 
    type: String, 
    default: "", 
    match: [/^[0-9]{10}$/, "Please enter exactly 10 digits"]
  },
  shift: { type: String, default: "09:00 AM - 05:00 PM" }, // e.g., "09:00 AM - 05:00 PM"
  workingDays: { 
    type: [String], 
    enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    default: ["Mon", "Tue", "Wed", "Thu", "Fri"] 
  },
  
  // 🏛️ Multi-Tenant Isolation (MANDATORY)
  facilityId: { type: mongoose.Schema.Types.ObjectId, ref: "Facility", required: true, index: true },
  facilityType: { 
    type: String, 
    enum: ["clinic", "hospital", "pathlab", "dental", "physio", "other"], 
    required: true, 
    index: true 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 🔐 Compound Index for Multi-Tenant Queries (Golden Rule)
userSchema.index({ facilityId: 1, facilityType: 1, email: 1 }, { unique: true });
userSchema.index({ facilityId: 1, facilityType: 1, role: 1, isActive: 1 });

// 🔐 Pre-save password hashing
userSchema.pre("save", async function() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// 🔍 Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
