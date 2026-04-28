const mongoose = require("mongoose");
require("dotenv").config();
const Queue = require("./models/Queue");

async function checkIsolation() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB.");

    const patients = await Queue.find(
      { patientName: { $in: ["mayank", "mohan", "soni", "Test Dental", "Test Clinic"] } },
      { patientName: 1, facilityType: 1, tokenNumber: 1 }
    ).lean();

    console.log("--- ISOLATION TEST RESULTS ---");
    patients.forEach(p => {
      console.log(`${p.patientName} → facilityType: "${p.facilityType}" ✅ (Token: ${p.tokenNumber})`);
    });
    console.log("------------------------------");

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkIsolation();
