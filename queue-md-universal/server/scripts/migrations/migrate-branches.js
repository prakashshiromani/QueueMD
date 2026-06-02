require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Queue = require('../models/Queue');
const Appointment = require('../models/Appointment'); // 📍 Import Appointment model

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('🔗 Connected to MongoDB for migration...');
  try {
    const queueResult = await Queue.updateMany(
      { branchId: { $exists: false } },
      { $set: { branchId: null } }
    );
    console.log(`✅ Migrated ${queueResult.modifiedCount} queue records, set branchId to null.`);

    const apptResult = await Appointment.updateMany(
      { branchId: { $exists: false } },
      { $set: { branchId: null } }
    );
    console.log(`✅ Migrated ${apptResult.modifiedCount} appointment records, set branchId to null.`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit(0);
  }
}).catch(err => {
  console.error('❌ MongoDB Connection Error:', err);
  process.exit(1);
});
