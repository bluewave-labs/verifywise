/**
 * VerifyWise Plugin System - Plugin Scheduler
 *
 * Provides scheduled/recurring job capabilities for plugins using BullMQ.
 * Plugins can schedule jobs using cron patterns or specific intervals.
 */

import { Queue, Job } from "bullmq";
import redisClient from "../../database/redis";
import logger from "../../utils/logger/fileLogger";
import {
  ScheduleJobOptions,
  ScheduledJobInfo,
  PluginJobHandler,
  PluginSchedulerAPI,
} from "./types";

// =============================================================================
// SCHEDULER IMPLEMENTATION
// =============================================================================

/**
 * Global plugin scheduler queue
 */
let pluginSchedulerQueue: Queue | null = null;

/**
 * Registry of job handlers by pluginId:jobName
 */
const jobHandlers = new Map<string, PluginJobHandler>();

/**
 * Track one-time job IDs for cleanup (jobKey -> jobId)
 */
const oneTimeJobIds = new Map<string, string>();

/**
 * Validate job name (no colons allowed as they're used as separators)
 */
function validateJobName(name: string): void {
  if (!name || typeof name !== "string") {
    throw new Error("Job name must be a non-empty string");
  }
  if (name.includes(":")) {
    throw new Error("Job name cannot contain ':' character");
  }
  if (name.length > 100) {
    throw new Error("Job name cannot exceed 100 characters");
  }
}

/**
 * Get or create the plugin scheduler queue
 */
export function getPluginSchedulerQueue(): Queue {
  if (!pluginSchedulerQueue) {
    pluginSchedulerQueue = new Queue("plugin-scheduler", {
      connection: redisClient,
      defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50, // Keep last 50 failed jobs
      },
    });
    logger.info("[PluginScheduler] Queue initialized");
  }
  return pluginSchedulerQueue;
}

/**
 * Generate a unique job key for a plugin's job
 */
function getJobKey(pluginId: string, jobName: string): string {
  return `${pluginId}:${jobName}`;
}

/**
 * Register a job handler
 */
export function registerJobHandler(
  pluginId: string,
  jobName: string,
  handler: PluginJobHandler
): void {
  const key = getJobKey(pluginId, jobName);
  jobHandlers.set(key, handler);
  logger.debug(`[PluginScheduler] Registered handler: ${key}`);
}

/**
 * Unregister a job handler
 */
export function unregisterJobHandler(pluginId: string, jobName: string): void {
  const key = getJobKey(pluginId, jobName);
  jobHandlers.delete(key);
  logger.debug(`[PluginScheduler] Unregistered handler: ${key}`);
}

/**
 * Unregister all handlers for a plugin
 */
export function unregisterAllHandlers(pluginId: string): void {
  const prefix = `${pluginId}:`;
  for (const key of jobHandlers.keys()) {
    if (key.startsWith(prefix)) {
      jobHandlers.delete(key);
    }
  }
  // Also clean up one-time job tracking
  for (const key of oneTimeJobIds.keys()) {
    if (key.startsWith(prefix)) {
      oneTimeJobIds.delete(key);
    }
  }
  logger.debug(`[PluginScheduler] Unregistered all handlers for: ${pluginId}`);
}

/**
 * Clean up handler after one-time job completes
 * Called by the worker after job execution
 */
export function cleanupOneTimeJob(pluginId: string, jobName: string): void {
  const jobKey = getJobKey(pluginId, jobName);
  if (oneTimeJobIds.has(jobKey)) {
    oneTimeJobIds.delete(jobKey);
    jobHandlers.delete(jobKey);
    logger.debug(`[PluginScheduler] Cleaned up one-time job handler: ${jobKey}`);
  }
}

/**
 * Check if a job is a one-time job
 */
export function isOneTimeJob(pluginId: string, jobName: string): boolean {
  return oneTimeJobIds.has(getJobKey(pluginId, jobName));
}

/**
 * Get a job handler
 */
export function getJobHandler(
  pluginId: string,
  jobName: string
): PluginJobHandler | undefined {
  return jobHandlers.get(getJobKey(pluginId, jobName));
}

/**
 * Create a scheduler API for a specific plugin
 */
export function createPluginSchedulerAPI(
  pluginId: string,
  tenant: string
): PluginSchedulerAPI {
  const queue = getPluginSchedulerQueue();

  return {
    async schedule(
      name: string,
      handler: PluginJobHandler,
      options: ScheduleJobOptions,
      data?: Record<string, unknown>
    ): Promise<ScheduledJobInfo> {
      // Validate job name
      validateJobName(name);

      const jobKey = getJobKey(pluginId, name);

      // Check for duplicate job
      const existingJobs = await queue.getRepeatableJobs();
      if (existingJobs.some((j) => j.name === jobKey)) {
        throw new Error(`A scheduled job with name '${name}' already exists for this plugin`);
      }

      // Register the handler
      registerJobHandler(pluginId, name, handler);

      // Build repeat options
      const repeatOptions: { pattern?: string; every?: number; limit?: number } = {};
      if (options.cron) {
        repeatOptions.pattern = options.cron;
      } else if (options.every) {
        repeatOptions.every = options.every;
      } else {
        throw new Error("Either 'cron' or 'every' must be specified");
      }
      if (options.limit) {
        repeatOptions.limit = options.limit;
      }

      // Add the job to the queue
      const job = await queue.add(
        jobKey,
        {
          pluginId,
          jobName: name,
          tenant,
          data: data || {},
        },
        {
          repeat: repeatOptions,
          delay: options.delay,
          priority: options.priority,
          attempts: options.attempts || 3,
          backoff: options.backoff || { type: "exponential", delay: 5000 },
        }
      );

      logger.info(
        `[PluginScheduler] Scheduled job: ${jobKey} with ${
          options.cron ? `cron: ${options.cron}` : `every: ${options.every}ms`
        }`
      );

      return {
        jobId: job.id || jobKey,
        name,
        pluginId,
        nextRun: job.processedOn ? new Date(job.processedOn) : undefined,
      };
    },

    async scheduleOnce(
      name: string,
      handler: PluginJobHandler,
      delay: number,
      data?: Record<string, unknown>
    ): Promise<ScheduledJobInfo> {
      // Validate job name
      validateJobName(name);

      const jobKey = getJobKey(pluginId, name);

      // Check for existing one-time job with same name
      if (oneTimeJobIds.has(jobKey)) {
        throw new Error(`A one-time job with name '${name}' is already scheduled for this plugin`);
      }

      // Register the handler
      registerJobHandler(pluginId, name, handler);

      // Add the job with a delay
      const job = await queue.add(
        jobKey,
        {
          pluginId,
          jobName: name,
          tenant,
          data: data || {},
          isOneTime: true, // Mark as one-time for worker cleanup
        },
        {
          delay,
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
        }
      );

      // Track the one-time job for cleanup
      const jobId = job.id || jobKey;
      oneTimeJobIds.set(jobKey, jobId);

      logger.info(`[PluginScheduler] Scheduled one-time job: ${jobKey} in ${delay}ms`);

      return {
        jobId,
        name,
        pluginId,
        nextRun: new Date(Date.now() + delay),
      };
    },

    async cancel(name: string): Promise<boolean> {
      const jobKey = getJobKey(pluginId, name);
      let cancelled = false;

      // Remove repeatable jobs
      const repeatableJobs = await queue.getRepeatableJobs();
      for (const rJob of repeatableJobs) {
        if (rJob.name === jobKey) {
          await queue.removeRepeatableByKey(rJob.key);
          cancelled = true;
          logger.info(`[PluginScheduler] Cancelled repeatable job: ${jobKey}`);
        }
      }

      // Remove one-time delayed jobs
      if (oneTimeJobIds.has(jobKey)) {
        const jobId = oneTimeJobIds.get(jobKey)!;
        const job = await queue.getJob(jobId);
        if (job) {
          await job.remove();
          cancelled = true;
          logger.info(`[PluginScheduler] Cancelled delayed job: ${jobKey}`);
        }
        oneTimeJobIds.delete(jobKey);
      }

      // Unregister handler
      unregisterJobHandler(pluginId, name);

      return cancelled;
    },

    async cancelAll(): Promise<number> {
      const prefix = `${pluginId}:`;
      let cancelled = 0;

      // Remove all repeatable jobs for this plugin
      const repeatableJobs = await queue.getRepeatableJobs();
      for (const rJob of repeatableJobs) {
        if (rJob.name.startsWith(prefix)) {
          await queue.removeRepeatableByKey(rJob.key);
          cancelled++;
        }
      }

      // Remove all one-time delayed jobs for this plugin
      for (const [jobKey, jobId] of oneTimeJobIds.entries()) {
        if (jobKey.startsWith(prefix)) {
          const job = await queue.getJob(jobId);
          if (job) {
            await job.remove();
            cancelled++;
          }
        }
      }

      // Unregister all handlers (this also cleans up oneTimeJobIds)
      unregisterAllHandlers(pluginId);

      logger.info(`[PluginScheduler] Cancelled ${cancelled} jobs for plugin: ${pluginId}`);
      return cancelled;
    },

    async list(): Promise<ScheduledJobInfo[]> {
      const prefix = `${pluginId}:`;
      const jobs: ScheduledJobInfo[] = [];

      // Get repeatable jobs
      const repeatableJobs = await queue.getRepeatableJobs();
      for (const rJob of repeatableJobs) {
        if (rJob.name.startsWith(prefix)) {
          jobs.push({
            jobId: rJob.key,
            name: rJob.name.replace(prefix, ""),
            pluginId,
            nextRun: rJob.next ? new Date(rJob.next) : undefined,
          });
        }
      }

      // Get pending one-time delayed jobs
      for (const [jobKey, jobId] of oneTimeJobIds.entries()) {
        if (jobKey.startsWith(prefix)) {
          const job = await queue.getJob(jobId);
          if (job) {
            const state = await job.getState();
            if (state === "delayed" || state === "waiting") {
              jobs.push({
                jobId,
                name: jobKey.replace(prefix, ""),
                pluginId,
                nextRun: job.processedOn
                  ? new Date(job.processedOn)
                  : job.delay
                    ? new Date(job.timestamp + job.delay)
                    : undefined,
              });
            }
          }
        }
      }

      return jobs;
    },

    async exists(name: string): Promise<boolean> {
      const jobKey = getJobKey(pluginId, name);

      // Check repeatable jobs
      const repeatableJobs = await queue.getRepeatableJobs();
      if (repeatableJobs.some((rJob) => rJob.name === jobKey)) {
        return true;
      }

      // Check one-time delayed jobs
      if (oneTimeJobIds.has(jobKey)) {
        const jobId = oneTimeJobIds.get(jobKey)!;
        const job = await queue.getJob(jobId);
        if (job) {
          const state = await job.getState();
          if (state === "delayed" || state === "waiting") {
            return true;
          }
        }
        // Job completed or failed, clean up tracking
        oneTimeJobIds.delete(jobKey);
      }

      return false;
    },
  };
}

/**
 * Cleanup scheduler on shutdown
 */
export async function shutdownPluginScheduler(): Promise<void> {
  if (pluginSchedulerQueue) {
    await pluginSchedulerQueue.close();
    pluginSchedulerQueue = null;
    jobHandlers.clear();
    logger.info("[PluginScheduler] Shutdown complete");
  }
}
