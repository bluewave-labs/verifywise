import { Assessment } from "../models/assessment.model";
import pool from "../database/db";

export const getAllAssessmentsQuery = async (): Promise<Assessment[]> => {
  console.log("getAllAssessments");
  const assessments = await pool.query("SELECT * FROM assessments");
  return assessments.rows;
};

export const getAssessmentByIdQuery = async (
  id: number
): Promise<Assessment | null> => {
  console.log("getAssessmentById", id);
  const result = await pool.query("SELECT * FROM assessments WHERE id = $1", [
    id,
  ]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewAssessmentQuery = async (assessment: {
  projectId: number;
}): Promise<Assessment> => {
  console.log("createNewAssessment", assessment);
  const result = await pool.query(
    `INSERT INTO assessments (project_id) VALUES ($1) RETURNING *`,
    [assessment.projectId]
  );
  return result.rows[0];
};

export const updateAssessmentByIdQuery = async (
  id: number,
  assessment: Partial<{
    projectId: number;
  }>
): Promise<Assessment | null> => {
  console.log("updateAssessmentById", id, assessment);
  const result = await pool.query(
    `UPDATE assessments SET project_id = $1 WHERE id = $2 RETURNING *`,
    [assessment.projectId, id]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const deleteAssessmentByIdQuery = async (
  id: number
): Promise<Assessment | null> => {
  console.log("deleteAssessmentById", id);
  const result = await pool.query(
    `DELETE FROM assessments WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};
