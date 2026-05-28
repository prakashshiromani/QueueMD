const express = require("express");
const { getAuditLogs, getAuditStats, clearAuditLogs } = require("../controllers/auditLog.controller");
const { auth, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

// Only admin users can view the facility's security audit logs
router.get("/", auth, authorize("admin"), getAuditLogs);
router.get("/stats", auth, authorize("admin"), getAuditStats);
router.delete("/", auth, authorize("admin"), clearAuditLogs);

module.exports = router;
