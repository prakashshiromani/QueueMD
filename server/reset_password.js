const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function reset() {
  const email = 'yopime7529@pmdeal.com';
  const newRawPassword = '123456';

  console.log(`🔄 Resetting password for: ${email}`);
  
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newRawPassword, salt);
    
    // Update the user directly in the collection
    const result = await mongoose.connection.db.collection('users').updateOne(
      { email },
      { $set: { password: hashedPassword } }
    );
    
    if (result.modifiedCount > 0) {
      console.log("✅ Password updated successfully to: 123456");
    } else {
      console.log("❌ User not found or password already set to this.");
    }
    
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
}

reset();
