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
