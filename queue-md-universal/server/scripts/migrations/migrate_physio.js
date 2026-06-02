// server/scripts/migrate_physio.js
require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Queue = require('../models/Queue');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('🔌 Connected to MongoDB');
    
    const result = await Queue.updateMany(
      { facilityType: 'physiotherapy' },
      { $set: { facilityType: 'physio' } }
    );
    
    console.log(`✅ Migration complete. Updated ${result.modifiedCount} records.`);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
