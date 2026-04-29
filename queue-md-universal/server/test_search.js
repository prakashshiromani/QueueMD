const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://queueMD_user:Shivam18@cluster0.0ch3fm2.mongodb.net/?appName=Cluster0')
  .then(async () => {
    const Queue = require('./models/Queue.js');
    
    const searchTrimmed = 'patil';
    const items = await Queue.find({
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
    });
    console.log('Found with search filter:', items.length);
    console.log(items.map(i => i.doctorName));
    process.exit(0);
  })
  .catch(console.error);
