require('dotenv').config();
const mongoose = require('mongoose');
const Queue = require('../models/Queue');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  // Update all completed patients to 'Today'
  const result = await Queue.updateMany(
    { status: 'completed' },
    { $set: { completedAt: new Date() } }
  );
  console.log(`✅ Updated ${result.modifiedCount} patients to Today's date`);
  process.exit(0);
});
