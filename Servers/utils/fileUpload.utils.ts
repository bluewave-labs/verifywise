import { UploadedFile } from "./question.utils";
import { sequelize } from "../database/db";
import { FileModel, FileSource } from "../domain.layer/models/file/file.model";
import { Transaction, QueryTypes } from "sequelize";
import { ProjectModel } from "../domain.layer/models/project/project.model";

/**
 * Only allow tenants as valid PostgreSQL schema identifiers: letters, digits, underscores (max 30 chars).
 */
function isValidTenantSchema(tenant: string): boolean {
  return /^[A-Za-z0-9_]{1,30}$/.test(tenant);
}

/**
 * Escape a SQL identifier safely for PostgreSQL.
 * Throws on invalid schema name.
 */
function escapePgIdentifier(ident: string): string {
  if (!isValidTenantSchema(ident)) {
    throw new Error("Unsafe tenant identifier provided to SQL query");
  }
  return '"' + ident.replace(/"/g, '""') + '"';
}

const sanitizeFilename = (name: string) =>
  name.replace(/[^a-zA-Z0-9-_\.]/g, "_");

export const uploadFile = async (
  file: UploadedFile,
  user_id: number,
  project_id: number | null,
  source: FileSource,
  tenant: string,
  transaction: Transaction | null = null,
  options?: {
    org_id?: number;
    model_id?: number;
    file_path?: string;
  }
) => {
  let is_demo = false;
  if (project_id) {
    const projectIsDemo = await sequelize.query(
      `SELECT is_demo FROM ${escapePgIdentifier(tenant)}.projects WHERE id = :id`,
      {
        replacements: { id: project_id },
        mapToModel: true,
        model: ProjectModel,
        ...(transaction && { transaction }),
      }
    );
    is_demo = projectIsDemo[0]?.is_demo || false;
  }
  const query = `INSERT INTO ${escapePgIdentifier(tenant)}.files
    (
      filename, content, type, project_id, uploaded_by, uploaded_time, is_demo, source, size, file_path, org_id, model_id
    )
    VALUES (
      :filename, :content, :type, :project_id, :uploaded_by, :uploaded_time, :is_demo, :source, :size, :file_path, :org_id, :model_id
    ) RETURNING *`;
  const result = await sequelize.query(query, {
    replacements: {
      filename: sanitizeFilename(file.originalname),
      content: file.buffer,
      project_id: project_id,
      type: file.mimetype,
      uploaded_by: user_id,
      uploaded_time: new Date().toISOString(),
      is_demo,
      source,
      size: file.size || null,
      file_path: options?.file_path || sanitizeFilename(file.originalname),
      org_id: options?.org_id || null,
      model_id: options?.model_id || null,
    },
    mapToModel: true,
    model: FileModel,
    ...(transaction && { transaction }),
  });
  // result[0] is an array of model instances, get the first one
  return Array.isArray(result[0]) && result[0].length > 0
    ? result[0][0]
    : result[0];
};

export const deleteFileById = async (
  id: number,
  tenant: string,
  transaction: Transaction
) => {
  // Clean up any virtual folder mappings for this file
  await sequelize.query(
    `DELETE FROM ${escapePgIdentifier(tenant)}.file_folder_mappings WHERE file_id = :id`,
    {
      replacements: { id },
      transaction,
    }
  );

  const query = `DELETE FROM ${escapePgIdentifier(tenant)}.files WHERE id = :id returning id`;
  console.log(`Executing query: ${query} with id: ${id}`);
  const result = await sequelize.query(query, {
    replacements: { id },
    mapToModel: true,
    model: FileModel,
    transaction,
  });
  console.log(`Delete result: ${result}`);
  return result.length > 0;
};

export const getFileById = async (id: number, tenant: string) => {
  const query = `SELECT * FROM ${escapePgIdentifier(tenant)}.files WHERE id = :id`;
  const result = await sequelize.query(query, {
    replacements: { id },
    mapToModel: true,
    model: FileModel,
  });
  return result[0];
};

/**
 * Check if a user has access to a file.
 * Access is granted if:
 * - User is Admin
 * - User uploaded the file
 * - For project files: User has access to the project (owner or member)
 * - For org-level files: User belongs to the same organization
 */
export const canUserAccessFile = async (
  fileId: number,
  userId: number,
  role: string,
  tenant: string,
  userOrgId?: number
): Promise<boolean> => {
  // Admins can access all files
  if (role === "Admin") {
    return true;
  }

  // Query that handles both project-level and org-level files
  const query = `
    SELECT f.id
    FROM ${escapePgIdentifier(tenant)}.files f
    LEFT JOIN ${escapePgIdentifier(tenant)}.projects p ON f.project_id = p.id
    LEFT JOIN ${escapePgIdentifier(tenant)}.projects_members pm ON p.id = pm.project_id
    WHERE f.id = :fileId
      AND (
        f.uploaded_by = :userId
        OR p.owner = :userId
        OR pm.user_id = :userId
        OR (f.project_id IS NULL AND f.org_id = :userOrgId)
      )
    LIMIT 1
  `;

  const result = await sequelize.query(query, {
    replacements: { fileId, userId, userOrgId: userOrgId || null },
    type: QueryTypes.SELECT,
  });

  return result.length > 0;
};

export const getFileMetadataByProjectId = async (
  project_id: number,
  tenant: string
) => {
  const query = `SELECT 
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
    replacements: { project_id },
    mapToModel: true,
    model: FileModel,
  });
  return result;
};
