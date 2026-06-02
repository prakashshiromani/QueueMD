// server/scripts/seeds/seed_demo_data.js
// 🎯 Comprehensive Project Seeder - QueueMD

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Facility = require('../../models/Facility');
const User = require('../../models/User');
const Queue = require('../../models/Queue');
const Patient = require('../../models/Patient');
const ClinicalVisit = require('../../models/ClinicalVisit');

const PATIENT_POOL = [
  { name: 'Aman Sharma', phone: '9999900001', email: 'aman.sharma@example.com', gender: 'Male', age: 25 },
  { name: 'Sneha Patel', phone: '9999900002', email: 'sneha.patel@example.com', gender: 'Female', age: 28 },
  { name: 'Rohan Verma', phone: '9999900003', email: 'rohan.verma@example.com', gender: 'Male', age: 30 },
  { name: 'Priya Singh', phone: '9999900004', email: 'priya.singh@example.com', gender: 'Female', age: 26 },
  { name: 'Vikram Kumar', phone: '9999900005', email: 'vikram.kumar@example.com', gender: 'Male', age: 35 },
  { name: 'Neha Gupta', phone: '9999900006', email: 'neha.gupta@example.com', gender: 'Female', age: 22 },
  { name: 'Amit Roy', phone: '9999900007', email: 'amit.roy@example.com', gender: 'Male', age: 40 },
  { name: 'Karan Joshi', phone: '9999900008', email: 'karan.joshi@example.com', gender: 'Male', age: 32 },
  { name: 'Anjali Das', phone: '9999900009', email: 'anjali.das@example.com', gender: 'Female', age: 29 },
  { name: 'Rahul Jain', phone: '9999900010', email: 'rahul.jain@example.com', gender: 'Male', age: 27 }
];

const ANALYTICS_CONFIG = {
  totalPatientsPerFacility: 150, // Spread across last 30 days
  dateRangeDays: 30,
  weekdayWeight: 1.5,
  weekendWeight: 0.6,
  peakHours: [10, 11, 12, 13, 16, 17, 18],
  peakWeight: 2.0
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
  const dayOffset = Math.floor(Math.random() * ANALYTICS_CONFIG.dateRangeDays);
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() - dayOffset);
  
  const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;
  if (isWeekend && Math.random() > ANALYTICS_CONFIG.weekendWeight) {
    return generateCompletionDate();
  }
  
  const hourOptions = Array.from({ length: 10 }, (_, i) => {
    const hour = i + 9; // 9 AM to 6 PM
    const isPeak = ANALYTICS_CONFIG.peakHours.includes(hour);
    return { value: hour, weight: isPeak ? ANALYTICS_CONFIG.peakWeight : 1 };
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

async function seed() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    const facilities = await Facility.find();
    if (facilities.length === 0) {
      console.log('❌ No facilities found in DB. Please register a facility first.');
      process.exit(1);
    }

    console.log(`\n🏥 Found ${facilities.length} facilities. Seeding mock data...`);
    const hashedPassword = await bcrypt.hash('SecurePass123!', 12);

    for (const facility of facilities) {
      console.log(`\n--------------------------------------------------`);
      console.log(`🏢 Processing Facility: ${facility.name} (Type: ${facility.facilityType}, ID: ${facility._id})`);

      // 1. Get or create doctors
      let doctors = await User.find({ facilityId: facility._id, role: 'doctor' }).lean();
      if (doctors.length < 3) {
        console.log(`   ⚠️ Found ${doctors.length} doctors. Creating mock doctors...`);
        const mockDoctorNames = [
          'Dr. Amit Sharma', 'Dr. Anjali Gupta', 'Dr. Rajesh Varma'
        ];
        const doctorsToCreate = [];
        for (let i = 0; i < 3; i++) {
          const docName = mockDoctorNames[i];
          const docEmail = `mock.doc${i + 1}.${facility._id}@queuemd.test`;
          
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
              specialization: facility.facilityType === 'dental' ? 'Dentistry' : 'General Medicine',
              phone: `987650000${i + 1}`,
              shift: '09:00 AM - 05:00 PM',
              workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
            });
          }
        }
        if (doctorsToCreate.length > 0) {
          const created = await User.insertMany(doctorsToCreate);
          console.log(`   ✅ Created ${created.length} mock doctors.`);
        }
        doctors = await User.find({ facilityId: facility._id, role: 'doctor' }).lean();
      }
      const doctorNames = doctors.map(d => d.name);
      console.log(`   👨‍⚕️ Doctors: ${doctorNames.join(', ')}`);

      // 2. Clear Old Records for this facility
      await Queue.deleteMany({ facilityId: facility._id });
      await Patient.deleteMany({ facilityId: facility._id });
      await ClinicalVisit.deleteMany({ facilityId: facility._id });
      console.log(`   🗑️ Cleared previous Queue, Patient, and ClinicalVisit records.`);

      // 3. Create Patient Directory (Patient collection)
      const patientsToInsert = PATIENT_POOL.map(p => ({
        ...p,
        facilityId: facility._id,
        facilityType: facility.facilityType,
        status: 'Active',
        isDirectoryVisible: true,
        isDeleted: false,
        consentGiven: true,
        consentTimestamp: new Date(),
        totalVisits: 2
      }));
      const insertedPatients = await Patient.insertMany(patientsToInsert);
      console.log(`   👥 Seeded ${insertedPatients.length} patients in the directory.`);

      // 4. Create Clinical Visits (with encryption)
      console.log(`   💊 Creating medical history / clinical visits...`);
      for (const patient of insertedPatients) {
        const doc = doctors[Math.floor(Math.random() * doctors.length)];
        await ClinicalVisit.create([
          {
            patientPhone: patient.phone,
            patientName: patient.name,
            facilityId: facility._id,
            facilityType: facility.facilityType,
            doctorId: doc._id,
            diagnosis: 'Acute rhinopharyngitis & mild body aches',
            prescriptionNotes: '1. Tab Paracetamol 650mg - TDS - After food x 3 days\n2. Tab Cetirizine 10mg - OD - At bedtime x 5 days\n3. Warm saline gargles thrice daily',
            vitals: { bp: '120/80', weight: patient.gender === 'Male' ? 74 : 56, temperature: 99.8 },
            status: 'completed',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          },
          {
            patientPhone: patient.phone,
            patientName: patient.name,
            facilityId: facility._id,
            facilityType: facility.facilityType,
            doctorId: doc._id,
            diagnosis: 'Follow up - fully recovered from rhinopharyngitis',
            prescriptionNotes: '1. Tab Vitamin C 500mg - OD x 10 days\n2. Maintain good hydration',
            vitals: { bp: '118/76', weight: patient.gender === 'Male' ? 74.2 : 56.1, temperature: 98.4 },
            status: 'completed',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          }
        ]);
      }
      console.log(`   ✅ Seeded clinical visits with field-level encryption.`);

      // 5. Generate Historical Completed Queue Entries (Analytics)
      console.log(`   📊 Seeding ${ANALYTICS_CONFIG.totalPatientsPerFacility} historical completed consultations...`);
      const historicalQueue = [];
      for (let i = 0; i < ANALYTICS_CONFIG.totalPatientsPerFacility; i++) {
        const completedAt = generateCompletionDate();
        const waitTime = generateWaitTime();
        const duration = Math.floor(Math.random() * 15) + 5; // 5-20 min consultation
        const doctor = doctors[Math.floor(Math.random() * doctors.length)];
        const randPatient = insertedPatients[i % insertedPatients.length];

        // Specific custom data based on facility type
        let customData = {};
        if (facility.facilityType === 'pathlab') {
          customData = {
            sampleId: `SAM-${String(i + 1).padStart(4, '0')}`,
            testType: ['Blood Routine', 'Lipid Profile', 'Thyroid Profile', 'HbA1c', 'Urine R/M'][Math.floor(Math.random() * 5)],
            reportStatus: 'ready'
          };
        } else if (facility.facilityType === 'dental') {
          customData = {
            procedure: ['Cleaning', 'Root Canal Therapy', 'Extraction', 'Composite Filling', 'Scaling'][Math.floor(Math.random() * 5)],
            toothNumber: `${Math.floor(Math.random() * 32) + 1}`
          };
        } else if (facility.facilityType === 'physio') {
          customData = {
            areaOfConcern: ['Lumbar Spine', 'Cervical Spine', 'Knee Joint', 'Shoulder Rotator Cuff', 'Ankle Sprain'][Math.floor(Math.random() * 5)],
            sessionNumber: `${Math.floor(Math.random() * 10) + 1}`
          };
        }

        historicalQueue.push({
          facilityId: facility._id,
          facilityType: facility.facilityType,
          patientName: randPatient.name,
          phone: randPatient.phone,
          patientId: randPatient._id,
          tokenNumber: i + 1,
          customData,
          status: 'completed',
          doctorName: doctor.name,
          completedAt,
          waitTime,
          actualDuration: duration,
          calledAt: new Date(completedAt.getTime() - duration * 60000),
          createdAt: new Date(completedAt.getTime() - (waitTime + duration) * 60000),
          updatedAt: completedAt
        });
      }
      await Queue.insertMany(historicalQueue);
      console.log(`   ✅ Seeded historical completed records.`);

      // 6. Generate Active Queue Entries for "Today"
      console.log(`   ⏳ Seeding active queue entries (waiting and in-progress)...`);
      const activeQueue = [
        {
          facilityId: facility._id,
          facilityType: facility.facilityType,
          patientName: insertedPatients[0].name, // Aman Sharma
          phone: insertedPatients[0].phone,
          patientId: insertedPatients[0]._id,
          tokenNumber: ANALYTICS_CONFIG.totalPatientsPerFacility + 1,
          status: 'waiting',
          createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 mins ago
        },
        {
          facilityId: facility._id,
          facilityType: facility.facilityType,
          patientName: insertedPatients[1].name, // Sneha Patel
          phone: insertedPatients[1].phone,
          patientId: insertedPatients[1]._id,
          tokenNumber: ANALYTICS_CONFIG.totalPatientsPerFacility + 2,
          status: 'waiting',
          createdAt: new Date(Date.now() - 20 * 60 * 1000) // 20 mins ago
        },
        {
          facilityId: facility._id,
          facilityType: facility.facilityType,
          patientName: insertedPatients[2].name, // Rohan Verma
          phone: insertedPatients[2].phone,
          patientId: insertedPatients[2]._id,
          tokenNumber: ANALYTICS_CONFIG.totalPatientsPerFacility + 3,
          status: 'waiting',
          createdAt: new Date(Date.now() - 10 * 60 * 1000) // 10 mins ago
        },
        {
          facilityId: facility._id,
          facilityType: facility.facilityType,
          patientName: insertedPatients[3].name, // Priya Singh
          phone: insertedPatients[3].phone,
          patientId: insertedPatients[3]._id,
          tokenNumber: ANALYTICS_CONFIG.totalPatientsPerFacility + 4,
          status: 'in-progress',
          doctorName: doctors[0].name,
          calledAt: new Date(Date.now() - 5 * 60 * 1000), // called 5 mins ago
          createdAt: new Date(Date.now() - 40 * 60 * 1000) // registered 40 mins ago
        }
      ];
      await Queue.insertMany(activeQueue);
      console.log(`   ✅ Seeded 3 waiting and 1 in-progress active queue entry.`);
    }

    console.log('\n==================================================');
    console.log('🎉 ALL DUMMY DATA SEEDED SUCCESSFULLY!');
    console.log('==================================================');
    process.exit(0);

  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
