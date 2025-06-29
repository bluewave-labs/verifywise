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

export async function getAllClauses(req: Request, res: Response): Promise<any> {
  try {
    const clauses = await getAllClausesQuery();
    return res.status(200).json(clauses);
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAllClausesStructForProject(
  req: Request,
  res: Response
): Promise<any> {
  const projectFrameworkId = parseInt(req.params.id);
  try {
    const clauses = await getAllClausesWithSubClauseQuery(projectFrameworkId);
    return res.status(200).json(clauses);
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAllAnnexesStructForProject(
  req: Request,
  res: Response
): Promise<any> {
  const projectFrameworkId = parseInt(req.params.id);
  try {
    const annexes = await getAllAnnexesWithCategoriesQuery(projectFrameworkId);
    return res.status(200).json(annexes);
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAllAnnexes(req: Request, res: Response): Promise<any> {
  try {
    const annexes = await getAllAnnexesQuery();
    return res.status(200).json(annexes);
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
    const subClause = await getSubClauseByIdForProjectQuery(
      subClauseId,
      projectFrameworkId
    );
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
    const annexCategory = await getAnnexCategoryByIdForProjectQuery(
      annexCategoryId,
      projectFrameworkId
    );
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
    const annexCategories = await getAnnexesByProjectIdQuery(
      projectFrameworkId
    );
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
    })
  );
}

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
}

export async function saveClauses(
  req: RequestWithFile,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const subClauseId = parseInt(req.params.id);
    const subClause = req.body as SubClauseISO & {
      user_id: number;
      project_id: number;
      delete: string;
    };

    const filesToDelete = JSON.parse(subClause.delete || "[]") as number[];
    await deleteFiles(filesToDelete, transaction);

    let uploadedFiles = await uploadFiles(
      req.files! as UploadedFile[],
      subClause.user_id,
      subClause.project_id,
      "Management system clauses group",
      transaction
    );

    const updatedSubClause = await updateSubClauseQuery(
      subClauseId,
      subClause,
      uploadedFiles,
      filesToDelete,
      transaction
    );

    // Update the project's last updated date
    await updateProjectUpdatedByIdQuery(subClauseId, "subclauses", transaction);
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
      project_id: number;
      delete: string;
      risksDelete: string;
      risksMitigated: string;
    };

    const filesToDelete = JSON.parse(annexCategory.delete || "[]") as number[];
    await deleteFiles(filesToDelete, transaction);

    let uploadedFiles = await uploadFiles(
      req.files! as UploadedFile[],
      annexCategory.user_id,
      annexCategory.project_id,
      "Reference controls group",
      transaction
    );

    const updatedAnnexCategory = await updateAnnexCategoryQuery(
      annexCategoryId,
      annexCategory,
      uploadedFiles,
      filesToDelete,
      transaction
    );

    // Update the project's last updated date
    await updateProjectUpdatedByIdQuery(
      annexCategoryId,
      "annexcategories",
      transaction
    );
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
    const result = await deleteSubClausesISOByProjectIdQuery(
      projectFrameworkId,
      transaction
    );

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
    const result = await deleteAnnexCategoriesISOByProjectIdQuery(
      projectFrameworkId,
      transaction
    );

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

export async function getProjectClausesProgress(
  req: Request,
  res: Response
): Promise<any> {
  const projectFrameworkId = parseInt(req.params.id);
  try {
    const { totalSubclauses, doneSubclauses } =
      await countSubClausesISOByProjectId(projectFrameworkId);
    return res.status(200).json(
      STATUS_CODE[200]({
        totalSubclauses: parseInt(totalSubclauses),
        doneSubclauses: parseInt(doneSubclauses),
      })
    );
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getProjectAnnxesProgress(
  req: Request,
  res: Response
): Promise<any> {
  const projectFrameworkId = parseInt(req.params.id);
  try {
    const { totalAnnexcategories, doneAnnexcategories } =
      await countAnnexCategoriesISOByProjectId(projectFrameworkId);
    return res.status(200).json(
      STATUS_CODE[200]({
        totalAnnexcategories: parseInt(totalAnnexcategories),
        doneAnnexcategories: parseInt(doneAnnexcategories),
      })
    );
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAllProjectsClausesProgress(
  req: Request,
  res: Response
): Promise<any> {
  let allSubclauses = 0;
  let allDoneSubclauses = 0;
  try {
    const { userId, role } = req;
    if (!userId || !role) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const projects = await getAllProjectsQuery({ userId, role });
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
            await countSubClausesISOByProjectId(projectFrameworkId);
          allSubclauses += parseInt(totalSubclauses);
          allDoneSubclauses += parseInt(doneSubclauses);
        })
      );
      return res
        .status(200)
        .json(STATUS_CODE[200]({ allSubclauses, allDoneSubclauses }));
    } else {
      return res.status(404).json(STATUS_CODE[404](projects));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAllProjectsAnnxesProgress(
  req: Request,
  res: Response
): Promise<any> {
  let allAnnexcategories = 0;
  let allDoneAnnexcategories = 0;
  try {
    const { userId, role } = req;
    if (!userId || !role) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const projects = await getAllProjectsQuery({ userId, role });
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
            await countAnnexCategoriesISOByProjectId(projectFrameworkId);
          allAnnexcategories += parseInt(totalAnnexcategories);
          allDoneAnnexcategories += parseInt(doneAnnexcategories);
        })
      );
      return res
        .status(200)
        .json(STATUS_CODE[200]({ allAnnexcategories, allDoneAnnexcategories }));
    } else {
      return res.status(404).json(STATUS_CODE[404](projects));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
