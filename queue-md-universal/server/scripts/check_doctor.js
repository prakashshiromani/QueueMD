const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  console.log("✅ Connected to MongoDB\n");

  // Find the doctor by partial ID
  const partialId = "9b9d47";
  const users = await User.find({
    _id: { $regex: new RegExp(partialId, "i") }
  }).select("-password").catch(() => []);

  // Try finding by regex on string-converted _id
  const allDoctors = await User.find({ role: "doctor" }).select("-password");
  
  console.log(`📋 All doctors in DB (${allDoctors.length} total):`);
  allDoctors.forEach(d => {
    console.log(`  - ID: ${d._id}`);
    console.log(`    Name: ${d.name}`);
    console.log(`    Role: ${d.role}`);
    console.log(`    isActive: ${d.isActive}`);
    console.log(`    facilityType: ${d.facilityType}`);
    console.log(`    facilityId: ${d.facilityId}`);
    console.log(`    Email: ${d.email}`);
    console.log("");
  });

  // Find by partial ID match
  const matched = allDoctors.filter(d => d._id.toString().includes(partialId));
  if (matched.length > 0) {
    console.log(`\n🎯 Doctor matching ID "${partialId}":`);
    matched.forEach(d => console.log(JSON.stringify(d, null, 2)));
  } else {
    console.log(`\n⚠️  No doctor found with partial ID "${partialId}"`);
    console.log("👆 All doctor IDs listed above - check for typo");
  }

  process.exit(0);
})
.catch(err => {
  console.error("❌ MongoDB Error:", err);
  process.exit(1);
});
