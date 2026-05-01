const mongoose = require('mongoose');
const Notification = require('./queue-md-universal/server/models/Notification');
require('dotenv').config({ path: './queue-md-universal/server/.env' });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");
  const notifs = await Notification.find().sort({createdAt:-1}).limit(5);
  console.log("Latest notifications:", notifs);
  mongoose.disconnect();
}
check();
