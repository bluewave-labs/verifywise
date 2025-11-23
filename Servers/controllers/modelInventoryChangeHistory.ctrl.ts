import { Request, Response } from "express";
import { getModelInventoryChangeHistory } from "../utils/modelInventoryChangeHistory.utils";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";

/**
 * Get change history for a specific model inventory
 */
export async function getModelInventoryChangeHistoryById(
  req: Request,
  res: Response
) {
  const modelInventoryId = parseInt(req.params.id);

  logStructured(
    "processing",
    `fetching change history for model inventory id: ${modelInventoryId}`,
    "getModelInventoryChangeHistoryById",
    "modelInventoryChangeHistory.ctrl.ts"
  );
  logger.debug(
    `🔍 Fetching change history for model inventory with id: ${modelInventoryId}`
  );

  try {
    const history = await getModelInventoryChangeHistory(
      modelInventoryId,
      req.tenantId!
    );

    logStructured(
      "successful",
      `change history retrieved for model inventory id: ${modelInventoryId}`,
      "getModelInventoryChangeHistoryById",
      "modelInventoryChangeHistory.ctrl.ts"
    );

    return res.status(200).json(STATUS_CODE[200](history));
  } catch (error) {
    logStructured(
      "error",
      "failed to retrieve change history",
      "getModelInventoryChangeHistoryById",
      "modelInventoryChangeHistory.ctrl.ts"
    );
    logger.error("❌ Error in getModelInventoryChangeHistoryById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
