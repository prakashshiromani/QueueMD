const mongoose = require('mongoose');
const Patient = require('./models/Patient');

const DB_URI = 'mongodb+srv://queueMD_user:Shivam18@cluster0.0ch3fm2.mongodb.net/?appName=Cluster0';

async function cleanup() {
  await mongoose.connect(DB_URI);
  console.log('✅ Connected...\n');

  // Delete all 'golu' and 'fish' test patients (corrupted data)
  const del = await Patient.deleteMany({ name: { $in: ['golu', 'fish'] } });
  console.log(`🧹 Deleted ${del.deletedCount} test patient(s).`);

  // Verify remaining patients
  const remaining = await Patient.find({}, { name: 1, facilityType: 1 })
    .sort({ createdAt: -1 });
  console.log('\n📋 Remaining patients:');
  remaining.forEach(p => console.log(`  "${p.name}" -> "${p.facilityType}"`));

  process.exit(0);
}

cleanup().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
