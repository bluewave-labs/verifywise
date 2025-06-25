import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  deleteFileById,
  getFileById,
  getFileMetadataByProjectId,
  uploadFile,
} from "../utils/fileUpload.utils";
import {
  addFileToQuestion,
  RequestWithFile,
  UploadedFile,
} from "../utils/question.utils";
import { FileModel, FileType } from "../domain.layer/models/file/file.model";
import { addFileToAnswerEU } from "../utils/eu.utils";
import { sequelize } from "../database/db";
import getUserFilesMetaDataQuery from "../utils/files/getUserFilesMetaData.utils";

export async function getFileContentById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const file = await getFileById(parseInt(req.params.id));
    if (file) {
      res.setHeader("Content-Type", file.type);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${file.filename}"`
      );
      return res.status(200).end(file.content);
    }
    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    console.error("Error downloading file:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getFileMetaByProjectId(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const id = req.params.id;
    // id validations
    if (!id) {
      return res.status(400).json(STATUS_CODE[400]("File ID is required"));
    }
    const fileId = parseInt(id);
    if (isNaN(fileId) || fileId <= 0) {
      return res.status(400).json(STATUS_CODE[400]("Invalid File ID"));
    }
    const files = await getFileMetadataByProjectId(fileId);
    if (files && files.length > 0) {
      return res.status(200).send(files);
    }
    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    console.error("Error downloading file:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export const getUserFilesMetaData = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const page = Number(req.query.page);
    const pageSize = Number(req.query.pageSize);
    const validPage = !isNaN(page) && page > 0 ? page : undefined;
    const validPageSize =
      !isNaN(pageSize) && pageSize > 0 ? pageSize : undefined;
    const offset =
      validPage !== undefined && validPageSize !== undefined
        ? (validPage - 1) * validPageSize
        : undefined;

    const files = await getUserFilesMetaDataQuery(req.role || "", userId, {
      limit: validPageSize,
      offset,
    });

    return res.status(200).send(files);
  } catch (err) {
    console.error(`Failed to fetch user files for user ${req.userId}:`, err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export async function postFileContent(
  req: RequestWithFile,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const body = req.body as {
      question_id: string;
      project_id: number;
      user_id: number;
      delete: string;
    };

    const filesToDelete = JSON.parse(body.delete) as number[];
    for (let fileToDelete of filesToDelete) {
      await deleteFileById(fileToDelete, transaction);
    }

    const questionId = parseInt(body.question_id);
    let uploadedFiles: FileType[] = [];
    for (let file of req.files! as UploadedFile[]) {
      const uploadedFile = await uploadFile(
        file,
        body.user_id,
        body.project_id,
        "Assessment tracker group",
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

    const question = await addFileToAnswerEU(
      questionId,
      body.project_id,
      uploadedFiles,
      filesToDelete,
      transaction
    );
    await transaction.commit();
    return res.status(201).json(STATUS_CODE[201](question.evidence_files));
  } catch (error) {
    await transaction.rollback();
    console.error("Error downloading file:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
