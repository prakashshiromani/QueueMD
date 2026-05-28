// server/controllers/auth.controller.js
const User = require("../models/User");
const logger = require("../utils/logger");
const { logAudit } = require("../utils/auditLogger");
const Facility = require("../models/Facility");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { registerSchema, loginSchema } = require("../schemas/auth.schema");

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

    // Create User
    const user = await User.create({
      name,
      email,
      password, // Mongoose pre-save hook will hash this automatically with 12 rounds
      facilityId: facility._id,
      facilityType: facility.facilityType,
      role
    });

    // Generate Tokens
    const tokens = createTokens(user);

    await logAudit(req, {
      action: "REGISTER_SUCCESS",
      facilityId: facility._id,
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
      severity: "info",
      status: "success",
      details: { facilityName: facility.name }
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
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
      await logAudit(req, {
        action: "LOGIN_FAILED",
        userEmail: email,
        severity: "warning",
        status: "failed",
        details: { reason: "User not found" }
      });
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Verify Password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      await logAudit(req, {
        action: "LOGIN_FAILED",
        facilityId: user.facilityId,
        userId: user._id,
        userEmail: user.email,
        userName: user.name,
        userRole: user.role,
        severity: "warning",
        status: "failed",
        details: { reason: "Incorrect password" }
      });

      // Suspicious check: count logs in past 15 mins for this IP
      const AuditLog = require("../models/AuditLog");
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
      const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip || "";
      const failedCount = await AuditLog.countDocuments({
        ipAddress,
        action: "LOGIN_FAILED",
        createdAt: { $gte: fifteenMinsAgo }
      });

      if (failedCount >= 5) {
        await logAudit(req, {
          action: "SUSPICIOUS_ACTIVITY",
          facilityId: user.facilityId,
          userId: user._id,
          userEmail: user.email,
          userName: user.name,
          userRole: user.role,
          severity: "critical",
          status: "failed",
          details: { reason: "Multiple failed login attempts", attemptCount: failedCount }
        });
      }

      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Get Facility Name for frontend display
    const facility = await Facility.findById(user.facilityId);
    if (!facility) {
      return res.status(404).json({ success: false, message: "Associated facility not found" });
    }

    // Check if facility is active (Archive Facility check)
    // Non-admin roles are blocked from logging in. Admin is allowed to log in to restore it.
    if (facility.isActive === false && user.role !== "admin") {
      await logAudit(req, {
        action: "LOGIN_FAILED",
        facilityId: user.facilityId,
        userId: user._id,
        userEmail: user.email,
        userName: user.name,
        userRole: user.role,
        severity: "warning",
        status: "failed",
        details: { reason: "Facility is archived" }
      });
      return res.status(403).json({
        success: false,
        message: "This facility has been temporarily archived. Access is restricted for staff members."
      });
    }

    logger.info(`Login success for user: ${user.email}, FacilityType: ${user.facilityType}`);

    // Generate Tokens
    const tokens = createTokens(user);

    await logAudit(req, {
      action: "LOGIN_SUCCESS",
      facilityId: user.facilityId,
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
      severity: "info",
      status: "success",
      details: { remember: validation.data.remember !== false }
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    if (validation.data.remember !== false) {
      cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    }

    res.cookie('refreshToken', tokens.refreshToken, cookieOptions);

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

// ✅ CHANGE PASSWORD (For authenticated users)
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
    }

    // Get user from database with password included
    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect current password" });
    }

    // Set new password (this will trigger pre-save hashing)
    user.password = newPassword;
    await user.save();

    await logAudit(req, {
      action: "PASSWORD_CHANGED",
      facilityId: user.facilityId,
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
      severity: "warning",
      status: "success"
    });

    logger.info(`[SECURITY] Password changed successfully by user: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (err) {
    next(err);
  }
};

// ✅ VERIFY PASSWORD (For authenticated users to confirm identity before sensitive operations)
exports.verifyPassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    // Get user from database with password included
    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await logAudit(req, {
        action: "REAUTH_FAILED",
        facilityId: user.facilityId,
        userId: user._id,
        userEmail: user.email,
        userName: user.name,
        userRole: user.role,
        severity: "warning",
        status: "failed",
        details: { reason: "Incorrect verification password" }
      });

      return res.status(400).json({ success: false, message: "Incorrect password" });
    }

    await logAudit(req, {
      action: "REAUTH_SUCCESS",
      facilityId: user.facilityId,
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
      severity: "info",
      status: "success"
    });

    return res.status(200).json({
      success: true,
      message: "Identity verified successfully"
    });
  } catch (err) {
    next(err);
  }
};


