import { Topic, TopicModel } from "../models/topic.model";
import { sequelize } from "../database/db";
import { createNewSubTopicsQuery } from "./subtopic.utils";
import { Topics } from "../structures/assessment-tracker/topics.struct";
import { QueryTypes } from "sequelize";

export const getAllTopicsQuery = async (): Promise<Topic[]> => {
  const topics = await sequelize.query(
    "SELECT * FROM topics ORDER BY created_at DESC, id ASC",
    {
      mapToModel: true,
      model: TopicModel
    }
  );
  return topics;
};

export const getTopicByIdQuery = async (id: number): Promise<Topic | null> => {
  const result = await sequelize.query(
    "SELECT * FROM topics WHERE id = :id",
    {
      replacements: { id },
      mapToModel: true,
      model: TopicModel
    }
  );
  return result[0];
};

export const createNewTopicQuery = async (topic: Topic): Promise<Topic> => {
  const result = await sequelize.query(
    `INSERT INTO topics (assessment_id, title) VALUES (:assessment_id, :title) RETURNING *`,
    {
      replacements: {
        assessment_id: topic.assessment_id, title: topic.title
      },
      mapToModel: true,
      model: TopicModel,
      // type: QueryTypes.INSERT
    }
  );
  return result[0];
};

export const updateTopicByIdQuery = async (
  id: number,
  topic: Partial<Topic>
): Promise<Topic | null> => {
  const updateTopic: Partial<Record<keyof Topic, any>> = {};
  const setClause = [
    "title",
  ].filter(f => {
    if (topic[f as keyof Topic] !== undefined) {
      updateTopic[f as keyof Topic] = topic[f as keyof Topic]
      return true
    }
  }).map(f => `${f} = :${f}`).join(", ");

  const query = `UPDATE topics SET ${setClause} WHERE id = :id RETURNING *;`;

  updateTopic.id = id;

  const result = await sequelize.query(query, {
    replacements: updateTopic,
    mapToModel: true,
    model: TopicModel,
    // type: QueryTypes.UPDATE,
  });

  return result[0];
};

export const deleteTopicByIdQuery = async (
  id: number
): Promise<Boolean> => {
  const result = await sequelize.query(
    `DELETE FROM topics WHERE id = :id RETURNING *`,
    {
      replacements: { id },
      mapToModel: true,
      model: TopicModel,
      type: QueryTypes.DELETE,
    }
  );
  return result.length > 0;
};

export const getTopicByAssessmentIdQuery = async (
  assessmentId: number
): Promise<Topic[]> => {
  const result = await sequelize.query(
    `SELECT * FROM topics WHERE assessment_id = :assessment_id ORDER BY created_at DESC, id ASC`,
    {
      replacements: { assessment_id: assessmentId },
      mapToModel: true,
      model: TopicModel,
    }
  );
  return result;
};

export const createNewTopicsQuery = async (assessmentId: number, enable_ai_data_insertion: boolean) => {
  const createdTopics = [];
  let query =
    "INSERT INTO topics(assessment_id, title, order_no) VALUES (:assessment_id, :title, :order_no) RETURNING *;";
  for (let topicStruct of Topics) {
    const result = await sequelize.query(query,
      {
        replacements: {
          assessment_id: assessmentId,
          title: topicStruct.title,
          order_no: topicStruct.order_no || null,
        },
        mapToModel: true,
        model: TopicModel,
        // type: QueryTypes.INSERT,
      }
    );
    const topic_id = result[0].id!;
    const subTopics = await createNewSubTopicsQuery(
      topic_id,
      topicStruct.subtopics,
      enable_ai_data_insertion
    );
    createdTopics.push({ ...result[0].dataValues, subTopics });
  }
  return createdTopics;
};
