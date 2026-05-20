const express = require("express");
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  handleWebhook,
  getStatus,
  getHistory
} = require("../controllers/subscription.controller");

const { auth, authorize, requirePro } = require("../middleware/auth.middleware");

// Public webhook (Razorpay calls this, no auth)
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

// Protected routes
router.use(auth); // JWT verify

router.get("/status", getStatus);
router.get("/history", authorize("admin"), getHistory);
router.post("/create-order", authorize("admin"), createOrder);
router.post("/verify-payment", authorize("admin"), verifyPayment);

module.exports = router;
