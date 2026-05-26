const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

const DOCTOR_ID = "6a152a60de9afb39a09b9d47"; // shiv - ID ending in 9b9d47

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  console.log("✅ Connected to MongoDB\n");

  const before = await User.findById(DOCTOR_ID).select("-password");
  console.log("BEFORE:", { name: before.name, facilityType: before.facilityType });

  const updated = await User.findByIdAndUpdate(
    DOCTOR_ID,
    { facilityType: "dental" },
    { new: true }
  ).select("-password");

  console.log("AFTER:", { name: updated.name, facilityType: updated.facilityType });
  console.log("\n✅ Doctor 'shiv' facilityType updated to 'dental' successfully!");

  process.exit(0);
})
.catch(err => {
  console.error("❌ MongoDB Error:", err);
  process.exit(1);
});
