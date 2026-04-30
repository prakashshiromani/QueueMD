require('dotenv').config();
const mongoose = require('mongoose');
const Queue = require('../models/Queue');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const facility = await mongoose.connection.collection('facilities').findOne();
  
  // Add 10 completed patients with different dates
  for (let i = 0; i < 10; i++) {
    const daysAgo = Math.floor(Math.random() * 7);
    const completedAt = new Date();
    completedAt.setDate(completedAt.getDate() - daysAgo);
    completedAt.setHours(10 + Math.floor(Math.random() * 6), 0, 0, 0);
    
    await Queue.create({
      facilityId: facility._id,
      facilityType: facility.facilityType,
      patientName: `Test Patient ${i + 1}`,
      phone: `98765432${i}0`,
      tokenNumber: 100 + i,
      status: 'completed',
      doctorName: 'Dr. Sharma',
      completedAt: completedAt,
      actualDuration: Math.floor(Math.random() * 20) + 10
    });
  }
  
  console.log('✅ Added 10 test completed patients');
  process.exit(0);
});
