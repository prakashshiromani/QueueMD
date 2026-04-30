require('dotenv').config();
const mongoose = require('mongoose');
const Queue = require('./models/Queue');

const facilityId = '69e4b0d5d831ce758a51eda8';

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

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const dates = getISTRange('today');
  console.log('📅 Range Today:', dates);

  const matchQuery = {
    facilityId: new mongoose.Types.ObjectId(facilityId),
    status: 'completed',
    completedAt: { $gte: dates.start, $lte: dates.end }
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

  console.log('📊 Result:', trend);
  process.exit(0);
});
