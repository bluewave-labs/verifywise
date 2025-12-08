/**
 * VerifyWise Plugin System - Plugin Scheduler Worker
 *
 * Processes scheduled jobs for plugins using BullMQ.
 */

import { Worker, Job } from "bullmq";
import redisClient from "../../database/redis";
import logger from "../../utils/logger/fileLogger";
import {
  getJobHandler,
  cleanupOneTimeJob,
  isOneTimeJob,
} from "../../plugins/core/PluginScheduler";

/**
 * Job data structure
 */
interface PluginJobData {
  pluginId: string;
  jobName: string;
  tenant: string;
  data: Record<string, unknown>;
  isOneTime?: boolean;
}

/**
 * Create the plugin scheduler worker
 */
export function createPluginSchedulerWorker(): Worker {
  const worker = new Worker<PluginJobData>(
    "plugin-scheduler",
    async (job: Job<PluginJobData>) => {
      const { pluginId, jobName, tenant, data } = job.data;

      logger.debug(
        `[PluginSchedulerWorker] Processing job: ${pluginId}:${jobName} (attempt ${job.attemptsMade + 1})`
      );

      // Get the handler for this job
      const handler = getJobHandler(pluginId, jobName);

      if (!handler) {
        logger.warn(
          `[PluginSchedulerWorker] No handler found for job: ${pluginId}:${jobName}. ` +
            `This may happen if the plugin was disabled or uninstalled.`
        );
        // Don't throw - just skip the job
        return;
      }

      try {
        // Execute the handler
        await handler(data, {
          jobId: job.id || `${pluginId}:${jobName}`,
          attemptsMade: job.attemptsMade,
          pluginId,
          tenant,
        });

        logger.debug(
          `[PluginSchedulerWorker] Job completed: ${pluginId}:${jobName}`
        );

        // Clean up one-time job handler after successful execution
        if (job.data.isOneTime || isOneTimeJob(pluginId, jobName)) {
          cleanupOneTimeJob(pluginId, jobName);
        }
      } catch (error) {
        logger.error(
          `[PluginSchedulerWorker] Job failed: ${pluginId}:${jobName}`,
          error
        );
        throw error; // Re-throw to trigger retry
      }
    },
    {
      connection: redisClient,
      concurrency: 5, // Process up to 5 jobs concurrently
    }
  );

  // Log worker events
  worker.on("completed", (job) => {
    logger.debug(
      `[PluginSchedulerWorker] Job ${job.id} completed successfully`
    );
  });

  worker.on("failed", (job, error) => {
    logger.error(
      `[PluginSchedulerWorker] Job ${job?.id} failed:`,
      error.message
    );
  });

  worker.on("error", (error) => {
    logger.error("[PluginSchedulerWorker] Worker error:", error);
  });

  logger.info("[PluginSchedulerWorker] Worker started");

  return worker;
}
