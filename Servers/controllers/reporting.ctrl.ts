import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";

export async function getProjectRiskReports(
  req: Request,
  res: Response
): Promise<any> {
  try {
    return res.status(200).json(STATUS_CODE[200]({}));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}