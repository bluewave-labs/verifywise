import { topics } from "../topic.mock.data";
import { Topic } from "../../models/topic.model";

export const getAllMockTopics = (): Array<any> => {
  return topics;
};

export const getMockTopicById = (id: number): object | undefined => {
  return topics.find((topic: Topic) => topic.id === id);
};

export const createMockTopic = (
  assessmentId: number,
  newTopic: any
): object => {
  const topicToSave = {
    id: topics.length + 1,
    assessmentId: assessmentId,
    title: newTopic,
  };
  topics.push(topicToSave);
  return topicToSave;
};

export const updateMockTopicById = (
  id: number,
  updatedTopic: any
): object | null => {
  const index = topics.findIndex((topic: Topic) => topic.id === id);
  if (index !== -1) {
    topics[index] = {
      ...topics[index],
      ...updatedTopic,
    };
    return topics[index];
  }
  return null;
};

export const deleteMockTopicById = (id: number): object | null => {
  const index = topics.findIndex((topic: Topic) => topic.id === id);
  if (index !== -1) {
    const deletedTopic = topics.splice(index, 1)[0];
    return deletedTopic;
  }
  return null;
};
