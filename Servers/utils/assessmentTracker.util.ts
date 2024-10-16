import { AssessmentTracker } from "../models/AssessmentTracker";
import pool from "../database/db";

export const getAllAssessmentTrackersQuery = async (): Promise<AssessmentTracker[]> => {
  console.log("getAllAssessmentTrackers");
  const assessmentTrackers = await pool.query("SELECT * FROM assessmentTrackers");
  return assessmentTrackers.rows;
};

export const getAssessmentTrackerByIdQuery = async (id: number): Promise<AssessmentTracker | null> => {
  console.log("getAssessmentTrackerById", id);
  const result = await pool.query("SELECT * FROM assessmentTrackers WHERE id = $1", [id]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewAssessmentTrackerQuery = async (assessmentTracker: {
  name: string;
  description: string;
}): Promise<AssessmentTracker> => {
  console.log("createNewAssessmentTracker", assessmentTracker);
  const result = await pool.query(
    "INSERT INTO assessmentTrackers (name, description) VALUES ($1, $2) RETURNING *",
    [assessmentTracker.name, assessmentTracker.description]
  );
  return result.rows[0];
};

export const updateAssessmentTrackerByIdQuery = async (
  id: number,
  assessmentTracker: { name?: string; description?: string }
): Promise<AssessmentTracker | null> => {
  console.log("updateAssessmentTrackerById", id, assessmentTracker);
  const fields = [];
  const values = [];
  let query = "UPDATE assessmentTrackers SET ";

  if (assessmentTracker.name) {
    fields.push("name = $1");
    values.push(assessmentTracker.name);
  }
  if (assessmentTracker.description) {
    fields.push("description = $2");
    values.push(assessmentTracker.description);
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + " WHERE id = $3 RETURNING *";
  values.push(id);

  const result = await pool.query(query, values);
  return result.rows.length ? result.rows[0] : null;
};

export const deleteAssessmentTrackerByIdQuery = async (id: number): Promise<boolean> => {
  console.log("deleteAssessmentTrackerById", id);
  const result = await pool.query(
    "DELETE FROM assessmentTrackers WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
};
