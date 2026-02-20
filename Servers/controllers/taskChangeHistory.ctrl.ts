import { Request, Response } from "express";
import { getEntityChangeHistory } from "../utils/changeHistory.base.utils";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";

/**
 * Get change history for a specific task with pagination support
 */
export async function getTaskChangeHistoryById(
  req: Request,
  res: Response
): Promise<any> {
  const taskId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  if (isNaN(taskId) || taskId <= 0) {
    return res.status(400).json(STATUS_CODE[400]("Invalid task ID"));
  }

  const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

  logStructured(
    "processing",
    `fetching change history for task id: ${taskId} (limit: ${limit}, offset: ${offset})`,
    "getTaskChangeHistoryById",
    "taskChangeHistory.ctrl.ts"
  );

  try {
    const result = await getEntityChangeHistory(
      "task",
      taskId,
      req.tenantId!,
      limit,
      offset
    );

    logStructured(
      "successful",
      `change history retrieved for task id: ${taskId} (${result.data.length} entries, hasMore: ${result.hasMore})`,
      "getTaskChangeHistoryById",
      "taskChangeHistory.ctrl.ts"
    );

    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    logStructured(
      "error",
      "failed to retrieve change history",
      "getTaskChangeHistoryById",
      "taskChangeHistory.ctrl.ts"
    );
    logger.error("Error in getTaskChangeHistoryById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
