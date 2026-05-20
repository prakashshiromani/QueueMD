const Invoice = require("../models/Invoice");
const { z } = require("zod");
const logger = require("../utils/logger"); // Tumhare utils se logger aayega
const mongoose = require("mongoose");
const { getIO } = require("../sockets/index");
const Counter = require("../models/Counter");

async function getNextSequence(id) {
  const counter = await Counter.findByIdAndUpdate(
    id,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

// ✅ Validation Schema (Zod)
const invoiceSchema = z.object({
  patientName: z.string().min(2, "Patient name is required"),
  phone: z.string().optional(),
  amount: z.number().positive("Amount must be positive"),
  status: z.enum(["Paid", "Pending", "Overdue"]).optional().default("Pending"),
  description: z.string().optional()
});

// 1️⃣ CREATE INVOICE (Naya Bill Banana)
exports.createInvoice = async (req, res, next) => {
  try {
    logger.info(`Creating Invoice - User: ${JSON.stringify(req.user)}`);
    // 🔒 Security: User se Facility ID lena (Token se)
    const { facilityId, facilityType } = req.user;
    
    // ✅ Input Validation
    const validation = invoiceSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, errors: validation.error.errors });
    }

    const { patientName, phone, amount, status, description } = validation.data;

    // 🔢 Auto Invoice Number Generator (Format: INV-XXXX) - Atomic & thread-safe
    let counter = await Counter.findById(`invoice:${facilityId}`);
    if (!counter) {
      const lastInvoice = await Invoice.findOne({ facilityId })
        .sort({ invoiceNumber: -1 })
        .select("invoiceNumber");
      
      let startNum = 1999; // So that first auto increment gives 2000
      if (lastInvoice) {
        // "INV-2041" -> 2041
        const lastNum = parseInt(lastInvoice.invoiceNumber.split("-")[1]);
        if (!isNaN(lastNum)) {
          startNum = lastNum;
        }
      }
      try {
        await Counter.create({ _id: `invoice:${facilityId}`, seq: startNum });
      } catch (err) {
        // Ignore duplicate key error
      }
    }

    const seq = await getNextSequence(`invoice:${facilityId}`);

    const newInvoice = await Invoice.create({
      invoiceNumber: `INV-${seq}`,
      facilityId,
      facilityType,
      patientName,
      phone,
      amount,
      status,
      description
    });

    logger.info(`Invoice Created: ${newInvoice.invoiceNumber} for ${facilityType}`);

    // 🔥 Emit Socket Event
    getIO().to(`${facilityId}_${facilityType}`).emit("billing_update", { 
      type: "NEW_INVOICE", 
      invoice: newInvoice 
    });

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: newInvoice
    });

  } catch (error) {
    next(error);
  }
};

// 2️ GET INVOICES (List + Pagination)
exports.getInvoices = async (req, res, next) => {
  try {
    logger.info(`Fetching Invoices - User: ${JSON.stringify(req.user)} Query: ${JSON.stringify(req.query)}`);
    const { facilityId, facilityType } = req.user;
    const { page = 1, limit = 10, status } = req.query;

    const query = { facilityId, facilityType };
    if (status) query.status = status;

    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 }) // Latest pehle
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Invoice.countDocuments(query);

    res.json({
      success: true,
      count: invoices.length,
      total,
      totalPages: Math.ceil(total / limit),
      data: invoices
    });
  } catch (error) {
    next(error);
  }
};

// 3️ GET STATS (Dashboard Cards ke liye)
exports.getStats = async (req, res, next) => {
  try {
    logger.info(`Fetching Billing Stats - User: ${JSON.stringify(req.user)}`);
    const { facilityId } = req.user;

    if (!facilityId) {
      logger.error("No facilityId in req.user");
      return res.status(400).json({ success: false, message: "Facility ID is required" });
    }
    
    //  Aggregation Pipeline (Database level pe calculate karo - Faster)
    const stats = await Invoice.aggregate([
      { $match: { facilityId: new mongoose.Types.ObjectId(facilityId) } },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $cond: [{ $eq: ["$status", "Paid"] }, "$amount", 0] }
          },
          pendingPayments: {
            $sum: { $cond: [{ $eq: ["$status", "Pending"] }, "$amount", 0] }
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] }
          },
          // Paid Today Logic (Aaj ki date compare karna)
          paidToday: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "Paid"] },
                    {
                      $eq: [
                        { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        { $dateToString: { format: "%Y-%m-%d", date: new Date() } }
                      ]
                    }
                  ]
                },
                "$amount",
                0
              ]
            }
          },
          paidTodayCount: {
             $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "Paid"] },
                    {
                      $eq: [
                        { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        { $dateToString: { format: "%Y-%m-%d", date: new Date() } }
                      ]
                    }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Default values agar data na ho
    const result = stats[0] || { totalRevenue: 0, pendingPayments: 0, paidToday: 0, pendingCount: 0, paidTodayCount: 0 };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    next(error);
  }
};

// 4️⃣ UPDATE INVOICE STATUS
exports.updateInvoiceStatus = async (req, res, next) => {
  try {
    const { facilityId, facilityType } = req.user;
    const { invoiceId } = req.params;
    const { status } = req.body;

    if (!["Paid", "Pending", "Overdue"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const updatedInvoice = await Invoice.findOneAndUpdate(
      { _id: invoiceId, facilityId },
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedInvoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    logger.info(`Invoice ${updatedInvoice.invoiceNumber} status updated to ${status}`);

    // 🔥 Emit Socket Event
    getIO().to(`${facilityId}_${facilityType}`).emit("billing_update", { 
      type: "STATUS_UPDATE", 
      invoice: updatedInvoice 
    });

    res.json({
      success: true,
      message: `Invoice marked as ${status}`,
      data: updatedInvoice
    });

  } catch (error) {
    next(error);
  }
};
