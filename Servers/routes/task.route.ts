import express from "express";
const router = express.Router();

import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  restoreTask,
  hardDeleteTask,
} from "../controllers/task.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllTasks);
router.get("/:id", authenticateJWT, getTaskById);

// POST requests
router.post("/", authenticateJWT, createTask);

// PUT requests
// Note: More specific routes must come before generic /:id routes
router.put("/:id/restore", authenticateJWT, restoreTask);
router.put("/:id", authenticateJWT, updateTask);

// DELETE requests
// Note: More specific routes must come before generic /:id routes
router.delete("/:id/hard", authenticateJWT, hardDeleteTask);
router.delete("/:id", authenticateJWT, deleteTask);

export default router;