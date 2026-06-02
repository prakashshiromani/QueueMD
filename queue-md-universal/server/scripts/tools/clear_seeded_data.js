// server/scripts/tools/clear_seeded_data.js
// 🗑️ Clean Up Only Seeded Dummy Data - QueueMD

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

const User = require('../../models/User');
const Queue = require('../../models/Queue');
const Patient = require('../../models/Patient');
const ClinicalVisit = require('../../models/ClinicalVisit');

async function clean() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔌 Connected to MongoDB');

    // 1. Delete mock doctor users (emails ending with @queuemd.test)
    const doctorsRes = await User.deleteMany({ email: /@queuemd\.test$/ });
    console.log(`🗑️ Cleared mock doctors (${doctorsRes.deletedCount} documents deleted).`);

    // 2. Delete mock patients (phones starting with 99999000)
    const patientsRes = await Patient.deleteMany({ phone: /^99999000/ });
    console.log(`🗑️ Cleared mock patients from directory (${patientsRes.deletedCount} documents deleted).`);

    // 3. Delete mock clinical visits (patientPhone starting with 99999000)
    const visitsRes = await ClinicalVisit.deleteMany({ patientPhone: /^99999000/ });
    console.log(`🗑️ Cleared mock clinical visits (${visitsRes.deletedCount} documents deleted).`);

    // 4. Delete mock queue entries (phone starting with 99999000 or 9876543)
    const queueRes = await Queue.deleteMany({ 
      $or: [
        { phone: /^99999000/ },
        { phone: /^9876543/ }
      ]
    });
    console.log(`🗑️ Cleared mock queue entries (${queueRes.deletedCount} documents deleted).`);

    console.log('\n==================================================');
    console.log('✅ SEEDED DUMMY DATA CLEANED UP SUCCESSFULLY!');
    console.log('==================================================');

  } catch (err) {
    console.error('❌ Clean up failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

clean();
