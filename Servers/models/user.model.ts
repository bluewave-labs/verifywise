/**
 * Represents a user in the system.
 *
 * @type User
 *
 * @property {number} id - The unique identifier for the user.
 * @property {string} name - The name of the user.
 * @property {string} email - The email address of the user.
 * @property {string} password_hash - The hashed password of the user.
 * @property {number} role - The role of the user, represented as a number.
 * @property {Date} created_at - The date and time when the user was created.
 * @property {Date} last_login - The date and time when the user last logged in.
 */

export type User = {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: number;
  created_at: Date;
  last_login: Date;
};
