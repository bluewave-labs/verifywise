import { Question } from "../models/Question";
import pool from "../database/db";

export const getAllQuestionsQuery = async (): Promise<Question[]> => {
  console.log("getAllQuestions");
  const questions = await pool.query("SELECT * FROM questions");
  return questions.rows;
};

export const getQuestionByIdQuery = async (id: number): Promise<Question | null> => {
  console.log("getQuestionById", id);
  const result = await pool.query("SELECT * FROM questions WHERE id = $1", [id]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewQuestionQuery = async (question: {
  section_id: number
  question_text: string
  answer_type: string
  required: boolean
}): Promise<Question> => {
  console.log("createNewQuestion", question);
  const result = await pool.query(
    "INSERT INTO questions (section_id, question_text, answer_type, required) VALUES ($1, $2, $3, $4) RETURNING *",
    [question.section_id, question.question_text, question.answer_type, question.required]
  );
  return result.rows[0];
};

export const updateQuestionByIdQuery = async (
  id: number,
  question: {
    section_id?: number
    question_text?: string
    answer_type?: string
    required?: boolean
  }
): Promise<Question | null> => {
  console.log("updateQuestionById", id, question);
  const fields = [];
  const values = [];
  let query = "UPDATE questions SET ";

  if(question.section_id) {
    fields.push("section_id = $1");
    values.push(question.section_id)
  }
  if(question.question_text) {
    fields.push("question_text = $2");
    values.push(question.question_text)
  }
  if(question.answer_type) {
    fields.push("answer_type = $3");
    values.push(question.answer_type)
  }
  if(question.required) {
    fields.push("required = $4");
    values.push(question.required)
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + " WHERE id = $5 RETURNING *";
  values.push(id);

  const result = await pool.query(query, values);
  return result.rows.length ? result.rows[0] : null;
};

export const deleteQuestionByIdQuery = async (id: number): Promise<boolean> => {
  console.log("deleteQuestionById", id);
  const result = await pool.query(
    "DELETE FROM questions WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
};
