import { sequelize } from "../../database/db";
import { FileModel } from "../../models/file.model";

const getUserFilesMetaDataQuery = async (
    userId: number,
    options?: { limit?: number; offset?: number }
): Promise<FileModel[]> => {
    const { limit, offset } = options ?? {}; // Defaults to an empty object if no options are provided

    const query = `
        SELECT f.id, f.filename, f.project_id, f.uploaded_time, f.source, 
               p.project_title, u.name AS uploader_name, u.surname AS uploader_surname
        FROM files f
        JOIN projects_members pm ON pm.project_id = f.project_id
        JOIN projects p ON p.id = f.project_id
        JOIN users u ON f.uploaded_by = u.id
        WHERE pm.user_id = :userId
        ORDER BY f.uploaded_time DESC
        ${limit ? "LIMIT :limit" : ""}
        ${offset ? "OFFSET :offset" : ""};`;

    const replacements: Record<string, number> = { userId };
    if (limit !== undefined) replacements.limit = limit;
    if (offset !== undefined) replacements.offset = offset;

    const results = await sequelize.query<FileModel>(query, {
        replacements,
        mapToModel: true,
        model: FileModel, // Maps results to Sequelize Model
    });

    return results;
};

export default getUserFilesMetaDataQuery
