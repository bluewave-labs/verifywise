import { Subtopic } from "../models/subtopic.model";
import pool from "../database/db";
import { createNewQuestionsQuery } from "./question.utils";
import { Question } from "../models/question.model";

export const getAllSubtopicsQuery = async (): Promise<Subtopic[]> => {
  const subtopics = await pool.query("SELECT * FROM subtopics");
  return subtopics.rows;
};

export const getSubtopicByIdQuery = async (
  id: number
): Promise<Subtopic | null> => {
  const result = await pool.query("SELECT * FROM subtopics WHERE id = $1", [
    id,
  ]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewSubtopicQuery = async (
  subtopic: Subtopic
): Promise<Subtopic> => {
  const result = await pool.query(
    `INSERT INTO subtopics (topic_id, title) VALUES ($1, $2) RETURNING *`,
    [subtopic.topic_id, subtopic.title]
  );
  return result.rows[0];
};

export const updateSubtopicByIdQuery = async (
  id: number,
  subtopic: Partial<Subtopic>
): Promise<Subtopic | null> => {
  const result = await pool.query(
    `UPDATE subtopics SET topic_id = $1, title = $2 WHERE id = $3 RETURNING *`,
    [subtopic.topic_id, subtopic.title, id]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const deleteSubtopicByIdQuery = async (
  id: number
): Promise<Subtopic | null> => {
  const result = await pool.query(
    "DELETE FROM subtopics WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const getSubTopicByTopicIdQuery = async (
  topicId: number
): Promise<Subtopic[]> => {
  const result = await pool.query(
    `SELECT * FROM subtopics WHERE topic_id = $1`,
    [topicId]
  );
  return result.rows;
};

export const createNewSubTopicsQuery = async (
  topicId: number,
  subTopics: {
    order_no: number;
    title: string;
    questions: {
      order_no: number;
      question: string;
      hint: string;
      priority_level: string;
      answer_type: string;
      input_type: string;
      evidence_required: boolean;
      isrequired: boolean;
      evidence_files: never[];
      dropdown_options: never[];
    }[];
  }[]
) => {
  const createdSubTopics = [];
  let query =
    "INSERT INTO subtopics(topic_id, title, order_no) VALUES ($1, $2, $3) RETURNING *;";
  for (let subTopicStruct of subTopics) {
    const result = await pool.query(query, [
      topicId,
      subTopicStruct.title,
      subTopicStruct.order_no,
    ]);
    const subtopic_id = result.rows[0].id;
    const questions = await createNewQuestionsQuery(
      subtopic_id,
      subTopicStruct.questions
    );
    createdSubTopics.push({ ...result.rows[0], questions });
  }
  return createdSubTopics;
};
