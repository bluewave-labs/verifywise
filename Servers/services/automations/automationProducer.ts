import { Queue } from "bullmq";
import { REDIS_URL } from "../../database/redis"
import logger from "../../utils/logger/fileLogger";

// Create a new queue (connected to Redis using environment variable)
export const automationQueue = new Queue("automation-actions", {
  connection: { url: REDIS_URL }
});

export async function enqueueAutomationAction(
  actionKey: string, data: Object, options: Object = {}) {
  return automationQueue.add(actionKey, data, options);
}

export async function scheduleVendorReviewDateNotification() {
  await automationQueue.obliterate({ force: true });
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

export async function schedulePolicyDueSoonNotification() {
  logger.info("Adding Policy Due Soon Notification jobs to the queue...");
  // Policy Due Soon Notification every day at 8 AM
  await automationQueue.add(
    "send_policy_due_soon_notification",
    { type: "policy_due_soon" },
    {
      repeat: {
        pattern: "0 8 * * *",
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );
}

export async function scheduleReportNotification() {
  await automationQueue.obliterate({ force: true });
  logger.info("Adding Report Notification jobs to the queue...");
  // Report Notification Every day at 12 am
  await automationQueue.add(
    "send_report_notification",
    { type: "report_notification" },
    {
      repeat: {
        pattern: "0 0 * * *",
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );
}

export async function schedulePMMHourlyCheck() {
  logger.info("Adding PMM hourly check jobs to the queue...");
  // PMM hourly check - runs every hour at minute 0 to handle timezone-aware notifications
  await automationQueue.add(
    "pmm_hourly_check",
    { type: "pmm" },
    {
      repeat: {
        pattern: "0 * * * *", // Every hour at minute 0
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );
}
