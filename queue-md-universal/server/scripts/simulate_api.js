const mongoose = require('mongoose');
require('dotenv').config();

// Mimic getISTRange
const getISTRange = (range) => {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const now = new Date();
  const getStartOfISTDay = (date) => {
    const d = new Date(date.getTime() + istOffset);
    d.setUTCHours(0, 0, 0, 0);
    return new Date(d.getTime() - istOffset);
  };
  let start, end;
  if (range === '7d') {
    start = new Date(getStartOfISTDay(now).getTime() - 7 * 24 * 60 * 60 * 1000);
    end = now;
  } else {
    start = getStartOfISTDay(now);
    end = now;
  }
  return { start, end };
};

async function testApi() {
  await mongoose.connect(process.env.MONGO_URI);
  const Queue = require('./models/Queue');
  
  const facilityId = "69e4b0d5d831ce758a51eda8";
  const dates = getISTRange('7d');
  
  console.log('Testing 7D range:', dates);
  
  const trend = await Queue.aggregate([
    {
      $match: {
        facilityId: new mongoose.Types.ObjectId(facilityId),
        status: "completed",
        completedAt: { $gte: dates.start, $lte: dates.end }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt", timezone: "+05:30" } },
        count: { $sum: 1 }
      }
    }
  ]);
  
  console.log('API Simulation Result:', trend);
  process.exit(0);
}

testApi();
