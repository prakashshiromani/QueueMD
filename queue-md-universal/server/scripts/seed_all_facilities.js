// server/scripts/seed_all_facilities.js
// 🎯 Comprehensive Analytics Seeder for All Facilities - QueueMD v3.4

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Facility = require('../models/Facility');
const User = require('../models/User');
const Queue = require('../models/Queue');

const CONFIG = {
  totalPatientsPerFacility: 241, // Spread across last 30 days
  dateRangeDays: 30,
  weekdayWeight: 1.5,
  weekendWeight: 0.6,
  peakHours: [10, 11, 12, 13, 16, 17, 18],
  peakWeight: 2.0,
  mockDoctorNames: [
    'Dr. Amit Sharma', 'Dr. Vikram Malhotra', 'Dr. Anjali Gupta', 
    'Dr. Neha Patel', 'Dr. Rajesh Varma', 'Dr. Kabir Mehta',
    'Dr. Pooja Rao', 'Dr. Shalini Iyer'
  ],
  patientNames: ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Neha', 'Rohan', 'Pooja', 'Karan', 'Anjali'],
  patientSurnames: ['Sharma', 'Verma', 'Patel', 'Singh', 'Kumar'],
  facilityTypes: ['clinic', 'pathlab', 'dental', 'physio']
};

const weightedRandom = (options) => {
  const total = options.reduce((sum, opt) => sum + opt.weight, 0);
  let rand = Math.random() * total;
  for (const opt of options) {
    if (rand < opt.weight) return opt.value;
    rand -= opt.weight;
  }
  return options[0].value;
};

const generateCompletionDate = () => {
  const now = new Date();
  const dayOffset = Math.floor(Math.random() * CONFIG.dateRangeDays);
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() - dayOffset);
  
  const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;
  if (isWeekend && Math.random() > CONFIG.weekendWeight) {
    return generateCompletionDate();
  }
  
  const hourOptions = Array.from({ length: 10 }, (_, i) => {
    const hour = i + 9; // 9 AM to 6 PM
    const isPeak = CONFIG.peakHours.includes(hour);
    return { value: hour, weight: isPeak ? CONFIG.peakWeight : 1 };
  });
  const hour = weightedRandom(hourOptions);
  const minute = Math.floor(Math.random() * 60);
  targetDate.setHours(hour, minute, 0, 0);
  
  if (targetDate > now) {
    targetDate.setHours(now.getHours() - 1);
  }
  return targetDate;
};

const generateWaitTime = () => {
  const rand = Math.random();
  if (rand < 0.7) return Math.floor(Math.random() * 15) + 10;
  if (rand < 0.9) return Math.floor(Math.random() * 10) + 25;
  return Math.floor(Math.random() * 10) + 35;
};

const getFacilityType = () => {
  const weights = [
    { value: 'clinic', weight: 0.5 },
    { value: 'pathlab', weight: 0.25 },
    { value: 'dental', weight: 0.15 },
    { value: 'physio', weight: 0.1 }
  ];
  return weightedRandom(weights);
};

const getTokenPrefix = (facilityType) => {
  const prefixes = { clinic: 'TKN', pathlab: 'SAM', dental: 'DNT', physio: 'PHY' };
  return prefixes[facilityType] || 'TKN';
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔌 Connected to MongoDB');

    const facilities = await Facility.find();
    if (facilities.length === 0) {
      console.log('❌ No facilities found in DB. Please run basic database setup first.');
      process.exit(1);
    }

    console.log(`\n🏥 Found ${facilities.length} facilities. Starting data generation...`);
    
    // Hash password once for performance
    const hashedPassword = await bcrypt.hash('SecurePass123!', 12);

    for (const facility of facilities) {
      console.log(`\n--------------------------------------------------`);
      console.log(`🏢 Processing Facility: ${facility.name} (Type: ${facility.facilityType}, ID: ${facility._id})`);
      
      // 1. Get or create doctors for this facility
      let doctors = await User.find({ facilityId: facility._id, role: 'doctor' }).lean();
      if (doctors.length < 3) {
        console.log(`   ⚠️ Found only ${doctors.length} doctors. Creating mock doctors to support Top Doctors chart...`);
        const doctorsToCreate = [];
        for (let i = 0; i < 3; i++) {
          const docName = CONFIG.mockDoctorNames[i % CONFIG.mockDoctorNames.length];
          const docEmail = `mock.doc${i + 1}.${facility._id}@queuemd.test`;
          
          // Check if email already exists
          const existingUser = await User.findOne({ email: docEmail });
          if (!existingUser) {
            doctorsToCreate.push({
              name: docName,
              email: docEmail,
              password: hashedPassword,
              role: 'doctor',
              isActive: true,
              facilityId: facility._id,
              facilityType: facility.facilityType,
              specialization: facility.facilityType === 'dental' ? 'Dentistry' : 'General Practice'
            });
          }
        }
        if (doctorsToCreate.length > 0) {
          const created = await User.insertMany(doctorsToCreate);
          console.log(`   ✅ Created ${created.length} mock doctors.`);
        }
        // Refetch doctors
        doctors = await User.find({ facilityId: facility._id, role: 'doctor' }).lean();
      }

      const doctorNames = doctors.map(d => d.name);
      console.log(`   👨‍⚕️ Available doctors: ${doctorNames.join(', ')}`);

      // 2. Clear old Queue records for this facility
      const deletedCount = await Queue.deleteMany({ facilityId: facility._id });
      console.log(`   🗑️ Cleared ${deletedCount.deletedCount} old queue entries.`);

      // 3. Generate completed patients
      const patients = [];
      const tokenCounters = {};

      for (let i = 0; i < CONFIG.totalPatientsPerFacility; i++) {
        // Decide facilityType: use the facility's main type or distribute across common types
        const facilityType = i % 4 === 0 ? facility.facilityType : getFacilityType();
        const completedAt = generateCompletionDate();
        const waitTime = generateWaitTime();
        const doctorName = doctorNames[Math.floor(Math.random() * doctorNames.length)];
        
        if (!tokenCounters[facilityType]) tokenCounters[facilityType] = 100;
        const tokenNumber = ++tokenCounters[facilityType];
        
        const firstName = CONFIG.patientNames[Math.floor(Math.random() * CONFIG.patientNames.length)];
        const lastName = CONFIG.patientSurnames[Math.floor(Math.random() * CONFIG.patientSurnames.length)];
        const patientName = `${firstName} ${lastName}`;
        
        let customData = {};
        if (facilityType === 'pathlab') {
          customData = {
            sampleId: `SAM-${String(tokenNumber).padStart(4, '0')}`,
            testType: ['Blood', 'Urine', 'X-Ray', 'MRI', 'ECG'][Math.floor(Math.random() * 5)],
            reportStatus: 'ready'
          };
        } else if (facilityType === 'dental') {
          customData = {
            procedure: ['Cleaning', 'RCT', 'Extraction', 'Filling', 'Whitening'][Math.floor(Math.random() * 5)],
            toothNumber: `${Math.floor(Math.random() * 32) + 1}`
          };
        } else if (facilityType === 'physio') {
          customData = {
            areaOfConcern: ['Back', 'Neck', 'Knee', 'Shoulder', 'Ankle'][Math.floor(Math.random() * 5)],
            sessionNumber: `${Math.floor(Math.random() * 10) + 1}`
          };
        }

        patients.push({
          facilityId: facility._id,
          facilityType,
          patientName,
          phone: `9876543${String(200 + i).padStart(3, '0')}`,
          tokenNumber,
          customData,
          status: 'completed',
          doctorName,
          completedAt,
          actualDuration: waitTime,
          createdAt: new Date(completedAt.getTime() - waitTime * 60000),
          updatedAt: completedAt
        });
      }

      const result = await Queue.insertMany(patients);
      console.log(`   📊 Generated ${result.length} patients.`);
    }

    console.log('\n==================================================');
    console.log('🎉 ALL FACILITIES SEEDED SUCCESSFULLY!');
    console.log('==================================================');
    
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

seed();
