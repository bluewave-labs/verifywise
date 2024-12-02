import { UploadedFile } from "./question.utils";
import pool from "../database/db";

export const uploadFile = async (file: UploadedFile) => {
  const query = `INSERT INTO files (filename, content) VALUES ($1, $2) RETURNING *`;
  const result = await pool.query(query, [file.originalname, file.buffer]);
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
