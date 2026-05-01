const mongoose = require('mongoose');
const Notification = require('./models/Notification');
require('dotenv').config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const facilityId = new mongoose.Types.ObjectId();
    const patientId = new mongoose.Types.ObjectId();

    const newNotif = await Notification.create({
      facilityId,
      facilityType: "clinic",
      type: "system",
      title: "New Patient Registered",
      message: `Raju has been added to the directory.`,
      isRead: false,
      metadata: { patientId: patientId, patientName: "Raju" }
    });
    
    console.log("Success:", newNotif);
  } catch (e) {
    console.error("Error creating notification:", e.message);
  } finally {
    mongoose.disconnect();
  }
}
check();
