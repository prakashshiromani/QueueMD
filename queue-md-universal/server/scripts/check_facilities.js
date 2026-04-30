require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Queue = require('../models/Queue');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const facilities = await Queue.aggregate([
      { $group: { _id: '$facilityId', count: { $sum: 1 } } }
    ]);
    console.log('📊 Facility ID Counts:', JSON.stringify(facilities, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
