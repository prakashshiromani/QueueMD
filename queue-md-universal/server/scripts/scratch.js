const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const bcrypt = require('bcryptjs');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to database.");
    const email = 'admin.test5@apolloclinic.com';
    const rawPassword = 'SecurePass123!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);
    
    const result = await mongoose.connection.db.collection('users').updateOne(
      { email },
      { $set: { password: hashedPassword } }
    );
    if (result.modifiedCount > 0) {
      console.log(`✅ Password for ${email} successfully updated to: ${rawPassword}`);
    } else {
      console.log("❌ User not found or password already set to this.");
    }
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}
run();
