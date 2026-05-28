export const FACILITY_TYPES = {
  clinic: {
    label: "Clinic",
    icon: "🏥",
    theme: { primary: "#2563EB", secondary: "#10B981" },
    customFields: [],
    notificationTemplate: "Token #{token} abhi call hoga",
    statusFlow: ["waiting", "in-progress", "completed"],
    roles: ["Admin", "Receptionist", "Doctor", "Nurse", "Patient"],
    tokenPrefix: "TKN",
    baseConsultTime: 10
  },
  pathlab: {
    label: "Pathlab",
    icon: "🔬",
    theme: { primary: "#7C3AED", secondary: "#F59E0B" },
    customFields: [
      { name: "sampleId", type: "string", required: true, label: "Sample ID", placeholder: "SAM-001" },
      { name: "testType", type: "string", required: true, label: "Test Type", placeholder: "e.g. CBC, HbA1c, Urine" }
    ],
    notificationTemplate: "Sample #{sampleId} ready hai",
    statusFlow: ["waiting", "processing", "ready"],
    roles: ["Admin", "Lab Tech", "Receptionist", "Nurse", "Patient"],
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
    statusFlow: ["waiting", "in-chair", "completed"],
    roles: ["Admin", "Receptionist", "Dentist", "Nurse", "Patient"],
    tokenPrefix: "DNT",
    baseConsultTime: 15
  },
  physio: {
    label: "Physio",
    icon: "🧘",
    theme: { primary: "#10B981", secondary: "#059669" },
    customFields: [
      { name: "areaOfConcern", type: "select", options: ["Back", "Neck", "Knee", "Shoulder", "Other"], required: true, label: "Area of Concern" },
      { name: "sessionNumber", type: "string", label: "Session Number" }
    ],
    notificationTemplate: "Physio session for #{token} is starting",
    statusFlow: ["waiting", "session", "completed"],
    roles: ["Admin", "Physiotherapist", "Receptionist", "Nurse", "Patient"],
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
    notificationTemplate: "Patient #{token} please report to #{department} - #{ward}",
    statusFlow: ["waiting", "admitted", "discharged"],
    roles: ["Admin", "Doctor", "Nurse", "Receptionist", "Patient"],
    tokenPrefix: "HSP",
    baseConsultTime: 20
  }
};

// Sync custom types from localStorage synchronously on load
try {
  const persistedStr = localStorage.getItem('queue-md-facility');
  if (persistedStr) {
    const persisted = JSON.parse(persistedStr);
    const facilityId = persisted?.state?.facilityId;
    if (facilityId) {
      // 1. Clean up deleted keys
      const deletedSaved = localStorage.getItem(`queue-md-deleted-facility-types-${facilityId}`);
      if (deletedSaved) {
        const deletedKeys = JSON.parse(deletedSaved);
        if (Array.isArray(deletedKeys)) {
          deletedKeys.forEach(key => {
            delete FACILITY_TYPES[key];
          });
        }
      }

      // 2. Load custom types
      const saved = localStorage.getItem(`queue-md-custom-facility-types-${facilityId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.entries(parsed).forEach(([key, config]) => {
          FACILITY_TYPES[key] = config;
        });
      }
    }
  }
} catch (e) {
  console.error("Auto-load of custom/deleted facility types failed:", e);
}

export const getFacilityConfig = (type) => {
  return FACILITY_TYPES[type] || FACILITY_TYPES.clinic;
};

export const getNextTokenPrefix = (type) => {
  return FACILITY_TYPES[type]?.tokenPrefix || "TKN";
};

export const formatTokenNumber = (tokenNumber, facilityType) => {
  if (tokenNumber === undefined || tokenNumber === null || tokenNumber === "") return "—";
  const strToken = String(tokenNumber);
  if (strToken.includes("-")) {
    if (strToken.startsWith("APPT-")) {
      const prefix = getNextTokenPrefix(facilityType);
      return strToken.replace("APPT-", `${prefix}-`);
    }
    return strToken;
  }
  const prefix = getNextTokenPrefix(facilityType);
  return `${prefix}-${strToken.padStart(3, "0")}`;
};

// Helpers to dynamically add, update, and delete facility types
export const saveCustomFacilityTypes = (facilityId, customTypes, deletedKeys = []) => {
  if (!facilityId) return;
  try {
    localStorage.setItem(`queue-md-custom-facility-types-${facilityId}`, JSON.stringify(customTypes));
    localStorage.setItem(`queue-md-deleted-facility-types-${facilityId}`, JSON.stringify(deletedKeys));

    const originalDefaults = {
      clinic: {
        label: "Clinic",
        icon: "🏥",
        theme: { primary: "#2563EB", secondary: "#10B981" },
        customFields: [],
        notificationTemplate: "Token #{token} abhi call hoga",
        statusFlow: ["waiting", "in-progress", "completed"],
        roles: ["Admin", "Receptionist", "Doctor", "Nurse", "Patient"],
        tokenPrefix: "TKN",
        baseConsultTime: 10
      },
      pathlab: {
        label: "Pathlab",
        icon: "🔬",
        theme: { primary: "#7C3AED", secondary: "#F59E0B" },
        customFields: [
          { name: "sampleId", type: "string", required: true, label: "Sample ID", placeholder: "SAM-001" },
          { name: "testType", type: "string", required: true, label: "Test Type", placeholder: "e.g. CBC, HbA1c, Urine" }
        ],
        notificationTemplate: "Sample #{sampleId} ready hai",
        statusFlow: ["waiting", "processing", "ready"],
        roles: ["Admin", "Lab Tech", "Receptionist", "Nurse", "Patient"],
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
        statusFlow: ["waiting", "in-chair", "completed"],
        roles: ["Admin", "Receptionist", "Dentist", "Nurse", "Patient"],
        tokenPrefix: "DNT",
        baseConsultTime: 15
      },
      physio: {
        label: "Physio",
        icon: "🧘",
        theme: { primary: "#10B981", secondary: "#059669" },
        customFields: [
          { name: "areaOfConcern", type: "select", options: ["Back", "Neck", "Knee", "Shoulder", "Other"], required: true, label: "Area of Concern" },
          { name: "sessionNumber", type: "string", label: "Session Number" }
        ],
        notificationTemplate: "Physio session for #{token} is starting",
        statusFlow: ["waiting", "session", "completed"],
        roles: ["Admin", "Physiotherapist", "Receptionist", "Nurse", "Patient"],
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
        notificationTemplate: "Patient #{token} please report to #{department} - #{ward}",
        statusFlow: ["waiting", "admitted", "discharged"],
        roles: ["Admin", "Doctor", "Nurse", "Receptionist", "Patient"],
        tokenPrefix: "HSP",
        baseConsultTime: 20
      }
    };

    // Clean all keys first
    Object.keys(FACILITY_TYPES).forEach(key => {
      delete FACILITY_TYPES[key];
    });

    // Restore original defaults (except deleted ones)
    Object.entries(originalDefaults).forEach(([key, config]) => {
      if (!deletedKeys.includes(key)) {
        FACILITY_TYPES[key] = config;
      }
    });

    // Merge custom ones
    Object.entries(customTypes).forEach(([key, config]) => {
      FACILITY_TYPES[key] = config;
    });
  } catch (e) {
    console.error("Failed to save custom facility types:", e);
  }
};

