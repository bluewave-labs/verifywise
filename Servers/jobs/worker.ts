import { Worker } from "bullmq";
import { createNotificationWorker } from "../services/slack/slackWorker";
import { createAutomationWorker } from "../services/automations/automationWorker";
import { createMlflowSyncWorker } from "../services/mlflow/mlflowSyncWorker";
import logger from "../utils/logger/fileLogger";

const notificationWorker = createNotificationWorker();
const automationWorker = createAutomationWorker();
const mlflowSyncWorker = createMlflowSyncWorker();

// Add workers here as you add on new workers within the application
const workers: Worker[] = [notificationWorker, automationWorker, mlflowSyncWorker];

// Global error handler for all workers
workers.forEach((worker) => {
  worker.on("error", (err) => {
    logger.debug(`Worker error on queue ${worker.name}:`, err);
  });
});

logger.debug("All workers started and waiting for jobs...");

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.debug("Shutting down all workers...");
  await Promise.all(workers.map((worker) => worker.close()));
  logger.debug("All workers shut down successfully");
  notificationWorker.close();
  automationWorker.close();
  mlflowSyncWorker.close();
  process.exit(0);
});
