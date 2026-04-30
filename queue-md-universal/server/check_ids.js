const mongoose = require('mongoose');
require('dotenv').config();

async function checkUser() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = mongoose.connection.collection('users');
  const Facility = mongoose.connection.collection('facilities');
  
  const users = await User.find({}).toArray();
  console.log('Users:', users.map(u => ({ email: u.email, facilityId: u.facilityId })));
  
  const facilities = await Facility.find({}).toArray();
  console.log('Facilities:', facilities.map(f => ({ name: f.name, _id: f._id })));
  
  process.exit(0);
}

checkUser();
