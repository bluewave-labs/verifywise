import { Topic } from "../models/topic.model";
import pool from "../database/db";
import { createNewSubTopicsQuery } from "./subtopic.utils";
import { Topics } from "../structures/assessment-tracker/topics.struct";

export const getAllTopicsQuery = async (): Promise<Topic[]> => {
  const topics = await pool.query("SELECT * FROM topics");
  return topics.rows;
};

export const getTopicByIdQuery = async (id: number): Promise<Topic | null> => {
  const result = await pool.query("SELECT * FROM topics WHERE id = $1", [id]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewTopicQuery = async (topic: Topic): Promise<Topic> => {
  const result = await pool.query(
    `INSERT INTO topics (assessment_id, title) VALUES ($1, $2) RETURNING *`,
    [topic.assessment_id, topic.title]
  );
  return result.rows[0];
};

export const updateTopicByIdQuery = async (
  id: number,
  topic: Partial<Topic>
): Promise<Topic | null> => {
  const fields = [];
  const values = [];
  let query = "UPDATE topics SET ";

  if (topic.assessment_id !== undefined) {
    fields.push(`assessment_id = $${fields.length + 1}`);
    values.push(topic.assessment_id);
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
  const result = await pool.query(
    `DELETE FROM topics WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const getTopicByAssessmentIdQuery = async (
  assessmentId: number
): Promise<Topic[]> => {
  const result = await pool.query(
    `SELECT * FROM topics WHERE assessment_id = $1`,
    [assessmentId]
  );
  return result.rows;
};

export const createNewTopicsQuery = async (assessmentId: number) => {
  const createdTopics = [];
  let query =
    "INSERT INTO topics(assessment_id, title, order_no) VALUES ($1, $2, $3) RETURNING *;";
  for (let topicStruct of Topics) {
    const result = await pool.query(query, [
      assessmentId,
      topicStruct.title,
      topicStruct.order_no,
    ]);
    const topic_id = result.rows[0].id;
    const subTopics = await createNewSubTopicsQuery(
      topic_id,
      topicStruct.subtopics
    );
    createdTopics.push({ ...result.rows[0], subTopics });
  }
  return createdTopics;
};
