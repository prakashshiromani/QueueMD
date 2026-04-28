const { z } = require("zod");

const FACILITY_TYPES = {
  clinic: {
    label: "Clinic",
    icon: "🏥",
    theme: { primary: "#2563EB", secondary: "#10B981" },
    customFields: [],
    notificationTemplate: "Token #{token} abhi call hoga",
    statusFlow: ["waiting", "in-progress", "completed"],
    roles: ["admin", "receptionist", "doctor", "patient"],
    tokenPrefix: "TKN",
    baseConsultTime: 10
  },
  pathlab: {
    label: "Pathlab",
    icon: "🔬",
    theme: { primary: "#7C3AED", secondary: "#F59E0B" },
    customFields: [
      { name: "sampleId", type: "string", required: true, label: "Sample ID", placeholder: "SAM-001" },
      { name: "testType", type: "select", options: ["Blood", "Urine", "X-Ray", "MRI"], required: true, label: "Test Type" }
    ],
    notificationTemplate: "Sample #{sampleId} ready hai",
    statusFlow: ["waiting", "processing", "ready"],
    roles: ["admin", "lab_tech", "receptionist", "patient"],
    tokenPrefix: "SAM",
    baseConsultTime: 5
  },
  dental: {
    label: "Dental Clinic",
    icon: "🦷",
    theme: { primary: "#EC4899", secondary: "#F472B6" },
    customFields: [
      { name: "procedure", type: "string", required: true, label: "Procedure" },
      { name: "toothNumber", type: "string", label: "Tooth Number" }
    ],
    notificationTemplate: "Appointment #{token} start hone wala hai",
    statusFlow: ["waiting", "in-chair", "completed"], // Added common dental flow
    roles: ["admin", "receptionist", "dentist", "patient"],
    tokenPrefix: "DNT",
    baseConsultTime: 15
  },
  physiotherapy: {
    label: "Physio",
    icon: "🧘",
    theme: { primary: "#10B981", secondary: "#059669" },
    customFields: [
      { name: "areaOfConcern", type: "select", options: ["Back", "Neck", "Knee", "Shoulder", "Other"], required: true, label: "Area of Concern" },
      { name: "sessionNumber", type: "string", label: "Session Number" }
    ],
    notificationTemplate: "Physio session for #{token} is starting",
    statusFlow: ["waiting", "session", "completed"],
    roles: ["admin", "physiotherapist", "receptionist", "patient"],
    tokenPrefix: "PHY",
    baseConsultTime: 25
  }
};

const getFacilityConfig = (type) => {
  return FACILITY_TYPES[type] || FACILITY_TYPES.clinic;
};

/**
 * Generates a dynamic Zod validation schema based on the facility type
 * @param {string} type - The facility type (clinic, pathlab, dental, etc.)
 * @returns {z.ZodObject} - The Zod schema for validation
 */
const getValidationSchema = (type) => {
  const baseSchema = {
    patientName: z.string().min(2, "Patient name must be at least 2 characters"),
    phone: z.string().optional()
  };

  switch (type) {
    case "pathlab":
      return z.object({
        ...baseSchema,
        customData: z.object({
          sampleId: z.string().min(1, "Sample ID is required"),
          testType: z.enum(["Blood", "Urine", "X-Ray", "MRI"], {
            errorMap: () => ({ message: "Invalid test type" })
          })
        })
      });

    case "dental":
      return z.object({
        ...baseSchema,
        customData: z.object({
          procedure: z.string().min(1, "Procedure is required"),
          toothNumber: z.string().optional()
        })
      });

    case "clinic":
    default:
      return z.object({
        ...baseSchema,
        customData: z.unknown().optional()
      });
  }
};

const getNextTokenPrefix = (type) => {
  return FACILITY_TYPES[type]?.tokenPrefix || "TKN";
};

module.exports = {
  FACILITY_TYPES,
  getFacilityConfig,
  getValidationSchema,
  getNextTokenPrefix
};
