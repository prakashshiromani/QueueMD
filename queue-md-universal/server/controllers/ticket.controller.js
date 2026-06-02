const Ticket = require("../models/Ticket");
const User = require("../models/User");
const Facility = require("../models/Facility");
const notificationQueue = require("../jobs/notification.queue");
const logger = require("../utils/logger");

// ✅ CREATE Ticket + Auto First Response
exports.createTicket = async (req, res, next) => {
  try {
    const { subject, description, category, priority } = req.body;
    const { id: userId, facilityId } = req.user;

    const userDoc = await User.findById(userId);
    const userName = userDoc ? userDoc.name : "User";

    const facility = await Facility.findById(facilityId);
    const isPro = facility ? (facility.subscriptionPlan === "pro" && facility.subscriptionStatus === "active") : false;

    let finalPriority = priority || "medium";
    if (isPro && ["medium", "low"].includes(finalPriority)) {
      finalPriority = "high";
    }

    const slaHours = isPro ? 2 : 24;
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    const ticket = await Ticket.create({
      facilityId,
      userId,
      subject,
      description,
      category: category || "technical",
      priority: finalPriority,
      isProTicket: isPro,
      slaDeadline,
      comments: [{
        userId: null,
        userName: "Support Bot",
        role: "system",
        message: `👋 Hi ${userName}! Aapka ticket #${subject.slice(0, 10)}... receive ho gaya hai. ${
          isPro 
            ? "Aap premium Pro customer hain, isliye aapka ticket 2 hours ke SLA under resolve kiya jayega." 
            : "Hum 24 hours ke standard SLA under respond karenge."
        }`,
        createdAt: new Date()
      }]
    });

    // BullMQ SLA Reminder Job: 30 minutes before SLA deadline
    try {
      const delayMs = Math.max(0, (slaHours * 60 * 60 * 1000) - (30 * 60 * 1000));
      await notificationQueue.add(
        'sla-reminder',
        { ticketId: ticket._id, facilityId, type: 'sla-warning' },
        { delay: delayMs }
      );
      logger.info(`⏰ SLA reminder job queued for Ticket ${ticket._id} in ${delayMs / 60000} minutes`);
    } catch (queueErr) {
      logger.error(`Failed to queue SLA reminder job: ${queueErr.message}`);
    }

    logger.info(`🎫 Ticket Created: ${ticket._id} by ${userName} (isPro: ${isPro}, priority: ${finalPriority})`);
    res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
};

// ✅ GET All Tickets (Facility-wise)
exports.getTickets = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const { status, priority, limit = 20 } = req.query;
    
    const query = { facilityId };
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tickets = await Ticket.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .select("-comments.userId"); // Hide internal userId from frontend

    res.json({ success: true, count: tickets.length, tickets });
  } catch (err) {
    next(err);
  }
};

// ✅ GET Single Ticket + Security Check
exports.getTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { facilityId } = req.user;

    const ticket = await Ticket.findOne({ _id: id, facilityId })
      .populate("userId", "name email");
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    res.json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
};

// ✅ ADD Comment + Mock Support Reply
exports.addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const { id: userId, facilityId, role } = req.user;

    const ticket = await Ticket.findOne({ _id: id, facilityId });
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    const userDoc = await User.findById(userId);
    const userName = userDoc ? userDoc.name : "User";

    // Add user comment
    ticket.comments.push({ userId, userName, role, message });

    // 🤖 Mock Support Reply (after 2s delay simulation)
    setTimeout(async () => {
      try {
        const replies = [
          "🔍 Hum aapki issue check kar rahe hain...",
          "💡 Quick Tip: Razorpay upgrade ke liye /api/payment/create-order use karein",
          "📱 SMS alerts ke liye Phase 4 me Twilio configure karna hoga",
          "🔄 Queue position rule: tokenNumber sort({tokenNumber:1}) se handle hota hai"
        ];
        const mockReply = replies[Math.floor(Math.random() * replies.length)];
        
        // Fetch fresh doc to avoid version conflict error
        const freshTicket = await Ticket.findById(id);
        if (freshTicket) {
          freshTicket.comments.push({
            userId: null,
            userName: "Support Agent",
            role: "support",
            message: mockReply,
            createdAt: new Date()
          });
          await freshTicket.save();
          logger.info(`🤖 Mock reply added to ticket ${id}`);
        }
      } catch (err) {
        logger.error(`Error in mock support reply setTimeout: ${err.message}`);
      }
    }, 2000);

    await ticket.save();
    res.json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
};

// ✅ UPDATE Status (Resolve/Close)
exports.updateTicketStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { facilityId } = req.user;

    const ticket = await Ticket.findOneAndUpdate(
      { _id: id, facilityId },
      { status },
      { new: true, runValidators: true }
    );

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    res.json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
};

// ✅ GET Pro Tickets (Admin support dashboard)
exports.getProTickets = async (req, res, next) => {
  try {
    const proTickets = await Ticket.find({ isProTicket: true, status: { $ne: 'closed' } })
      .sort({ priority: 1, slaDeadline: 1 })
      .populate('facilityId', 'name contact');
    res.json({ success: true, tickets: proTickets });
  } catch (err) {
    next(err);
  }
};
