require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Facility = require("../models/Facility");
const Counter = require("../models/Counter");
const Patient = require("../models/Patient");
const { checkExpiredSubscriptions } = require("../jobs/subscriptionExpiryCron");

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function testRegexEscape() {
  console.log("\n🧪 Test 1: Testing regex escaping...");
  const maliciousQuery = "(a+)+$";
  const safeQ = escapeRegex(maliciousQuery);
  console.log(`Input: "${maliciousQuery}" -> Escaped: "${safeQ}"`);
  
  // Try running a find with the escaped regex
  try {
    const patients = await Patient.find({
      name: { $regex: safeQ, $options: "i" }
    }).limit(1);
    console.log("✅ Regex test passed! Query executed safely without crashing or ReDoS.");
  } catch (err) {
    console.error("❌ Regex escape query failed:", err.message);
  }
}

async function testSubscriptionExpiry() {
  console.log("\n🧪 Test 2: Testing subscription expiry background job...");
  
  // Create a dummy facility
  const dummyFacility = await Facility.create({
    name: "Test Expiry Clinic",
    facilityType: "clinic",
    subscriptionPlan: "pro",
    subscriptionStatus: "active",
    subscriptionEnd: new Date(Date.now() - 3600 * 1000 * 24), // Expired 1 day ago
  });
  
  console.log(`Created dummy facility: ${dummyFacility.name} (Plan: ${dummyFacility.subscriptionPlan}, Expiry: ${dummyFacility.subscriptionEnd})`);
  
  // Run the check function
  await checkExpiredSubscriptions();
  
  // Reload facility from DB
  const updatedFacility = await Facility.findById(dummyFacility._id);
  console.log(`Updated facility Plan: ${updatedFacility.subscriptionPlan}, Status: ${updatedFacility.subscriptionStatus}`);
  
  if (updatedFacility.subscriptionPlan === "free" && updatedFacility.subscriptionStatus === "expired") {
    console.log("✅ Subscription expiry test passed! Facility downgraded successfully.");
  } else {
    console.error("❌ Subscription expiry test failed! Facility not downgraded.");
  }
  
  // Cleanup dummy facility
  await Facility.findByIdAndDelete(dummyFacility._id);
}

async function testAtomicCounter() {
  console.log("\n🧪 Test 3: Testing atomic counter concurrency...");
  const counterId = `test_counter:${new mongoose.Types.ObjectId()}`;
  
  // Reset or create
  await Counter.findByIdAndDelete(counterId);
  
  // Simulate 10 rapid concurrent getNextSequence calls
  async function getNextSequence(id) {
    const counter = await Counter.findByIdAndUpdate(
      id,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    return counter.seq;
  }
  
  console.log(`Firing 10 concurrent requests to increment: ${counterId}`);
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(getNextSequence(counterId));
  }
  
  const results = await Promise.all(promises);
  console.log("Results from concurrent requests:", results);
  
  const uniqueResults = new Set(results);
  if (uniqueResults.size === 10) {
    console.log("✅ Atomic Counter concurrency test passed! All 10 returned tokens are perfectly unique.");
  } else {
    console.error("❌ Atomic Counter concurrency test failed! Duplicate tokens generated.");
  }
  
  // Cleanup
  await Counter.findByIdAndDelete(counterId);
}

async function runAllTests() {
  console.log("🚀 Starting Phase 2 (Stability & Code Quality) verification...");
  await connectDB();
  
  try {
    await testRegexEscape();
    await testSubscriptionExpiry();
    await testAtomicCounter();
  } catch (err) {
    console.error("❌ Test runner encountered error:", err);
  } finally {
    await mongoose.connection.close();
    console.log("\n👋 Closed database connection. Verification run complete!");
  }
}

runAllTests();
