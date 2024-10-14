import { ComplianceTracker } from "../models/ComplianceTracker";
import pool from "../database/db";

export const getAllComplianceTrackersQuery = async (): Promise<ComplianceTracker[]> => {
  console.log("getAllComplianceTrackers");
  const complianceTrackers = await pool.query("SELECT * FROM complianceTrackers");
  return complianceTrackers.rows;
};

export const getComplianceTrackerByIdQuery = async (id: number): Promise<ComplianceTracker | null> => {
  console.log("getComplianceTrackerById", id);
  const result = await pool.query("SELECT * FROM complianceTrackers WHERE id = $1", [id]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewComplianceTrackerQuery = async (complianceTracker: {
  name: string;
  description: string;
}): Promise<ComplianceTracker> => {
  console.log("createNewComplianceTracker", complianceTracker);
  const result = await pool.query(
    "INSERT INTO complianceTrackers (name, description) VALUES ($1, $2) RETURNING *",
    [complianceTracker.name, complianceTracker.description]
  );
  return result.rows[0];
};

export const updateComplianceTrackerByIdQuery = async (
  id: number,
  complianceTracker: { name?: string; description?: string }
): Promise<ComplianceTracker | null> => {
  console.log("updateComplianceTrackerById", id, complianceTracker);
  const fields = [];
  const values = [];
  let query = "UPDATE complianceTrackers SET ";

  if (complianceTracker.name) {
    fields.push("name = $1");
    values.push(complianceTracker.name);
  }
  if (complianceTracker.description) {
    fields.push("description = $2");
    values.push(complianceTracker.description);
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + " WHERE id = $3 RETURNING *";
  values.push(id);

  const result = await pool.query(query, values);
  return result.rows.length ? result.rows[0] : null;
};

export const deleteComplianceTrackerByIdQuery = async (id: number): Promise<boolean> => {
  console.log("deleteComplianceTrackerById", id);
  const result = await pool.query(
    "DELETE FROM complianceTrackers WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
};
