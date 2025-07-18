import { SubcontrolModel } from "../domain.layer/models/subcontrol/subcontrol.model";
import { sequelize } from "../database/db";
import { UploadedFile } from "./question.utils";
import { uploadFile } from "./fileUpload.utils";
import { QueryTypes, Transaction } from "sequelize";
import { FileType } from "../domain.layer/models/file/file.model";
import { ISubcontrol } from "../domain.layer/interfaces/i.subcontrol";

export const getAllSubcontrolsQuery = async (
  tenant: string
): Promise<ISubcontrol[]> => {
  const subcontrols = await sequelize.query(
    `SELECT * FROM "${tenant}".subcontrols ORDER BY created_at DESC, id ASC`,
    {
      mapToModel: true,
      model: SubcontrolModel,
    }
  );
  return subcontrols;
};

export const getAllSubcontrolsByControlIdQuery = async (
  controlId: number,
  tenant: string
): Promise<ISubcontrol[]> => {
  const subcontrols = await sequelize.query(
    `SELECT * FROM "${tenant}".subcontrols WHERE control_id = :id ORDER BY created_at DESC, id ASC`,
    {
      replacements: { id: controlId },
      mapToModel: true,
      model: SubcontrolModel,
    }
  );
  return subcontrols;
};

export const getSubcontrolByIdQuery = async (
  id: number,
  tenant: string
): Promise<ISubcontrol | null> => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".subcontrols WHERE id = :id`,
    {
      replacements: { id },
      mapToModel: true,
      model: SubcontrolModel,
    }
  );
  return result[0];
};

export const createNewSubcontrolQuery = async (
  controlId: number,
  subcontrol: Partial<SubcontrolModel>,
  project_id: number,
  user_id: number,
  tenant: string,
  transaction: Transaction,
  evidenceFiles?: UploadedFile[],
  feedbackFiles?: UploadedFile[]
): Promise<SubcontrolModel> => {
  let uploadedEvidenceFiles: FileType[] = [];
  await Promise.all(
    evidenceFiles!.map(async (file) => {
      const uploadedFile = await uploadFile(
        file,
        user_id,
        project_id,
        "Compliance tracker group",
        tenant,
        transaction
      );
      uploadedEvidenceFiles.push({
        id: uploadedFile.id!.toString(),
        fileName: uploadedFile.filename,
        project_id: uploadedFile.project_id,
        uploaded_by: uploadedFile.uploaded_by,
        uploaded_time: uploadedFile.uploaded_time,
        type: uploadedFile.type,
        source: uploadedFile.source,
      });
    })
  );

  let uploadedFeedbackFiles: FileType[] = [];
  await Promise.all(
    feedbackFiles!.map(async (file) => {
      const uploadedFile = await uploadFile(
        file,
        user_id,
        project_id,
        "Compliance tracker group",
        tenant,
        transaction
      );
      uploadedFeedbackFiles.push({
        id: uploadedFile.id!.toString(),
        fileName: uploadedFile.filename,
        project_id: uploadedFile.project_id,
        uploaded_by: uploadedFile.uploaded_by,
        uploaded_time: uploadedFile.uploaded_time,
        type: uploadedFile.type,
        source: uploadedFile.source,
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
        order_no: subcontrol.order_no || null,
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
      // type: QueryTypes.INSERT
      transaction,
    }
  );
  return result[0];
};

export const updateSubcontrolByIdQuery = async (
  id: number,
  subcontrol: Partial<SubcontrolModel>,
  tenant: string,
  transaction: Transaction,
  evidenceUploadedFiles: {
    id: string;
    fileName: string;
    project_id: number;
    uploaded_by: number;
    uploaded_time: Date;
  }[] = [],
  feedbackUploadedFiles: {
    id: string;
    fileName: string;
    project_id: number;
    uploaded_by: number;
    uploaded_time: Date;
  }[] = [],
  deletedFiles: number[] = []
): Promise<SubcontrolModel | null> => {
  const files = await sequelize.query(
    `SELECT evidence_files, feedback_files FROM "${tenant}".subcontrols WHERE id = :id`,
    {
      replacements: { id },
      mapToModel: true,
      model: SubcontrolModel,
      transaction,
    }
  );

  let currentEvidenceFiles = (
    files[0].evidence_files ? files[0].evidence_files : []
  ) as {
    id: string;
    fileName: string;
    project_id: number;
    uploaded_by: number;
    uploaded_time: Date;
  }[];
  let currentFeedbackFiles = (
    files[0].feedback_files ? files[0].feedback_files : []
  ) as {
    id: string;
    fileName: string;
    project_id: number;
    uploaded_by: number;
    uploaded_time: Date;
  }[];

  currentEvidenceFiles = currentEvidenceFiles.filter(
    (f) => !deletedFiles.includes(parseInt(f.id))
  );
  currentEvidenceFiles = currentEvidenceFiles.concat(evidenceUploadedFiles);
  console.log(currentEvidenceFiles, evidenceUploadedFiles);

  currentFeedbackFiles = currentFeedbackFiles.filter(
    (f) => !deletedFiles.includes(parseInt(f.id))
  );
  currentFeedbackFiles = currentFeedbackFiles.concat(feedbackUploadedFiles);

  const updateSubControl: Partial<Record<keyof SubcontrolModel, any>> = {};
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
  ]
    .filter((f) => {
      if (f == "evidence_files" && currentEvidenceFiles.length > 0) {
        updateSubControl["evidence_files"] =
          JSON.stringify(currentEvidenceFiles);
        return true;
      }
      if (f == "feedback_files" && currentFeedbackFiles.length > 0) {
        updateSubControl["feedback_files"] =
          JSON.stringify(currentFeedbackFiles);
        return true;
      }
      if (
        subcontrol[f as keyof SubcontrolModel] !== undefined &&
        subcontrol[f as keyof SubcontrolModel]
      ) {
        updateSubControl[f as keyof SubcontrolModel] =
          subcontrol[f as keyof SubcontrolModel];
        return true;
      }
    })
    .map((f) => {
      return `${f} = :${f}`;
    })
    .join(", ");

  const query = `UPDATE "${tenant}".subcontrols SET ${setClause} WHERE id = :id RETURNING *;`;

  updateSubControl.id = id;

  const result = await sequelize.query(query, {
    replacements: updateSubControl,
    mapToModel: true,
    model: SubcontrolModel,
    // type: QueryTypes.UPDATE,
    transaction,
  });

  return result[0];
};

export const deleteSubcontrolByIdQuery = async (
  id: number,
  tenant: string,
  transaction: Transaction
): Promise<Boolean> => {
  const result = await sequelize.query(
    `DELETE FROM "${tenant}".subcontrols WHERE id = :id RETURNING *`,
    {
      replacements: { id },
      mapToModel: true,
      model: SubcontrolModel,
      type: QueryTypes.DELETE,
      transaction,
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
  enable_ai_data_insertion: boolean,
  tenant: string,
  transaction: Transaction
) => {
  let query = `INSERT INTO "${tenant}".subcontrols(
      title, description, control_id, order_no, implementation_details,
      evidence_description, feedback_description, status
    ) VALUES (
      :title, :description, :control_id, :order_no, :implementation_details,
      :evidence_description, :feedback_description, :status
    ) RETURNING *`;
  let createdSubControls: SubcontrolModel[] = [];
  for (let subControl of subControls) {
    const result = await sequelize.query(query, {
      replacements: {
        title: subControl.title,
        description: subControl.description,
        control_id: controlId,
        order_no: subControl.order_no,
        implementation_details: enable_ai_data_insertion
          ? subControl.implementation_details
          : null,
        evidence_description:
          enable_ai_data_insertion && subControl.evidence_description
            ? subControl.evidence_description
            : null,
        feedback_description:
          enable_ai_data_insertion && subControl.feedback_description
            ? subControl.feedback_description
            : null,
        status: enable_ai_data_insertion ? "Waiting" : null,
      },
      mapToModel: true,
      model: SubcontrolModel,
      // type: QueryTypes.INSERT
      transaction,
    });
    createdSubControls = createdSubControls.concat(result);
  }
  return createdSubControls;
};
