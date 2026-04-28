const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://queueMD_user:Shivam18@cluster0.0ch3fm2.mongodb.net/?appName=Cluster0')
  .then(async () => {
    const Queue = require('./models/Queue.js');
    
    const patilRecord = await Queue.findOne({ doctorName: 'patil' });
    const startOfDay = new Date('2026-04-28T00:00:00+05:30'); // Force start of April 28

    const searchTrimmed = 'patil';
    const completedQuery = {
      facilityId: patilRecord.facilityId,
      status: "completed",
      completedAt: { $gte: startOfDay }, 
      $or: [
        { patientName: { $regex: searchTrimmed, $options: "i" } },
        { phone: { $regex: searchTrimmed, $options: "i" } },
        { doctorName: { $regex: searchTrimmed, $options: "i" } },
        { facilityType: { $regex: searchTrimmed, $options: "i" } },
        { 
          $expr: { 
            $regexMatch: { 
              input: { $dateToString: { format: "%d/%m/%Y", date: "$completedAt", timezone: "+05:30" } }, 
              regex: searchTrimmed, 
              options: "i" 
            } 
          } 
        }
      ]
    };

    const count = await Queue.countDocuments(completedQuery);
    console.log('Count on April 28:', count);
    process.exit(0);
  })
  .catch(console.error);
