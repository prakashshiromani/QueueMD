require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Queue = require('../models/Queue');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const dates = await Queue.aggregate([
      { $match: { status: 'completed' } },
      { $group: { 
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt', timezone: '+05:30' } }, 
          count: { $sum: 1 } 
      } },
      { $sort: { _id: -1 } }
    ]);
    console.log('📅 Completion Dates Distribution:', JSON.stringify(dates, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
