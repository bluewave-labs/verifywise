import { Queue } from "bullmq";
import logger from "../../utils/logger/fileLogger";

// Create a new queue (connected to Redis using environment variable)
export const notificationQueue = new Queue("slack-notifications", {
  connection: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
  },
});

export async function scheduleDailyNotification() {
  await notificationQueue.obliterate();
  logger.info("Adding Slack notification jobs to the queue...");

  // Policy Due Soon Slack Notification Every day at 9 am
  await notificationQueue.add(
    "slack-notification-policy",
    { type: "policies" },
    {
      repeat: {
        pattern: "0 9 * * *",
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );
}
