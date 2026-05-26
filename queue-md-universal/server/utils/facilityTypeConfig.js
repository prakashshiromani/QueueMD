const { z } = require("zod");

const FACILITY_TYPES = {
  clinic: {
    label: "Clinic",
    icon: "🏥",
    theme: { primary: "#2563EB", secondary: "#10B981" },
    customFields: [],
    notificationTemplate: "Hello #{patientName}, aapka token #{token} abhi call hoga.",
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
    notificationTemplate: "Hello #{patientName}, Sample #{sampleId} ready hai. Report collect karein.",
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
    notificationTemplate: "Hello #{patientName}, Chair #{procedure} ke liye ready hai. Token: #{token}",
    statusFlow: ["waiting", "in-chair", "completed"],
    roles: ["admin", "receptionist", "dentist", "patient"],
    tokenPrefix: "DNT",
    baseConsultTime: 15
  },
  physio: {
    label: "Physio",
    icon: "🧘",
    theme: { primary: "#10B981", secondary: "#34D399" },
    customFields: [
      { name: "sessionType", type: "select", options: ["Initial", "Follow-up", "Recovery"], required: true },
      { name: "bodyPart", type: "string", label: "Focus Area" }
    ],
    notificationTemplate: "Hello #{patientName}, aapki #{sessionType} session start ho rahi hai. Token: #{token}",
    statusFlow: ["waiting", "in-session", "completed"],
    roles: ["admin", "receptionist", "therapist", "patient"],
    tokenPrefix: "PHY",
    baseConsultTime: 25
  },
  hospital: {
    label: "Hospital",
    icon: "🏨",
    theme: { primary: "#EF4444", secondary: "#F97316" },
    customFields: [
      { name: "ward", type: "string", required: true, label: "Ward Number", placeholder: "Ward A-1" },
      { name: "department", type: "select", options: ["General", "ICU", "Emergency", "Pediatrics"], required: true, label: "Department" }
    ],
    notificationTemplate: "Hello #{patientName}, please report to #{department} - #{ward}. Token: #{token}",
    statusFlow: ["waiting", "admitted", "discharged"],
    roles: ["admin", "doctor", "nurse", "receptionist", "patient"],
    tokenPrefix: "HSP",
    baseConsultTime: 20
  }
};

const getFacilityConfig = (type) => FACILITY_TYPES[type] || FACILITY_TYPES.clinic;

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

    case "physio":
      return z.object({
        ...baseSchema,
        customData: z.object({
          sessionType: z.enum(["Initial", "Follow-up", "Recovery"]),
          bodyPart: z.string().optional()
        })
      });

    case "hospital":
      return z.object({
        ...baseSchema,
        customData: z.object({
          ward: z.string().min(1, "Ward number is required"),
          department: z.enum(["General", "ICU", "Emergency", "Pediatrics"], {
            errorMap: () => ({ message: "Invalid department" })
          })
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
