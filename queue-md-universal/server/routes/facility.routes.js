const express = require("express");
const router = express.Router();
const { createFacility, getFacilities, addBranch, updateBranch, getBranches } = require("../controllers/facility.controller");
const { auth } = require("../middleware/auth.middleware");

router.post("/create", auth, createFacility);
router.get("/", auth, getFacilities);

// Branch Routes
router.get("/:id/branches", auth, getBranches);
router.post("/:id/branch", auth, addBranch);
router.put("/:id/branch/:branchId", auth, updateBranch);
module.exports = router;
