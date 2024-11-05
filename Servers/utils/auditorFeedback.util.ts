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
  subrequirement_id: number
  assessment_type: string
  assessment_date: Date
  auditor_id: number
  compliance_status: string
  findings: string
  recommendations: string
  corrective_actions: string
  follow_up_date: Date
  follow_up_notes: string
  attachments: string
  created_at: string
  updated_at: string
}): Promise<AuditorFeedback> => {
  console.log("createNewAuditorFeedback", auditorFeedback);
  const result = await pool.query(
    "INSERT INTO auditorFeedbacks (subrequirement_id, assessment_type, assessment_date, auditor_id, compliance_status, findings, recommendations, corrective_actions, follow_up_date, follow_up_notes, attachments, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *",
    [auditorFeedback.subrequirement_id, auditorFeedback.assessment_type, auditorFeedback.assessment_date, auditorFeedback.auditor_id, auditorFeedback.compliance_status, auditorFeedback.findings, auditorFeedback.recommendations, auditorFeedback.corrective_actions, auditorFeedback.follow_up_date, auditorFeedback.follow_up_notes, auditorFeedback.attachments, auditorFeedback.created_at, auditorFeedback.updated_at]
  );
  return result.rows[0];
};

export const updateAuditorFeedbackByIdQuery = async (
  id: number,
  auditorFeedback: {
    subrequirement_id?: number
    assessment_type?: string
    assessment_date?: Date
    auditor_id?: number
    compliance_status?: string
    findings?: string
    recommendations?: string
    corrective_actions?: string
    follow_up_date?: Date
    follow_up_notes?: string
    attachments?: string
    created_at?: string
    updated_at?: string
  }
): Promise<AuditorFeedback | null> => {
  console.log("updateAuditorFeedbackById", id, auditorFeedback);
  const fields = [];
  const values = [];
  let query = "UPDATE auditorFeedbacks SET ";

  if (auditorFeedback.subrequirement_id) {
    fields.push("subrequirement_id = $1")
    values.push(auditorFeedback.subrequirement_id)
  }
  if (auditorFeedback.assessment_type) {
    fields.push("assessment_type = $2")
    values.push(auditorFeedback.assessment_type)
  }
  if (auditorFeedback.assessment_date) {
    fields.push("assessment_date = $3")
    values.push(auditorFeedback.assessment_date)
  }
  if (auditorFeedback.auditor_id) {
    fields.push("auditor_id = $4")
    values.push(auditorFeedback.auditor_id)
  }
  if (auditorFeedback.compliance_status) {
    fields.push("compliance_status = $5")
    values.push(auditorFeedback.compliance_status)
  }
  if (auditorFeedback.findings) {
    fields.push("findings = $6")
    values.push(auditorFeedback.findings)
  }
  if (auditorFeedback.recommendations) {
    fields.push("recommendations = $7")
    values.push(auditorFeedback.recommendations)
  }
  if (auditorFeedback.corrective_actions) {
    fields.push("corrective_actions = $8")
    values.push(auditorFeedback.corrective_actions)
  }
  if (auditorFeedback.follow_up_date) {
    fields.push("follow_up_date = $9")
    values.push(auditorFeedback.follow_up_date)
  }
  if (auditorFeedback.follow_up_notes) {
    fields.push("follow_up_notes = $10")
    values.push(auditorFeedback.follow_up_notes)
  }
  if (auditorFeedback.attachments) {
    fields.push("attachments = $11")
    values.push(auditorFeedback.attachments)
  }
  if (auditorFeedback.created_at) {
    fields.push("created_at = $12")
    values.push(auditorFeedback.created_at)
  }
  if (auditorFeedback.updated_at) {
    fields.push("updated_at = $13")
    values.push(auditorFeedback.updated_at)
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + " WHERE id = $14 RETURNING *";
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
