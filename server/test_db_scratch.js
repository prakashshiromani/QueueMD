const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const testConnection = async () => {
  try {
    console.log('Connecting to:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connection Successful');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection Failed:', err.message);
    process.exit(1);
  }
};

testConnection();
