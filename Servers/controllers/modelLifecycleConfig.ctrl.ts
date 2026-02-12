/**
 * @fileoverview Model Lifecycle Config Controller
 *
 * Handles admin endpoints for managing lifecycle phases and items.
 */

import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";
import {
  getAllPhases,
  getPhaseById,
  createPhase,
  updatePhase,
  deletePhase,
  reorderPhases,
  getItemsByPhase,
  createItem,
  updateItem,
  deleteItem,
  reorderItems,
  getFullConfig,
} from "../repositories/modelLifecycleConfig.repo";

const CTRL_FILE = "modelLifecycleConfig.ctrl.ts";

// ============================================================================
// Phase endpoints
// ============================================================================

export async function getLifecycleConfig(req: Request, res: Response) {
  logStructured("processing", "fetching lifecycle config", "getLifecycleConfig", CTRL_FILE);
  try {
    const tenant = req.tenantId!;
    const includeInactive = req.query.includeInactive === "true";
    const phases = await getFullConfig(tenant, includeInactive);
    return res.status(200).json(STATUS_CODE[200](phases));
  } catch (error) {
    logStructured("error", "failed to fetch lifecycle config", "getLifecycleConfig", CTRL_FILE);
    logger.error("Error in getLifecycleConfig:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getLifecyclePhases(req: Request, res: Response) {
  logStructured("processing", "fetching lifecycle phases", "getLifecyclePhases", CTRL_FILE);
  try {
    const tenant = req.tenantId!;
    const includeInactive = req.query.includeInactive === "true";
    const phases = await getAllPhases(tenant, includeInactive);
    return res.status(200).json(STATUS_CODE[200](phases));
  } catch (error) {
    logStructured("error", "failed to fetch lifecycle phases", "getLifecyclePhases", CTRL_FILE);
    logger.error("Error in getLifecyclePhases:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getLifecyclePhaseById(req: Request, res: Response) {
  const phaseId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  logStructured("processing", `fetching phase ${phaseId}`, "getLifecyclePhaseById", CTRL_FILE);
  try {
    if (!Number.isSafeInteger(phaseId) || phaseId <= 0) {
      return res.status(400).json(STATUS_CODE[400]("Invalid phase ID"));
    }
    const tenant = req.tenantId!;
    const phase = await getPhaseById(phaseId, tenant);
    if (!phase) {
      return res.status(404).json(STATUS_CODE[404]("Phase not found"));
    }
    return res.status(200).json(STATUS_CODE[200](phase));
  } catch (error) {
    logStructured("error", "failed to fetch phase", "getLifecyclePhaseById", CTRL_FILE);
    logger.error("Error in getLifecyclePhaseById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createLifecyclePhase(req: Request, res: Response) {
  logStructured("processing", "creating lifecycle phase", "createLifecyclePhase", CTRL_FILE);
  try {
    const tenant = req.tenantId!;
    const { name, description, display_order } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json(STATUS_CODE[400]("Phase name is required"));
    }

    const phase = await createPhase({ name: name.trim(), description, display_order }, tenant);
    return res.status(201).json(STATUS_CODE[201](phase));
  } catch (error) {
    logStructured("error", "failed to create phase", "createLifecyclePhase", CTRL_FILE);
    logger.error("Error in createLifecyclePhase:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateLifecyclePhase(req: Request, res: Response) {
  const phaseId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  logStructured("processing", `updating phase ${phaseId}`, "updateLifecyclePhase", CTRL_FILE);
  try {
    if (!Number.isSafeInteger(phaseId) || phaseId <= 0) {
      return res.status(400).json(STATUS_CODE[400]("Invalid phase ID"));
    }
    const tenant = req.tenantId!;
    const phase = await updatePhase(phaseId, req.body, tenant);
    if (!phase) {
      return res.status(404).json(STATUS_CODE[404]("Phase not found"));
    }
    return res.status(200).json(STATUS_CODE[200](phase));
  } catch (error) {
    logStructured("error", "failed to update phase", "updateLifecyclePhase", CTRL_FILE);
    logger.error("Error in updateLifecyclePhase:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteLifecyclePhase(req: Request, res: Response) {
  const phaseId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  logStructured("processing", `deleting phase ${phaseId}`, "deleteLifecyclePhase", CTRL_FILE);
  try {
    if (!Number.isSafeInteger(phaseId) || phaseId <= 0) {
      return res.status(400).json(STATUS_CODE[400]("Invalid phase ID"));
    }
    const tenant = req.tenantId!;
    await deletePhase(phaseId, tenant);
    return res.status(200).json(STATUS_CODE[200]("Phase deleted"));
  } catch (error) {
    logStructured("error", "failed to delete phase", "deleteLifecyclePhase", CTRL_FILE);
    logger.error("Error in deleteLifecyclePhase:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function reorderLifecyclePhases(req: Request, res: Response) {
  logStructured("processing", "reordering phases", "reorderLifecyclePhases", CTRL_FILE);
  try {
    const tenant = req.tenantId!;
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json(STATUS_CODE[400]("orderedIds array is required"));
    }

    await reorderPhases(orderedIds, tenant);
    return res.status(200).json(STATUS_CODE[200]("Phases reordered"));
  } catch (error) {
    logStructured("error", "failed to reorder phases", "reorderLifecyclePhases", CTRL_FILE);
    logger.error("Error in reorderLifecyclePhases:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

// ============================================================================
// Item endpoints
// ============================================================================

export async function getLifecycleItems(req: Request, res: Response) {
  const phaseId = parseInt(Array.isArray(req.params.phaseId) ? req.params.phaseId[0] : req.params.phaseId);
  logStructured("processing", `fetching items for phase ${phaseId}`, "getLifecycleItems", CTRL_FILE);
  try {
    if (!Number.isSafeInteger(phaseId) || phaseId <= 0) {
      return res.status(400).json(STATUS_CODE[400]("Invalid phase ID"));
    }
    const tenant = req.tenantId!;
    const includeInactive = req.query.includeInactive === "true";
    const items = await getItemsByPhase(phaseId, tenant, includeInactive);
    return res.status(200).json(STATUS_CODE[200](items));
  } catch (error) {
    logStructured("error", "failed to fetch items", "getLifecycleItems", CTRL_FILE);
    logger.error("Error in getLifecycleItems:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createLifecycleItem(req: Request, res: Response) {
  const phaseId = parseInt(Array.isArray(req.params.phaseId) ? req.params.phaseId[0] : req.params.phaseId);
  logStructured("processing", `creating item in phase ${phaseId}`, "createLifecycleItem", CTRL_FILE);
  try {
    if (!Number.isSafeInteger(phaseId) || phaseId <= 0) {
      return res.status(400).json(STATUS_CODE[400]("Invalid phase ID"));
    }

    const tenant = req.tenantId!;
    const { name, description, item_type, is_required, display_order, config } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json(STATUS_CODE[400]("Item name is required"));
    }

    const validTypes = ["text", "textarea", "documents", "people", "classification", "checklist", "approval"];
    if (!item_type || !validTypes.includes(item_type)) {
      return res.status(400).json(STATUS_CODE[400](`item_type must be one of: ${validTypes.join(", ")}`));
    }

    const item = await createItem(
      { phase_id: phaseId, name: name.trim(), description, item_type, is_required, display_order, config },
      tenant
    );
    return res.status(201).json(STATUS_CODE[201](item));
  } catch (error) {
    logStructured("error", "failed to create item", "createLifecycleItem", CTRL_FILE);
    logger.error("Error in createLifecycleItem:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateLifecycleItem(req: Request, res: Response) {
  const itemId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  logStructured("processing", `updating item ${itemId}`, "updateLifecycleItem", CTRL_FILE);
  try {
    if (!Number.isSafeInteger(itemId) || itemId <= 0) {
      return res.status(400).json(STATUS_CODE[400]("Invalid item ID"));
    }
    const tenant = req.tenantId!;
    const item = await updateItem(itemId, req.body, tenant);
    if (!item) {
      return res.status(404).json(STATUS_CODE[404]("Item not found"));
    }
    return res.status(200).json(STATUS_CODE[200](item));
  } catch (error) {
    logStructured("error", "failed to update item", "updateLifecycleItem", CTRL_FILE);
    logger.error("Error in updateLifecycleItem:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteLifecycleItem(req: Request, res: Response) {
  const itemId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  logStructured("processing", `deleting item ${itemId}`, "deleteLifecycleItem", CTRL_FILE);
  try {
    if (!Number.isSafeInteger(itemId) || itemId <= 0) {
      return res.status(400).json(STATUS_CODE[400]("Invalid item ID"));
    }
    const tenant = req.tenantId!;
    await deleteItem(itemId, tenant);
    return res.status(200).json(STATUS_CODE[200]("Item deleted"));
  } catch (error) {
    logStructured("error", "failed to delete item", "deleteLifecycleItem", CTRL_FILE);
    logger.error("Error in deleteLifecycleItem:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function reorderLifecycleItems(req: Request, res: Response) {
  const phaseId = parseInt(Array.isArray(req.params.phaseId) ? req.params.phaseId[0] : req.params.phaseId);
  logStructured("processing", `reordering items in phase ${phaseId}`, "reorderLifecycleItems", CTRL_FILE);
  try {
    if (!Number.isSafeInteger(phaseId) || phaseId <= 0) {
      return res.status(400).json(STATUS_CODE[400]("Invalid phase ID"));
    }
    const tenant = req.tenantId!;
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json(STATUS_CODE[400]("orderedIds array is required"));
    }

    await reorderItems(phaseId, orderedIds, tenant);
    return res.status(200).json(STATUS_CODE[200]("Items reordered"));
  } catch (error) {
    logStructured("error", "failed to reorder items", "reorderLifecycleItems", CTRL_FILE);
    logger.error("Error in reorderLifecycleItems:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
