const mongoose = require('mongoose');
const Queue = require('./models/Queue');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const total = await Queue.countDocuments();
  const withBranch = await Queue.countDocuments({ branchId: { $ne: null } });
  console.log(`Total: ${total}, With Branch: ${withBranch}`);
  process.exit(0);
}

check();
