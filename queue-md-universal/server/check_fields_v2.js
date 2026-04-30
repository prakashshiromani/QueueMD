const mongoose = require('mongoose');
require('dotenv').config();

async function checkFields() {
  await mongoose.connect(process.env.MONGO_URI);
  const Queue = require('./models/Queue');
  
  const sample = await Queue.findOne({ status: 'completed' });
  if (sample) {
    console.log('Sample Completed Record:', JSON.stringify({
      id: sample._id,
      status: sample.status,
      createdAt: sample.createdAt,
      completedAt: sample.completedAt
    }, null, 2));
  } else {
    console.log('No completed records found.');
  }
  process.exit(0);
}

checkFields();
