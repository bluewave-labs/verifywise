import { Request, Response } from "express";
import { getEntityChangeHistory } from "../utils/changeHistory.base.utils";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";

/**
 * Get change history for a specific model risk with pagination support
 */
export async function getModelRiskChangeHistoryById(
  req: Request,
  res: Response
): Promise<any> {
  const modelRiskId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  if (isNaN(modelRiskId) || modelRiskId <= 0) {
    return res.status(400).json(STATUS_CODE[400]("Invalid model risk ID"));
  }

  const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

  logStructured(
    "processing",
    `fetching change history for model risk id: ${modelRiskId} (limit: ${limit}, offset: ${offset})`,
    "getModelRiskChangeHistoryById",
    "modelRiskChangeHistory.ctrl.ts"
  );

  try {
    const result = await getEntityChangeHistory(
      "model_risk",
      modelRiskId,
      req.tenantId!,
      limit,
      offset
    );

    logStructured(
      "successful",
      `change history retrieved for model risk id: ${modelRiskId} (${result.data.length} entries, hasMore: ${result.hasMore})`,
      "getModelRiskChangeHistoryById",
      "modelRiskChangeHistory.ctrl.ts"
    );

    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    logStructured(
      "error",
      "failed to retrieve change history",
      "getModelRiskChangeHistoryById",
      "modelRiskChangeHistory.ctrl.ts"
    );
    logger.error("Error in getModelRiskChangeHistoryById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
