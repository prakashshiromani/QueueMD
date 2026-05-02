const User = require("../models/User");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { getIO } = require("../sockets/index");

exports.createStaff = async (req, res, next) => {
  try {
    const { name, email, password, role, specialization, phone, shift, isActive, profileImage } = req.body;
    const adminFacilityId = req.user.facilityId;
    const adminFacilityType = req.user.facilityType;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists with this email" });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create staff member tied to the admin's facility
    const staff = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      facilityId: adminFacilityId,
      facilityType: adminFacilityType,
      profileImage: profileImage || "",
      specialization: specialization || "",
      phone: phone || "",
      shift: shift || "",
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      message: "Staff member created successfully!",
      data: {
        id: staff._id,
        name: staff.name,
        role: staff.role
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getStaff = async (req, res, next) => {
  try {
    const facilityId = req.user.facilityId;

    if (!facilityId) {
      return res.status(401).json({ success: false, message: "Unauthorized: No facility context found" });
    }

    // Fetch all users in this facility
    const staff = await User.find({ facilityId: new mongoose.Types.ObjectId(facilityId) }).select("-password");

    res.status(200).json({
      success: true,
      count: staff.length,
      data: staff
    });
  } catch (err) {
    next(err);
  }
};

exports.updateStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { name, email, role, isActive },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    // 📡 Real-time Sync
    const io = getIO();
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

exports.deleteStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    // 📡 Real-time Sync
    const io = getIO();
    io.to(`${req.user.facilityId}_${req.user.facilityType}`).emit("staff_update", {
      action: "delete",
      userId: id
    });

    res.status(200).json({ success: true, message: "Staff member deleted" });
  } catch (err) {
    next(err);
  }
};

exports.toggleStaffStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(id, { isActive }, { new: true }).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    // 📡 Real-time Sync
    const io = getIO();
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
