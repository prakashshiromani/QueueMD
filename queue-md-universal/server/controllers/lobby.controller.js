const Queue = require('../models/Queue');
const { getPhoneRegex } = require('../utils/phoneHelper');

exports.getLiveLobbyStatus = async (req, res, next) => {
    try {
        const { facilityId } = req.params;
        const { phone, tokenNumber } = req.body;

        if (!phone || !tokenNumber) {
            return res.status(400).json({ success: false, message: "Phone and Token Number are required" });
        }

        const phoneRegex = getPhoneRegex(phone, true);

        // 1. Patient ka visit dhundo - facilityId + phone + tokenNumber se match karo
        // Date restriction hataya gaya - midnight ke baad bhi kaam kare
        const myVisit = await Queue.findOne({
            facilityId,
            phone: phoneRegex || phone,
            tokenNumber: Number(tokenNumber),
            status: { $in: ['waiting', 'in-progress', 'in-room', 'completed'] }
        }).sort({ createdAt: -1 }).lean();

        if (!myVisit) {
            return res.status(404).json({ success: false, message: "Token not found. Check your phone number and token number." });
        }

        // 2. Aaj ki waiting list (People Ahead calculate karne ke liye)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const todaysWaitingList = await Queue.find({
            facilityId,
            facilityType: myVisit.facilityType,
            status: 'waiting',
            createdAt: { $gte: startOfDay }
        }).sort({ createdAt: 1 }).lean();

        // 3. Patient ka position nikalo
        const myPosition = todaysWaitingList.findIndex(p => p._id.toString() === myVisit._id.toString());
        const peopleAhead = myPosition !== -1 ? myPosition : 0;

        // 4. Currently Serving Token
        const currentlyServing = await Queue.findOne({
            facilityId,
            facilityType: myVisit.facilityType,
            status: { $in: ['in-progress', 'in-room'] }
        }).sort({ updatedAt: -1 }).select('tokenNumber').lean();

        res.status(200).json({
            success: true,
            data: {
                myToken: myVisit.tokenNumber,
                myStatus: myVisit.status,
                peopleAhead: ['in-progress', 'in-room', 'completed'].includes(myVisit.status) ? 0 : peopleAhead,
                currentlyServing: currentlyServing?.tokenNumber || "None",
                estimatedWait: peopleAhead * 7 // Avg 7 mins
            }
        });
    } catch (error) {
        next(error);
    }
};
