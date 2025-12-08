/**
 * @fileoverview File Manager Utilities
 *
 * Provides database operations for file manager system including:
 * - File upload/storage
 * - File retrieval
 * - File metadata queries
 * - Access logging
 *
 * @module utils/fileManager
 */

import { sequelize } from "../database/db";
import { QueryTypes } from "sequelize";
import { FileManagerMetadata } from "../domain.layer/models/fileManager/fileManager.model";
import sanitizeFilename from "sanitize-filename"; // Industry-standard filename sanitization

/**
 * Uploads a file to the file manager system
 *
 * @param {Express.Multer.File} file - Uploaded file object (from memory storage)
 * @param {number} userId - User ID uploading the file
 * @param {number} orgId - Organization ID
 * @param {string} tenant - Tenant hash
 * @returns {Promise<FileManagerModel>} Created file record
 */
export const uploadFileToManager = async (
  file: Express.Multer.File,
  userId: number,
  orgId: number,
  tenant: string,
  modelId?: number
): Promise<any> => {
  if (!/^[a-zA-Z0-9_]+$/.test(tenant))
    throw new Error("Invalid tenant identifier");

  // Sanitize filename to remove dangerous characters
  const safeName = sanitizeFilename(file.originalname) || "file";

  // Insert file metadata and content into database
  const query = `
    INSERT INTO "${tenant}".file_manager
      (filename, size, mimetype, file_path, uploaded_by, upload_date, model_id,  org_id, is_demo)
    VALUES
      (:filename, :size, :mimetype, :file_path, :uploaded_by, NOW(), :model_id, :org_id, false)
    RETURNING *
    `;

  const result = await sequelize.query(query, {
    replacements: {
      filename: safeName,
      size: file.size,
      mimetype: file.mimetype,
      uploaded_by: userId,
      org_id: orgId,
      model_id: modelId !== undefined ? modelId : null,
      file_path: safeName,
    },
    type: QueryTypes.SELECT,
  });

  return result[0];
};

/**
 * Retrieves file metadata by ID
 *
 * @param {number} fileId - File ID
 * @param {string} tenant - Tenant hash
 * @returns {Promise<any>} File metadata
 */
export const getFileById = async (
  fileId: number,
  tenant: string,
  isFileManagerFile: boolean = false
): Promise<any> => {
  if (!/^[a-zA-Z0-9_]+$/.test(tenant))
    throw new Error("Invalid tenant identifier");

  let query = `
    SELECT * FROM "${tenant}".file_manager
    WHERE id = :fileId
  `;

  if (!isFileManagerFile) {
    query = `
      SELECT * FROM "${tenant}".files WHERE id = :fileId
    `;
  }

  const result = await sequelize.query(query, {
    replacements: { fileId },
    type: QueryTypes.SELECT,
  });

  return result[0];
};

/**
 * Retrieves all files for an organization with metadata
 *
 * @param {number} orgId - Organization ID
 * @param {string} tenant - Tenant hash
 * @param {Object} options - Query options (limit, offset)
 * @returns {Promise<{ files: FileManagerMetadata[]; total: number }>} Files and total count
 */
export const getFilesByOrganization = async (
  orgId: number,
  tenant: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{ files: FileManagerMetadata[]; total: number }> => {
  if (!/^[a-zA-Z0-9_]+$/.test(tenant))
    throw new Error("Invalid tenant identifier");

  const { limit, offset } = options;

  // Get files with uploader info (files are now stored in database)
  let query = `
    SELECT
      fm.id,
      fm.filename,
      fm.size,
      fm.mimetype,
      fm.upload_date,
      fm.uploaded_by,
      u.name AS uploader_name,
      u.surname AS uploader_surname
    FROM "${tenant}".file_manager fm
    JOIN public.users u ON fm.uploaded_by = u.id
    WHERE fm.org_id = :orgId
    ORDER BY fm.upload_date DESC
  `;

  if (limit !== undefined) {
    query += ` LIMIT :limit`;
  }
  if (offset !== undefined) {
    query += ` OFFSET :offset`;
  }

  const files = await sequelize.query(query, {
    replacements: { orgId, limit, offset },
    type: QueryTypes.SELECT,
  });

  // Get total count for pagination
  const totalCountQuery = `
    SELECT COUNT(*) as count
    FROM "${tenant}".file_manager
    WHERE org_id = :orgId
  `;

  const countResult = await sequelize.query(totalCountQuery, {
    replacements: { orgId },
    type: QueryTypes.SELECT,
  });

  const total = parseInt((countResult[0] as any).count);

  return { files: files as FileManagerMetadata[], total };
};

/**
 * Logs file access (download/view)
 *
 * @param {number} fileId - File ID
 * @param {number} userId - User ID accessing the file
 * @param {number} orgId - Organization ID
 * @param {string} action - Action type ('download' or 'view')
 * @param {string} tenant - Tenant hash
 * @returns {Promise<void>}
 */
export const logFileAccess = async (
  fileId: number,
  userId: number,
  orgId: number,
  action: "download" | "view",
  tenant: string
): Promise<void> => {
  if (!/^[a-zA-Z0-9_]+$/.test(tenant))
    throw new Error("Invalid tenant identifier");

  const query = `
    INSERT INTO "${tenant}".file_access_logs
      (file_id, accessed_by, access_date, action, org_id)
    VALUES
      (:fileId, :userId, NOW(), :action, :orgId)
  `;

  await sequelize.query(query, {
    replacements: {
      fileId,
      userId,
      action,
      orgId,
    },
    type: QueryTypes.INSERT,
  });
};

/**
 * Deletes a file from the system (database only)
 *
 * @param {number} fileId - File ID
 * @param {string} tenant - Tenant hash
 * @returns {Promise<boolean>} True if file was deleted successfully
 */
export const deleteFile = async (
  fileId: number,
  tenant: string,
  isFileManagerFile: boolean = false
): Promise<boolean> => {
  if (!/^[a-zA-Z0-9_]+$/.test(tenant))
    throw new Error("Invalid tenant identifier");

  // Delete from database (file content is stored in database)
  let query = `
    DELETE FROM "${tenant}".file_manager
    WHERE id = :fileId
    RETURNING id
  `;

  if (!isFileManagerFile) {
    query = `
      DELETE FROM "${tenant}".files
      WHERE id = :fileId
      RETURNING id
    `;
  }

  const result = await sequelize.query(query, {
    replacements: { fileId },
    type: QueryTypes.SELECT,
  });

  return Array.isArray(result) && result.length > 0;
};

/**
 * Gets file access logs for a specific file
 *
 * @param {number} fileId - File ID
 * @param {string} tenant - Tenant hash
 * @param {Object} options - Query options (limit, offset)
 * @returns {Promise<any[]>} Access logs
 */
export const getFileAccessLogs = async (
  fileId: number,
  tenant: string,
  options: { limit?: number; offset?: number } = {}
): Promise<any[]> => {
  if (!/^[a-zA-Z0-9_]+$/.test(tenant))
    throw new Error("Invalid tenant identifier");

  const { limit, offset } = options;

  let query = `
    SELECT
      fal.id,
      fal.file_id,
      fal.accessed_by,
      fal.access_date,
      fal.action,
      u.name AS user_name,
      u.surname AS user_surname
    FROM "${tenant}".file_access_logs fal
    JOIN public.users u ON fal.accessed_by = u.id
    WHERE fal.file_id = :fileId
    ORDER BY fal.access_date DESC
  `;

  if (limit !== undefined) {
    query += ` LIMIT :limit`;
  }
  if (offset !== undefined) {
    query += ` OFFSET :offset`;
  }

  const logs = await sequelize.query(query, {
    replacements: { fileId, limit, offset },
    type: QueryTypes.SELECT,
  });

  return logs;
};
