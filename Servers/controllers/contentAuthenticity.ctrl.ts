/**
 * @fileoverview Content Authenticity Controller
 *
 * HTTP request handlers for Content Authenticity (watermark) endpoints.
 * Follows the established controller pattern with logging and status codes.
 *
 * @module controllers/contentAuthenticity
 */

import { Request, Response } from "express";
import {
  logProcessing,
  logSuccess,
  logFailure as logError,
} from "../utils/logger/logHelper";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { getTenantHash } from "../tools/getTenantHash";
import {
  ValidationException,
  NotFoundException,
  ForbiddenException,
  ExternalServiceException,
} from "../domain.layer/exceptions/custom.exception";
import {
  embedWatermark,
  detectWatermark,
  getWatermarkJob,
  getWatermarkJobsHistory,
  getWatermarkStats,
  checkWatermarkServiceHealth,
  embedArticle50Watermark,
  detectComprehensive,
  IWatermarkServiceContext,
} from "../services/watermark/contentAuthenticity.service";
import {
  testWatermarkRobustness,
  testSingleTransformation,
  TransformationType,
} from "../services/watermark/robustness.service";
import {
  createRealC2PACredentials,
  verifyRealC2PACredentials,
  getCertificateInfo,
  getC2PAStatus,
} from "../services/watermark/c2pa.service";
import {
  WatermarkJobStatus,
  WatermarkJobType,
} from "../domain.layer/models/watermarkJob/watermarkJob.model";

const FILE_NAME = "contentAuthenticity.ctrl.ts";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build service context from request
 * Validates that authentication middleware has properly set user context
 */
function buildServiceContext(req: Request): IWatermarkServiceContext | null {
  const userId = (req as unknown as { userId: number }).userId;
  const organizationId = (req as unknown as { organizationId: number }).organizationId;

  if (!userId || !organizationId) {
    return null;
  }

  return {
    userId,
    tenantId: getTenantHash(organizationId),
  };
}

/**
 * Handle service exceptions and send appropriate response
 * Avoids leaking internal error details to clients
 */
function handleException(res: Response, error: unknown): Response {
  if (error instanceof ValidationException) {
    return res.status(400).json(STATUS_CODE[400](error.message));
  }
  if (error instanceof ForbiddenException) {
    return res.status(403).json(STATUS_CODE[403](error.message));
  }
  if (error instanceof NotFoundException) {
    return res.status(404).json(STATUS_CODE[404](error.message));
  }
  if (error instanceof ExternalServiceException) {
    return res.status(502).json(STATUS_CODE[502](error.message));
  }

  // Don't leak internal error details - return generic message
  return res.status(500).json(STATUS_CODE[500]("An unexpected error occurred"));
}

// ============================================================================
// Controller Functions
// ============================================================================

/**
 * Embed watermark into an image
 *
 * POST /content-authenticity/embed
 * Body: { image_base64: string, file_name: string, file_type: string, file_size?: number, strength?: number, model_id?: number, project_id?: number }
 */
export async function embedWatermarkController(
  req: Request,
  res: Response
): Promise<Response> {
  const ctx = buildServiceContext(req);
  if (!ctx) {
    return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
  }

  logProcessing({
    description: "Embedding watermark into image",
    functionName: "embedWatermarkController",
    fileName: FILE_NAME,
    userId: ctx.userId,
    tenantId: ctx.tenantId,
  });

  try {
    const {
      image_base64,
      file_name,
      file_type,
      file_size,
      strength,
      model_id,
      project_id,
    } = req.body;

    if (!image_base64) {
      return res.status(400).json(STATUS_CODE[400]("image_base64 is required"));
    }
    if (!file_name) {
      return res.status(400).json(STATUS_CODE[400]("file_name is required"));
    }
    if (!file_type) {
      return res.status(400).json(STATUS_CODE[400]("file_type is required"));
    }

    // Validate strength if provided
    if (strength !== undefined && (typeof strength !== "number" || strength < 0.1 || strength > 2.0)) {
      return res.status(400).json(STATUS_CODE[400]("strength must be a number between 0.1 and 2.0"));
    }

    const result = await embedWatermark(
      {
        imageBase64: image_base64,
        fileName: file_name,
        fileType: file_type,
        fileSize: file_size,
        strength,
        modelId: model_id,
        projectId: project_id,
      },
      ctx
    );

    await logSuccess({
      eventType: "Create",
      description: `Embedded watermark into image: ${file_name}`,
      functionName: "embedWatermarkController",
      fileName: FILE_NAME,
      userId: ctx.userId,
      tenantId: ctx.tenantId,
    });

    // Return 200 OK - watermark embedding is a transformation, not resource creation
    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    await logError({
      error: error as Error,
      eventType: "Create",
      description: "Failed to embed watermark",
      functionName: "embedWatermarkController",
      fileName: FILE_NAME,
      userId: ctx.userId,
      tenantId: ctx.tenantId,
    });
    return handleException(res, error);
  }
}

/**
 * Detect watermark in an image
 *
 * POST /content-authenticity/detect
 * Body: { image_base64: string, file_name: string, file_type: string, file_size?: number }
 */
export async function detectWatermarkController(
  req: Request,
  res: Response
): Promise<Response> {
  const ctx = buildServiceContext(req);
  if (!ctx) {
    return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
  }

  logProcessing({
    description: "Detecting watermark in image",
    functionName: "detectWatermarkController",
    fileName: FILE_NAME,
    userId: ctx.userId,
    tenantId: ctx.tenantId,
  });

  try {
    const { image_base64, file_name, file_type, file_size } = req.body;

    if (!image_base64) {
      return res.status(400).json(STATUS_CODE[400]("image_base64 is required"));
    }
    if (!file_name) {
      return res.status(400).json(STATUS_CODE[400]("file_name is required"));
    }
    if (!file_type) {
      return res.status(400).json(STATUS_CODE[400]("file_type is required"));
    }

    const result = await detectWatermark(
      {
        imageBase64: image_base64,
        fileName: file_name,
        fileType: file_type,
        fileSize: file_size,
      },
      ctx
    );

    await logSuccess({
      eventType: "Read",
      description: `Detected watermark in image: ${file_name} - Has watermark: ${result.hasWatermark}`,
      functionName: "detectWatermarkController",
      fileName: FILE_NAME,
      userId: ctx.userId,
      tenantId: ctx.tenantId,
    });

    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    await logError({
      error: error as Error,
      eventType: "Read",
      description: "Failed to detect watermark",
      functionName: "detectWatermarkController",
      fileName: FILE_NAME,
      userId: ctx.userId,
      tenantId: ctx.tenantId,
    });
    return handleException(res, error);
  }
}

/**
 * Get a watermark job by ID
 *
 * GET /content-authenticity/jobs/:jobId
 */
export async function getWatermarkJobController(
  req: Request,
  res: Response
): Promise<Response> {
  const ctx = buildServiceContext(req);
  if (!ctx) {
    return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
  }

  logProcessing({
    description: "Getting watermark job details",
    functionName: "getWatermarkJobController",
    fileName: FILE_NAME,
    userId: ctx.userId,
    tenantId: ctx.tenantId,
  });

  try {
    const jobId = parseInt(req.params.jobId, 10);

    if (isNaN(jobId) || jobId <= 0) {
      return res.status(400).json(STATUS_CODE[400]("Invalid job ID"));
    }

    const job = await getWatermarkJob(jobId, ctx);

    return res.status(200).json(STATUS_CODE[200](job));
  } catch (error) {
    return handleException(res, error);
  }
}

/**
 * Get watermark jobs history
 *
 * GET /content-authenticity/jobs
 * Query: type, status, page, limit
 */
export async function getWatermarkJobsController(
  req: Request,
  res: Response
): Promise<Response> {
  const ctx = buildServiceContext(req);
  if (!ctx) {
    return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
  }

  logProcessing({
    description: "Getting watermark jobs history",
    functionName: "getWatermarkJobsController",
    fileName: FILE_NAME,
    userId: ctx.userId,
    tenantId: ctx.tenantId,
  });

  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
    const type = req.query.type as WatermarkJobType | undefined;
    const status = req.query.status as WatermarkJobStatus | undefined;

    // Validate type if provided
    if (type && !["embed", "detect"].includes(type)) {
      return res
        .status(400)
        .json(STATUS_CODE[400]("type must be 'embed' or 'detect'"));
    }

    // Validate status if provided
    if (
      status &&
      !["pending", "processing", "completed", "failed"].includes(status)
    ) {
      return res.status(400).json(STATUS_CODE[400]("Invalid status filter"));
    }

    const result = await getWatermarkJobsHistory(ctx, {
      type,
      status,
      page,
      limit,
    });

    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    return handleException(res, error);
  }
}

/**
 * Get watermark statistics
 *
 * GET /content-authenticity/stats
 */
export async function getWatermarkStatsController(
  req: Request,
  res: Response
): Promise<Response> {
  const ctx = buildServiceContext(req);
  if (!ctx) {
    return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
  }

  logProcessing({
    description: "Getting watermark statistics",
    functionName: "getWatermarkStatsController",
    fileName: FILE_NAME,
    userId: ctx.userId,
    tenantId: ctx.tenantId,
  });

  try {
    const stats = await getWatermarkStats(ctx);

    return res.status(200).json(STATUS_CODE[200](stats));
  } catch (error) {
    return handleException(res, error);
  }
}

/**
 * Check WatermarkService health
 *
 * GET /content-authenticity/health
 */
export async function healthCheckController(
  _req: Request,
  res: Response
): Promise<Response> {
  try {
    const health = await checkWatermarkServiceHealth();

    const statusCode = health.status === "healthy" ? 200 : 503;
    return res.status(statusCode).json({
      status: health.status,
      message: health.message,
      service: "content-authenticity",
    });
  } catch (error) {
    return res.status(503).json({
      status: "unhealthy",
      message: "Health check failed",
      service: "content-authenticity",
    });
  }
}

// ============================================================================
// Article 50 Compliance Controllers
// ============================================================================

/**
 * Embed watermark with full EU AI Act Article 50 compliance
 *
 * POST /content-authenticity/embed/article50
 * Body: { image_base64, file_name, file_type, strength?, enable_c2pa?, c2pa_options?, provenance? }
 */
export async function embedArticle50Controller(
  req: Request,
  res: Response
): Promise<Response> {
  const ctx = buildServiceContext(req);
  if (!ctx) {
    return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
  }

  logProcessing({
    description: "Embedding Article 50 compliant watermark",
    functionName: "embedArticle50Controller",
    fileName: FILE_NAME,
    userId: ctx.userId,
    tenantId: ctx.tenantId,
  });

  try {
    const {
      image_base64,
      file_name,
      file_type,
      file_size,
      strength,
      model_id,
      project_id,
      enable_c2pa,
      c2pa_options,
      provenance,
    } = req.body;

    if (!image_base64) {
      return res.status(400).json(STATUS_CODE[400]("image_base64 is required"));
    }
    if (!file_name) {
      return res.status(400).json(STATUS_CODE[400]("file_name is required"));
    }
    if (!file_type) {
      return res.status(400).json(STATUS_CODE[400]("file_type is required"));
    }

    const result = await embedArticle50Watermark(
      {
        imageBase64: image_base64,
        fileName: file_name,
        fileType: file_type,
        fileSize: file_size,
        strength,
        modelId: model_id,
        projectId: project_id,
        enableC2PA: enable_c2pa,
        c2paOptions: c2pa_options,
        provenance,
      },
      ctx
    );

    await logSuccess({
      eventType: "Create",
      description: `Embedded Article 50 compliant watermark: ${file_name} (EU AI Act: ${result.euAiActCompliant})`,
      functionName: "embedArticle50Controller",
      fileName: FILE_NAME,
      userId: ctx.userId,
      tenantId: ctx.tenantId,
    });

    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    await logError({
      error: error as Error,
      eventType: "Create",
      description: "Failed to embed Article 50 compliant watermark",
      functionName: "embedArticle50Controller",
      fileName: FILE_NAME,
      userId: ctx.userId,
      tenantId: ctx.tenantId,
    });
    return handleException(res, error);
  }
}

/**
 * Comprehensive detection with watermark and C2PA verification
 *
 * POST /content-authenticity/detect/comprehensive
 * Body: { image_base64, file_name, file_type, file_size? }
 */
export async function detectComprehensiveController(
  req: Request,
  res: Response
): Promise<Response> {
  const ctx = buildServiceContext(req);
  if (!ctx) {
    return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
  }

  logProcessing({
    description: "Comprehensive AI content detection",
    functionName: "detectComprehensiveController",
    fileName: FILE_NAME,
    userId: ctx.userId,
    tenantId: ctx.tenantId,
  });

  try {
    const { image_base64, file_name, file_type, file_size } = req.body;

    if (!image_base64) {
      return res.status(400).json(STATUS_CODE[400]("image_base64 is required"));
    }
    if (!file_name) {
      return res.status(400).json(STATUS_CODE[400]("file_name is required"));
    }
    if (!file_type) {
      return res.status(400).json(STATUS_CODE[400]("file_type is required"));
    }

    const result = await detectComprehensive(
      {
        imageBase64: image_base64,
        fileName: file_name,
        fileType: file_type,
        fileSize: file_size,
      },
      ctx
    );

    await logSuccess({
      eventType: "Read",
      description: `Comprehensive detection: ${file_name} - Assessment: ${result.aiGeneratedAssessment}`,
      functionName: "detectComprehensiveController",
      fileName: FILE_NAME,
      userId: ctx.userId,
      tenantId: ctx.tenantId,
    });

    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    await logError({
      error: error as Error,
      eventType: "Read",
      description: "Failed to perform comprehensive detection",
      functionName: "detectComprehensiveController",
      fileName: FILE_NAME,
      userId: ctx.userId,
      tenantId: ctx.tenantId,
    });
    return handleException(res, error);
  }
}

/**
 * Get confidence threshold configuration
 *
 * GET /content-authenticity/confidence/thresholds
 */
export async function getConfidenceThresholdsController(
  _req: Request,
  res: Response
): Promise<Response> {
  return res.status(200).json(STATUS_CODE[200]({
    thresholds: {
      high: 0.85,
      medium: 0.65,
      low: 0.50,
    },
    levels: {
      high: "Definite AI-generated content. Watermark clearly detected with high accuracy.",
      medium: "Likely AI-generated content. Watermark detected but may have undergone transformation.",
      low: "Possibly AI-generated content. Weak watermark signal, may have been heavily modified.",
      none: "No watermark detected. Content may be human-created or watermark was removed.",
    },
    assessments: {
      confirmed: "Content is confirmed as AI-generated (valid C2PA manifest or high confidence watermark).",
      likely: "Content is likely AI-generated (medium confidence watermark detection).",
      possible: "Content is possibly AI-generated (low confidence or tampered manifest).",
      undetected: "AI origin cannot be determined (no watermark or manifest found).",
    },
  }));
}

// ============================================================================
// Robustness Testing Controllers
// ============================================================================

/**
 * Test watermark robustness against various transformations
 *
 * POST /content-authenticity/robustness/test
 * Body: { image_base64: string, quick_test?: boolean }
 */
export async function testRobustnessController(
  req: Request,
  res: Response
): Promise<Response> {
  const ctx = buildServiceContext(req);
  if (!ctx) {
    return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
  }

  logProcessing({
    description: "Testing watermark robustness",
    functionName: "testRobustnessController",
    fileName: FILE_NAME,
    userId: ctx.userId,
    tenantId: ctx.tenantId,
  });

  try {
    const { image_base64, quick_test } = req.body;

    if (!image_base64) {
      return res.status(400).json(STATUS_CODE[400]("image_base64 is required"));
    }

    const result = await testWatermarkRobustness(image_base64, quick_test || false);

    await logSuccess({
      eventType: "Read",
      description: `Robustness test completed: ${result.transformationsPassed}/${result.transformationsTested} passed (${(result.overallRobustnessScore * 100).toFixed(1)}%)`,
      functionName: "testRobustnessController",
      fileName: FILE_NAME,
      userId: ctx.userId,
      tenantId: ctx.tenantId,
    });

    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    await logError({
      error: error as Error,
      eventType: "Read",
      description: "Failed to test watermark robustness",
      functionName: "testRobustnessController",
      fileName: FILE_NAME,
      userId: ctx.userId,
      tenantId: ctx.tenantId,
    });
    return handleException(res, error);
  }
}

/**
 * Test watermark survival against a single transformation
 *
 * POST /content-authenticity/robustness/transform
 * Body: { image_base64: string, transformation_type: string, parameters?: object }
 */
export async function testSingleTransformationController(
  req: Request,
  res: Response
): Promise<Response> {
  const ctx = buildServiceContext(req);
  if (!ctx) {
    return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
  }

  logProcessing({
    description: "Testing single transformation",
    functionName: "testSingleTransformationController",
    fileName: FILE_NAME,
    userId: ctx.userId,
    tenantId: ctx.tenantId,
  });

  try {
    const { image_base64, transformation_type, parameters } = req.body;

    if (!image_base64) {
      return res.status(400).json(STATUS_CODE[400]("image_base64 is required"));
    }
    if (!transformation_type) {
      return res.status(400).json(STATUS_CODE[400]("transformation_type is required"));
    }

    const validTypes = [
      "jpeg_compression",
      "resize",
      "crop",
      "rotation",
      "brightness",
      "contrast",
      "noise",
      "blur",
      "format",
    ];
    if (!validTypes.includes(transformation_type)) {
      return res.status(400).json(
        STATUS_CODE[400](`Invalid transformation_type. Valid types: ${validTypes.join(", ")}`)
      );
    }

    const result = await testSingleTransformation(
      image_base64,
      transformation_type as TransformationType,
      parameters || {}
    );

    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    await logError({
      error: error as Error,
      eventType: "Read",
      description: "Failed to test single transformation",
      functionName: "testSingleTransformationController",
      fileName: FILE_NAME,
      userId: ctx.userId,
      tenantId: ctx.tenantId,
    });
    return handleException(res, error);
  }
}

// ============================================================================
// C2PA v2 Controllers (Real c2pa-python implementation)
// ============================================================================

/**
 * Create real C2PA Content Credentials
 *
 * POST /content-authenticity/c2pa/v2/create
 * Body: { image_base64, format, model_name, model_version, provider, prompt_hash?, title? }
 */
export async function createC2PAV2Controller(
  req: Request,
  res: Response
): Promise<Response> {
  const ctx = buildServiceContext(req);
  if (!ctx) {
    return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
  }

  logProcessing({
    description: "Creating real C2PA Content Credentials",
    functionName: "createC2PAV2Controller",
    fileName: FILE_NAME,
    userId: ctx.userId,
    tenantId: ctx.tenantId,
  });

  try {
    const {
      image_base64,
      format,
      model_name,
      model_version,
      provider,
      prompt_hash,
      title,
    } = req.body;

    if (!image_base64) {
      return res.status(400).json(STATUS_CODE[400]("image_base64 is required"));
    }
    if (!model_name) {
      return res.status(400).json(STATUS_CODE[400]("model_name is required"));
    }
    if (!model_version) {
      return res.status(400).json(STATUS_CODE[400]("model_version is required"));
    }
    if (!provider) {
      return res.status(400).json(STATUS_CODE[400]("provider is required"));
    }

    const result = await createRealC2PACredentials({
      imageBase64: image_base64,
      format: format || "png",
      modelName: model_name,
      modelVersion: model_version,
      provider: provider,
      promptHash: prompt_hash,
      title: title,
    });

    await logSuccess({
      eventType: "Create",
      description: `Created C2PA Content Credentials (using real c2pa: ${result.usingRealC2PA})`,
      functionName: "createC2PAV2Controller",
      fileName: FILE_NAME,
      userId: ctx.userId,
      tenantId: ctx.tenantId,
    });

    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    await logError({
      error: error as Error,
      eventType: "Create",
      description: "Failed to create C2PA Content Credentials",
      functionName: "createC2PAV2Controller",
      fileName: FILE_NAME,
      userId: ctx.userId,
      tenantId: ctx.tenantId,
    });
    return handleException(res, error);
  }
}

/**
 * Verify real C2PA Content Credentials
 *
 * POST /content-authenticity/c2pa/v2/verify
 * Body: { image_base64, format? }
 */
export async function verifyC2PAV2Controller(
  req: Request,
  res: Response
): Promise<Response> {
  const ctx = buildServiceContext(req);
  if (!ctx) {
    return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
  }

  logProcessing({
    description: "Verifying real C2PA Content Credentials",
    functionName: "verifyC2PAV2Controller",
    fileName: FILE_NAME,
    userId: ctx.userId,
    tenantId: ctx.tenantId,
  });

  try {
    const { image_base64, format } = req.body;

    if (!image_base64) {
      return res.status(400).json(STATUS_CODE[400]("image_base64 is required"));
    }

    const result = await verifyRealC2PACredentials(image_base64, format || "png");

    await logSuccess({
      eventType: "Read",
      description: `Verified C2PA Content Credentials: valid=${result.isValid}, ai_generated=${result.isAiGenerated}`,
      functionName: "verifyC2PAV2Controller",
      fileName: FILE_NAME,
      userId: ctx.userId,
      tenantId: ctx.tenantId,
    });

    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    await logError({
      error: error as Error,
      eventType: "Read",
      description: "Failed to verify C2PA Content Credentials",
      functionName: "verifyC2PAV2Controller",
      fileName: FILE_NAME,
      userId: ctx.userId,
      tenantId: ctx.tenantId,
    });
    return handleException(res, error);
  }
}

/**
 * Get C2PA signing certificate information
 *
 * GET /content-authenticity/c2pa/certificate
 */
export async function getCertificateInfoController(
  _req: Request,
  res: Response
): Promise<Response> {
  try {
    const info = await getCertificateInfo();

    return res.status(200).json(STATUS_CODE[200](info));
  } catch (error) {
    return res.status(502).json(STATUS_CODE[502]("Failed to get certificate information"));
  }
}

/**
 * Get C2PA service status
 *
 * GET /content-authenticity/c2pa/status
 */
export async function getC2PAStatusController(
  _req: Request,
  res: Response
): Promise<Response> {
  try {
    const status = await getC2PAStatus();

    return res.status(200).json(STATUS_CODE[200](status));
  } catch (error) {
    return res.status(200).json(STATUS_CODE[200]({
      c2paLibraryAvailable: false,
      certificateLoaded: false,
      signingAlgorithm: "PS256",
      timestampServer: "http://timestamp.digicert.com",
    }));
  }
}
