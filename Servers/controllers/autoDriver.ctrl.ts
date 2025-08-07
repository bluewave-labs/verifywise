import { Request, Response } from "express";
import { deleteMockData, insertMockData } from "../driver/autoDriver.driver";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { logEvent } from "../utils/logger/dbLogger";

export async function postAutoDriver(req: Request, res: Response) {
  logStructured(
    "processing",
    "inserting mock data via auto driver",
    "postAutoDriver",
    "autoDriver.ctrl.ts"
  );
  logger.debug("🤖 Inserting mock data via auto driver");

  try {
    await insertMockData(req.tenantId!, req.organizationId!, req.userId!);

    logStructured(
      "successful",
      "mock data inserted successfully via auto driver",
      "postAutoDriver",
      "autoDriver.ctrl.ts"
    );
    await logEvent("Create", "Mock data inserted via auto driver");

    res.status(201).json(STATUS_CODE[201]("Mock data inserted"));
  } catch (error) {
    logStructured(
      "error",
      "failed to insert mock data via auto driver",
      "postAutoDriver",
      "autoDriver.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to insert mock data via auto driver: ${(error as Error).message}`
    );
    logger.error("❌ Error in postAutoDriver:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteAutoDriver(req: Request, res: Response) {
  logStructured(
    "processing",
    "deleting mock data via auto driver",
    "deleteAutoDriver",
    "autoDriver.ctrl.ts"
  );
  logger.debug("🗑️ Deleting mock data via auto driver");

  try {
    await deleteMockData(req.tenantId!);

    logStructured(
      "successful",
      "mock data deleted successfully via auto driver",
      "deleteAutoDriver",
      "autoDriver.ctrl.ts"
    );
    await logEvent("Delete", "Mock data deleted via auto driver");

    res.status(200).json(STATUS_CODE[200]("Mock data deleted"));
  } catch (error) {
    logStructured(
      "error",
      "failed to delete mock data via auto driver",
      "deleteAutoDriver",
      "autoDriver.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to delete mock data via auto driver: ${(error as Error).message}`
    );
    logger.error("❌ Error in deleteAutoDriver:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
