import { Topic } from "../models/topic.model";
import pool from "../database/db";

export const getAllTopicsQuery = async (): Promise<Topic[]> => {
  console.log("getAllTopics");
  const topics = await pool.query("SELECT * FROM topics");
  return topics.rows;
};

export const getTopicByIdQuery = async (id: number): Promise<Topic | null> => {
  console.log("getTopicById", id);
  const result = await pool.query("SELECT * FROM topics WHERE id = $1", [id]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewTopicQuery = async (topic: {
  assessmentId: number;
  title: string;
}): Promise<Topic> => {
  console.log("createNewTopic", topic);
  const result = await pool.query(
    `INSERT INTO topics (assessment_id, title) VALUES ($1, $2) RETURNING *`,
    [topic.assessmentId, topic.title]
  );
  return result.rows[0];
};

export const updateTopicByIdQuery = async (
  id: number,
  topic: Partial<{
    assessmentId: number;
    title: string;
  }>
): Promise<Topic | null> => {
  console.log("updateTopicById", id, topic);
  const fields = [];
  const values = [];
  let query = "UPDATE topics SET ";

  if (topic.assessmentId !== undefined) {
    fields.push(`assessment_id = $${fields.length + 1}`);
    values.push(topic.assessmentId);
  }
  if (topic.title !== undefined) {
    fields.push(`title = $${fields.length + 1}`);
    values.push(topic.title);
  }

  query += fields.join(", ") + ` WHERE id = $${values.length + 1} RETURNING *`;

  const result = await pool.query(query, [...values, id]);
  return result.rows.length ? result.rows[0] : null;
};

export const deleteTopicByIdQuery = async (
  id: number
): Promise<Topic | null> => {
  console.log("deleteTopicById", id);
  const result = await pool.query(
    `DELETE FROM topics WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const getTopicByAssessmentIdQuery = async (
  assessmentId: number
): Promise<Topic[]> => {
  console.log("getTopicByAssessmentId", assessmentId);
  const result = await pool.query(
    `SELECT * FROM topics WHERE assessment_id = $1`,
    [assessmentId]
  );
  return result.rows;
}
