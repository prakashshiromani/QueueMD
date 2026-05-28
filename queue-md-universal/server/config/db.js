const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // 🔒 SECURITY: Enforce Mongoose strictQuery to prevent arbitrary fields injection (Item 2)
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
