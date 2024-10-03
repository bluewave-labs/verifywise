import express from "express";
import {
  createNewUser,
  getAllUsers,
  getUserByEmail,
  getUserById,
} from "../controllers/user.ctrl";
const router = express.Router();

// GET requests
router.get("/", getAllUsers);
router.get("/by-email/:email", getUserByEmail);
router.get("/:id", getUserById);

// POST requests
router.post("/register", createNewUser);

export default router;
