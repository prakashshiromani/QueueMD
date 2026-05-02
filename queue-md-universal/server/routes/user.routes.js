const express = require("express");
const { getStaff, createStaff, updateStaff, deleteStaff, toggleStaffStatus } = require("../controllers/user.controller");
const { auth, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/staff", auth, getStaff);
router.post("/create", auth, authorize("admin"), createStaff);
router.put("/:id", auth, authorize("admin"), updateStaff);
router.delete("/:id", auth, authorize("admin"), deleteStaff);
router.patch("/:id/status", auth, authorize("admin", "receptionist"), toggleStaffStatus);

module.exports = router;
