// @ts-nocheck
const zod = require("zod");
const z = zod.z;

// Phone regex for Indian phone numbers (10 digits, optional country code)
const phoneRegex = /^(?:\+91|91)?[6789]\d{9}$|^[0-9]{10}$/;

const phoneField = z.preprocess(
  (val) => (typeof val === "string" ? val.replace(/\s+/g, "") : val),
  z.string().regex(phoneRegex, "Please enter a valid 10-digit phone number")
);

const addPatientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  patientName: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: phoneField,
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  gender: z.enum(["Male", "Female", "Other", "male", "female", "other"]).optional(),
  age: z.coerce.number().min(0, "Age cannot be negative").max(125, "Please enter a valid age").optional(),
  doctorName: z.string().min(2, "Doctor name must be at least 2 characters").optional().or(z.literal("")),
  facilityType: z.enum(["clinic", "hospital", "pathlab", "dental", "physio", "other"]).optional(),
  consentGiven: z.boolean().default(true),
  branchId: z.string().nullable().optional().or(z.literal("")),
  customData: z.record(z.any()).optional()
}).refine(data => data.name || data.patientName, {
  message: "Either name or patientName is required",
  path: ["name"]
});

const updatePatientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: phoneField.optional(),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal(""))
});

module.exports = {
  addPatientSchema,
  updatePatientSchema
};
