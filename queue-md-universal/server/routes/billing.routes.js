const express = require("express");
const router = require("express").Router();
const { createInvoice, getInvoices, getStats, updateInvoiceStatus } = require("../controllers/billing.controller");
const { auth, authorize } = require("../middleware/auth.middleware");
const { createTenantLimiter } = require("../utils/rateLimitHelper");

// 🔒 SECURITY: Tenant-aware rate limiting on billing writes (Item 7)
const billingLimiter = createTenantLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { success: false, message: "Too many billing changes. Please try again after 15 minutes." }
});

// ✅ Routes Protected hain (Sirf logged in user access kar sakta hai)
// Admin aur Receptionist dono billing dekh/pay kar sakte hain usually.

router.post("/create", auth, authorize("admin", "receptionist"), billingLimiter, createInvoice);
router.get("/list", auth, getInvoices);
router.get("/stats", auth, getStats);
router.patch("/:invoiceId/status", auth, authorize("admin", "receptionist"), billingLimiter, updateInvoiceStatus);

module.exports = router;
