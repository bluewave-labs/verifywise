/**
 * @fileoverview File Manager Controller
 *
 * Handles HTTP requests for file manager operations:
 * - Upload files (POST /file-manager)
 * - List files (GET /file-manager)
 * - Download files (GET /file-manager/:id)
 *
 * Access Control:
 * - Upload: All roles except Auditor
 * - List/Download: All authenticated users
 *
 * @module controllers/fileManager
 */

import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  uploadFileToManager,
  getFileById,
  getFilesByOrganization,
  logFileAccess,
} from "../utils/fileManager.utils";
import { validateFileUpload, formatFileSize } from "../utils/validations/fileManagerValidation.utils";
import { logProcessing, logSuccess, logFailure } from "../utils/logger/logHelper";
import * as path from "path";
import * as fs from "fs";

/**
 * Upload file to file manager
 *
 * POST /file-manager
 *
 * @param {Request} req - Express request with file upload
 * @param {Response} res - Express response
 * @returns {Promise<Response>} Created file metadata
 */
export const uploadFile = async (req: Request, res: Response): Promise<any> => {
  logProcessing({
    description: "Starting file upload to file manager",
    functionName: "uploadFile",
    fileName: "fileManager.ctrl.ts",
  });

  let tempFilePath: string | undefined;

  try {
    const file = req.file as Express.Multer.File;

    if (!file) {
      await logFailure({
        eventType: "Create",
        description: "No file provided in upload request",
        functionName: "uploadFile",
        fileName: "fileManager.ctrl.ts",
        error: new Error("No file provided"),
      });
      return res.status(400).json(STATUS_CODE[400]("No file provided"));
    }

    // Store temp file path for cleanup
    tempFilePath = file.path;

    const userRole = req.role || "";
    const userId = Number(req.userId);
    const orgId = Number(req.organizationId);
    const tenant = req.tenantId || "";

    if (!/^[a-zA-Z0-9_]+$/.test(tenant)) {
         return res.status(400).json(STATUS_CODE[400]("Invalid tenant identifier"));
       }

    // Validate file upload
    const validation = validateFileUpload(file, userRole);
    if (!validation.valid) {
      await logFailure({
        eventType: "Create",
        description: `File validation failed: ${validation.error}`,
        functionName: "uploadFile",
        fileName: "fileManager.ctrl.ts",
        error: new Error(validation.error),
      });
      // Clean up temp file before returning error
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      return res.status(400).json(STATUS_CODE[400](validation.error));
    }

    // Upload file (this will move it from temp to permanent location)
    const uploadedFile = await uploadFileToManager(file, userId, orgId, tenant);

    // Clean up temp file after successful processing
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    await logSuccess({
      eventType: "Create",
      description: `File uploaded successfully: ${uploadedFile.filename}`,
      functionName: "uploadFile",
      fileName: "fileManager.ctrl.ts",
      userId,
    });

    return res.status(201).json(
      STATUS_CODE[201]({
        id: uploadedFile.id,
        filename: uploadedFile.filename,
        size: uploadedFile.size,
        mimetype: uploadedFile.mimetype,
        upload_date: uploadedFile.upload_date,
        uploaded_by: uploadedFile.uploaded_by,
      })
    );
  } catch (error) {
    // Clean up temp file on error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error("Failed to clean up temporary file:", cleanupError);
      }
    }

    await logFailure({
      eventType: "Create",
      description: "Failed to upload file",
      functionName: "uploadFile",
      fileName: "fileManager.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
};

/**
 * Get list of files in file manager
 *
 * GET /file-manager
 *
 * Query parameters:
 * - page: Page number (optional)
 * - pageSize: Items per page (optional)
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @returns {Promise<Response>} List of files with metadata
 */
export const listFiles = async (req: Request, res: Response): Promise<any> => {
  const orgId = Number(req.organizationId);
  const tenant = req.tenantId || "";

  // Parse pagination parameters
  const page = req.query.page ? Number(req.query.page) : undefined;
  const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;

  logProcessing({
    description: `Retrieving file list for organization ${orgId}`,
    functionName: "listFiles",
    fileName: "fileManager.ctrl.ts",
  });

  try {
    const validPage = page && page > 0 ? page : undefined;
    const validPageSize = pageSize && pageSize > 0 ? pageSize : undefined;
    const offset =
      validPage !== undefined && validPageSize !== undefined
        ? (validPage - 1) * validPageSize
        : undefined;

    const { files, total } = await getFilesByOrganization(orgId, tenant, {
      limit: validPageSize,
      offset,
    });

    await logSuccess({
      eventType: "Read",
      description: `Retrieved ${files.length} files for organization ${orgId}`,
      functionName: "listFiles",
      fileName: "fileManager.ctrl.ts",
      userId: Number(req.userId),
    });

    return res.status(200).json({
      success: true,
      data: {
        files: files.map((file) => ({
          ...file,
          formattedSize: formatFileSize(file.size),
        })),
        pagination: {
          total,
          page: validPage || 1,
          pageSize: validPageSize || total,
          totalPages: validPageSize ? Math.ceil(total / validPageSize) : 1,
        },
      },
    });
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve file list",
      functionName: "listFiles",
      fileName: "fileManager.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
};

/**
 * Download file from file manager
 *
 * GET /file-manager/:id
 *
 * @param {Request} req - Express request with file ID in params
 * @param {Response} res - Express response
 * @returns {Promise<Response>} File content with appropriate headers
 */
export const downloadFile = async (req: Request, res: Response): Promise<any> => {
  const fileId = parseInt(req.params.id);
  const userId = Number(req.userId);
  const orgId = Number(req.organizationId);
  const tenant = req.tenantId || "";

  logProcessing({
    description: `Starting file download for file ID ${fileId}`,
    functionName: "downloadFile",
    fileName: "fileManager.ctrl.ts",
  });

  try {
    // Get file metadata
    const file = await getFileById(fileId, tenant);

    if (!file) {
      await logSuccess({
        eventType: "Read",
        description: `File not found: ID ${fileId}`,
        functionName: "downloadFile",
        fileName: "fileManager.ctrl.ts",
      });
      return res.status(404).json(STATUS_CODE[404]({}));
    }

    // Verify file belongs to user's organization
    if (file.org_id !== orgId) {
      await logFailure({
        eventType: "Read",
        description: `Unauthorized access attempt to file ${fileId}`,
        functionName: "downloadFile",
        fileName: "fileManager.ctrl.ts",
        error: new Error("Access denied"),
      });
      return res.status(403).json(STATUS_CODE[403]("Access denied"));
    }

    // Log file access
    await logFileAccess(fileId, userId, orgId, "download", tenant);

    // Read file from disk
    const filePath = path.join(process.cwd(), file.file_path);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      await logFailure({
        eventType: "Read",
        description: `Physical file not found: ${filePath}`,
        functionName: "downloadFile",
        fileName: "fileManager.ctrl.ts",
        error: new Error("File not found on disk"),
      });
      return res.status(404).json(STATUS_CODE[404]("File not found on server"));
    }

    await logSuccess({
      eventType: "Read",
      description: `File downloaded successfully: ${file.filename}`,
      functionName: "downloadFile",
      fileName: "fileManager.ctrl.ts",
      userId,
    });

    // Set headers for file download
    res.setHeader("Content-Type", file.mimetype);
    res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
    res.setHeader("Content-Length", file.size);

    // Stream file to response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to download file",
      functionName: "downloadFile",
      fileName: "fileManager.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
};
