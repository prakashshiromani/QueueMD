const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const { addPatient } = require('../controllers/queue.controller');
const Queue = require('../models/Queue');
const Counter = require('../models/Counter');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");
    
    const testFacilityId = new mongoose.Types.ObjectId();
    const testFacilityType = 'clinic';
    
    console.log("Test Facility ID:", testFacilityId);
    
    // Cleanup any existing test data for safety
    await Queue.deleteMany({ facilityId: testFacilityId });
    await Counter.deleteMany({ _id: { $regex: new RegExp("^token:" + testFacilityId) } });

    // 1. First patient of the day
    console.log("\n--- 1. Adding first patient (should be token #1) ---");
    const req1 = {
      user: { facilityId: testFacilityId, facilityType: testFacilityType },
      body: { patientName: "Test Patient 1", phone: "9999999991", facilityType: testFacilityType }
    };
    const res1 = {
      status: (code) => {
        return {
          json: (data) => {
            console.log(`[Status ${code}] Token:`, data?.data?.tokenNumber);
          }
        };
      },
      json: (data) => {
        console.log(`[Success] Token:`, data?.data?.tokenNumber);
      }
    };
    
    await addPatient(req1, res1, (err) => { if (err) console.error("Error:", err); });
    
    // Wait a brief moment to ensure DB persistence
    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. Add second patient
    console.log("\n--- 2. Adding second patient (should be token #2) ---");
    const req2 = {
      user: { facilityId: testFacilityId, facilityType: testFacilityType },
      body: { patientName: "Test Patient 2", phone: "9999999992", facilityType: testFacilityType }
    };
    const res2 = {
      status: (code) => {
        return {
          json: (data) => {
            console.log(`[Status ${code}] Token:`, data?.data?.tokenNumber);
          }
        };
      },
      json: (data) => {
        console.log(`[Success] Token:`, data?.data?.tokenNumber);
      }
    };
    
    await addPatient(req2, res2, (err) => { if (err) console.error("Error:", err); });
    
    // Wait a brief moment
    await new Promise(resolve => setTimeout(resolve, 500));

    // Cleanup test data
    await Queue.deleteMany({ facilityId: testFacilityId });
    await Counter.deleteMany({ _id: { $regex: new RegExp("^token:" + testFacilityId) } });
    console.log("\nCleaned up test data.");
    
  } catch (err) {
    console.error("Run error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
