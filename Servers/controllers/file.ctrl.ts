import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  deleteFileById,
  getFileById,
  getFileMetadataByProjectId,
  uploadFile,
  canUserAccessFile,
} from "../utils/fileUpload.utils";
import { RequestWithFile, UploadedFile } from "../utils/question.utils";
import { FileType } from "../domain.layer/models/file/file.model";
import { addFileToAnswerEU } from "../utils/eu.utils";
import { sequelize } from "../database/db";
import getUserFilesMetaDataQuery from "../utils/files/getUserFilesMetaData.utils";
import {
  logProcessing,
  logSuccess,
  logFailure,
} from "../utils/logger/logHelper";

export async function getFileContentById(
  req: Request,
  res: Response
): Promise<any> {
  const fileId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  // Validate fileId is a valid number
  if (isNaN(fileId)) {
    return res.status(400).json({ message: "Invalid file ID" });
  }

  // Validate authentication - these should be set by authenticateJWT middleware
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthenticated" });
  }
  if (!req.tenantId) {
    return res.status(400).json({ message: "Missing tenant" });
  }

  const userId = req.userId;
  const role = req.role || "";
  const tenantId = req.tenantId;

  logProcessing({
    description: `starting getFileContentById for ID ${fileId}`,
    functionName: "getFileContentById",
    fileName: "file.ctrl.ts",
    userId: req.userId!,
    tenantId: req.tenantId!,
  });

  try {
    // Authorization check: verify user has access to this file
    const orgId = req.organizationId ? Number(req.organizationId) : undefined;
    const hasAccess = await canUserAccessFile(fileId, userId, role, tenantId, orgId);
    if (!hasAccess) {
      await logFailure({
        eventType: "Read",
        description: `Access denied to file ID ${fileId} for user ${userId}`,
        functionName: "getFileContentById",
        fileName: "file.ctrl.ts",
        error: new Error(`User ${userId} with role '${role}' denied access to file ${fileId}`),
        userId: req.userId!,
        tenantId: req.tenantId!,
      });
      return res.status(403).json({ message: "Access denied" });
    }

    const file = await getFileById(fileId, tenantId);
    if (file) {
      await logSuccess({
        eventType: "Read",
        description: `Retrieved file content for ID ${req.params.id}`,
        functionName: "getFileContentById",
        fileName: "file.ctrl.ts",
        userId: req.userId!,
        tenantId: req.tenantId!,
      });

      res.setHeader("Content-Type", file.type);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${file.filename}"`
      );
      return res.status(200).end(file.content);
    }

    await logSuccess({
      eventType: "Read",
      description: `File not found: ID ${req.params.id}`,
      functionName: "getFileContentById",
      fileName: "file.ctrl.ts",
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve file content",
      functionName: "getFileContentById",
      fileName: "file.ctrl.ts",
      error: error as Error,
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getFileMetaByProjectId(
  req: Request,
  res: Response
): Promise<any> {
  const projectId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  logProcessing({
    description: `starting getFileMetaByProjectId for project ID ${projectId}`,
    functionName: "getFileMetaByProjectId",
    fileName: "file.ctrl.ts",
    userId: req.userId!,
    tenantId: req.tenantId!,
  });

  try {
    const files = await getFileMetadataByProjectId(projectId, req.tenantId!);
    await logSuccess({
      eventType: "Read",
      description: `Retrieved file metadata for project ID ${projectId}`,
      functionName: "getFileMetaByProjectId",
      fileName: "file.ctrl.ts",
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    if (files && files.length > 0) {
      return res.status(200).send(files);
    }
    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve file metadata",
      functionName: "getFileMetaByProjectId",
      fileName: "file.ctrl.ts",
      error: error as Error,
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export const getUserFilesMetaData = async (req: Request, res: Response) => {
  const userId = Number(req.userId);

  // Validate pagination parameters
  const page = req.query.page ? Number(Array.isArray(req.query.page) ? req.query.page[0] : req.query.page) : undefined;
  const pageSize = req.query.pageSize ? Number(Array.isArray(req.query.pageSize) ? req.query.pageSize[0] : req.query.pageSize) : undefined;

  logProcessing({
    description: `starting getUserFilesMetaData for user ID ${userId}`,
    functionName: "getUserFilesMetaData",
    fileName: "file.ctrl.ts",
    userId: req.userId!,
    tenantId: req.tenantId!,
  });

  try {
    const validPage = page && page > 0 ? page : undefined;
    const validPageSize = pageSize && pageSize > 0 ? pageSize : undefined;
    const offset =
      validPage !== undefined && validPageSize !== undefined
        ? (validPage - 1) * validPageSize
        : undefined;

    const files = await getUserFilesMetaDataQuery(
      req.role || "",
      userId,
      req.tenantId!,
      {
        limit: validPageSize,
        offset,
      }
    );

    await logSuccess({
      eventType: "Read",
      description: `Retrieved user files metadata for user ID ${userId}`,
      functionName: "getUserFilesMetaData",
      fileName: "file.ctrl.ts",
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(200).send(files);
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve user files metadata",
      functionName: "getUserFilesMetaData",
      fileName: "file.ctrl.ts",
      error: error as Error,
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(500).json({ error: "Internal server error" });
  }
};

export async function postFileContent(
  req: RequestWithFile,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();

  logProcessing({
    description: "starting postFileContent",
    functionName: "postFileContent",
    fileName: "file.ctrl.ts",
    userId: req.userId!,
    tenantId: req.tenantId!,
  });

  try {
    const body = req.body as {
      question_id: string;
      project_id: number;
      user_id: number;
      delete: string;
    };

    const filesToDelete = JSON.parse(body.delete || "[]") as number[];
    for (let fileToDelete of filesToDelete) {
      await deleteFileById(fileToDelete, req.tenantId!, transaction);
    }

    const questionId = parseInt(body.question_id);
    let uploadedFiles: FileType[] = [];
    for (let file of req.files! as UploadedFile[]) {
      const uploadedFile = await uploadFile(
        file,
        body.user_id,
        body.project_id,
        "Assessment tracker group",
        req.tenantId!,
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
      req.tenantId!,
      transaction
    );
    await transaction.commit();

    await logSuccess({
      eventType: "Create",
      description: "Posted file content and updated answer evidence",
      functionName: "postFileContent",
      fileName: "file.ctrl.ts",
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(201).json(STATUS_CODE[201](question.evidence_files));
  } catch (error) {
    await transaction.rollback();

    await logFailure({
      eventType: "Create",
      description: "Failed to upload and associate file content",
      functionName: "postFileContent",
      fileName: "file.ctrl.ts",
      error: error as Error,
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
