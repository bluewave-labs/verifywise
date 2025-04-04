import express from "express";
const router = express.Router();

import {
  getSubtopicById,
  getAllSubtopics,
  createNewSubtopic,
  updateSubtopicById,
  deleteSubtopicById,
  getSubtopicByTopicId,
} from "../controllers/subtopic.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllSubtopics);
router.get("/:id", authenticateJWT, getSubtopicById);
router.get("/bytopic/:id", authenticateJWT, getSubtopicByTopicId);

// POST, PUT, DELETE requests
router.post("/", authenticateJWT, createNewSubtopic);
router.put("/:id", authenticateJWT, updateSubtopicById);
router.delete("/:id", authenticateJWT, deleteSubtopicById);

export default router;
