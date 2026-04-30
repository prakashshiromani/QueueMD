require('dotenv').config();
const mongoose = require('mongoose');
const Queue = require('./models/Queue');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const facilityId = '69e4b0d5d831ce758a51eda8';
  
  // Calculate 30 days ago
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const startOfTodayIST = new Date(now.getTime() + istOffset);
  startOfTodayIST.setUTCHours(0, 0, 0, 0);
  const start = new Date(startOfTodayIST.getTime() - istOffset - 30 * 24 * 60 * 60 * 1000);
  const end = now;

  console.log('📅 Testing Range:', { start, end });

  const matchQuery = {
    facilityId: new mongoose.Types.ObjectId(facilityId),
    status: 'completed',
    completedAt: { $gte: start, $lte: end }
  };

  const trend = await Queue.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt", timezone: "+05:30" } },
        count: { $sum: 1 }
      }
    }
  ]);

  console.log('📊 Trend Result:', trend);
  process.exit(0);
}

test();
