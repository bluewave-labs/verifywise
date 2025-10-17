import { Worker, Job } from "bullmq";
import IORedis from "ioredis";

import { sendPolicyDueSoonNotification } from "./policyDueSoonNotification";
import { logSuccess, logFailure } from "../../utils/logger/logHelper";

const connection = new IORedis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  maxRetriesPerRequest: null,
});

export const createNotificationWorker = () => {
  const worker = new Worker(
    "slack-notifications",
    async (job: Job) => {
      if (job.data.type === "policies") {
        const userId = await sendPolicyDueSoonNotification();
        return { success: true, sentAt: new Date().toISOString(), userId };
      } else {
        throw new Error(`Unknown job type: ${job.data.type}`);
      }
    },
    { connection },
  );

  worker.on("completed", (job) => {
    const userId = job.returnvalue?.userId;
    logSuccess({
      eventType: "Update",
      description: "Completed Job Processing",
      functionName: "createNotificationWorker",
      fileName: "slackWorker.ts",
      userId,
    });
  });

  worker.on("failed", (job, err) => {
    logFailure({
      eventType: "Update",
      description: "Processed Jobs",
      functionName: "createNotificationWorker",
      fileName: "slackWorker.ts",
      error: err,
    });
  });

  return worker;
};
