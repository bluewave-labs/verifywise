import { Assessment } from "../models/assessment.model";
import pool from "../database/db";
import { createNewTopicsQuery } from "./topic.utils";

export const getAllAssessmentsQuery = async (): Promise<Assessment[]> => {
  const assessments = await pool.query("SELECT * FROM assessments");
  return assessments.rows;
};

export const getAssessmentByIdQuery = async (
  id: number
): Promise<Assessment | null> => {
  const result = await pool.query("SELECT * FROM assessments WHERE id = $1", [
    id,
  ]);
  return result.rows.length ? result.rows[0] : null;
};

export const getAssessmentByProjectIdQuery = async (
  projectId: number
): Promise<Assessment[]> => {
  const result = await pool.query(
    "SELECT * FROM assessments WHERE project_id = $1",
    [projectId]
  );
  return result.rows;
};

export const createNewAssessmentQuery = async (
  assessment: Assessment
): Promise<Object> => {
  const result = await pool.query(
    `INSERT INTO assessments (project_id) VALUES ($1) RETURNING *`,
    [assessment.project_id]
  );
  const topics = await createNewTopicsQuery(result.rows[0].id);
  return { assessment: result.rows[0], topics };
};

export const updateAssessmentByIdQuery = async (
  id: number,
  assessment: Partial<Assessment>
): Promise<Assessment | null> => {
  const result = await pool.query(
    `UPDATE assessments SET project_id = $1 WHERE id = $2 RETURNING *`,
    [assessment.project_id, id]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const deleteAssessmentByIdQuery = async (
  id: number
): Promise<Assessment | null> => {
  const result = await pool.query(
    `DELETE FROM assessments WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};
