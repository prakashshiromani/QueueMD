const mongoose = require('mongoose');
const Queue = require('./models/Queue');
const Patient = require('./models/Patient');
const Facility = require('./models/Facility');
const User = require('./models/User');

const DB_URI = 'mongodb+srv://queueMD_user:Shivam18@cluster0.0ch3fm2.mongodb.net/?appName=Cluster0';

async function cleanup() {
  try {
    await mongoose.connect(DB_URI);
    console.log('🚀 Connected to MongoDB for cleanup');

    const corruptNames = ["gk singh", "mayank", "mohan", "soni", "mani"];

    // 1. Delete corrupted entries from Queue
    console.log('🧹 Deleting corrupted queue entries...');
    const deleteResult = await Queue.deleteMany({
      patientName: { $in: corruptNames }
    });
    console.log(`✅ Deleted ${deleteResult.deletedCount} corrupted queue entries.`);

    // 2. Fix facilityType in Patient directory if needed
    // Assuming "gk singh" should be dental
    console.log('🛠 Fixing "gk singh" patient record...');
    await Patient.updateOne(
      { name: "gk singh" },
      { facilityType: "dental" }
    );
    console.log('✅ Patient record corrected.');

    // 3. Log current state for verification
    console.log('\n📊 Current Facilities:');
    const facilities = await Facility.find({}, { name: 1, facilityType: 1 });
    console.table(facilities.map(f => ({ name: f.name, type: f.facilityType })));

    console.log('\n👤 User Configuration:');
    const users = await User.find({}, { name: 1, facilityId: 1, facilityType: 1 });
    console.table(users.map(u => ({ name: u.name, facility: u.facilityId, type: u.facilityType })));

    console.log('\n✅ Cleanup Finished!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Cleanup failed:', err);
    process.exit(1);
  }
}

cleanup();
