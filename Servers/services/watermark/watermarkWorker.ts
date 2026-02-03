/**
 * @fileoverview Watermark Job Worker
 *
 * BullMQ worker for processing watermark jobs asynchronously.
 * Handles embed and detect operations for batch processing.
 *
 * @module services/watermark/watermarkWorker
 */

import { Worker, Job } from "bullmq";
import axios from "axios";
import { REDIS_URL } from "../../database/redis";
import logger from "../../utils/logger/fileLogger";
import {
  updateWatermarkJobStatusQuery,
  updateWatermarkJobResultQuery,
} from "../../utils/watermarkJob.utils";
import { WatermarkJobData } from "./watermarkProducer";

const WATERMARK_SERVICE_URL = process.env.WATERMARK_SERVICE_URL || "http://localhost:8001";

/**
 * Process an embed watermark job
 */
async function processEmbedJob(jobData: WatermarkJobData): Promise<{
  success: boolean;
  watermarkedImageBase64?: string;
  processingTimeMs: number;
}> {
  const startTime = Date.now();

  // Update status to processing
  await updateWatermarkJobStatusQuery(
    jobData.jobId,
    "processing",
    jobData.tenantId
  );

  try {
    const response = await axios.post(
      `${WATERMARK_SERVICE_URL}/api/v1/watermark/embed`,
      {
        image_base64: jobData.imageBase64,
        strength: jobData.strength || 1.0,
      },
      {
        timeout: 300000, // 5 minute timeout for worker jobs
        headers: { "Content-Type": "application/json" },
      }
    );

    const processingTimeMs = Date.now() - startTime;

    // Update job with result
    await updateWatermarkJobResultQuery(
      jobData.jobId,
      {
        status: "completed",
        result: {
          watermarked_image_base64: response.data.watermarked_image_base64,
          message: response.data.message,
        },
        processing_time_ms: processingTimeMs,
      },
      jobData.tenantId
    );

    return {
      success: true,
      watermarkedImageBase64: response.data.watermarked_image_base64,
      processingTimeMs,
    };
  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error during embedding";

    await updateWatermarkJobResultQuery(
      jobData.jobId,
      {
        status: "failed",
        error_message: errorMessage,
        processing_time_ms: processingTimeMs,
      },
      jobData.tenantId
    );

    throw error;
  }
}

/**
 * Process a detect watermark job
 */
async function processDetectJob(jobData: WatermarkJobData): Promise<{
  success: boolean;
  hasWatermark: boolean;
  confidence: number;
  bitAccuracy?: number;
  processingTimeMs: number;
}> {
  const startTime = Date.now();

  // Update status to processing
  await updateWatermarkJobStatusQuery(
    jobData.jobId,
    "processing",
    jobData.tenantId
  );

  try {
    const response = await axios.post(
      `${WATERMARK_SERVICE_URL}/api/v1/watermark/detect`,
      {
        image_base64: jobData.imageBase64,
      },
      {
        timeout: 300000, // 5 minute timeout for worker jobs
        headers: { "Content-Type": "application/json" },
      }
    );

    const processingTimeMs = Date.now() - startTime;

    // Update job with result
    await updateWatermarkJobResultQuery(
      jobData.jobId,
      {
        status: "completed",
        result: {
          has_watermark: response.data.has_watermark,
          confidence: response.data.confidence,
          bit_accuracy: response.data.bit_accuracy,
          message: response.data.message,
        },
        processing_time_ms: processingTimeMs,
      },
      jobData.tenantId
    );

    return {
      success: true,
      hasWatermark: response.data.has_watermark,
      confidence: response.data.confidence,
      bitAccuracy: response.data.bit_accuracy,
      processingTimeMs,
    };
  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error during detection";

    await updateWatermarkJobResultQuery(
      jobData.jobId,
      {
        status: "failed",
        error_message: errorMessage,
        processing_time_ms: processingTimeMs,
      },
      jobData.tenantId
    );

    throw error;
  }
}

/**
 * Create the watermark worker
 */
export const createWatermarkWorker = () => {
  const worker = new Worker<WatermarkJobData>(
    "watermark-jobs",
    async (job: Job<WatermarkJobData>) => {
      logger.info(`Processing watermark job: ${job.name} (ID: ${job.data.jobId})`);

      if (job.data.type === "embed") {
        return await processEmbedJob(job.data);
      } else if (job.data.type === "detect") {
        return await processDetectJob(job.data);
      } else {
        throw new Error(`Unknown watermark job type: ${job.data.type}`);
      }
    },
    {
      connection: { url: REDIS_URL },
      concurrency: 3, // Process up to 3 jobs concurrently
    }
  );

  worker.on("completed", (job, result) => {
    logger.info(
      `Watermark job completed: ${job.name} (ID: ${job.data.jobId}) in ${result.processingTimeMs}ms`
    );
  });

  worker.on("failed", (job, err) => {
    logger.error(
      `Watermark job failed: ${job?.name} (ID: ${job?.data.jobId}): ${err.message}`
    );
  });

  worker.on("error", (err) => {
    logger.error(`Watermark worker error: ${err.message}`);
  });

  return worker;
};
