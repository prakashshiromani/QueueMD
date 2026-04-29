const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://queueMD_user:Shivam18@cluster0.0ch3fm2.mongodb.net/?appName=Cluster0')
  .then(async () => {
    const Queue = require('./models/Queue.js');
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const searchTrimmed = 'patil';
    const completedQuery = {
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
    console.log('Query:', JSON.stringify(completedQuery, null, 2));
    console.log('Count right now:', count);
    
    // Check total today
    const totalToday = await Queue.countDocuments({
      createdAt: { $gte: startOfDay }
    });
    console.log('Total visits today right now:', totalToday);

    process.exit(0);
  })
  .catch(console.error);
