/**
 * @fileoverview File Manager Controller
 *
 * Handles HTTP requests for file manager operations:
 * - Upload files (POST /file-manager)
 * - List files (GET /file-manager)
 * - Download files (GET /file-manager/:id)
 *
 * Access Control:
 * - Upload: Admin, Reviewer, Editor only (enforced by route middleware)
 * - List/Download: All authenticated users
 *
 * @module controllers/fileManager
 */

import { Request, Response } from "express";
import "multer";
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
import { pipeline } from "stream";
import { promisify } from "util";

const pipelineAsync = promisify(pipeline);

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

    const userId = Number(req.userId);
    const orgId = Number(req.organizationId);
    const tenant = req.tenantId || "";

    if (!/^[a-zA-Z0-9_]+$/.test(tenant)) {
      // Clean up temp file before returning error
      if (tempFilePath) {
        try {
          await fs.promises.unlink(tempFilePath);
        } catch (unlinkError: any) {
          if (unlinkError.code !== 'ENOENT') {
            console.error("Failed to clean up temporary file:", unlinkError);
          }
        }
      }
      return res.status(400).json(STATUS_CODE[400]("Invalid tenant identifier"));
    }

    // Validate file type and size
    // Note: Role authorization is already handled by route middleware
    const validation = validateFileUpload(file);
    if (!validation.valid) {
      await logFailure({
        eventType: "Create",
        description: `File validation failed: ${validation.error}`,
        functionName: "uploadFile",
        fileName: "fileManager.ctrl.ts",
        error: new Error(validation.error),
      });
      // Clean up temp file before returning error
      if (tempFilePath) {
        try {
          await fs.promises.unlink(tempFilePath);
        } catch (unlinkError: any) {
          if (unlinkError.code !== 'ENOENT') {
            console.error("Failed to clean up temporary file:", unlinkError);
          }
        }
      }
      return res.status(400).json(STATUS_CODE[400](validation.error));
    }

    // Upload file (this will move it from temp to permanent location)
    const uploadedFile = await uploadFileToManager(file, userId, orgId, tenant);

    // Clean up temp file after successful processing
    if (tempFilePath) {
      try {
        await fs.promises.unlink(tempFilePath);
      } catch (unlinkError: any) {
        if (unlinkError.code !== 'ENOENT') {
          console.error("Failed to clean up temporary file:", unlinkError);
        }
      }
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
    if (tempFilePath) {
      try {
        await fs.promises.unlink(tempFilePath);
      } catch (unlinkError: any) {
        if (unlinkError.code !== 'ENOENT') {
          console.error("Failed to clean up temporary file:", unlinkError);
        }
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
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
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
  const fileId = parseInt(req.params.id, 10);

  // Validate file ID is a valid integer
  if (!Number.isFinite(fileId) || fileId !== parseInt(req.params.id, 10)) {
    return res.status(400).json(STATUS_CODE[400]("Invalid file ID"));
  }

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

    // Read file from disk with path containment validation
    const baseDir = path.resolve(process.cwd(), "uploads", "file-manager", tenant);
    const filePath = path.resolve(process.cwd(), file.file_path);

    // Verify path containment to prevent directory traversal
    const relativePath = path.relative(baseDir, filePath);
    const isContained = !relativePath.startsWith("..") &&
                        !path.isAbsolute(relativePath) &&
                        filePath.startsWith(baseDir + path.sep);

    if (!isContained) {
      await logFailure({
        eventType: "Read",
        description: `Blocked path traversal attempt. Target: ${filePath}, Base: ${baseDir}`,
        functionName: "downloadFile",
        fileName: "fileManager.ctrl.ts",
        error: new Error("Invalid file path"),
      });
      return res.status(400).json(STATUS_CODE[400]("Invalid file path"));
    }

    // Stream file safely with proper error handling
    try {
      // Set headers for file download
      res.setHeader("Content-Type", file.mimetype);
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
      res.setHeader("Content-Length", file.size);

      // Stream file to response with error handling
      await pipelineAsync(fs.createReadStream(filePath), res);

      await logSuccess({
        eventType: "Read",
        description: `File downloaded successfully: ${file.filename}`,
        functionName: "downloadFile",
        fileName: "fileManager.ctrl.ts",
        userId,
      });
    } catch (streamError) {
      await logFailure({
        eventType: "Read",
        description: `Error streaming file: ${filePath}`,
        functionName: "downloadFile",
        fileName: "fileManager.ctrl.ts",
        error: streamError as Error,
      });

      // Only send error response if headers haven't been sent yet
      if (!res.headersSent) {
        return res.status(500).json(STATUS_CODE[500]("Failed to download file"));
      }
      // If headers were already sent, the connection will be closed
      return;
    }
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to download file",
      functionName: "downloadFile",
      fileName: "fileManager.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
};
