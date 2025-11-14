import { Request, Response } from "express";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { getAllNISTAIRMFSubcategoriesBycategoryIdQuery } from "../utils/nist_ai_rmf.subcategory.utils";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { logEvent } from "../utils/logger/dbLogger";

export async function getAllNISTAIRMFSubcategoriesBycategoryId(
  req: Request,
  res: Response
): Promise<any> {
  logStructured(
    "processing",
    "starting to get all NIST AI RMF subcategories by category ID",
    "getAllNISTAIRMFSubcategoriesBycategoryId",
    "nist_ai_rmf.subcategory.ctrl.ts"
  );
  logger.debug("🔍 Fetching all NIST AI RMF subcategories by category ID");
  try {
    const subcategories = await getAllNISTAIRMFSubcategoriesBycategoryIdQuery(
      req.params.categoryId,
      req.tenantId!
    );
    if (subcategories && subcategories.length > 0) {
      logStructured(
        "successful",
        `retrieved ${subcategories.length} NIST AI RMF subcategories by category ID`,
        "getAllNISTAIRMFSubcategoriesBycategoryId",
        "nist_ai_rmf.subcategory.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](subcategories));
    }
    logStructured(
      "error",
      "no NIST AI RMF subcategories found by category ID",
      "getAllNISTAIRMFSubcategoriesBycategoryId",
      "nist_ai_rmf.subcategory.ctrl.ts"
    );
    return res.status(404).json(STATUS_CODE[404](subcategories));
  } catch (error) {
    await logEvent(
      "Error",
      `Failed to retrieve NIST AI RMF subcategories by category ID: ${(error as Error).message}`
    );
    logger.error(
      "❌ Error in getAllNISTAIRMFSubcategoriesBycategoryId:",
      error
    );
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
