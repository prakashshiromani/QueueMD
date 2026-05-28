const mongoose = require('mongoose');

const uri = "mongodb+srv://queueMD_user:Shivam18@cluster0.0ch3fm2.mongodb.net/?appName=Cluster0";

async function run() {
  try {
    await mongoose.connect(uri);
    console.log("Connected successfully");
    const Queue = mongoose.model('Queue', new mongoose.Schema({}, { strict: false }), 'queues');
    const completed = await Queue.find({ status: 'completed' }).sort({ completedAt: -1 }).limit(10);
    console.log("Completed entries:");
    for (const doc of completed) {
      console.log(`ID: ${doc._id}, patientName: ${doc.get('patientName')}, tokenNumber: ${doc.get('tokenNumber')}, completedAt: ${doc.get('completedAt')}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
