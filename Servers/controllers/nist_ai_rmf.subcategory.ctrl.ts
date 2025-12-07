import { Request, Response } from "express";
import logger, { logStructured } from "../utils/logger/fileLogger";
import {
  getAllNISTAIRMFSubcategoriesBycategoryIdAndtitleQuery,
  getNISTAIRMFSubcategoryByIdQuery,
  getNISTAIRMFSubcategoryRisksQuery,
  updateNISTAIRMFSubcategoryByIdQuery,
  updateNISTAIRMFSubcategoryStatusByIdQuery,
  countNISTAIRMFSubcategoriesProgress,
  countNISTAIRMFSubcategoriesAssignments,
  countNISTAIRMFSubcategoriesAssignmentsByFunction,
  countNISTAIRMFSubcategoriesProgressByFunction,
  getNISTAIRMFSubcategoriesStatusBreakdown,
  getNISTAIRMFDashboardOverview,
} from "../utils/nist_ai_rmf.subcategory.utils";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { logEvent } from "../utils/logger/dbLogger";
import { sequelize } from "../database/db";
import { NISTAIMRFSubcategoryModel } from "../domain.layer/frameworks/NIST-AI-RMF/nist_ai_rmf_subcategory.model";
import {
  logFailure,
  logProcessing,
  logSuccess,
} from "../utils/logger/logHelper";
import { deleteFileById, uploadFile } from "../utils/fileUpload.utils";
import { UploadedFile, RequestWithFile } from "../utils/question.utils";
import { Transaction } from "sequelize";
import { getUserProjects } from "../utils/user.utils";

// helper function to delete files
async function deleteFiles(
  filesToDelete: number[],
  tenant: string,
  transaction: Transaction
): Promise<void> {
  await Promise.all(
    filesToDelete.map(async (fileId) => {
      await deleteFileById(fileId, tenant, transaction);
    })
  );
}

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

/**
 * Get all risks linked to a NIST AI RMF subcategory
 */
export async function getNISTAIRMFSubcategoryRisks(
  req: Request,
  res: Response
): Promise<any> {
  const subcategoryId = parseInt(req.params.id);

  logProcessing({
    description: `starting getNISTAIRMFSubcategoryRisks for subcategory ID ${subcategoryId}`,
    functionName: "getNISTAIRMFSubcategoryRisks",
    fileName: "nist_ai_rmf.subcategory.ctrl.ts",
  });
  logger.debug(`🔍 Fetching risks for NIST AI RMF subcategory ${subcategoryId}`);

  try {
    const risks = await getNISTAIRMFSubcategoryRisksQuery(
      subcategoryId,
      req.tenantId!
    );

    await logSuccess({
      eventType: "Read",
      description: `Successfully retrieved ${risks.length} risks for NIST AI RMF subcategory ${subcategoryId}`,
      functionName: "getNISTAIRMFSubcategoryRisks",
      fileName: "nist_ai_rmf.subcategory.ctrl.ts",
    });

    return res.status(200).json({
      message: "Risks retrieved successfully",
      data: risks,
    });
  } catch (error) {
    await logEvent(
      "Error",
      `Failed to get NIST AI RMF subcategory risks: ${(error as Error).message}`
    );
    await logFailure({
      eventType: "Read",
      description: `Failed to get NIST AI RMF subcategory risks: ${(error as Error).message}`,
      functionName: "getNISTAIRMFSubcategoryRisks",
      fileName: "nist_ai_rmf.subcategory.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateNISTAIRMFSubcategoryById(
  req: RequestWithFile,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const subcategoryId = parseInt(req.params.id);

  logProcessing({
    description: `starting updateNISTAIRMFSubcategoryById for subcategory ID ${subcategoryId}`,
    functionName: "updateNISTAIRMFSubcategoryById",
    fileName: "nist_ai_rmf.subcategory.ctrl.ts",
  });
  logger.debug(`💾 Updating NIST AI RMF subcategory by id ${subcategoryId}`);

  try {
    const subcategory = req.body as Partial<NISTAIMRFSubcategoryModel> & {
      user_id?: string;
      delete?: string;
      project_id?: string;
      tags?: string | string[]; // Tags come as JSON string from FormData
      risksDelete?: string; // JSON string of risk IDs to delete
      risksMitigated?: string; // JSON string of risk IDs to add
    };

    // Parse tags from JSON string if present
    if (subcategory.tags && typeof subcategory.tags === "string") {
      try {
        (subcategory as any).tags = JSON.parse(subcategory.tags) as string[];
      } catch (error) {
        // If parsing fails, treat as empty array
        (subcategory as any).tags = [];
      }
    }

    // Parse deleted files if present - convert to numbers for database deletion
    const filesToDelete = subcategory.delete
      ? ((JSON.parse(subcategory.delete || "[]") as (string | number)[])
          .map((id) => (typeof id === "string" ? parseInt(id, 10) : id))
          .filter((id) => !isNaN(id)) as number[])
      : [];

    // Delete files from database (ISO pattern)
    await deleteFiles(filesToDelete, req.tenantId!, transaction);

    // Get user's project ID for file uploads
    let userProjectId = 1; // Default fallback
    try {
      const userProjects = await getUserProjects(
        Number(req.userId),
        req.tenantId!
      );
      if (userProjects && userProjects.length > 0) {
        userProjectId = userProjects[0].id!; // Use first project user has access to
      }
    } catch (error) {
      logger.warn("Could not fetch user projects, using default project ID 1");
    }

    // Handle file uploads
    let uploadedFiles: {
      id: string;
      fileName: string;
      project_id: number;
      uploaded_by: number;
      uploaded_time: string;
      type: string;
      source: string;
    }[] = [];

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files as UploadedFile[]) {
        const uploadedFile = await uploadFile(
          file,
          subcategory.user_id
            ? parseInt(subcategory.user_id)
            : Number(req.userId),
          subcategory.project_id
            ? parseInt(subcategory.project_id)
            : userProjectId,
          "Main clauses group",
          req.tenantId!,
          transaction
        );

        uploadedFiles.push({
          id: uploadedFile.id!.toString(),
          fileName: uploadedFile.filename,
          project_id: uploadedFile.project_id,
          uploaded_by: uploadedFile.uploaded_by,
          uploaded_time: uploadedFile.uploaded_time.toISOString().split("T")[0], // Simple date format
          type: uploadedFile.type || "application/octet-stream",
          source: uploadedFile.source || "Main clauses group",
        });
      }
    }

    // Convert file IDs to strings for evidence_links filtering (evidence_links stores IDs as strings)
    const filesToDeleteAsStrings = filesToDelete.map((id) => id.toString());

    const updatedSubcategory = await updateNISTAIRMFSubcategoryByIdQuery(
      subcategoryId,
      {
        ...subcategory,
        risksDelete: subcategory.risksDelete,
        risksMitigated: subcategory.risksMitigated,
      },
      uploadedFiles,
      filesToDeleteAsStrings,
      req.tenantId!,
      transaction
    );

    await transaction.commit();
    await logEvent(
      "Update",
      `NIST AI RMF subcategory updated: ID ${subcategoryId}, title: ${updatedSubcategory.title}`
    );
    logStructured(
      "successful",
      `NIST AI RMF subcategory updated: ID ${subcategoryId}, title: ${updatedSubcategory.title}`,
      "updateNISTAIRMFSubcategoryById",
      "nist_ai_rmf.subcategory.ctrl.ts"
    );
    await logSuccess({
      eventType: "Update",
      description: `Successfully updated NIST AI RMF subcategory by id: ${subcategoryId}`,
      functionName: "updateNISTAIRMFSubcategoryById",
      fileName: "nist_ai_rmf.subcategory.ctrl.ts",
    });
    return res.status(200).json(STATUS_CODE[200](updatedSubcategory));
  } catch (error) {
    await transaction.rollback();
    await logEvent(
      "Error",
      `Failed to update NIST AI RMF subcategory by id: ${(error as Error).message}`
    );
    await logFailure({
      eventType: "Update",
      description: `Failed to update NIST AI RMF subcategory by id: ${(error as Error).message}`,
      functionName: "updateNISTAIRMFSubcategoryById",
      fileName: "nist_ai_rmf.subcategory.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateNISTAIRMFSubcategoryStatus(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const subcategoryId = parseInt(req.params.id);
  const { status } = req.body;

  logProcessing({
    description: `starting updateNISTAIRMFSubcategoryStatus for subcategory ID ${subcategoryId} with status: ${status}`,
    functionName: "updateNISTAIRMFSubcategoryStatus",
    fileName: "nist_ai_rmf.subcategory.ctrl.ts",
  });
  logger.debug(
    `🔄 Updating NIST AI RMF subcategory status: ID ${subcategoryId}, status: ${status}`
  );

  try {
    // Validate request body
    if (!status) {
      await transaction.rollback();
      await logFailure({
        eventType: "Update",
        description: `Failed to update NIST AI RMF subcategory status: Status is required`,
        functionName: "updateNISTAIRMFSubcategoryStatus",
        fileName: "nist_ai_rmf.subcategory.ctrl.ts",
        error: new Error("Status is required"),
      });
      return res.status(400).json(STATUS_CODE[400]("Status is required"));
    }

    const updatedSubcategory = await updateNISTAIRMFSubcategoryStatusByIdQuery(
      subcategoryId,
      status,
      req.tenantId!,
      transaction
    );

    await transaction.commit();
    await logEvent(
      "Update",
      `NIST AI RMF subcategory status updated: ID ${subcategoryId}, status: ${status}`
    );
    logStructured(
      "successful",
      `NIST AI RMF subcategory status updated: ID ${subcategoryId}, status: ${status}`,
      "updateNISTAIRMFSubcategoryStatus",
      "nist_ai_rmf.subcategory.ctrl.ts"
    );
    await logSuccess({
      eventType: "Update",
      description: `Successfully updated NIST AI RMF subcategory status: ID ${subcategoryId}, status: ${status}`,
      functionName: "updateNISTAIRMFSubcategoryStatus",
      fileName: "nist_ai_rmf.subcategory.ctrl.ts",
    });
    return res.status(200).json(STATUS_CODE[200](updatedSubcategory));
  } catch (error) {
    await transaction.rollback();
    await logEvent(
      "Error",
      `Failed to update NIST AI RMF subcategory status: ${(error as Error).message}`
    );
    await logFailure({
      eventType: "Update",
      description: `Failed to update NIST AI RMF subcategory status: ${(error as Error).message}`,
      functionName: "updateNISTAIRMFSubcategoryStatus",
      fileName: "nist_ai_rmf.subcategory.ctrl.ts",
      error: error as Error,
    });

    // Handle validation errors differently
    if (
      error instanceof Error &&
      error.message.includes("Invalid status value")
    ) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get NIST AI RMF subcategories progress (total and completed)
 */
export async function getNISTAIRMFProgress(
  req: Request,
  res: Response
): Promise<any> {
  logProcessing({
    description: "starting getNISTAIRMFProgress",
    functionName: "getNISTAIRMFProgress",
    fileName: "nist_ai_rmf.subcategory.ctrl.ts",
  });
  logger.debug("📊 Calculating NIST AI RMF progress");

  try {
    const progress = await countNISTAIRMFSubcategoriesProgress(req.tenantId!);

    await logSuccess({
      eventType: "Read",
      description: `Successfully retrieved NIST AI RMF progress: ${progress.doneSubcategories}/${progress.totalSubcategories}`,
      functionName: "getNISTAIRMFProgress",
      fileName: "nist_ai_rmf.subcategory.ctrl.ts",
    });

    return res.status(200).json(STATUS_CODE[200](progress));
  } catch (error) {
    await logEvent(
      "Error",
      `Failed to get NIST AI RMF progress: ${(error as Error).message}`
    );
    await logFailure({
      eventType: "Read",
      description: `Failed to get NIST AI RMF progress: ${(error as Error).message}`,
      functionName: "getNISTAIRMFProgress",
      fileName: "nist_ai_rmf.subcategory.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get NIST AI RMF subcategories assignments (total and assigned)
 */
export async function getNISTAIRMFAssignments(
  req: Request,
  res: Response
): Promise<any> {
  logProcessing({
    description: "starting getNISTAIRMFAssignments",
    functionName: "getNISTAIRMFAssignments",
    fileName: "nist_ai_rmf.subcategory.ctrl.ts",
  });
  logger.debug("📊 Calculating NIST AI RMF assignments");

  try {
    const assignments = await countNISTAIRMFSubcategoriesAssignments(req.tenantId!);

    await logSuccess({
      eventType: "Read",
      description: `Successfully retrieved NIST AI RMF assignments: ${assignments.assignedSubcategories}/${assignments.totalSubcategories}`,
      functionName: "getNISTAIRMFAssignments",
      fileName: "nist_ai_rmf.subcategory.ctrl.ts",
    });

    return res.status(200).json(STATUS_CODE[200](assignments));
  } catch (error) {
    await logEvent(
      "Error",
      `Failed to get NIST AI RMF assignments: ${(error as Error).message}`
    );
    await logFailure({
      eventType: "Read",
      description: `Failed to get NIST AI RMF assignments: ${(error as Error).message}`,
      functionName: "getNISTAIRMFAssignments",
      fileName: "nist_ai_rmf.subcategory.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get NIST AI RMF subcategories assignments grouped by function (Govern, Map, Measure, Manage)
 */
export async function getNISTAIRMFAssignmentsByFunction(
  req: Request,
  res: Response
): Promise<any> {
  logProcessing({
    description: "starting getNISTAIRMFAssignmentsByFunction",
    functionName: "getNISTAIRMFAssignmentsByFunction",
    fileName: "nist_ai_rmf.subcategory.ctrl.ts",
  });
  logger.debug("📊 Calculating NIST AI RMF assignments by function");

  try {
    const assignments = await countNISTAIRMFSubcategoriesAssignmentsByFunction(req.tenantId!);

    await logSuccess({
      eventType: "Read",
      description: "Successfully retrieved NIST AI RMF assignments by function",
      functionName: "getNISTAIRMFAssignmentsByFunction",
      fileName: "nist_ai_rmf.subcategory.ctrl.ts",
    });

    return res.status(200).json(STATUS_CODE[200](assignments));
  } catch (error) {
    await logEvent(
      "Error",
      `Failed to get NIST AI RMF assignments by function: ${(error as Error).message}`
    );
    await logFailure({
      eventType: "Read",
      description: `Failed to get NIST AI RMF assignments by function: ${(error as Error).message}`,
      functionName: "getNISTAIRMFAssignmentsByFunction",
      fileName: "nist_ai_rmf.subcategory.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get NIST AI RMF subcategories progress grouped by function (Govern, Map, Measure, Manage)
 */
export async function getNISTAIRMFProgressByFunction(
  req: Request,
  res: Response
): Promise<any> {
  logProcessing({
    description: "starting getNISTAIRMFProgressByFunction",
    functionName: "getNISTAIRMFProgressByFunction",
    fileName: "nist_ai_rmf.subcategory.ctrl.ts",
  });
  logger.debug("📊 Calculating NIST AI RMF progress by function");

  try {
    const progress = await countNISTAIRMFSubcategoriesProgressByFunction(req.tenantId!);

    await logSuccess({
      eventType: "Read",
      description: "Successfully retrieved NIST AI RMF progress by function",
      functionName: "getNISTAIRMFProgressByFunction",
      fileName: "nist_ai_rmf.subcategory.ctrl.ts",
    });

    return res.status(200).json(STATUS_CODE[200](progress));
  } catch (error) {
    await logEvent(
      "Error",
      `Failed to get NIST AI RMF progress by function: ${(error as Error).message}`
    );
    await logFailure({
      eventType: "Read",
      description: `Failed to get NIST AI RMF progress by function: ${(error as Error).message}`,
      functionName: "getNISTAIRMFProgressByFunction",
      fileName: "nist_ai_rmf.subcategory.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get NIST AI RMF subcategories status breakdown
 */
export async function getNISTAIRMFStatusBreakdown(
  req: Request,
  res: Response
): Promise<any> {
  logProcessing({
    description: "starting getNISTAIRMFStatusBreakdown",
    functionName: "getNISTAIRMFStatusBreakdown",
    fileName: "nist_ai_rmf.subcategory.ctrl.ts",
  });
  logger.debug("📊 Calculating NIST AI RMF status breakdown");

  try {
    const statusBreakdown = await getNISTAIRMFSubcategoriesStatusBreakdown(req.tenantId!);

    await logSuccess({
      eventType: "Read",
      description: "Successfully retrieved NIST AI RMF status breakdown",
      functionName: "getNISTAIRMFStatusBreakdown",
      fileName: "nist_ai_rmf.subcategory.ctrl.ts",
    });

    return res.status(200).json(STATUS_CODE[200](statusBreakdown));
  } catch (error) {
    await logEvent(
      "Error",
      `Failed to get NIST AI RMF status breakdown: ${(error as Error).message}`
    );
    await logFailure({
      eventType: "Read",
      description: `Failed to get NIST AI RMF status breakdown: ${(error as Error).message}`,
      functionName: "getNISTAIRMFStatusBreakdown",
      fileName: "nist_ai_rmf.subcategory.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get NIST AI RMF dashboard overview with all functions, categories, and subcategories
 */
export async function getNISTAIRMFOverview(
  req: Request,
  res: Response
): Promise<any> {
  logProcessing({
    description: "starting getNISTAIRMFOverview",
    functionName: "getNISTAIRMFOverview",
    fileName: "nist_ai_rmf.subcategory.ctrl.ts",
  });
  logger.debug("📊 Fetching NIST AI RMF dashboard overview");

  try {
    const overview = await getNISTAIRMFDashboardOverview(req.tenantId!);

    await logSuccess({
      eventType: "Read",
      description: `Successfully retrieved NIST AI RMF overview with ${overview.functions.length} functions`,
      functionName: "getNISTAIRMFOverview",
      fileName: "nist_ai_rmf.subcategory.ctrl.ts",
    });

    return res.status(200).json(STATUS_CODE[200](overview));
  } catch (error) {
    await logEvent(
      "Error",
      `Failed to get NIST AI RMF overview: ${(error as Error).message}`
    );
    await logFailure({
      eventType: "Read",
      description: `Failed to get NIST AI RMF overview: ${(error as Error).message}`,
      functionName: "getNISTAIRMFOverview",
      fileName: "nist_ai_rmf.subcategory.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
