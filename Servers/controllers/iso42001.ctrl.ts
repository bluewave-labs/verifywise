import { Request, Response } from "express";
import { sequelize } from "../database/db";
import { SubClauseISO } from "../domain.layer/frameworks/ISO-42001/subClauseISO.model";
import { deleteFileById, uploadFile } from "../utils/fileUpload.utils";
import { RequestWithFile, UploadedFile } from "../utils/question.utils";
import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  countAnnexCategoriesISOByProjectId,
  countSubClausesISOByProjectId,
  deleteAnnexCategoriesISOByProjectIdQuery,
  deleteSubClausesISOByProjectIdQuery,
  getAllAnnexesQuery,
  getAllAnnexesWithCategoriesQuery,
  getAllClausesQuery,
  getAllClausesWithSubClauseQuery,
  getAnnexCategoriesByAnnexIdQuery,
  getAnnexCategoryByIdForProjectQuery,
  getAnnexesByProjectIdQuery,
  getClausesByProjectIdQuery,
  getSubClauseByIdForProjectQuery,
  getSubClausesByClauseIdQuery,
  updateAnnexCategoryQuery,
  updateSubClauseQuery,
} from "../utils/iso42001.utils";
import { FileType } from "../domain.layer/models/file/file.model";
import { AnnexCategoryISO } from "../domain.layer/frameworks/ISO-42001/annexCategoryISO.model";
import {
  getAllProjectsQuery,
  updateProjectUpdatedByIdQuery,
} from "../utils/project.utils";
import { IProjectAttributes } from "../domain.layer/interfaces/i.project";
import {
  logProcessing,
  logSuccess,
  logFailure,
} from "../utils/logger/logHelper";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { logEvent } from "../utils/logger/dbLogger";

export async function getAllClauses(req: Request, res: Response): Promise<any> {
  logProcessing({
    description: "starting getAllClauses",
    functionName: "getAllClauses",
    fileName: "iso42001.ctrl.ts",
  });
  logger.debug("🔍 Fetching all clauses");

  try {
    const clauses = await getAllClausesQuery(req.tenantId!);

    await logSuccess({
      eventType: "Read",
      description: "Retrieved all clauses",
      functionName: "getAllClauses",
      fileName: "iso42001.ctrl.ts",
    });

    return res.status(200).json(clauses);
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve clauses",
      functionName: "getAllClauses",
      fileName: "iso42001.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAllClausesStructForProject(
  req: Request,
  res: Response
): Promise<any> {
  const projectFrameworkId = parseInt(req.params.id);

  logProcessing({
    description: `starting getAllClausesStructForProject for project framework ID ${projectFrameworkId}`,
    functionName: "getAllClausesStructForProject",
    fileName: "iso42001.ctrl.ts",
  });
  logger.debug(
    `🔍 Fetching clauses structure for project framework ID ${projectFrameworkId}`
  );

  try {
    const clauses = await getAllClausesWithSubClauseQuery(
      projectFrameworkId,
      req.tenantId!
    );

    await logSuccess({
      eventType: "Read",
      description: `Retrieved clauses structure for project framework ID ${projectFrameworkId}`,
      functionName: "getAllClausesStructForProject",
      fileName: "iso42001.ctrl.ts",
    });

    return res.status(200).json(clauses);
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: `Failed to retrieve clauses structure for project framework ID ${projectFrameworkId}`,
      functionName: "getAllClausesStructForProject",
      fileName: "iso42001.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAllAnnexesStructForProject(
  req: Request,
  res: Response
): Promise<any> {
  const projectFrameworkId = parseInt(req.params.id);

  logProcessing({
    description: `starting getAllAnnexesStructForProject for project framework ID ${projectFrameworkId}`,
    functionName: "getAllAnnexesStructForProject",
    fileName: "iso42001.ctrl.ts",
  });
  logger.debug(
    `🔍 Fetching annexes structure for project framework ID ${projectFrameworkId}`
  );

  try {
    const annexes = await getAllAnnexesWithCategoriesQuery(
      projectFrameworkId,
      req.tenantId!
    );

    await logSuccess({
      eventType: "Read",
      description: `Retrieved annexes structure for project framework ID ${projectFrameworkId}`,
      functionName: "getAllAnnexesStructForProject",
      fileName: "iso42001.ctrl.ts",
    });

    return res.status(200).json(annexes);
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: `Failed to retrieve annexes structure for project framework ID ${projectFrameworkId}`,
      functionName: "getAllAnnexesStructForProject",
      fileName: "iso42001.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAllAnnexes(req: Request, res: Response): Promise<any> {
  logProcessing({
    description: "starting getAllAnnexes",
    functionName: "getAllAnnexes",
    fileName: "iso42001.ctrl.ts",
  });
  logger.debug("🔍 Fetching all annexes");

  try {
    const annexes = await getAllAnnexesQuery(req.tenantId!);

    await logSuccess({
      eventType: "Read",
      description: "Retrieved all annexes",
      functionName: "getAllAnnexes",
      fileName: "iso42001.ctrl.ts",
    });

    return res.status(200).json(annexes);
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve annexes",
      functionName: "getAllAnnexes",
      fileName: "iso42001.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getSubClausesByClauseId(
  req: Request,
  res: Response
): Promise<any> {
  const clauseId = parseInt(req.params.id);

  logProcessing({
    description: `starting getSubClausesByClauseId for clause ID ${clauseId}`,
    functionName: "getSubClausesByClauseId",
    fileName: "iso42001.ctrl.ts",
  });
  logger.debug(`🔍 Fetching sub-clauses for clause ID ${clauseId}`);

  try {
    const subClauses = await getSubClausesByClauseIdQuery(
      clauseId,
      req.tenantId!
    );
    if (subClauses) {
      await logSuccess({
        eventType: "Read",
        description: `Retrieved sub-clauses for clause ID ${clauseId}`,
        functionName: "getSubClausesByClauseId",
        fileName: "iso42001.ctrl.ts",
      });
      return res.status(200).json(STATUS_CODE[200](subClauses));
    }

    await logSuccess({
      eventType: "Read",
      description: `No sub-clauses found for clause ID ${clauseId}`,
      functionName: "getSubClausesByClauseId",
      fileName: "iso42001.ctrl.ts",
    });
    return res.status(400).json(STATUS_CODE[400]("No sub clauses found"));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: `Failed to retrieve sub-clauses for clause ID ${clauseId}`,
      functionName: "getSubClausesByClauseId",
      fileName: "iso42001.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAnnexCategoriesByAnnexId(
  req: Request,
  res: Response
): Promise<any> {
  const annexId = parseInt(req.params.id);

  logProcessing({
    description: `starting getAnnexCategoriesByAnnexId for annex ID ${annexId}`,
    functionName: "getAnnexCategoriesByAnnexId",
    fileName: "iso42001.ctrl.ts",
  });
  logger.debug(`🔍 Fetching annex categories for annex ID ${annexId}`);

  try {
    const annexCategories = await getAnnexCategoriesByAnnexIdQuery(
      annexId,
      req.tenantId!
    );
    if (annexCategories) {
      await logSuccess({
        eventType: "Read",
        description: `Retrieved annex categories for annex ID ${annexId}`,
        functionName: "getAnnexCategoriesByAnnexId",
        fileName: "iso42001.ctrl.ts",
      });
      return res.status(200).json(STATUS_CODE[200](annexCategories));
    }

    await logSuccess({
      eventType: "Read",
      description: `No annex categories found for annex ID ${annexId}`,
      functionName: "getAnnexCategoriesByAnnexId",
      fileName: "iso42001.ctrl.ts",
    });
    return res.status(400).json(STATUS_CODE[400]("No annex categories found"));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: `Failed to retrieve annex categories for annex ID ${annexId}`,
      functionName: "getAnnexCategoriesByAnnexId",
      fileName: "iso42001.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getSubClauseById(
  req: Request,
  res: Response
): Promise<any> {
  const subClauseId = parseInt(req.params.id);
  const projectFrameworkId = parseInt(req.query.projectFrameworkId as string);

  logProcessing({
    description: `starting getSubClauseById for sub-clause ID ${subClauseId} and project framework ID ${projectFrameworkId}`,
    functionName: "getSubClauseById",
    fileName: "iso42001.ctrl.ts",
  });
  logger.debug(
    `🔍 Looking up sub-clause ID ${subClauseId} for project framework ID ${projectFrameworkId}`
  );

  try {
    const subClause = await getSubClauseByIdForProjectQuery(
      subClauseId,
      projectFrameworkId,
      req.tenantId!
    );
    if (subClause) {
      await logSuccess({
        eventType: "Read",
        description: `Retrieved sub-clause ID ${subClauseId} for project framework ID ${projectFrameworkId}`,
        functionName: "getSubClauseById",
        fileName: "iso42001.ctrl.ts",
      });
      return res.status(200).json(STATUS_CODE[200](subClause));
    }

    await logSuccess({
      eventType: "Read",
      description: `No sub-clause found: ID ${subClauseId} for project framework ID ${projectFrameworkId}`,
      functionName: "getSubClauseById",
      fileName: "iso42001.ctrl.ts",
    });
    return res.status(400).json(STATUS_CODE[400]("No sub clause found"));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: `Failed to retrieve sub-clause ID ${subClauseId} for project framework ID ${projectFrameworkId}`,
      functionName: "getSubClauseById",
      fileName: "iso42001.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAnnexCategoryById(
  req: Request,
  res: Response
): Promise<any> {
  const annexCategoryId = parseInt(req.params.id);
  const projectFrameworkId = parseInt(req.query.projectFrameworkId as string);

  logProcessing({
    description: `starting getAnnexCategoryById for annex category ID ${annexCategoryId} and project framework ID ${projectFrameworkId}`,
    functionName: "getAnnexCategoryById",
    fileName: "iso42001.ctrl.ts",
  });
  logger.debug(
    `🔍 Looking up annex category ID ${annexCategoryId} for project framework ID ${projectFrameworkId}`
  );

  try {
    const annexCategory = await getAnnexCategoryByIdForProjectQuery(
      annexCategoryId,
      projectFrameworkId,
      req.tenantId!
    );
    if (annexCategory) {
      await logSuccess({
        eventType: "Read",
        description: `Retrieved annex category ID ${annexCategoryId} for project framework ID ${projectFrameworkId}`,
        functionName: "getAnnexCategoryById",
        fileName: "iso42001.ctrl.ts",
      });
      return res.status(200).json(STATUS_CODE[200](annexCategory));
    }

    await logSuccess({
      eventType: "Read",
      description: `No annex category found: ID ${annexCategoryId} for project framework ID ${projectFrameworkId}`,
      functionName: "getAnnexCategoryById",
      fileName: "iso42001.ctrl.ts",
    });
    return res.status(400).json(STATUS_CODE[400]("No annex category found"));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: `Failed to retrieve annex category ID ${annexCategoryId} for project framework ID ${projectFrameworkId}`,
      functionName: "getAnnexCategoryById",
      fileName: "iso42001.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getClausesByProjectId(
  req: Request,
  res: Response
): Promise<any> {
  const projectFrameworkId = parseInt(req.params.id);

  logProcessing({
    description: `starting getClausesByProjectId for project framework ID ${projectFrameworkId}`,
    functionName: "getClausesByProjectId",
    fileName: "iso42001.ctrl.ts",
  });
  logger.debug(
    `🔍 Fetching clauses for project framework ID ${projectFrameworkId}`
  );

  try {
    const subClauses = await getClausesByProjectIdQuery(
      projectFrameworkId,
      req.tenantId!
    );
    if (subClauses) {
      await logSuccess({
        eventType: "Read",
        description: `Retrieved clauses for project framework ID ${projectFrameworkId}`,
        functionName: "getClausesByProjectId",
        fileName: "iso42001.ctrl.ts",
      });
      return res.status(200).json(STATUS_CODE[200](subClauses));
    }

    await logSuccess({
      eventType: "Read",
      description: `No clauses found for project framework ID ${projectFrameworkId}`,
      functionName: "getClausesByProjectId",
      fileName: "iso42001.ctrl.ts",
    });
    return res.status(400).json(STATUS_CODE[400]("No sub clauses found"));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: `Failed to retrieve clauses for project framework ID ${projectFrameworkId}`,
      functionName: "getClausesByProjectId",
      fileName: "iso42001.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAnnexesByProjectId(
  req: Request,
  res: Response
): Promise<any> {
  const projectFrameworkId = parseInt(req.params.id);

  logProcessing({
    description: `starting getAnnexesByProjectId for project framework ID ${projectFrameworkId}`,
    functionName: "getAnnexesByProjectId",
    fileName: "iso42001.ctrl.ts",
  });
  logger.debug(
    `🔍 Fetching annexes for project framework ID ${projectFrameworkId}`
  );

  try {
    const annexCategories = await getAnnexesByProjectIdQuery(
      projectFrameworkId,
      req.tenantId!
    );
    if (annexCategories) {
      await logSuccess({
        eventType: "Read",
        description: `Retrieved annexes for project framework ID ${projectFrameworkId}`,
        functionName: "getAnnexesByProjectId",
        fileName: "iso42001.ctrl.ts",
      });
      return res.status(200).json(STATUS_CODE[200](annexCategories));
    }

    await logSuccess({
      eventType: "Read",
      description: `No annexes found for project framework ID ${projectFrameworkId}`,
      functionName: "getAnnexesByProjectId",
      fileName: "iso42001.ctrl.ts",
    });
    return res.status(400).json(STATUS_CODE[400]("No annex categories found"));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: `Failed to retrieve annexes for project framework ID ${projectFrameworkId}`,
      functionName: "getAnnexesByProjectId",
      fileName: "iso42001.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

// helper function to delete files
async function deleteFiles(
  filesToDelete: number[],
  tenant: string,
  transaction: any
): Promise<void> {
  await Promise.all(
    filesToDelete.map(async (fileId) => {
      await deleteFileById(fileId, tenant, transaction);
    })
  );
}

// helper function to upload files
async function uploadFiles(
  files: UploadedFile[],
  userId: number,
  projectFrameworkId: number,
  source: "Management system clauses group" | "Reference controls group",
  tenant: string,
  transaction: any
): Promise<FileType[]> {
  let uploadedFiles: FileType[] = [];
  await Promise.all(
    files.map(async (file) => {
      const uploadedFile = await uploadFile(
        file,
        userId,
        projectFrameworkId,
        source,
        tenant,
        transaction
      );

      uploadedFiles.push({
        id: uploadedFile.id!.toString(),
        fileName: uploadedFile.filename,
        project_id: uploadedFile.project_id,
        uploaded_by: uploadedFile.uploaded_by,
        uploaded_time: uploadedFile.uploaded_time,
        type: uploadedFile.type,
        source: uploadedFile.source,
      });
    })
  );
  return uploadedFiles;
}

export async function saveClauses(
  req: RequestWithFile,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const subClauseId = parseInt(req.params.id);

  logProcessing({
    description: `starting saveClauses for sub-clause ID ${subClauseId}`,
    functionName: "saveClauses",
    fileName: "iso42001.ctrl.ts",
  });
  logger.debug(`💾 Saving clauses for sub-clause ID ${subClauseId}`);

  try {
    const subClause = req.body as SubClauseISO & {
      user_id: string;
      project_id: string;
      delete: string;
      risksDelete: string;
      risksMitigated: string;
    };

    const filesToDelete = JSON.parse(subClause.delete || "[]") as number[];
    await deleteFiles(filesToDelete, req.tenantId!, transaction);

    let uploadedFiles = await uploadFiles(
      req.files! as UploadedFile[],
      parseInt(subClause.user_id),
      parseInt(subClause.project_id),
      "Management system clauses group",
      req.tenantId!,
      transaction
    );

    const updatedSubClause = await updateSubClauseQuery(
      subClauseId,
      subClause,
      uploadedFiles,
      filesToDelete,
      req.tenantId!,
      transaction
    );

    // Update the project's last updated date
    await updateProjectUpdatedByIdQuery(
      subClauseId,
      "subclauses",
      req.tenantId!,
      transaction
    );
    await transaction.commit();

    await logSuccess({
      eventType: "Update",
      description: `Successfully saved clauses for sub-clause ID ${subClauseId}`,
      functionName: "saveClauses",
      fileName: "iso42001.ctrl.ts",
    });

    return res.status(200).json(STATUS_CODE[200](updatedSubClause));
  } catch (error) {
    await transaction.rollback();
    await logFailure({
      eventType: "Update",
      description: `Failed to save clauses for sub-clause ID ${subClauseId}`,
      functionName: "saveClauses",
      fileName: "iso42001.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function saveAnnexes(
  req: RequestWithFile,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const annexCategoryId = parseInt(req.params.id);

  logProcessing({
    description: `starting saveAnnexes for annex category ID ${annexCategoryId}`,
    functionName: "saveAnnexes",
    fileName: "iso42001.ctrl.ts",
  });
  logger.debug(`💾 Saving annexes for annex category ID ${annexCategoryId}`);

  try {
    const annexCategory = req.body as AnnexCategoryISO & {
      user_id: string;
      project_id: string;
      delete: string;
      risksDelete: string;
      risksMitigated: string;
    };

    const filesToDelete = JSON.parse(annexCategory.delete || "[]") as number[];
    await deleteFiles(filesToDelete, req.tenantId!, transaction);

    let uploadedFiles = await uploadFiles(
      req.files! as UploadedFile[],
      parseInt(annexCategory.user_id),
      parseInt(annexCategory.project_id),
      "Reference controls group",
      req.tenantId!,
      transaction
    );

    const updatedAnnexCategory = await updateAnnexCategoryQuery(
      annexCategoryId,
      annexCategory,
      uploadedFiles,
      filesToDelete,
      req.tenantId!,
      transaction
    );

    // Update the project's last updated date
    await updateProjectUpdatedByIdQuery(
      annexCategoryId,
      "annexcategories",
      req.tenantId!,
      transaction
    );
    await transaction.commit();

    await logSuccess({
      eventType: "Update",
      description: `Successfully saved annexes for annex category ID ${annexCategoryId}`,
      functionName: "saveAnnexes",
      fileName: "iso42001.ctrl.ts",
    });

    return res.status(200).json(STATUS_CODE[200](updatedAnnexCategory));
  } catch (error) {
    await transaction.rollback();
    await logFailure({
      eventType: "Update",
      description: `Failed to save annexes for annex category ID ${annexCategoryId}`,
      functionName: "saveAnnexes",
      fileName: "iso42001.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteManagementSystemClauses(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const projectFrameworkId = parseInt(req.params.id);

  logProcessing({
    description: `starting deleteManagementSystemClauses for project framework ID ${projectFrameworkId}`,
    functionName: "deleteManagementSystemClauses",
    fileName: "iso42001.ctrl.ts",
  });
  logger.debug(
    `🗑️ Deleting management system clauses for project framework ID ${projectFrameworkId}`
  );

  try {
    const result = await deleteSubClausesISOByProjectIdQuery(
      projectFrameworkId,
      req.tenantId!,
      transaction
    );

    if (result) {
      await transaction.commit();
      await logSuccess({
        eventType: "Delete",
        description: `Successfully deleted management system clauses for project framework ID ${projectFrameworkId}`,
        functionName: "deleteManagementSystemClauses",
        fileName: "iso42001.ctrl.ts",
      });
      return res.status(200).json(STATUS_CODE[200](result));
    }

    await transaction.rollback();
    await logFailure({
      eventType: "Delete",
      description: `Failed to delete management system clauses for project framework ID ${projectFrameworkId}`,
      functionName: "deleteManagementSystemClauses",
      fileName: "iso42001.ctrl.ts",
      error: new Error("Delete operation failed"),
    });
    return res.status(400).json(STATUS_CODE[400](result));
  } catch (error) {
    await transaction.rollback();
    await logFailure({
      eventType: "Delete",
      description: `Failed to delete management system clauses for project framework ID ${projectFrameworkId}`,
      functionName: "deleteManagementSystemClauses",
      fileName: "iso42001.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteReferenceControls(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const projectFrameworkId = parseInt(req.params.id);

  logProcessing({
    description: `starting deleteReferenceControls for project framework ID ${projectFrameworkId}`,
    functionName: "deleteReferenceControls",
    fileName: "iso42001.ctrl.ts",
  });
  logger.debug(
    `🗑️ Deleting reference controls for project framework ID ${projectFrameworkId}`
  );

  try {
    const result = await deleteAnnexCategoriesISOByProjectIdQuery(
      projectFrameworkId,
      req.tenantId!,
      transaction
    );

    if (result) {
      await transaction.commit();
      await logSuccess({
        eventType: "Delete",
        description: `Successfully deleted reference controls for project framework ID ${projectFrameworkId}`,
        functionName: "deleteReferenceControls",
        fileName: "iso42001.ctrl.ts",
      });
      return res.status(200).json(STATUS_CODE[200](result));
    }

    await transaction.rollback();
    await logFailure({
      eventType: "Delete",
      description: `Failed to delete reference controls for project framework ID ${projectFrameworkId}`,
      functionName: "deleteReferenceControls",
      fileName: "iso42001.ctrl.ts",
      error: new Error("Delete operation failed"),
    });
    return res.status(400).json(STATUS_CODE[400](result));
  } catch (error) {
    await transaction.rollback();
    await logFailure({
      eventType: "Delete",
      description: `Failed to delete reference controls for project framework ID ${projectFrameworkId}`,
      functionName: "deleteReferenceControls",
      fileName: "iso42001.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getProjectClausesProgress(
  req: Request,
  res: Response
): Promise<any> {
  const projectFrameworkId = parseInt(req.params.id);

  logProcessing({
    description: `starting getProjectClausesProgress for project framework ID ${projectFrameworkId}`,
    functionName: "getProjectClausesProgress",
    fileName: "iso42001.ctrl.ts",
  });
  logger.debug(
    `📊 Calculating clauses progress for project framework ID ${projectFrameworkId}`
  );

  try {
    const { totalSubclauses, doneSubclauses } =
      await countSubClausesISOByProjectId(projectFrameworkId, req.tenantId!);

    await logSuccess({
      eventType: "Read",
      description: `Retrieved clauses progress for project framework ID ${projectFrameworkId}`,
      functionName: "getProjectClausesProgress",
      fileName: "iso42001.ctrl.ts",
    });

    return res.status(200).json(
      STATUS_CODE[200]({
        totalSubclauses: parseInt(totalSubclauses),
        doneSubclauses: parseInt(doneSubclauses),
      })
    );
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: `Failed to get clauses progress for project framework ID ${projectFrameworkId}`,
      functionName: "getProjectClausesProgress",
      fileName: "iso42001.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getProjectAnnxesProgress(
  req: Request,
  res: Response
): Promise<any> {
  const projectFrameworkId = parseInt(req.params.id);

  logProcessing({
    description: `starting getProjectAnnxesProgress for project framework ID ${projectFrameworkId}`,
    functionName: "getProjectAnnxesProgress",
    fileName: "iso42001.ctrl.ts",
  });
  logger.debug(
    `📊 Calculating annexes progress for project framework ID ${projectFrameworkId}`
  );

  try {
    const { totalAnnexcategories, doneAnnexcategories } =
      await countAnnexCategoriesISOByProjectId(
        projectFrameworkId,
        req.tenantId!
      );

    await logSuccess({
      eventType: "Read",
      description: `Retrieved annexes progress for project framework ID ${projectFrameworkId}`,
      functionName: "getProjectAnnxesProgress",
      fileName: "iso42001.ctrl.ts",
    });

    return res.status(200).json(
      STATUS_CODE[200]({
        totalAnnexcategories: parseInt(totalAnnexcategories),
        doneAnnexcategories: parseInt(doneAnnexcategories),
      })
    );
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: `Failed to get annexes progress for project framework ID ${projectFrameworkId}`,
      functionName: "getProjectAnnxesProgress",
      fileName: "iso42001.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAllProjectsClausesProgress(
  req: Request,
  res: Response
): Promise<any> {
  let allSubclauses = 0;
  let allDoneSubclauses = 0;

  logProcessing({
    description: "starting getAllProjectsClausesProgress",
    functionName: "getAllProjectsClausesProgress",
    fileName: "iso42001.ctrl.ts",
  });
  logger.debug("📊 Calculating clauses progress across all projects");

  try {
    const { userId, role } = req;
    if (!userId || !role) {
      await logFailure({
        eventType: "Read",
        description:
          "Unauthorized access attempt for getAllProjectsClausesProgress",
        functionName: "getAllProjectsClausesProgress",
        fileName: "iso42001.ctrl.ts",
        error: new Error("Unauthorized"),
      });
      return res.status(401).json({ message: "Unauthorized" });
    }

    const projects = await getAllProjectsQuery({ userId, role }, req.tenantId!);
    if (projects && projects.length > 0) {
      await Promise.all(
        projects.map(async (project) => {
          const projectFrameworkId = (
            project as unknown as { dataValues: IProjectAttributes }
          ).dataValues.framework
            ?.filter((f) => f.framework_id === 2)
            .map((f) => f.project_framework_id)[0];
          if (!projectFrameworkId) {
            return;
          }
          const { totalSubclauses, doneSubclauses } =
            await countSubClausesISOByProjectId(
              projectFrameworkId,
              req.tenantId!
            );
          allSubclauses += parseInt(totalSubclauses);
          allDoneSubclauses += parseInt(doneSubclauses);
        })
      );

      await logSuccess({
        eventType: "Read",
        description: `Retrieved clauses progress across ${projects.length} projects`,
        functionName: "getAllProjectsClausesProgress",
        fileName: "iso42001.ctrl.ts",
      });

      return res
        .status(200)
        .json(STATUS_CODE[200]({ allSubclauses, allDoneSubclauses }));
    } else {
      await logSuccess({
        eventType: "Read",
        description: "No projects found for clauses progress calculation",
        functionName: "getAllProjectsClausesProgress",
        fileName: "iso42001.ctrl.ts",
      });
      return res.status(404).json(STATUS_CODE[404](projects));
    }
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to get clauses progress across all projects",
      functionName: "getAllProjectsClausesProgress",
      fileName: "iso42001.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAllProjectsAnnxesProgress(
  req: Request,
  res: Response
): Promise<any> {
  let allAnnexcategories = 0;
  let allDoneAnnexcategories = 0;

  logProcessing({
    description: "starting getAllProjectsAnnxesProgress",
    functionName: "getAllProjectsAnnxesProgress",
    fileName: "iso42001.ctrl.ts",
  });
  logger.debug("📊 Calculating annexes progress across all projects");

  try {
    const { userId, role } = req;
    if (!userId || !role) {
      await logFailure({
        eventType: "Read",
        description:
          "Unauthorized access attempt for getAllProjectsAnnxesProgress",
        functionName: "getAllProjectsAnnxesProgress",
        fileName: "iso42001.ctrl.ts",
        error: new Error("Unauthorized"),
      });
      return res.status(401).json({ message: "Unauthorized" });
    }

    const projects = await getAllProjectsQuery({ userId, role }, req.tenantId!);
    if (projects && projects.length > 0) {
      await Promise.all(
        projects.map(async (project) => {
          const projectFrameworkId = (
            project as unknown as { dataValues: IProjectAttributes }
          ).dataValues.framework
            ?.filter((f) => f.framework_id === 2)
            .map((f) => f.project_framework_id)[0];
          if (!projectFrameworkId) {
            return;
          }
          const { totalAnnexcategories, doneAnnexcategories } =
            await countAnnexCategoriesISOByProjectId(
              projectFrameworkId,
              req.tenantId!
            );
          allAnnexcategories += parseInt(totalAnnexcategories);
          allDoneAnnexcategories += parseInt(doneAnnexcategories);
        })
      );

      await logSuccess({
        eventType: "Read",
        description: `Retrieved annexes progress across ${projects.length} projects`,
        functionName: "getAllProjectsAnnxesProgress",
        fileName: "iso42001.ctrl.ts",
      });

      return res
        .status(200)
        .json(STATUS_CODE[200]({ allAnnexcategories, allDoneAnnexcategories }));
    } else {
      await logSuccess({
        eventType: "Read",
        description: "No projects found for annexes progress calculation",
        functionName: "getAllProjectsAnnxesProgress",
        fileName: "iso42001.ctrl.ts",
      });
      return res.status(404).json(STATUS_CODE[404](projects));
    }
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to get annexes progress across all projects",
      functionName: "getAllProjectsAnnxesProgress",
      fileName: "iso42001.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
