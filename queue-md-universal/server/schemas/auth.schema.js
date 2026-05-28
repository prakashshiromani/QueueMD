const { z } = require("zod");

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  facilityName: z.string().optional(), // If new facility
  facilityId: z.string().optional(),   // If existing facility
  facilityType: z.enum(["clinic", "hospital", "pathlab", "dental", "physio", "other"]).default("clinic"),
  role: z.enum(["admin", "receptionist", "doctor", "lab_tech"]).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  remember: z.boolean().optional()
});

module.exports = {
  registerSchema,
  loginSchema
};
