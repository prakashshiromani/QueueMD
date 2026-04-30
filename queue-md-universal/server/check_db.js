const mongoose = require('mongoose');
require('dotenv').config({ path: 'server/.env' });

async function checkData() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const total = await mongoose.connection.collection('queues').countDocuments();
  console.log('Total Queue Records:', total);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayCount = await mongoose.connection.collection('queues').countDocuments({
    createdAt: { $gte: today }
  });
  console.log('Today Records:', todayCount);

  const distinctTypes = await mongoose.connection.collection('queues').distinct('facilityType');
  console.log('Distinct Facility Types:', distinctTypes);

  const sample = await mongoose.connection.collection('queues').findOne();
  console.log('Sample Record:', JSON.stringify(sample, null, 2));

  process.exit(0);
}

checkData();
