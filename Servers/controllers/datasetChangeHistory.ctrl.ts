import { Request, Response } from "express";
import { getEntityChangeHistory } from "../utils/changeHistory.base.utils";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";

/**
 * Get change history for a specific dataset with pagination support
 */
export async function getDatasetChangeHistoryById(
  req: Request,
  res: Response
): Promise<any> {
  const datasetId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  if (isNaN(datasetId) || datasetId <= 0) {
    return res.status(400).json(STATUS_CODE[400]("Invalid dataset ID"));
  }

  const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 100, 1), 500);
  const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

  logStructured(
    "processing",
    `fetching change history for dataset id: ${datasetId} (limit: ${limit}, offset: ${offset})`,
    "getDatasetChangeHistoryById",
    "datasetChangeHistory.ctrl.ts"
  );

  try {
    const result = await getEntityChangeHistory(
      "dataset",
      datasetId,
      req.tenantId!,
      limit,
      offset
    );

    logStructured(
      "successful",
      `change history retrieved for dataset id: ${datasetId} (${result.data.length} entries, hasMore: ${result.hasMore})`,
      "getDatasetChangeHistoryById",
      "datasetChangeHistory.ctrl.ts"
    );

    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    logStructured(
      "error",
      "failed to retrieve change history",
      "getDatasetChangeHistoryById",
      "datasetChangeHistory.ctrl.ts"
    );
    logger.error("Error in getDatasetChangeHistoryById:", error);
    return res.status(500).json(STATUS_CODE[500]("Failed to retrieve change history"));
  }
}
