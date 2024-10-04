import express from "express";
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
const router = express.Router();

// GET requests
router.get("/", getAllUsers);
router.get("/by-email/:email", getUserByEmail);
router.get("/:id", getUserById);

// POST requests
router.post("/register", createNewUser);
router.post("login", loginUser);
router.post("/reset-password", resetPassword);

// PATCH request
router.patch("/:id", updateUserById);

// DELETE request
router.delete("/:id", deleteUserById);

export default router;
