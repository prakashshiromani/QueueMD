const mongoose = require("mongoose");
const Patient = require("../models/Patient");
const ClinicalVisit = require("../models/ClinicalVisit");
const User = require("../models/User");
const Facility = require("../models/Facility");
require("dotenv").config();

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully!");

    // Get a facility and a doctor
    const facility = await Facility.findOne();
    if (!facility) {
      console.error("No facility found. Please register a facility first.");
      process.exit(1);
    }
    console.log(`Using Facility: ${facility.name} (${facility._id})`);

    const doctor = await User.findOne({ facilityId: facility._id });
    if (!doctor) {
      console.error("No doctor/user found for this facility.");
      process.exit(1);
    }
    console.log(`Using Doctor: Dr. ${doctor.name} (${doctor._id})`);

    // Get all patients
    const patients = await Patient.find({ facilityId: facility._id });
    if (patients.length === 0) {
      console.log("No patients found in patient directory. Creating dummy patients...");
      const dummyPatients = [
        {
          facilityId: facility._id,
          facilityType: "clinic",
          name: "yash",
          phone: "9999900001",
          email: "yash@example.com",
          gender: "Male",
          age: 25,
          status: "Active",
          lastVisit: new Date(),
          lastVisitType: "CLINIC"
        },
        {
          facilityId: facility._id,
          facilityType: "clinic",
          name: "rohan",
          phone: "9999900002",
          email: "rohan@example.com",
          gender: "Male",
          age: 30,
          status: "Active",
          lastVisit: new Date(),
          lastVisitType: "CLINIC"
        },
        {
          facilityId: facility._id,
          facilityType: "clinic",
          name: "Kunal test",
          phone: "9999900003",
          email: "kunal@example.com",
          gender: "Male",
          age: 28,
          status: "Active",
          lastVisit: new Date(),
          lastVisitType: "CLINIC"
        },
        {
          facilityId: facility._id,
          facilityType: "clinic",
          name: "sajidhai",
          phone: "9999900004",
          email: "sajid@example.com",
          gender: "Male",
          age: 35,
          status: "Active",
          lastVisit: new Date(),
          lastVisitType: "CLINIC"
        },
        {
          facilityId: facility._id,
          facilityType: "clinic",
          name: "gngjij",
          phone: "9999900005",
          email: "gngjij@example.com",
          gender: "Female",
          age: 22,
          status: "Active",
          lastVisit: new Date(),
          lastVisitType: "CLINIC"
        }
      ];
      const createdPatients = await Patient.insertMany(dummyPatients);
      patients.push(...createdPatients);
      console.log(`Created ${createdPatients.length} dummy patients.`);
    }

    console.log(`Seeding visits for ${patients.length} patients...`);

    // Let's delete existing ClinicalVisit records for clean testing
    await ClinicalVisit.deleteMany({ facilityId: facility._id });
    console.log("Cleared old ClinicalVisit records.");

    const sampleVisits = [];
    for (const patient of patients) {
      // Create a few visits for each patient
      sampleVisits.push(
        {
          patientPhone: patient.phone,
          patientName: patient.name,
          facilityId: facility._id,
          facilityType: patient.facilityType || "clinic",
          doctorId: doctor._id,
          diagnosis: "Seasonal viral fever & mild dehydration",
          prescriptionNotes: "1. Tab Paracetamol 650mg - TDS - After food x 3 days\n2. Tab Levocetirizine 5mg - OD - At bedtime x 5 days\n3. ORS sachet in 1L water - Sip throughout the day",
          vitals: {
            bp: "115/78",
            weight: patient.gender === "Male" ? 72 : 55,
            temperature: 101.2
          },
          status: "completed",
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        },
        {
          patientPhone: patient.phone,
          patientName: patient.name,
          facilityId: facility._id,
          facilityType: patient.facilityType || "clinic",
          doctorId: doctor._id,
          diagnosis: "Follow up for viral fever",
          prescriptionNotes: "1. Continue hydration\n2. Tab Multivitamin - OD - After breakfast x 15 days\n3. Rest for 2 more days",
          vitals: {
            bp: "120/80",
            weight: patient.gender === "Male" ? 71.5 : 54.8,
            temperature: 98.4
          },
          status: "completed",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
        }
      );
    }

    await ClinicalVisit.insertMany(sampleVisits);
    console.log(`Successfully seeded ${sampleVisits.length} clinical visits in the database!`);

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
