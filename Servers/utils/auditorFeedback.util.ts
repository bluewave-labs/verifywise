import { AuditorFeedback } from "../models/AuditorFeedback";
import pool from "../database/db";

export const getAllAuditorFeedbacksQuery = async (): Promise<AuditorFeedback[]> => {
  console.log("getAllAuditorFeedbacks");
  const auditorFeedbacks = await pool.query("SELECT * FROM auditorFeedbacks");
  return auditorFeedbacks.rows;
};

export const getAuditorFeedbackByIdQuery = async (id: number): Promise<AuditorFeedback | null> => {
  console.log("getAuditorFeedbackById", id);
  const result = await pool.query("SELECT * FROM auditorFeedbacks WHERE id = $1", [id]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewAuditorFeedbackQuery = async (auditorFeedback: {
  name: string;
  description: string;
}): Promise<AuditorFeedback> => {
  console.log("createNewAuditorFeedback", auditorFeedback);
  const result = await pool.query(
    "INSERT INTO auditorFeedbacks (name, description) VALUES ($1, $2) RETURNING *",
    [auditorFeedback.name, auditorFeedback.description]
  );
  return result.rows[0];
};

export const updateAuditorFeedbackByIdQuery = async (
  id: number,
  auditorFeedback: { name?: string; description?: string }
): Promise<AuditorFeedback | null> => {
  console.log("updateAuditorFeedbackById", id, auditorFeedback);
  const fields = [];
  const values = [];
  let query = "UPDATE auditorFeedbacks SET ";

  if (auditorFeedback.name) {
    fields.push("name = $1");
    values.push(auditorFeedback.name);
  }
  if (auditorFeedback.description) {
    fields.push("description = $2");
    values.push(auditorFeedback.description);
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + " WHERE id = $3 RETURNING *";
  values.push(id);

  const result = await pool.query(query, values);
  return result.rows.length ? result.rows[0] : null;
};

export const deleteAuditorFeedbackByIdQuery = async (id: number): Promise<boolean> => {
  console.log("deleteAuditorFeedbackById", id);
  const result = await pool.query(
    "DELETE FROM auditorFeedbacks WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
};
