/**
 * @fileoverview File Repository
 *
 * Consolidated repository for all file-related database operations.
 * Handles both project-level and organization-level files in a unified
 * files table following the repository pattern.
 *
 * @module repositories/file
 */

import { sequelize } from "../database/db";
import { QueryTypes, Transaction } from "sequelize";
import { FileModel, FileSource } from "../domain.layer/models/file/file.model";
import { ProjectModel } from "../domain.layer/models/project/project.model";
import { ValidationException } from "../domain.layer/exceptions/custom.exception";
import sanitizeFilename from "sanitize-filename";

// Re-export FileSource for backward compatibility
export { FileSource };

export interface UploadedFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size?: number;
}

export interface FileMetadata {
  id: number;
  filename: string;
  project_id?: number;
  uploaded_time?: string;
  source?: string;
  uploader_name?: string;
  uploader_surname?: string;
}

export interface OrganizationFileMetadata {
  id: number;
  filename: string;
  size?: number;
  mimetype?: string;
  upload_date?: string;
  uploaded_by?: number;
  org_id?: number;
  model_id?: number;
  source?: string;
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
// Organization Files Repository (org-level files in files table)
// ============================================================================

/**
 * Uploads an organization-level file (no project association)
 *
 * @param file - The Express multer file object
 * @param userId - ID of the user uploading the file
 * @param orgId - Organization ID for the file
 * @param tenant - Tenant schema identifier
 * @param modelId - Optional model ID to associate with
 * @param source - Optional source identifier (defaults to 'File Manager')
 * @param transaction - Optional database transaction for atomicity
 * @returns The created file record
 */
export async function uploadOrganizationFile(
  file: Express.Multer.File,
  userId: number,
  orgId: number,
  tenant: string,
  modelId?: number,
  source?: FileSource,
  transaction?: Transaction
): Promise<OrganizationFileMetadata> {
  validateTenant(tenant);

  const safeName = sanitizeFilenameStr(file.originalname);

  const query = `
    INSERT INTO ${escapePgIdentifier(tenant)}.files
      (filename, size, type, file_path, content, uploaded_by, uploaded_time, model_id, org_id, is_demo, source, project_id)
    VALUES
      (:filename, :size, :mimetype, :file_path, :content, :uploaded_by, NOW(), :model_id, :org_id, false, :source, NULL)
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
      source: source ?? "File Manager",
    },
    type: QueryTypes.SELECT,
    ...(transaction && { transaction }),
  });

  return result[0] as OrganizationFileMetadata;
}

/**
 * Gets a file by ID from the files table
 *
 * @param fileId - The file ID to retrieve
 * @param tenant - Tenant schema identifier
 * @returns The file record or null if not found
 */
export async function getFileById(
  fileId: number,
  tenant: string
): Promise<FileModel | null> {
  validateTenant(tenant);

  const query = `SELECT * FROM ${escapePgIdentifier(tenant)}.files WHERE id = :fileId`;

  const result = await sequelize.query(query, {
    replacements: { fileId },
    type: QueryTypes.SELECT,
  });

  return (result[0] as FileModel) || null;
}

/**
 * Deletes a file by ID from the files table
 *
 * @param fileId - The file ID to delete
 * @param tenant - Tenant schema identifier
 * @param transaction - Optional database transaction for atomicity
 * @returns True if file was deleted, false otherwise
 */
export async function deleteFileById(
  fileId: number,
  tenant: string,
  transaction?: Transaction
): Promise<boolean> {
  validateTenant(tenant);

  const query = `DELETE FROM ${escapePgIdentifier(tenant)}.files WHERE id = :fileId RETURNING id`;

  const result = await sequelize.query(query, {
    replacements: { fileId },
    type: QueryTypes.SELECT,
    ...(transaction && { transaction }),
  });

  return Array.isArray(result) && result.length > 0;
}

/**
 * Gets organization-level files (files without project association) with pagination
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
): Promise<{ files: OrganizationFileMetadata[]; total: number }> {
  validateTenant(tenant);

  const { limit, offset } = options;

  let query = `
    SELECT
      f.id,
      f.filename,
      f.size,
      f.type AS mimetype,
      f.uploaded_time AS upload_date,
      f.uploaded_by,
      f.org_id,
      f.model_id,
      f.source,
      u.name AS uploader_name,
      u.surname AS uploader_surname
    FROM ${escapePgIdentifier(tenant)}.files f
    JOIN public.users u ON f.uploaded_by = u.id
    WHERE f.org_id = :orgId
      AND f.project_id IS NULL
      AND (f.source IS NULL OR f.source != 'policy_editor')
    ORDER BY f.uploaded_time DESC`;

  if (limit !== undefined) query += ` LIMIT :limit`;
  if (offset !== undefined) query += ` OFFSET :offset`;

  const files = await sequelize.query(query, {
    replacements: { orgId, limit, offset },
    type: QueryTypes.SELECT,
  });

  const countQuery = `
    SELECT COUNT(*) as count
    FROM ${escapePgIdentifier(tenant)}.files
    WHERE org_id = :orgId
      AND project_id IS NULL
      AND (source IS NULL OR source != 'policy_editor')`;

  const countResult = await sequelize.query(countQuery, {
    replacements: { orgId },
    type: QueryTypes.SELECT,
  });

  const countRow = countResult[0] as { count: string } | undefined;
  const total = countRow ? parseInt(countRow.count, 10) : 0;

  return { files: files as OrganizationFileMetadata[], total };
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
 * @param transaction - Optional database transaction for atomicity
 */
export async function logFileAccess(
  fileId: number,
  userId: number,
  orgId: number,
  action: "download" | "view",
  tenant: string,
  transaction?: Transaction
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
    ...(transaction && { transaction }),
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

/**
 * Gets files associated with a specific model ID
 *
 * @param modelId - The model ID to get files for
 * @param tenant - Tenant schema identifier
 * @returns Array of files associated with the model
 */
export async function getFilesByModelId(
  modelId: number,
  tenant: string
): Promise<OrganizationFileMetadata[]> {
  validateTenant(tenant);

  const query = `
    SELECT
      f.id,
      f.filename,
      f.size,
      f.type AS mimetype,
      f.uploaded_time AS upload_date,
      f.uploaded_by,
      f.org_id,
      f.model_id,
      f.source,
      u.name AS uploader_name,
      u.surname AS uploader_surname
    FROM ${escapePgIdentifier(tenant)}.files f
    JOIN public.users u ON f.uploaded_by = u.id
    WHERE f.model_id = :modelId
    ORDER BY f.uploaded_time DESC`;

  const files = await sequelize.query(query, {
    replacements: { modelId },
    type: QueryTypes.SELECT,
  });

  return files as OrganizationFileMetadata[];
}

// ============================================================================
// Backward Compatibility Aliases
// ============================================================================

/**
 * @deprecated Use uploadOrganizationFile instead
 */
export const uploadFileManagerFile = uploadOrganizationFile;
