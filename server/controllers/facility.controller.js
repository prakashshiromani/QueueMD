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
