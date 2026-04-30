// server/scripts/generate_analytics_data.js
// 🎯 Professional Analytics Data Generator - QueueMD v3.4
// Usage: cd server && node scripts/generate_analytics_data.js

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Queue = require('../models/Queue');
const Facility = require('../models/Facility');

// 🎨 Configuration
const CONFIG = {
  totalPatients: 241,           // Total records to distribute
  dateRangeDays: 30,            // Spread across last 30 days
  weekdayWeight: 1.5,           // Weekdays get 1.5x more patients
  weekendWeight: 0.6,           // Weekends get fewer patients
  peakHours: [10, 11, 12, 13, 16, 17, 18], // Busy consultation hours
  peakWeight: 2.0,              // Peak hours get 2x more patients
  doctors: [
    'Dr. Sharma', 'Dr. Verma', 'Dr. Patel', 'Dr. Singh', 
    'Dr. Kumar', 'Dr. Gupta', 'Dr. Reddy', 'Dr. Mehta'
  ],
  waitTimeRange: { min: 5, max: 45 }, // Realistic wait times
  facilityTypes: ['clinic', 'pathlab', 'dental', 'physio']
};

// 🔧 Helper: Weighted random selection
const weightedRandom = (options) => {
  const total = options.reduce((sum, opt) => sum + opt.weight, 0);
  let rand = Math.random() * total;
  for (const opt of options) {
    if (rand < opt.weight) return opt.value;
    rand -= opt.weight;
  }
  return options[0].value;
};

// 🔧 Helper: Generate realistic completion date
const generateCompletionDate = () => {
  const now = new Date();
  const dayOffset = Math.floor(Math.random() * CONFIG.dateRangeDays);
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() - dayOffset);
  
  // 📅 Weekday vs Weekend weighting
  const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;
  if (isWeekend && Math.random() > CONFIG.weekendWeight) {
    return generateCompletionDate(); // Retry with weekday bias
  }
  
  // ⏰ Hour selection with peak weighting
  const hourOptions = Array.from({ length: 10 }, (_, i) => {
    const hour = i + 9; // 9 AM to 6 PM
    const isPeak = CONFIG.peakHours.includes(hour);
    return {
      value: hour,
      weight: isPeak ? CONFIG.peakWeight : 1
    };
  });
  const hour = weightedRandom(hourOptions);
  
  const minute = Math.floor(Math.random() * 60);
  targetDate.setHours(hour, minute, 0, 0);
  
  // Ensure the date is not in the future if it's "today"
  if (targetDate > now) {
      targetDate.setHours(now.getHours() - 1);
  }
  
  return targetDate;
};

// 🔧 Helper: Generate realistic wait time (EMA-style distribution)
const generateWaitTime = () => {
  // Most consultations 10-25 min, few outliers
  const rand = Math.random();
  if (rand < 0.7) return Math.floor(Math.random() * 15) + 10; // 70%: 10-25 min
  if (rand < 0.9) return Math.floor(Math.random() * 10) + 25; // 20%: 25-35 min
  return Math.floor(Math.random() * 10) + 35; // 10%: 35-45 min
};

// 🔧 Helper: Get facility type based on weighted distribution
const getFacilityType = () => {
  const weights = [
    { value: 'clinic', weight: 0.5 },    // 50% clinic
    { value: 'pathlab', weight: 0.25 },  // 25% pathlab
    { value: 'dental', weight: 0.15 },   // 15% dental
    { value: 'physio', weight: 0.1 }     // 10% physio
  ];
  return weightedRandom(weights);
};

// 🔧 Helper: Generate token prefix
const getTokenPrefix = (facilityType) => {
  const prefixes = { clinic: 'TKN', pathlab: 'SAM', dental: 'DNT', physio: 'PHY' };
  return prefixes[facilityType] || 'TKN';
};

// 🚀 Main Execution
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('🔌 Connected to MongoDB');
    
    // Get or create a facility
    let facility = await Facility.findOne({ facilityType: 'clinic' });
    if (!facility) {
      facility = await Facility.create({
        name: 'Apollo Healthcare',
        facilityType: 'clinic',
        isActive: true
      });
      console.log('✅ Created demo facility');
    }
    
    console.log(`🎯 Generating ${CONFIG.totalPatients} patients across ${CONFIG.dateRangeDays} days...`);
    console.log(`📊 Pattern: Weekdays=${CONFIG.weekdayWeight}x, PeakHours=${CONFIG.peakWeight}x`);
    
    const patients = [];
    const tokenCounters = {}; // Per facilityType counter
    
    for (let i = 0; i < CONFIG.totalPatients; i++) {
      const facilityType = getFacilityType();
      const completedAt = generateCompletionDate();
      const waitTime = generateWaitTime();
      const doctorName = CONFIG.doctors[Math.floor(Math.random() * CONFIG.doctors.length)];
      
      // Token number per facilityType
      if (!tokenCounters[facilityType]) tokenCounters[facilityType] = 100;
      const tokenNumber = ++tokenCounters[facilityType];
      const tokenPrefix = getTokenPrefix(facilityType);
      
      // Patient names pool
      const names = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Neha', 'Rohan', 'Pooja', 'Karan', 'Anjali'];
      const patientName = `${names[Math.floor(Math.random() * names.length)]} ${['Sharma', 'Verma', 'Patel', 'Singh', 'Kumar'][Math.floor(Math.random() * 5)]}`;
      
      // Custom data per facilityType
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
        createdAt: new Date(completedAt.getTime() - waitTime * 60000), // Entry time = completion - wait
        updatedAt: completedAt
      });
      
      if ((i + 1) % 50 === 0) {
        console.log(`⏳ Progress: ${i + 1}/${CONFIG.totalPatients} patients generated`);
      }
    }
    
    // Bulk insert for performance
    const result = await Queue.insertMany(patients, { ordered: false });
    
    // 📊 Summary Report
    console.log('\n🎉 SUCCESS! Data generation complete');
    console.log('═'.repeat(50));
    console.log(`✅ Total patients inserted: ${result.length}`);
    console.log(`📅 Date range: ${new Date(Date.now() - CONFIG.dateRangeDays*24*60*60*1000).toLocaleDateString()} → Today`);
    
    // Distribution stats
    const byType = {};
    const byDay = {};
    for (const p of patients) {
      byType[p.facilityType] = (byType[p.facilityType] || 0) + 1;
      const dayKey = p.completedAt.toISOString().split('T')[0];
      byDay[dayKey] = (byDay[dayKey] || 0) + 1;
    }
    
    console.log('\n🏥 By Facility Type:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   ${type.padEnd(10)}: ${count} patients`);
    });
    
    console.log('\n📈 Sample Daily Distribution (last 7 days):');
    const sortedDays = Object.entries(byDay).sort(([a], [b]) => b.localeCompare(a)).slice(0, 7);
    sortedDays.forEach(([day, count]) => {
      const bar = '█'.repeat(Math.min(count, 40));
      console.log(`   ${day}: ${bar} ${count}`);
    });
    
    console.log('\n👨⚕️ Doctors assigned:', CONFIG.doctors.join(', '));
    console.log(`⏱️ Wait times: ${CONFIG.waitTimeRange.min}-${CONFIG.waitTimeRange.max} minutes`);
    console.log('\n🔧 Next Steps:');
    console.log('   1. Browser me jaake Ctrl+Shift+R (Hard Refresh) karo');
    console.log('   2. Analytics page pe "30 Days" select karo');
    console.log('   3. Charts me proper trends dikhenge! 📊✨');
    console.log('═'.repeat(50));
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    console.error('💡 Tip: Check MONGO_URI in .env file');
    process.exit(1);
  });
