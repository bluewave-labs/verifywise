import { Request, Response } from "express";
import logger, { logStructured } from "../utils/logger/fileLogger";
import {
  getAllNISTAIRMFSubcategoriesBycategoryIdAndtitleQuery,
  getNISTAIRMFSubcategoryByIdQuery,
} from "../utils/nist_ai_rmf.subcategory.utils";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { logEvent } from "../utils/logger/dbLogger";

export async function getAllNISTAIRMFSubcategoriesBycategoryIdAndtitle(
  req: Request,
  res: Response
): Promise<any> {
  logStructured(
    "processing",
    "starting to get all NIST AI RMF subcategories by title",
    "getAllNISTAIRMFSubcategoriesBycategoryIdAndtitle",
    "nist_ai_rmf.subcategory.ctrl.ts"
  );
  logger.debug("🔍 Fetching all NIST AI RMF subcategories by title");
  try {
    const subcategories =
      await getAllNISTAIRMFSubcategoriesBycategoryIdAndtitleQuery(
        Number(req.params.categoryId),
        req.params.title,
        req.tenantId!
      );
    if (subcategories && subcategories.length > 0) {
      logStructured(
        "successful",
        `retrieved ${subcategories.length} NIST AI RMF subcategories by title`,
        "getAllNISTAIRMFSubcategoriesBycategoryIdAndtitle",
        "nist_ai_rmf.subcategory.ctrl.ts:"
      );
      return res.status(200).json(STATUS_CODE[200](subcategories));
    }
    logStructured(
      "error",
      "no NIST AI RMF subcategories found by title",
      "getAllNISTAIRMFSubcategoriesBycategoryIdAndtitle:",
      "nist_ai_rmf.subcategory.ctrl.ts"
    );
    return res.status(404).json(STATUS_CODE[404](subcategories));
  } catch (error) {
    await logEvent(
      "Error",
      `Failed to retrieve NIST AI RMF subcategories by category id and title: ${(error as Error).message}`
    );
    logger.error(
      "❌ Error in getAllNISTAIRMFSubcategoriesBycategoryIdAndtitle:",
      error
    );
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getNISTAIRMFSubcategoryById(
  req: Request,
  res: Response
): Promise<any> {
  logStructured(
    "processing",
    "starting to get NIST AI RMF subcategory by id",
    "getNISTAIRMFSubcategoryByIdQuery",
    "nist_ai_rmf.subcategory.ctrl.ts"
  );
  logger.debug("🔍 Fetching NIST AI RMF subcategory by id");
  try {
    const subcategory = await getNISTAIRMFSubcategoryByIdQuery(
      Number(req.params.id),
      req.tenantId!
    );
    if (subcategory) {
      logStructured(
        "successful",
        "NIST AI RMF subcategory found by id",
        "getNISTAIRMFSubcategoryByIdQuery",
        "nist_ai_rmf.subcategory.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](subcategory));
    }
    logStructured(
      "error",
      "NIST AI RMF subcategory not found by id",
      "getNISTAIRMFSubcategoryByIdQuery",
      "nist_ai_rmf.subcategory.ctrl.ts"
    );
    return res.status(404).json(STATUS_CODE[404](subcategory));
  } catch (error) {
    await logEvent(
      "Error",
      `Failed to retrieve NIST AI RMF subcategory by id: ${(error as Error).message}`
    );
  }
}
