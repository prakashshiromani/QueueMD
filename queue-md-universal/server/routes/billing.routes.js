const express = require("express");
const router = express.Router();
const { createInvoice, getInvoices, getStats, updateInvoiceStatus } = require("../controllers/billing.controller");
const { auth, authorize } = require("../middleware/auth.middleware");

// ✅ Routes Protected hain (Sirf logged in user access kar sakta hai)
// Admin aur Receptionist dono billing dekh/pay kar sakte hain usually.

router.post("/create", auth, authorize("admin", "receptionist"), createInvoice);
router.get("/list", auth, getInvoices);
router.get("/stats", auth, getStats);
router.patch("/:invoiceId/status", auth, authorize("admin", "receptionist"), updateInvoiceStatus);

module.exports = router;
