import express from "express";
const router = express.Router();

import {
  getTopicById,
  getAllTopics,
  createNewTopic,
  updateTopicById,
  deleteTopicById,
} from "../controllers/topic.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllTopics);
router.get("/:id", authenticateJWT, getTopicById);

// POST, PUT, DELETE requests
router.post("/", authenticateJWT, createNewTopic);
router.put("/:id", authenticateJWT, updateTopicById);
router.delete("/:id", authenticateJWT, deleteTopicById);

export default router;
