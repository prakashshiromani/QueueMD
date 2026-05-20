const Razorpay = require("razorpay");
const crypto = require("crypto");
const Facility = require("../models/Facility");
const Subscription = require("../models/Subscription");
const logger = require("../utils/logger");

// Razorpay instance (ENV se)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "secret_placeholder"
});

// PRICING CONFIG (Yahan change karna agar pricing update karni ho)
const PRICING = {
  pro: {
    monthly: { amount: 49900, label: "₹499/month" },   // paise mein
    yearly: { amount: 499900, label: "₹4,999/year" }     // ₹989 saved
  }
};

// Helper function to detect Mock Mode
const isMockMode = () => {
  const key = process.env.RAZORPAY_KEY_ID || '';
  return !key || key.includes('your_key') || key.includes('placeholder') || key === 'rzp_test_XXXXXXXX';
};

// CREATE ORDER
exports.createOrder = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const { plan = "pro", duration = "monthly" } = req.body;

    const pricing = PRICING[plan]?.[duration];
    if (!pricing) {
      return res.status(400).json({ success: false, message: "Invalid plan" });
    }

    // 🧪 MOCK MODE CHECK
    if (isMockMode()) {
      logger.info(`🧪 Mock Mode: Creating sandbox order for facility ${facilityId}`);
      
      const mockOrderId = `mock_order_${facilityId}_${Date.now()}`;
      
      // DB mein save (tracking ke liye)
      await Subscription.create({
        facilityId,
        razorpayOrderId: mockOrderId,
        plan,
        duration,
        amount: pricing.amount,
        status: "created",
        validFrom: new Date(),
        validUntil: new Date(Date.now() + (duration === "monthly" ? 30 : 365) * 24 * 60 * 60 * 1000)
      });

      return res.json({
        success: true,
        isMock: true,  // ✅ Frontend ko signal
        orderId: mockOrderId,
        amount: pricing.amount,
        currency: "INR",
        planLabel: pricing.label,
        key: "rzp_test_mock_key",
        message: "Developer Sandbox Mode Active"
      });
    }

    // 🎯 REAL RAZORPAY FLOW
    const options = {
      amount: pricing.amount,
      currency: "INR",
      receipt: `sub_${facilityId}_${Date.now()}`,
      notes: { facilityId, plan, duration }
    };

    const order = await razorpay.orders.create(options);

    await Subscription.create({
      facilityId,
      razorpayOrderId: order.id,
      plan,
      duration,
      amount: pricing.amount,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + (duration === "monthly" ? 30 : 365) * 24 * 60 * 60 * 1000)
    });

    res.json({
      success: true,
      isMock: false,
      orderId: order.id,
      amount: pricing.amount,
      currency: "INR",
      planLabel: pricing.label,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    logger.error(`Create order failed: ${err.message}`);
    next(err);
  }
};

// VERIFY PAYMENT
exports.verifyPayment = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // 🧪 MOCK MODE VERIFY
    if (razorpay_order_id?.startsWith('mock_order_')) {
      logger.info(`🧪 Mock Mode: Verifying sandbox payment for ${facilityId}`);
      
      const subscription = await Subscription.findOneAndUpdate(
        { facilityId, razorpayOrderId: razorpay_order_id },
        {
          razorpayPaymentId: razorpay_payment_id || "mock_payment_" + Date.now(),
          razorpaySignature: razorpay_signature || "mock_signature",
          status: "paid"
        },
        { new: true }
      );

      if (!subscription) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      // ✅ Facility upgrade
      await Facility.findByIdAndUpdate(facilityId, {
        subscriptionPlan: "pro",
        subscriptionStatus: "active",
        subscriptionEnd: subscription.validUntil
      });

      return res.json({
        success: true,
        isMock: true,
        message: "🎉 Sandbox Upgrade Successful! Pro features unlocked.",
        subscription: {
          plan: "pro",
          validUntil: subscription.validUntil
        }
      });
    }

    // 🎯 REAL SIGNATURE VERIFY
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "secret_placeholder")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const subscription = await Subscription.findOneAndUpdate(
      { facilityId, razorpayOrderId: razorpay_order_id },
      { 
        razorpayPaymentId: razorpay_payment_id, 
        razorpaySignature: razorpay_signature, 
        status: "paid" 
      },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    await Facility.findByIdAndUpdate(facilityId, {
      subscriptionPlan: "pro",
      subscriptionStatus: "active",
      subscriptionEnd: subscription.validUntil
    });

    res.json({
      success: true,
      isMock: false,
      message: "Upgrade successful! 🎉",
      subscription: {
        plan: "pro",
        validUntil: subscription.validUntil
      }
    });
  } catch (err) {
    logger.error(`Verify payment failed: ${err.message}`);
    next(err);
  }
};

// WEBHOOK Handler (Auto-expire ke liye)
exports.handleWebhook = async (req, res, next) => {
  try {
    const webhookSignature = req.headers["x-razorpay-signature"];
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || "webhook_secret_placeholder")
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (webhookSignature !== expectedSignature) {
      return res.status(400).json({ success: false, message: "Webhook signature invalid" });
    }

    const event = req.body.payload?.payment?.entity;
    if (!event) return res.status(200).json({ received: true });

    // payment.captured -> Auto-upgrade
    if (req.body.event === "payment.captured" && event.notes?.facilityId) {
      const { facilityId, plan, duration } = event.notes;
      
      await Facility.findByIdAndUpdate(facilityId, {
        subscriptionPlan: plan,
        subscriptionStatus: "active",
        subscriptionEnd: new Date(Date.now() + (duration === "monthly" ? 30 : 365) * 24 * 60 * 60 * 1000)
      });

      await Subscription.findOneAndUpdate(
        { razorpayOrderId: event.order_id },
        { status: "paid", razorpayPaymentId: event.id }
      );

      logger.info(`Webhook: Facility ${facilityId} auto-upgraded via payment.captured`);
    }

    // subscription.expired -> Auto-downgrade (future use if recurring)
    if (req.body.event === "subscription.expired" && event.notes?.facilityId) {
      await Facility.findByIdAndUpdate(event.notes.facilityId, {
        subscriptionPlan: "free",
        subscriptionStatus: "expired"
      });
      logger.info(`Webhook: Facility ${event.notes.facilityId} downgraded via subscription.expired`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    logger.error(`Webhook error: ${err.message}`);
    next(err);
  }
};

// GET STATUS
exports.getStatus = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const facility = await Facility.findById(facilityId).select("subscriptionPlan subscriptionStatus subscriptionEnd");

    res.json({
      success: true,
      plan: facility?.subscriptionPlan || "free",
      status: facility?.subscriptionStatus || "active",
      validUntil: facility?.subscriptionEnd
    });
  } catch (err) {
    next(err);
  }
};

// GET HISTORY
exports.getHistory = async (req, res, next) => {
  try {
    const { facilityId } = req.user;
    const subscriptions = await Subscription.find({ facilityId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("plan duration amount status validFrom validUntil createdAt razorpayOrderId");

    res.json({ success: true, count: subscriptions.length, subscriptions });
  } catch (err) {
    next(err);
  }
};

