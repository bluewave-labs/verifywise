import { UploadedFile } from "./question.utils";
import { sequelize } from "../database/db";
import { FileModel } from "../domain.layer/models/file/file.model";
import { QueryTypes, Transaction } from "sequelize";
import { ProjectModel } from "../domain.layer/models/project/project.model";

const sanitizeFilename = (name: string) =>
  name.replace(/[^a-zA-Z0-9-_\.]/g, "_");

export const uploadFile = async (
  file: UploadedFile,
  user_id: number,
  project_id: number,
  source:
    | "Assessment tracker group"
    | "Compliance tracker group"
    | "Project risks report"
    | "Compliance tracker report"
    | "Assessment tracker report"
    | "Vendors and risks report"
    | "All reports"
    | "Management system clauses group"
    | "Reference controls group"
    | "Clauses and annexes report",
  tenant: string,
  transaction: Transaction | null = null
) => {
  const projectIsDemo = await sequelize.query(
    `SELECT is_demo FROM ${tenant}.projects WHERE id = :id`,
    {
      replacements: { id: project_id },
      mapToModel: true,
      model: ProjectModel,
      ...(transaction && { transaction }),
    }
  );
  const is_demo = projectIsDemo[0].is_demo || false;
  const query = `INSERT INTO ${tenant}.files
    (
      filename, content, type, project_id, uploaded_by, uploaded_time, is_demo, source
    )
    VALUES (
      :filename, :content, :type, :project_id, :uploaded_by, :uploaded_time, :is_demo, :source
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
    },
    mapToModel: true,
    model: FileModel,
    // type: QueryTypes.INSERT
    ...(transaction && { transaction }),
  });
  return result[0];
};

export const deleteFileById = async (id: number, tenant: string, transaction: Transaction) => {
  const query = `DELETE FROM ${tenant}.files WHERE id = :id`;
  const result = await sequelize.query(query, {
    replacements: { id },
    mapToModel: true,
    model: FileModel,
    type: QueryTypes.DELETE,
    transaction,
  });
  return result.length > 0;
};

export const getFileById = async (id: number, tenant: string) => {
  const query = `SELECT * FROM ${tenant}.files WHERE id = :id`;
  const result = await sequelize.query(query, {
    replacements: { id },
    mapToModel: true,
    model: FileModel,
  });
  return result[0];
};

export const getFileMetadataByProjectId = async (project_id: number, tenant: string) => {
  const query = `SELECT 
  f.id, 
  f.filename, 
  f.project_id,  
  f.uploaded_time,
  f.source,
  u.name AS uploader_name,
  u.surname AS uploader_surname 
    FROM ${tenant}.files f
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
