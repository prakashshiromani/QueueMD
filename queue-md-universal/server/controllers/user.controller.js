const User = require("../models/User");
const { FACILITY_TYPES } = require("../utils/facilityTypeConfig");

// ✅ CREATE STAFF
exports.createStaff = async (req, res) => {
  try {
    const { 
      name, email, password, role, 
      specialization, phone, shift, workingDays, profileImage,
      facilityType: bodyFacilityType  // ✅ Allow admin to set department
    } = req.body;

    // 🔐 RBAC Check
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    // 🔍 Determine facilityType: use body value if valid, else fall back to JWT
    const validTypes = Object.keys(FACILITY_TYPES);
    const staffFacilityType = (bodyFacilityType && validTypes.includes(bodyFacilityType))
      ? bodyFacilityType
      : req.user.facilityType;

    // 🔍 Validate final facilityType
    if (!FACILITY_TYPES[staffFacilityType]) {
      return res.status(400).json({ success: false, message: "Invalid department / facility type" });
    }

    // ✅ Create new staff with ALL fields + facility isolation
    const newStaff = await User.create({
      name,
      email,
      password,
      role: role || "receptionist",
      specialization: specialization || "",
      phone: phone || "",
      shift: shift || "09:00 AM - 05:00 PM",
      workingDays: workingDays || ["Mon", "Tue", "Wed", "Thu", "Fri"],
      profileImage: profileImage || "",
      facilityId: req.user.facilityId,   // 🔒 Always from JWT (facility isolation)
      facilityType: staffFacilityType    // ✅ From form (department choice)
    });

    // 📡 Real-time emit to facility room
    const io = require("../sockets").getIO();
    io.to(`${req.user.facilityId}_${req.user.facilityType}`).emit("staff_update", {
      action: "create",
      userId: newStaff._id,
      userData: {
        _id: newStaff._id,
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
        specialization: newStaff.specialization,
        phone: newStaff.phone,
        shift: newStaff.shift,
        workingDays: newStaff.workingDays,
        profileImage: newStaff.profileImage,
        isActive: newStaff.isActive,
        facilityType: newStaff.facilityType
      }
    });

    res.status(201).json({ success: true, data: newStaff });
  } catch (error) {
    console.error("❌ createStaff error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ UPDATE STAFF
exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, email, role, isActive,
      specialization, phone, shift, workingDays, profileImage 
    } = req.body;

    // 🔐 RBAC Check
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    // 🔍 Find & update with facility isolation
    const updatedStaff = await User.findOneAndUpdate(
      { _id: id, facilityId: req.user.facilityId },
      {
        name,
        email,
        role,
        isActive,
        specialization,
        phone,
        shift,
        workingDays,
        profileImage,
        updatedAt: new Date()
      },
      { new: true, runValidators: true, context: "query" }
    ).select("-password"); // 🔒 Never send password hash

    if (!updatedStaff) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    // 📡 Real-time emit
    const io = require("../sockets").getIO();
    io.to(`${req.user.facilityId}_${req.user.facilityType}`).emit("staff_update", {
      action: "update",
      userId: updatedStaff._id,
      updatedData: {
        _id: updatedStaff._id,
        name: updatedStaff.name,
        email: updatedStaff.email,
        role: updatedStaff.role,
        specialization: updatedStaff.specialization,
        phone: updatedStaff.phone,
        shift: updatedStaff.shift,
        workingDays: updatedStaff.workingDays,
        profileImage: updatedStaff.profileImage,
        isActive: updatedStaff.isActive
      }
    });

    res.status(200).json({ success: true, data: updatedStaff });
  } catch (error) {
    console.error("❌ updateStaff error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ GET STAFF
exports.getStaff = async (req, res, next) => {
  try {
    const facilityId = req.user.facilityId;

    if (!facilityId) {
      return res.status(401).json({ success: false, message: "Unauthorized: No facility context found" });
    }

    // Fetch all users in this facility
    const staff = await User.find({ facilityId: req.user.facilityId }).select("-password");

    res.status(200).json({
      success: true,
      count: staff.length,
      data: staff
    });
  } catch (err) {
    next(err);
  }
};

// ✅ DELETE STAFF
exports.deleteStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    // 📡 Real-time Sync
    const io = require("../sockets").getIO();
    io.to(`${req.user.facilityId}_${req.user.facilityType}`).emit("staff_update", {
      action: "delete",
      userId: id
    });

    res.status(200).json({ success: true, message: "Staff member deleted" });
  } catch (err) {
    next(err);
  }
};

// ✅ TOGGLE STAFF STATUS
exports.toggleStaffStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(id, { isActive }, { new: true }).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    // 📡 Real-time Sync
    const io = require("../sockets").getIO();
    io.to(`${req.user.facilityId}_${req.user.facilityType}`).emit("staff_update", {
      action: "update",
      userId: user._id,
      updatedData: user
    });

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
