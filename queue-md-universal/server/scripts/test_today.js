const mongoose = require('mongoose');
require('dotenv').config();

const getISTRange = (range) => {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const now = new Date();
  const getStartOfISTDay = (date) => {
    const d = new Date(date.getTime() + istOffset);
    d.setUTCHours(0, 0, 0, 0);
    return new Date(d.getTime() - istOffset);
  };
  let start, end;
  if (range === 'today') {
    start = getStartOfISTDay(now);
    end = now;
  } else {
    start = new Date(getStartOfISTDay(now).getTime() - 7 * 24 * 60 * 60 * 1000);
    end = now;
  }
  return { start, end };
};

async function testToday() {
  await mongoose.connect(process.env.MONGO_URI);
  const Queue = require('./models/Queue');
  const facilityId = "69e4b0d5d831ce758a51eda8";
  const dates = getISTRange('today');
  
  console.log('Testing TODAY range:', dates);
  
  const trend = await Queue.aggregate([
    {
      $match: {
        facilityId: new mongoose.Types.ObjectId(facilityId),
        status: "completed",
        completedAt: { $gte: dates.start, $lte: dates.end }
      }
    }
  ]);
  
  console.log('TODAY count:', trend.length);
  process.exit(0);
}
testToday();
