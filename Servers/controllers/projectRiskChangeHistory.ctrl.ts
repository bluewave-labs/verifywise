/**
 * Project Risk Change History Controller
 *
 * Handles API endpoints for project risk change history.
 */

import { Request, Response } from "express";
import { getProjectRiskChangeHistory } from "../utils/projectRiskChangeHistory.utils";
import { STATUS_CODE } from "../utils/statusCode.utils";

export async function getProjectRiskChangeHistoryByRiskId(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectRiskId = parseInt(req.params.projectRiskId);
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    if (isNaN(projectRiskId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid project risk ID"));
    }

    const history = await getProjectRiskChangeHistory(
      projectRiskId,
      req.tenantId!,
      limit,
      offset
    );

    return res.status(200).json(STATUS_CODE[200](history));
  } catch (error) {
    console.error("Error getting project risk change history:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
