const express = require("express");
const router = express.Router();
const { createFacility, getFacilities, addBranch, updateBranch, getBranches, getMyFacility, updateFacility, generateLobbyQR, completeOnboardingStep, archiveFacility, restoreFacility } = require("../controllers/facility.controller");
const { auth, authorize } = require("../middleware/auth.middleware");

router.post("/create", auth, createFacility);
router.get("/me", auth, getMyFacility);
router.put("/update", auth, updateFacility);
router.get("/", auth, getFacilities);
router.post("/lobby-qr", auth, generateLobbyQR);
router.patch("/onboarding", auth, completeOnboardingStep);

// Branch Routes
router.get("/:id/branches", auth, getBranches);
router.post("/:id/branch", auth, addBranch);
router.put("/:id/branch/:branchId", auth, updateBranch);

// Archive & Restore Routes (Admin Only)
router.patch("/:id/archive", auth, authorize("admin"), archiveFacility);
router.patch("/:id/restore", auth, authorize("admin"), restoreFacility);

module.exports = router;
