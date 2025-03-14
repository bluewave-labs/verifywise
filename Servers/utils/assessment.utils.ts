import { Assessment, AssessmentModel } from "../models/assessment.model";
import { createNewTopicsQuery } from "./topic.utils";

export const getAllAssessmentsQuery = async (): Promise<Assessment[]> => {
  const assessments = await AssessmentModel.findAll();
  return assessments;
};

export const getAssessmentByIdQuery = async (
  id: number
): Promise<Assessment | null> => {
  const result = await AssessmentModel.findOne({
    where: { id: id }
  })
  return result
};

export const getAssessmentByProjectIdQuery = async (
  projectId: number
): Promise<Assessment[]> => {
  const result = await AssessmentModel.findAll({
    where: { project_id: projectId }
  })
  return result;
};

export const createNewAssessmentQuery = async (
  assessment: Assessment,
  enable_ai_data_insertion: boolean
): Promise<Object> => {
  const result = await AssessmentModel.create({
    project_id: assessment.project_id
  });
  const topics = await createNewTopicsQuery(result.id!, enable_ai_data_insertion);
  return { assessment: result, topics };
};

export const updateAssessmentByIdQuery = async (
  id: number,
  assessment: Partial<Assessment>
): Promise<Assessment | null> => {
  const result = await AssessmentModel.update({
    project_id: assessment.project_id
  }, {
    where: { id: id },
    returning: true
  });
  return result[1][0];
};

export const deleteAssessmentByIdQuery = async (
  id: number
): Promise<boolean> => {
  const result = await AssessmentModel.destroy(
    { where: { id: id } }
  )
  return result > 0;
};
