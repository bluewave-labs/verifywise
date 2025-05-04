import { Assessment, AssessmentModel } from "../models/assessment.model";
import { sequelize } from "../database/db";
import { createNewTopicsQuery } from "./topic.utils";
import { QueryTypes, Transaction } from "sequelize";

export const getAllAssessmentsQuery = async (): Promise<Assessment[]> => {
  const assessments = await sequelize.query(
    "SELECT * FROM assessments ORDER BY created_at DESC, id ASC",
    {
      mapToModel: true,
      model: AssessmentModel
    }
  );
  return assessments;
};

export const getAssessmentByIdQuery = async (
  id: number
): Promise<Assessment | null> => {
  const result = await sequelize.query(
    "SELECT * FROM assessments WHERE id = :id",
    {
      replacements: { id: id },
      mapToModel: true,
      model: AssessmentModel
    }
  );
  return result[0];
};

export const getAssessmentByProjectIdQuery = async (
  projectId: number
): Promise<Assessment[]> => {
  const result = await sequelize.query(
    "SELECT * FROM assessments WHERE project_id = :project_id ORDER BY created_at DESC, id ASC",
    {
      replacements: { project_id: projectId },
      mapToModel: true,
      model: AssessmentModel
    }
  );
  return result;
};

export const createNewAssessmentQuery = async (
  assessment: Assessment,
  enable_ai_data_insertion: boolean,
  transaction: Transaction
): Promise<Object> => {
  const result = await sequelize.query(
    `INSERT INTO assessments (project_id) VALUES (:project_id) RETURNING *`,
    {
      replacements: { project_id: assessment.project_id },
      mapToModel: true,
      model: AssessmentModel,
      transaction
    }
  );
  const topics = await createNewTopicsQuery(result[0].id!, enable_ai_data_insertion, transaction);
  return { assessment: result[0], topics };
};

export const updateAssessmentByIdQuery = async (
  id: number,
  assessment: Partial<Assessment>,
  transaction: Transaction
): Promise<Boolean> => {
  const result = await sequelize.query(
    `UPDATE assessments SET project_id = :project_id WHERE id = :id RETURNING *`,
    {
      replacements: {
        project_id: assessment.project_id, id: id
      },
      mapToModel: true,
      model: AssessmentModel,
      // type: QueryTypes.UPDATE
      transaction
    }
  );
  return result.length > 0;
};

export const deleteAssessmentByIdQuery = async (
  id: number,
  transaction: Transaction
): Promise<Boolean> => {
  const result = await sequelize.query(
    `DELETE FROM assessments WHERE id = :id RETURNING *`,
    {
      replacements: { id: id },
      mapToModel: true,
      model: AssessmentModel,
      transaction
    }
  );
  return result.length > 0;
};
