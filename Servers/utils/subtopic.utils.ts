import { Subtopic } from "../models/subtopic.model";
import pool from "../database/db";

export const getAllSubtopicsQuery = async (): Promise<Subtopic[]> => {
  console.log("getAllSubtopics");
  const subtopics = await pool.query("SELECT * FROM subtopics");
  return subtopics.rows;
};

export const getSubtopicByIdQuery = async (
  id: number
): Promise<Subtopic | null> => {
  console.log("getSubtopicById", id);
  const result = await pool.query("SELECT * FROM subtopics WHERE id = $1", [
    id,
  ]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewSubtopicQuery = async (subtopic: {
  topicId: number;
  name: string;
}): Promise<Subtopic> => {
  console.log("createNewSubtopic", subtopic);
  const result = await pool.query(
    `INSERT INTO subtopics (topic_id, name) VALUES ($1, $2) RETURNING *`,
    [subtopic.topicId, subtopic.name]
  );
  return result.rows[0];
};

export const updateSubtopicByIdQuery = async (
  id: number,
  subtopic: Partial<Subtopic>
): Promise<Subtopic | null> => {
  console.log("updateSubtopicById", id, subtopic);
  const result = await pool.query(
    `UPDATE subtopics SET topic_id = $1, name = $2 WHERE id = $3 RETURNING *`,
    [subtopic.topicId, subtopic.name, id]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const deleteSubtopicByIdQuery = async (
  id: number
): Promise<Subtopic | null> => {
  console.log("deleteSubtopicById", id);
  const result = await pool.query(
    "DELETE FROM subtopics WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};
