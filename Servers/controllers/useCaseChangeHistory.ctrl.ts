import { Request, Response } from "express";
import { getUseCaseChangeHistory } from "../utils/useCaseChangeHistory.utils";
import { STATUS_CODE } from "../utils/statusCode.utils";

/**
 * Get change history for a specific use case
 */
export const getUseCaseHistory = async (req: Request, res: Response) => {
  try {
    const useCaseId = parseInt(req.params.useCaseId, 10);
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    if (isNaN(useCaseId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid use case ID"));
    }

    const result = await getUseCaseChangeHistory(
      useCaseId,
      req.tenantId!,
      limit,
      offset
    );

    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    console.error("Error getting use case change history:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
};
