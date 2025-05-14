import { Request, Response } from "express";
import { sequelize } from "../database/db";
import { SubClauseISO } from "../models/ISO-42001/subClauseISO.model";
import { deleteFileById, uploadFile } from "../utils/fileUpload.utils";
import { RequestWithFile, UploadedFile } from "../utils/question.utils";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { deleteAnnexCategoriesISOByProjectIdQuery, deleteProjectFrameworkISOQuery, deleteSubClausesISOByProjectIdQuery, updateAnnexCategoryQuery, updateSubClauseQuery } from "../utils/iso42001.utils";
import { FileType } from "../models/file.model";
import { AnnexCategoryISO } from "../models/ISO-42001/annexCategoryISO.model";

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
    for (let f of filesToDelete) {
      await deleteFileById(f, transaction);
    }

    let uploadedFiles: FileType[] = [];
    for (let f of req.files! as UploadedFile[]) {
      const uploadedFile = await uploadFile(
        f,
        subClause.user_id,
        subClause.project_framework_id,
        "Management system clauses group",
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
    }

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
    for (let f of filesToDelete) {
      await deleteFileById(f, transaction);
    }

    let uploadedFiles: FileType[] = [];
    for (let f of req.files! as UploadedFile[]) {
      const uploadedFile = await uploadFile(
        f,
        annexCategory.user_id,
        annexCategory.project_framework_id,
        "Reference controls group",
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
    }

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
    const result = await deleteSubClausesISOByProjectIdQuery(projectFrameworkId, transaction);

    if (result) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200](result));
    }

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
    const result = await deleteAnnexCategoriesISOByProjectIdQuery(projectFrameworkId, transaction);

    if (result) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200](result));
    }

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
    const result = await deleteProjectFrameworkISOQuery(projectId, transaction);

    if (result) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200](result));
    }

    return res.status(400).json(STATUS_CODE[400](result));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
