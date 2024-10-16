/**
 * Express router for handling user-related routes.
 *
 * This router provides endpoints for creating, retrieving, updating, and deleting users,
 * as well as for user login and password reset functionalities.
 *
 * @module routes/user.route
 */

import express from "express";
const router = express.Router();
import {
  createNewUser,
  deleteUserById,
  getAllUsers,
  getUserByEmail,
  getUserById,
  loginUser,
  resetPassword,
  updateUserById,
} from "../controllers/user.ctrl";
import authenticateJWT from "../middleware/auth.middleware";

/**
 * GET /users
 *
 * Retrieves a list of all users.
 *
 * @name get/
 * @function
 * @memberof module:routes/user.route
 * @inner
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
router.get("/", authenticateJWT, getAllUsers);

/**
 * GET /users/by-email/:email
 *
 * Retrieves a user by their email address.
 *
 * @name get/by-email/:email
 * @function
 * @memberof module:routes/user.route
 * @inner
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
router.get("/by-email/:email", authenticateJWT, getUserByEmail);

/**
 * GET /users/:id
 *
 * Retrieves a user by their ID.
 *
 * @name get/:id
 * @function
 * @memberof module:routes/user.route
 * @inner
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
router.get("/:id", authenticateJWT, getUserById);

/**
 * POST /users/register
 *
 * Creates a new user.
 *
 * @name post/register
 * @function
 * @memberof module:routes/user.route
 * @inner
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
router.post("/register", createNewUser);

/**
 * POST /users/login
 *
 * Authenticates a user and returns a token.
 *
 * @name post/login
 * @function
 * @memberof module:routes/user.route
 * @inner
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
router.post("/login", loginUser);

/**
 * POST /users/reset-password
 *
 * Resets a user's password.
 *
 * @name post/reset-password
 * @function
 * @memberof module:routes/user.route
 * @inner
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
router.post("/reset-password", resetPassword);

/**
 * PATCH /users/:id
 *
 * Updates a user's information by their ID.
 *
 * @name patch/:id
 * @function
 * @memberof module:routes/user.route
 * @inner
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
router.patch("/:id", authenticateJWT, updateUserById);

/**
 * DELETE /users/:id
 *
 * Deletes a user by their ID.
 *
 * @name delete/:id
 * @function
 * @memberof module:routes/user.route
 * @inner
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
router.delete("/:id", authenticateJWT, deleteUserById);

export default router;
