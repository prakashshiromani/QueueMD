require("dotenv").config();
const mongoose = require("mongoose");

console.log("Testing MongoDB connection...");

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully!");
    console.log("🎯 QueueMD Database Ready!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Connection Error:", err.message);
    console.log("💡 Tips:");
    console.log("1. Check MONGO_URI in .env file");
    console.log("2. Verify password is correct");
    console.log("3. Check Network Access (0.0.0.0/0 allowed?)");
    process.exit(1);
  });
