const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://queueMD_user:Shivam18@cluster0.0ch3fm2.mongodb.net/?appName=Cluster0')
  .then(async () => {
    const Queue = require('./models/Queue.js');
    
    // Simulate what getStats does
    const facilityId = new mongoose.Types.ObjectId("672db9d2b2700ad688321d23"); // Hardcode a facility ID or find one
    
    // Let's just find the facility ID of the 'patil' record
    const patilRecord = await Queue.findOne({ doctorName: 'patil' });
    console.log('Patil Record Facility:', patilRecord.facilityId);
    console.log('Patil Record Status:', patilRecord.status);
    console.log('Patil Record CompletedAt:', patilRecord.completedAt);
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    console.log('Start of Day:', startOfDay);

    const searchTrimmed = 'patil';
    const completedQuery = {
      facilityId: patilRecord.facilityId,
      status: "completed",
      completedAt: { $gte: startOfDay }, // Today dateFilter
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
    console.log('CompletedQuery Count:', count);
    process.exit(0);
  })
  .catch(console.error);
