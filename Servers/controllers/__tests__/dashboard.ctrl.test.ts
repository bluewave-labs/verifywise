import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { Request, Response } from "express";

// Mock dependencies
jest.mock("../../utils/dashboard.utils", () => ({
  getDashboardDataQuery: jest.fn(),
}));
jest.mock("../../utils/logger/logHelper", () => ({
  logProcessing: jest.fn<any>(),
  logSuccess: jest.fn<any>().mockResolvedValue(undefined),
  logFailure: jest.fn<any>().mockResolvedValue(undefined),
}));
jest.mock("../../utils/statusCode.utils", () => ({
  STATUS_CODE: {
    200: (data: any) => ({ message: "OK", data }),
    204: (data: any) => ({ message: "No Content", data }),
    500: (data: any) => ({ message: "Internal Server Error", data }),
  },
}));

import { getDashboardData } from "../dashboard.ctrl";
import { getDashboardDataQuery } from "../../utils/dashboard.utils";

const mockGetDashboardDataQuery = getDashboardDataQuery as jest.MockedFunction<
  typeof getDashboardDataQuery
>;

function createReq(overrides?: Partial<Request>): Partial<Request> {
  return {
    userId: 1,
    tenantId: "a1b2c3d4e5",
    role: "Admin",
    ...overrides,
  } as any;
}

function createRes(): any {
  const res: any = {};
  res.status = jest.fn<any>().mockReturnValue(res);
  res.json = jest.fn<any>().mockReturnValue(res);
  return res;
}

describe("dashboard.ctrl - getDashboardData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 200 with dashboard data when data exists", async () => {
    const mockDashboard = {
      projects: 5,
      trainings: 3,
      models: 2,
      reports: 1,
      task_radar: { overdue: 1, due: 2, upcoming: 3 },
      projects_list: [],
    };
    mockGetDashboardDataQuery.mockResolvedValue(mockDashboard as any);

    const req = createReq();
    const res = createRes();

    await getDashboardData(req as Request, res as Response);

    expect(mockGetDashboardDataQuery).toHaveBeenCalledWith(
      "a1b2c3d4e5",
      1,
      "Admin"
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "OK",
      data: mockDashboard,
    });
  });

  it("should return 204 when no dashboard data exists", async () => {
    mockGetDashboardDataQuery.mockResolvedValue(null);

    const req = createReq();
    const res = createRes();

    await getDashboardData(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(204);
  });

  it("should return 500 on error", async () => {
    mockGetDashboardDataQuery.mockRejectedValue(
      new Error("Database connection failed")
    );

    const req = createReq();
    const res = createRes();

    await getDashboardData(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal Server Error",
      data: "Database connection failed",
    });
  });

  it("should pass tenant, userId and role from request", async () => {
    mockGetDashboardDataQuery.mockResolvedValue({} as any);

    const req = createReq({
      userId: 42,
      tenantId: "x9y8z7w6v5",
      role: "Editor",
    } as any);
    const res = createRes();

    await getDashboardData(req as Request, res as Response);

    expect(mockGetDashboardDataQuery).toHaveBeenCalledWith(
      "x9y8z7w6v5",
      42,
      "Editor"
    );
  });
});
