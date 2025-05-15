import { Request, Response } from "express";
import { sequelize } from "../database/db";
import { SubClauseISO } from "../models/ISO-42001/subClauseISO.model";
import { deleteFileById, uploadFile } from "../utils/fileUpload.utils";
import { RequestWithFile, UploadedFile } from "../utils/question.utils";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { deleteAnnexCategoriesISOByProjectIdQuery, deleteProjectFrameworkISOQuery, deleteSubClausesISOByProjectIdQuery, getAllAnnexesQuery, getAllClausesQuery, getAnnexCategoriesByAnnexIdQuery, getAnnexCategoryByIdForProjectQuery, getAnnexesByProjectIdQuery, getClausesByProjectIdQuery, getSubClauseByIdForProjectQuery, getSubClausesByClauseIdQuery, updateAnnexCategoryQuery, updateSubClauseQuery } from "../utils/iso42001.utils";
import { FileType } from "../models/file.model";
import { AnnexCategoryISO } from "../models/ISO-42001/annexCategoryISO.model";

export async function getAllClauses(req: Request, res: Response): Promise<any> {
  try {
    const controlCategories = await getAllClausesQuery();
    return res.status(200).json(controlCategories);
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAllAnnexes(req: Request, res: Response): Promise<any> {
  try {
    const controlCategories = await getAllAnnexesQuery();
    return res.status(200).json(controlCategories);
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getSubClausesByClauseId(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const clauseId = parseInt(req.params.id);
    if (!clauseId) {
      return res.status(400).json(STATUS_CODE[400]("Invalid clause ID"));
    }
    const subClauses = await getSubClausesByClauseIdQuery(clauseId);
    if (subClauses) {
      return res.status(200).json(STATUS_CODE[200](subClauses));
    }
    return res.status(400).json(STATUS_CODE[400]("No sub clauses found"));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAnnexCategoriesByAnnexId(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const annexId = parseInt(req.params.id);
    if (!annexId) {
      return res.status(400).json(STATUS_CODE[400]("Invalid annex ID"));
    }
    const annexCategories = await getAnnexCategoriesByAnnexIdQuery(annexId);
    if (annexCategories) {
      return res.status(200).json(STATUS_CODE[200](annexCategories));
    }
    return res.status(400).json(STATUS_CODE[400]("No annex categories found"));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getSubClauseById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const subClauseId = parseInt(req.params.id);
    const projectFrameworkId = parseInt(req.query.projectFrameworkId as string);
    if (isNaN(subClauseId) || isNaN(projectFrameworkId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid query parameters"));
    };
    const subClause = await getSubClauseByIdForProjectQuery(subClauseId, projectFrameworkId);
    if (subClause) {
      return res.status(200).json(STATUS_CODE[200](subClause));
    }
    return res.status(400).json(STATUS_CODE[400]("No sub clause found"));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAnnexCategoryById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const annexCategoryId = parseInt(req.params.id);
    const projectFrameworkId = parseInt(req.query.projectFrameworkId as string);
    if (isNaN(annexCategoryId) || isNaN(projectFrameworkId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid query parameters"));
    };
    const annexCategory = await getAnnexCategoryByIdForProjectQuery(annexCategoryId, projectFrameworkId);
    if (annexCategory) {
      return res.status(200).json(STATUS_CODE[200](annexCategory));
    }
    return res.status(400).json(STATUS_CODE[400]("No annex category found"));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getClausesByProjectId(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectFrameworkId = parseInt(req.params.id);
    if (!projectFrameworkId) {
      return res.status(400).json(STATUS_CODE[400]("Invalid project ID"));
    }
    const subClauses = await getClausesByProjectIdQuery(projectFrameworkId);
    if (subClauses) {
      return res.status(200).json(STATUS_CODE[200](subClauses));
    }
    return res.status(400).json(STATUS_CODE[400]("No sub clauses found"));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAnnexesByProjectId(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectFrameworkId = parseInt(req.params.id);
    if (!projectFrameworkId) {
      return res.status(400).json(STATUS_CODE[400]("Invalid project ID"));
    }
    const annexCategories = await getAnnexesByProjectIdQuery(projectFrameworkId);
    if (annexCategories) {
      return res.status(200).json(STATUS_CODE[200](annexCategories));
    }
    return res.status(400).json(STATUS_CODE[400]("No annex categories found"));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

// helper function to delete files
async function deleteFiles(
  filesToDelete: number[],
  transaction: any
): Promise<void> {
  await Promise.all(
    filesToDelete.map(async (fileId) => {
      await deleteFileById(fileId, transaction);
    }
    ));
};

// helper function to upload files
async function uploadFiles(
  files: UploadedFile[],
  userId: number,
  projectFrameworkId: number,
  source: "Management system clauses group" | "Reference controls group",
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
};

export async function saveClauses(
  req: RequestWithFile,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const subClauseId = parseInt(req.params.id);
    const subClause = req.body as SubClauseISO & {
      user_id: number;
      project_framework_id: number;
      delete: string;
    };

    const filesToDelete = JSON.parse(subClause.delete || "[]") as number[];
    await deleteFiles(filesToDelete, transaction);

    let uploadedFiles = await uploadFiles(
      req.files! as UploadedFile[],
      subClause.user_id,
      subClause.project_framework_id,
      "Management system clauses group",
      transaction
    );

    const updatedSubClause = await updateSubClauseQuery(
      subClauseId,
      subClause,
      uploadedFiles,
      filesToDelete,
      transaction
    )

    // Update the project's last updated date
    // await updateProjectUpdatedByIdQuery
    await transaction.commit();

    return res.status(200).json(STATUS_CODE[200](updatedSubClause));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function saveAnnexes(
  req: RequestWithFile,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const annexCategoryId = parseInt(req.params.id);
    const annexCategory = req.body as AnnexCategoryISO & {
      user_id: number;
      project_framework_id: number;
      delete: string;
      risksDelete: string;
      risksMitigated: string;
    };

    const filesToDelete = JSON.parse(annexCategory.delete || "[]") as number[];
    await deleteFiles(filesToDelete, transaction);

    let uploadedFiles = await uploadFiles(
      req.files! as UploadedFile[],
      annexCategory.user_id,
      annexCategory.project_framework_id,
      "Reference controls group",
      transaction
    );

    const updatedAnnexCategory = await updateAnnexCategoryQuery(
      annexCategoryId,
      annexCategory,
      uploadedFiles,
      filesToDelete,
      transaction
    )

    // Update the project's last updated date
    // await updateProjectUpdatedByIdQuery
    await transaction.commit();

    return res.status(200).json(STATUS_CODE[200](updatedAnnexCategory));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteManagementSystemClauses(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const projectFrameworkId = parseInt(req.params.id);
    if (!projectFrameworkId) {
      return res.status(400).json(STATUS_CODE[400]("Invalid project framework ID"));
    }
    const result = await deleteSubClausesISOByProjectIdQuery(projectFrameworkId, transaction);

    if (result) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200](result));
    }

    await transaction.rollback();
    return res.status(400).json(STATUS_CODE[400](result));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteReferenceControls(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const projectFrameworkId = parseInt(req.params.id);
    if (!projectFrameworkId) {
      return res.status(400).json(STATUS_CODE[400]("Invalid project framework ID"));
    }
    const result = await deleteAnnexCategoriesISOByProjectIdQuery(projectFrameworkId, transaction);

    if (result) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200](result));
    }

    await transaction.rollback();
    return res.status(400).json(STATUS_CODE[400](result));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteISO42001(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const projectId = parseInt(req.params.id);
    if (!projectId) {
      return res.status(400).json(STATUS_CODE[400]("Invalid project framework ID"));
    }
    const result = await deleteProjectFrameworkISOQuery(projectId, transaction);

    if (result) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200](result));
    }

    await transaction.rollback();
    return res.status(400).json(STATUS_CODE[400](result));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
