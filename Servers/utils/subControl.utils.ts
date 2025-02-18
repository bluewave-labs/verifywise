import { Subcontrol } from "../models/subcontrol.model";
import pool from "../database/db";
import { UploadedFile } from "./question.utils";
import { uploadFile } from "./fileUpload.utils";

export const getAllSubcontrolsQuery = async (): Promise<Subcontrol[]> => {
  const subcontrols = await pool.query("SELECT * FROM subcontrols");
  return subcontrols.rows;
};

export const getAllSubcontrolsByControlIdQuery = async (
  controlId: number
): Promise<Subcontrol[]> => {
  const subcontrols = await pool.query(
    "SELECT * FROM subcontrols WHERE control_id = $1",
    [controlId]
  );
  return subcontrols.rows;
};

export const getSubcontrolByIdQuery = async (
  id: number
): Promise<Subcontrol | null> => {
  const result = await pool.query("SELECT * FROM subcontrols WHERE id = $1", [
    id,
  ]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewSubcontrolQuery = async (
  controlId: number,
  subcontrol: Partial<Subcontrol>,
  evidenceFiles?: UploadedFile[],
  feedbackFiles?: UploadedFile[]
): Promise<Subcontrol> => {
  let uploadedEvidenceFiles: { id: number; fileName: string }[] = [];
  await Promise.all(
    evidenceFiles!.map(async (file) => {
      const uploadedFile = await uploadFile(file);
      uploadedEvidenceFiles.push({
        id: uploadedFile.id.toString(),
        fileName: uploadedFile.filename,
      });
    })
  );

  let uploadedFeedbackFiles: { id: number; fileName: string }[] = [];
  await Promise.all(
    feedbackFiles!.map(async (file) => {
      const uploadedFile = await uploadFile(file);
      uploadedFeedbackFiles.push({
        id: uploadedFile.id.toString(),
        fileName: uploadedFile.filename,
      });
    })
  );

  const result = await pool.query(
    `INSERT INTO subcontrols (
      control_id, title, description, 
      order_no, status, approver, 
      risk_review, owner, reviewer, 
      due_date, implementation_details, evidence_description, 
      feedback_description, evidence_files, feedback_files
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
    [
      controlId,
      subcontrol.title,
      subcontrol.description,
      subcontrol.order_no,
      subcontrol.status,
      subcontrol.approver,
      subcontrol.risk_review,
      subcontrol.owner,
      subcontrol.reviewer,
      subcontrol.due_date,
      subcontrol.implementation_details,
      subcontrol.evidence_description,
      subcontrol.feedback_description,
      uploadedEvidenceFiles,
      uploadedFeedbackFiles,
    ]
  );
  return result.rows[0];
};

export const updateSubcontrolByIdQuery = async (
  id: number,
  subcontrol: Partial<Subcontrol>,
  evidenceFiles?: UploadedFile[],
  feedbackFiles?: UploadedFile[]
): Promise<Subcontrol | null> => {
  let uploadedEvidenceFiles: { id: number; fileName: string }[] = [];
  await Promise.all(
    evidenceFiles!.map(async (file) => {
      const uploadedFile = await uploadFile(file);
      uploadedEvidenceFiles.push({
        id: uploadedFile.id.toString(),
        fileName: uploadedFile.filename,
      });
    })
  );

  let uploadedFeedbackFiles: { id: number; fileName: string }[] = [];
  await Promise.all(
    feedbackFiles!.map(async (file) => {
      const uploadedFile = await uploadFile(file);
      uploadedFeedbackFiles.push({
        id: uploadedFile.id.toString(),
        fileName: uploadedFile.filename,
      });
    })
  );

  // control_id, subControlTitle, subControlDescription, status, approver, risk_review, owner, reviewer, due_date,
  //     implementation_details, evidence, feedback, evidenceFiles, feedbackFiles
  const result = await pool.query(
    `UPDATE subcontrols SET 
      control_id = $1, title = $2, description = $3, 
      status = $4, approver = $5, risk_review = $6, 
      owner = $7, reviewer = $8, due_date = $9, 
      implementation_details = $10, evidence_description = $11, feedback_description = $12, 
      evidence_files = $13, feedback_files = $14, order_no = $15 WHERE id = $16 RETURNING *`,
    [
      subcontrol.control_id,
      subcontrol.title,
      subcontrol.description,
      subcontrol.status,
      subcontrol.approver,
      subcontrol.risk_review,
      subcontrol.owner,
      subcontrol.reviewer,
      subcontrol.due_date,
      subcontrol.implementation_details,
      subcontrol.evidence_description,
      subcontrol.feedback_description,
      uploadedEvidenceFiles,
      uploadedFeedbackFiles,
      subcontrol.order_no,
      id,
    ]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const deleteSubcontrolByIdQuery = async (
  id: number
): Promise<Subcontrol | null> => {
  const result = await pool.query(
    "DELETE FROM subcontrols WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const createNewSubControlsQuery = async (
  controlId: number,
  subControls: {
    order_no: number;
    title: string;
    description: string;
  }[]
) => {
  let query =
    "INSERT INTO subcontrols(title, description, control_id, order_no) VALUES ";
  const data = subControls.map((d) => {
    return `('${d.title}', '${d.description}', ${controlId}, ${d.order_no})`;
  });
  query += data.join(",") + " RETURNING *;";
  const result = await pool.query(query);
  return result.rows;
};
