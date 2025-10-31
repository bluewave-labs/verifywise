import { Queue } from "bullmq";
import redisClient from "../../database/redis";
import logger from "../../utils/logger/fileLogger";

export const mlflowSyncQueue = new Queue("mlflow-sync", {
  connection: redisClient,
});

const SYNC_JOB_NAME = "mlflow-sync-all-orgs";
const SYNC_CRON_PATTERN = "0 * * * *";

export async function scheduleMlflowSyncJob() {
  try {
    await mlflowSyncQueue.removeRepeatable(SYNC_JOB_NAME, {
      pattern: SYNC_CRON_PATTERN,
    });
  } catch (error) {
    logger.debug("No existing MLFlow sync job to remove:", error);
  }

  logger.info("Scheduling MLFlow sync job...");

  await mlflowSyncQueue.add(
    SYNC_JOB_NAME,
    {},
    {
      repeat: {
        pattern: SYNC_CRON_PATTERN,
      },
      removeOnComplete: true,
      removeOnFail: false,
      jobId: SYNC_JOB_NAME,
    },
  );
}
