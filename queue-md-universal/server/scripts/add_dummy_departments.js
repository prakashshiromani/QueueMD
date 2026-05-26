// server/scripts/add_dummy_departments.js
require("dotenv").config({ path: __dirname + "/../.env" });
const mongoose = require("mongoose");
const Facility = require("../models/Facility");

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing from server/.env file!");
  process.exit(1);
}

const dummyCustomTypes = {
  cardiology: {
    label: "Cardiology",
    icon: "❤️",
    theme: { primary: "#EF4444", secondary: "#F87171" },
    tokenPrefix: "CAR",
    baseConsultTime: 15,
    roles: ["Admin", "Receptionist", "Cardiologist", "Patient"],
    statusFlow: ["waiting", "in-progress", "completed"],
    notificationTemplate: "Hello #{patientName}, Cardiology doctor is ready. Token: #{token}"
  },
  pediatrics: {
    label: "Pediatrics",
    icon: "👶",
    theme: { primary: "#3B82F6", secondary: "#60A5FA" },
    tokenPrefix: "PED",
    baseConsultTime: 12,
    roles: ["Admin", "Receptionist", "Pediatrician", "Patient"],
    statusFlow: ["waiting", "in-progress", "completed"],
    notificationTemplate: "Hello #{patientName}, Pediatrics department is ready. Token: #{token}"
  },
  orthopedics: {
    label: "Orthopedics",
    icon: "🦴",
    theme: { primary: "#10B981", secondary: "#34D399" },
    tokenPrefix: "ORT",
    baseConsultTime: 20,
    roles: ["Admin", "Receptionist", "Orthopedic", "Patient"],
    statusFlow: ["waiting", "in-progress", "completed"],
    notificationTemplate: "Hello #{patientName}, Orthopedics session starting. Token: #{token}"
  }
};

const run = async () => {
  try {
    console.log("🔌 Connecting to database...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Database connected successfully.");

    // Find all facilities
    const facilities = await Facility.find();

    if (facilities.length === 0) {
      console.error("❌ No facilities found in the database!");
      process.exit(1);
    }

    console.log(`🏢 Found ${facilities.length} facilities. Seeding dummy data into all of them...`);

    for (const facility of facilities) {
      if (!facility.customFields) {
        facility.customFields = new Map();
      }

      // Add dummy custom facility types
      facility.customFields.set("customFacilityTypes", dummyCustomTypes);
      
      // Clear deleted defaults to reset all defaults for a clean check
      facility.customFields.set("deletedFacilityTypes", []);

      await facility.save();
      console.log(`✅ Seeded facility: ${facility.name} (ID: ${facility._id})`);
    }

    console.log("🎉 SUCCESS! Loaded 3 dummy custom departments into all facilities successfully.");
    console.log("👉 Please refresh your browser page to see the new departments dynamically loaded!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
};

run();
