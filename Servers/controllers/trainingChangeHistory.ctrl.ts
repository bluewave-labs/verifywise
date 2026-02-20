import { Request, Response } from "express";
import { getEntityChangeHistory } from "../utils/changeHistory.base.utils";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";

/**
 * Get change history for a specific training with pagination support
 */
export async function getTrainingChangeHistoryById(
  req: Request,
  res: Response
): Promise<any> {
  const trainingId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  if (isNaN(trainingId) || trainingId <= 0) {
    return res.status(400).json(STATUS_CODE[400]("Invalid training ID"));
  }

  const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

  logStructured(
    "processing",
    `fetching change history for training id: ${trainingId} (limit: ${limit}, offset: ${offset})`,
    "getTrainingChangeHistoryById",
    "trainingChangeHistory.ctrl.ts"
  );

  try {
    const result = await getEntityChangeHistory(
      "training",
      trainingId,
      req.tenantId!,
      limit,
      offset
    );

    logStructured(
      "successful",
      `change history retrieved for training id: ${trainingId} (${result.data.length} entries, hasMore: ${result.hasMore})`,
      "getTrainingChangeHistoryById",
      "trainingChangeHistory.ctrl.ts"
    );

    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    logStructured(
      "error",
      "failed to retrieve change history",
      "getTrainingChangeHistoryById",
      "trainingChangeHistory.ctrl.ts"
    );
    logger.error("Error in getTrainingChangeHistoryById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
