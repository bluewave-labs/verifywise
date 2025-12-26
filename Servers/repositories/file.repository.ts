/**
 * @fileoverview File Repository
 *
 * Consolidated repository for all file-related database operations.
 * Combines operations from fileUpload.utils.ts and fileManager.utils.ts
 * following the repository pattern.
 *
 * @module repositories/file
 */

import { sequelize } from "../database/db";
import { QueryTypes, Transaction } from "sequelize";
import { FileModel } from "../domain.layer/models/file/file.model";
import { FileManagerMetadata } from "../domain.layer/models/fileManager/fileManager.model";
import { ProjectModel } from "../domain.layer/models/project/project.model";
import { ValidationException } from "../domain.layer/exceptions/custom.exception";
import sanitizeFilename from "sanitize-filename";

// ============================================================================
// Types
// ============================================================================

export type FileSource =
  | "Assessment tracker group"
  | "Compliance tracker group"
  | "Project risks report"
  | "Compliance tracker report"
  | "Assessment tracker report"
  | "Vendors and risks report"
  | "All reports"
  | "Management system clauses group"
  | "Reference controls group"
  | "Clauses and annexes report"
  | "AI trust center group"
  | "Main clauses group"
  | "Annex controls group"
  | "ISO 27001 report"
  | "Models and risks report"
  | "Training registry report"
  | "Policy manager report"
  | "File Manager";

export interface UploadedFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size?: number;
}

export interface FileMetadata {
  id: number;
  filename: string;
  size?: number;
  mimetype?: string;
  upload_date?: Date;
  uploaded_by: number;
  uploader_name?: string;
  uploader_surname?: string;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface FileAccessLog {
  id: number;
  file_id: number;
  accessed_by: number;
  access_date: Date;
  action: "download" | "view";
  user_name?: string;
  user_surname?: string;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates tenant identifier to prevent SQL injection
 *
 * @param tenant - The tenant identifier to validate
 * @throws {ValidationException} If tenant contains invalid characters
 */
function validateTenant(tenant: string): void {
  if (!/^[A-Za-z0-9_]{1,30}$/.test(tenant)) {
    throw new ValidationException("Invalid tenant identifier");
  }
}

/**
 * Escapes a PostgreSQL identifier safely
 *
 * @param ident - The identifier to escape
 * @returns Safely escaped identifier wrapped in double quotes
 */
function escapePgIdentifier(ident: string): string {
  validateTenant(ident);
  return '"' + ident.replace(/"/g, '""') + '"';
}

/**
 * Sanitizes filename to remove dangerous characters
 *
 * @param name - The filename to sanitize
 * @returns Sanitized filename with dangerous characters removed
 */
function sanitizeFilenameStr(name: string): string {
  // Use industry-standard sanitization first, fallback to regex
  const sanitized = sanitizeFilename(name);
  return sanitized || name.replace(/[^a-zA-Z0-9-_\.]/g, "_");
}

// ============================================================================
// Project Files Repository (files table)
// ============================================================================

/**
 * Uploads a file to project files table
 *
 * @param file - The uploaded file containing buffer and metadata
 * @param userId - ID of the user uploading the file
 * @param projectId - ID of the project (null for organization-level files)
 * @param source - Source identifier for the file
 * @param tenant - Tenant schema identifier
 * @param transaction - Optional database transaction
 * @returns The created file record
 */
export async function uploadProjectFile(
  file: UploadedFile,
  userId: number,
  projectId: number | null,
  source: FileSource,
  tenant: string,
  transaction: Transaction | null = null
): Promise<FileModel> {
  validateTenant(tenant);

  let isDemo = false;
  if (projectId) {
    const projectResult = await sequelize.query(
      `SELECT is_demo FROM ${escapePgIdentifier(tenant)}.projects WHERE id = :id`,
      {
        replacements: { id: projectId },
        mapToModel: true,
        model: ProjectModel,
        ...(transaction && { transaction }),
      }
    );
    isDemo = projectResult[0]?.is_demo || false;
  }

  const query = `
    INSERT INTO ${escapePgIdentifier(tenant)}.files
      (filename, content, type, project_id, uploaded_by, uploaded_time, is_demo, source)
    VALUES
      (:filename, :content, :type, :project_id, :uploaded_by, :uploaded_time, :is_demo, :source)
    RETURNING *`;

  const result = await sequelize.query(query, {
    replacements: {
      filename: sanitizeFilenameStr(file.originalname),
      content: file.buffer,
      project_id: projectId,
      type: file.mimetype,
      uploaded_by: userId,
      uploaded_time: new Date().toISOString(),
      is_demo: isDemo,
      source,
    },
    mapToModel: true,
    model: FileModel,
    ...(transaction && { transaction }),
  });

  return Array.isArray(result[0]) && result[0].length > 0
    ? result[0][0]
    : (result[0] as FileModel);
}

/**
 * Gets a project file by ID
 *
 * @param id - The file ID to retrieve
 * @param tenant - Tenant schema identifier
 * @returns The file record or null if not found
 */
export async function getProjectFileById(
  id: number,
  tenant: string
): Promise<FileModel | null> {
  validateTenant(tenant);

  const query = `SELECT * FROM ${escapePgIdentifier(tenant)}.files WHERE id = :id`;
  const result = await sequelize.query(query, {
    replacements: { id },
    mapToModel: true,
    model: FileModel,
  });

  return result[0] || null;
}

/**
 * Deletes a project file by ID
 *
 * @param id - The file ID to delete
 * @param tenant - Tenant schema identifier
 * @param transaction - Database transaction for atomicity
 * @returns True if file was deleted, false otherwise
 */
export async function deleteProjectFileById(
  id: number,
  tenant: string,
  transaction: Transaction
): Promise<boolean> {
  validateTenant(tenant);

  const query = `DELETE FROM ${escapePgIdentifier(tenant)}.files WHERE id = :id RETURNING id`;
  const result = await sequelize.query(query, {
    replacements: { id },
    mapToModel: true,
    model: FileModel,
    transaction,
  });

  return result.length > 0;
}

/**
 * Gets file metadata for a project
 *
 * @param projectId - The project ID to get files for
 * @param tenant - Tenant schema identifier
 * @returns Array of file metadata with uploader information
 */
export async function getProjectFileMetadata(
  projectId: number,
  tenant: string
): Promise<FileMetadata[]> {
  validateTenant(tenant);

  const query = `
    SELECT
      f.id,
      f.filename,
      f.project_id,
      f.uploaded_time,
      f.source,
      u.name AS uploader_name,
      u.surname AS uploader_surname
    FROM ${escapePgIdentifier(tenant)}.files f
    JOIN public.users u ON f.uploaded_by = u.id
    WHERE project_id = :project_id
    ORDER BY uploaded_time DESC, id ASC`;

  const result = await sequelize.query(query, {
    replacements: { project_id: projectId },
    type: QueryTypes.SELECT,
  });

  return result as FileMetadata[];
}

// ============================================================================
// File Manager Repository (file_manager table)
// ============================================================================

/**
 * Uploads a file to file manager
 *
 * @param file - The Express multer file object
 * @param userId - ID of the user uploading the file
 * @param orgId - Organization ID for the file
 * @param tenant - Tenant schema identifier
 * @param modelId - Optional model ID to associate with
 * @param source - Optional source identifier
 * @returns The created file manager record
 */
export async function uploadFileManagerFile(
  file: Express.Multer.File,
  userId: number,
  orgId: number,
  tenant: string,
  modelId?: number,
  source?: string
): Promise<FileManagerMetadata> {
  validateTenant(tenant);

  const safeName = sanitizeFilenameStr(file.originalname);

  const query = `
    INSERT INTO ${escapePgIdentifier(tenant)}.file_manager
      (filename, size, mimetype, file_path, content, uploaded_by, upload_date, model_id, org_id, is_demo, source)
    VALUES
      (:filename, :size, :mimetype, :file_path, :content, :uploaded_by, NOW(), :model_id, :org_id, false, :source)
    RETURNING *`;

  const result = await sequelize.query(query, {
    replacements: {
      filename: safeName,
      size: file.size,
      mimetype: file.mimetype,
      uploaded_by: userId,
      org_id: orgId,
      model_id: modelId ?? null,
      file_path: safeName,
      content: file.buffer,
      source: source ?? null,
    },
    type: QueryTypes.SELECT,
  });

  return result[0] as FileManagerMetadata;
}

/**
 * Gets a file by ID from either files or file_manager table
 *
 * @param fileId - The file ID to retrieve
 * @param tenant - Tenant schema identifier
 * @param isFileManagerFile - Whether to look in file_manager table (default: files table)
 * @returns The file record or null if not found
 */
export async function getFileById(
  fileId: number,
  tenant: string,
  isFileManagerFile: boolean = false
): Promise<FileModel | FileManagerMetadata | null> {
  validateTenant(tenant);

  const table = isFileManagerFile ? '"file_manager"' : '"files"';
  const query = `SELECT * FROM ${escapePgIdentifier(tenant)}.${table} WHERE id = :fileId`;

  const result = await sequelize.query(query, {
    replacements: { fileId },
    type: QueryTypes.SELECT,
  });

  return (result[0] as FileModel | FileManagerMetadata) || null;
}

/**
 * Deletes a file by ID from either files or file_manager table
 *
 * @param fileId - The file ID to delete
 * @param tenant - Tenant schema identifier
 * @param isFileManagerFile - Whether to delete from file_manager table (default: files table)
 * @returns True if file was deleted, false otherwise
 */
export async function deleteFileById(
  fileId: number,
  tenant: string,
  isFileManagerFile: boolean = false
): Promise<boolean> {
  validateTenant(tenant);

  const table = isFileManagerFile ? '"file_manager"' : '"files"';
  const query = `DELETE FROM ${escapePgIdentifier(tenant)}.${table} WHERE id = :fileId RETURNING id`;

  const result = await sequelize.query(query, {
    replacements: { fileId },
    type: QueryTypes.SELECT,
  });

  return Array.isArray(result) && result.length > 0;
}

/**
 * Gets files for an organization with pagination
 *
 * @param orgId - Organization ID to get files for
 * @param tenant - Tenant schema identifier
 * @param options - Pagination options (limit and offset)
 * @returns Object containing files array and total count
 */
export async function getOrganizationFiles(
  orgId: number,
  tenant: string,
  options: PaginationOptions = {}
): Promise<{ files: FileManagerMetadata[]; total: number }> {
  validateTenant(tenant);

  const { limit, offset } = options;

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
    FROM ${escapePgIdentifier(tenant)}.file_manager fm
    JOIN public.users u ON fm.uploaded_by = u.id
    WHERE fm.org_id = :orgId
      AND (fm.source IS NULL OR fm.source != 'policy_editor')
    ORDER BY fm.upload_date DESC`;

  if (limit !== undefined) query += ` LIMIT :limit`;
  if (offset !== undefined) query += ` OFFSET :offset`;

  const files = await sequelize.query(query, {
    replacements: { orgId, limit, offset },
    type: QueryTypes.SELECT,
  });

  const countQuery = `
    SELECT COUNT(*) as count
    FROM ${escapePgIdentifier(tenant)}.file_manager
    WHERE org_id = :orgId
      AND (source IS NULL OR source != 'policy_editor')`;

  const countResult = await sequelize.query(countQuery, {
    replacements: { orgId },
    type: QueryTypes.SELECT,
  });

  const total = parseInt((countResult[0] as { count: string }).count);

  return { files: files as FileManagerMetadata[], total };
}

// ============================================================================
// File Access Logging
// ============================================================================

/**
 * Logs file access (download/view)
 *
 * @param fileId - The file ID being accessed
 * @param userId - ID of the user accessing the file
 * @param orgId - Organization ID for the log entry
 * @param action - Type of access action ('download' or 'view')
 * @param tenant - Tenant schema identifier
 */
export async function logFileAccess(
  fileId: number,
  userId: number,
  orgId: number,
  action: "download" | "view",
  tenant: string
): Promise<void> {
  validateTenant(tenant);

  const query = `
    INSERT INTO ${escapePgIdentifier(tenant)}.file_access_logs
      (file_id, accessed_by, access_date, action, org_id)
    VALUES
      (:fileId, :userId, NOW(), :action, :orgId)`;

  await sequelize.query(query, {
    replacements: { fileId, userId, action, orgId },
    type: QueryTypes.INSERT,
  });
}

/**
 * Gets file access logs with pagination
 *
 * @param fileId - The file ID to get logs for
 * @param tenant - Tenant schema identifier
 * @param options - Pagination options (limit and offset)
 * @returns Array of file access log entries with user information
 */
export async function getFileAccessLogs(
  fileId: number,
  tenant: string,
  options: PaginationOptions = {}
): Promise<FileAccessLog[]> {
  validateTenant(tenant);

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
    FROM ${escapePgIdentifier(tenant)}.file_access_logs fal
    JOIN public.users u ON fal.accessed_by = u.id
    WHERE fal.file_id = :fileId
    ORDER BY fal.access_date DESC`;

  if (limit !== undefined) query += ` LIMIT :limit`;
  if (offset !== undefined) query += ` OFFSET :offset`;

  const logs = await sequelize.query(query, {
    replacements: { fileId, limit, offset },
    type: QueryTypes.SELECT,
  });

  return logs as FileAccessLog[];
}
