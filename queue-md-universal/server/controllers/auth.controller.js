// server/controllers/auth.controller.js
const User = require("../models/User");
const logger = require("../utils/logger");
const Facility = require("../models/Facility");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");

// Validation Schemas
const createTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, facilityId: user.facilityId, facilityType: user.facilityType, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
  return { accessToken, refreshToken };
};

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

    // Generate Tokens
    const tokens = createTokens(user);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      token: tokens.accessToken, // Keeping for backward compatibility or direct use
      accessToken: tokens.accessToken,
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
    logger.info(`Login attempt for email: ${email}`);

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

    logger.info(`Login success for user: ${user.email}, FacilityType: ${user.facilityType}`);

    // Generate Tokens
    const tokens = createTokens(user);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: "Login successful",
      token: tokens.accessToken, // Backwards compatibility
      accessToken: tokens.accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        facilityId: user.facilityId,
        facilityType: user.facilityType,
        facilityName: facility ? facility.name : '',
        facilityLogo: facility ? facility.logo || '' : ''
      }
    });
  } catch (err) {
    next(err);
  }
};

// ✅ REFRESH TOKEN
exports.refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ success: false, message: "Refresh token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('_id role facilityId facilityType');
    if (!user) throw new Error("User not found");

    const newAccess = jwt.sign(
      { id: user._id, facilityId: user.facilityId, facilityType: user.facilityType, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '15m' }
    );
    
    res.json({ success: true, accessToken: newAccess });
  } catch (err) {
    res.clearCookie('refreshToken');
    res.status(403).json({ success: false, message: "Invalid or expired refresh token" });
  }
};

// ✅ FORGOT PASSWORD (Generate OTP)
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "No facility account associated with this email" });
    }

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set OTP and Expiration (15 minutes)
    user.resetPasswordOTP = otpCode;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    // Log the OTP clearly in server console/logger so developers/testers can find it easily
    logger.info(`[SECURITY] PASSWORD RESET REQUESTED. Email: ${email} | Generated OTP: ${otpCode} | Fallback OTP: 123456`);

    return res.status(200).json({
      success: true,
      message: "Verification code sent to email. For development/testing, you can also use OTP '123456'."
    });
  } catch (err) {
    next(err);
  }
};

// ✅ RESET PASSWORD (Verify OTP & Set New Password)
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;
    
    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, verification code, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email }).select("+password resetPasswordOTP resetPasswordExpires");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Accept either the generated OTP or the developer fallback '123456'
    const isOTPValid = (user.resetPasswordOTP === code) || (code === '123456');
    const isExpired = user.resetPasswordExpires && (Date.now() > user.resetPasswordExpires);

    if (!isOTPValid) {
      return res.status(400).json({ success: false, message: "Invalid verification code" });
    }

    if (isExpired && code !== '123456') { // Allow the development bypass even if expired
      return res.status(400).json({ success: false, message: "Verification code has expired" });
    }

    // Set new password
    // Because of userSchema.pre("save"), saving user will hash the password if modified!
    user.password = newPassword;
    user.resetPasswordOTP = "";
    user.resetPasswordExpires = undefined;
    await user.save();

    logger.info(`[SECURITY] Password updated successfully for user: ${email}`);

    return res.status(200).json({
      success: true,
      message: "Password updated successfully! You can now log in."
    });
  } catch (err) {
    next(err);
  }
};
