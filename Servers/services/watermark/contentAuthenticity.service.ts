/**
 * @fileoverview Content Authenticity Service
 *
 * Service layer for watermark embedding and detection operations.
 * Communicates with the WatermarkService Python API for actual processing.
 *
 * @module services/watermark/contentAuthenticity
 */

import axios from "axios";
import FormData from "form-data";
import {
  createWatermarkJobQuery,
  getWatermarkJobByIdQuery,
  updateWatermarkJobStatusQuery,
  updateWatermarkJobResultQuery,
  getWatermarkJobsHistoryQuery,
  getWatermarkJobStatsQuery,
} from "../../utils/watermarkJob.utils";
import {
  WatermarkJobStatus,
  WatermarkJobType,
} from "../../domain.layer/models/watermarkJob/watermarkJob.model";
import {
  ValidationException,
  NotFoundException,
  ForbiddenException,
  ExternalServiceException,
} from "../../domain.layer/exceptions/custom.exception";
import logger from "../../utils/logger/fileLogger";
import {
  embedArticle50Compliant,
  verifyC2PAManifest,
  getConfidenceLevel,
  determineAIGeneratedAssessment,
  CONFIDENCE_THRESHOLDS,
  C2PAVerifyResult,
} from "./c2pa.service";

// ============================================================================
// Constants
// ============================================================================

const WATERMARK_SERVICE_URL = process.env.WATERMARK_SERVICE_URL || "http://localhost:8001";
const WATERMARK_OPERATION_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
const HEALTH_CHECK_TIMEOUT_MS = 5000; // 5 seconds
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB max file size
const MAX_BASE64_LENGTH = Math.ceil((MAX_FILE_SIZE_BYTES * 4) / 3); // Base64 is ~1.33x original
const ALLOWED_FILE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

// ============================================================================
// Interfaces
// ============================================================================

export interface IWatermarkServiceContext {
  userId: number;
  tenantId: string;
}

export interface EmbedWatermarkRequest {
  imageBase64: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  strength?: number;
  modelId?: number;
  projectId?: number;
}

export interface DetectWatermarkRequest {
  imageBase64: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
}

export interface EmbedWatermarkResult {
  jobId: number;
  status: WatermarkJobStatus;
  watermarkedImageBase64?: string;
  processingTimeMs?: number;
}

export interface DetectWatermarkResult {
  jobId: number;
  status: WatermarkJobStatus;
  hasWatermark: boolean;
  confidence: number;
  bitAccuracy?: number;
  processingTimeMs?: number;
}

// ============================================================================
// Article 50 Compliance Interfaces
// ============================================================================

export interface Article50EmbedRequest extends EmbedWatermarkRequest {
  enableC2PA?: boolean;
  c2paOptions?: {
    digitalSourceType?: string;
    allowTraining?: boolean;
    allowMining?: boolean;
  };
  provenance?: {
    modelName?: string;
    modelVersion?: string;
    provider?: string;
    generationPromptHash?: string;
  };
}

export interface Article50EmbedResult extends EmbedWatermarkResult {
  c2paManifestId?: string;
  c2paManifestApplied: boolean;
  contentHash?: string;
  euAiActCompliant: boolean;
}

export interface ComprehensiveDetectResult extends DetectWatermarkResult {
  confidenceLevel: "high" | "medium" | "low" | "none";
  confidenceThresholds: {
    high: number;
    medium: number;
    low: number;
  };
  c2pa?: {
    manifestFound: boolean;
    manifestId?: string;
    signatureValid?: boolean;
    chainVerified?: boolean;
    digitalSourceType?: string;
    generatorInfo?: {
      name: string;
      version: string;
    };
    aiModelInfo?: {
      name?: string;
      provider?: string;
      version?: string;
    };
  };
  aiGeneratedAssessment: "confirmed" | "likely" | "possible" | "undetected";
  assessmentReasoning: string;
}

export interface WatermarkJobResponse {
  id: number;
  user_id: number;
  type: WatermarkJobType;
  status: WatermarkJobStatus;
  input_file_name: string;
  input_file_type: string;
  input_file_size?: number;
  output_file_id?: number;
  model_id?: number;
  project_id?: number;
  evidence_id?: number;
  settings?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error_message?: string;
  processing_time_ms?: number;
  created_at?: Date;
  completed_at?: Date;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sanitize file name to prevent path traversal and XSS
 */
function sanitizeFileName(fileName: string): string {
  // Remove path separators and dangerous characters
  return fileName
    .replace(/[/\\:*?"<>|]/g, "_")
    .replace(/\.\./g, "_")
    .substring(0, 255);
}

/**
 * Normalize and validate file type
 */
function normalizeFileType(fileType: string): string {
  // Handle content-type with charset (e.g., "image/jpeg; charset=utf-8")
  return fileType.toLowerCase().split(";")[0].trim();
}

/**
 * Validate file size constraints
 */
function validateFileSize(request: { imageBase64: string; fileSize?: number }): void {
  // Check base64 length (rough estimate of file size)
  if (request.imageBase64.length > MAX_BASE64_LENGTH) {
    throw new ValidationException(
      `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`
    );
  }

  // If fileSize is provided, validate it as well
  if (request.fileSize && request.fileSize > MAX_FILE_SIZE_BYTES) {
    throw new ValidationException(
      `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`
    );
  }
}

/**
 * Validate file type
 */
function validateFileType(fileType: string): void {
  const normalizedType = normalizeFileType(fileType);
  if (!ALLOWED_FILE_TYPES.includes(normalizedType)) {
    throw new ValidationException(
      `Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(", ")}`
    );
  }
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Embed a watermark into an image
 */
export async function embedWatermark(
  request: EmbedWatermarkRequest,
  ctx: IWatermarkServiceContext
): Promise<EmbedWatermarkResult> {
  // Validate inputs
  validateFileType(request.fileType);
  validateFileSize(request);

  const sanitizedFileName = sanitizeFileName(request.fileName);

  // Create job record
  const job = await createWatermarkJobQuery(
    {
      user_id: ctx.userId,
      type: "embed",
      status: "pending",
      input_file_name: sanitizedFileName,
      input_file_type: normalizeFileType(request.fileType),
      input_file_size: request.fileSize,
      model_id: request.modelId,
      project_id: request.projectId,
      settings: {
        strength: request.strength || 1.0,
      },
    },
    ctx.tenantId
  );

  // Validate job was created with an ID
  if (!job.id) {
    throw new Error("Failed to create watermark job - no ID returned from database");
  }

  const jobId = job.id;
  const startTime = Date.now();

  try {
    // Update status to processing
    await updateWatermarkJobStatusQuery(jobId, "processing", ctx.tenantId);

    // Convert base64 to buffer for file upload
    const imageBuffer = Buffer.from(request.imageBase64, "base64");

    // Create multipart form data for WatermarkService API
    const formData = new FormData();
    formData.append("file", imageBuffer, {
      filename: sanitizeFileName(request.fileName),
      contentType: normalizeFileType(request.fileType),
    });
    formData.append(
      "settings",
      JSON.stringify({ strength: request.strength || 1.0 })
    );

    // Call WatermarkService Python API
    const response = await axios.post(
      `${WATERMARK_SERVICE_URL}/embed`,
      formData,
      {
        timeout: WATERMARK_OPERATION_TIMEOUT_MS,
        headers: formData.getHeaders(),
      }
    );

    const processingTimeMs = Date.now() - startTime;

    // Update job with result
    await updateWatermarkJobResultQuery(
      jobId,
      {
        status: "completed",
        result: {
          watermarked_image_base64: response.data.output_bytes,
          format: response.data.format,
          width: response.data.width,
          height: response.data.height,
        },
        processing_time_ms: processingTimeMs,
      },
      ctx.tenantId
    );

    return {
      jobId,
      status: "completed",
      watermarkedImageBase64: response.data.output_bytes,
      processingTimeMs,
    };
  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    const internalErrorMessage =
      error instanceof Error ? error.message : "Unknown error during embedding";

    // Log the full error for debugging
    logger.error(`Watermark embed failed for job ${jobId}: ${internalErrorMessage}`);

    // Update job with error
    await updateWatermarkJobResultQuery(
      jobId,
      {
        status: "failed",
        error_message: internalErrorMessage,
        processing_time_ms: processingTimeMs,
      },
      ctx.tenantId
    );

    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const details = error.response?.data?.detail || error.message;
      logger.error(`WatermarkService API error (${statusCode}): ${details}`);
      throw new ExternalServiceException(
        "Watermark service unavailable. Please try again later."
      );
    }

    throw new ExternalServiceException("Failed to embed watermark. Please try again.");
  }
}

/**
 * Detect watermark in an image
 */
export async function detectWatermark(
  request: DetectWatermarkRequest,
  ctx: IWatermarkServiceContext
): Promise<DetectWatermarkResult> {
  // Validate inputs
  validateFileType(request.fileType);
  validateFileSize(request);

  const sanitizedFileName = sanitizeFileName(request.fileName);

  // Create job record
  const job = await createWatermarkJobQuery(
    {
      user_id: ctx.userId,
      type: "detect",
      status: "pending",
      input_file_name: sanitizedFileName,
      input_file_type: normalizeFileType(request.fileType),
      input_file_size: request.fileSize,
    },
    ctx.tenantId
  );

  // Validate job was created with an ID
  if (!job.id) {
    throw new Error("Failed to create watermark job - no ID returned from database");
  }

  const jobId = job.id;
  const startTime = Date.now();

  try {
    // Update status to processing
    await updateWatermarkJobStatusQuery(jobId, "processing", ctx.tenantId);

    // Convert base64 to buffer for file upload
    const imageBuffer = Buffer.from(request.imageBase64, "base64");

    // Create multipart form data for WatermarkService API
    const formData = new FormData();
    formData.append("file", imageBuffer, {
      filename: sanitizeFileName(request.fileName),
      contentType: normalizeFileType(request.fileType),
    });

    // Call WatermarkService Python API
    const response = await axios.post(
      `${WATERMARK_SERVICE_URL}/detect`,
      formData,
      {
        timeout: WATERMARK_OPERATION_TIMEOUT_MS,
        headers: formData.getHeaders(),
      }
    );

    const processingTimeMs = Date.now() - startTime;
    const detectResult = response.data.result;

    // Update job with result
    await updateWatermarkJobResultQuery(
      jobId,
      {
        status: "completed",
        result: {
          has_watermark: detectResult.has_watermark,
          confidence: detectResult.confidence,
          message_bits: detectResult.message_bits,
        },
        processing_time_ms: processingTimeMs,
      },
      ctx.tenantId
    );

    return {
      jobId,
      status: "completed",
      hasWatermark: detectResult.has_watermark,
      confidence: detectResult.confidence,
      bitAccuracy: detectResult.confidence, // Use confidence as bit accuracy proxy
      processingTimeMs,
    };
  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    const internalErrorMessage =
      error instanceof Error ? error.message : "Unknown error during detection";

    // Log the full error for debugging
    logger.error(`Watermark detect failed for job ${jobId}: ${internalErrorMessage}`);

    // Update job with error
    await updateWatermarkJobResultQuery(
      jobId,
      {
        status: "failed",
        error_message: internalErrorMessage,
        processing_time_ms: processingTimeMs,
      },
      ctx.tenantId
    );

    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const details = error.response?.data?.detail || error.message;
      logger.error(`WatermarkService API error (${statusCode}): ${details}`);
      throw new ExternalServiceException(
        "Watermark service unavailable. Please try again later."
      );
    }

    throw new ExternalServiceException("Failed to detect watermark. Please try again.");
  }
}

/**
 * Get a watermark job by ID
 * Includes ownership verification to prevent horizontal privilege escalation
 */
export async function getWatermarkJob(
  jobId: number,
  ctx: IWatermarkServiceContext
): Promise<WatermarkJobResponse> {
  // Validate jobId is a positive integer
  if (!Number.isInteger(jobId) || jobId <= 0) {
    throw new ValidationException("Invalid job ID");
  }

  const job = await getWatermarkJobByIdQuery(jobId, ctx.tenantId);

  if (!job) {
    throw new NotFoundException(`Watermark job ${jobId} not found`);
  }

  // Verify ownership - prevent horizontal privilege escalation
  if (job.user_id !== ctx.userId) {
    throw new ForbiddenException("Access denied to this watermark job");
  }

  return {
    id: job.id!,
    user_id: job.user_id,
    type: job.type,
    status: job.status,
    input_file_name: job.input_file_name,
    input_file_type: job.input_file_type,
    input_file_size: job.input_file_size,
    output_file_id: job.output_file_id,
    model_id: job.model_id,
    project_id: job.project_id,
    evidence_id: job.evidence_id,
    settings: job.settings,
    result: job.result,
    error_message: job.error_message,
    processing_time_ms: job.processing_time_ms,
    created_at: job.created_at,
    completed_at: job.completed_at,
  };
}

/**
 * Get watermark jobs history for the current user
 */
export async function getWatermarkJobsHistory(
  ctx: IWatermarkServiceContext,
  options: {
    type?: WatermarkJobType;
    status?: WatermarkJobStatus;
    page?: number;
    limit?: number;
  } = {}
): Promise<{ jobs: WatermarkJobResponse[]; total: number; page: number; limit: number }> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(Math.max(1, options.limit || 20), 100);
  const offset = (page - 1) * limit;

  // Query already filters by userId in getWatermarkJobsHistoryQuery
  const result = await getWatermarkJobsHistoryQuery(ctx.tenantId, {
    userId: ctx.userId,
    type: options.type,
    status: options.status,
    limit,
    offset,
  });

  return {
    jobs: result.jobs.map((job) => ({
      id: job.id!,
      user_id: job.user_id,
      type: job.type,
      status: job.status,
      input_file_name: job.input_file_name,
      input_file_type: job.input_file_type,
      input_file_size: job.input_file_size,
      output_file_id: job.output_file_id,
      model_id: job.model_id,
      project_id: job.project_id,
      evidence_id: job.evidence_id,
      settings: job.settings,
      result: job.result,
      error_message: job.error_message,
      processing_time_ms: job.processing_time_ms,
      created_at: job.created_at,
      completed_at: job.completed_at,
    })),
    total: result.total,
    page,
    limit,
  };
}

/**
 * Get watermark job statistics for the current user
 */
export async function getWatermarkStats(
  ctx: IWatermarkServiceContext
): Promise<{
  total: number;
  embedCount: number;
  detectCount: number;
  completedCount: number;
  failedCount: number;
}> {
  const stats = await getWatermarkJobStatsQuery(ctx.tenantId, ctx.userId);

  return {
    total: stats.total,
    embedCount: stats.embed_count,
    detectCount: stats.detect_count,
    completedCount: stats.completed_count,
    failedCount: stats.failed_count,
  };
}

/**
 * Check if WatermarkService is healthy
 */
export async function checkWatermarkServiceHealth(): Promise<{
  status: "healthy" | "unhealthy";
  message: string;
}> {
  try {
    const response = await axios.get(`${WATERMARK_SERVICE_URL}/health`, {
      timeout: HEALTH_CHECK_TIMEOUT_MS,
    });

    return {
      status: response.data.status === "healthy" ? "healthy" : "unhealthy",
      message: response.data.message || "Service is running",
    };
  } catch (error) {
    logger.error(
      `WatermarkService health check failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    return {
      status: "unhealthy",
      message: "Watermark service unavailable",
    };
  }
}

// ============================================================================
// Article 50 Compliance Functions
// ============================================================================

/**
 * Embed watermark with full EU AI Act Article 50 compliance
 *
 * This function provides:
 * 1. Invisible watermark for robust detection
 * 2. C2PA Content Credentials for machine-readable provenance
 * 3. Full audit trail in database
 *
 * @param request - Image data with watermark and C2PA options
 * @param ctx - Service context (userId, tenantId)
 * @returns Fully compliant watermarked image with manifest
 */
export async function embedArticle50Watermark(
  request: Article50EmbedRequest,
  ctx: IWatermarkServiceContext
): Promise<Article50EmbedResult> {
  // Validate input
  validateFileSize(request);
  validateFileType(request.fileType);

  const sanitizedFileName = sanitizeFileName(request.fileName);

  // Create job record
  const job = await createWatermarkJobQuery(
    {
      user_id: ctx.userId,
      type: "embed",
      status: "pending",
      input_file_name: sanitizedFileName,
      input_file_type: normalizeFileType(request.fileType),
      input_file_size: request.fileSize,
      model_id: request.modelId,
      project_id: request.projectId,
      settings: {
        strength: request.strength || 1.0,
        enableC2PA: request.enableC2PA !== false,
        c2paOptions: request.c2paOptions,
        provenance: request.provenance,
      },
    },
    ctx.tenantId
  );

  if (!job.id) {
    throw new Error("Failed to create watermark job");
  }

  const jobId = job.id;
  const startTime = Date.now();

  try {
    await updateWatermarkJobStatusQuery(jobId, "processing", ctx.tenantId);

    // Call Article 50 compliant embed endpoint
    const result = await embedArticle50Compliant({
      imageBase64: request.imageBase64,
      fileName: sanitizedFileName,
      fileType: normalizeFileType(request.fileType),
      strength: request.strength,
      enableC2PA: request.enableC2PA !== false,
      c2paOptions: request.c2paOptions
        ? {
            digitalSourceType: request.c2paOptions.digitalSourceType,
            allowTraining: request.c2paOptions.allowTraining,
            allowMining: request.c2paOptions.allowMining,
          }
        : undefined,
      provenance: request.provenance
        ? {
            modelName: request.provenance.modelName,
            modelVersion: request.provenance.modelVersion,
            provider: request.provenance.provider,
            generationPromptHash: request.provenance.generationPromptHash,
          }
        : undefined,
    });

    const processingTimeMs = Date.now() - startTime;

    // Update job with result
    await updateWatermarkJobResultQuery(
      jobId,
      {
        status: "completed",
        result: {
          watermarked_image_base64: result.watermarkedImageBase64,
          c2pa_manifest_id: result.c2paManifestId,
          c2pa_manifest_applied: result.c2paManifestApplied,
          content_hash: result.contentHash,
          eu_ai_act_compliant: result.euAiActCompliant,
        },
        processing_time_ms: processingTimeMs,
      },
      ctx.tenantId
    );

    return {
      jobId,
      status: "completed",
      watermarkedImageBase64: result.watermarkedImageBase64,
      processingTimeMs,
      c2paManifestId: result.c2paManifestId,
      c2paManifestApplied: result.c2paManifestApplied,
      contentHash: result.contentHash,
      euAiActCompliant: result.euAiActCompliant,
    };
  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    logger.error(`Article 50 embed failed for job ${jobId}: ${errorMessage}`);

    await updateWatermarkJobResultQuery(
      jobId,
      {
        status: "failed",
        error_message: errorMessage,
        processing_time_ms: processingTimeMs,
      },
      ctx.tenantId
    );

    if (axios.isAxiosError(error)) {
      throw new ExternalServiceException(
        "Watermark service unavailable. Please try again later."
      );
    }

    throw new ExternalServiceException(
      "Failed to embed Article 50 compliant watermark."
    );
  }
}

/**
 * Comprehensive detection with watermark and C2PA verification
 *
 * Provides full Article 50 compliance verification including:
 * 1. Invisible watermark detection with confidence levels
 * 2. C2PA manifest verification
 * 3. Combined AI-generated assessment
 *
 * @param request - Image data to analyze
 * @param ctx - Service context
 * @returns Comprehensive detection result with assessment
 */
export async function detectComprehensive(
  request: DetectWatermarkRequest,
  ctx: IWatermarkServiceContext
): Promise<ComprehensiveDetectResult> {
  // First, do standard watermark detection
  const watermarkResult = await detectWatermark(request, ctx);

  // Then verify C2PA manifest
  let c2paResult: C2PAVerifyResult | undefined;
  try {
    c2paResult = await verifyC2PAManifest(request.imageBase64);
  } catch (error) {
    logger.warn("C2PA verification failed, continuing with watermark only", {
      error,
    });
  }

  // Calculate confidence level
  const confidenceLevel = getConfidenceLevel(watermarkResult.confidence);

  // Determine AI-generated assessment
  const { assessment, reasoning } = determineAIGeneratedAssessment(
    watermarkResult.confidence,
    c2paResult
  );

  // Build comprehensive result
  const result: ComprehensiveDetectResult = {
    ...watermarkResult,
    confidenceLevel,
    confidenceThresholds: {
      high: CONFIDENCE_THRESHOLDS.HIGH,
      medium: CONFIDENCE_THRESHOLDS.MEDIUM,
      low: CONFIDENCE_THRESHOLDS.LOW,
    },
    aiGeneratedAssessment: assessment,
    assessmentReasoning: reasoning,
  };

  // Add C2PA data if available
  if (c2paResult) {
    result.c2pa = {
      manifestFound: c2paResult.manifestFound,
      signatureValid: c2paResult.signatureValid,
      chainVerified: c2paResult.chainVerified,
      digitalSourceType: c2paResult.manifestData?.digitalSourceType,
      generatorInfo: c2paResult.manifestData?.generatorInfo,
      aiModelInfo: c2paResult.manifestData?.aiModelInfo,
    };
  }

  return result;
}
