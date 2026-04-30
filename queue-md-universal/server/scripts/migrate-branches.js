require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Queue = require('../models/Queue');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('🔗 Connected to MongoDB for migration...');
  try {
    const result = await Queue.updateMany(
      { branchId: { $exists: false } },
      { $set: { branchId: null } }
    );
    console.log(`✅ Migrated ${result.modifiedCount} queue records, set branchId to null.`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit(0);
  }
}).catch(err => {
  console.error('❌ MongoDB Connection Error:', err);
  process.exit(1);
});
