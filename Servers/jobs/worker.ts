import { Worker } from "bullmq";
import { createNotificationWorker } from "../services/slack/slackWorker";

const notificationWorker = createNotificationWorker();

// Add workers here as you add on new workers within the application
const workers: Worker[] = [notificationWorker];

// Global error handler for all workers
workers.forEach((worker) => {
  worker.on("error", (err) => {
    console.error(`Worker error on queue ${worker.name}:`, err);
  });
});

console.log("All workers started and waiting for jobs...");

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down all workers...");
  await Promise.all(workers.map((worker) => worker.close()));
  console.log("All workers shut down successfully");
  process.exit(0);
});
