import { UploadedFile } from "./question.utils";
import pool from "../database/db";

export const uploadFile = async (
  file: UploadedFile,
  user_id: number,
  project_id: number
) => {
  const query = `INSERT INTO files
    (filename, content, project_id, uploaded_by, uploaded_time)
    VALUES ($1, $2, $3, $4, $5) RETURNING *`;
  const result = await pool.query(query, [
    file.originalname,
    file.buffer,
    project_id,
    user_id,
    new Date().toISOString()
  ]);
  return result.rows[0];
}

export const deleteFileById = async (id: number) => {
  const query = `DELETE FROM files WHERE id = $1`;
  await pool.query(query, [id]);
}

export const getFileById = async (id: number) => {
  const query = `SELECT * FROM files WHERE id = $1`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
}

export const addFileToTableTest = async (
  id: number,
  uploadedFiles: {
    id: string;
    fileName: string;
    project_id: number;
    uploaded_by: number;
    uploaded_time: Date;
  }[],
  deletedFiles: number[],
  fieldName: string,
  tableName: string
): Promise<Object> => {
  // get the existing evidence files
  const evidenceFilesResult = await pool.query(
    `SELECT ${fieldName} FROM ${tableName} WHERE id = $1`,
    [id]
  );

  // Initialize evidenceFiles as empty array if null/undefined
  let evidenceFiles: {
    id: string;
    fileName: string;
    project_id: number;
    uploaded_by: number;
    uploaded_time: Date;
  }[] = [];

  // Only process existing files if they exist
  if (evidenceFilesResult.rows[0]?.evidence_files) {
    try {
      const existingFiles = evidenceFilesResult.rows[0]
        .evidence_files as string[];
      evidenceFiles = existingFiles
        .filter((f) => f) // Filter out null/undefined entries
        .map((f) => {
          try {
            return JSON.parse(f);
          } catch (e) {
            console.error("Failed to parse evidence file:", f);
            return null;
          }
        })
        .filter((f) => f !== null); // Filter out failed parses
    } catch (e) {
      console.error("Error processing existing evidence files:", e);
    }
  }

  // remove the deleted file ids
  evidenceFiles = evidenceFiles.filter(
    (f) => !deletedFiles.includes(parseInt(f.id))
  );

  // combine the files lists
  evidenceFiles = evidenceFiles.concat(uploadedFiles || []);

  // update
  const result = await pool.query(
    `UPDATE ${tableName} SET ${fieldName} = $1 WHERE id = $2 RETURNING *;`,
    [evidenceFiles, id]
  );
  return result.rows[0];
};

