const express = require("express");
const router = express.Router();
const { createFacility, getFacilities } = require("../controllers/facility.controller");
const { auth } = require("../middleware/auth.middleware");

router.post("/create", auth, createFacility);
router.get("/", auth, getFacilities);

module.exports = router;
