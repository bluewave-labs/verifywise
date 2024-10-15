import { questions } from "../questions/questions.data";

export const getAllMockQuestions = (): Array<any> => {
  return questions;
};

export const getMockQuestionById = (id: number): object | undefined => {
  return questions.find((question) => question.id === id);
};

export const createMockQuestion = (newQuestion: any): object => {
  questions.push(newQuestion);
  return newQuestion;
};

export const updateMockQuestionById = (id: number, updatedQuestion: any): object | null => {
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
