import { question_evidence } from "../questionEvidence/questionEvidence.data";

export const getAllMockQuestionEvidence = () => {
  return question_evidence;
};

export const getMockQuestionEvidenceById = (id: number) => {
  return question_evidence.find(
    (questionEvidence) => questionEvidence.id === id
  );
};

export const createMockQuestionEvidence = (questionEvidence: any) => {
  const isIdUnique = !question_evidence.some(
    (existingQuestionEvidence) =>
      existingQuestionEvidence.id === questionEvidence.id
  );

  if (isIdUnique) {
    question_evidence.push(questionEvidence);
    return questionEvidence;
  } else {
    throw new Error("Question evidence with this id already exists.");
  }
};

export const updateMockQuestionEvidenceById = (
  id: number,
  updatedQuestionEvidence: any
) => {
  const index = question_evidence.findIndex(
    (questionEvidence) => questionEvidence.id === id
  );

  if (index !== -1) {
    question_evidence[index] = {
      ...question_evidence[index],
      ...updatedQuestionEvidence,
    };
    return question_evidence[index];
  } else {
    throw new Error("Question evidence with this id does not exist.");
  }
};

export const deleteMockQuestionEvidenceById = (id: number) => {
  const index = question_evidence.findIndex(
    (questionEvidence) => questionEvidence.id === id
  );

  if (index !== -1) {
    const deletedQuestionEvidence = question_evidence.splice(index, 1)[0];
    return deletedQuestionEvidence;
  } else {
    throw new Error("Question evidence with this id does not exist.");
  }
};
