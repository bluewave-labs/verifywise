import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { axiosWithRetry } from "../utils/axiosRetry.utils";
import {
  getCachedMetrics,
  setCachedMetrics,
  invalidateCache,
} from "../utils/metricsCache.utils";
import type {
  ListProjectsResponse,
  ProjectDetailsResponse,
  DriftMetricsResponse,
  PerformanceMetricsResponse,
  FairnessMetricsResponse,
  BulkSyncResponse,
  MetricType,
  HealthStatus,
} from "../types/evidently.types";

const fileName = "evidently.ctrl.ts";

// Python service URL
const PYTHON_SERVICE_URL =
  process.env.EVIDENTLY_SERVICE_URL || "http://localhost:8001";

/**
 * List all Evidently projects
 */
export async function listEvidentlyProjects(
  req: Request,
  res: Response
): Promise<any> {
  const functionName = "listEvidentlyProjects";
  logStructured(
    "processing",
    "Listing Evidently projects",
    functionName,
    fileName
  );

  try {
    const { url, apiToken } = (req as any).evidentlyConfig;

    // Proxy request to Python service with retry logic
    const response = await axiosWithRetry.post<ListProjectsResponse>(
      `${PYTHON_SERVICE_URL}/api/evidently/projects`,
      { url, api_token: apiToken },
      { timeout: 30000 }
    );

    logStructured(
      "successful",
      `Successfully retrieved ${response.data.projects?.length || 0} projects`,
      functionName,
      fileName
    );

    return res.status(200).json(STATUS_CODE[200](response.data));
  } catch (error: any) {
    logStructured(
      "error",
      `Failed to list projects: ${error.message}`,
      functionName,
      fileName
    );

    // Handle different error types
    if (error.code === "ECONNREFUSED") {
      return res
        .status(503)
        .json(STATUS_CODE[503]("Evidently service unavailable"));
    }

    if (error.response) {
      const statusCode = error.response.status;
      const errorMessage =
        error.response?.data?.detail || error.message || "Failed to list projects";
      // Map known status codes, default to 500 for others
      const safeStatusCode = [400, 401, 403, 404, 500, 503].includes(statusCode) ? statusCode : 500;
      return res.status(safeStatusCode).json(STATUS_CODE[safeStatusCode as 400 | 401 | 403 | 404 | 500 | 503](errorMessage));
    }

    return res
      .status(500)
      .json(STATUS_CODE[500](error.message || "Failed to list projects"));
  }
}

/**
 * Get specific Evidently project details
 */
export async function getEvidentlyProject(
  req: Request,
  res: Response
): Promise<any> {
  const functionName = "getEvidentlyProject";
  const projectId = req.params.projectId;

  logStructured(
    "processing",
    `Getting Evidently project: ${projectId}`,
    functionName,
    fileName
  );

  try {
    const { url, apiToken } = (req as any).evidentlyConfig;

    // Proxy request to Python service with retry logic
    const response = await axiosWithRetry.post<ProjectDetailsResponse>(
      `${PYTHON_SERVICE_URL}/api/evidently/projects/${projectId}`,
      { url, api_token: apiToken },
      { timeout: 30000 }
    );

    logStructured(
      "successful",
      `Successfully retrieved project ${projectId}`,
      functionName,
      fileName
    );

    return res.status(200).json(STATUS_CODE[200](response.data));
  } catch (error: any) {
    logStructured(
      "error",
      `Failed to get project ${projectId}: ${error.message}`,
      functionName,
      fileName
    );

    // Handle different error types
    if (error.code === "ECONNREFUSED") {
      return res
        .status(503)
        .json(STATUS_CODE[503]("Evidently service unavailable"));
    }

    if (error.response) {
      const statusCode = error.response.status;
      const errorMessage =
        error.response?.data?.detail || error.message || "Failed to get project";
      const safeStatusCode = [400, 401, 403, 404, 500, 503].includes(statusCode) ? statusCode : 500;
      return res.status(safeStatusCode).json(STATUS_CODE[safeStatusCode as 400 | 401 | 403 | 404 | 500 | 503](errorMessage));
    }

    return res
      .status(500)
      .json(STATUS_CODE[500](error.message || "Failed to get project"));
  }
}

/**
 * Get drift metrics for a project
 */
export async function getDriftMetrics(
  req: Request,
  res: Response
): Promise<any> {
  const functionName = "getDriftMetrics";
  const projectId = req.params.projectId;
  const organizationId = (req as any).user?.organizationId;

  logStructured(
    "processing",
    `Getting drift metrics for project: ${projectId}`,
    functionName,
    fileName
  );

  try {
    const { url, apiToken } = (req as any).evidentlyConfig;

    // Check cache first
    const cachedData = await getCachedMetrics(
      organizationId,
      projectId,
      "drift" as MetricType
    );

    if (cachedData) {
      logStructured(
        "successful",
        `Returned cached drift metrics for project ${projectId}`,
        functionName,
        fileName
      );
      return res.status(200).json(STATUS_CODE[200](cachedData));
    }

    // Cache miss - fetch from Python service with retry logic
    const response = await axiosWithRetry.post<DriftMetricsResponse>(
      `${PYTHON_SERVICE_URL}/api/evidently/metrics/drift`,
      { url, api_token: apiToken, project_id: projectId },
      { timeout: 30000 }
    );

    // Store in cache
    await setCachedMetrics(
      organizationId,
      projectId,
      response.data.project_id,
      response.data.model_name || "default",
      "drift" as MetricType,
      response.data.data,
      response.data.status as HealthStatus
    );

    logStructured(
      "successful",
      `Successfully retrieved and cached drift metrics for project ${projectId}`,
      functionName,
      fileName
    );

    return res.status(200).json(STATUS_CODE[200](response.data));
  } catch (error: any) {
    logStructured(
      "error",
      `Failed to get drift metrics for project ${projectId}: ${error.message}`,
      functionName,
      fileName
    );

    // Handle different error types
    if (error.code === "ECONNREFUSED") {
      return res
        .status(503)
        .json(STATUS_CODE[503]("Evidently service unavailable"));
    }

    if (error.response) {
      const statusCode = error.response.status;
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Failed to get drift metrics";
      const safeStatusCode = [400, 401, 403, 404, 500, 503].includes(statusCode) ? statusCode : 500;
      return res.status(safeStatusCode).json(STATUS_CODE[safeStatusCode as 400 | 401 | 403 | 404 | 500 | 503](errorMessage));
    }

    return res
      .status(500)
      .json(STATUS_CODE[500](error.message || "Failed to get drift metrics"));
  }
}

/**
 * Get performance metrics for a project
 */
export async function getPerformanceMetrics(
  req: Request,
  res: Response
): Promise<any> {
  const functionName = "getPerformanceMetrics";
  const projectId = req.params.projectId;
  const organizationId = (req as any).user?.organizationId;

  logStructured(
    "processing",
    `Getting performance metrics for project: ${projectId}`,
    functionName,
    fileName
  );

  try {
    const { url, apiToken } = (req as any).evidentlyConfig;

    // Check cache first
    const cachedData = await getCachedMetrics(
      organizationId,
      projectId,
      "performance" as MetricType
    );

    if (cachedData) {
      logStructured(
        "successful",
        `Returned cached performance metrics for project ${projectId}`,
        functionName,
        fileName
      );
      return res.status(200).json(STATUS_CODE[200](cachedData));
    }

    // Cache miss - fetch from Python service with retry logic
    const response = await axiosWithRetry.post<PerformanceMetricsResponse>(
      `${PYTHON_SERVICE_URL}/api/evidently/metrics/performance`,
      { url, api_token: apiToken, project_id: projectId },
      { timeout: 30000 }
    );

    // Store in cache
    await setCachedMetrics(
      organizationId,
      projectId,
      response.data.project_id,
      response.data.model_name || "default",
      "performance" as MetricType,
      response.data.data,
      response.data.status as HealthStatus
    );

    logStructured(
      "successful",
      `Successfully retrieved and cached performance metrics for project ${projectId}`,
      functionName,
      fileName
    );

    return res.status(200).json(STATUS_CODE[200](response.data));
  } catch (error: any) {
    logStructured(
      "error",
      `Failed to get performance metrics for project ${projectId}: ${error.message}`,
      functionName,
      fileName
    );

    // Handle different error types
    if (error.code === "ECONNREFUSED") {
      return res
        .status(503)
        .json(STATUS_CODE[503]("Evidently service unavailable"));
    }

    if (error.response) {
      const statusCode = error.response.status;
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Failed to get performance metrics";
      const safeStatusCode = [400, 401, 403, 404, 500, 503].includes(statusCode) ? statusCode : 500;
      return res.status(safeStatusCode).json(STATUS_CODE[safeStatusCode as 400 | 401 | 403 | 404 | 500 | 503](errorMessage));
    }

    return res
      .status(500)
      .json(STATUS_CODE[500](error.message || "Failed to get performance metrics"));
  }
}

/**
 * Get fairness metrics for a project
 */
export async function getFairnessMetrics(
  req: Request,
  res: Response
): Promise<any> {
  const functionName = "getFairnessMetrics";
  const projectId = req.params.projectId;
  const organizationId = (req as any).user?.organizationId;

  logStructured(
    "processing",
    `Getting fairness metrics for project: ${projectId}`,
    functionName,
    fileName
  );

  try {
    const { url, apiToken } = (req as any).evidentlyConfig;

    // Check cache first
    const cachedData = await getCachedMetrics(
      organizationId,
      projectId,
      "fairness" as MetricType
    );

    if (cachedData) {
      logStructured(
        "successful",
        `Returned cached fairness metrics for project ${projectId}`,
        functionName,
        fileName
      );
      return res.status(200).json(STATUS_CODE[200](cachedData));
    }

    // Cache miss - fetch from Python service with retry logic
    const response = await axiosWithRetry.post<FairnessMetricsResponse>(
      `${PYTHON_SERVICE_URL}/api/evidently/metrics/fairness`,
      { url, api_token: apiToken, project_id: projectId },
      { timeout: 30000 }
    );

    // Store in cache
    await setCachedMetrics(
      organizationId,
      projectId,
      response.data.project_id,
      response.data.model_name || "default",
      "fairness" as MetricType,
      response.data.data,
      response.data.status as HealthStatus
    );

    logStructured(
      "successful",
      `Successfully retrieved and cached fairness metrics for project ${projectId}`,
      functionName,
      fileName
    );

    return res.status(200).json(STATUS_CODE[200](response.data));
  } catch (error: any) {
    logStructured(
      "error",
      `Failed to get fairness metrics for project ${projectId}: ${error.message}`,
      functionName,
      fileName
    );

    // Handle different error types
    if (error.code === "ECONNREFUSED") {
      return res
        .status(503)
        .json(STATUS_CODE[503]("Evidently service unavailable"));
    }

    if (error.response) {
      const statusCode = error.response.status;
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Failed to get fairness metrics";
      const safeStatusCode = [400, 401, 403, 404, 500, 503].includes(statusCode) ? statusCode : 500;
      return res.status(safeStatusCode).json(STATUS_CODE[safeStatusCode as 400 | 401 | 403 | 404 | 500 | 503](errorMessage));
    }

    return res
      .status(500)
      .json(STATUS_CODE[500](error.message || "Failed to get fairness metrics"));
  }
}

/**
 * Bulk sync all metrics for a project
 */
export async function bulkSyncMetrics(
  req: Request,
  res: Response
): Promise<any> {
  const functionName = "bulkSyncMetrics";
  const projectId = req.params.projectId;
  const organizationId = (req as any).user?.organizationId;

  logStructured(
    "processing",
    `Bulk syncing metrics for project: ${projectId}`,
    functionName,
    fileName
  );

  try {
    const { url, apiToken } = (req as any).evidentlyConfig;

    // Invalidate cache before sync to ensure fresh data
    await invalidateCache(organizationId, projectId);

    // Proxy request to Python service with retry logic
    const response = await axiosWithRetry.post<BulkSyncResponse>(
      `${PYTHON_SERVICE_URL}/api/evidently/sync`,
      { url, api_token: apiToken, project_id: projectId },
      { timeout: 60000 } // Longer timeout for bulk operation
    );

    logStructured(
      "successful",
      `Successfully bulk synced metrics for project ${projectId}`,
      functionName,
      fileName
    );

    return res.status(200).json(STATUS_CODE[200](response.data));
  } catch (error: any) {
    logStructured(
      "error",
      `Failed to bulk sync metrics for project ${projectId}: ${error.message}`,
      functionName,
      fileName
    );

    // Handle different error types
    if (error.code === "ECONNREFUSED") {
      return res
        .status(503)
        .json(STATUS_CODE[503]("Evidently service unavailable"));
    }

    if (error.response) {
      const statusCode = error.response.status;
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Failed to bulk sync metrics";
      const safeStatusCode = [400, 401, 403, 404, 500, 503].includes(statusCode) ? statusCode : 500;
      return res.status(safeStatusCode).json(STATUS_CODE[safeStatusCode as 400 | 401 | 403 | 404 | 500 | 503](errorMessage));
    }

    return res
      .status(500)
      .json(STATUS_CODE[500](error.message || "Failed to bulk sync metrics"));
  }
}
