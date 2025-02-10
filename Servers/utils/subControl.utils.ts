import { Subcontrol } from "../models/subcontrol.model";
import pool from "../database/db";
import { UploadedFile } from "./question.utils";
import { uploadFile } from "./fileUpload.utils";

export const getAllSubcontrolsQuery = async (): Promise<Subcontrol[]> => {
  console.log("getAllSubcontrols");
  const subcontrols = await pool.query("SELECT * FROM subcontrols");
  return subcontrols.rows;
};

export const getAllSubcontrolsByControlIdQuery = async (
  controlId: number
): Promise<Subcontrol[]> => {
  console.log("getAllSubcontrolsByControlId", controlId);
  const subcontrols = await pool.query(
    "SELECT * FROM subcontrols WHERE control_id = $1",
    [controlId]
  );
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
    subControlTitle: string;
    subControlDescription: string;
    status: string;
    approver: string;
    riskReview: string;
    owner: string;
    reviewer: string;
    dueDate: Date;
    implementationDetails: string;
    evidence: string;
    feedback: string;
  },
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
      control_id, sub_control_title , sub_control_description, status, approver, risk_review, owner, reviewer, due_date, 
      implementation_details, evidence, feedback, evidenceFiles, feedbackFiles
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
    [
      controlId,
      subcontrol.subControlTitle,
      subcontrol.subControlDescription,
      subcontrol.status,
      subcontrol.approver,
      subcontrol.riskReview,
      subcontrol.owner,
      subcontrol.reviewer,
      subcontrol.dueDate,
      subcontrol.implementationDetails,
      subcontrol.evidence,
      subcontrol.feedback,
      uploadedEvidenceFiles,
      uploadedFeedbackFiles,
    ]
  );
  return result.rows[0];
};

export const updateSubcontrolByIdQuery = async (
  id: number,
  subcontrol: Partial<{
    controlId: number;
    subControlTitle: string;
    subControlDescription: string;
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
  }>,
  evidenceFiles?: UploadedFile[],
  feedbackFiles?: UploadedFile[]
): Promise<Subcontrol | null> => {
  console.log("updateSubcontrolById", id, subcontrol);

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
      control_id = $1, sub_control_title = $2, sub_control_description = $3, status = $4, approver = $5, 
      risk_review = $6, owner = $7, reviewer = $8, due_date = $9, implementation_details = $10, evidence = $11, 
      feedback = $12, evidenceFiles = $13, feedbackFiles = $14 WHERE id = $15 RETURNING *`,
    [
      subcontrol.controlId,
      subcontrol.subControlTitle,
      subcontrol.subControlDescription,
      subcontrol.status,
      subcontrol.approver,
      subcontrol.riskReview,
      subcontrol.owner,
      subcontrol.reviewer,
      subcontrol.dueDate,
      subcontrol.implementationDetails,
      subcontrol.evidence,
      subcontrol.feedback,
      uploadedEvidenceFiles,
      uploadedFeedbackFiles,
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

const subControlsMock = (controlIds: number[]) => {
  return [
    ...Array(3).fill({ controlId: controlIds[0] }),
    ...Array(2).fill({ controlId: controlIds[1] }),
    ...Array(1).fill({ controlId: controlIds[2] }),
    ...Array(1).fill({ controlId: controlIds[3] }),
    ...Array(1).fill({ controlId: controlIds[4] }),
    ...Array(2).fill({ controlId: controlIds[5] }),
    ...Array(1).fill({ controlId: controlIds[6] }),
    ...Array(1).fill({ controlId: controlIds[7] }),
    ...Array(1).fill({ controlId: controlIds[8] }),
    ...Array(3).fill({ controlId: controlIds[9] }),
    ...Array(2).fill({ controlId: controlIds[10] }),
    ...Array(2).fill({ controlId: controlIds[11] }),
    ...Array(1).fill({ controlId: controlIds[12] }),
    ...Array(2).fill({ controlId: controlIds[13] }),
    ...Array(2).fill({ controlId: controlIds[14] }),
    ...Array(1).fill({ controlId: controlIds[15] }),
    ...Array(1).fill({ controlId: controlIds[16] }),
    ...Array(1).fill({ controlId: controlIds[17] }),
    ...Array(1).fill({ controlId: controlIds[18] }),
    ...Array(1).fill({ controlId: controlIds[19] }),
    ...Array(1).fill({ controlId: controlIds[20] }),
    ...Array(1).fill({ controlId: controlIds[21] }),
    ...Array(1).fill({ controlId: controlIds[22] }),
    ...Array(1).fill({ controlId: controlIds[23] }),
    ...Array(1).fill({ controlId: controlIds[24] }),
    ...Array(2).fill({ controlId: controlIds[25] }),
    ...Array(1).fill({ controlId: controlIds[26] }),
    ...Array(2).fill({ controlId: controlIds[27] }),
    ...Array(6).fill({ controlId: controlIds[28] }),
    ...Array(1).fill({ controlId: controlIds[29] }),
    ...Array(1).fill({ controlId: controlIds[30] }),
    ...Array(1).fill({ controlId: controlIds[31] }),
    ...Array(1).fill({ controlId: controlIds[32] }),
    ...Array(1).fill({ controlId: controlIds[33] }),
    ...Array(1).fill({ controlId: controlIds[34] }),
    ...Array(1).fill({ controlId: controlIds[35] }),
    ...Array(1).fill({ controlId: controlIds[36] }),
    ...Array(1).fill({ controlId: controlIds[37] }),
    ...Array(1).fill({ controlId: controlIds[38] }),
    ...Array(1).fill({ controlId: controlIds[39] }),
    ...Array(1).fill({ controlId: controlIds[40] }),
    ...Array(1).fill({ controlId: controlIds[41] }),
    ...Array(1).fill({ controlId: controlIds[42] }),
    ...Array(2).fill({ controlId: controlIds[43] }),
    ...Array(1).fill({ controlId: controlIds[44] }),
    ...Array(2).fill({ controlId: controlIds[45] }),
    ...Array(1).fill({ controlId: controlIds[46] }),
    ...Array(1).fill({ controlId: controlIds[47] }),
    ...Array(2).fill({ controlId: controlIds[48] }),
    ...Array(1).fill({ controlId: controlIds[49] }),
    ...Array(1).fill({ controlId: controlIds[50] }),
    ...Array(1).fill({ controlId: controlIds[51] }),
    ...Array(1).fill({ controlId: controlIds[52] }),
    ...Array(1).fill({ controlId: controlIds[53] }),
    ...Array(1).fill({ controlId: controlIds[54] }),
    ...Array(1).fill({ controlId: controlIds[55] }),
    ...Array(1).fill({ controlId: controlIds[56] }),
    ...Array(2).fill({ controlId: controlIds[57] }),
    ...Array(1).fill({ controlId: controlIds[58] }),
    ...Array(1).fill({ controlId: controlIds[59] }),
    ...Array(1).fill({ controlId: controlIds[60] }),
    ...Array(1).fill({ controlId: controlIds[61] }),
    ...Array(1).fill({ controlId: controlIds[62] }),
    ...Array(4).fill({ controlId: controlIds[63] }),
    ...Array(1).fill({ controlId: controlIds[64] }),
    ...Array(1).fill({ controlId: controlIds[65] }),
    ...Array(2).fill({ controlId: controlIds[66] }),
    ...Array(1).fill({ controlId: controlIds[67] }),
    ...Array(1).fill({ controlId: controlIds[68] }),
    ...Array(1).fill({ controlId: controlIds[69] }),
    ...Array(1).fill({ controlId: controlIds[70] }),
    ...Array(1).fill({ controlId: controlIds[71] }),
    ...Array(1).fill({ controlId: controlIds[72] }),
    ...Array(1).fill({ controlId: controlIds[73] }),
    ...Array(1).fill({ controlId: controlIds[74] }),
  ];
};

export const createNewSubControlsQuery = async (controlIds: number[]) => {
  let query = "INSERT INTO subcontrols(control_id) VALUES ";
  const data = subControlsMock(controlIds).map((d) => {
    return `(${d.controlId})`;
  });
  query += data.join(",") + " RETURNING *;";
  const result = await pool.query(query);
  return result.rows;
};
