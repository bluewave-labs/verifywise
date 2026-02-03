/**
 * @fileoverview Watermark Job Producer
 *
 * BullMQ producer for async watermark processing jobs.
 * Used for batch processing or large file operations that need background processing.
 *
 * @module services/watermark/watermarkProducer
 */

import { Queue } from "bullmq";
import logger from "../../utils/logger/fileLogger";
import { REDIS_URL } from "../../database/redis";

export interface WatermarkJobData {
  type: "embed" | "detect";
  jobId: number;
  tenantId: string;
  userId: number;
  imageBase64: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  strength?: number;
  modelId?: number;
  projectId?: number;
}

// Create a new queue for watermark jobs
export const watermarkQueue = new Queue<WatermarkJobData>("watermark-jobs", {
  connection: { url: REDIS_URL },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
  },
});

/**
 * Add a watermark embed job to the queue
 */
export async function queueEmbedJob(data: {
  jobId: number;
  tenantId: string;
  userId: number;
  imageBase64: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  strength?: number;
  modelId?: number;
  projectId?: number;
}): Promise<string> {
  const job = await watermarkQueue.add(
    `embed-${data.jobId}`,
    {
      type: "embed",
      ...data,
    },
    {
      priority: 1, // Higher priority for embed jobs
    }
  );

  logger.info(`Queued watermark embed job: ${job.id} for job ID: ${data.jobId}`);
  return job.id!;
}

/**
 * Add a watermark detect job to the queue
 */
export async function queueDetectJob(data: {
  jobId: number;
  tenantId: string;
  userId: number;
  imageBase64: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
}): Promise<string> {
  const job = await watermarkQueue.add(
    `detect-${data.jobId}`,
    {
      type: "detect",
      ...data,
    },
    {
      priority: 2, // Lower priority for detect jobs
    }
  );

  logger.info(`Queued watermark detect job: ${job.id} for job ID: ${data.jobId}`);
  return job.id!;
}

/**
 * Add multiple watermark jobs for batch processing
 */
export async function queueBatchJobs(
  jobs: Array<Omit<WatermarkJobData, "type"> & { type: "embed" | "detect" }>
): Promise<string[]> {
  const bulkJobs = jobs.map((job) => ({
    name: `${job.type}-${job.jobId}`,
    data: job,
    opts: {
      priority: job.type === "embed" ? 1 : 2,
    },
  }));

  const results = await watermarkQueue.addBulk(bulkJobs);

  logger.info(`Queued ${results.length} watermark jobs for batch processing`);
  return results.map((r) => r.id!);
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    watermarkQueue.getWaitingCount(),
    watermarkQueue.getActiveCount(),
    watermarkQueue.getCompletedCount(),
    watermarkQueue.getFailedCount(),
    watermarkQueue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

/**
 * Clean up old jobs
 */
export async function cleanupQueue(graceMs: number = 24 * 60 * 60 * 1000): Promise<void> {
  await watermarkQueue.clean(graceMs, 100, "completed");
  await watermarkQueue.clean(graceMs, 100, "failed");
  logger.info("Cleaned up old watermark jobs");
}
