import { Topic, TopicModel } from "../domain.layer/models/topic/topic.model";
import { sequelize } from "../database/db";
import { createNewSubTopicsQuery } from "./subtopic.utils";
import { Topics } from "../structures/EU-AI-Act/assessment-tracker/topics.struct";
import { QueryTypes, Transaction } from "sequelize";

export const getAllTopicsQuery = async (
  tenant: string
): Promise<Topic[]> => {
  const topics = await sequelize.query(
    `SELECT * FROM "${tenant}".topics ORDER BY created_at DESC, id ASC`,
    {
      mapToModel: true,
      model: TopicModel,
    }
  );
  return topics;
};

export const getTopicByIdQuery = async (id: number, tenant: string): Promise<Topic | null> => {
  const result = await sequelize.query(`SELECT * FROM "${tenant}".topics WHERE id = :id`, {
    replacements: { id },
    mapToModel: true,
    model: TopicModel,
  });
  return result[0];
};

export const createNewTopicQuery = async (
  topic: Topic,
  tenant: string,
  transaction: Transaction
): Promise<Topic> => {
  const result = await sequelize.query(
    `INSERT INTO "${tenant}".topics (assessment_id, title) VALUES (:assessment_id, :title) RETURNING *`,
    {
      replacements: {
        assessment_id: topic.assessment_id,
        title: topic.title,
      },
      mapToModel: true,
      model: TopicModel,
      // type: QueryTypes.INSERT
      transaction,
    }
  );
  return result[0];
};

export const updateTopicByIdQuery = async (
  id: number,
  topic: Partial<Topic>,
  tenant: string,
  transaction: Transaction
): Promise<Topic | null> => {
  const updateTopic: Partial<Record<keyof Topic, any>> = {};
  const setClause = ["title"]
    .filter((f) => {
      if (topic[f as keyof Topic] !== undefined && topic[f as keyof Topic]) {
        updateTopic[f as keyof Topic] = topic[f as keyof Topic];
        return true;
      }
    })
    .map((f) => `${f} = :${f}`)
    .join(", ");

  const query = `UPDATE "${tenant}".topics SET ${setClause} WHERE id = :id RETURNING *;`;

  updateTopic.id = id;

  const result = await sequelize.query(query, {
    replacements: updateTopic,
    mapToModel: true,
    model: TopicModel,
    // type: QueryTypes.UPDATE,
    transaction,
  });

  return result[0];
};

export const deleteTopicByIdQuery = async (
  id: number,
  tenant: string,
  transaction: Transaction
): Promise<Boolean> => {
  const result = await sequelize.query(
    `DELETE FROM "${tenant}".topics WHERE id = :id RETURNING *`,
    {
      replacements: { id },
      mapToModel: true,
      model: TopicModel,
      type: QueryTypes.DELETE,
      transaction,
    }
  );
  return result.length > 0;
};

export const getTopicByAssessmentIdQuery = async (
  assessmentId: number,
  tenant: string
): Promise<Topic[]> => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".topics WHERE assessment_id = :assessment_id ORDER BY created_at DESC, id ASC`,
    {
      replacements: { assessment_id: assessmentId },
      mapToModel: true,
      model: TopicModel,
    }
  );
  return result;
};

export const createNewTopicsQuery = async (
  assessmentId: number,
  enable_ai_data_insertion: boolean,
  tenant: string,
  transaction: Transaction
) => {
  const createdTopics = [];
  let query =
    `INSERT INTO "${tenant}".topics(assessment_id, title, order_no) VALUES (:assessment_id, :title, :order_no) RETURNING *;`;
  for (let topicStruct of Topics) {
    const result = await sequelize.query(query, {
      replacements: {
        assessment_id: assessmentId,
        title: topicStruct.title,
        order_no: topicStruct.order_no || null,
      },
      mapToModel: true,
      model: TopicModel,
      // type: QueryTypes.INSERT,
      transaction,
    });
    const topic_id = result[0].id!;
    const subTopics = await createNewSubTopicsQuery(
      topic_id,
      topicStruct.subtopics,
      enable_ai_data_insertion,
      tenant,
      transaction
    );
    createdTopics.push({ ...result[0].dataValues, subTopics });
  }
  return createdTopics;
};
