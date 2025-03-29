/**
 * @file user.utils.ts
 * @description This file contains utility functions for performing CRUD operations on the 'users' table in the database.
 *
 * The functions included are:
 * - `getAllUsersQuery`: Fetches all users from the database.
 * - `getUserByEmailQuery`: Fetches a user by their email address.
 * - `getUserByIdQuery`: Fetches a user by their ID.
 * - `createNewUserQuery`: Creates a new user in the database.
 * - `resetPasswordQuery`: Resets the password for a user identified by their email.
 * - `updateUserByIdQuery`: Updates user details by their ID.
 * - `deleteUserByIdQuery`: Deletes a user by their ID.
 *
 * Each function interacts with the database using SQL queries and returns the result.
 *
 * @module utils/user.utils
 */

import { User, UserModel } from "../models/user.model";
import { sequelize } from "../database/db";
import { QueryTypes } from "sequelize";
import { ProjectModel } from "../models/project.model";
import { VendorModel } from "../models/vendor.model";
import { ControlModel } from "../models/control.model";
import { SubcontrolModel } from "../models/subcontrol.model";
import { ProjectRiskModel } from "../models/projectRisk.model";
import { VendorRiskModel } from "../models/vendorRisk.model";
import { FileModel } from "../models/file.model";
import { ControlCategoryModel } from "../models/controlCategory.model";
import { AssessmentModel } from "../models/assessment.model";
import { TopicModel } from "../models/topic.model";
import { SubtopicModel } from "../models/subtopic.model";
import { QuestionModel } from "../models/question.model";

/**
 * Retrieves all users from the database.
 *
 * This function executes a SQL query to select all records from the `users` table.
 * It returns a promise that resolves to an array of `User` objects.
 *
 * @returns {Promise<User[]>} A promise that resolves to an array of `User` objects.
 *
 * @example
 * // Example usage:
 * getAllUsersQuery().then(users => {
 *   console.log(users);
 * }).catch(error => {
 *   console.error(error);
 * });
 *
 * @throws {Error} If there is an error executing the SQL query.
 */
export const getAllUsersQuery = async (): Promise<User[]> => {
  const users = await sequelize.query(
    "SELECT * FROM users ORDER BY created_at DESC, id ASC",
    {
      mapToModel: true,
      model: UserModel,
    }
  );
  return users;
};

/**
 * Retrieves a user from the database by their email address.
 *
 * @param {string} email - The email address of the user to retrieve.
 * @returns {Promise<User>} A promise that resolves to the user object.
 *
 * @example
 * const user = await getUserByEmailQuery('example@example.com');
 * console.log(user);
 *
 * @throws {Error} If there is an issue with the database query.
 */
export const getUserByEmailQuery = async (email: string): Promise<User> => {
  console.log("getUserByEmail");
  try {
    const user = await sequelize.query(
      "SELECT * FROM users WHERE email = :email",
      {
        replacements: { email },
        mapToModel: true,
        model: UserModel,
      }
    );
    return user[0];
  } catch (error) {
    console.error("Error getting user by email:", error);
    throw error;
  }
};

/**
 * Retrieves a user from the database by their unique identifier.
 *
 * @param {string} id - The unique identifier of the user.
 * @returns {Promise<User>} A promise that resolves to the user object.
 *
 * @throws {Error} If the query fails or the user is not found.
 *
 * @example
 * ```typescript
 * const userId = "12345";
 * getUserByIdQuery(userId)
 *   .then(user => {
 *     console.log(user);
 *   })
 *   .catch(error => {
 *     console.error(error);
 *   });
 * ```
 */
export const getUserByIdQuery = async (id: number): Promise<User> => {
  const user = await sequelize.query(
    "SELECT * FROM users WHERE id = :id",
    {
      replacements: { id },
      mapToModel: true,
      model: UserModel,
    }
  );
  return user[0];
};

/**
 * Creates a new user in the database.
 *
 * @param user - An object containing the user details, excluding the user ID.
 * @returns A promise that resolves to the newly created user object.
 *
 * @example
 * ```typescript
 * const newUser = await createNewUserQuery({
 *   name: "John Doe",
 *   email: "john.doe@example.com",
 *   password_hash: "hashed_password",
 *   role: "user",
 *   created_at: new Date(),
 *   last_login: new Date()
 * });
 * console.log(newUser);
 * ```
 *
 * @throws Will throw an error if the database query fails.
 */
export const createNewUserQuery = async (
  user: Omit<User, "id">
): Promise<User> => {
  const { name, surname, email, password_hash, role } = user;
  const created_at = new Date();
  const last_login = new Date();

  try {
    const result = await sequelize.query(
      `INSERT INTO users (name, surname, email, password_hash, role, created_at, last_login)
        VALUES (:name, :surname, :email, :password_hash, :role, :created_at, :last_login) RETURNING *`,
      {
        replacements: {
          name, surname, email, password_hash, role, created_at, last_login
        },
        mapToModel: true,
        model: UserModel,
        // type: QueryTypes.INSERT
      }
    );

    return result[0];
  } catch (error) {
    console.error("Error creating new user:", error);
    throw error;
  }
};

/**
 * Resets the password for a user identified by their email.
 *
 * @param email - The email address of the user whose password is to be reset.
 * @param newPassword - The new password to be set for the user.
 * @returns A promise that resolves to the updated user object.
 *
 * @throws Will throw an error if the database query fails.
 */
export const resetPasswordQuery = async (
  email: string,
  newPassword: string
): Promise<User> => {
  const result = await sequelize.query(
    `UPDATE users SET password_hash = :password_hash WHERE email = :email RETURNING *`,
    {
      replacements: {
        password_hash: newPassword,
        email
      },
      mapToModel: true,
      model: UserModel,
      // type: QueryTypes.UPDATE
    }
  );
  return result[0];
};

/**
 * Updates a user in the database by their ID.
 *
 * @param {string} id - The ID of the user to update.
 * @param {Partial<User>} user - An object containing the user properties to update.
 *                               Only the provided properties will be updated.
 * @returns {Promise<User>} A promise that resolves to the updated user object.
 *
 * @example
 * const updatedUser = await updateUserByIdQuery('123', {
 *   name: 'John Doe',
 *   email: 'john.doe@example.com',
 *   password_hash: 'newhashedpassword',
 *   role: 'admin',
 *   last_login: new Date()
 * });
 * console.log(updatedUser);
 */
export const updateUserByIdQuery = async (
  id: number,
  user: Partial<User>
): Promise<User> => {
  const updateUser: Partial<Record<keyof User, any>> = {};
  const setClause = [
    "name",
    "surname",
    "email",
    "role",
    "last_login",
  ].filter(f => {
    if (user[f as keyof User] !== undefined) {
      updateUser[f as keyof User] = user[f as keyof User]
      return true
    }
  }).map(f => `${f} = :${f}`).join(", ");

  const query = `UPDATE users SET ${setClause} WHERE id = :id RETURNING *;`;

  updateUser.id = id;

  const result = await sequelize.query(query, {
    replacements: updateUser,
    mapToModel: true,
    model: UserModel,
    // type: QueryTypes.UPDATE,
  });

  return result[0];
};

/**
 * Deletes a user from the database by their ID.
 *
 * This function executes a SQL DELETE query to remove a user from the 'users' table
 * based on the provided user ID. It returns the deleted user's data.
 *
 * @param {string} id - The unique identifier of the user to be deleted.
 * @returns {Promise<User>} A promise that resolves to the deleted user's data.
 *
 * @throws {Error} If the query fails or the user does not exist.
 */
export const deleteUserByIdQuery = async (id: number): Promise<Boolean> => {
  const usersFK = [
    { table: "projects", model: ProjectModel, fields: ["owner", "last_updated_by"] },
    { table: "vendors", model: VendorModel, fields: ["assignee", "reviewer"] },
    { table: "controls", model: ControlModel, fields: ["approver", "owner", "reviewer"] },
    { table: "subcontrols", model: SubcontrolModel, fields: ["approver", "owner", "reviewer"] },
    { table: "projectrisks", model: ProjectRiskModel, fields: ["risk_owner", "risk_approval"] },
    { table: "vendorrisks", model: VendorRiskModel, fields: ["action_owner"] },
    { table: "files", model: FileModel, fields: ["uploaded_by"] }
  ]

  for (let entry of usersFK) {
    await Promise.all(
      entry.fields.map(async f => {
        await sequelize.query(
          `UPDATE ${entry.table} SET ${f} = :x WHERE ${f} = :id`,
          {
            replacements: { x: null, id },
            // type: QueryTypes.UPDATE
          }
        )
      })
    );
  }

  await sequelize.query(
    `DELETE FROM projects_members WHERE user_id = :user_id`,
    {
      replacements: { user_id: id },
      type: QueryTypes.DELETE
    }
  );
  const result = await sequelize.query(
    "DELETE FROM users WHERE id = :id RETURNING *",
    {
      replacements: { id },
      mapToModel: true,
      model: UserModel,
      type: QueryTypes.DELETE
    }
  );
  return result.length > 0;
};

/**
 * Checks if any user exists in the database.
 *
 * This function executes a SQL query to count the number of users in the `users` table.
 * It returns a promise that resolves to a boolean indicating whether any user exists.
 *
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether any user exists.
 *
 * @example
 * const userExists = await checkUserExistsQuery();
 * console.log(userExists); // true or false
 *
 * @throws {Error} If there is an error executing the SQL query.
 */
export const checkUserExistsQuery = async (): Promise<boolean> => {
  try {
    const result = await sequelize.query<{ count: number }>(
      "SELECT COUNT(*) FROM users",
      {
        type: QueryTypes.SELECT
      }
    );
    return result[0].count > 0;
  } catch (error) {
    console.error("Error checking user existence:", error);
    throw error;
  }
};

export const getUserProjects = async (id: number) => {
  const result = await sequelize.query(
    "SELECT id FROM projects WHERE id = :id",
    {
      replacements: { id },
      mapToModel: true,
      model: ProjectModel
    }
  );
  return result;
};

export const getControlCategoriesForProject = async (id: number) => {
  const result = await sequelize.query(
    "SELECT id FROM controlcategories WHERE project_id = :project_id",
    {
      replacements: { project_id: id },
      mapToModel: true,
      model: ControlCategoryModel
    }
  );
  return result;
};

export const getControlForControlCategory = async (id: number) => {
  const result = await sequelize.query(
    "SELECT id FROM controls WHERE control_category_id = :control_category_id",
    {
      replacements: { control_category_id: id },
      mapToModel: true,
      model: ControlModel
    }
  );
  return result;
};

export const getSubControlForControl = async (id: number) => {
  const result = await sequelize.query(
    "SELECT * FROM subcontrols WHERE control_id = :control_id",
    {
      replacements: { control_id: id },
      mapToModel: true,
      model: SubcontrolModel
    }
  );
  return result;
};

export const getAssessmentsForProject = async (id: number) => {
  const result = await sequelize.query(
    "SELECT id FROM assessments WHERE project_id = :project_id",
    {
      replacements: { project_id: id },
      mapToModel: true,
      model: AssessmentModel
    }
  );
  return result;
};

export const getTopicsForAssessment = async (id: number) => {
  const result = await sequelize.query(
    "SELECT id FROM topics WHERE assessment_id = :assessment_id",
    {
      replacements: { assessment_id: id },
      mapToModel: true,
      model: TopicModel
    }
  );
  return result;
};

export const getSubTopicsForTopic = async (id: number) => {
  const result = await sequelize.query(
    "SELECT id FROM subtopics WHERE topic_id = :topic_id",
    {
      replacements: { topic_id: id },
      mapToModel: true,
      model: SubtopicModel
    }
  );
  return result;
};

export const getQuestionsForSubTopic = async (id: number) => {
  const result = await sequelize.query(
    "SELECT * FROM questions WHERE subtopic_id = :subtopic_id",
    {
      replacements: { subtopic_id: id },
      mapToModel: true,
      model: QuestionModel
    }
  );
  return result;
};
