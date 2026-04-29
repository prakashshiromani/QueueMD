// server/controllers/auth.controller.js
const User = require("../models/User");
const Facility = require("../models/Facility");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");

// Validation Schemas
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  facilityName: z.string().optional(), // If new facility
  facilityId: z.string().optional(),   // If existing facility
  facilityType: z.enum(["clinic", "hospital", "pathlab", "dental", "physio", "other"]).default("clinic"),
  role: z.enum(["admin", "receptionist", "doctor", "lab_tech"]).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

// ✅ REGISTER (Auto-Create Facility if needed)
exports.register = async (req, res, next) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, errors: validation.error.format() });
    }

    const { name, email, password, facilityName, facilityId, facilityType, role = "admin" } = validation.data;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists with this email" });
    }

    let facility;
    // Logic: Either use existing facilityId OR create new one from facilityName
    if (facilityId) {
      facility = await Facility.findById(facilityId);
    } else if (facilityName) {
      facility = await Facility.findOne({ name: facilityName, facilityType });
      if (!facility) {
        facility = await Facility.create({ name: facilityName, facilityType });
      }
    } else {
      return res.status(400).json({ success: false, message: "Either facilityName or facilityId is required" });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      facilityId: facility._id,
      facilityType: facility.facilityType,
      role
    });

    // Generate JWT
    const token = jwt.sign(
      { 
        id: user._id, 
        facilityId: user.facilityId, 
        facilityType: user.facilityType, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        facilityId: user.facilityId,
        facilityType: user.facilityType,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

// ✅ LOGIN
exports.login = async (req, res, next) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, errors: validation.error.format() });
    }

    const { email, password } = validation.data;
    console.log(`[LOGIN ATTEMPT] Email: ${email}`);

    // Find User (+password because we hid it in model)
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Verify Password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Get Facility Name for frontend display
    const facility = await Facility.findById(user.facilityId);

    // Generate JWT
    const token = jwt.sign(
      { 
        id: user._id, 
        facilityId: user.facilityId, 
        facilityType: user.facilityType, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        facilityId: user.facilityId,
        facilityType: user.facilityType,
        facilityName: facility ? facility.name : ''
      }
    });
  } catch (err) {
    next(err);
  }
};
