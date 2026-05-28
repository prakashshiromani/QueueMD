// server/controllers/auth.controller.js
const User = require("../models/User");
const logger = require("../utils/logger");
const { logAudit } = require("../utils/auditLogger");
const Facility = require("../models/Facility");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } = require("../schemas/auth.schema");

const crypto = require("crypto");
const { connection: redis } = require("../config/redis");

// Validation Schemas
const createTokens = (user) => {
  const jti = crypto.randomBytes(16).toString('hex');
  const accessToken = jwt.sign(
    { id: user._id, facilityId: user.facilityId, facilityType: user.facilityType, role: user.role, jti },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '2h', algorithm: 'HS256' }
  );
  const refreshToken = jwt.sign(
    { id: user._id, jti: jti + '_refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d', algorithm: 'HS256' }
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

    // 🔒 SECURITY: Role is always assigned server-side. Never accept from client (VULN-09)
    const { name, email, password, facilityName, facilityId, facilityType } = validation.data;
    const role = "admin"; // First user of a facility is always admin

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
      accessToken: tokens.accessToken, // 🔒 SECURITY: Removed legacy duplicate 'token' field (VULN-13)
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

    // Find User (+password +mfa fields because they are select: false in model)
    const user = await User.findOne({ email }).select("+password +mfaSecret +mfaEnabled");
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
      // 🔒 SECURITY: Use req.ip (sanitized by Express with trust proxy) instead of raw
      // X-Forwarded-For header which can be spoofed by attackers (VULN-05)
      const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
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

    // 🔒 SECURITY: Multi-Factor Authentication check (Item 2)
    if (user.mfaEnabled) {
      const mfaTempToken = jwt.sign(
        { id: user._id, mfaTemp: true },
        process.env.JWT_SECRET,
        { expiresIn: '5m', algorithm: 'HS256' }
      );
      
      logger.info(`[MFA] User ${user.email} password verified. Multi-factor authentication code required.`);
      return res.json({
        success: true,
        mfaRequired: true,
        tempToken: mfaTempToken,
        message: "MFA code is required to complete login"
      });
    }

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
      accessToken: tokens.accessToken, // 🔒 SECURITY: Removed legacy duplicate 'token' field (VULN-13)
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
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] });
    
    // Check if refresh token is blacklisted in Redis
    if (decoded.jti) {
      const isBlacklisted = await redis.get(`jwt_blacklist:${decoded.jti}`);
      if (isBlacklisted) {
        return res.status(401).json({ success: false, message: "Token has been revoked" });
      }
    }

    const user = await User.findById(decoded.id).select('_id role facilityId facilityType');
    if (!user) throw new Error("User not found");

    const jti = crypto.randomBytes(16).toString('hex');
    const newAccess = jwt.sign(
      { id: user._id, facilityId: user.facilityId, facilityType: user.facilityType, role: user.role, jti },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '2h', algorithm: 'HS256' }
    );
    
    res.json({ success: true, accessToken: newAccess });
  } catch (err) {
    res.clearCookie('refreshToken');
    res.status(403).json({ success: false, message: "Invalid or expired refresh token" });
  }
};

// ✅ FORGOT PASSWORD (Generate Secure Time-bound Link & JWT reset token)
exports.forgotPassword = async (req, res, next) => {
  try {
    const validation = forgotPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, errors: validation.error.format() });
    }

    const { email } = validation.data;
    const user = await User.findOne({ email });
    if (!user) {
      // 🔒 SECURITY: To prevent user enumeration, we return success true but log internally.
      logger.warn(`Password reset requested for non-existing email: ${email}`);
      return res.status(200).json({
        success: true,
        message: "If the email is registered, a secure reset link has been generated."
      });
    }

    // Generate a secure JTI using crypto
    const crypto = require("crypto");
    const resetJti = crypto.randomBytes(16).toString("hex");

    // Sign a time-bound JWT token (15 mins expiry)
    const resetToken = jwt.sign(
      { id: user._id, email: user.email, jti: resetJti, action: "password_reset" },
      process.env.JWT_SECRET,
      { expiresIn: "15m", algorithm: "HS256" }
    );

    // Save JTI in Redis with 15-minute TTL
    await redis.set(`password_reset_jti:${user._id}`, resetJti, "EX", 15 * 60);

    // Generate Secure Email Reset Link
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;

    // 🔒 SECURITY: Never log resetToken or link in public logs (VULN-07)
    logger.info(`[SECURITY] Password reset token generated for user: ${email}`);

    // In development, log the link for testing
    if (process.env.NODE_ENV === "development") {
      logger.debug(`[DEV ONLY] Reset Link for ${email}: ${resetLink}`);
    }

    // Return the response. In real production, send this via email.
    return res.status(200).json({
      success: true,
      message: "If the email is registered, a secure reset link has been generated.",
      // Return link in response in development mode for easy testing
      ...(process.env.NODE_ENV === "development" && { devResetLink: resetLink })
    });
  } catch (err) {
    next(err);
  }
};

// ✅ RESET PASSWORD (Verify secure JWT reset token & update password)
exports.resetPassword = async (req, res, next) => {
  try {
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, errors: validation.error.format() });
    }

    const { token, newPassword } = validation.data;

    // Verify reset token signature and expiration
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    } catch (err) {
      return res.status(400).json({ success: false, message: "Invalid or expired password reset link." });
    }

    if (decoded.action !== "password_reset") {
      return res.status(400).json({ success: false, message: "Invalid token purpose." });
    }

    // Check if JTI is active and matches in Redis
    const cachedJti = await redis.get(`password_reset_jti:${decoded.id}`);
    if (!cachedJti || cachedJti !== decoded.jti) {
      return res.status(400).json({ success: false, message: "This reset link has already been used or has expired." });
    }

    const user = await User.findById(decoded.id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update password (triggers hashing pre-save hook)
    user.password = newPassword;
    await user.save();

    // Immediately invalidate the JTI in Redis upon first use
    await redis.del(`password_reset_jti:${decoded.id}`);

    await logAudit(req, {
      action: "PASSWORD_RESET_SUCCESS",
      facilityId: user.facilityId,
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
      severity: "warning",
      status: "success"
    });

    logger.info(`[SECURITY] Password reset successful for user: ${user.email}`);

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
    const validation = changePasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, errors: validation.error.format() });
    }

    const { currentPassword, newPassword } = validation.data;

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

// ✅ LOGOUT (🔒 SECURITY: Dual-Token Revocation & Blacklisting)
exports.logout = async (req, res) => {
  try {
    const authHeader = req.header("Authorization");
    const accessToken = authHeader?.replace("Bearer ", "");
    const refreshToken = req.cookies?.refreshToken;

    // Blacklist access token if available
    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        if (decoded.jti) {
          const now = Math.floor(Date.now() / 1000);
          const remainingLife = Math.max(0, decoded.exp - now);
          if (remainingLife > 0) {
            await redis.set(`jwt_blacklist:${decoded.jti}`, '1', 'EX', remainingLife);
          }
        }
      } catch (err) {
        // Token might already be expired, ignore
      }
    }

    // Blacklist refresh token if available
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] });
        if (decoded.jti) {
          const now = Math.floor(Date.now() / 1000);
          const remainingLife = Math.max(0, decoded.exp - now);
          if (remainingLife > 0) {
            await redis.set(`jwt_blacklist:${decoded.jti}`, '1', 'EX', remainingLife);
          }
        }
      } catch (err) {
        // Token might already be expired, ignore
      }
    }

    // Clear refresh token HttpOnly cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    logger.error(`[SECURITY] Logout failed: ${err.message}`);
    res.status(500).json({ success: false, message: "Logout failed" });
  }
};

// 🔒 SECURITY: Setup Multi-Factor Authentication (Item 2)
exports.setupMFA = async (req, res, next) => {
  try {
    const speakeasy = require('speakeasy');
    const QRCode = require('qrcode');
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Generate Speakeasy TOTP Secret
    const secret = speakeasy.generateSecret({
      name: `QueueMD:${user.email}`
    });

    // Temp save secret to user record
    user.mfaSecret = secret.base32;
    await user.save();

    // Generate QR code data URI
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      qrCode: qrCodeUrl,
      secret: secret.base32,
      message: "Scan this QR code with Google Authenticator and submit the verified code to enable MFA."
    });
  } catch (err) {
    next(err);
  }
};

// 🔒 SECURITY: Verify & Enable Multi-Factor Authentication (Item 2)
exports.verifyAndEnableMFA = async (req, res, next) => {
  try {
    const speakeasy = require('speakeasy');
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: "MFA verification code is required" });

    const user = await User.findById(req.user.id).select("+mfaSecret");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code
    });

    if (!verified) {
      return res.status(400).json({ success: false, message: "Invalid verification code" });
    }

    user.mfaEnabled = true;
    await user.save();

    await logAudit(req, {
      action: "MFA_ENABLED",
      facilityId: user.facilityId,
      userId: user._id,
      severity: "warning",
      status: "success"
    });

    res.json({
      success: true,
      message: "🎉 Multi-Factor Authentication successfully activated!"
    });
  } catch (err) {
    next(err);
  }
};

// 🔒 SECURITY: MFA Verification Stage 2 login (Item 2)
exports.loginMFA = async (req, res, next) => {
  try {
    const speakeasy = require('speakeasy');
    const { tempToken, code } = req.body;
    if (!tempToken || !code) {
      return res.status(400).json({ success: false, message: "Temporary token and MFA code are required" });
    }

    // Decode tempToken
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch (err) {
      return res.status(401).json({ success: false, message: "Temporary session expired. Please log in again." });
    }

    if (!decoded.mfaTemp) {
      return res.status(401).json({ success: false, message: "Invalid session context" });
    }

    const user = await User.findById(decoded.id).select("+mfaSecret +mfaEnabled");
    if (!user || !user.mfaEnabled) {
      return res.status(404).json({ success: false, message: "MFA is not enabled for this account" });
    }

    // Verify TOTP code
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code
    });

    if (!verified) {
      return res.status(401).json({ success: false, message: "Invalid verification code" });
    }

    // Load Associated Facility Name for frontend
    const Facility = require("../models/Facility");
    const facility = await Facility.findById(user.facilityId);

    // Generate final safe JWT tokens
    const tokens = createTokens(user);

    await logAudit(req, {
      action: "LOGIN_SUCCESS_MFA",
      facilityId: user.facilityId,
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
      severity: "info",
      status: "success",
      details: { mfaUsed: true }
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      success: true,
      message: "MFA Login successful",
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


