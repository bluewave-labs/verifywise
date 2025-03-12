import { UploadedFile } from "./question.utils";
import pool from "../database/db";

export const uploadFile = async (
  file: UploadedFile,
  user_id: number
) => {
  const query = `INSERT INTO files
    (filename, content, uploaded_by, uploaded_time)
    VALUES ($1, $2, $3, $4) RETURNING *`;
  const result = await pool.query(query, [
    file.originalname,
    file.buffer,
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
