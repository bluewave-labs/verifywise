import { Queue } from "bullmq";
import redisClient from "../../database/redis"
import logger from "../../utils/logger/fileLogger";

// Create a new queue (connected to Redis using environment variable)
export const automationQueue = new Queue("automation-actions", {
  connection: redisClient
});

export async function enqueueAutomationAction(
  actionKey: string, data: Object) {
  return automationQueue.add(actionKey, data);
}

export async function scheduleVendorReviewDateNotification() {
  await automationQueue.obliterate();
  logger.info("Adding Vendor Review Date Notification jobs to the queue...");
  // Vendor Review Date Notification Every day at 12 am
  await automationQueue.add(
    "send_vendor_notification",
    { type: "review_date" },
    {
      repeat: {
        pattern: "0 0 * * *",
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );
}
