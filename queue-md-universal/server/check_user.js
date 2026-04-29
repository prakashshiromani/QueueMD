const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  console.log("Connected to MongoDB");
  const email = "admin.test6@apolloclinic.com";
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    console.log(`User ${email} NOT FOUND in DB.`);
  } else {
    console.log(`User ${email} FOUND.`);
    console.log(`Role: ${user.role}, Facility: ${user.facilityId}`);
    
    // Test password match
    const bcrypt = require("bcryptjs");
    const isMatch = await bcrypt.compare("SecurePass123!", user.password);
    console.log(`Password Match for 'SecurePass123!': ${isMatch}`);
  }
  process.exit(0);
})
.catch(err => {
  console.error("MongoDB Error:", err);
  process.exit(1);
});
