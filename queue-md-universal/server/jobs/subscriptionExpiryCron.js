const cron = require("node-cron");
const Facility = require("../models/Facility");
const logger = require("../utils/logger");

/**
 * Checks for expired subscriptions and downgrades facilities.
 */
async function checkExpiredSubscriptions() {
  try {
    logger.info("⏳ Starting expired subscription check...");
    const now = new Date();
    
    // Find pro facilities where subscriptionEnd has passed
    const expiredFacilities = await Facility.find({
      subscriptionPlan: "pro",
      subscriptionEnd: { $lt: now }
    });

    if (expiredFacilities.length === 0) {
      logger.info("✅ No expired subscriptions found.");
      return;
    }

    logger.info(`🚨 Found ${expiredFacilities.length} expired subscription(s). Downgrading...`);

    for (const facility of expiredFacilities) {
      facility.subscriptionPlan = "free";
      facility.subscriptionStatus = "expired";
      await facility.save();
      logger.info(`📉 Downgraded facility ${facility.name} (${facility._id}) to free plan due to subscription expiry.`);
    }

    logger.info("✅ Expired subscription check completed.");
  } catch (error) {
    logger.error(`❌ Error in checkExpiredSubscriptions job: ${error.message}`);
  }
}

function startSubscriptionExpiryCron() {
  // Run every day at midnight (00:00) IST/System time
  cron.schedule("0 0 * * *", async () => {
    await checkExpiredSubscriptions();
  });
  logger.info("⏰ Subscription expiry background cron job initialized (Daily at 00:00).");
  
  // Optionally run once on startup in non-prod environments to make sure it works
  if (process.env.NODE_ENV !== 'production') {
    logger.info("⏳ Running initial checkExpiredSubscriptions scan on startup in dev environment...");
    checkExpiredSubscriptions().catch(err => {
      logger.error(`❌ Error during initial startup scan: ${err.message}`);
    });
  }
}

module.exports = {
  checkExpiredSubscriptions,
  startSubscriptionExpiryCron
};
