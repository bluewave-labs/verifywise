import { Subtopic, SubtopicModel } from "../models/subtopic.model";
import { sequelize } from "../database/db";
import { createNewQuestionsQuery } from "./question.utils";
import { Question } from "../models/question.model";
import { QueryTypes } from "sequelize";

export const getAllSubtopicsQuery = async (): Promise<Subtopic[]> => {
  const subtopics = await sequelize.query(
    "SELECT * FROM subtopics ORDER BY created_at DESC, id ASC",
    {
      mapToModel: true,
      model: SubtopicModel
    }
  );
  return subtopics;
};

export const getSubtopicByIdQuery = async (
  id: number
): Promise<Subtopic | null> => {
  const result = await sequelize.query(
    "SELECT * FROM subtopics WHERE id = :id",
    {
      replacements: { id },
      mapToModel: true,
      model: SubtopicModel
    }
  );
  return result[0];
};

export const createNewSubtopicQuery = async (
  subtopic: Subtopic
): Promise<Subtopic> => {
  const result = await sequelize.query(
    `INSERT INTO subtopics (topic_id, title) VALUES (:topic_id, :title) RETURNING *`,
    {
      replacements: { topic_id: subtopic.topic_id, title: subtopic.title },
      mapToModel: true,
      model: SubtopicModel,
      // type: QueryTypes.INSERT
    }
  );
  return result[0];
};

export const updateSubtopicByIdQuery = async (
  id: number,
  subtopic: Partial<Subtopic>
): Promise<Subtopic | null> => {
  const updateSubTopic: Partial<Record<keyof Subtopic, any>> = {};
  const setClause = [
    "title",
  ].filter(f => {
    if (subtopic[f as keyof Subtopic] !== undefined) {
      updateSubTopic[f as keyof Subtopic] = subtopic[f as keyof Subtopic]
      return true
    }
  }).map(f => `${f} = :${f}`).join(", ");

  const query = `UPDATE subtopics SET ${setClause} WHERE id = :id RETURNING *;`;

  updateSubTopic.id = id;

  const result = await sequelize.query(query, {
    replacements: updateSubTopic,
    mapToModel: true,
    model: SubtopicModel,
    // type: QueryTypes.UPDATE,
  });

  return result[0];
};

export const deleteSubtopicByIdQuery = async (
  id: number
): Promise<Boolean> => {
  const result = await sequelize.query(
    "DELETE FROM subtopics WHERE id = :id RETURNING *",
    {
      replacements: { id },
      mapToModel: true,
      model: SubtopicModel,
      type: QueryTypes.DELETE,
    }
  );
  return result.length > 0;
};

export const getSubTopicByTopicIdQuery = async (
  topicId: number
): Promise<Subtopic[]> => {
  const result = await sequelize.query(
    `SELECT * FROM subtopics WHERE topic_id = :topic_id ORDER BY created_at DESC, id ASC`,
    {
      replacements: { topic_id: topicId },
      mapToModel: true,
      model: SubtopicModel,
    }
  );
  return result;
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
      answer: string;
    }[];
  }[],
  enable_ai_data_insertion: boolean
) => {
  const createdSubTopics = [];
  let query =
    "INSERT INTO subtopics(topic_id, title, order_no) VALUES (:topic_id, :title, :order_no) RETURNING *;";
  for (let subTopicStruct of subTopics) {
    const result = await sequelize.query(query,
      {
        replacements: {
          topic_id: topicId,
          title: subTopicStruct.title,
          order_no: subTopicStruct.order_no,
        },
        mapToModel: true,
        model: SubtopicModel,
      }
    );
    const subtopic_id = result[0].id!;
    const questions = await createNewQuestionsQuery(
      subtopic_id,
      subTopicStruct.questions,
      enable_ai_data_insertion
    );
    createdSubTopics.push({ ...result[0].dataValues, questions });
  }
  return createdSubTopics;
};
