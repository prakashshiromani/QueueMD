const mongoose = require('mongoose');
const Queue = require('../models/Queue');
const Patient = require('../models/Patient');

const DB_URI = 'mongodb+srv://queueMD_user:Shivam18@cluster0.0ch3fm2.mongodb.net/?appName=Cluster0';

async function cleanData() {
  await mongoose.connect(DB_URI);
  console.log('✅ Connected to MongoDB Atlas...');

  // 1. Delete patients created via old lab order flow (which sets lastVisitType = "LAB TEST")
  // and patients with names like 'sssssssjs' or 'testpatient'
  const patientDel = await Patient.deleteMany({
    $or: [
      { lastVisitType: 'LAB TEST' },
      { name: { $regex: 'sssssssjs', $options: 'i' } }
    ]
  });
  console.log('🧹 Deleted CRM patients from old Lab Order flows:', patientDel.deletedCount);

  // 2. We also want to delete any queue entries that were old pathlab orders and didn't have isLabOrder: true set
  // or specifically 'sssssssjs' queue entries
  const queueDel = await Queue.deleteMany({
    $or: [
      { patientName: { $regex: 'sssssssjs', $options: 'i' } }
    ]
  });
  console.log('🧹 Deleted queue entries for sssssssjs:', queueDel.deletedCount);

  // 3. Update any pathlab Queue entries that are indeed lab orders but don't have isLabOrder: true
  const queueUpdate = await Queue.updateMany(
    { facilityType: 'pathlab', isLabOrder: { $ne: true } },
    { $set: { isLabOrder: true } }
  );
  console.log('🔄 Updated existing pathlab queue entries to isLabOrder: true:', queueUpdate.modifiedCount);

  process.exit(0);
}

cleanData().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
