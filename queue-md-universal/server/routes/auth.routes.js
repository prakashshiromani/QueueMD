const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { register, login, refreshToken, forgotPassword, resetPassword, changePassword, verifyPassword, logout, setupMFA, verifyAndEnableMFA, loginMFA } = require("../controllers/auth.controller");
const { auth } = require("../middleware/auth.middleware");

// 🔒 SECURITY: Auth limiter (login/register) — 10 attempts per 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 requests per IP
  message: { success: false, message: "Too many attempts. Please try after 15 mins." },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🔒 SECURITY: Sensitive auth limiter — 5 attempts per 15 min (forgot/reset/refresh) (L-02, L-03, L-09)
const sensitiveAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many attempts. Please try after 15 mins." },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user and facility
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: "Dr. Sharma" }
 *               email: { type: string, format: email, example: "doctor@clinic.com" }
 *               password: { type: string, minLength: 6, example: "securePass123" }
 *               facilityName: { type: string, example: "City Clinic" }
 *               facilityType: { type: string, enum: [clinic, hospital, pathlab, dental, physio, other] }
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 accessToken: { type: string }
 *       400:
 *         description: Validation error or user already exists
 */
router.post("/register", authLimiter, register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: "doctor@clinic.com" }
 *               password: { type: string, example: "securePass123" }
 *     responses:
 *       200:
 *         description: Login successful — returns accessToken and sets refreshToken cookie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 accessToken: { type: string }
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id: { type: string }
 *                     name: { type: string }
 *                     email: { type: string }
 *                     role: { type: string }
 *       400: { description: Validation error }
 *       401: { description: Invalid credentials }
 */
router.post("/login", authLimiter, login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Get a new access token using the HTTP-only refresh cookie
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: New accessToken issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 accessToken: { type: string }
 *       401: { description: Refresh token missing }
 *       403: { description: Invalid or expired refresh token }
 */
// 🔒 SECURITY: Added rate limiting to /refresh endpoint (L-09)
router.post("/refresh", sensitiveAuthLimiter, refreshToken);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset verification code
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: OTP code generated and sent }
 *       404: { description: User not found }
 */
// 🔒 SECURITY: Added rate limiting to /forgot-password endpoint (L-02)
router.post("/forgot-password", sensitiveAuthLimiter, forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with OTP code
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code, newPassword]
 *             properties:
 *               email: { type: string, format: email }
 *               code: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200: { description: Password reset successful }
 *       400: { description: Invalid OTP or expired }
 */
// 🔒 SECURITY: Added rate limiting to /reset-password endpoint (L-03)
router.post("/reset-password", sensitiveAuthLimiter, resetPassword);

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Change password for an authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 6 }
 *     responses:
 *       200: { description: Password updated successfully }
 *       400: { description: Invalid input or incorrect current password }
 *       401: { description: Unauthorized }
 */
router.put("/change-password", auth, changePassword);
router.post("/verify-password", auth, verifyPassword);

router.post("/logout", auth, logout);

// 🔒 SECURITY: Multi-Factor Authentication TOTP routes (Item 2)
router.post("/mfa/setup", auth, setupMFA);
router.post("/mfa/verify", auth, verifyAndEnableMFA);
router.post("/mfa/login", loginMFA);

module.exports = router;

