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
import { FileManagerModel, FileManagerMetadata } from "../domain.layer/models/fileManager/fileManager.model";
import { FileAccessLogModel } from "../domain.layer/models/fileManager/fileAccessLog.model";
import * as path from "path";
import * as fs from "fs";
import { promisify } from "util";
import { randomBytes } from "crypto";
import { sanitizeFilename } from "./validations/fileManagerValidation.utils";

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);

/**
 * Uploads a file to the file manager system
 *
 * @param {Express.Multer.File} file - Uploaded file object (from disk storage)
 * @param {number} userId - User ID uploading the file
 * @param {number} orgId - Organization ID
 * @param {string} tenant - Tenant hash
 * @returns {Promise<FileManagerModel>} Created file record
 */
export const uploadFileToManager = async (
  file: Express.Multer.File,
  userId: number,
  orgId: number,
  tenant: string
): Promise<any> => {
  if (!/^[a-zA-Z0-9_]+$/.test(tenant)) throw new Error("Invalid tenant identifier");

  // Create permanent uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), "uploads", "file-manager", tenant);
  await mkdir(uploadsDir, { recursive: true });

  // Generate unique filename with timestamp, random bytes, and sanitized original name
  const timestamp = Date.now();
  const rand = randomBytes(4).toString("hex");
  const sanitized = sanitizeFilename(file.originalname);
  const uniqueFilename = `${timestamp}_${rand}_${sanitized}`;
  const permanentFilePath = path.join(uploadsDir, uniqueFilename);

  // Move file from temp directory to permanent location
  // file.path contains the temp file path from multer.diskStorage
  if (file.path) {
    const readStream = fs.createReadStream(file.path);
    const writeStream = fs.createWriteStream(permanentFilePath);

    await new Promise<void>((resolve, reject) => {
      readStream.pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      readStream.on('error', reject);
    });
  } else {
    // Fallback for memory storage (if buffer exists)
    if (file.buffer) {
      await writeFile(permanentFilePath, file.buffer);
    } else {
      throw new Error("No file data available (neither path nor buffer)");
    }
  }

  // Store relative path for portability
  const relativeFilePath = path.join("uploads", "file-manager", tenant, uniqueFilename);

  // Insert file metadata into database
  const query = `
    INSERT INTO "${tenant}".file_manager
      (filename, size, mimetype, file_path, uploaded_by, upload_date, org_id, is_demo)
    VALUES
      (:filename, :size, :mimetype, :file_path, :uploaded_by, NOW(), :org_id, false)
    RETURNING *
  `;

  try {
    const result = await sequelize.query(query, {
      replacements: {
        filename: sanitized,
        size: file.size,
        mimetype: file.mimetype,
        file_path: relativeFilePath,
        uploaded_by: userId,
        org_id: orgId,
      },
      type: QueryTypes.SELECT,
    });

    return result[0];
  } catch (dbError) {
    // Database insertion failed - cleanup orphaned file
    try {
      await fs.promises.unlink(permanentFilePath);
    } catch (unlinkError: any) {
      // Ignore ENOENT (file already deleted), but log other errors
      if (unlinkError.code !== 'ENOENT') {
        console.error(`Failed to cleanup orphaned file after DB error: ${permanentFilePath}`, unlinkError);
      }
    }
    // Rethrow original database error
    throw dbError;
  }
};

/**
 * Retrieves file metadata by ID
 *
 * @param {number} fileId - File ID
 * @param {string} tenant - Tenant hash
 * @returns {Promise<any>} File metadata
 */
export const getFileById = async (fileId: number, tenant: string): Promise<any> => {

  if (!/^[a-zA-Z0-9_]+$/.test(tenant)) throw new Error("Invalid tenant identifier");

  const query = `
    SELECT * FROM "${tenant}".file_manager
    WHERE id = :fileId
  `;

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
  if (!/^[a-zA-Z0-9_]+$/.test(tenant)) throw new Error("Invalid tenant identifier");

  const { limit, offset } = options;

  // Get files with uploader info and file_path
  let query = `
    SELECT
      fm.id,
      fm.filename,
      fm.size,
      fm.mimetype,
      fm.upload_date,
      fm.uploaded_by,
      fm.file_path,
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

  // Filter out files that don't exist on disk
  const existingFiles = (files as any[]).filter((file) => {
    try {
      const filePath = path.resolve(process.cwd(), file.file_path);
      return fs.existsSync(filePath);
    } catch (error) {
      console.error(`Error checking file existence for ${file.filename}:`, error);
      return false;
    }
  });

  // Get accurate count of existing files
  const totalCountQuery = `
    SELECT COUNT(*) as count
    FROM "${tenant}".file_manager
    WHERE org_id = :orgId
  `;

  const countResult = await sequelize.query(totalCountQuery, {
    replacements: { orgId },
    type: QueryTypes.SELECT,
  });

  const totalDbCount = parseInt((countResult[0] as any).count);

  // If we're filtering by existence, the total may be less than DB count
  // For simplicity, return the count of existing files found
  const total = existingFiles.length;

  return { files: existingFiles as FileManagerMetadata[], total };
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
  if (!/^[a-zA-Z0-9_]+$/.test(tenant)) throw new Error("Invalid tenant identifier");

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
 * Deletes a file from the system
 *
 * @param {number} fileId - File ID
 * @param {string} tenant - Tenant hash
 * @returns {Promise<boolean>} True if file was deleted
 */
export const deleteFile = async (fileId: number, tenant: string): Promise<boolean> => {
  if (!/^[a-zA-Z0-9_]+$/.test(tenant)) throw new Error("Invalid tenant identifier");

  // Get file info first
  const file = await getFileById(fileId, tenant);

  if (!file) {
    return false;
  }

  // Delete physical file with path containment validation
  const baseDir = path.resolve(process.cwd(), "uploads", "file-manager", tenant);
  const targetPath = path.resolve(process.cwd(), file.file_path);

  // Verify path containment to prevent directory traversal
  const relativePath = path.relative(baseDir, targetPath);
  const isContained = !relativePath.startsWith("..") &&
                      !path.isAbsolute(relativePath) &&
                      targetPath.startsWith(baseDir + path.sep);

  if (!isContained) {
    const error = `Security violation: Attempted to delete file outside tenant directory. Target: ${targetPath}, Base: ${baseDir}`;
    console.error(error);
    throw new Error(error);
  }

  try {
    await unlink(targetPath);
  } catch (error) {
    console.error(`Failed to delete physical file: ${targetPath}`, error);
    // Continue with database deletion even if file doesn't exist
  }

  // Delete from database
  const query = `
    DELETE FROM "${tenant}".file_manager
    WHERE id = :fileId
    RETURNING id
  `;

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
  if (!/^[a-zA-Z0-9_]+$/.test(tenant)) throw new Error("Invalid tenant identifier");

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
