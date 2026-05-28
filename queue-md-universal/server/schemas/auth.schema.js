const { z } = require("zod");

const passwordValidation = z.string()
  .min(12, "Password must be at least 12 characters long")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  // 🔒 SECURITY: Raised minimum password length to 12 with strict complexity criteria (Item 1)
  password: passwordValidation,
  facilityName: z.string().optional(), // If new facility
  facilityId: z.string().optional(),   // If existing facility
  facilityType: z.enum(["clinic", "hospital", "pathlab", "dental", "physio", "other"]).default("clinic"),
});

const loginSchema = z.object({
  email: z.string().email(),
  // 🔒 SECURITY: Enforce same strong password checking in login
  password: passwordValidation,
  remember: z.boolean().optional()
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address")
});

const resetPasswordSchema = z.object({
  token: z.string({ required_error: "Reset token is required" }).min(1, "Reset token is required"),
  newPassword: passwordValidation
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordValidation
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema
};

