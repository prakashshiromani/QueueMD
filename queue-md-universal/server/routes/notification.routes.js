const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth.middleware");
const {
  getNotifications,
  markAsRead,
  markAllAsRead
} = require("../controllers/notification.controller");

// ✅ All routes protected + facility-isolated via JWT
router.get("/", auth, getNotifications);
router.post("/:id/read", auth, markAsRead);
router.post("/read-all", auth, markAllAsRead);

module.exports = router;
