require('dotenv').config();
const mongoose = require('mongoose');
const Queue = require('../models/Queue');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('🔌 Connected to MongoDB');
  
  const facilityId = "69e4b0d5d831ce758a51eda8";
  const facilityType = "clinic";
  
  const now = new Date();
  const records = [];

  // Create 50 completed patients across last 7 days
  for (let i = 0; i < 50; i++) {
    const hoursAgo = Math.floor(Math.random() * 168); // Last 7 days
    const completedAt = new Date(now);
    completedAt.setHours(completedAt.getHours() - hoursAgo);
    
    // Arrival was 1-2 hours before completion
    const createdAt = new Date(completedAt.getTime() - (Math.floor(Math.random() * 60) + 60) * 60000);

    records.push({
      facilityId: new mongoose.Types.ObjectId(facilityId),
      facilityType: facilityType,
      patientName: `Test Patient ${i + 1}`,
      phone: `98765432${i.toString().padStart(2, '0')}`,
      tokenNumber: 200 + i,
      status: 'completed',
      doctorName: i % 4 === 0 ? 'Dr. Sharma' : i % 4 === 1 ? 'Dr. Verma' : i % 4 === 2 ? 'Dr. Gupta' : 'Dr. Reddy',
      createdAt: createdAt,
      calledAt: new Date(createdAt.getTime() + 15 * 60000),
      completedAt: completedAt,
      actualDuration: Math.floor(Math.random() * 20) + 15
    });
  }
  
  await Queue.insertMany(records);
  console.log(`✅ Added 50 test completed patients for Facility: ${facilityId}`);
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
