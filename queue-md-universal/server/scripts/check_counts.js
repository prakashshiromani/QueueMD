require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Queue = require('../models/Queue');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const total = await Queue.countDocuments({ status: 'completed' });
    
    // IST Today Start
    const now = new Date();
    const todayStart = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    todayStart.setUTCHours(0,0,0,0);
    const todayStartIST = new Date(todayStart.getTime() - 5.5 * 60 * 60 * 1000);

    const today = await Queue.countDocuments({ 
      status: 'completed',
      completedAt: { $gte: todayStartIST }
    });
    
    console.log('✅ Total Completed Patients:', total);
    console.log('✅ Today (IST):', today);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
