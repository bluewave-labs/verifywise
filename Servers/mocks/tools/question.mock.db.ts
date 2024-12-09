import { questions } from "../question.mock.data";

export const getAllMockQuestions = (): Array<any> => {
  return questions;
};

export const getMockQuestionById = (id: number): object | undefined => {
  return questions.find((question) => question.id === id);
};

export const createMockQuestion = (
  subtopicId: number,
  newQuestion: any
): object => {
  const questionToSave = {
    id: questions.length + 1,
    subtopicId: subtopicId,
    ...newQuestion,
  };
  questions.push(questionToSave);
  return questionToSave;
};

export const updateMockQuestionById = (
  id: number,
  updatedQuestion: any
): object | null => {
  const index = questions.findIndex((question) => question.id === id);
  if (index !== -1) {
    questions[index] = { ...questions[index], ...updatedQuestion };
    return questions[index];
  }
  return null;
};

export const deleteMockQuestionById = (id: number): object | null => {
  const index = questions.findIndex((question) => question.id === id);
  if (index !== -1) {
    const deletedQuestion = questions.splice(index, 1)[0];
    return deletedQuestion;
  }
  return null;
};
