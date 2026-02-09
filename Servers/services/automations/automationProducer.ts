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

export async function scheduleShadowAiJobs() {
  logger.info("Adding Shadow AI scheduled jobs to the queue...");

  // Daily rollup: aggregate yesterday's raw events at 1:00 AM
  await automationQueue.add(
    "shadow_ai_daily_rollup",
    { type: "shadow_ai" },
    {
      repeat: { pattern: "0 1 * * *" },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );

  // Monthly rollup: aggregate last month's daily rollups at 1:00 AM on 1st
  await automationQueue.add(
    "shadow_ai_monthly_rollup",
    { type: "shadow_ai" },
    {
      repeat: { pattern: "0 1 1 * *" },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );

  // Nightly risk scoring: recalculate all tool risk scores at 1:30 AM
  await automationQueue.add(
    "shadow_ai_risk_scoring",
    { type: "shadow_ai" },
    {
      repeat: { pattern: "30 1 * * *" },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );

  // Purge old events: delete events older than 30 days at 2:00 AM
  await automationQueue.add(
    "shadow_ai_purge_events",
    { type: "shadow_ai" },
    {
      repeat: { pattern: "0 2 * * *" },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );
}
