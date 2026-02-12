import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  getDashboardSummaryQuery,
  getDashboardTrendsQuery,
} from "../utils/shadowAi.utils";

export async function getDashboardSummary(req: Request, res: Response): Promise<any> {
  try {
    const summary = await getDashboardSummaryQuery(req.tenantId!);
    return res.status(200).json(STATUS_CODE[200](summary));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getDashboardTrends(req: Request, res: Response): Promise<any> {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const trends = await getDashboardTrendsQuery(days, req.tenantId!);
    return res.status(200).json(STATUS_CODE[200](trends));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
