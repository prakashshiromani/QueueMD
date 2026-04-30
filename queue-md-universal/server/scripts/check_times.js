require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Queue = require('../models/Queue');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    
    const getStartOfISTDay = (date) => {
      const d = new Date(date.getTime() + istOffset);
      d.setUTCHours(0, 0, 0, 0);
      return new Date(d.getTime() - istOffset);
    };

    const start = getStartOfISTDay(now);
    const end = now;

    const patients = await Queue.find({
      status: 'completed',
      completedAt: { $gte: start, $lte: end }
    }).select('completedAt patientName');
    
    console.log(`✅ Found ${patients.length} patients between ${start.toISOString()} and ${end.toISOString()}`);
    console.log(JSON.stringify(patients, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
