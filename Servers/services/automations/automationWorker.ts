import { Worker, Job } from "bullmq";
import redisClient from "../../database/redis"
import sendEmail from "./actions/sendEmail";

const handlers = {
  "send_email": sendEmail,
};

export const createAutomationWorker = () => {
  const automationWorker = new Worker(
    'automation-actions',
    async (job: Job) => {
      const handler = handlers[job.name as keyof typeof handlers];
      if (!handler) {
        throw new Error(`No handler found for action type: ${job.name}`);
      }

      console.log(`Processing automation action: ${job.name}`);
      await handler(job.data);
    },
    { connection: redisClient, concurrency: 10 }
  );
  automationWorker.on('completed', (job) => {
    console.log(`Job ${job.id} of type ${job.name} has been completed`);
  });
  automationWorker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} of type ${job?.name} has failed with error: ${err.message}`);
  });
  return automationWorker;
}