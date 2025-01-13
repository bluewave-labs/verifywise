/**
 * @file user.mock.db.ts
 * @description This file contains mock implementations of user-related database operations.
 * It provides functions to get, create, update, and delete mock users, as well as reset passwords.
 * These functions operate on an in-memory array of user objects, simulating a database for testing purposes.
 *
 * @module user.mock.db
 *
 * @function getAllMockUsers
 * @description Retrieves all mock users.
 * @returns {Array} An array of all mock user objects.
 *
 * @function getMockUserByEmail
 * @description Retrieves a mock user by their email address.
 * @param {string} email - The email address of the user to retrieve.
 * @returns {Object|undefined} The mock user object if found, otherwise undefined.
 *
 * @function getMockUserById
 * @description Retrieves a mock user by their ID.
 * @param {number} id - The ID of the user to retrieve.
 * @returns {Object|undefined} The mock user object if found, otherwise undefined.
 *
 * @function createMockUser
 * @description Creates a new mock user if the email and ID are unique.
 * @param {Object} user - The user object to create.
 * @returns {Object} The created mock user object.
 * @throws {Error} If a user with the same email or ID already exists.
 *
 * @function resetMockPassword
 * @description Resets the password for a mock user identified by their email address.
 * @param {string} email - The email address of the user whose password is to be reset.
 * @param {string} newPassword - The new password to set.
 * @returns {Object|undefined} The updated mock user object if found, otherwise undefined.
 *
 * @function updateMockUserById
 * @description Updates a mock user identified by their ID with new data.
 * @param {number} id - The ID of the user to update.
 * @param {Object} user - The new data to update the user with.
 * @returns {Object|null} The updated mock user object if found, otherwise null.
 *
 * @function deleteMockUserById
 * @description Deletes a mock user identified by their ID.
 * @param {number} id - The ID of the user to delete.
 * @returns {Object|null} The deleted mock user object if found, otherwise null.
 *
 * @function checkUserExists
 * @description Checks if any user exists in the mock database.
 * @returns {boolean} True if any user exists, otherwise false.
 */

import { getAllSubcontrolsQuery } from "../../utils/subControl.utils";
import { users } from "../users.data";
import { getAllMockAssessments } from "./assessment.mock.db";
import { getAllMockControls } from "./control.mock.db";
import { getAllMockControlCategories } from "./controlCategory.mock.db";
import { getAllMockProjects } from "./project.mock.db";
import { getAllMockQuestions } from "./question.mock.db";
import { getAllMockSubtopics } from "./subtopic.mock.db";
import { getAllMockTopics } from "./topic.mock.db";

export const getAllMockUsers = () => {
  return users;
};

export const getMockUserByEmail = (email: string) => {
  return users.find((user) => user.email === email);
};

export const getMockUserById = (id: number) => {
  return users.find((user) => user.id === id);
};

export const createMockUser = (user: any) => {
  const isEmailUnique = !users.some(
    (existingUser) => existingUser.email === user.email
  );
  const isIdUnique = !users.some((existingUser) => existingUser.id === user.id);

  if (isEmailUnique && isIdUnique) {
    users.push(user);
    return user;
  } else {
    throw new Error("User with this email or id already exists.");
  }
};

export const resetMockPassword = (email: string, newPassword: string) => {
  const user = users.find((user) => user.email === email);
  if (user) {
    user.password_hash = newPassword;
  }
  return user;
};

export const updateMockUserById = (id: number, user: any) => {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    users[index] = { ...users[index], ...user };
    return users[index];
  }
  return null;
};

export const deleteMockUserById = (id: number) => {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
  return null;
};

export const checkMockUserExists = (): boolean => {
  return users.length > 0;
};

export const getMockUserProjects = (userId: number) => {
  return getAllMockProjects().filter((project) => project.owner === userId);
};

export const getMockControlCategoriesForProject = (projectId: number) => {
  return getAllMockControlCategories().filter(
    (category) => category.project_id === projectId
  );
};

export const getMockControlForControlCategory = (controlCategoryId: number) => {
  return getAllMockControls().filter(
    (control) => control.controlGroup === controlCategoryId
  );
};

export const getMockSubControlForControl = async (controlId: number) => {
  const allSubcontrols = await getAllSubcontrolsQuery();
  return allSubcontrols.filter(
    (subcontrol) => subcontrol.controlId === controlId
  );
};

export const getMockAssessmentsForProject = (projectId: number) => {
  return getAllMockAssessments().filter(
    (assessment) => assessment.projectId === projectId
  );
};

export const getMockTopicsForAssessment = (assessmentId: number) => {
  return getAllMockTopics().filter(
    (topic) => topic.assessmentId === assessmentId
  );
};

export const getMockSubTopicsForTopic = (topicId: number) => {
  return getAllMockSubtopics().filter(
    (subtopic) => subtopic.topicId === topicId
  );
};

export const getMockQuestionsForSubTopic = (subtopicId: number) => {
  return getAllMockQuestions().filter(
    (question) => question.subtopicId === subtopicId
  );
};
