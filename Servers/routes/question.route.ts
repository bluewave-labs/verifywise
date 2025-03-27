import express from "express";
const router = express.Router();

import {
  createQuestion,
  deleteQuestionById,
  getAllQuestions,
  getQuestionById,
  getQuestionsBySubtopicId,
  getQuestionsByTopicId,
  updateQuestionById,
} from "../controllers/question.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllQuestions);
router.get("/:id", authenticateJWT, getQuestionById);
router.get("/bysubtopic/:id", authenticateJWT, getQuestionsBySubtopicId);
router.get("/bytopic/:id", authenticateJWT, getQuestionsByTopicId);


// POST, PUT, DELETE requests
router.post("/", authenticateJWT, createQuestion);
router.patch("/:id", authenticateJWT, updateQuestionById);
router.delete("/:id", authenticateJWT, deleteQuestionById);

export default router;
