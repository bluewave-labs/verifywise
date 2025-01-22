import { Subcontrol } from "../models/subcontrol.model";
import pool from "../database/db";

export const getAllSubcontrolsQuery = async (): Promise<Subcontrol[]> => {
  console.log("getAllSubcontrols");
  const subcontrols = await pool.query("SELECT * FROM subcontrols");
  return subcontrols.rows;
};

export const getSubcontrolByIdQuery = async (
  id: number
): Promise<Subcontrol | null> => {
  console.log("getSubcontrolById", id);
  const result = await pool.query("SELECT * FROM subcontrols WHERE id = $1", [
    id,
  ]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewSubcontrolQuery = async (
  controlId: number,
  subcontrol: {
    status: string;
    approver: string;
    riskReview: string;
    owner: string;
    reviewer: string;
    dueDate: Date;
    implementationDetails: string;
    evidence: string;
    attachment: string;
    feedback: string;
  }
): Promise<Subcontrol> => {
  console.log("createNewSubcontrol", subcontrol);
  const result = await pool.query(
    `INSERT INTO subcontrols (
      control_id, status, approver, risk_review, owner, reviewer, due_date, 
      implementation_details, evidence, attachment, feedback
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [
      controlId,
      subcontrol.status,
      subcontrol.approver,
      subcontrol.riskReview,
      subcontrol.owner,
      subcontrol.reviewer,
      subcontrol.dueDate,
      subcontrol.implementationDetails,
      subcontrol.evidence,
      subcontrol.attachment,
      subcontrol.feedback,
    ]
  );
  return result.rows[0];
};

export const updateSubcontrolByIdQuery = async (
  id: number,
  subcontrol: Partial<{
    controlId: number;
    status: string;
    approver: string;
    riskReview: string;
    owner: string;
    reviewer: string;
    dueDate: Date;
    implementationDetails: string;
    evidence: string;
    attachment: string;
    feedback: string;
  }>
): Promise<Subcontrol | null> => {
  console.log("updateSubcontrolById", id, subcontrol);
  const result = await pool.query(
    `UPDATE subcontrols SET 
      control_id = $1, status = $2, approver = $3, risk_review = $4, owner = $5, 
      reviewer = $6, due_date = $7, implementation_details = $8, evidence = $9, 
      attachment = $10, feedback = $11 WHERE id = $12 RETURNING *`,
    [
      subcontrol.controlId,
      subcontrol.status,
      subcontrol.approver,
      subcontrol.riskReview,
      subcontrol.owner,
      subcontrol.reviewer,
      subcontrol.dueDate,
      subcontrol.implementationDetails,
      subcontrol.evidence,
      subcontrol.attachment,
      subcontrol.feedback,
      id,
    ]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const deleteSubcontrolByIdQuery = async (
  id: number
): Promise<Subcontrol | null> => {
  console.log("deleteSubcontrolById", id);
  const result = await pool.query(
    "DELETE FROM subcontrols WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};
