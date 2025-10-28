import { Worker } from "bullmq";
import { createNotificationWorker } from "../services/slack/slackWorker";
import { createAutomationWorker } from "../services/automations/automationWorker";
import logger from "../utils/logger/fileLogger";

const notificationWorker = createNotificationWorker();
const automationWorker = createAutomationWorker();

// Add workers here as you add on new workers within the application
const workers: Worker[] = [notificationWorker, automationWorker];

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
  process.exit(0);
});
