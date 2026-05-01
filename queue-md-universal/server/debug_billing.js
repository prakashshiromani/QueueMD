const mongoose = require("mongoose");
require("dotenv").config();
const Invoice = require("./models/Invoice");

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");
  
  const count = await Invoice.countDocuments();
  console.log("Total Invoices:", count);
  
  const invoices = await Invoice.find().limit(5);
  console.log("Sample Invoices:", invoices);
  
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
