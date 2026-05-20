const mongoose = require("mongoose");
const User = require("./models/User");
const Queue = require("./models/Queue");
require("dotenv").config();

async function checkData() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const user = await User.findOne({ email: "admin.test6@apolloclinic.com" });
  if (!user) {
    console.log("User not found!");
    process.exit(1);
  }

  console.log(`User Facility ID: ${user.facilityId}`);
  console.log(`User Facility Type: ${user.facilityType}`);

  const patients = await Queue.find({ 
    facilityId: user.facilityId,
    facilityType: user.facilityType
  });

  console.log(`\nTotal Patients found for this facility: ${patients.length}`);
  patients.forEach(p => {
    console.log(`- ${p.patientName} (TKN: ${p.tokenNumber}) [Status: ${p.status}]`);
  });

  process.exit(0);
}

checkData();
