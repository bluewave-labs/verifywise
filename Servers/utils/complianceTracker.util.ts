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
  project_id: number
  compliance_status: number
  pending_audits: number
  completed_assessments: number
  implemented_controls: number
}): Promise<ComplianceTracker> => {
  console.log("createNewComplianceTracker", complianceTracker);
  const result = await pool.query(
    "INSERT INTO complianceTrackers (project_id, compliance_status, pending_audits, completed_assessments, implemented_controls) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [complianceTracker.project_id, complianceTracker.compliance_status, complianceTracker.pending_audits, complianceTracker.completed_assessments, complianceTracker.implemented_controls]
  );
  return result.rows[0];
};

export const updateComplianceTrackerByIdQuery = async (
  id: number,
  complianceTracker: {
    project_id?: number
    compliance_status?: number
    pending_audits?: number
    completed_assessments?: number
    implemented_controls?: number  
  }
): Promise<ComplianceTracker | null> => {
  console.log("updateComplianceTrackerById", id, complianceTracker);
  const fields = [];
  const values = [];
  let query = "UPDATE complianceTrackers SET ";

  if(complianceTracker.project_id) {
    fields.push("project_id = $1");
    values.push(complianceTracker.project_id)
  }
  if(complianceTracker.compliance_status) {
    fields.push("compliance_status = $2");
    values.push(complianceTracker.compliance_status)
  }
  if(complianceTracker.pending_audits) {
    fields.push("pending_audits = $3");
    values.push(complianceTracker.pending_audits)
  }
  if(complianceTracker.completed_assessments) {
    fields.push("completed_assessments = $4");
    values.push(complianceTracker.completed_assessments)
  }
  if(complianceTracker.implemented_controls) {
    fields.push("implemented_controls = $5");
    values.push(complianceTracker.implemented_controls)
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + " WHERE id = $6 RETURNING *";
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
