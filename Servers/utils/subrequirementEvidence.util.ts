import { SubrequirementEvidence } from "../models/SubrequirementEvidence";
import pool from "../database/db";

export const getAllSubrequirementEvidencesQuery = async (): Promise<
  SubrequirementEvidence[]
> => {
  console.log("getAllSubrequirementEvidences");
  const subrequirementEvidences = await pool.query(
    "SELECT * FROM subrequirementevidences"
  );
  return subrequirementEvidences.rows;
};

export const getSubrequirementEvidenceByIdQuery = async (
  id: number
): Promise<SubrequirementEvidence | null> => {
  console.log("getSubrequirementEvidenceById", id);
  const result = await pool.query(
    "SELECT * FROM subrequirementevidences WHERE id = $1",
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const createNewSubrequirementEvidenceQuery = async (
  subrequirementEvidence: Omit<SubrequirementEvidence, "id">
): Promise<SubrequirementEvidence> => {
  console.log("createNewSubrequirementEvidence", subrequirementEvidence);
  const result = await pool.query(
    `INSERT INTO subrequirementevidences (
      subrequirement_id, document_name, document_type, file_path, upload_date, 
      uploader_id, description, status, last_reviewed, reviewer_id, reviewer_comments
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [
      subrequirementEvidence.subrequirement_id,
      subrequirementEvidence.document_name,
      subrequirementEvidence.document_type,
      subrequirementEvidence.file_path,
      subrequirementEvidence.upload_date,
      subrequirementEvidence.uploader_id,
      subrequirementEvidence.description,
      subrequirementEvidence.status,
      subrequirementEvidence.last_reviewed,
      subrequirementEvidence.reviewer_id,
      subrequirementEvidence.reviewer_comments,
    ]
  );
  return result.rows[0];
};

export const updateSubrequirementEvidenceByIdQuery = async (
  id: number,
  subrequirementEvidence: Partial<SubrequirementEvidence>
): Promise<SubrequirementEvidence | null> => {
  console.log("updateSubrequirementEvidenceById", id, subrequirementEvidence);
  const fields = [];
  const values = [];
  let query = "UPDATE subrequirementevidences SET ";

  if (subrequirementEvidence.subrequirement_id) {
    fields.push("subrequirement_id = $1");
    values.push(subrequirementEvidence.subrequirement_id);
  }

  if (subrequirementEvidence.document_name) {
    fields.push("document_name = $2");
    values.push(subrequirementEvidence.document_name);
  }

  if (subrequirementEvidence.document_type) {
    fields.push("document_type = $3");
    values.push(subrequirementEvidence.document_type);
  }

  if (subrequirementEvidence.file_path) {
    fields.push("file_path = $4");
    values.push(subrequirementEvidence.file_path);
  }

  if (subrequirementEvidence.upload_date) {
    fields.push("upload_date = $5");
    values.push(subrequirementEvidence.upload_date);
  }

  if (subrequirementEvidence.uploader_id) {
    fields.push("uploader_id = $6");
    values.push(subrequirementEvidence.uploader_id);
  }

  if (subrequirementEvidence.description) {
    fields.push("description = $7");
    values.push(subrequirementEvidence.description);
  }

  if (subrequirementEvidence.status) {
    fields.push("status = $8");
    values.push(subrequirementEvidence.status);
  }

  if (subrequirementEvidence.last_reviewed) {
    fields.push("last_reviewed = $9");
    values.push(subrequirementEvidence.last_reviewed);
  }

  if (subrequirementEvidence.reviewer_id) {
    fields.push("reviewer_id = $10");
    values.push(subrequirementEvidence.reviewer_id);
  }

  if (subrequirementEvidence.reviewer_comments) {
    fields.push("reviewer_comments = $11");
    values.push(subrequirementEvidence.reviewer_comments);
  }

  query +=
    fields.join(", ") + " WHERE id = $" + (values.length + 1) + " RETURNING *";
  values.push(id);

  const result = await pool.query(query, values);
  return result.rows.length ? result.rows[0] : null;
};

export const deleteSubrequirementEvidenceByIdQuery = async (
  id: number
): Promise<SubrequirementEvidence | null> => {
  console.log("deleteSubrequirementEvidenceById", id);
  const result = await pool.query(
    "DELETE FROM subrequirementevidences WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};
