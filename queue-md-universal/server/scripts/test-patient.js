require('dotenv').config();
const mongoose = require('mongoose');
const Patient = require('./models/Patient');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected");
    
    try {
      // Test WITHOUT facilityType (should fail)
      console.log("\n🧪 Test 1: Creating patient WITHOUT facilityType...");
      await Patient.create({
        facilityId: new mongoose.Types.ObjectId(),
        name: "Test Patient Fail",
        phone: "9999999999"
      });
      console.log("❌ Error: Should have failed validation!");
    } catch (err) {
      console.log("✅ Expected validation error caught:", err.message);
    }
    
    try {
      // Test WITH facilityType (should succeed)
      console.log("\n🧪 Test 2: Creating patient WITH facilityType...");
      const patient = await Patient.create({
        facilityId: new mongoose.Types.ObjectId(),
        facilityType: "clinic",
        name: "Test Patient Success",
        phone: "8888888888"
      });
      console.log("✅ Patient created successfully:", patient._id);
      
      // Cleanup
      await Patient.findByIdAndDelete(patient._id);
      console.log("🧹 Cleanup: Test patient deleted.");
    } catch (err) {
      console.log("❌ Error: Unexpected failure:", err.message);
    }
    
    console.log("\n🏁 All tests completed. Closing connection.");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });
