const { z } = require("zod");

const invoiceSchema = z.object({
  patientName: z.string().min(2, "Patient name is required"),
  phone: z.string().optional(),
  amount: z.number().positive("Amount must be positive"),
  status: z.enum(["Paid", "Pending", "Overdue"]).optional().default("Pending"),
  description: z.string().optional()
});

module.exports = {
  invoiceSchema
};
