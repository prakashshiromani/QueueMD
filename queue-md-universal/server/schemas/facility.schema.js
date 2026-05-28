const { z } = require("zod");

const facilitySchema = z.object({
  name: z.string().min(2, "Facility name required"),
  facilityType: z.enum(["clinic", "hospital", "pathlab", "dental", "physio", "other"]),
  address: z.string().optional(),
  contact: z.string().optional(),
  customFields: z.record(z.any()).optional()
});

module.exports = {
  facilitySchema
};
