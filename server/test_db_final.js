const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Try both possible locations
dotenv.config({ path: path.join(__dirname, '.env') });
if (!process.env.MONGO_URI) {
    dotenv.config({ path: path.join(__dirname, 'server', '.env') });
}

const testConnection = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        throw new Error('MONGO_URI is not defined in .env');
    }
    console.log('Connecting to:', uri.substring(0, 20) + '...');
    await mongoose.connect(uri);
    console.log('✅ Connection Successful');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection Failed:', err.message);
    process.exit(1);
  }
};

testConnection();
