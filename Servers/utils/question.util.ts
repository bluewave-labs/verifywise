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
  name: string;
  description: string;
}): Promise<Question> => {
  console.log("createNewQuestion", question);
  const result = await pool.query(
    "INSERT INTO questions (name, description) VALUES ($1, $2) RETURNING *",
    [question.name, question.description]
  );
  return result.rows[0];
};

export const updateQuestionByIdQuery = async (
  id: number,
  question: { name?: string; description?: string }
): Promise<Question | null> => {
  console.log("updateQuestionById", id, question);
  const fields = [];
  const values = [];
  let query = "UPDATE questions SET ";

  if (question.name) {
    fields.push("name = $1");
    values.push(question.name);
  }
  if (question.description) {
    fields.push("description = $2");
    values.push(question.description);
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + " WHERE id = $3 RETURNING *";
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
