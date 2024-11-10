import { Question } from "../models/question.model";
import pool from "../database/db";

export const getAllQuestionsQuery = async (): Promise<Question[]> => {
  console.log("getAllQuestions");
  const questions = await pool.query("SELECT * FROM questions");
  return questions.rows;
};

export const getQuestionByIdQuery = async (
  id: number
): Promise<Question | null> => {
  console.log("getQuestionById", id);
  const result = await pool.query("SELECT * FROM questions WHERE id = $1", [
    id,
  ]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewQuestionQuery = async (question: {
  subtopicId: number;
  questionText: string;
  answerType: string;
  dropdownOptions: string;
  hasFileUpload: boolean;
  hasHint: boolean;
  isRequired: boolean;
  priorityOptions: string;
}): Promise<Question> => {
  console.log("createNewQuestion", question);
  const result = await pool.query(
    `INSERT INTO questions (
      subtopicId, questionText, answerType, dropdownOptions, hasFileUpload, 
      hasHint, isRequired, priorityOptions
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      question.subtopicId,
      question.questionText,
      question.answerType,
      question.dropdownOptions,
      question.hasFileUpload,
      question.hasHint,
      question.isRequired,
      question.priorityOptions,
    ]
  );
  return result.rows[0];
};

export const updateQuestionByIdQuery = async (
  id: number,
  question: Partial<Question>
): Promise<Question | null> => {
  console.log("updateQuestionById", id, question);
  const result = await pool.query(
    `UPDATE questions SET 
      subtopicId = $1, questionText = $2, answerType = $3, dropdownOptions = $4, 
      hasFileUpload = $5, hasHint = $6, isRequired = $7, priorityOptions = $8
      WHERE id = $9 RETURNING *`,
    [
      question.subtopicId,
      question.questionText,
      question.answerType,
      question.dropdownOptions,
      question.hasFileUpload,
      question.hasHint,
      question.isRequired,
      question.priorityOptions,
      id,
    ]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const deleteQuestionByIdQuery = async (
  id: number
): Promise<Question | null> => {
  console.log("deleteQuestionById", id);
  const result = await pool.query(
    "DELETE FROM questions WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};
