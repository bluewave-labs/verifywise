import { Subcontrol, SubcontrolModel } from "../models/subcontrol.model";
import { sequelize } from "../database/db";
import { UploadedFile } from "./question.utils";
import { uploadFile } from "./fileUpload.utils";
import { QueryTypes } from "sequelize";

export const getAllSubcontrolsQuery = async (): Promise<Subcontrol[]> => {
  const subcontrols = await sequelize.query(
    "SELECT * FROM subcontrols",
    {
      mapToModel: true,
      model: SubcontrolModel
    }
  );
  return subcontrols;
};

export const getAllSubcontrolsByControlIdQuery = async (
  controlId: number
): Promise<Subcontrol[]> => {
  const subcontrols = await sequelize.query(
    "SELECT * FROM subcontrols WHERE control_id = :id",
    {
      replacements: { id: controlId },
      mapToModel: true,
      model: SubcontrolModel
    }
  );
  return subcontrols;
};

export const getSubcontrolByIdQuery = async (
  id: number
): Promise<Subcontrol | null> => {
  const result = await sequelize.query(
    "SELECT * FROM subcontrols WHERE id = :id",
    {
      replacements: { id },
      mapToModel: true,
      model: SubcontrolModel
    }
  );
  return result[0];
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
        id: uploadedFile.id!.toString(),
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
        id: uploadedFile.id!.toString(),
        fileName: uploadedFile.filename,
        project_id: uploadedFile.project_id,
        uploaded_by: uploadedFile.uploaded_by,
        uploaded_time: uploadedFile.uploaded_time
      });
    })
  );

  const result = await sequelize.query(
    `INSERT INTO subcontrols (
      control_id, title, description, order_no, status,
      approver, risk_review, owner, reviewer, due_date,
      implementation_details, evidence_description, 
      feedback_description, evidence_files, feedback_files
    ) VALUES (
      :control_id, :title, :description, :order_no, :status,
      :approver, :risk_review, :owner, :reviewer, :due_date,
      :implementation_details, :evidence_description,
      :feedback_description, :evidence_files, :feedback_files
    ) RETURNING *`,
    {
      replacements: {
        control_id: controlId,
        title: subcontrol.title,
        description: subcontrol.description,
        order_no: subcontrol.order_no,
        status: subcontrol.status,
        approver: subcontrol.approver,
        risk_review: subcontrol.risk_review,
        owner: subcontrol.owner,
        reviewer: subcontrol.reviewer,
        due_date: subcontrol.due_date,
        implementation_details: subcontrol.implementation_details,
        evidence_description: subcontrol.evidence_description,
        feedback_description: subcontrol.feedback_description,
        evidence_files: uploadedEvidenceFiles,
        feedback_files: uploadedFeedbackFiles,
      },
      mapToModel: true,
      model: SubcontrolModel,
      type: QueryTypes.INSERT
    }
  );
  return result[0];
};

export const updateSubcontrolByIdQuery = async (
  id: number,
  subcontrol: Partial<Subcontrol>,
  project_id: number,
  user_id: number,
  evidenceFiles?: UploadedFile[],
  feedbackFiles?: UploadedFile[]
): Promise<Subcontrol | null> => {
  let uploadedEvidenceFiles: { id: string; fileName: string }[] = [];
  await Promise.all(
    evidenceFiles!.map(async (file) => {
      const uploadedFile = await uploadFile(file, user_id, project_id);
      uploadedEvidenceFiles.push({
        id: uploadedFile.id!.toString(),
        fileName: uploadedFile.filename,
      });
    })
  );

  let uploadedFeedbackFiles: { id: string; fileName: string }[] = [];
  await Promise.all(
    feedbackFiles!.map(async (file) => {
      const uploadedFile = await uploadFile(file, user_id, project_id);
      uploadedFeedbackFiles.push({
        id: uploadedFile.id!.toString(),
        fileName: uploadedFile.filename,
      });
    })
  );

  const updateSubControl: Partial<Record<keyof Subcontrol, any>> = {};
  const setClause = [
    "title",
    "description",
    "status",
    "approver",
    "risk_review",
    "owner",
    "reviewer",
    "due_date",
    "implementation_details",
    "evidence_description",
    "feedback_description",
    "evidence_files",
    "feedback_files",
  ].filter(f => {
    if (subcontrol[f as keyof Subcontrol] !== undefined) {
      updateSubControl[f as keyof Subcontrol] = subcontrol[f as keyof Subcontrol]
      return true
    }
  }).map(f => `${f} = :${f}`).join(", ");

  const query = `UPDATE subcontrols SET ${setClause} WHERE id = :id`;

  updateSubControl.id = id;
  if (evidenceFiles) {
    updateSubControl.evidence_files = uploadedEvidenceFiles
  }
  if (feedbackFiles) {
    updateSubControl.feedback_files = uploadedFeedbackFiles
  }

  const result = await sequelize.query(query, {
    replacements: updateSubControl,
    mapToModel: true,
    model: SubcontrolModel,
    type: QueryTypes.UPDATE,
  });

  return result[0];
};

export const deleteSubcontrolByIdQuery = async (
  id: number
): Promise<Boolean> => {
  const result = await sequelize.query(
    "DELETE FROM subcontrols WHERE id = :id RETURNING *",
    {
      replacements: { id },
      mapToModel: true,
      model: SubcontrolModel,
      type: QueryTypes.DELETE,
    }
  );
  return result.length > 0;
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
      title, description, control_id, order_no, implementation_details,
      evidence_description, feedback_description, status
    ) VALUES (
      :title, :description, :control_id, :order_no, :implementation_details,
      :evidence_description, :feedback_description, :status
    ) RETURNING *`;
  let createdSubControls: Subcontrol[] = []
  for (let subControl of subControls) {
    const result = await sequelize.query(query,
      {
        replacements: {
          title: subControl.title,
          description: subControl.description,
          control_id: controlId,
          order_no: subControl.order_no,
          implementation_details: enable_ai_data_insertion ? subControl.implementation_details : null,
          evidence_description: enable_ai_data_insertion && subControl.evidence_description ? subControl.evidence_description : null,
          feedback_description: enable_ai_data_insertion && subControl.feedback_description ? subControl.feedback_description : null,
          status: enable_ai_data_insertion ? 'Waiting' : null
        },
        mapToModel: true,
        model: SubcontrolModel,
        type: QueryTypes.INSERT
      }
    )
    createdSubControls = createdSubControls.concat(result)
  }
  return createdSubControls
};
