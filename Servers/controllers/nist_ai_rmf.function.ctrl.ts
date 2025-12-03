import { Request, Response } from "express";
import logger, { logStructured } from "../utils/logger/fileLogger";
import {
  getAllNISTAIRMFfunctionsQuery,
  getNISTAIRMFfunctionByIdQuery,
} from "../utils/nist_ai_rmf.function.utils";
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
      `Failed to retrieve NIST AI RMF functions: ${(error as Error).message}`,
      req.userId!,
      req.tenantId!
    );
    logger.error("❌ Error in getAllNISTAIRMFfunctions:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getNISTAIRMFfunctionById(req: Request, res: Response) {
  const functionId = parseInt(req.params.id);
  logStructured(
    "processing",
    `starting to get NIST AI RMF function by ID: ${functionId}`,
    "getNISTAIRMFfunctionById",
    "nist_ai_rmf.function.ctrl.ts"
  );
  logger.debug(`🔍 Fetching NIST AI RMF function by ID: ${functionId}`);
  try {
    const nistAiRmfFunction = await getNISTAIRMFfunctionByIdQuery(
      functionId,
      req.tenantId!
    );
    if (nistAiRmfFunction) {
      logStructured(
        "successful",
        `retrieved NIST AI RMF function by ID: ${functionId}`,
        "getNISTAIRMFfunctionById",
        "nist_ai_rmf.function.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](nistAiRmfFunction));
    }
    logStructured(
      "error",
      `no NIST AI RMF function found by ID: ${functionId}`,
      "getNISTAIRMFfunctionById",
      "nist_ai_rmf.function.ctrl.ts"
    );
    return res.status(404).json(STATUS_CODE[404](nistAiRmfFunction));
  } catch (error) {
    logStructured(
      "error",
      `failed to retrieve NIST AI RMF function by ID: ${functionId}`,
      "getNISTAIRMFfunctionById",
      "nist_ai_rmf.function.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to retrieve NIST AI RMF function by ID: ${functionId}`,
      req.userId!,
      req.tenantId!
    );
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
