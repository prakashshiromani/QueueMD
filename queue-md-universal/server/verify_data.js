const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Queue = require('./models/Queue');
  const count = await Queue.countDocuments({ status: 'completed', completedAt: { $exists: true } });
  console.log('✅ Completed patients with completedAt:', count);
  
  // Also check facilityId
  const sample = await Queue.findOne({ status: 'completed', completedAt: { $exists: true } });
  if (sample) {
    console.log('Sample FacilityId:', sample.facilityId);
    console.log('Sample CompletedAt:', sample.completedAt);
  }
  
  process.exit(0);
}
run();
