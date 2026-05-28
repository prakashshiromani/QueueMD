const { z } = require("zod");

const labOrderSchema = z.object({
  patientName: z.string().min(2),
  phone: z.string().optional(),
  doctorName: z.string().optional(),
  customData: z.object({
    sampleId: z.string().min(1, "Sample ID required"),
    testType: z.string().min(1, "Test Type required"),
    reportStatus: z.enum(["pending", "processing", "ready", "delivered"]).optional()
  })
});

module.exports = {
  labOrderSchema
};
