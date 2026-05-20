const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://queueMD_user:Shivam18@cluster0.0ch3fm2.mongodb.net/?appName=Cluster0')
  .then(async () => {
    const Queue = require('./models/Queue.js');
    const nullDates = await Queue.countDocuments({ completedAt: null });
    console.log('Records with null completedAt:', nullDates);
    
    // Let's try the query again to see if it throws an error internally
    try {
      const searchTrimmed = 'patil';
      await Queue.find({
        $expr: { 
          $regexMatch: { 
            input: { $dateToString: { format: "%d/%m/%Y", date: "$completedAt", timezone: "+05:30" } }, 
            regex: searchTrimmed, 
            options: "i" 
          } 
        } 
      });
      console.log('Query succeeded');
    } catch(err) {
      console.log('Query failed:', err.message);
    }
    
    process.exit(0);
  })
  .catch(console.error);
