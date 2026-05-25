const { z } = require("zod");

// 🩺 Vitals sub-schema (realistic medical ranges)
const vitalsSchema = z.object({
  bp: z
    .string()
    .regex(/^\d{2,3}\/\d{2,3}$/, { message: "BP format: 120/80" })
    .optional(),
  weight: z.number().min(0).max(300, { message: "Weight must be 0-300 kg" }).optional(),
  temperature: z.number().min(34).max(43, { message: "Temp range: 34°C - 43°C" }).optional(),
  pulse: z.number().min(30).max(220, { message: "Pulse range: 30 - 220 bpm" }).optional(),
});

// 📝 Main Clinical Note Schema
const createClinicalVisitSchema = z.object({
  patientPhone: z
    .string()
    .regex(/^\+91\d{10}$|^\d{10}$/, { message: "Valid 10-digit Indian phone required" })
    .trim(),
  
  diagnosis: z.string().min(3, "Diagnosis too short").max(200).optional(),
  prescriptionNotes: z.string().max(1000, "Notes limit: 1000 chars").optional(),
  
  vitals: vitalsSchema.optional(),
  
  // Auto-coerce string → Date, allow today or future
  followUpDate: z.coerce
    .date()
    .refine((val) => val >= new Date().setHours(0, 0, 0, 0), {
      message: "Follow-up date must be today or in future",
    })
    .optional(),
});

// 🔄 Update/Patch schema (all fields optional)
const updateClinicalVisitSchema = createClinicalVisitSchema.partial();

module.exports = {
  vitalsSchema,
  createClinicalVisitSchema,
  updateClinicalVisitSchema
};
