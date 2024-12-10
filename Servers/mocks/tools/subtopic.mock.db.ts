import { subtopics } from "../subtopic.mock.data";
import { Subtopic } from "../../models/subtopic.model";

export const getAllMockSubtopics = (): Array<any> => {
  return subtopics;
};

export const getMockSubtopicById = (id: number): object | undefined => {
  return subtopics.find((subtopic: Subtopic) => subtopic.id === id);
};

export const createMockSubtopic = (
  topicId: number,
  newSubtopic: any
): object => {
  const subtopicToSave = {
    id: subtopics.length + 1,
    topicId: topicId,
    name: newSubtopic,
  };
  subtopics.push(subtopicToSave);
  return subtopicToSave;
};

export const updateMockSubtopicById = (
  id: number,
  updatedSubtopic: any
): object | null => {
  const index = subtopics.findIndex((subtopic: Subtopic) => subtopic.id === id);
  if (index !== -1) {
    subtopics[index] = {
      ...subtopics[index],
      ...updatedSubtopic,
    };
    return subtopics[index];
  }
  return null;
};

export const deleteMockSubtopicById = (id: number): object | null => {
  const index = subtopics.findIndex((subtopic: Subtopic) => subtopic.id === id);
  if (index !== -1) {
    const deletedSubtopic = subtopics.splice(index, 1)[0];
    return deletedSubtopic;
  }
  return null;
};
