// Set env variables first
require("dotenv").config({ path: __dirname + "/../.env" });

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Ticket = require("../models/Ticket");
const Facility = require("../models/Facility");
const User = require("../models/User");
const { createTicket } = require("../controllers/ticket.controller");

const runTest = async () => {
  await connectDB();

  // Create temporary facilities and users for testing
  console.log("Creating test facilities...");
  
  const freeFacility = await Facility.create({
    name: "Test Free Clinic",
    facilityType: "clinic",
    subscriptionPlan: "free",
    subscriptionStatus: "active"
  });

  const proFacility = await Facility.create({
    name: "Test Pro Clinic",
    facilityType: "clinic",
    subscriptionPlan: "pro",
    subscriptionStatus: "active"
  });

  const testUser = await User.create({
    name: "Test User",
    email: `test_${Date.now()}@example.com`,
    password: "password123",
    role: "admin",
    facilityId: freeFacility._id,
    facilityType: "clinic"
  });

  console.log("Testing ticket creation for Free plan...");
  // Mock req, res for Free ticket
  let createdFreeTicket = null;
  const freeReq = {
    body: {
      subject: "Free Ticket Test",
      description: "This is a ticket created on a free plan",
      priority: "medium",
      category: "technical"
    },
    user: {
      id: testUser._id,
      facilityId: freeFacility._id
    }
  };

  const freeRes = {
    status: (code) => {
      console.log(`Free Res status: ${code}`);
      return freeRes;
    },
    json: (data) => {
      console.log("Free Res JSON:", JSON.stringify(data, null, 2));
      createdFreeTicket = data.data;
    }
  };

  await createTicket(freeReq, freeRes, (err) => console.error(err));

  console.log("Testing ticket creation for Pro plan (with Priority Auto-Boost to high)...");
  // Mock req, res for Pro ticket with medium priority input
  let createdProTicket = null;
  const proReq = {
    body: {
      subject: "Pro Ticket Test",
      description: "This is a ticket created on a pro plan",
      priority: "medium",
      category: "technical"
    },
    user: {
      id: testUser._id,
      facilityId: proFacility._id
    }
  };

  const proRes = {
    status: (code) => {
      console.log(`Pro Res status: ${code}`);
      return proRes;
    },
    json: (data) => {
      console.log("Pro Res JSON:", JSON.stringify(data, null, 2));
      createdProTicket = data.data;
    }
  };

  await createTicket(proReq, proRes, (err) => console.error(err));

  // Assertions
  console.log("\n--- Verification Assertions ---");
  if (createdFreeTicket) {
    console.log("Free Ticket isProTicket:", createdFreeTicket.isProTicket === false ? "PASSED ✅" : "FAILED ❌");
    console.log("Free Ticket Priority:", createdFreeTicket.priority === "medium" ? "PASSED ✅" : "FAILED ❌");
    const diffHours = (new Date(createdFreeTicket.slaDeadline) - new Date()) / (60 * 60 * 1000);
    console.log("Free Ticket SLA (approx 24h):", Math.round(diffHours) === 24 ? "PASSED ✅" : `FAILED ❌ (Got ${diffHours}h)`);
  }

  if (createdProTicket) {
    console.log("Pro Ticket isProTicket:", createdProTicket.isProTicket === true ? "PASSED ✅" : "FAILED ❌");
    console.log("Pro Ticket Priority (auto boosted):", createdProTicket.priority === "high" ? "PASSED ✅" : `FAILED ❌ (Got ${createdProTicket.priority})`);
    const diffHours = (new Date(createdProTicket.slaDeadline) - new Date()) / (60 * 60 * 1000);
    console.log("Pro Ticket SLA (approx 2h):", Math.round(diffHours) === 2 ? "PASSED ✅" : `FAILED ❌ (Got ${diffHours}h)`);
  }

  // Cleanup
  console.log("\nCleaning up test data...");
  await Ticket.deleteMany({ _id: { $in: [createdFreeTicket?._id, createdProTicket?._id].filter(Boolean) } });
  await User.deleteOne({ _id: testUser._id });
  await Facility.deleteMany({ _id: { $in: [freeFacility._id, proFacility._id] } });
  console.log("Cleanup done.");

  mongoose.connection.close();
};

runTest().catch((err) => {
  console.error("Test Error:", err);
  mongoose.connection.close();
});
