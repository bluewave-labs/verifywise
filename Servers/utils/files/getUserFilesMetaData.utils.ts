import { sequelize } from "../../database/db";
import { FileModel } from "../../domain.layer/models/file/file.model";

const getUserFilesMetaDataQuery = async (
  role: string,
  userId: number,
  options?: { limit?: number; offset?: number }
): Promise<FileModel[]> => {
  const { limit, offset } = options ?? {}; // Default to empty object

  const paginationClause =
    limit !== undefined && offset !== undefined
      ? "LIMIT :limit OFFSET :offset"
      : limit !== undefined
      ? "LIMIT :limit"
      : "";

  let query = null;
  const replacements: Record<string, number> = {};

  if (role === "Admin") {
    query = `
      SELECT f.id, f.filename, f.project_id, f.uploaded_time, f.source, 
        p.project_title, u.name AS uploader_name, u.surname AS uploader_surname
      FROM files f JOIN projects p ON p.id = f.project_id
      JOIN users u ON f.uploaded_by = u.id
      WHERE f.source::TEXT NOT ILIKE '%report%'
      ORDER BY f.uploaded_time DESC
      ${paginationClause}
    `;
  } else {
    query = `
      WITH projects_of_user AS (
        SELECT DISTINCT project_id FROM projects_members WHERE user_id = :userId
        UNION ALL
        SELECT id AS project_id FROM projects WHERE owner = :userId
      ) SELECT f.id, f.filename, f.project_id, f.uploaded_time, f.source, 
          p.project_title, u.name AS uploader_name, u.surname AS uploader_surname
        FROM files f JOIN projects_of_user pu ON f.project_id = pu.project_id
        JOIN projects p ON p.id = pu.project_id
        JOIN users u ON f.uploaded_by = u.id
        WHERE f.source::TEXT NOT ILIKE '%report%'
        ORDER BY f.uploaded_time DESC
      ${paginationClause};`;
    replacements.userId = userId;
  }

  if (limit !== undefined) replacements.limit = limit;
  if (offset !== undefined) replacements.offset = offset;

  try {
    return await sequelize.query<FileModel>(query, {
      replacements,
      mapToModel: true,
      model: FileModel,
    });
  } catch (err) {
    console.error(`Database query failed for user ${userId}:`, err);
    throw new Error("Failed to retrieve file metadata.");
  }
};

export default getUserFilesMetaDataQuery;
