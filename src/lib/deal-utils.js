import cron from 'node-cron';
import Deal from '../models/business/deal.model.js'; // Adjust path

const updateDealStatuses = async () => {
    const now = new Date();
    console.log(`[${now.toISOString()}] Running deal status update job...`);

    try {
        // 1. Activate scheduled deals that should now be active
        const activateResult = await Deal.updateMany(
            { status: 'SCHEDULED', startDate: { $lte: now }, endDate: { $gte: now } },
            { $set: { status: 'ACTIVE' } }
        );

        // 2. Expire active deals whose end date has passed
        const expireResult = await Deal.updateMany(
            { status: 'ACTIVE', endDate: { $lt: now } },
            { $set: { status: 'EXPIRED' } }
        );

        if (activateResult.modifiedCount > 0 || expireResult.modifiedCount > 0) {
             console.log(`Deal Status Update: Activated ${activateResult.modifiedCount}, Expired ${expireResult.modifiedCount} deals.`);
        } else {
             console.log("Deal Status Update: No deals needed status change.");
        }

    } catch (error) {
        console.error("Error during deal status update job:", error);
    }
};

// Schedule the job to run (e.g., every hour at the start of the hour)
// Cron pattern: sec min hour day(month) month day(week)
// '0 * * * *' means at minute 0 of every hour
const scheduleDealStatusUpdates = () => {
    // Run once immediately on startup (optional, good for testing)
    // updateDealStatuses(); // Uncomment if needed

    cron.schedule('0 * * * *', updateDealStatuses, {
        scheduled: true,
        timezone: "Australia/Melbourne" // Set to your server's timezone or relevant business timezone
    });
    console.log("Scheduled deal status update job to run every hour.");
};

export default scheduleDealStatusUpdates;