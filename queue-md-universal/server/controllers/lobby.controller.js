const Queue = require('../models/Queue');
const { getPhoneRegex } = require('../utils/phoneHelper');

exports.getLiveLobbyStatus = async (req, res, next) => {
    try {
        const { facilityId } = req.params;
        const { phone, tokenNumber } = req.body;

        if (!phone || !tokenNumber) {
            return res.status(400).json({ success: false, message: "Phone and Token Number are required" });
        }

        // 🕒 Aaj ki subah 00:00:00 ka time nikalo
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const phoneRegex = getPhoneRegex(phone, true);

        // 1. Patient ka aaj ka visit dhundo
        const myVisit = await Queue.findOne({
            facilityId,
            phone: phoneRegex || phone,
            tokenNumber: Number(tokenNumber),
            createdAt: { $gte: startOfDay }
        }).lean();

        if (!myVisit) {
            return res.status(404).json({ success: false, message: "No active visit found for today." });
        }

        // 2. Aaj ki total waiting list nikalo (People Ahead calculate karne ke liye)
        const todaysWaitingList = await Queue.find({
            facilityId,
            status: 'waiting',
            createdAt: { $gte: startOfDay }
        }).sort({ createdAt: 1 }).lean();

        // 3. Patient ka position nikalo
        const myPosition = todaysWaitingList.findIndex(p => p._id.toString() === myVisit._id.toString());
        const peopleAhead = myPosition !== -1 ? myPosition : 0;

        // 4. Currently Serving Token (Aaj ka)
        const currentlyServing = await Queue.findOne({
            facilityId,
            status: { $in: ['in-progress', 'in-room'] },
            createdAt: { $gte: startOfDay }
        }).select('tokenNumber');

        res.status(200).json({
            success: true,
            data: {
                myToken: myVisit.tokenNumber,
                myStatus: myVisit.status,
                peopleAhead: peopleAhead,
                currentlyServing: currentlyServing?.tokenNumber || "None",
                estimatedWait: peopleAhead * 7 // Avg 7 mins
            }
        });
    } catch (error) {
        next(error);
    }
};
