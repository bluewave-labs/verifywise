import { Request, Response } from "express";
import { logFailure, logProcessing, logSuccess } from "../utils/logger/logHelper";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { getDashboardDataQuery, getExecutiveOverviewQuery, getComplianceAnalyticsQuery } from "../utils/dashboard.utils";

export async function getDashboardData(req: Request, res: Response) {
  logProcessing({
    description: "starting getDashboardData",
    functionName: "getDashboardData",
    fileName: "dashboard.ctrl.ts",
  });

  try {
    const dashboard = await getDashboardDataQuery(req.tenantId!, req.userId!, req.role!);

    await logSuccess({
      eventType: "Read",
      description: "Retrieved dashboard data successfully",
      functionName: "getDashboardData",
      fileName: "dashboard.ctrl.ts",
    });

    return res
      .status(dashboard ? 200 : 204)
      .json(STATUS_CODE[dashboard ? 200 : 204](dashboard));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve dashboard data",
      functionName: "getDashboardData",
      fileName: "dashboard.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getExecutiveOverview(req: Request, res: Response) {
  logProcessing({
    description: "starting getExecutiveOverview",
    functionName: "getExecutiveOverview",
    fileName: "dashboard.ctrl.ts",
  });

  try {
    const executiveOverview = await getExecutiveOverviewQuery(req.tenantId!, req.userId!, req.role!);

    await logSuccess({
      eventType: "Read",
      description: "Retrieved executive overview data successfully",
      functionName: "getExecutiveOverview",
      fileName: "dashboard.ctrl.ts",
    });

    return res
      .status(executiveOverview ? 200 : 204)
      .json(STATUS_CODE[executiveOverview ? 200 : 204](executiveOverview));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve executive overview data",
      functionName: "getExecutiveOverview",
      fileName: "dashboard.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getComplianceAnalytics(req: Request, res: Response) {
  logProcessing({
    description: "starting getComplianceAnalytics",
    functionName: "getComplianceAnalytics",
    fileName: "dashboard.ctrl.ts",
  });

  try {
    const complianceAnalytics = await getComplianceAnalyticsQuery(req.tenantId!, req.userId!, req.role!);

    await logSuccess({
      eventType: "Read",
      description: "Retrieved compliance analytics data successfully",
      functionName: "getComplianceAnalytics",
      fileName: "dashboard.ctrl.ts",
    });

    return res
      .status(complianceAnalytics ? 200 : 204)
      .json(STATUS_CODE[complianceAnalytics ? 200 : 204](complianceAnalytics));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve compliance analytics data",
      functionName: "getComplianceAnalytics",
      fileName: "dashboard.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}