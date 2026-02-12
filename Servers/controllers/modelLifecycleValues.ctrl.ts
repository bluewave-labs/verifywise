/**
 * @fileoverview Model Lifecycle Values Controller
 *
 * Handles endpoints for per-model lifecycle data (values, files, progress).
 */

import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";
import {
  getValuesByModel,
  upsertValue,
  addFileToItem,
  removeFileFromItem,
  getLifecycleProgress,
} from "../repositories/modelLifecycleValues.repo";

const CTRL_FILE = "modelLifecycleValues.ctrl.ts";

const getParam = (param: string | string[]): string =>
  Array.isArray(param) ? param[0] : param;

/**
 * GET /model-inventory/:id/lifecycle
 * Returns full lifecycle data for a model (phases, items, values, files).
 */
export async function getModelLifecycle(req: Request, res: Response) {
  const modelId = parseInt(getParam(req.params.id));
  logStructured("processing", `fetching lifecycle for model ${modelId}`, "getModelLifecycle", CTRL_FILE);
  try {
    if (!Number.isSafeInteger(modelId) || modelId <= 0) {
      return res.status(400).json(STATUS_CODE[400]("Invalid model ID"));
    }
    const tenant = req.tenantId!;
    const lifecycle = await getValuesByModel(modelId, tenant);
    return res.status(200).json(STATUS_CODE[200](lifecycle));
  } catch (error) {
    logStructured("error", "failed to fetch model lifecycle", "getModelLifecycle", CTRL_FILE);
    logger.error("Error in getModelLifecycle:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * PUT /model-inventory/:id/lifecycle/items/:itemId
 * Upserts a lifecycle item value for a model.
 */
export async function upsertLifecycleValue(req: Request, res: Response) {
  const modelId = parseInt(getParam(req.params.id));
  const itemId = parseInt(getParam(req.params.itemId));
  logStructured("processing", `upserting value for model ${modelId}, item ${itemId}`, "upsertLifecycleValue", CTRL_FILE);
  try {
    if (!Number.isSafeInteger(modelId) || modelId <= 0) {
      return res.status(400).json(STATUS_CODE[400]("Invalid model ID"));
    }
    if (!Number.isSafeInteger(itemId) || itemId <= 0) {
      return res.status(400).json(STATUS_CODE[400]("Invalid item ID"));
    }

    const tenant = req.tenantId!;
    const userId = Number(req.userId);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(400).json(STATUS_CODE[400]("Invalid user ID"));
    }

    const { value_text, value_json } = req.body;
    const value = await upsertValue(modelId, itemId, { value_text, value_json }, userId, tenant);
    return res.status(200).json(STATUS_CODE[200](value));
  } catch (error) {
    logStructured("error", "failed to upsert lifecycle value", "upsertLifecycleValue", CTRL_FILE);
    logger.error("Error in upsertLifecycleValue:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * POST /model-inventory/:id/lifecycle/items/:itemId/files
 * Adds a file to a document-type lifecycle item.
 */
export async function addLifecycleFile(req: Request, res: Response) {
  const modelId = parseInt(getParam(req.params.id));
  const itemId = parseInt(getParam(req.params.itemId));
  logStructured("processing", `adding file to model ${modelId}, item ${itemId}`, "addLifecycleFile", CTRL_FILE);
  try {
    if (!Number.isSafeInteger(modelId) || modelId <= 0) {
      return res.status(400).json(STATUS_CODE[400]("Invalid model ID"));
    }
    if (!Number.isSafeInteger(itemId) || itemId <= 0) {
      return res.status(400).json(STATUS_CODE[400]("Invalid item ID"));
    }

    const tenant = req.tenantId!;
    const userId = Number(req.userId);
    const { fileId } = req.body;

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(400).json(STATUS_CODE[400]("Invalid user ID"));
    }
    if (!fileId || !Number.isSafeInteger(Number(fileId)) || Number(fileId) <= 0) {
      return res.status(400).json(STATUS_CODE[400]("Valid fileId is required"));
    }

    const result = await addFileToItem(modelId, itemId, Number(fileId), userId, tenant);
    return res.status(201).json(STATUS_CODE[201](result));
  } catch (error) {
    logStructured("error", "failed to add lifecycle file", "addLifecycleFile", CTRL_FILE);
    logger.error("Error in addLifecycleFile:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * DELETE /model-inventory/:id/lifecycle/items/:itemId/files/:fileId
 * Removes a file from a document-type lifecycle item.
 */
export async function removeLifecycleFile(req: Request, res: Response) {
  const modelId = parseInt(getParam(req.params.id));
  const itemId = parseInt(getParam(req.params.itemId));
  const fileId = parseInt(getParam(req.params.fileId));
  logStructured("processing", `removing file ${fileId} from model ${modelId}, item ${itemId}`, "removeLifecycleFile", CTRL_FILE);
  try {
    if (!Number.isSafeInteger(modelId) || modelId <= 0) {
      return res.status(400).json(STATUS_CODE[400]("Invalid model ID"));
    }
    if (!Number.isSafeInteger(itemId) || itemId <= 0) {
      return res.status(400).json(STATUS_CODE[400]("Invalid item ID"));
    }
    if (!Number.isSafeInteger(fileId) || fileId <= 0) {
      return res.status(400).json(STATUS_CODE[400]("Invalid file ID"));
    }

    const tenant = req.tenantId!;
    await removeFileFromItem(modelId, itemId, fileId, tenant);
    return res.status(200).json(STATUS_CODE[200]("File removed"));
  } catch (error) {
    logStructured("error", "failed to remove lifecycle file", "removeLifecycleFile", CTRL_FILE);
    logger.error("Error in removeLifecycleFile:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * GET /model-inventory/:id/lifecycle/progress
 * Returns lifecycle completion progress for a model.
 */
export async function getModelLifecycleProgress(req: Request, res: Response) {
  const modelId = parseInt(getParam(req.params.id));
  logStructured("processing", `fetching lifecycle progress for model ${modelId}`, "getModelLifecycleProgress", CTRL_FILE);
  try {
    if (!Number.isSafeInteger(modelId) || modelId <= 0) {
      return res.status(400).json(STATUS_CODE[400]("Invalid model ID"));
    }
    const tenant = req.tenantId!;
    const progress = await getLifecycleProgress(modelId, tenant);
    return res.status(200).json(STATUS_CODE[200](progress));
  } catch (error) {
    logStructured("error", "failed to fetch lifecycle progress", "getModelLifecycleProgress", CTRL_FILE);
    logger.error("Error in getModelLifecycleProgress:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
