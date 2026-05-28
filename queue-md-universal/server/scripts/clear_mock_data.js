// server/scripts/clear_mock_data.js
// 🗑️ Clean Up Seeder Data & Reset Counters - QueueMD v3.4

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Queue = require('../models/Queue');
const User = require('../models/User');
const Counter = require('../models/Counter');
const Analytics = require('../models/Analytics');

async function clean() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔌 Connected to MongoDB');

    // 1. Delete all Queue logs
    const queueRes = await Queue.deleteMany({});
    console.log(`🗑️ Cleared all Queue entries (${queueRes.deletedCount} documents deleted).`);

    // 2. Delete all daily Analytics summaries
    const analyticsRes = await Analytics.deleteMany({});
    console.log(`🗑️ Cleared all Analytics summaries (${analyticsRes.deletedCount} documents deleted).`);

    // 3. Delete all mock doctor users (emails ending with @queuemd.test)
    const usersRes = await User.deleteMany({ email: /@queuemd\.test$/ });
    console.log(`🗑️ Cleared all mock doctor users (${usersRes.deletedCount} documents deleted).`);

    // 4. Reset all token counters
    const counterRes = await Counter.deleteMany({});
    console.log(`🗑️ Reset all token sequence counters (${counterRes.deletedCount} documents deleted).`);

    console.log('\n==================================================');
    console.log('✅ DATABASE SUCCESSFULLY RESET TO CLEAN STATE!');
    console.log('==================================================');

  } catch (err) {
    console.error('❌ Reset failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

clean();
