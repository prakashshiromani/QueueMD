const mongoose = require('mongoose');
require('dotenv').config();

async function checkDaily() {
  await mongoose.connect(process.env.MONGO_URI);
  const Queue = require('./models/Queue');
  
  const facilityId = "69e4b0d5d831ce758a51eda8";
  const now = new Date();
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const match = {
    facilityId: new mongoose.Types.ObjectId(facilityId),
    status: 'completed',
    completedAt: { $gte: start, $lte: now }
  };
  
  const count = await Queue.countDocuments(match);
  console.log('7D Completed Patients Count:', count);
  
  const trend = await Queue.aggregate([
    { $match: match },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt", timezone: "+05:30" } }, count: { $sum: 1 } } }
  ]);
  console.log('Daily Trend Result:', trend);
  
  process.exit(0);
}

checkDaily();
