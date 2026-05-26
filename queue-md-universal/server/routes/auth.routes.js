const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { register, login, refreshToken, forgotPassword, resetPassword } = require("../controllers/auth.controller");

// 🔒 Rate Limiter Setup
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 requests per IP
  message: { success: false, message: "Too many attempts. Please try after 15 mins." }
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
router.post("/refresh", refreshToken);

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
router.post("/forgot-password", forgotPassword);

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
router.post("/reset-password", resetPassword);

module.exports = router;
