import express from "express";
const router = express.Router();

import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from "../controllers/task.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllTasks);
router.get("/:id", authenticateJWT, getTaskById);

// POST requests
router.post("/", authenticateJWT, createTask);

// PUT requests
router.put("/:id", authenticateJWT, updateTask);

// DELETE requests
router.delete("/:id", authenticateJWT, deleteTask);

export default router;