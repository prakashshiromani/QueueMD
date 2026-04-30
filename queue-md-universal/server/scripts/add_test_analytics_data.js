require('dotenv').config();
const mongoose = require('mongoose');
const Queue = require('../models/Queue');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('🔗 Connected for adding test data...');
  
  const facilityId = "69e4b0d5d831ce758a51eda8";
  const facilityType = "clinic";
  
  // Add 20 completed patients across last 48 hours
  const records = [];
  for (let i = 0; i < 20; i++) {
    const hoursAgo = Math.floor(Math.random() * 48);
    const date = new Date();
    date.setHours(date.getHours() - hoursAgo);
    
    // Arrival was 30-60 mins before completion
    const arrivalDate = new Date(date.getTime() - (Math.floor(Math.random() * 30) + 30) * 60000);

    records.push({
      facilityId: new mongoose.Types.ObjectId(facilityId),
      facilityType: facilityType,
      patientName: `Test Patient ${i + 1}`,
      phone: `98765432${i.toString().padStart(2, '0')}`,
      tokenNumber: 100 + i,
      status: 'completed',
      doctorName: i % 2 === 0 ? 'Dr. Sharma' : 'Dr. Verma',
      createdAt: arrivalDate,
      calledAt: new Date(arrivalDate.getTime() + 15 * 60000),
      completedAt: date,
      actualDuration: Math.floor(Math.random() * 20) + 15
    });
  }
  
  await Queue.insertMany(records);
  console.log(`✅ Added 20 test completed patients for Facility: ${facilityId} (${facilityType})`);
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
