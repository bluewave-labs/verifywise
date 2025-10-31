import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { encryptText, decryptText } from "../tools/createSecureValue";
import { axiosWithRetry } from "../utils/axiosRetry.utils";
import type {
  EvidentlyConfigResponse,
  TestConnectionResponse,
  MonitoredModel,
} from "../types/evidently.types";
import {
  getEvidentlyConfigByOrganizationId,
  createEvidentlyConfig,
  updateEvidentlyConfig,
  deleteEvidentlyConfig,
  getMonitoredModels,
} from "../utils/evidentlyConfig.utils";
import {
  getCacheStats,
  invalidateCache,
  cleanOldCache,
} from "../utils/metricsCache.utils";
import {
  ValidationException,
  NotFoundException,
} from "../domain.layer/exceptions/custom.exception";

const fileName = "evidentlyConfig.ctrl.ts";
const PYTHON_SERVICE_URL =
  process.env.EVIDENTLY_SERVICE_URL || "http://localhost:8001";

/**
 * Get Evidently configuration for the user's organization
 */
export async function getEvidentlyConfig(
  req: Request,
  res: Response
): Promise<any> {
  const functionName = "getEvidentlyConfig";
  logStructured(
    "processing",
    "Getting Evidently configuration",
    functionName,
    fileName
  );

  try {
    const organizationId = (req as any).user?.organizationId;

    if (!organizationId) {
      return res
        .status(400)
        .json(STATUS_CODE[400]("Organization ID not found in token"));
    }

    const config = await getEvidentlyConfigByOrganizationId(organizationId);

    if (!config) {
      logStructured(
        "successful",
        "No configuration found",
        functionName,
        fileName
      );
      return res.status(404).json(STATUS_CODE[404]("Configuration not found"));
    }

    // Return config without decrypted token
    const response = {
      id: config.id,
      evidently_url: config.evidently_url,
      is_configured: config.is_configured,
      last_test_date: config.last_test_date,
      created_at: config.created_at,
      updated_at: config.updated_at,
    };

    logStructured(
      "successful",
      "Successfully retrieved configuration",
      functionName,
      fileName
    );

    return res.status(200).json(STATUS_CODE[200](response));
  } catch (error: any) {
    logStructured(
      "error",
      `Failed to get configuration: ${error.message}`,
      functionName,
      fileName
    );

    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    return res.status(500).json(STATUS_CODE[500](error.message));
  }
}

/**
 * Create or update Evidently configuration
 */
export async function saveEvidentlyConfig(
  req: Request,
  res: Response
): Promise<any> {
  const functionName = "saveEvidentlyConfig";
  logStructured(
    "processing",
    "Saving Evidently configuration",
    functionName,
    fileName
  );

  try {
    const { evidently_url, api_token } = req.body;
    const userId = (req as any).user?.id;
    const organizationId = (req as any).user?.organizationId;

    if (!userId || !organizationId) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400]("User ID or Organization ID not found in token")
        );
    }

    if (!api_token) {
      return res.status(400).json(STATUS_CODE[400]("api_token is required"));
    }

    // Test connection before saving
    logStructured(
      "processing",
      "Testing Evidently connection before saving",
      functionName,
      fileName
    );

    try {
      await axiosWithRetry.post<TestConnectionResponse>(
        `${PYTHON_SERVICE_URL}/api/evidently/test-connection`,
        { url: evidently_url || "https://app.evidently.cloud", api_token },
        { timeout: 30000 }
      );
    } catch (testError: any) {
      logStructured(
        "error",
        "Connection test failed",
        functionName,
        fileName
      );
      return res
        .status(400)
        .json(
          STATUS_CODE[400](
            `Connection test failed: ${testError.response?.data?.detail || testError.message || "Invalid credentials"}`
          )
        );
    }

    // Encrypt the API token
    const encrypted = encryptText(api_token);

    // Check if config exists
    const existing = await getEvidentlyConfigByOrganizationId(organizationId);

    let config;
    if (existing) {
      // Update existing
      config = await updateEvidentlyConfig(organizationId, {
        evidently_url: evidently_url || "https://app.evidently.cloud",
        api_token_encrypted: encrypted.value,
        api_token_iv: encrypted.iv,
        is_configured: true,
        last_test_date: new Date(),
      });
      logStructured(
        "successful",
        "Configuration updated successfully",
        functionName,
        fileName
      );
    } else {
      // Create new
      config = await createEvidentlyConfig({
        user_id: userId,
        organization_id: organizationId,
        evidently_url: evidently_url || "https://app.evidently.cloud",
        api_token_encrypted: encrypted.value,
        api_token_iv: encrypted.iv,
        is_configured: true,
      });
      logStructured(
        "successful",
        "Configuration created successfully",
        functionName,
        fileName
      );
    }

    // Return config without decrypted token
    const response = {
      id: config.id,
      evidently_url: config.evidently_url,
      is_configured: config.is_configured,
      last_test_date: config.last_test_date,
      created_at: config.created_at,
      updated_at: config.updated_at,
    };

    return res.status(200).json(STATUS_CODE[200](response));
  } catch (error: any) {
    logStructured(
      "error",
      `Failed to save configuration: ${error.message}`,
      functionName,
      fileName
    );

    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    return res.status(500).json(STATUS_CODE[500](error.message));
  }
}

/**
 * Delete Evidently configuration
 */
export async function removeEvidentlyConfig(
  req: Request,
  res: Response
): Promise<any> {
  const functionName = "removeEvidentlyConfig";
  logStructured(
    "processing",
    "Deleting Evidently configuration",
    functionName,
    fileName
  );

  try {
    const organizationId = (req as any).user?.organizationId;

    if (!organizationId) {
      return res
        .status(400)
        .json(STATUS_CODE[400]("Organization ID not found in token"));
    }

    await deleteEvidentlyConfig(organizationId);

    logStructured(
      "successful",
      "Configuration deleted successfully",
      functionName,
      fileName
    );

    return res
      .status(200)
      .json(STATUS_CODE[200]({ message: "Configuration deleted successfully" }));
  } catch (error: any) {
    logStructured(
      "error",
      `Failed to delete configuration: ${error.message}`,
      functionName,
      fileName
    );

    if (error instanceof NotFoundException) {
      return res.status(404).json(STATUS_CODE[404](error.message));
    }

    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    return res.status(500).json(STATUS_CODE[500](error.message));
  }
}

/**
 * Test Evidently connection (without saving)
 */
export async function testConnection(
  req: Request,
  res: Response
): Promise<any> {
  const functionName = "testConnection";
  logStructured(
    "processing",
    "Testing Evidently connection",
    functionName,
    fileName
  );

  try {
    const { evidently_url, api_token } = req.body;

    if (!api_token) {
      return res.status(400).json(STATUS_CODE[400]("api_token is required"));
    }

    const response = await axiosWithRetry.post<TestConnectionResponse>(
      `${PYTHON_SERVICE_URL}/api/evidently/test-connection`,
      { url: evidently_url || "https://app.evidently.cloud", api_token },
      { timeout: 30000 }
    );

    logStructured(
      "successful",
      "Connection test successful",
      functionName,
      fileName
    );

    return res.status(200).json(STATUS_CODE[200](response.data));
  } catch (error: any) {
    logStructured(
      "error",
      `Connection test failed: ${error.message}`,
      functionName,
      fileName
    );

    const errorMessage =
      error.response?.data?.detail ||
      error.message ||
      "Connection test failed";

    return res.status(400).json(STATUS_CODE[400](errorMessage));
  }
}

/**
 * Get all monitored models
 */
export async function listMonitoredModels(
  req: Request,
  res: Response
): Promise<any> {
  const functionName = "listMonitoredModels";
  logStructured(
    "processing",
    "Listing monitored models",
    functionName,
    fileName
  );

  try {
    const organizationId = (req as any).user?.organizationId;

    if (!organizationId) {
      return res
        .status(400)
        .json(STATUS_CODE[400]("Organization ID not found in token"));
    }

    const models = await getMonitoredModels(organizationId);

    logStructured(
      "successful",
      `Found ${models.length} monitored models`,
      functionName,
      fileName
    );

    return res.status(200).json(STATUS_CODE[200](models));
  } catch (error: any) {
    logStructured(
      "error",
      `Failed to list models: ${error.message}`,
      functionName,
      fileName
    );

    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    return res.status(500).json(STATUS_CODE[500](error.message));
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStatistics(
  req: Request,
  res: Response
): Promise<any> {
  const functionName = "getCacheStatistics";
  logStructured(
    "processing",
    "Getting cache statistics",
    functionName,
    fileName
  );

  try {
    const organizationId = (req as any).user?.organizationId;

    if (!organizationId) {
      return res
        .status(400)
        .json(STATUS_CODE[400]("Organization ID not found in token"));
    }

    const stats = await getCacheStats(organizationId);

    logStructured(
      "successful",
      `Retrieved cache stats: ${stats.totalCachedMetrics} metrics, ${stats.totalModels} models`,
      functionName,
      fileName
    );

    return res.status(200).json(STATUS_CODE[200](stats));
  } catch (error: any) {
    logStructured(
      "error",
      `Failed to get cache stats: ${error.message}`,
      functionName,
      fileName
    );

    return res.status(500).json(STATUS_CODE[500](error.message));
  }
}

/**
 * Invalidate cache for a specific project
 */
export async function invalidateProjectCache(
  req: Request,
  res: Response
): Promise<any> {
  const functionName = "invalidateProjectCache";
  const projectId = req.params.projectId;

  logStructured(
    "processing",
    `Invalidating cache for project: ${projectId}`,
    functionName,
    fileName
  );

  try {
    const organizationId = (req as any).user?.organizationId;

    if (!organizationId) {
      return res
        .status(400)
        .json(STATUS_CODE[400]("Organization ID not found in token"));
    }

    await invalidateCache(organizationId, projectId);

    logStructured(
      "successful",
      `Cache invalidated for project ${projectId}`,
      functionName,
      fileName
    );

    return res
      .status(200)
      .json(
        STATUS_CODE[200]({ message: `Cache invalidated for project ${projectId}` })
      );
  } catch (error: any) {
    logStructured(
      "error",
      `Failed to invalidate cache: ${error.message}`,
      functionName,
      fileName
    );

    return res.status(500).json(STATUS_CODE[500](error.message));
  }
}

/**
 * Clean up old cached metrics (>7 days)
 */
export async function cleanupOldCache(
  req: Request,
  res: Response
): Promise<any> {
  const functionName = "cleanupOldCache";
  logStructured(
    "processing",
    "Cleaning up old cached metrics",
    functionName,
    fileName
  );

  try {
    const deleted = await cleanOldCache();

    logStructured(
      "successful",
      `Cleaned up ${deleted} old cached metrics`,
      functionName,
      fileName
    );

    return res
      .status(200)
      .json(
        STATUS_CODE[200]({ message: `Cleaned up ${deleted} old cached metrics`, deleted })
      );
  } catch (error: any) {
    logStructured(
      "error",
      `Failed to cleanup old cache: ${error.message}`,
      functionName,
      fileName
    );

    return res.status(500).json(STATUS_CODE[500](error.message));
  }
}
