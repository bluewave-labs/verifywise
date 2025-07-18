import { SubtopicModel } from "../domain.layer/models/subtopic/subtopic.model";
import { sequelize } from "../database/db";
import { createNewQuestionsQuery } from "./question.utils";
import { QueryTypes, Transaction } from "sequelize";
import { ISubtopic } from "../domain.layer/interfaces/i.subtopic";

export const getAllSubtopicsQuery = async (
  tenant: string
): Promise<ISubtopic[]> => {
  const subtopics = await sequelize.query(
    `SELECT * FROM "${tenant}".subtopics ORDER BY created_at DESC, id ASC`,
    {
      mapToModel: true,
      model: SubtopicModel,
    }
  );
  return subtopics;
};

export const getSubtopicByIdQuery = async (
  id: number,
  tenant: string
): Promise<ISubtopic | null> => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".subtopics WHERE id = :id`,
    {
      replacements: { id },
      mapToModel: true,
      model: SubtopicModel,
    }
  );
  return result[0];
};

export const createNewSubtopicQuery = async (
  subtopic: SubtopicModel,
  tenant: string,
  transaction: Transaction
): Promise<SubtopicModel> => {
  const result = await sequelize.query(
    `INSERT INTO "${tenant}".subtopics (topic_id, title) VALUES (:topic_id, :title) RETURNING *`,
    {
      replacements: { topic_id: subtopic.topic_id, title: subtopic.title },
      mapToModel: true,
      model: SubtopicModel,
      // type: QueryTypes.INSERT
      transaction,
    }
  );
  return result[0];
};

export const updateSubtopicByIdQuery = async (
  id: number,
  subtopic: Partial<SubtopicModel>,
  tenant: string,
  transaction: Transaction
): Promise<SubtopicModel | null> => {
  const updateSubTopic: Partial<Record<keyof SubtopicModel, any>> = {};
  const setClause = ["title"]
    .filter((f) => {
      if (
        subtopic[f as keyof SubtopicModel] !== undefined &&
        subtopic[f as keyof SubtopicModel]
      ) {
        updateSubTopic[f as keyof SubtopicModel] =
          subtopic[f as keyof SubtopicModel];
        return true;
      }
    })
    .map((f) => `${f} = :${f}`)
    .join(", ");

  const query = `UPDATE "${tenant}".subtopics SET ${setClause} WHERE id = :id RETURNING *;`;

  updateSubTopic.id = id;

  const result = await sequelize.query(query, {
    replacements: updateSubTopic,
    mapToModel: true,
    model: SubtopicModel,
    // type: QueryTypes.UPDATE,
    transaction,
  });

  return result[0];
};

export const deleteSubtopicByIdQuery = async (
  id: number,
  tenant: string,
  transaction: Transaction
): Promise<Boolean> => {
  const result = await sequelize.query(
    `DELETE FROM "${tenant}".subtopics WHERE id = :id RETURNING *`,
    {
      replacements: { id },
      mapToModel: true,
      model: SubtopicModel,
      type: QueryTypes.DELETE,
      transaction,
    }
  );
  return result.length > 0;
};

export const getSubTopicByTopicIdQuery = async (
  topicId: number,
  tenant: string
): Promise<ISubtopic[]> => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".subtopics WHERE topic_id = :topic_id ORDER BY created_at DESC, id ASC`,
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
  enable_ai_data_insertion: boolean,
  tenant: string,
  transaction: Transaction
) => {
  const createdSubTopics = [];
  let query = `INSERT INTO "${tenant}".subtopics(topic_id, title, order_no) VALUES (:topic_id, :title, :order_no) RETURNING *;`;
  for (let subTopicStruct of subTopics) {
    const result = await sequelize.query(query, {
      replacements: {
        topic_id: topicId,
        title: subTopicStruct.title,
        order_no: subTopicStruct.order_no,
      },
      mapToModel: true,
      model: SubtopicModel,
      transaction,
    });
    const subtopic_id = result[0].id!;
    const questions = await createNewQuestionsQuery(
      subtopic_id,
      subTopicStruct.questions,
      enable_ai_data_insertion,
      tenant,
      transaction
    );
    createdSubTopics.push({ ...result[0].dataValues, questions });
  }
  return createdSubTopics;
};
