const { getValidationSchema } = require("./utils/facilityTypeConfig");

const test = () => {
  console.log("--- Starting Validation Tests ---");

  // 1. Clinic Test (Valid)
  const clinicSchema = getValidationSchema("clinic");
  const clinicResult = clinicSchema.safeParse({
    patientName: "John Doe",
    phone: "1234567890"
  });
  console.log("Clinic (Valid):", clinicResult.success ? "✅ Success" : "❌ Failed", clinicResult.error || "");

  // 2. Pathlab Test (Valid)
  const pathlabSchema = getValidationSchema("pathlab");
  const pathlabResult = pathlabSchema.safeParse({
    patientName: "Jane Doe",
    customData: {
      sampleId: "SAM-001",
      testType: "Blood"
    }
  });
  console.log("Pathlab (Valid):", pathlabResult.success ? "✅ Success" : "❌ Failed", pathlabResult.error || "");

  // 3. Pathlab Test (Invalid - Missing SampleID)
  const pathlabInvalidResult = pathlabSchema.safeParse({
    patientName: "Jane Doe",
    customData: {
      testType: "Urine"
    }
  });
  console.log("Pathlab (Invalid - Missing SampleID):", !pathlabInvalidResult.success ? "✅ Correctly Rejected" : "❌ Incorrectly Accepted");

  // 4. Dental Test (Valid)
  const dentalSchema = getValidationSchema("dental");
  const dentalResult = dentalSchema.safeParse({
    patientName: "Mike Smith",
    customData: {
      procedure: "Root Canal",
      toothNumber: "14"
    }
  });
  console.log("Dental (Valid):", dentalResult.success ? "✅ Success" : "❌ Failed", dentalResult.error || "");

  // 5. Unknown Type Fallback (Should be Clinic)
  const fallbackSchema = getValidationSchema("unknown");
  const fallbackResult = fallbackSchema.safeParse({
    patientName: "Fallback User",
    customData: { random: "data" }
  });
  console.log("Fallback (Valid):", fallbackResult.success ? "✅ Success" : "❌ Failed", fallbackResult.error || "");

  console.log("--- Validation Tests Finished ---");
};

test();
