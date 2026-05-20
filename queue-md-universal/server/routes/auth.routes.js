const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { register, login, refreshToken } = require("../controllers/auth.controller");

// 🔒 Rate Limiter Setup
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 requests per IP
  message: { success: false, message: "Too many attempts. Please try after 15 mins." }
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh", refreshToken);

module.exports = router;
