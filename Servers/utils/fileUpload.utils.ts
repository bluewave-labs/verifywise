import { UploadedFile } from "./question.utils";
import { sequelize } from "../database/db";
import { FileModel } from "../models/file.model";
import { QueryTypes } from "sequelize";
import { ProjectModel } from "../models/project.model";

export const uploadFile = async (
  file: UploadedFile,
  user_id: number,
  project_id: number
) => {
  const projectIsDemo = await sequelize.query(
    "SELECT is_demo FROM projects WHERE id = :id",
    { replacements: { id: project_id }, mapToModel: true, model: ProjectModel },
  )
  const is_demo = projectIsDemo[0].is_demo || false
  const query = `INSERT INTO files
    (
      filename, content, project_id, uploaded_by, uploaded_time, is_demo
    )
    VALUES (
      :filename, :content, :project_id, :uploaded_by, :uploaded_time, :is_demo
    ) RETURNING *`;
  const result = await sequelize.query(query, {
    replacements: {
      filename: file.originalname,
      content: file.buffer,
      project_id,
      uploaded_by: user_id,
      uploaded_time: new Date().toISOString(),
      is_demo
    },
    mapToModel: true,
    model: FileModel,
    // type: QueryTypes.INSERT
  });
  return result[0];
}

export const deleteFileById = async (id: number) => {
  const query = `DELETE FROM files WHERE id = :id`;
  const result = await sequelize.query(query, {
    replacements: { id },
    mapToModel: true,
    model: FileModel,
    type: QueryTypes.DELETE
  });
  return result.length > 0
}

export const getFileById = async (id: number) => {
  const query = `SELECT * FROM files WHERE id = :id`;
  const result = await sequelize.query(query, {
    replacements: { id },
    mapToModel: true,
    model: FileModel
  });
  return result[0];
}

export const getFileMetadataByProjectId = async (project_id: number) => {
  const query = `SELECT id, filename, project_id, uploaded_by, uploaded_time 
    FROM files WHERE project_id = :project_id ORDER BY uploaded_time DESC, id ASC`;
  const result = await sequelize.query(query, {
    replacements: { project_id },
    mapToModel: true,
    model: FileModel
  });
  return result;
}
