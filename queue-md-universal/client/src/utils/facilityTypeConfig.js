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

export const getFacilityConfig = (type) => {
  return FACILITY_TYPES[type] || FACILITY_TYPES.clinic;
};

export const getNextTokenPrefix = (type) => {
  return FACILITY_TYPES[type]?.tokenPrefix || "TKN";
};
