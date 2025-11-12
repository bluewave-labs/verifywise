import { Request, Response } from "express";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { getAllNISTAIRMFfunctionsQuery } from "../utils/nist_ai_rmf.function.utils";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { logEvent } from "../utils/logger/dbLogger";

export async function getAllNISTAIRMFfunctions(
  req: Request,
  res: Response
): Promise<any> {
  logStructured(
    "processing",
    "starting to get all NIST AI RMF functions",
    "getAllNISTAIRMFfunctions",
    "nist_ai_rmf.function.ctrl.ts"
  );
  logger.debug("🔍 Fetching all NIST AI RMF functions");

  try {
    const functions = await getAllNISTAIRMFfunctionsQuery(req.tenantId!);
    if (functions && functions.length > 0) {
      logStructured(
        "successful",
        `retrieved ${functions.length} NIST AI RMF functions`,
        "getAllNISTAIRMFfunctions",
        "nist_ai_rmf.function.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](functions));
    }
  } catch (error) {
    logStructured(
      "error",
      "failed to retrieve NIST AI RMF functions",
      "getAllNISTAIRMFfunctions",
      "nist_ai_rmf.function.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to retrieve NIST AI RMF functions: ${(error as Error).message}`
    );
    logger.error("❌ Error in getAllNISTAIRMFfunctions:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
