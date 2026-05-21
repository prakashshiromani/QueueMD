const Facility = require("../models/Facility");
const { z } = require("zod");
const logger = require("../utils/logger");

// Validation Schema
const facilitySchema = z.object({
  name: z.string().min(2, "Facility name required"),
  facilityType: z.enum(["clinic", "hospital", "pathlab", "dental", "physio", "other"]),
  address: z.string().optional(),
  contact: z.string().optional(),
  customFields: z.record(z.any()).optional()
});

// ✅ CREATE FACILITY
exports.createFacility = async (req, res, next) => {
  try {
    const validation = facilitySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: validation.error.errors
      });
    }

    const facility = await Facility.create(validation.data);
    logger.info(`New Facility Created: ${facility.name} (${facility.facilityType})`);

    res.status(201).json({
      success: true,
      data: facility,
      message: "Facility registered successfully"
    });
  } catch (err) {
    next(err);
  }
};

// ✅ GET ALL FACILITIES (Optional filter by type)
exports.getFacilities = async (req, res, next) => {
  try {
    const { facilityType } = req.query;
    const query = facilityType ? { facilityType, isActive: true } : { isActive: true };

    const facilities = await Facility.find(query).select("name facilityType _id");

    res.json({
      success: true,
      count: facilities.length,
      facilities
    });
  } catch (err) {
    next(err);
  }
};

// ✅ ADD BRANCH
exports.addBranch = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id !== req.user.facilityId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to modify this facility" });
    }

    const { name, address } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Branch name required" });

    const facility = await Facility.findById(id);
    if (!facility) return res.status(404).json({ success: false, message: "Facility not found" });

    facility.branches.push({ name, address, isActive: true });
    await facility.save();

    res.json({ success: true, data: facility.branches, message: "Branch added successfully" });
  } catch (err) {
    next(err);
  }
};

// ✅ UPDATE BRANCH
exports.updateBranch = async (req, res, next) => {
  try {
    const { id, branchId } = req.params;
    if (id !== req.user.facilityId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const { name, address, isActive } = req.body;
    
    const facility = await Facility.findById(id);
    if (!facility) return res.status(404).json({ success: false, message: "Facility not found" });

    const branch = facility.branches.id(branchId);
    if (!branch) return res.status(404).json({ success: false, message: "Branch not found" });

    if (name !== undefined) branch.name = name;
    if (address !== undefined) branch.address = address;
    if (isActive !== undefined) branch.isActive = isActive;

    await facility.save();
    res.json({ success: true, data: facility.branches, message: "Branch updated" });
  } catch (err) {
    next(err);
  }
};

// ✅ GET BRANCHES
exports.getBranches = async (req, res, next) => {
  try {
    const { id } = req.params;
    const facility = await Facility.findById(id).select("branches");
    if (!facility) return res.status(404).json({ success: false, message: "Facility not found" });

    res.json({ success: true, data: facility.branches });
  } catch (err) {
    next(err);
  }
};

// ✅ GET CURRENT FACILITY
exports.getMyFacility = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const facility = await Facility.findById(facilityId);
    if (!facility) {
      return res.status(404).json({ success: false, message: "Facility not found" });
    }
    res.json({ success: true, data: facility });
  } catch (err) {
    next(err);
  }
};

// ✅ UPDATE FACILITY DETAILS
exports.updateFacility = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const facility = await Facility.findById(facilityId);
    if (!facility) {
      return res.status(404).json({ success: false, message: "Facility not found" });
    }

    const allowedSchemaFields = ["name", "address", "contact", "logo", "workingHours"];
    const updates = req.body;

    // Check if name is being updated and validated
    if (updates.name !== undefined && (!updates.name || updates.name.trim().length < 2)) {
      return res.status(400).json({ success: false, message: "Facility name must be at least 2 characters" });
    }

    for (const key of Object.keys(updates)) {
      if (key === "facilityId" || key === "_id") continue;
      if (allowedSchemaFields.includes(key)) {
        facility[key] = updates[key];
      } else {
        // Save dynamically into customFields Map
        if (!facility.customFields) {
          facility.customFields = new Map();
        }
        facility.customFields.set(key, updates[key]);
      }
    }

    await facility.save();
    logger.info(`Facility updated: ${facility.name} (ID: ${facility._id})`);

    res.json({
      success: true,
      data: facility,
      message: "Facility settings updated successfully"
    });
  } catch (err) {
    next(err);
  }
};

