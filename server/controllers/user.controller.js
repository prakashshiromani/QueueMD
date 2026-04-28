const User = require("../models/User");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

exports.createStaff = async (req, res, next) => {
  try {
    const { name, email, password, role, specialization, phone, shift, isActive } = req.body;
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
