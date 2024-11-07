import { QuestionEvidence } from "../models/QuestionEvidence";
import pool from "../database/db";

export const getAllQuestionEvidencesQuery = async (): Promise<
  QuestionEvidence[]
> => {
  console.log("getAllQuestionEvidences");
  const questionEvidences = await pool.query(
    "SELECT * FROM questionevidences"
  );
  return questionEvidences.rows;
};

export const getQuestionEvidenceByIdQuery = async (
  id: number
): Promise<QuestionEvidence | null> => {
  console.log("getQuestionEvidenceById", id);
  const result = await pool.query(
    "SELECT * FROM questionevidences WHERE id = $1",
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const createNewQuestionEvidenceQuery = async (questionEvidence: {
  question_id: number;
  section_id: number;
  assessment_review: string;
  evidence: string;
}): Promise<QuestionEvidence> => {
  console.log("createNewQuestionEvidence", questionEvidence);
  const result = await pool.query(
    "INSERT INTO questionevidences (question_id, section_id, assessment_review, evidence) VALUES ($1, $2, $3, $4) RETURNING *",
    [
      questionEvidence.question_id,
      questionEvidence.section_id,
      questionEvidence.assessment_review,
      questionEvidence.evidence,
    ]
  );
  return result.rows[0];
};

export const updateQuestionEvidenceByIdQuery = async (
  id: number,
  questionEvidence: {
    question_id?: number;
    section_id?: number;
    assessment_review?: string;
    evidence?: string;
  }
): Promise<QuestionEvidence | null> => {
  console.log("updateQuestionEvidenceById", id, questionEvidence);
  const fields = [];
  const values = [];
  let query = "UPDATE questionevidences SET ";

  if (questionEvidence.question_id) {
    fields.push("question_id = $1");
    values.push(questionEvidence.question_id);
  }
  if (questionEvidence.section_id) {
    fields.push("section_id = $2");
    values.push(questionEvidence.section_id);
  }
  if (questionEvidence.assessment_review) {
    fields.push("assessment_review = $3");
    values.push(questionEvidence.assessment_review);
  }
  if (questionEvidence.evidence) {
    fields.push("evidence = $4");
    values.push(questionEvidence.evidence);
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + " WHERE id = $5 RETURNING *";
  values.push(id);

  const result = await pool.query(query, values);
  return result.rows.length ? result.rows[0] : null;
};

export const deleteQuestionEvidenceByIdQuery = async (
  id: number
): Promise<boolean> => {
  console.log("deleteQuestionEvidenceById", id);
  const result = await pool.query(
    "DELETE FROM questionevidences WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
};
