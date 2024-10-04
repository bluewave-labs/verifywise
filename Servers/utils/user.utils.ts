import { User } from "../models/User";
import pool from "../database/db";

export const getAllUsersQuery = async (): Promise<User[]> => {
  console.log("getAllUsers");
  const users = await pool.query("SELECT * FROM users");
  return users.rows;
};

export const getUserByEmailQuery = async (email: string): Promise<User> => {
  console.log("getUserByEmail");
  const user = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  return user.rows[0];
};

export const getUserByIdQuery = async (id: string): Promise<User> => {
  console.log("getUserById");
  const user = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return user.rows[0];
};

export const createNewUserQuery = async (
  user: Omit<User, "id">
): Promise<User> => {
  const { name, email, password_hash, role, created_at, last_login } = user;
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, created_at, last_login)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [name, email, password_hash, role, created_at, last_login]
  );
  return result.rows[0];
};

export const resetPasswordQuery = async (
  email: string,
  newPassword: string
): Promise<User> => {
  const result = await pool.query(
    `UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING *`,
    [newPassword, email]
  );
  return result.rows[0];
};

export const updateUserByIdQuery = async (
  id: string,
  user: Partial<User>
): Promise<User> => {
  const { name, email, password_hash, role, last_login } = user;
  const result = await pool.query(
    `UPDATE users SET name = $1, email = $2, password_hash = $3, role = $4, last_login = $5
     WHERE id = $6 RETURNING *`,
    [name, email, password_hash, role, last_login, id]
  );
  return result.rows[0];
};

export const deleteUserByIdQuery = async (id: string): Promise<User> => {
  const result = await pool.query(
    "DELETE FROM users WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0];
};
