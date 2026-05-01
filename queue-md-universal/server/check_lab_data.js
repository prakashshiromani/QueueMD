require('dotenv').config();
const mongoose = require('mongoose');
const Queue = require('./models/Queue');
const connectDB = require('./config/db');

const test = async () => {
  await connectDB();
  const reports = await Queue.find({ facilityType: 'pathlab' }).limit(5);
  console.log('REPORTS:', JSON.stringify(reports, null, 2));
  process.exit(0);
};

test();
