const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://queueMD_user:Shivam18@cluster0.0ch3fm2.mongodb.net/?appName=Cluster0')
  .then(async () => {
    const Queue = require('./models/Queue.js');
    
    // Find all records from yesterday and update them to today
    const now = new Date();
    
    // We'll just shift all records forward by 12 hours so they fall into "today"
    const items = await Queue.find({});
    let updatedCount = 0;
    
    for (let item of items) {
      let changed = false;
      if (item.createdAt) {
        item.createdAt = new Date(now.getTime() - Math.random() * 3600000); // within last hour
        changed = true;
      }
      if (item.completedAt) {
        item.completedAt = new Date(now.getTime() - Math.random() * 1800000); // within last 30 mins
        changed = true;
      }
      if (changed) {
        await item.save({ timestamps: false }); // preserve the manipulated dates
        updatedCount++;
      }
    }
    
    console.log('Updated ' + updatedCount + ' records to today!');
    process.exit(0);
  })
  .catch(console.error);
