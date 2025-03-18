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
  project_id: number,
  user_id: number,
  evidenceFiles?: UploadedFile[],
  feedbackFiles?: UploadedFile[]
): Promise<Subcontrol> => {
  let uploadedEvidenceFiles: { id: string; fileName: string, project_id: number, uploaded_by: number, uploaded_time: Date }[] = [];
  await Promise.all(
    evidenceFiles!.map(async (file) => {
      const uploadedFile = await uploadFile(file, user_id, project_id);
      uploadedEvidenceFiles.push({
        id: uploadedFile.id.toString(),
        fileName: uploadedFile.filename,
        project_id: uploadedFile.project_id,
        uploaded_by: uploadedFile.uploaded_by,
        uploaded_time: uploadedFile.uploaded_time
      });
    })
  );

  let uploadedFeedbackFiles: { id: string; fileName: string, project_id: number, uploaded_by: number, uploaded_time: Date }[] = [];
  await Promise.all(
    feedbackFiles!.map(async (file) => {
      const uploadedFile = await uploadFile(file, user_id, project_id);
      uploadedFeedbackFiles.push({
        id: uploadedFile.id.toString(),
        fileName: uploadedFile.filename,
        project_id: uploadedFile.project_id,
        uploaded_by: uploadedFile.uploaded_by,
        uploaded_time: uploadedFile.uploaded_time
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
  evidenceUploadedFiles: { id: string; fileName: string, project_id: number, uploaded_by: number, uploaded_time: Date }[] = [],
  feedbackUploadedFiles: { id: string; fileName: string, project_id: number, uploaded_by: number, uploaded_time: Date }[] = [],
  deletedFiles: number[] = []
): Promise<Subcontrol | null> => {
  const files = await pool.query(
    `SELECT evidence_files, feedback_files FROM subcontrols WHERE id = $1`,
    [id]
  );

  let currentEvidenceFiles = (files.rows[0].evidence_files as string[]).map(f => JSON.parse(f) as {
    id: string; fileName: string; project_id: number; uploaded_by: number; uploaded_time: Date;
  })
  let currentFeedbackFiles = (files.rows[0].feedback_files as string[]).map(f => JSON.parse(f) as {
    id: string; fileName: string; project_id: number; uploaded_by: number; uploaded_time: Date;
  })

  currentEvidenceFiles = currentEvidenceFiles.filter(f => !deletedFiles.includes(parseInt(f.id)));
  currentEvidenceFiles = currentEvidenceFiles.concat(evidenceUploadedFiles);

  currentFeedbackFiles = currentFeedbackFiles.filter(f => !deletedFiles.includes(parseInt(f.id)));
  currentFeedbackFiles = currentFeedbackFiles.concat(feedbackUploadedFiles);

  const result = await pool.query(
    `UPDATE subcontrols SET 
      title = $1, description = $2, 
      status = $3, approver = $4, risk_review = $5,
      owner = $6, reviewer = $7, due_date = $8,
      implementation_details = $9, evidence_description = $10, feedback_description = $11,
      evidence_files = $12, feedback_files = $13, order_no = $14 WHERE id = $15 RETURNING *`,
    [
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
      currentEvidenceFiles,
      currentFeedbackFiles,
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
    implementation_details: string;
    evidence_description?: string;
    feedback_description?: string;
  }[],
  enable_ai_data_insertion: boolean
) => {
  let query =
    `INSERT INTO subcontrols(
      title, description, control_id, order_no,
      implementation_details, evidence_description,
      feedback_description, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;
  let createdSubControls: Subcontrol[] = []
  for (let subControl of subControls) {
    const result = await pool.query(
      query, [
      subControl.title,
      subControl.description,
      controlId,
      subControl.order_no,
      enable_ai_data_insertion ? subControl.implementation_details : null,
      enable_ai_data_insertion && subControl.evidence_description ? subControl.evidence_description : null,
      enable_ai_data_insertion && subControl.feedback_description ? subControl.feedback_description : null,
      enable_ai_data_insertion ? 'Waiting' : null
    ])
    createdSubControls = createdSubControls.concat(result.rows)
  }
  return createdSubControls
};
