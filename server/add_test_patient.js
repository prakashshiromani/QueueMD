const mongoose = require("mongoose");
const User = require("./models/User");
const Queue = require("./models/Queue");
require("dotenv").config();

async function addTestPatient() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const user = await User.findOne({ email: "admin.test6@apolloclinic.com" });
  
  const lastTokenDoc = await Queue.findOne(
    { facilityId: user.facilityId, facilityType: user.facilityType }
  ).sort({ tokenNumber: -1 });

  const nextToken = (lastTokenDoc?.tokenNumber || 0) + 1;

  const newPatient = await Queue.create({
    facilityId: user.facilityId,
    facilityType: user.facilityType,
    patientName: "TESTING LIVE SYNC",
    phone: "9999999999",
    tokenNumber: nextToken,
    status: "waiting" // 👈 Explicitly setting waiting
  });

  console.log(`✅ Success! Added ${newPatient.patientName} (TKN: ${newPatient.tokenNumber})`);
  process.exit(0);
}

addTestPatient();
