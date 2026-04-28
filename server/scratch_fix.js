const mongoose = require('mongoose');
const Queue = require('./models/Queue');
const Patient = require('./models/Patient');

const DB_URI = 'mongodb+srv://queueMD_user:Shivam18@cluster0.0ch3fm2.mongodb.net/?appName=Cluster0';

async function fixData() {
  await mongoose.connect(DB_URI);
  console.log('✅ Connected to Atlas...');

  // 1. Delete ALL active queue entries (fresh slate for testing)
  const del = await Queue.deleteMany({ status: { $in: ['waiting', 'in-progress'] } });
  console.log('🧹 Deleted active queue entries:', del.deletedCount);

  // 2. Show current patient facilityTypes
  const patients = await Patient.find({}, { name: 1, facilityType: 1, phone: 1 });
  console.log('\n📋 Current Patient Directory:');
  patients.forEach(p => console.log(`  ${p.name} -> facilityType: "${p.facilityType}"`));

  // 3. Fix patients with wrong facilityType
  // These were registered as dental but got corrupted to clinic
  const toFix = ['gk singh', 'raju singh'];
  for (const name of toFix) {
    const result = await Patient.updateOne(
      { name },
      { facilityType: 'dental' }
    );
    if (result.modifiedCount > 0) {
      console.log(`✅ Fixed "${name}" -> dental`);
    }
  }

  // 4. Fix physio patients (if any got corrupted)
  // Check if any were meant to be non-clinic
  const afterFix = await Patient.find({}, { name: 1, facilityType: 1 });
  console.log('\n📋 Patient Directory AFTER fix:');
  afterFix.forEach(p => console.log(`  ${p.name} -> "${p.facilityType}"`));

  process.exit(0);
}

fixData().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
