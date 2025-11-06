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
    deleteFile,
} from "../utils/fileManager.utils";
import { validateFileUpload, formatFileSize } from "../utils/validations/fileManagerValidation.utils";
import { logProcessing, logSuccess, logFailure } from "../utils/logger/logHelper";

/**
 * Helper function to validate and parse request authentication data
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @returns {{ userId: number; orgId: number; tenant: string } | null} Parsed values or null if validation fails
 */
const validateAndParseAuth = (req: Request, res: Response): { userId: number; orgId: number; tenant: string } | null => {
    const userId = Number(req.userId);
    const orgId = Number(req.organizationId);
    const tenant = req.tenantId || "";

    if (!Number.isSafeInteger(userId) || userId <= 0) {
        res.status(400).json(STATUS_CODE[400]("Invalid user ID"));
        return null;
    }

    if (!Number.isSafeInteger(orgId) || orgId <= 0) {
        res.status(400).json(STATUS_CODE[400]("Invalid organization ID"));
        return null;
    }

    // Tenant format validation
    if (!/^[a-zA-Z0-9_]+$/.test(tenant)) {
        res.status(400).json(STATUS_CODE[400]("Invalid tenant identifier"));
        return null;
    }

    return { userId, orgId, tenant };
};

/**
 * Helper function to check if user has permission for a specific action
 * Provides defense-in-depth security layer in addition to route middleware
 *
 * @param {Request} req - Express request with role information
 * @param {string} action - Action to check permission for (e.g., 'delete', 'upload')
 * @param {string[]} allowedRoles - Roles allowed to perform this action
 * @returns {boolean} True if user has permission
 */
const hasPermission = (req: Request, action: string, allowedRoles: string[]): boolean => {
    const userRole = (req as any).role;

    if (!userRole) {
        console.warn(`Permission check failed for action '${action}': No role found in request`);
        return false;
    }

    const hasAccess = allowedRoles.includes(userRole);

    if (!hasAccess) {
        console.warn(`Permission denied: User with role '${userRole}' attempted '${action}' action. Allowed roles: [${allowedRoles.join(', ')}]`);
    }

    return hasAccess;
};

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

    try {
        const file = req.file as Express.Multer.File;
        // Parse model_id from request body
        let modelId: number | undefined;
        if (req.body.model_id != null && req.body.model_id !== "") {
          const parsed = Number(req.body.model_id);
          if (!isNaN(parsed)) modelId = parsed;
        }      

        if (!file) {
            await logFailure({
                eventType: "Error",
                description: "No file provided in upload request",
                functionName: "uploadFile",
                fileName: "fileManager.ctrl.ts",
                error: new Error("No file provided"),
            });
            return res.status(400).json(STATUS_CODE[400]("No file provided"));
        }

        // Validate authentication
        const auth = validateAndParseAuth(req, res);
        if (!auth) {
            return; // Response already sent by validateAndParseAuth
        }

        const { userId, orgId, tenant } = auth;

        // Validate file type and size
        const validation = validateFileUpload(file);
        if (!validation.valid) {
            await logFailure({
                eventType: "Error",
                description: `File validation failed: ${validation.error}`,
                functionName: "uploadFile",
                fileName: "fileManager.ctrl.ts",
                error: new Error(validation.error),
            });
            return res.status(400).json(STATUS_CODE[400](validation.error));
        }

        // Upload file (this will move it from temp to permanent location)
        const uploadedFile = await uploadFileToManager(file, userId, orgId, tenant, modelId);

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
                modelId: uploadedFile.model_id
            })
        );
    } catch (error) {
        await logFailure({
            eventType: "Error",
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
    // Validate authentication
    const auth = validateAndParseAuth(req, res);
    if (!auth) return; // Response already sent

    const { userId, orgId, tenant } = auth;

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
            userId,
        });

        return res.status(200).json(
            STATUS_CODE[200]({
                files: files.map((file) => ({
                    id: file.id,
                    filename: file.filename,
                    size: file.size,
                    formattedSize: formatFileSize(file.size),
                    mimetype: file.mimetype,          // optional
                    upload_date: file.upload_date,
                    uploaded_by: file.uploaded_by,
                    uploader_name: file.uploader_name,
                    uploader_surname: file.uploader_surname,
                })),
                pagination: {
                    total,
                    page: validPage,
                    pageSize: validPageSize,
                    totalPages: validPageSize ? Math.ceil(total / validPageSize) : 1,
                },
            })
        );

    } catch (error) {
        await logFailure({
            eventType: "Error",
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
    // Validate file ID is numeric-only string before parsing
    if (!/^\d+$/.test(req.params.id)) {
        return res.status(400).json(STATUS_CODE[400]("Invalid file ID"));
    }

    const fileId = parseInt(req.params.id, 10);

    // Validate parsed file ID is a safe integer
    if (!Number.isSafeInteger(fileId)) {
        return res.status(400).json(STATUS_CODE[400]("Invalid file ID"));
    }

    // Validate authentication
    const auth = validateAndParseAuth(req, res);
    if (!auth) return; // Response already sent

    const { userId, orgId, tenant } = auth;

    logProcessing({
        description: `Starting file download for file ID ${fileId}`,
        functionName: "downloadFile",
        fileName: "fileManager.ctrl.ts",
    });

    try {
        // Get file metadata
        const file = await getFileById(fileId, tenant);

        if (!file) {
            await logFailure({
                eventType: "Error",
                description: `File not found: ID ${fileId}`,
                functionName: "downloadFile",
                fileName: "fileManager.ctrl.ts",
                error: new Error("File not found"),
            });
            return res.status(404).json(STATUS_CODE[404]("File not found"));
        }

        // Verify file belongs to user's organization (ensure type consistency)
        if (Number(file.org_id) !== orgId) {
            await logFailure({
                eventType: "Error",
                description: `Unauthorized access attempt to file ${fileId}`,
                functionName: "downloadFile",
                fileName: "fileManager.ctrl.ts",
                error: new Error("Access denied"),
            });
            return res.status(403).json(STATUS_CODE[403]("Access denied"));
        }

        // Log file access
        await logFileAccess(fileId, userId, orgId, "download", tenant);

        // Check if file content exists in database
        if (!file.content) {
            await logFailure({
                eventType: "Error",
                description: `File content not found in database for file ID ${fileId}`,
                functionName: "downloadFile",
                fileName: "fileManager.ctrl.ts",
                error: new Error("File content missing"),
            });
            return res.status(404).json(STATUS_CODE[404]("File content not found"));
        }

        // Set headers for file download
        res.setHeader("Content-Type", file.mimetype);
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
        res.setHeader("Content-Length", file.size);

        // Send file content from database
        res.send(file.content);

        await logSuccess({
            eventType: "Read",
            description: `File downloaded successfully: ${file.filename}`,
            functionName: "downloadFile",
            fileName: "fileManager.ctrl.ts",
            userId,
        });
    } catch (error) {
        await logFailure({
            eventType: "Error",
            description: "Failed to download file",
            functionName: "downloadFile",
            fileName: "fileManager.ctrl.ts",
            error: error as Error,
        });
        return res.status(500).json(STATUS_CODE[500]("Internal server error"));
    }
};

/**
 * Delete file from file manager
 *
 * DELETE /file-manager/:id
 *
 * @param {Request} req - Express request with file ID in params
 * @param {Response} res - Express response
 * @returns {Promise<Response>} Success message or error
 */
export const removeFile = async (req: Request, res: Response): Promise<any> => {
    // Validate file ID is numeric-only string before parsing
    if (!/^\d+$/.test(req.params.id)) {
        return res.status(400).json(STATUS_CODE[400]("Invalid file ID"));
    }

    const fileId = parseInt(req.params.id, 10);

    // Validate parsed file ID is a safe integer
    if (!Number.isSafeInteger(fileId)) {
        return res.status(400).json(STATUS_CODE[400]("Invalid file ID"));
    }

    // Validate authentication
    const auth = validateAndParseAuth(req, res);
    if (!auth) return; // Response already sent

    const { userId, orgId, tenant } = auth;

    // Defense-in-depth: Verify user has delete permission (in addition to route middleware)
    if (!hasPermission(req, 'delete:file', ['Admin', 'Reviewer', 'Editor'])) {
        await logFailure({
            eventType: "Error",
            description: `Unauthorized role attempted to delete file ${fileId}`,
            functionName: "removeFile",
            fileName: "fileManager.ctrl.ts",
            error: new Error("Insufficient permissions"),
        });
        return res.status(403).json(STATUS_CODE[403]("Insufficient permissions to delete files"));
    }

    logProcessing({
        description: `Starting file deletion for file ID ${fileId}`,
        functionName: "removeFile",
        fileName: "fileManager.ctrl.ts",
    });

    try {
        // Get file metadata to verify access
        const file = await getFileById(fileId, tenant);

        if (!file) {
            await logFailure({
                eventType: "Error",
                description: `File not found: ID ${fileId}`,
                functionName: "removeFile",
                fileName: "fileManager.ctrl.ts",
                error: new Error("File not found"),
            });
            return res.status(404).json(STATUS_CODE[404]("File not found"));
        }

        // Verify file belongs to user's organization (ensure type consistency)
        if (Number(file.org_id) !== orgId) {
            await logFailure({
                eventType: "Error",
                description: `Unauthorized deletion attempt for file ${fileId}`,
                functionName: "removeFile",
                fileName: "fileManager.ctrl.ts",
                error: new Error("Access denied"),
            });
            return res.status(403).json(STATUS_CODE[403]("Access denied"));
        }

        // Delete the file from database
        let deleted: boolean;
        try {
            deleted = await deleteFile(fileId, tenant);
        } catch (error: any) {
            // Handle partial deletion failure (DB deleted but disk failed)
            if (error.message?.includes("Partial deletion")) {
                await logFailure({
                    eventType: "Error",
                    description: `Partial deletion failure for file ${fileId}: ${error.message}`,
                    functionName: "removeFile",
                    fileName: "fileManager.ctrl.ts",
                    error: error as Error,
                });
                return res.status(500).json(
                    STATUS_CODE[500]("File database record deleted but physical file removal failed. Please contact support.")
                );
            }
            // Re-throw other errors to be handled by outer catch
            throw error;
        }

        if (!deleted) {
            await logFailure({
                eventType: "Error",
                description: `File not found during deletion: ID ${fileId}`,
                functionName: "removeFile",
                fileName: "fileManager.ctrl.ts",
                error: new Error("File not found during deletion"),
            });
            return res.status(404).json(STATUS_CODE[404]("File not found"));
        }

        await logSuccess({
            eventType: "Delete",
            description: `File deleted successfully: ${file.filename}`,
            functionName: "removeFile",
            fileName: "fileManager.ctrl.ts",
            userId,
        });

        return res.status(200).json(
            STATUS_CODE[200]({
                message: "File deleted successfully",
                fileId,
            })
        );
    } catch (error) {
        await logFailure({
            eventType: "Error",
            description: "Failed to delete file",
            functionName: "removeFile",
            fileName: "fileManager.ctrl.ts",
            error: error as Error,
        });
        return res.status(500).json(STATUS_CODE[500]("Internal server error"));
    }
};