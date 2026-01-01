import { Request, Response } from "express";
import { getIncidentChangeHistory } from "../utils/incidentChangeHistory.utils";
import { STATUS_CODE } from "../utils/statusCode.utils";

/**
 * Get change history for a specific incident
 */
export const getIncidentHistory = async (req: Request, res: Response) => {
  try {
    const incidentId = parseInt(req.params.incidentId, 10);
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    if (isNaN(incidentId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid incident ID"));
    }

    const result = await getIncidentChangeHistory(
      incidentId,
      req.tenantId!,
      limit,
      offset
    );

    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    console.error("Error getting incident change history:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
};
