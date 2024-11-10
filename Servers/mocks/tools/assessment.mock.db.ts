import { Assessments } from "../assessment.mock.data";
import { Assessment } from "../../models/assessment.model";

export const getAllMockAssessments = (): Array<any> => {
  return Assessments;
};

export const getMockAssessmentById = (id: number): object | undefined => {
  return Assessments.find((assessment: Assessment) => assessment.id === id);
};

export const createMockAssessment = (newAssessment: any): object => {
  Assessments.push(newAssessment);
  return newAssessment;
};

export const updateMockAssessmentById = (
  id: number,
  updatedAssessment: any
): object | null => {
  const index = Assessments.findIndex(
    (assessment: Assessment) => assessment.id === id
  );
  if (index !== -1) {
    Assessments[index] = { ...Assessments[index], ...updatedAssessment };
    return Assessments[index];
  }
  return null;
};

export const deleteMockAssessmentById = (id: number): object | null => {
  const index = Assessments.findIndex(
    (assessment: Assessment) => assessment.id === id
  );
  if (index !== -1) {
    const deletedAssessment = Assessments.splice(index, 1)[0];
    return deletedAssessment;
  }
  return null;
};
