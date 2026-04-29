const express = require("express");
const { getStaff, createStaff } = require("../controllers/user.controller");
const { auth } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/staff", auth, getStaff);
router.post("/create", auth, createStaff);

module.exports = router;
