const { z } = require("zod");

const phoneRegex = /^(?:\+91|91)?[6789]\d{9}$|^[0-9]{10}$/;

const phoneField = z.preprocess(
  (val) => (typeof val === "string" ? val.replace(/\s+/g, "") : val),
  z.string().regex(phoneRegex, "Please enter a valid 10-digit phone number").optional().or(z.literal(""))
);

const addPatientQueueSchema = z.object({
  patientId: z.string().optional(),
  patientName: z.string().min(2, "Patient name must be at least 2 characters").trim(),
  phone: phoneField,
  doctorName: z.string().min(2, "Doctor name must be at least 2 characters").optional().or(z.literal("")),
  facilityType: z.enum(["clinic", "hospital", "pathlab", "dental", "physio", "other"]).optional(),
  branchId: z.string().nullable().optional().or(z.literal("")),
  customData: z.record(z.any()).optional(),
  forceAdd: z.boolean().optional()
});

const completeQueueSchema = z.object({
  consultationNotes: z.string().max(1000, "Notes limit: 1000 characters").optional().or(z.literal("")),
  prescription: z.union([z.string(), z.record(z.any())]).optional(),
  doctorName: z.string().min(2, "Doctor name must be at least 2 characters").optional().or(z.literal(""))
});

module.exports = {
  addPatientQueueSchema,
  completeQueueSchema
};
